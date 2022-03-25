//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

//import "hardhat/console.sol";

interface IOlympiaNftContract {
  function totalSupply() external view returns (uint256);
  function nextTokenId() external view returns (uint256);
  function mintNext(address _to, uint256 _amount) external;
}

contract OlympiaWhitelist is Ownable, ReentrancyGuard {
    bool isStarted;
    bytes32 public merkleRoot;
    uint256 public priceOneTokenEth = 0.19 ether;
    uint256 public priceOneTokenOhm = 190000000; // (0.19 OHM) 9 decimals!!
    address paymentReciever = 0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0;

    IOlympiaNftContract constant public nftContract = IOlympiaNftContract(0xeB652a847e5961D1F7FA53699693eC13C008b57B);
    IERC20 constant public ohmContract = IERC20(0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5);

    // ************Modifiers************ //
    modifier whitelisted(bytes32[] calldata merkleProof) {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "not whitelisted");
        _;
    }

    modifier checkSupply(uint256 amount) {
        int256 supplyLeft = int256(nftContract.totalSupply() + 1) - int256(nftContract.nextTokenId() + amount - 1);
        require(supplyLeft > 0, "no supply");
        _;
    }

    // ************Mint functions************ //
    function mintETH(bytes32[] calldata merkleProof, uint256 amount) whitelisted(merkleProof) checkSupply(amount) external payable nonReentrant {
        require(isStarted, "not started");
        uint256 totalPrice = amount*priceOneTokenEth;
        require(msg.value >= totalPrice, "not enough ETH");

        // send payment to paymentReciever
        (bool sendSuccess, ) = paymentReciever.call{value: totalPrice}("");
        require(sendSuccess, "payment failed");

        // mint NFT(s)
        nftContract.mintNext(msg.sender, amount);

        // refunding remaining ETH
        uint256 refund = msg.value - totalPrice;
        if(refund > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: refund}("");
            require(refundSuccess, "refund failed");
         }
    }

    function mintOHM(bytes32[] calldata merkleProof, uint256 amountTokens, uint256 amountOhm) whitelisted(merkleProof) checkSupply(amountTokens) external nonReentrant {
        require(isStarted, "not started");
        uint256 totalPrice = amountTokens*priceOneTokenOhm;
        require(amountOhm == totalPrice, "not enough OHM");
        uint256 thirdOfToken = nftContract.totalSupply() / 3;
        require((nftContract.nextTokenId()+amountTokens) < thirdOfToken, "OHM mint ended");

        // send payment to paymentReciever
        ohmContract.transferFrom(msg.sender, paymentReciever, amountOhm);
        // mint NFT(s)
        nftContract.mintNext(msg.sender, amountTokens);
    }

    // ************Modifiers************ //
    function setIsStarted(bool _isStarted) external onlyOwner {
        isStarted = _isStarted;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setPriceEth(uint256 _priceOneTokenEth) external onlyOwner {
        priceOneTokenEth = _priceOneTokenEth;
    }

    function setPriceOhm(uint256 _priceOneTokenOhm) external onlyOwner {
        priceOneTokenOhm = _priceOneTokenOhm;
    }

    function setPaymentReciever(address _paymentReciever) external onlyOwner {
        paymentReciever = _paymentReciever;
    }
}
