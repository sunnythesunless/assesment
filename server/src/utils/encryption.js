const CryptoJS = require('crypto-js');
const { AES_SECRET } = require('../config/env');

/**
 * Encrypt data using AES-256
 * @param {object|string} data - Data to encrypt
 * @returns {string} Encrypted string
 */
const encrypt = (data) => {
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(text, AES_SECRET).toString();
};

/**
 * Decrypt AES-256 encrypted string
 * @param {string} ciphertext - Encrypted string
 * @returns {object|string} Decrypted data
 */
const decrypt = (ciphertext) => {
    const bytes = CryptoJS.AES.decrypt(ciphertext, AES_SECRET);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    try {
        return JSON.parse(decrypted);
    } catch {
        return decrypted;
    }
};

module.exports = { encrypt, decrypt };
