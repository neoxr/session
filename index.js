const { MongoClient } = require('mongodb')
const fs = require('node:fs').promises

const baileys = Object.freeze({
   1: 'baileys',
   2: '@neoxr/baileys',
   3: '@whiskeysockets/baileys',
   4: '@adiwajshing/baileys'
})

async function checkAndRequireModules() {
   for (const lib in baileys) {
      try {
         const modulePath = `./node_modules/${baileys[lib]}`
         await fs.access(modulePath)
         const module = require(baileys[lib])
         const { proto, initAuthCreds, BufferJSON } = module
         return { proto, initAuthCreds, BufferJSON }
      } catch (error) {
         continue
      }
   }
   return { proto: null, initAuthCreds: null, BufferJSON: null }
}

const useMongoAuthState = async (dbUrl, dbName, maxAge = 24 * 60 * 60 * 1000) => {
   const { proto, initAuthCreds, BufferJSON } = await checkAndRequireModules()

   const client = new MongoClient(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true })
   await client.connect()
   const db = client.db(dbName)
   const authCollection = db.collection('auth_data')

   const readData = async (key) => {
      const doc = await authCollection.findOne({ key })
      return doc ? JSON.parse(doc.value, BufferJSON.reviver) : null
   }

   const writeData = async (key, value) => {
      const data = JSON.stringify(value, BufferJSON.replacer)
      await authCollection.updateOne(
         { key },
         {
            $set: {
               key,
               value: data,
               timestamp: new Date()
            }
         },
         { upsert: true }
      )
   }

   const removeData = async (key) => {
      await authCollection.deleteOne({ key })
   }

   const deleteCreds = async () => {
      await authCollection.deleteMany({})
   }

   const autoDeleteOldData = async () => {
      const cutoffTime = new Date(Date.now() - maxAge)
      await authCollection.deleteMany({
         timestamp: { $lte: cutoffTime },
         $and: [
            { key: { $ne: 'creds' } },
            { key: { $not: /^app-state/ } }
         ]
      })
   }

   const creds = (await readData('creds')) || initAuthCreds()

   return {
      state: {
         creds,
         keys: {
            get: async (type, ids) => {
               const data = {}
               await Promise.all(
                  ids.map(async (id) => {
                     let value = await readData(`${type}-${id}`)
                     if (type === 'app-state-sync-key' && value) {
                        value = proto.Message.AppStateSyncKeyData.fromObject(value)
                     }
                     data[id] = value
                  })
               )
               return data
            },
            set: async (data) => {
               const tasks = []
               for (const category in data) {
                  for (const id in data[category]) {
                     const value = data[category][id]
                     const key = `${category}-${id}`
                     tasks.push(value ? writeData(key, value) : removeData(key))
                  }
               }
               await Promise.all(tasks)
            }
         }
      },
      saveCreds: () => {
         return writeData('creds', creds)
      },
      deleteCreds,
      autoDeleteOldData
   }
}

module.exports = { useMongoAuthState }