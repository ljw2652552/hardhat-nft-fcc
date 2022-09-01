const { assert } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Random NFT Unit Tests", function() {
      let deployer, randomIpfsNft, vrfCoordinatorV2Mock;
      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        await deployments.fixture(["mocks", "randomNFT"]);
        randomIpfsNft = await ethers.getContract("RandomIpfsNft");
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
      });

      describe("fullfilRandomWords", () => {
        it("mints NFT after random number is returned", async () => {
          const fee = await randomIpfsNft.getMintFee();
          const requestNftResponse = await randomIpfsNft.requestNft({
            value: fee.toString(),
          });
          const requestNftReceipt = await requestNftResponse.wait(1);
          await vrfCoordinatorV2Mock.fulfillRandomWords(
            requestNftReceipt.events[1].args.requestId,
            randomIpfsNft.address
          );

          await new Promise(async (resolve, reject) => {
            randomIpfsNft.once("NftMinted", async () => {
              try {
                const tokenUri = await randomIpfsNft.tokenURI("0");
                const tokenCounter = await randomIpfsNft.getTokenCounter();
                assert.equal(tokenUri.toString().includes("ipfs://"), true);
                assert.equal(tokenCounter.toString(), "1");
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
          });
        });
      });
    });
