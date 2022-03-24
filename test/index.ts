import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
const keccak256 = require("keccak256");
const { MerkleTree } = require("merkletreejs");

describe("Test Whitelist", function () {
  let merkleTreeDB: String[];
  let merkleTree: any;
  let accounts: SignerWithAddress[];

  let OlympiaContract: any;
  let TestNFTContract: any;
  // Helper function
  function convertEntryToHash(entry: String) {
    return (
      "0x" +
      Buffer.from(
        keccak256(entry)
      ).toString("hex")
    );
  }

  // setup merkle tree
  before(async () => {
    accounts = await ethers.getSigners();
    merkleTreeDB = [
      accounts[10].address,
      accounts[11].address
    ];

    const leafNodes = merkleTreeDB.map(convertEntryToHash);
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
  });

  this.beforeEach(async () => {
    const TestNFTFactory = await ethers.getContractFactory("TestNFT");
    TestNFTContract = await TestNFTFactory.deploy();

    const OlympiaFactory = await ethers.getContractFactory("OlympiaWhitelist");
    OlympiaContract = await OlympiaFactory.deploy(TestNFTContract.address, ethers.constants.AddressZero);
    await OlympiaContract.deployed();

    await OlympiaContract.setMerkleRoot(merkleTree.getRoot());
  })

  it("Test whitelist success case", async function () {
    let callerHash = convertEntryToHash(accounts[10].address);
    let callerProof = merkleTree.getHexProof(callerHash);
    await OlympiaContract.connect(accounts[10]).tryMintETH(callerProof, 3);
    await OlympiaContract.connect(accounts[10]).tryMintOHM(callerProof, 3, 1);

  });

  it("Test whitelist fail case", async function () {
    let callerHash = convertEntryToHash(accounts[0].address);
    let callerProof = merkleTree.getHexProof(callerHash);

    await expect(OlympiaContract.connect(accounts[0]).tryMintETH(callerProof, 3)).to.be.revertedWith("not whitelist");
    await expect(OlympiaContract.connect(accounts[0]).tryMintOHM(callerProof, 3, 10)).to.be.revertedWith("not whitelist");

  });

});
