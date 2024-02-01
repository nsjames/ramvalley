import dotenv from "dotenv"
dotenv.config();

import "isomorphic-fetch";
import { Session, Chains } from "@wharfkit/session"
import { WalletPluginPrivateKey } from "@wharfkit/wallet-plugin-privatekey"
import { Contract, ContractKit } from "@wharfkit/contract";
import { APIClient } from "@wharfkit/antelope";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';



const contractName = process.env.PUBLIC_GAME_ACCOUNT || "ramrambambam";
const walletPlugin = new WalletPluginPrivateKey(process.env.PROOF_SCRIPT_PRIVATE_KEY || "");

const chain = Chains[process.env.PROOF_SCRIPT_NETWORK || 'Jungle4'];

let jsonData;
const loadData = () => {
    if(fs.existsSync('./data.json')) {
        jsonData = JSON.parse(fs.readFileSync('./data.json'));
    } else {
        jsonData = {};
    }


    console.log('loaded data:', jsonData)
}

const saveData = () => {
    fs.writeFileSync('./data.json', JSON.stringify(jsonData));
}

const generateRoundData = (index) => {
    let proof = crypto.createHash('sha256').update(uuidv4()).digest().toString('hex');
    let proofHash = crypto.createHash('sha256').update(Buffer.from(proof, 'hex')).digest('hex');

    // conversion back from hex
    // const proofFromhex = Buffer.from(hexProof, 'hex');

    jsonData[index] = {
        proof,
        proofHash
    }
    saveData();

    return jsonData[index];

}

(async () => {
    loadData();
    const session = new Session({
        actor: contractName,
        permission: 'active',
        chain,
        walletPlugin,
    })

    const contractKit = new ContractKit({
        client: new APIClient(chain),
    })

    const contract = await contractKit.load(contractName)

    let currentRound = 0;

    const startNewRound = async (roundindex) => {
        console.log('Current round is already finished, starting new round: ', roundindex);
        const seedPhaseDuration = parseFloat(process.env.PROOF_SCRIPT_SEED_PHASE_DURATION_HOURS || 24) * 60 * 60;
        const redeemPhaseDuration = parseFloat(process.env.PROOF_SCRIPT_REDEEM_PHASE_DURATION_HOURS || 48) * 60 * 60;

        const hashes = generateRoundData(roundindex);
        const created = await session.transact({
            actions: [
                {
                    account: contractName,
                    name: 'startround',
                    authorization: [session.permissionLevel],
                    data: {
                        round: roundindex,
                        salt_proof: hashes.proofHash,
                        seed_phase_duration: seedPhaseDuration,
                        redeem_phase_duration: redeemPhaseDuration,
                    }
                },
                {
                    account: 'eosio',
                    name: 'buyrambytes',
                    authorization: [session.permissionLevel],
                    data: {
                        payer: session.actor,
                        receiver: contractName,
                        bytes: 1217
                    }
                }
            ]
        }).then(async x => {
            console.log(`Started round ${roundindex} - ${x.response.transaction_id}`);
            return true;
        }).catch(err => {
            console.error(err)
            return null;
        });
    }

    const checkRound = async () => {
        const roundindex = await contract.table('roundindex').get(null, {scope:0}).then(x => {
            return parseInt(x.index.toString());
        }).catch(err => {
            console.error(err)
            return null;
        });

        if(!roundindex){
            return startNewRound(0);
        }

        const currentRoundData = await contract.table('round').get(null, {scope:roundindex}).then(x => {
            return JSON.parse(JSON.stringify(x));
        }).catch(err => {
            console.error(err)
            return null;
        });

        if(!currentRoundData) {
            console.error('currentRoundData is null')
            return;
        } else {
            // console.log(currentRoundData);
            console.log(`[${new Date().toLocaleString()}] Checking round ${roundindex}`)
        }

        const proof = jsonData[roundindex];

        const seedPhaseElapsed = +new Date(currentRoundData.start_date) + (currentRoundData.seed_phase_duration * 1000) <= +new Date();
        const currentRoundElapsedAndNoProof = !proof && seedPhaseElapsed;

        if(currentRoundElapsedAndNoProof || currentRoundData.raw_salt !== "0000000000000000000000000000000000000000000000000000000000000000"){
            await startNewRound(roundindex+1);

            return;
        }

        if(seedPhaseElapsed) {
            console.log(`Starting redeem phase for round ${roundindex}`);


            const seedProof = Buffer.from(proof.proof, 'hex');

            const started = await session.transact({
                actions: [
                    {
                        account: contractName,
                        name: 'sendproof',
                        authorization: [session.permissionLevel],
                        data: {
                            raw_salt: seedProof,
                            round: roundindex,
                        }
                    }]
            }).then(async x => {
                console.log(`Started redeem phase for round ${roundindex} - ${x.response.transaction_id}`);

                return true;
            }).catch(err => {
                console.error(err)
                return null;
            });

            return;
        }
    }

    setInterval(checkRound, 1000 * 20);
    checkRound();
})();
