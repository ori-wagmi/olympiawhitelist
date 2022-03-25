# OlympiaWhitelist Contract
This contract is the minter for HallsOfOlympia (0xeB652a847e5961D1F7FA53699693eC13C008b57B).

##Specs
OlympiaWhitelist allows minting of HallsOfOlympiaNFT using either native ETH or OHM by whitelisted members.

###Whitelisting
MerkleTree should be a list of addresses hashed with keccak256.

Deployer must call `setMerkleRoot` on OlympiaWhitlist after deployment.

Frontend must call mint and pass in the merkleProof for the given user.

##Token payment
All payment is sent to address 0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0.

Mint price is represented by `priceOneTokenEth` and `PriceOneTokenOhm` (Ohm is 9 decimals!!).

Whitelisted callers can mint any number of tokens. However, only 1/3 of the totalSupply can be minted with OHM.

!! Deployer is responsible for maintaining ETH and OHM price via the `setPriceEth` and `setPriceOhm` functions.

##Requirements after deployment
1. OlympiaWhitelist must be set as MinterRole for HallsOfOlympia
2. Deployer must set the merkleRoot
3. Deployer must set isStarted to true

#Testing
Tests can be run locally with `npx hardhat test`