const {
   createCipheriv,
   createDecipheriv,
   createHash,
   createHmac,
   pbkdf2,
   randomBytes
} = require("crypto");
const HKDF = require("futoin-hkdf");
const libsignal = require("libsignal");
const { promisify } = require("util");

const KEY_BUNDLE_TYPE = Buffer.from([5]);
const pbkdf2Promise = promisify(pbkdf2);

/** prefix version byte to the pub keys, required for some curve crypto functions */
const generateSignalPubKey = (pubKey) =>
   pubKey.length === 33 ? pubKey : Buffer.concat([KEY_BUNDLE_TYPE, pubKey]);

const Curve = {
   generateKeyPair: () => {
      const { pubKey, privKey } = libsignal.curve.generateKeyPair();
      return {
         private: Buffer.from(privKey),
         // remove version byte
         public: Buffer.from(pubKey.slice(1))
      };
   },
   sharedKey: (privateKey, publicKey) => {
      const shared = libsignal.curve.calculateAgreement(
         generateSignalPubKey(publicKey),
         privateKey
      );
      return Buffer.from(shared);
   },
   sign: (privateKey, buf) => libsignal.curve.calculateSignature(privateKey, buf),
   verify: (pubKey, message, signature) => {
      try {
         libsignal.curve.verifySignature(
            generateSignalPubKey(pubKey),
            message,
            signature
         );
         return true;
      } catch (error) {
         return false;
      }
   }
};

const signedKeyPair = (identityKeyPair, keyId) => {
   const preKey = Curve.generateKeyPair();
   const pubKey = generateSignalPubKey(preKey.public);

   const signature = Curve.sign(identityKeyPair.private, pubKey);

   return { keyPair: preKey, signature, keyId };
};

const GCM_TAG_LENGTH = 128 >> 3;

/**
* encrypt AES 256 GCM;
* where the tag tag is suffixed to the ciphertext
* */
function aesEncryptGCM(plaintext, key, iv, additionalData) {
   const cipher = createCipheriv("aes-256-gcm", key, iv);
   cipher.setAAD(additionalData);
   return Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
      cipher.getAuthTag()
   ]);
}

/**
* decrypt AES 256 GCM;
* where the auth tag is suffixed to the ciphertext
* */
function aesDecryptGCM(ciphertext, key, iv, additionalData) {
   const decipher = createDecipheriv("aes-256-gcm", key, iv);
   // decrypt additional adata
   const enc = ciphertext.slice(0, ciphertext.length - GCM_TAG_LENGTH);
   const tag = ciphertext.slice(ciphertext.length - GCM_TAG_LENGTH);
   // set additional data
   decipher.setAAD(additionalData);
   decipher.setAuthTag(tag);

   return Buffer.concat([decipher.update(enc), decipher.final()]);
}

function aesEncryptCTR(plaintext, key, iv) {
   const cipher = createCipheriv("aes-256-ctr", key, iv);
   return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}

function aesDecryptCTR(ciphertext, key, iv) {
   const decipher = createDecipheriv("aes-256-ctr", key, iv);
   return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** decrypt AES 256 CBC; where the IV is prefixed to the buffer */
function aesDecrypt(buffer, key) {
   return aesDecryptWithIV(
      buffer.slice(16, buffer.length),
      key,
      buffer.slice(0, 16)
   );
}

/** decrypt AES 256 CBC */
function aesDecryptWithIV(buffer, key, IV) {
   const aes = createDecipheriv("aes-256-cbc", key, IV);
   return Buffer.concat([aes.update(buffer), aes.final()]);
}

// encrypt AES 256 CBC; where a random IV is prefixed to the buffer
function aesEncrypt(buffer, key) {
   const IV = randomBytes(16);
   const aes = createCipheriv("aes-256-cbc", key, IV);
   return Buffer.concat([IV, aes.update(buffer), aes.final()]); // prefix IV to the buffer
}

// encrypt AES 256 CBC with a given IV
function aesEncrypWithIV(buffer, key, IV) {
   const aes = createCipheriv("aes-256-cbc", key, IV);
   return Buffer.concat([aes.update(buffer), aes.final()]); // prefix IV to the buffer
}

// sign HMAC using SHA 256
function hmacSign(buffer, key, variant = "sha256") {
   return createHmac(variant, key).update(buffer).digest();
}

function sha256(buffer) {
   return createHash("sha256").update(buffer).digest();
}

function md5(buffer) {
   return createHash("md5").update(buffer).digest();
}

// HKDF key expansion
function hkdf(buffer, expandedLength, info) {
   return HKDF(
      !Buffer.isBuffer(buffer) ? Buffer.from(buffer) : buffer,
      expandedLength,
      info
   );
}

async function derivePairingCodeKey(pairingCode, salt) {
   return await pbkdf2Promise(pairingCode, salt, 2 << 16, 32, "sha256");
}

module.exports = {
   generateSignalPubKey,
   Curve,
   signedKeyPair,
   aesEncryptGCM,
   aesDecryptGCM,
   aesEncryptCTR,
   aesDecryptCTR,
   aesDecrypt,
   aesDecryptWithIV,
   aesEncrypt,
   aesEncrypWithIV,
   hmacSign,
   sha256,
   md5,
   hkdf,
   derivePairingCodeKey
};
