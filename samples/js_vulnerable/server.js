const crypto = require('crypto');

function setupCrypto() {
    // Legacy RSA key generation
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
    });

    // AES-128-CBC cipher
    const cipher = crypto.createCipheriv('aes-128-cbc', key, iv);

    // Broken MD5 hashing
    const hash = crypto.createHash('md5').update('secret').digest('hex');
}
