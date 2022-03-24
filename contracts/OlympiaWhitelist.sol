//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";
interface INftContract {
    function mint(address recipient, uint256 amount) external payable;
    function mintOhm(address recipient, uint256 amountTokens, uint256 amountOhm) external;
}

contract OlympiaWhitelist is Ownable {
    bytes32 public merkleRoot;
    address public nftContract;
    address public ohmContract;

    event WhitelistMint(
        address indexed recipient,
        uint256 amount,
        bool isEth
    );

    modifier whitelisted(bytes32[] calldata merkleProof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "not whitelisted");
        _;
    }

    constructor(address _nftContract, address _ohmContract) {
        nftContract = _nftContract;
        ohmContract = _ohmContract;
    }

    function tryMintETH(bytes32[] calldata merkleProof, uint256 amount) whitelisted(merkleProof) external payable {
        INftContract(nftContract).mint{value:msg.value}(msg.sender, amount);
        emit WhitelistMint(msg.sender, amount, true);
    }

    function tryMintOHM(bytes32[] calldata merkleProof, uint256 amountTokens, uint256 amountOhm) whitelisted(merkleProof) external {
        INftContract(nftContract).mintOhm(msg.sender, amountTokens, amountOhm);
        emit WhitelistMint(msg.sender, amountTokens, false);
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
    }

}
