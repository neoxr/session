const { MongoClient } = require("mongodb");
const AsyncLock = require("async-lock");
const { initAuthCreds } = require("./auth-utils");
const { fromObject } = require("../Utils");

const fileLock = new AsyncLock({ maxPending: Infinity });

let db = null;
let isConnected = false;

// Helper untuk serialisasi Buffer menjadi string base64
const serialize = (data) => {
    if (Buffer.isBuffer(data)) {
        return `Buffer:${data.toString("base64")}`;
    } else if (Array.isArray(data)) {
        return data.map(item => serialize(item));
    } else if (typeof data === "object" && data !== null) {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = serialize(value);
        }
        return result;
    }
    return data;
};

// Helper untuk deserialisasi string base64 menjadi Buffer
const deserialize = (data) => {
    if (typeof data === "string" && data.startsWith("Buffer:")) {
        return Buffer.from(data.slice(7), "base64");
    } else if (Array.isArray(data)) {
        return data.map(item => deserialize(item));
    } else if (typeof data === "object" && data !== null) {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = deserialize(value);
        }
        return result;
    }
    return data;
};

const useMongoAuthState = async (mongoURI) => {
    if (!isConnected) {
        const client = new MongoClient(mongoURI, { useUnifiedTopology: true });
        await client.connect();
        db = client.db(); // Gunakan database default
        isConnected = true;
    }

    const cache = new Map();

    const writeData = async (data, file) => {
        const id = file.replace(/\//g, "__").replace(/:/g, "-");
        await fileLock.acquire(id, async () => {
            const collection = db.collection("sessions");
            await collection.updateOne(
                { _id: id },
                { $set: { value: serialize(data), createdAt: new Date() } },
                { upsert: true }
            );
        });
        cache.set(id, data);
    };

    const readData = async (file) => {
        const id = file.replace(/\//g, "__").replace(/:/g, "-");
        if (cache.has(id)) {
            return cache.get(id);
        }
        try {
            const collection = db.collection("sessions");
            const doc = await fileLock.acquire(id, () =>
                collection.findOne({ _id: id })
            );
            const data = doc ? deserialize(doc.value) : null;
            if (data) {
                cache.set(id, data);
            }
            return data;
        } catch (error) {
            console.error(`Error reading data from ${file}:`, error);
            return null;
        }
    };

    const removeData = async (file) => {
        const id = file.replace(/\//g, "__").replace(/:/g, "-");
        await fileLock.acquire(id, async () => {
            const collection = db.collection("sessions");
            await collection.deleteOne({ _id: id });
        });
        cache.delete(id);
    };

    const clearAll = async () => {
        const collection = db.collection("sessions");
        await collection.deleteMany({});
        cache.clear();
    };

    const clearKeys = async () => {
        const creds = await readData("creds");
        const collection = db.collection("sessions");
        await collection.deleteMany({ _id: { $ne: "creds" } });
        cache.clear();
        if (creds) {
            cache.set("creds", creds);
        }
    };

    const creds = (await readData("creds")) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(
                        ids.map(async id => {
                            let value = await readData(`${type}-${id}`);
                            if (type === "app-state-sync-key" && value) {
                                value = fromObject(value);
                            }
                            data[id] = value;
                        })
                    );
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const file = `${category}-${id}`;
                            tasks.push(
                                value
                                    ? writeData(value, file)
                                    : removeData(file)
                            );
                        }
                    }
                    await Promise.allSettled(tasks);
                }
            }
        },
        saveCreds: () => {
            return writeData(creds, "creds");
        },
        clearAll,
        clearKeys
    };
};

module.exports = { useMongoAuthState };
