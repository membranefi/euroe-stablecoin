# EUROe on Solana

## About Solana SPL tokens

Solana tokens are implemented as (SPL tokens)[https://spl.solana.com/token]. The SPL token program is a smart contract that runs on the Solana blockchain. The SPL token program is a standard that allows anyone to create tokens on Solana. The SPL token program is similar to the ERC-20 token standard on Ethereum with small differences.

EUROe is implemented as an SPL token on Solana, and as such has all the functionalities that any SPL token has. 

### Token-2022 program

In case EUROe is decided to be migrated to Token-2022 program or similar future token program on Solana, customers would be noted well in advance of any consequences or possible actions required.

## Development of EUROe on Solana

Deployment and maintenance of the systems used to deploy, manage and interact with the EUROe SPL token is done according to modern best practices. The code is thoroughly tested, both with automated tests in the CI/CD pipeline and manual testing. All code is reviewed before being deployed to production. Access to production environment is limited to a small number of authorized administrators.

Solana's (web3)[https://solana-labs.github.io/solana-web3.js/] and (spl-token)[https://solana-labs.github.io/solana-program-library/token/js/] libraries are used to interact with the Solana blockchain.

