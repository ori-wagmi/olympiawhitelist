// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./FullMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

//import "hardhat/console.sol";

interface IOlympiaNftContract {
  function totalSupply() external view returns (uint256);
  function nextTokenId() external view returns (uint256);
  function mintNext(address _to, uint256 _amount) external;
}

contract OlympiaWhitelist is Ownable, ReentrancyGuard, VRFConsumerBaseV2 {
    bool public isStarted;
    bool public isPublicMintStarted;
    bytes32 public merkleRoot;
    uint256 public numOhmMinted;

    // Payment
    uint256 public priceOneTokenEth = 0.19 ether;
    address public paymentReciever = 0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0;

    // Known contracts
    IOlympiaNftContract constant public nftContract = IOlympiaNftContract(0xeB652a847e5961D1F7FA53699693eC13C008b57B);
    IERC20 constant public ohmContract = IERC20(0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5);

    // Ohm Price Oracle
    AggregatorV3Interface constant internal ohmPriceFeed = AggregatorV3Interface(0x9a72298ae3886221820B1c878d12D872087D3a23);

    // VRFCoordinator
    VRFCoordinatorV2Interface constant internal vrfCoordinator = VRFCoordinatorV2Interface(0x271682DEB8C4E0901D1a1550aD2e64D568E69909);
    uint64 constant internal subscriptionId = 39;
    bytes32 constant internal keyHash = 0xff8dedfbfa60af186cf3c830acbc32c05aae823045ae5ea7da1e45fbfaba4f92;
    uint256 public requestId;
    uint256 public randomOffset;
    bool callOnce;

    constructor() VRFConsumerBaseV2(address(vrfCoordinator)) {}

    // ************Chainlink Oracle Methods************ //
    function priceOneTokenOhm() public view returns (uint256) {
        (
            /*uint80 roundID*/,
            int price,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = ohmPriceFeed.latestRoundData();
        // priceOneTokenEth / priceOneOhmInEth * 1e9 for decimals
        return FullMath.mulDiv(priceOneTokenEth, 1000000000, uint256(price));
    }

    function requestRandomWords() external onlyOwner {
        require(!callOnce, "already requested");
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            3, /* confirmation requests*/
            50000, /* callback gas limit */
            1 /* number words */
            );
        callOnce = true;
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        randomOffset = (randomWords[0] % 7760) + 1;
    }

    // ************Modifiers************ //
    modifier whitelisted(bytes32[] calldata merkleProof) {
        if (!isPublicMintStarted) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "not whitelisted");
        }
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
        require(amount <= 20, "max 20");
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
        require (amountTokens <= 20, "max 20");
        uint256 totalPrice = amountTokens*priceOneTokenOhm();
        require(amountOhm == totalPrice, "not enough OHM");
        require((numOhmMinted+amountTokens) <= 2592, "OHM mint ended");

        // send payment to paymentReciever
        ohmContract.transferFrom(msg.sender, paymentReciever, amountOhm);
        // mint NFT(s)
        nftContract.mintNext(msg.sender, amountTokens);
        numOhmMinted += amountTokens;
    }

    // ************Modifiers*****//******* //
    function setIsPublicMintStarted(bool _isPublicMintStarted) external onlyOwner {
        isPublicMintStarted = _isPublicMintStarted;
    }

    function setIsStarted(bool _isStarted) external onlyOwner {
        isStarted = _isStarted;
    }

    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function setPriceEth(uint256 _priceOneTokenEth) external onlyOwner {
        priceOneTokenEth = _priceOneTokenEth;
    }

    function setPaymentReciever(address _paymentReciever) external onlyOwner {
        paymentReciever = _paymentReciever;
    }

    function setNumOhmMinted(uint256 _numOhmMinted) external onlyOwner {
        numOhmMinted = _numOhmMinted;
    }
}
