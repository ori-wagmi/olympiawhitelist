// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract OlympiaRefund is Ownable {
    // mainnet
    address payable public tokenReciever = payable(0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0);
    IERC721 public constant nftContract = IERC721(0xeB652a847e5961D1F7FA53699693eC13C008b57B);

    // testnet
    // address payable public tokenReciever = payable(0xfB3292b276A55d7c2b3203Aff583880123E9aB6d);
    // IERC721 public constant nftContract = IERC721(0x775515ea265a06f8E9C19895e88C01883cDA9127);

    uint256 public ethRecieved;
    bool public isRefundActive;

    function claimRefund(uint256[] calldata nftIds) external {
        require (isRefundActive, "!active");
        uint256 total = nftIds.length * 0.19 ether;
        require(ethRecieved >= total, "noEth");
        ethRecieved -= total;
        for (uint8 i = 0; i < nftIds.length; i++) {
            require(msg.sender == nftContract.ownerOf(nftIds[i]), "!owner");
            nftContract.transferFrom(msg.sender, tokenReciever, nftIds[i]);
        }
        payable(msg.sender).transfer(total);
    }

    function withdrawAllEth() external {
        require(
            (msg.sender == owner() || msg.sender == tokenReciever),
            "!owner"
        );
        tokenReciever.transfer(ethRecieved);
        ethRecieved = 0;
    }

    receive() external payable {
        ethRecieved += msg.value;
    }

    fallback() external payable {
        ethRecieved += msg.value;
    }

    function inCaseTokensGetStuck(address _token) external onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(msg.sender, amount);
    }

    function setIsRefundActive(bool _isRefundActive) external onlyOwner {
        isRefundActive = _isRefundActive;
    }

    function setTokenReciever(address payable _tokenReciever) external onlyOwner {
        tokenReciever = _tokenReciever;
    }
}
