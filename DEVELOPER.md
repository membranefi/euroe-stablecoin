# EURO Stablecoin developer instructions

The project uses the following main frameworks:

- OpenZeppelin smart contract templates
- Yarn for package management
- Hardhat for development environment and unit test running
- Typechain for generating TypeScript types from the contracts for unit tests
- Chai & Mocha for unit tests

## Preparations

1. Install packages: `yarn`
1. Compile: `npx hardhat compile`
1. Generate typechain artifacts: `npm run generate:typechain`
1. Deploy locally: `npx hardhat deploy`
1. Run unit tests: `npx hardhat test`
1. Run coverage test: `npm run run:coverage`

### Notes about coverage testing

To be able to generate the coverate report successfully you have to first manually disable the Safe deployment line in `hardhat.base.ts`: `setupSafeDeployer(...`)`. Otherwise you will get coverage errors about *Transaction gas limit is 1099510650647 and exceeds block gas limit of 30000000*.

The used [Solidity coverage plugin](https://github.com/sc-forks/solidity-coverage) has certain [limitations](https://github.com/sc-forks/solidity-coverage/issues/656). Until those limitations are fixed, we should use the aforementioned custom command.

### Slither reports

For static analysis, we use Slither. When it's [installed locally](https://github.com/crytic/slither#how-to-install), you can run: `npm run run:slither` 

## Deployment

A Gnosis Safe multi-signature account is used for live deployment.

The deployment should be initiated from a delegated signer account. This account only has access to propose transactions, but not to sign/confirm them.

### Used frameworks

Deployment is performed with the help of [Hardhat deploy plugin](https://github.com/wighawag/hardhat-deploy). An extra plugin for multisig deployment is used: [Hardhat safe deployer](https://github.com/rmeissner/hardhat-safe-deployer).

The deployment script uses a few custom patches, since the used frameworks do not support the latest Gnosis versions [yet](https://github.com/rmeissner/hardhat-safe-deployer/issues/2). Also the Gnosis packages do not currently fully support delegate signers, so that requires patches.

Used patches:
- Contents from this PR: https://github.com/rmeissner/hardhat-safe-deployer/pull/3/files
- Contenst from this PR: https://github.com/safe-global/safe-core-sdk/pull/209/files

These patches can be removed once:
1. Safe Core SDK publishes a new version from their *develop* branch
1. Hardhat safe deployer merges the PR

### Steps

Before starting deployment, make sure the *FIXME* section in hardhat.base.ts is fixed, or change its values accordingly.

Deployment steps. Change the used network in the commands:
1. Start deploying the implementation by `npx hardhat deploy --network goerli` 
1. Once the script says "deploying xyz...", open your multisig at [Gnosis UI](https://gnosis-safe.io/app/)
1. Approve the transaction with required amount of multisig signers
1. Execute the transaction
1. Repeat the above 3 steps for the Proxy deployment (deployment should start automatically)
1. Verify the deployed contracts for Etherscan: `npx hardhat etherscan-verify --network goerli`
1. Go to the proxy contract in Etherscan and mark it as a proxy contract
