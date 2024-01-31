#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/asset.hpp>
#include <eosio/crypto.hpp>
using namespace eosio;

class PoorMansRNG {
public:
    static uint32_t getRandomNumber(checksum256 _salt, checksum256 _seed, uint32_t min, uint32_t max){
        auto hashPair = std::make_pair(_salt, _seed);
        checksum256 seed = sha256((char *)&hashPair, sizeof(hashPair));
        uint32_t range = max - min;
        uint32_t result = ((uint32_t)seed.data()[0]) % range;
        return result + min;
    }
};

CONTRACT rambler : public contract {
    public:
        using contract::contract;

		const int64_t RAM_COST_PER_SEED = 312; // bytes it costs to store a seed

		TABLE RoundIndex {
			uint16_t index;
		};

		TABLE Round {
			time_point_sec  start_date;
			uint64_t        times_played;
			int64_t         ram_released;
			uint64_t        total_points;
			uint64_t        tickets_used;
			time_point_sec  proof_date;
			checksum256     raw_salt;
			uint32_t 	    seed_phase_duration;
			uint32_t 	    redeem_phase_duration;
		};

		TABLE Participant {
			name        account;
			uint64_t    tickets;
			uint64_t    tickets_used;
			uint64_t    points;
			uint8_t     claimed;

			uint64_t primary_key() const {
				return account.value;
			}
		};

		TABLE Seed {
			uint64_t        id;
			checksum256     seed;

			uint64_t primary_key() const {
				return id;
			}

			checksum256 by_seed() const {
				return seed;
			}
		};

		TABLE SeedIndex {
			uint64_t index;
		};

		// scope is self
        using round_index = singleton<"roundindex"_n, RoundIndex>; // max: 65535
        // scope is round for all below
        using round_table = eosio::singleton<"round"_n, Round>;
        using participants_table = eosio::multi_index<"participants"_n, Participant>;
        using seed_table = eosio::multi_index<"seeds"_n, Seed,
            indexed_by<"byseed"_n, const_mem_fun<Seed, checksum256, &Seed::by_seed>>
        >;
        using seed_index = eosio::singleton<"seedindex"_n, SeedIndex>;

        // eosio.token
        TABLE account {
            asset    balance;
            uint64_t primary_key()const { return balance.symbol.code().raw(); }
        };

        typedef eosio::multi_index< "accounts"_n, account > accounts;
        // end eosio.token ------------------

        asset getTokenBalance(){
            accounts accountsTable("eosio.token"_n, get_self().value);
            auto it = accountsTable.find(symbol_code("EOS").raw());
            check(it != accountsTable.end(), "Account not found for balance fetch");
            return it->balance;
        }

        ACTION startround( uint16_t round, checksum256 salt_proof, uint32_t seed_phase_duration, uint32_t redeem_phase_duration ){
            require_auth(get_self());

            // check if round already exists
            auto roundIndexTable = round_index(get_self(), 0);
            if(roundIndexTable.exists()){
                auto currentRoundIndex = roundIndexTable.get();
                check(currentRoundIndex.index < round, "Round already exists");
            }

            // check if round before exists, or is 0
            if(round > 1){
                auto previousRoundTable = round_table(get_self(), round - 1);
                check(previousRoundTable.exists(), "Previous round does not exist");
                auto previousRound = previousRoundTable.get();

                check(
                    current_time_point().sec_since_epoch() - previousRound.start_date.sec_since_epoch()
                    > previousRound.seed_phase_duration,
                    "Previous round is not over"
                );
            } else {
                check(round == 1, "Round must be 1");
            }

            auto currentRoundIndex = roundIndexTable.get_or_create(get_self(), RoundIndex{0});
            currentRoundIndex.index++;
            roundIndexTable.set(currentRoundIndex, get_self());

            auto currentRoundTable = round_table(get_self(), round);
            currentRoundTable.set(Round{
                .start_date = time_point_sec(current_time_point().sec_since_epoch()),
                .ram_released = 0,
                .times_played = 0,
                .total_points = 0,
                .tickets_used = 0,
                .seed_phase_duration = seed_phase_duration,
                .redeem_phase_duration = redeem_phase_duration,
            }, get_self());

			auto seedIndexTable = seed_index(get_self(), round);
			seedIndexTable.set(SeedIndex{1}, get_self());

            // creating the table so that other seeders don't pay for it
			auto participantsTable = participants_table(get_self(), round);
			participantsTable.emplace(get_self(), [&](auto& row) {
                row.account = get_self();
                row.tickets = 0;
                row.tickets_used = 0;
                row.points = 0;
                row.claimed = 0;
            });

            // creating the table so that other seeders don't pay for it
			auto seedTable = seed_table(get_self(), round);
			seedTable.emplace(get_self(), [&](auto& row) {
                row.id = 0;
                row.seed = salt_proof;
            });
        }

		[[eosio::action, eosio::readonly]]
		uint32_t seedtime(uint16_t round){
			auto currentRoundTable = round_table(get_self(), round);
			auto currentRound = currentRoundTable.get();

			return currentRound.seed_phase_duration - (current_time_point().sec_since_epoch() - currentRound.start_date.sec_since_epoch());
		}

		[[eosio::action, eosio::readonly]]
		uint32_t redeemtime(uint16_t round){
			auto currentRoundTable = round_table(get_self(), round);
			auto currentRound = currentRoundTable.get();

			return currentRound.redeem_phase_duration - (current_time_point().sec_since_epoch() - currentRound.start_date.sec_since_epoch());
		}

		ACTION seed( name account, checksum256 seed ){
			require_auth(account);


			auto roundIndexTable = round_index(get_self(), 0);
			check(roundIndexTable.exists(), "No active round");
			auto currentRoundIndex = roundIndexTable.get();

			auto currentRoundTable = round_table(get_self(), currentRoundIndex.index);
			auto currentRound = currentRoundTable.get();

			check(
				current_time_point().sec_since_epoch() - currentRound.start_date.sec_since_epoch()
				< currentRound.seed_phase_duration,
				"Seed phase is over"
			);

			auto seedTable = seed_table(get_self(), currentRoundIndex.index);
			auto seedIndexTable = seed_index(get_self(), currentRoundIndex.index);

			// check that by_seed is unique
			auto bySeedIndex = seedTable.get_index<"byseed"_n>();
			auto seedBySeed = bySeedIndex.find(seed);
			check(seedBySeed == bySeedIndex.end(), "Seed already used");


			auto seedIndex = seedIndexTable.get();

			seedTable.emplace(get_self(), [&](auto& row) {
				row.id = seedIndex.index;
				row.seed = seed;
			});

			seedIndex.index++;
			seedIndexTable.set(seedIndex, same_payer);

			auto participantsTable = participants_table(get_self(), currentRoundIndex.index);
			auto participant = participantsTable.find(account.value);

			if(participant == participantsTable.end()){
			    // Participant RAM can never be reclaimed; consider this a per-round one-time entrance fee
				participantsTable.emplace(account, [&](auto& row) {
					row.account = account;
					row.tickets = 1;
					row.tickets_used = 0;
					row.points = 0;
                    row.claimed = 0;
				});
			} else {
				participantsTable.modify(participant, same_payer, [&](auto& row) {
					row.tickets++;
				});
			}

			currentRound.times_played++;
			currentRoundTable.set(currentRound, same_payer);
		}

		ACTION sendproof(checksum256 raw_salt, uint16_t round){
            auto roundTable = round_table(get_self(), round);
            check(roundTable.exists(), "Round does not exist");
            auto currentRound = roundTable.get();

		    auto seedTable = seed_table(get_self(), round);
		    auto proof = seedTable.find(0);
		    check(proof != seedTable.end(), "No seed");

            auto hashedProof = sha256((char *)raw_salt.extract_as_byte_array().data(), raw_salt.extract_as_byte_array().size());
            check(hashedProof == proof->seed, "Proof does not match");

            // make sure seed phase is over
            check(
                current_time_point().sec_since_epoch() - currentRound.start_date.sec_since_epoch()
                > currentRound.seed_phase_duration,
                "Seed phase is not over"
            );

            currentRound.raw_salt = raw_salt;
            currentRound.proof_date = time_point_sec(current_time_point().sec_since_epoch());
            roundTable.set(currentRound, same_payer);
		}

		ACTION useticket( name account, uint16_t round ){
            require_auth(account);

            auto currentRoundTable = round_table(get_self(), round);
            check(currentRoundTable.exists(), "Round does not exist");
            auto currentRound = currentRoundTable.get();

            check(
                current_time_point().sec_since_epoch() - currentRound.start_date.sec_since_epoch()
                > currentRound.seed_phase_duration,
                "Seed phase is not over"
            );

            check(currentRound.raw_salt != checksum256(), "No proof");

            check(
                current_time_point().sec_since_epoch() - currentRound.proof_date.sec_since_epoch()
                < currentRound.redeem_phase_duration,
                "Redeem phase is over"
            );

            auto participantsTable = participants_table(get_self(), round);
            auto participant = participantsTable.find(account.value);

            check(participant != participantsTable.end(), "Account not found");
            check(participant->tickets > 0, "No tickets to redeem");

            uint64_t nextSeedIndex = currentRound.tickets_used + 1 /* 1st seed is the proof */;

            auto seedTable = seed_table(get_self(), round);
            auto seed = seedTable.find(nextSeedIndex);
            check(seed != seedTable.end(), "No next seed");

            auto newPoints = PoorMansRNG::getRandomNumber(currentRound.raw_salt, seed->seed, 1, 10000);

            // reclaiming RAM
            seedTable.erase(seed);

            participantsTable.modify(participant, same_payer, [&](auto& row) {
                row.tickets--;
                row.tickets_used++;
                row.points += newPoints;
            });

            currentRound.total_points += newPoints;
            currentRound.tickets_used++;
            currentRound.ram_released += RAM_COST_PER_SEED;
            currentRoundTable.set(currentRound, same_payer);
        }

        ACTION claimreward( name account, uint16_t round ){
            require_auth(account);

            auto currentRoundTable = round_table(get_self(), round);
            check(currentRoundTable.exists(), "Round does not exist");
            auto currentRound = currentRoundTable.get();

            check(
                current_time_point().sec_since_epoch() - currentRound.start_date.sec_since_epoch()
                > currentRound.seed_phase_duration,
                "Redeem phase is not over"
            );

            auto participantsTable = participants_table(get_self(), round);
            auto participant = participantsTable.find(account.value);
            check(participant != participantsTable.end(), "Account not found");
            check(participant->points > 0, "No points to redeem");
            check(participant->claimed == 0, "Already claimed");

            auto total_ram = currentRound.ram_released;
            auto points = participant->points;
            auto total_points = currentRound.total_points;
            int64_t reward = (total_ram * points) / total_points;
            print("reward: ", reward, "\n");

            auto balanceBefore = getTokenBalance();

            participantsTable.modify(participant, same_payer, [&](auto& row) {
                row.claimed = 1;
            });

            action(
                permission_level{ get_self(), "active"_n },
                "eosio"_n,
                "sellram"_n,
                std::make_tuple(get_self(), reward)
            ).send();

            action(
                permission_level{ get_self(), "active"_n },
                get_self(),
                "aftersale"_n,
                std::make_tuple(account, balanceBefore)
            ).send();
        }

        [[eosio::action]] asset aftersale( name account, asset balance_before ){
            require_auth(get_self());

            auto balanceAfter = getTokenBalance();
            auto balanceDiff = balanceAfter - balance_before;

            check(balanceDiff.amount > 0, "No balance diff");

            // send balanceDiff to account
            action(
                permission_level{ get_self(), "active"_n },
                "eosio.token"_n,
                "transfer"_n,
                std::make_tuple(get_self(), account, balanceDiff, std::string("RamValley Reward"))
            ).send();

            return balanceDiff;
        }
};

