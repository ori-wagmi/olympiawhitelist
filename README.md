# OlympiaWhitelist Contract
This contract is the minter for HallsOfOlympia (0xeB652a847e5961D1F7FA53699693eC13C008b57B).

## Specs
OlympiaWhitelist allows minting of HallsOfOlympiaNFT using either native ETH or OHM by whitelisted members.

A maximum of 2592 tokens can be minted with OHM.

### Whitelisting
MerkleTree should be a list of addresses hashed with keccak256.

Deployer must call `setMerkleRoot` on OlympiaWhitlist after deployment.

**raw input addresses**
```javascript
[
  '0xBcd4042DE499D14e55001CcbB24a551F3b954096',
  '0x71bE63f3384f5fb98995898A86B02Fb2426c5788'
]
```

**addresses hashed with keccak256**
```javascript
[
  '0xd1c9116e78ef547bbf6d308c24c15a19c52a03bdd09355bd1156d9e86ae1e685',
  '0xb497decbca77186cd90037db453969c1cd0741d5f7776b4c1456a8de2ee3bc33'
]
```

**merkleTree**
```javascript
└─ a9b69fb8e369997bebeab56efb017479a9faa6a011bd9cee7491e78314eaf991
   ├─ d1c9116e78ef547bbf6d308c24c15a19c52a03bdd09355bd1156d9e86ae1e685
   └─ b497decbca77186cd90037db453969c1cd0741d5f7776b4c1456a8de2ee3bc33
```

Frontend must call mint and pass in the merkleProof for the given user.

### Token payment
All payment is sent to address 0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0.

Mint price is represented by `priceOneTokenEth` and the `priceOneTokenOhm` is calculated by querying the Chainlink Oracle for the current OHM price.

Whitelisted callers can mint any number of tokens. However, only 1/3 of the totalSupply can be minted with OHM.

**!! Deployer is responsible for maintaining ETH and OHM price via the `setPriceEth` and `setPriceOhm` functions.**

### VRF
This contract uses Chainlink VRF to generate a random offset between 1 and 7776. Offset can only be generated once.

**!! Deployer is responsible for calling requestRandomWords to generate the offset**

*notes*
Rinkbey testnet:
```javascript
    VRFCoordinatorV2Interface constant internal vrfCoordinator = VRFCoordinatorV2Interface(0x6168499c0cFfCaCD319c818142124B7A15E857ab);
    uint64 constant internal subscriptionId = 1902;
    bytes32 constant internal keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;
```

### Requirements after deployment
1. OlympiaWhitelist must be set as MinterRole for HallsOfOlympia
2. Deployer must set the merkleRoot
3. Deployer must set isStarted to true
4. Deployer must call requestRandomWords

# Testing
Tests can be run locally with `npx hardhat test`