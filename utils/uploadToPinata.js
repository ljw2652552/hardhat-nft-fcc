const pinataSDK = require("@pinata/sdk");
//yarn add --dev path
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const pinataAPIKey = process.env.PINATA_API_KEY;
const pinataAPISecret = process.env.PINATA_API_SECRET;
const pinata = pinataSDK(pinataAPIKey, pinataAPISecret);

async function storeImages(imageFilePath) {
  const fullImagesPath = path.resolve(imageFilePath);
  //console.log(fullImagesPath);
  const files = fs.readdirSync(fullImagesPath);
  //   console.log(files);
  let responses = [];
  console.log("Uploading to PINATA!");
  for (fileIndex in files) {
    console.log(`Working On ${fileIndex}...`);
    const readableStreamForFile = fs.createReadStream(
      `${fullImagesPath}/${files[fileIndex]}`
    );
    try {
      const response = await pinata.pinFileToIPFS(readableStreamForFile);
      responses.push(response);
    } catch (error) {
      console.log(error);
    }
  }
  return { responses, files };
}

async function storeTokenUriMetadata(metadata) {
  try {
    const response = await pinata.pinJSONToIPFS(metadata);
    return response;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { storeImages, storeTokenUriMetadata };
