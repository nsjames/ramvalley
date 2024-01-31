# Ram Valley

This is a fullstack blockchain example application that shows off ways you can use RAM for novel applications. 

This type of application can only be done on EOS (and other Antelope-based chains) because of the unique resource model. 

The general gist of how this works is:
1. A round is started by the host, with an RNG commit
2. Players play the game by pushing transactions with:
   1. A purchase of RAM for the contract (312 bytes)
   2. And a call to the `seed` action to register a random hash
3. Once the "seeding" phase time elapses, the host reveals the raw RNG seed, this starts the "redeem" phase
4. Players who pushed seeds can now redeem tickets for a random amount of points (1-10000)
5. Once the "redeem" phase time elapses, all players can claim rewards based on the amount of points they have vs the total
6. When players claim rewards, the RAM is sold and they get EOS back

## Project Structure

This project contains two projects within it:
- `web` -  A [SvelteKit](https://kit.svelte.dev/) project that serves as the front-end for the game, as well as a script to run as the host
- `contracts` - A [FuckYea](https://github.com/nsjames/fuckyea) project that has the contract and tests for it

Each of the projects has a `README.md` with usage details.

## Disclaimer

This project is meant for educational purposes only. It is showcasing a novel concept that can only be done on Antelope-based chains. I have no intention of deploying this to a live network that has a financial value (it _is_ however deployed to a testnet for showcasing purposes).

The contracts and frontends in this project are also unaudited and may contain errors, bugs, or security vulnerabilities. Proceed at your own risk.