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
1. Run unit tests: `npx hardhat test`
1. Run coverage test: `npm run run:coverage`

### Slither reports

For static analysis we use Slither. When it's [installed locally](https://github.com/crytic/slither#how-to-install), you can run: `npm run run:slither` 

## Deployment

The contracts can be deployed either directly through Hardhat or through a Fireblocks integration (with the help of Hardhat). This section explains direct Hardhat deployment - Fireblocks deployment is documented elsewhere. Hardhat deployment also verifies the contracts in Etherscan.

Steps:
1. Set your environment variables in `.secrets.env`. You can see `.secrets.env.example` for the format. Note that you don't need any of the Fireblocks-related settings when deploying directly with Hardhat
1. Deploy: `npx hardhat run scripts/deployManual.ts --network goerliDirect` 
1. Go to Etherscan and open the address given by the deployment script. Mark the contract as proxy in Etherscan.

