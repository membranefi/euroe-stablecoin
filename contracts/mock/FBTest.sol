// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Demo {
    uint256 public stor;

    function Store(uint256 number) public {
        stor = number;
    }

    function GiveBack(uint256 input) public pure returns (uint256) {
        return input + 1;
    }
}
// https://goerli.etherscan.io/address/0x36ba95480fc24f852a2c6e3087aa9fe9aacb2ef3#code
