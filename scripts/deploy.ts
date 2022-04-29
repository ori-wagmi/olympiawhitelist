// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // const OlympiaFactory = await ethers.getContractFactory("OlympiaWhitelist");
  // const olympia = await OlympiaFactory.deploy();
  // await olympia.deployed();
  // console.log("deployed: ", olympia.address);

  // const HOAFactory = await ethers.getContractFactory("HallsofOlympia");
  // const hoa = await HOAFactory.deploy("Hall Of Olympia", "HOO", 7776, 'ipfs://QmTdgwYfjbd2adKDgtpLk2119n29DoJEfpkNxh5SyrCZC5/', "", "0xa1aed6f3B7C8F871b4Ac27144ADE9fDa6fBCD639");
  // await hoa.deployed();
  // console.log("hoo: ", hoa.address);

  const OlympiaRefund = await ethers.getContractFactory("OlympiaRefund");
  const refund = await OlympiaRefund.deploy();
  await refund.deployed();
  console.log("deployed: ", refund.address);

  // const TestERC721 = await ethers.getContractFactory("TestERC721");
  // const erc = await TestERC721.deploy();
  // await erc.deployed();
  // console.log("deployed: ", erc.address);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
