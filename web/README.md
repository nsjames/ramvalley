# Ram Valley Frontend

This project is a SvelteKit project, and as such has all the default SvelteKit steps

## Getting setup

```bash
yarn
# or
npm install
```

You will also need to copy the `.env.example` to `.env` and change the `PUBLIC_GAME_ACCOUNT` to the account your contract is deployed to. 

> **Available chains**
> 
> Note that the only viable chain options are what is specified in the list in @wharfkit/common. You can find the list [here](https://github.com/wharfkit/common/blob/b9cfe061b2619e297b2ead8dbe7f543617ebb455/src/common/chains.ts#L105).
> 
> If you need a custom network you will have to edit the `chain.service.ts` file and replace `const chain = Chains[getGameNetwork()];` with your own.

## Running the web app locally

```bash
yarn dev
```

This will start the web app locally at http://localhost:5173/ (or some port that is available if that is already taken)

## The management script

This is a script that makes it easy to run the actual game, as the host. It simply watches for rounds that have finished, and then starts new rounds, and also waits for the seeding phases to finish so that it can push up the proofs.

It will create a `data.json` in the `scripts` directory that will have the proofs and checksums so that you have records of them.

To run it, you will need to fill out the four extra fields in your `.env`:
- `PROOF_SCRIPT_PRIVATE_KEY` - This is the key that controls the contract (or the `require_auth` for `startround` and `sendproof` if you have changed those)
- `PROOF_SCRIPT_NETWORK` - The network to send transactions to
- `PROOF_SCRIPT_SEED_PHASE_DURATION_HOURS` - The amount of time, in hours, that the initial "seed" phase takes.
- `PROOF_SCRIPT_REDEEM_PHASE_DURATION_HOURS` - The amount of time, in hours, that the "redeem" phase takes.

Then run `yarn proofs` or `npm run proofs`.

> **Multiple rounds simultaneously**
>
> New rounds are allowed to be created once a "seed" phase is over. This means you could have multiple rounds happening at the same time, one which is in the "seed" phase, and one or more which is still in the "redeem" phase. 


> **Available chains**
>
> The same restrictions apply as above for network options here. If you need to add a custom network, then you need to edit the `const chain` in the `scripts/proof.js` file.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
