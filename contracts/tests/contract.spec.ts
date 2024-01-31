const { Blockchain, nameToBigInt, expectToThrow, symbolCodeToBigInt } = require("@proton/vert");
const { TimePoint, Asset } = require("@greymass/eosio");
const { assert } = require("chai");
const crypto = require('crypto')
const blockchain = new Blockchain()

const startingTime = Date.now()
let proofTime;
blockchain.setTime(TimePoint.fromMilliseconds(startingTime));
blockchain.enableStorageDeltas();

const eosioContract = blockchain.createContract('eosio', 'helper-contracts/ram')
const tokenContract = blockchain.createContract('eosio.token', 'helper-contracts/eosio.token')

const [starter, usera, userb] = blockchain.createAccounts('starter', 'usera', 'userb')

const randomHash = () => {
    // sha256
    const randomNumber = Math.random().toString()
    const hash = crypto.createHash('sha256')
    hash.update(randomNumber)
    return hash.digest('hex')
}

// Load contract (use paths relative to the root of the project)
const contract = blockchain.createContract('contract', 'build/contract')


/* Runs before each test */
beforeEach(async () => {
    // blockchain.resetTables()
})

const getRoundIndex = () => {
    return contract.tables.roundindex(BigInt(0)).getTableRows(BigInt(0))[0]?.index
}

const getRound = (index) => {
    return contract.tables.round(BigInt(index)).getTableRows(BigInt(0))[0]
}

const getSeedIndex = (index) => {
    return contract.tables.seedindex(BigInt(index)).getTableRows(BigInt(0))[0]?.index
}

const getSeeds = (index) => {
    return contract.tables.seeds(BigInt(index)).getTableRows(BigInt(0))
}

const getParticipants = (index) => {
    return contract.tables.participants(BigInt(index)).getTableRows(BigInt(0))
}

const getAccountBalance = (account) => {
    const symbolCode = BigInt(5459781)
    // blockchain.printStorageDeltas();
    return tokenContract.tables.accounts(nameToBigInt(account)).getTableRows(symbolCode)
}

const proof = crypto.createHash('sha256').update('test').digest();
const proofHash = crypto.createHash('sha256').update(Buffer.from(proof.toString('hex'), 'hex')).digest('hex');

/* Tests */
describe('Rambler Testing Suite', () => {
    it('should set up the system and token contracts', async () => {
        await tokenContract.actions.create(['eosio', '1000000000.0000 EOS']).send('eosio.token@active')
        await tokenContract.actions.issue(['eosio', '1000000000.0000 EOS', 'memo']).send('eosio@active')
        // open balance for each account
        await tokenContract.actions.open(['contract', '4,EOS', 'eosio']).send('eosio@active')
        await tokenContract.actions.open(['starter', '4,EOS', 'eosio']).send('eosio@active')
        await tokenContract.actions.open(['usera', '4,EOS', 'eosio']).send('eosio@active')
        await tokenContract.actions.open(['userb', '4,EOS', 'eosio']).send('eosio@active')
        // send EOS to each account
        await tokenContract.actions.transfer(['eosio', 'starter', '1000.0000 EOS', 'memo']).send('eosio@active')
        await tokenContract.actions.transfer(['eosio', 'usera', '1000.0000 EOS', 'memo']).send('eosio@active')
        await tokenContract.actions.transfer(['eosio', 'userb', '1000.0000 EOS', 'memo']).send('eosio@active')
    });
    it('should be able to create a new game round', async () => {
        assert(getRoundIndex() === undefined, "Round index should be undefined");
        assert(getRound(1) === undefined, "Round should be undefined");
        assert(getSeedIndex(1) === undefined, "Seed index should be undefined");
        assert(!getSeeds(1).length, "Seeds should be empty")
        assert(!getParticipants(1).length, "Participants should be empty")

        await expectToThrow(
            contract.actions.seed(['usera', randomHash()]).send('usera@active'),
            "eosio_assert: No active round"
        );

        await contract.actions.startround([1, proofHash, 86400, 86400*3]).send('contract@active')
        assert(getRoundIndex() === 1, "Round index should be 1");
        assert(getSeeds(1).length === 1, "Seeds should have 1 entry")
        assert(getParticipants(1).length === 1, "Participants should have 1 entry")
    });
    it('should be able to seed the contract (25 times with multiple users)', async () => {

        await contract.actions.seed(['usera', randomHash()]).send('usera@active')

        assert(getRoundIndex() === 1, "Round index should be 1");
        assert(!!getRound(1), "Round should exist now");
        const startDate = new Date(getRound(1).start_date);
        // will be wrong periodically, but better than nothing
        const startingMinute = Math.floor(startDate.getTime() / 1000 / 60);
        assert(startingMinute === Math.floor(startingTime / 1000 / 60), "Round start date should be the same as the blockchain time");
        assert(getSeedIndex(1) === 2, "Seed index should be 1");
        assert(getSeeds(1).length === 2, "Seeds should have 2 entries")
        assert(getParticipants(1).length === 2, "Participants should have 2 entries")
        assert(getParticipants(1)[1].account === 'usera', "Participants should have usera")
        assert(getParticipants(1)[1].tickets === 1, "usera should have 1 ticket")
        assert(getParticipants(1)[1].points === 0, "usera should have 0 points")

        await contract.actions.seed(['usera', randomHash()]).send('usera@active')
        assert(getSeedIndex(1) === 3, "Seed index should be 2");
        assert(getSeeds(1).length === 3, "Seeds should have 3 entries")
        assert(getParticipants(1).length === 2, "Participants should have 2 entries")
        assert(getParticipants(1)[1].tickets === 2, "usera should have 2 tickets")

        await contract.actions.seed(['userb', randomHash()]).send('userb@active')
        assert(getParticipants(1).length === 3, "Participants should have 3 entries")
        assert(getRoundIndex() === 1, "Round index should be 1");


        for (let i = 0; i < 20; i++) {
            await contract.actions.seed(['usera', randomHash()]).send('usera@active')
        }
        assert(getParticipants(1)[1].tickets === 22, "usera should have 22 tickets")
        assert(getSeeds(1).length === 24, "Seeds should have 24 entries")

        const sameHash = randomHash();
        await contract.actions.seed(['usera', sameHash]).send('usera@active')
        assert(getParticipants(1)[1].tickets === 23, "usera should have 23 tickets")
        await expectToThrow(
            contract.actions.seed(['usera', sameHash]).send('usera@active'),
            "eosio_assert: Seed already used"
        );

        await contract.actions.seed(['userb', randomHash()]).send('userb@active')
    });

    it('should be able to finish a seeding round with time elapsed', async () => {
        blockchain.setTime(TimePoint.fromMilliseconds(startingTime + (1000 * 60 * 60 * 11) + (1000 * 60 * 59)));
        await contract.actions.seed(['usera', randomHash()]).send('usera@active')

        // set time to 24 hours after start time
        blockchain.setTime(TimePoint.fromMilliseconds((startingTime + (1000 * 60 * 60 * 24)) + 1000));
        await expectToThrow(
            contract.actions.seed(['usera', randomHash()]).send('usera@active'),
            "eosio_assert: Seed phase is over"
        );
    });

    it('should be able to use tickets gained from seeding (25 times)', async () => {
        await expectToThrow(
            contract.actions.useticket(['usera', 1]).send('usera@active'),
            "eosio_assert: No proof"
        );

        await expectToThrow(
            contract.actions.sendproof([proofHash, 1]).send('usera@active'),
            "eosio_assert: Proof does not match"
        );

        await contract.actions.sendproof([proof, 1]).send('usera@active')
        proofTime = Date.now()

        assert(getParticipants(1)[1].tickets === 24, "usera should have 24 tickets")
        await contract.actions.useticket(['usera', 1]).send('usera@active')
        assert(getParticipants(1)[1].tickets === 23, "usera should have 23 tickets")

        assert(getRound(1).tickets_used == 1, "Round should have 1 used tickets")
        for (let i = 0; i < 23; i++) {
            await contract.actions.useticket(['usera', 1]).send('usera@active')
        }
        for (let i = 0; i < 2; i++) {
            await contract.actions.useticket(['userb', 1]).send('userb@active')
        }
        assert(getRound(1).tickets_used == 26, "Round should have 25 used tickets")
    });

    it('should be able to claim rewards in EOS from selling RAM', async () => {

        console.log('')
        console.log('')
        console.log('Balances before claiming: ');
        ['usera', 'userb', 'contract'].map(account => {
            console.log(account, getAccountBalance(account))
        });
        // set time to 24 hours after start time
        blockchain.setTime(TimePoint.fromMilliseconds((proofTime + (1000 * 60 * 60 * 24 * 3)) + 1000));

        await contract.actions.claimreward(['usera', 1]).send('usera@active')
        // console.log(contract.bc.console)
        await contract.actions.claimreward(['userb', 1]).send('userb@active')
        // console.log(contract.bc.console)
        assert(
            getParticipants(1)[1].points + getParticipants(1)[2].points
            ===
            getRound(1).total_points,
            "Total points should equal sum of points"
        )

        assert(
            getRound(1).ram_released === getRound(1).tickets_used * 312 /* RAM bytes required per seed row */,
            "RAM released should equal tickets used times 312"
        )

        console.log('\r\n--------------------\r\n');

        console.log('Paid out all rewards')
        console.log(getRound(1))
        console.log(getParticipants(1)[1])
        console.log(getParticipants(1)[2])

        console.log('\r\n--------------------\r\n');

        console.log('Balances after: ');
            ['usera', 'userb', 'contract'].map(account => {
            console.log(account, getAccountBalance(account))
        });
        console.log('')
        console.log('')

    });
});
