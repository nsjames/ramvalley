import { SessionKit, Chains } from "@wharfkit/session"
import { WebRenderer } from "@wharfkit/web-renderer"
import { WalletPluginAnchor } from "@wharfkit/wallet-plugin-anchor"
import {TransactPluginAutoCorrect} from '@wharfkit/transact-plugin-autocorrect'
import {TransactPluginResourceProvider} from '@wharfkit/transact-plugin-resource-provider'

import { Contract } from "@wharfkit/contract";
import { APIClient } from "@wharfkit/antelope";
import {currentRound, loaded, roundData, totalRounds, user, userData, working} from "../store/stores";
import {getGameAccount, getGameNetwork, randomString, sha256} from "./utils.service";

const contractName = getGameAccount();
const chain = Chains[getGameNetwork()];

export default class ChainService {
    public static sessionKit: SessionKit|null = null;
    public static session: any = null;
    public static contract: any = null;

    public static async setup(){
        if(this.sessionKit) return;

        this.sessionKit = new SessionKit({
            appName: "RamValley",
            chains: [ chain ],
            ui: new WebRenderer(),
            walletPlugins: [new WalletPluginAnchor()],
        }, {
            transactPlugins: [
                new TransactPluginResourceProvider(),
                new TransactPluginAutoCorrect(),
            ]
        })

        this.contract = new Contract({
            abi,
            account: contractName,
            client: new APIClient(chain),
        })

        const sessions = await this.sessionKit.restoreAll();
        user.set(sessions.length ? sessions[0].actor : null);
        if(sessions.length){
            this.session = sessions[0];
        }
    }

    public static async login(){
        await this.setup();
        const { session } = await this.sessionKit.login()
        this.session = session;
        user.set(session ? session.actor : null);

        if(session) await this.getGameData();
    }

    public static async logout(){
        await this.setup();
        await this.sessionKit.logout()
        this.session = null;
        user.set(null);
    }

    static async getGameData(round:null|number = null){
        await this.setup();
        const roundindex = await this.contract.table('roundindex').get(null, {scope:0}).then(x => {
            return parseInt(x.index.toString());
        }).catch(err => {
            console.error(err)
            return null;
        });

        if(!roundindex) {
            loaded.set(true);
            return null;
        }

        if(!round) round = roundindex;

        const data = await this.contract.table('round').get(null, {scope:round}).then(x => {
            return x;
        }).catch(err => {
            console.error(err)
            return null;
        });

        const user = this.session ? await this.contract.table('participants').get(this.session.actor, {scope:round}).then(x => {
            return x;
        }).catch(err => {
            console.error(err)
            return null;
        }) : null;

        totalRounds.set(roundindex);
        currentRound.set(round);
        roundData.set(JSON.parse(JSON.stringify(data)));
        userData.set(user ? JSON.parse(JSON.stringify(user)) : null);
        loaded.set(true);

        return true;
    }

    static async refresh(){
        await this.setup();
        await this.getGameData();
    }

    static async sendSeeds(){
        return this.workingWrapper(async () => {
            await this.setup();
            const randomHash = await sha256(randomString(32));
            return await this.session.transact({
                actions: [
                    {
                        account: 'eosio',
                        name: 'buyrambytes',
                        authorization: [this.session.permissionLevel],
                        data: {
                            payer: this.session.actor,
                            receiver: contractName,
                            bytes: 312
                        }
                    },
                    {
                        account: contractName,
                        name: 'seed',
                        authorization: [this.session.permissionLevel],
                        data: {
                            account: this.session.actor,
                            seed: randomHash
                        }
                    }
                ]
            }).then(async x => {
                console.log(x);
                await new Promise(r => {
                    setTimeout(r, 1000);
                })
                await this.getGameData();
                return true;
            }).catch(err => {
                console.error(err)
                return null;
            });
        })
    }

    static async useTicket(round){
        return this.workingWrapper(async () => {
            await this.setup();
            const randomHash = await sha256(randomString(32));
            return await this.session.transact({
                actions: [
                    {
                        account: contractName,
                        name: 'useticket',
                        authorization: [this.session.permissionLevel],
                        data: {
                            account: this.session.actor,
                            round
                        }
                    }
                ]
            }).then(async x => {
                console.log(x);
                await new Promise(r => {
                    setTimeout(r, 1000);
                })
                await this.getGameData();
                return true;
            }).catch(err => {
                console.error(err)
                return null;
            });
        })
    }

    static async claimReward(round){
        return this.workingWrapper(async () => {
            await this.setup();
            const randomHash = await sha256(randomString(32));
            return await this.session.transact({
                actions: [
                    {
                        account: contractName,
                        name: 'claimreward',
                        authorization: [this.session.permissionLevel],
                        data: {
                            account: this.session.actor,
                            round
                        }
                    }
                ]
            }).then(async x => {
                console.log(x);

                const transfer = x.response.processed.action_traces.find(t => {
                    return t.act.data.memo === "RamValley Reward";
                });

                console.log('transfer', transfer);

                await new Promise(r => {
                    setTimeout(r, 1000);
                })
                await this.getGameData();
                return transfer.act.data.quantity || '0.0000 EOS';
            }).catch(err => {
                console.error(err)
                return null;
            });
        })
    }

    static async startRound(round, proof, duration){
        await this.setup();
        return await this.session.transact({
            actions: [
                {
                    account: contractName,
                    name: 'startround',
                    authorization: [this.session.permissionLevel],
                    data: {
                        round,
                        salt_proof: proof,
                        seed_phase_duration: duration,
                        redeem_phase_duration: duration,
                    }
                },
                {
                    account: 'eosio',
                    name: 'buyrambytes',
                    authorization: [this.session.permissionLevel],
                    data: {
                        payer: this.session.actor,
                        receiver: contractName,
                        bytes: 2000
                    }
                }
            ]
        }).then(async x => {
            console.log(x);
            await new Promise(r => {
                setTimeout(r, 1000);
            })
            await this.getGameData();
            return true;
        }).catch(err => {
            console.error(err)
            return null;
        });
    }

    static async sendProof(round, proof){
        await this.setup();
        return await this.session.transact({
            actions: [
                {
                    account: contractName,
                    name: 'sendproof',
                    authorization: [this.session.permissionLevel],
                    data: {
                        raw_salt: proof,
                        round
                    }
                }]
        }).then(async x => {
            console.log(x);
            await new Promise(r => {
                setTimeout(r, 1000);
            })
            await this.getGameData();
            return true;
        }).catch(err => {
            console.error(err)
            return null;
        });
    }

    public static workingWrapper(promiseFunc){
        working.set(true);

        const promise = promiseFunc();

        return new Promise((resolve, reject) => {
            promise.then(x => {
                working.set(false);
                resolve(x);
            }).catch(err => {
                working.set(false);
                reject(err);
            })
        });
    }
}


const abi = {
    "____comment": "This file was generated with eosio-abigen. DO NOT EDIT ",
    "version": "eosio::abi/1.2",
    "types": [],
    "structs": [
        {
            "name": "Participant",
            "base": "",
            "fields": [
                {
                    "name": "account",
                    "type": "name"
                },
                {
                    "name": "tickets",
                    "type": "uint64"
                },
                {
                    "name": "tickets_used",
                    "type": "uint64"
                },
                {
                    "name": "points",
                    "type": "uint64"
                },
                {
                    "name": "claimed",
                    "type": "uint8"
                }
            ]
        },
        {
            "name": "Round",
            "base": "",
            "fields": [
                {
                    "name": "start_date",
                    "type": "time_point_sec"
                },
                {
                    "name": "times_played",
                    "type": "uint64"
                },
                {
                    "name": "ram_released",
                    "type": "int64"
                },
                {
                    "name": "total_points",
                    "type": "uint64"
                },
                {
                    "name": "tickets_used",
                    "type": "uint64"
                },
                {
                    "name": "proof_date",
                    "type": "time_point_sec"
                },
                {
                    "name": "raw_salt",
                    "type": "checksum256"
                },
                {
                    "name": "seed_phase_duration",
                    "type": "uint32"
                },
                {
                    "name": "redeem_phase_duration",
                    "type": "uint32"
                }
            ]
        },
        {
            "name": "RoundIndex",
            "base": "",
            "fields": [
                {
                    "name": "index",
                    "type": "uint16"
                }
            ]
        },
        {
            "name": "Seed",
            "base": "",
            "fields": [
                {
                    "name": "id",
                    "type": "uint64"
                },
                {
                    "name": "seed",
                    "type": "checksum256"
                }
            ]
        },
        {
            "name": "SeedIndex",
            "base": "",
            "fields": [
                {
                    "name": "index",
                    "type": "uint64"
                }
            ]
        },
        {
            "name": "account",
            "base": "",
            "fields": [
                {
                    "name": "balance",
                    "type": "asset"
                }
            ]
        },
        {
            "name": "aftersale",
            "base": "",
            "fields": [
                {
                    "name": "account",
                    "type": "name"
                },
                {
                    "name": "balance_before",
                    "type": "asset"
                }
            ]
        },
        {
            "name": "claimreward",
            "base": "",
            "fields": [
                {
                    "name": "account",
                    "type": "name"
                },
                {
                    "name": "round",
                    "type": "uint16"
                }
            ]
        },
        {
            "name": "redeemtime",
            "base": "",
            "fields": [
                {
                    "name": "round",
                    "type": "uint16"
                }
            ]
        },
        {
            "name": "seed",
            "base": "",
            "fields": [
                {
                    "name": "account",
                    "type": "name"
                },
                {
                    "name": "seed",
                    "type": "checksum256"
                }
            ]
        },
        {
            "name": "seedtime",
            "base": "",
            "fields": [
                {
                    "name": "round",
                    "type": "uint16"
                }
            ]
        },
        {
            "name": "sendproof",
            "base": "",
            "fields": [
                {
                    "name": "raw_salt",
                    "type": "checksum256"
                },
                {
                    "name": "round",
                    "type": "uint16"
                }
            ]
        },
        {
            "name": "startround",
            "base": "",
            "fields": [
                {
                    "name": "round",
                    "type": "uint16"
                },
                {
                    "name": "salt_proof",
                    "type": "checksum256"
                },
                {
                    "name": "seed_phase_duration",
                    "type": "uint32"
                },
                {
                    "name": "redeem_phase_duration",
                    "type": "uint32"
                }
            ]
        },
        {
            "name": "useticket",
            "base": "",
            "fields": [
                {
                    "name": "account",
                    "type": "name"
                },
                {
                    "name": "round",
                    "type": "uint16"
                }
            ]
        }
    ],
    "actions": [
        {
            "name": "aftersale",
            "type": "aftersale",
            "ricardian_contract": ""
        },
        {
            "name": "claimreward",
            "type": "claimreward",
            "ricardian_contract": ""
        },
        {
            "name": "redeemtime",
            "type": "redeemtime",
            "ricardian_contract": ""
        },
        {
            "name": "seed",
            "type": "seed",
            "ricardian_contract": ""
        },
        {
            "name": "seedtime",
            "type": "seedtime",
            "ricardian_contract": ""
        },
        {
            "name": "sendproof",
            "type": "sendproof",
            "ricardian_contract": ""
        },
        {
            "name": "startround",
            "type": "startround",
            "ricardian_contract": ""
        },
        {
            "name": "useticket",
            "type": "useticket",
            "ricardian_contract": ""
        }
    ],
    "tables": [
        {
            "name": "accounts",
            "type": "account",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        },
        {
            "name": "participants",
            "type": "Participant",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        },
        {
            "name": "round",
            "type": "Round",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        },
        {
            "name": "roundindex",
            "type": "RoundIndex",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        },
        {
            "name": "seedindex",
            "type": "SeedIndex",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        },
        {
            "name": "seeds",
            "type": "Seed",
            "index_type": "i64",
            "key_names": [],
            "key_types": []
        }
    ],
    "ricardian_clauses": [],
    "variants": [],
    "action_results": [
        {
            "name": "redeemtime",
            "result_type": "uint32"
        },
        {
            "name": "seedtime",
            "result_type": "uint32"
        }
    ]
}
