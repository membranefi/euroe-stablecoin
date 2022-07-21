# EURO Stablecoin

Smart contracts for the Euro-backed stablecoin project, EURO.

## Functionalities

Available functionalities in the token contract are listed below.

### ERC20 standard

The token follows the [ERC-20 token standard](https://eips.ethereum.org/EIPS/eip-20) and implements all of its functionality through the [OpenZeppelin ERC20 implementation](https://docs.openzeppelin.com/contracts/4.x/erc20).

### Access restrictions

Access to certain functionality is restricted by [OpenZeppelin role-based access control](https://docs.openzeppelin.com/contracts/4.x/access-control#role-based-access-control). More details about the used roles and which role can perform which operations can be found later in this document.

### Upgrading the contract

The contract can be upgraded via [OpenZeppelin UUPS pattern](https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent-vs-uups). Upgrading the contract retains the old contract state.

### ERC20 permit

It is possible for any user to give allowance to their tokens without a transaction by signing an [OpenZeppelin permit](https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Permit) message.

### Burning tokens

It is possible to burn tokens.

This can be achieved in either of the following two ways:

1. Add allowance for an address with the _minter_ user role to withdraw your tokens. This allowance can be given either with a direct ERC-20 `approve` transaction to the contract or with a `permit` signature. The address with the _minter_ role burns the tokens.
1. Transfer tokens to an address with the _minter_ user role. That address then burns the tokens.

Note that this functionality should be coordinated with the EURO Stablecoin project and only executed after an agreement.

### Minting tokens

It is possible to mint new tokens.

The minting happens in batches. A batch can include any number of minting actions - each action is a combination of a _target_ (an address) and an _amount_ (an integer). Each action mints an amount of new tokens, which are sent to the corresponding address.

Each batch has a unique identifier, which is provided by a backend system.

Each minting batch is checksummed and the checksum value is provided along with the minting set. The checksum is validated in the contract before minting.

### Pausing and unpausing the contract

Pausing the contract causes all token transfers to fail. It is also possible to unpause the contract.

### Rescuing tokens

It is possible to rescue an arbitrary token sent to the token contract. This can be used if someone accidentally sends a big amount of tokens to the token contract itself.

## User roles

Access to certain functionality is restricted by user roles. Each role can be assigned to one or multiple Ethereum addresses.

The used roles are explained below. Unless otherwise stated, access to the named functionality is _only_ available for an address with the said role.

### Admin role

An address with the _admin_ role can assign and unassign any role to any address, except an admin can't (un)block an address.

### Proxyowner

An address with the _proxyowner_ role can upgrade the token smart contract via proxy pattern and rescue arbitrary tokens sent to the token contract.

### Blocklister

An address with the _blocklister_ role can assign and unassign the _blocked_ role to any address.

### Pauser

An address with the _pauser_ role can pause the contract's functionality.

### Unpauser

An address with the _unpauser_ role can unpause the contract.

### Minter

An address with the _minter_ role can mint new tokens, burn their own tokens and burn tokens from an address with an allowance.

### Blocked

An address with the _blocked_ role can not transfer or receive tokens.

The token contract itself has the _blocked_ role to prevent its own tokens from being transferred directly to it by accident.

## Developer resources

See [Developer resources](./DEVELOPER.md) for development details.