# Ram Valley Contracts

This project consists of the contracts, deployments, and tests for Ram Valley.

## Getting setup

```bash
yarn
# or
npm install
```

You also need to copy the `.env.example` to `.env` and put a private key in there that has the ability to deploy the contract on the account you specify in your `deployments/<network>.ts` script. That key must match what is in the `fuckyea.config.js` file.

## Building the contract

```bash
yarn build
# or
npm run build
```

This will build `contracts/contract.cpp` using the `fuckyea` framework.

## Testing the contract

```bash
yarn test
```

This will run all tests for a `tests/**/*.spec.ts` glob. If contracts are not built yet, it will also build them.

## Deploying the contract

```bash
yarn deploy jungle
```

This will run the `deployments/jungle.ts` deployment script that deploys the contract to the [EOS Jungle4 Testnet](https://monitor.jungletestnet.io/). 

You can add more deployment scripts by copying the deployment file and adding a new network to your `fuckyea.config.js`. You can also use the `npx fuckyea scaffold deployment <name> <path>` helper.
