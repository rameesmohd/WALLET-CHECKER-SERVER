const CryptoJS = require('crypto-js');
const dotenv = require('dotenv');
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; 

const decryptData = async (encryptedData) => {
  try {
    const decodedData = decodeURIComponent(encryptedData);
    const bytes =CryptoJS.AES.decrypt(decodedData, ENCRYPTION_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

    try {
      return JSON.parse(decryptedData);
    } catch (jsonError) {
      console.error('Decrypted data is not valid JSON:', decryptedData);
      return null;
    }
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

module.exports = {decryptData};