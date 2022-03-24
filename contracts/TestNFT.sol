//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract TestNFT {
    event Minted(address recipient, uint256 amount);
    function mint(address recipient, uint256 amount) external payable {
        emit Minted(recipient, amount);
    }
    function mintOhm(address recipient, uint256 amountTokens, uint256 amountOhm) external {
        emit Minted(recipient, amountTokens);
    }
}