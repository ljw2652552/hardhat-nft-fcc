const { assert } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Basic NFT Unit Tests", function() {
      let deployer, bascisNFT;
      beforeEach(async () => {
        accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        await deployments.fixture(["basicNFT"]);
        bascisNFT = await ethers.getContract("BasicNFT");
      });

      describe("Constructor", () => {
        it("Initilizes the NFT Correctly.", async () => {
          const name = await bascisNFT.name();
          const symbol = await bascisNFT.symbol();
          const tokenCounter = await bascisNFT.getTokenCounter();
          assert.equal(name, "Dogie");
          assert.equal(symbol, "DOG");
          assert.equal(tokenCounter.toString(), "0");
        });
      });

      describe("Mint NFT", () => {
        it("Allows users to mint an NFT, and updates appropriately", async () => {
          const txResponse = await bascisNFT.mintNFT();
          await txResponse.wait(1);
          const tokenURI = await bascisNFT.tokenURI(0);
          const tokenCounter = await bascisNFT.getTokenCounter();

          assert.equal(tokenCounter.toString(), "1");
          assert.equal(tokenURI, await bascisNFT.TOKEN_URI());
        });
      });
    });
