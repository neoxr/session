const { Curve, signedKeyPair } = require("./crypto");
const { randomBytes } = require("crypto");
const { v4: uuidv4 } = require("uuid");

/**
 * Generate a registration ID.
 * @returns {number}
 */
const generateRegistrationId = () => {
    return Uint16Array.from(randomBytes(2))[0] & 16383;
};

/**
 * Initialize authentication credentials.
 * @returns {AuthenticationCreds}
 */
const initAuthCreds = () => {
    const identityKey = Curve.generateKeyPair();
    return {
        noiseKey: Curve.generateKeyPair(),
        pairingEphemeralKeyPair: Curve.generateKeyPair(),
        signedIdentityKey: identityKey,
        signedPreKey: signedKeyPair(identityKey, 1),
        registrationId: generateRegistrationId(),
        advSecretKey: randomBytes(32).toString("base64"),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSyncCounter: 0,
        accountSettings: {
            unarchiveChats: false
        },
        // mobile creds
        deviceId: Buffer.from(uuidv4().replace(/-/g, ""), "hex").toString(
            "base64url"
        ),
        phoneId: uuidv4(),
        identityId: randomBytes(20),
        registered: false,
        backupToken: randomBytes(20),
        registration: {},
        pairingCode: undefined,
        lastPropHash: undefined,
        routingInfo: undefined
    };
};

module.exports = {
    generateRegistrationId,
    initAuthCreds
};
