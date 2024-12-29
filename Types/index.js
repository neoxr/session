const mongoose = require("mongoose");

/**
 * TypeScript type alias `Awaitable<T>` tidak relevan dalam CommonJS, jadi tidak diikutsertakan.
 */

// Contact typef
const Contact = {
   id: String,
   lid: String,
   name: String,
   notify: String,
   verifiedName: String,
   imgUrl: String,
   status: String,
};

// Account type
const Account = {
   details: Uint8Array,
   accountSignatureKey: Uint8Array,
   accountSignature: Uint8Array,
   deviceSignature: Uint8Array,
};

// SignedKeyPair type
const SignedKeyPair = {
   keyPair: Object, // Sesuaikan jika perlu
   signature: Uint8Array,
   keyId: Number,
   timestampS: Number,
};

// ProtocolAddress type
const ProtocolAddress = {
   name: String,
   deviceId: Number,
};

// SignalIdentity type
const SignalIdentity = {
   identifier: ProtocolAddress,
   identifierKey: Uint8Array,
};

// LTHashState type
const LTHashState = {
   version: Number,
   hash: Buffer,
   indexValueMap: {
      [indexMacBase64]: { valueMac: Uint8Array },
   },
};

// SignalCreds type
const SignalCreds = {
   signedIdentityKey: Object,
   signedPreKey: SignedKeyPair,
   registrationId: Number,
};

// AccountSettings type
const AccountSettings = {
   unarchiveChats: Boolean,
   defaultDisappearingMode: {
      ephemeralExpiration: Number,
      ephemeralSettingTimestamp: Number,
   },
};

// SignalKeyStore type
const SignalKeyStore = {
   get: async function (type, ids) {
      return {}; // Isi sesuai dengan implementasi
   },
   set: async function (data) {
      // Isi sesuai dengan implementasi
   },
   clear: async function () {
      // Isi sesuai dengan implementasi
   },
};

// RegistrationOptions type
const RegistrationOptions = {
   phoneNumber: String,
   phoneNumberCountryCode: String,
   phoneNumberNationalNumber: String,
   phoneNumberMobileCountryCode: String,
   phoneNumberMobileNetworkCode: String,
   method: String,
   captcha: String,
};

// SslOptions type
const SslOptions = {
   pfx: String,
   key: String,
   passphrase: String,
   cert: String,
   ca: String,
   crl: String,
   ciphers: String,
   rejectUnauthorized: Boolean,
   minVersion: String,
   maxVersion: String,
   verifyIdentity: Boolean,
};

// Fingerprint type
const Fingerprint = {
   rawId: Number,
   currentIndex: Number,
   deviceIndexes: Array,
};

// AppDataSync type
const AppDataSync = {
   keyData: Uint8Array,
   fingerprint: Fingerprint,
   timestamp: Number,
};

// SignalDataTypeMap type
const SignalDataTypeMap = {
   "pre-key": Object, // Sesuaikan jika perlu
   session: Uint8Array,
   "sender-key": Uint8Array,
   "sender-key-memory": {},
   "app-state-sync-key": AppDataSync,
   "app-state-sync-version": LTHashState,
};

// SignalDataSet type
const SignalDataSet = {}; // Implementasikan sesuai kebutuhan

// KeyPair type
const KeyPair = {
   public: Uint8Array,
   private: Uint8Array,
};

// MongoDB Document Interface
class MongoData extends mongoose.Document {
   constructor() {
      super();
      this.value = [];
   }
}

// MongoDB Configuration
const MongoConfig = {
   tableName: "auth",
   retryRequestDelayMs: 200,
   maxRetries: 10,
   session: String,
};

// ValueReplacer type
const ValueReplacer = {
   data: Array,
   type: String,
};

// ValueReviver type
const ValueReviver = {
   data: String,
   type: String,
};

// AuthenticationState type
const AuthenticationState = {
   creds: Object,
   keys: SignalKeyStore,
};

// AuthenticationCreds type
const AuthenticationCreds = {
   noiseKey: KeyPair,
   pairingEphemeralKeyPair: KeyPair,
   advSecretKey: String,
   me: Contact,
   account: Account,
   signalIdentities: Array,
   myAppStateKeyId: String,
   firstUnuploadedPreKeyId: Number,
   nextPreKeyId: Number,
   lastAccountSyncTimestamp: Number,
   platform: String,
   processedHistoryMessages: [],
   accountSyncCounter: Number,
   accountSettings: AccountSettings,
   deviceId: String,
   phoneId: String,
   identityId: Buffer,
   registered: Boolean,
   backupToken: Buffer,
   registration: RegistrationOptions,
   pairingCode: String,
   lastPropHash: String,
   routingInfo: Buffer,
};

module.exports = {
   Contact,
   Account,
   SignedKeyPair,
   ProtocolAddress,
   SignalIdentity,
   LTHashState,
   SignalCreds,
   AccountSettings,
   SignalKeyStore,
   RegistrationOptions,
   SslOptions,
   Fingerprint,
   AppDataSync,
   SignalDataTypeMap,
   SignalDataSet,
   KeyPair,
   MongoData,
   MongoConfig,
   ValueReplacer,
   ValueReviver,
   AuthenticationState,
   AuthenticationCreds,
};
