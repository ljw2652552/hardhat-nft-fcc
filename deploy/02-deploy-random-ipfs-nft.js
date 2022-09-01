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
const {
  storeImages,
  storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

const imagesLocation = "./images/randomNft";

const metadataTemplate = {
  name: "",
  description: "",
  image: "",
  attributes: [
    {
      trait_type: "Cuteness",
      value: 100,
    },
  ],
};
const FUND_AMOUNT = "1000000000000000000000";

module.exports = async function({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // get the IPFS hashes of our images
  //1.With our own IPFS node.
  //2.Pinata
  //3.nft.storage

  let tokenUris;
  if (process.env.UPLOAD_TO_PINATA == "true") {
    tokenUris = await handleTokenUris();
    /**[
  'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo',
  'ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d',
  'ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm'
] */
  }

  let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;
  log("----------------------------");
  if (chainId == 31337) {
    //需要部署mock vrf
    // const vrfCoordinatorV2Mock = await deployments.get("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const txResponse = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await txResponse.wait();
    subscriptionId = await txReceipt.events[0].args.subId;
    console.log(`subscriptionId: ${subscriptionId}`);
    // Fund the subscription
    // Our mock makes it so we don't actually have to worry about sending fund
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
    subscriptionId = networkConfig[chainId]["subscriptionId"];
    // const proxyAgent = new ProxyAgent("http://127.0.0.1:7890"); // change to yours
    // setGlobalDispatcher(proxyAgent);
  }

  const arguments = [
    vrfCoordinatorV2Address,
    networkConfig[chainId]["gasLane"],
    subscriptionId,
    networkConfig[chainId]["callbackGasLimit"],
    tokenUris,
    networkConfig[chainId]["mintFee"],
  ];

  const randomIpfsNft = await deploy("RandomIpfsNft", {
    from: deployer,
    args: arguments,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (!developmentChains.includes(network.name) && process.env.ES_API_KEY) {
    log("Verifying...");
    await verify(randomIpfsNft.address, arguments);
  }
  log("----------------------------");
};

async function handleTokenUris() {
  tokenUris = [];
  //store the Image in IPFS
  //Store the metadata in IPFS
  const { responses: imageUploadResponses, files } = await storeImages(
    imagesLocation
  );
  console.log(imageUploadResponses);
  for (index in imageUploadResponses) {
    //createMetadata and upload
    let tokenUriMetaData = { ...metadataTemplate }; //... means unpacked json
    tokenUriMetaData.name = files[index].replace(".png", "");
    tokenUriMetaData.description = `An adorable ${tokenUriMetaData.name} pup!`;
    tokenUriMetaData.image = `ipfs://${imageUploadResponses[index].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetaData.name}`);
    const metadataUploadResponse = await storeTokenUriMetadata(
      tokenUriMetaData
    );
    tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  }
  console.log("TokenUris:");
  console.log(tokenUris);
  return tokenUris;
}

module.exports.tags = ["all", "randomNFT"];
