import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
const { network, ethers } = require("hardhat");
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

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
    merkleTreeDB = [
      accounts[10].address,
      accounts[11].address
    ];
    const leafNodes = merkleTreeDB.map(convertEntryToHash);
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  });

  this.beforeEach(async () => {
    const OlympiaFactory = await ethers.getContractFactory("OlympiaWhitelist");
    OlympiaContract = await OlympiaFactory.deploy();
    await OlympiaContract.deployed();
    await OlympiaContract.setMerkleRoot(merkleTree.getRoot());

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
  })

  it("Test mint ETH", async function () {
    let callerHash = convertEntryToHash(accounts[10].address);
    let callerProof = merkleTree.getHexProof(callerHash);
    let priceOneTokenEth = await OlympiaContract.priceOneTokenEth();
    let nextTokenId = HallsOfOlympia.nextTokenId();

    await OlympiaContract.connect(accounts[10]).mintETH(callerProof, 3, {value:priceOneTokenEth.mul(3)});
    let afterMintTokenId = HallsOfOlympia.nextTokenId();
    expect(afterMintTokenId - nextTokenId, "didn't mint 3 tokens").to.be.equal(3);
  });

});
