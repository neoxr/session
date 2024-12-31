const admin = require('firebase-admin')
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

const useFirebaseAuthState = async (firebaseConfig, customCollectionName = 'auth_data', maxAge = 24 * 60 * 60 * 1000) => {
   const { proto, initAuthCreds, BufferJSON } = await checkAndRequireModules()

   // Initialize Firebase admin SDK
   if (!admin.apps.length) {
      admin.initializeApp({
         credential: admin.credential.cert(firebaseConfig)
      })
   }

   const firestore = admin.firestore()
   const collection = firestore.collection(customCollectionName)
   const getCollection = (name) => firestore.collection(name)

   const readData = async (key) => {
      const doc = await collection.doc(key).get()
      if (doc.exists) {
         const { value } = doc.data()
         return JSON.parse(value, BufferJSON.reviver)
      }
      return null
   }

   const writeData = async (key, value) => {
      const data = JSON.stringify(value, BufferJSON.replacer)
      await collection.doc(key).set({ value: data, timestamp: Date.now() })
   }

   const removeData = async (key) => {
      await collection.doc(key).delete()
   }

   const autoDeleteOldData = async () => {
      if (!maxAge) return

      const currentTime = Date.now()
      const snapshot = await collection.get()
      const deleteTasks = []

      snapshot.forEach((doc) => {
         const { timestamp } = doc.data()
         const key = doc.id

         if (key === 'creds' || key.startsWith('app-state')) {
            return
         }

         if (timestamp && currentTime - timestamp > maxAge) {
            deleteTasks.push(doc.ref.delete())
         }
      })

      await Promise.all(deleteTasks)
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
      getCreds: async (collectionName = customCollectionName) => {
         const credsData = await readData('creds', getCollection(collectionName))
         if (credsData) {
            return credsData
         }
         return null
      },
      deleteCreds: async () => {
         const documents = await collection.listDocuments()
         const deleteTasks = documents.map((doc) => doc.delete())
         await Promise.all(deleteTasks)
      },
      autoDeleteOldData
   }
}

module.exports = { useFirebaseAuthState }