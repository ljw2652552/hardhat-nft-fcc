const {
  networkConfig,
  developmentChains,
} = require("../helper-hardhat-config");
const {
  getNamedAccounts,
  deployments,
  network,
  run,
  ethers,
} = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async function({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  log("----------------------------");
  const args = [];
  const bascisNft = await deploy("BasicNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && process.env.ES_API_KEY) {
    log("Verifying...");
    await verify(bascisNft.address, args);
  }
  log("----------------------------");
};

module.exports.tags = ["all", "basicNFT"];
