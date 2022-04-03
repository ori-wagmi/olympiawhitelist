import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
const { network, ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");
const hardhat = require("hardhat");

describe("Test Whitelist", function () {
  let merkleTreeDB: String[];
  let merkleTree: any;
  let accounts: SignerWithAddress[];

  let OlympiaContract: any;
  let HallsOfOlympia: any;

  // Helper function
  function convertEntryToHash(entry: String) {
    return (
      "0x" +
      Buffer.from(
        keccak256(entry)
      ).toString("hex")
    );
  }

  before(async () => {
    accounts = await ethers.getSigners();

    // Setup merkle tree
    // merkleTreeDB = [
    //   accounts[10].address,
    //   accounts[11].address
    // ];
    merkleTreeDB = [
      "0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0",
      "0xa1aed6f3B7C8F871b4Ac27144ADE9fDa6fBCD639",
      "0xF66Db38faf6E4D3D7f201B2DD0710A331282bE6F"
    ]
    const leafNodes = merkleTreeDB.map(convertEntryToHash);
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  });

  this.beforeEach(async () => {
    await network.provider.request({
      method: "hardhat_reset",
      params: [
        {
          forking: {
            jsonRpcUrl: hardhat.config.networks.hardhat.forking.url,
            blockNumber: hardhat.config.networks.hardhat.forking.blockNumber, // blocknumber defined in hardhat.config.js
          },
        },
      ],
    });

    const OlympiaFactory = await ethers.getContractFactory("OlympiaWhitelist");
    OlympiaContract = await OlympiaFactory.deploy();
    await OlympiaContract.deployed();
    await OlympiaContract.setMerkleRoot(merkleTree.getRoot());
    MerkleTree.print(merkleTree);
    console.log("merkleRoot: ", merkleTree.getHexRoot());

    let callerHash = convertEntryToHash("0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0");
    let callerProof = merkleTree.getHexProof(callerHash);
    console.log("0x9409 proof:", callerProof);
    callerHash = convertEntryToHash("0xa1aed6f3B7C8F871b4Ac27144ADE9fDa6fBCD639");
    callerProof = merkleTree.getHexProof(callerHash);
    console.log("0xa1a proof: ", callerProof)
    callerHash = convertEntryToHash("0xF66Db38faf6E4D3D7f201B2DD0710A331282bE6F");
    callerProof = merkleTree.getHexProof(callerHash);
    console.log("0xF66 proof: ", callerProof)
    
    // set OlympiaContract as minter
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0"],
    });
    let owner = await ethers.getSigner("0x940913C25A23FB6e2778Ec4b29110DC9f3F54fb0");

    HallsOfOlympia = new ethers.Contract(
      "0xeB652a847e5961D1F7FA53699693eC13C008b57B",
      require("./HallsOfOlympia.json"),
      owner
    );

    // grant MinterRole for OlympiaContract
    HallsOfOlympia.grantRole(keccak256("MinterRole"), OlympiaContract.address);

    // start whitelist
    await OlympiaContract.setIsStarted(true);
  })

  it("Test mint ETH", async function () {
    let callerHash = convertEntryToHash(accounts[10].address);
    let callerProof = merkleTree.getHexProof(callerHash);
    let priceOneTokenEth = await OlympiaContract.priceOneTokenEth();

    // mint 3 tokens
    let nextTokenId = await HallsOfOlympia.nextTokenId();
    await OlympiaContract.connect(accounts[10]).mintETH(callerProof, 3, {value:priceOneTokenEth.mul(3)});
    let afterMintTokenId = await HallsOfOlympia.nextTokenId();
    expect(afterMintTokenId - nextTokenId, "didn't mint 3 tokens").to.be.equal(3);
    expect(await HallsOfOlympia.ownerOf(4), "tokenid 4 not owned by 10").to.be.equal(accounts[10].address);
    expect(await HallsOfOlympia.ownerOf(6), "tokenid 6 not owned by 10").to.be.equal(accounts[10].address)
    await expect(HallsOfOlympia.ownerOf(7)).to.be.revertedWith("ERC721: owner query for nonexistent token");

    // mint 2 more tokens
    nextTokenId = await HallsOfOlympia.nextTokenId();
    await OlympiaContract.connect(accounts[10]).mintETH(callerProof, 2, {value:priceOneTokenEth.mul(2)});
    afterMintTokenId = await HallsOfOlympia.nextTokenId();
    expect(afterMintTokenId - nextTokenId, "didn't mint 2 tokens").to.be.equal(2);
    expect(await HallsOfOlympia.ownerOf(7), "tokenid 7 not owned by 10").to.be.equal(accounts[10].address);
    expect(await HallsOfOlympia.ownerOf(8), "tokenid 8 not owned by 10").to.be.equal(accounts[10].address)
    await expect(HallsOfOlympia.ownerOf(9)).to.be.revertedWith("ERC721: owner query for nonexistent token");

    // error case, mint too many tokens
    await expect(OlympiaContract.connect(accounts[10]).mintETH(callerProof, 8000, {value:priceOneTokenEth})).to.be.revertedWith("no supply");

    // error case, not enough funds
    await expect(OlympiaContract.connect(accounts[10]).mintETH(callerProof, 1, {value:0})).to.be.revertedWith("not enough ETH");

    // Test public mint
    await OlympiaContract.setIsPublicMintStarted(true);
    await OlympiaContract.connect(accounts[1]).mintETH(callerProof, 1, {value:priceOneTokenEth});
    expect(await HallsOfOlympia.ownerOf(9), "tokenid 9 not owned by 1").to.be.equal(accounts[1].address);
  });

  it("Test mint Ohm", async function () {
    let callerHash = convertEntryToHash(accounts[10].address);
    let callerProof = merkleTree.getHexProof(callerHash);
    let priceOneTokenOhm = await OlympiaContract.priceOneTokenOhm();

    // deposit ETH to WETH
    let wethContract = new ethers.Contract(
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      require("./weth.json"),
      accounts[10]
    );

    await wethContract
    .connect(accounts[10])
    .approve(wethContract.address, ethers.constants.MaxUint256);
    await wethContract.connect(accounts[10]).deposit({ value: ethers.utils.parseEther("5.0") });


    // swap WETH to OHM
    let unirouter = new ethers.Contract("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", require("./unirouter.json"), accounts[10]);

    await wethContract
    .connect(accounts[10])
    .approve(unirouter.address, ethers.constants.MaxUint256);

    let ohmContract = new ethers.Contract(
      "0x64aa3364F17a4D01c6f1751Fd97C2BD3D7e7f1D5",
      require("./weth.json"),
      accounts[10]
    );
    await ohmContract
    .connect(accounts[10])
    .approve(unirouter.address, ethers.constants.MaxUint256);

    await unirouter
    .connect(accounts[10])
    .swapExactTokensForTokens(
      await wethContract.balanceOf(accounts[10].address),
      0,
      [wethContract.address, ohmContract.address],
      accounts[10].address,
      (await ethers.provider.getBlock("latest")).timestamp + 1000
    );

    // approve Ohm for OlympiaWhitelist
    await ohmContract
    .connect(accounts[10])
    .approve(OlympiaContract.address, ethers.constants.MaxUint256);

    // mint 3 tokens
    let nextTokenId = await HallsOfOlympia.nextTokenId();
    await OlympiaContract.connect(accounts[10]).mintOHM(callerProof, 3, priceOneTokenOhm.mul(3));
    let afterMintTokenId = await HallsOfOlympia.nextTokenId();
    expect(afterMintTokenId - nextTokenId, "didn't mint 3 tokens").to.be.equal(3);
    expect(await HallsOfOlympia.ownerOf(4), "tokenid 4 not owned by 10").to.be.equal(accounts[10].address);
    expect(await HallsOfOlympia.ownerOf(6), "tokenid 6 not owned by 10").to.be.equal(accounts[10].address)
    await expect(HallsOfOlympia.ownerOf(7)).to.be.revertedWith("ERC721: owner query for nonexistent token");

    // mint 1 more tokens
    nextTokenId = await HallsOfOlympia.nextTokenId();
    await OlympiaContract.connect(accounts[10]).mintOHM(callerProof, 1, priceOneTokenOhm.mul(1));
    afterMintTokenId = await HallsOfOlympia.nextTokenId();
    expect(afterMintTokenId - nextTokenId, "didn't mint 1 tokens").to.be.equal(1);
    expect(await HallsOfOlympia.ownerOf(7), "tokenid 7 not owned by 10").to.be.equal(accounts[10].address);
    await expect(HallsOfOlympia.ownerOf(8)).to.be.revertedWith("ERC721: owner query for nonexistent token");

    // error case, mint too many tokens
    await expect(OlympiaContract.connect(accounts[10]).mintOHM(callerProof, 8000, priceOneTokenOhm)).to.be.revertedWith("no supply");

    // error case, not enough funds
    await expect(OlympiaContract.connect(accounts[10]).mintOHM(callerProof, 1, priceOneTokenOhm.mul(100))).to.be.revertedWith("not enough OHM");

    // error case, minting over max
    await expect(OlympiaContract.connect(accounts[10]).mintOHM(callerProof, 3000, priceOneTokenOhm.mul(3000))).to.be.revertedWith("max 20");

    // Test public mint
    await OlympiaContract.setIsPublicMintStarted(true);
    await ohmContract.transfer(accounts[1].address, await ohmContract.balanceOf(accounts[10].address));
    await ohmContract
    .connect(accounts[1])
    .approve(OlympiaContract.address, ethers.constants.MaxUint256);
    await OlympiaContract.connect(accounts[1]).mintOHM(callerProof, 1, priceOneTokenOhm);
    expect(await HallsOfOlympia.ownerOf(8), "tokenid 8 not owned by 1").to.be.equal(accounts[1].address);
  });

  it("Test non-whitelist mint", async function() {
    let callerHash = convertEntryToHash(accounts[10].address);
    let callerProof = merkleTree.getHexProof(callerHash);
    await expect(OlympiaContract.connect(accounts[1]).mintOHM(callerProof, 3, 10)).to.be.revertedWith("not whitelisted");
    await expect(OlympiaContract.connect(accounts[1]).mintETH(callerProof, 3, {value: 10})).to.be.revertedWith("not whitelisted");
  });

  it.skip("Test VRF", async function() {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xa1aed6f3B7C8F871b4Ac27144ADE9fDa6fBCD639"],
    });
    let owner = await ethers.getSigner("0xa1aed6f3B7C8F871b4Ac27144ADE9fDa6fBCD639");


    let vrf = new ethers.Contract(
      "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
      require("./vrf.json"),
      owner
    );
    await vrf.connect(owner).addConsumer(39, OlympiaContract.address);
    await OlympiaContract.requestRandomWords();
    for (var i = 0; i < 20; i++) {
      await network.provider.request({
        method: "evm_mine",
        params: [],
      });
    }
    console.log(await OlympiaContract.randomOffset());

    await expect(OlympiaContract.requestRandomWords()).to.be.revertedWith("already requested");
  });
});
