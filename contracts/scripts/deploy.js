const { ethers } = require("hardhat");

async function main() {
  const factory = await ethers.getContractFactory("SupplyChainEscrow");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("SupplyChainEscrow deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
