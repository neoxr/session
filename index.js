const { Client } = require('pg')
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

const usePostgresAuthState = async (dbConfig, customTableName = 'auth_data', maxAge = 24 * 60 * 60 * 1000) => {
   const { proto, initAuthCreds, BufferJSON } = await checkAndRequireModules()

   const client = new Client(dbConfig)
   await client.connect()

   // Buat tabel dengan kolom tambahan untuk waktu pembuatan
   await client.query(`
      CREATE TABLE IF NOT EXISTS ${customTableName} (
         key TEXT PRIMARY KEY,
         value TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
   `)

   const readData = async (key) => {
      const res = await client.query(`SELECT value FROM ${customTableName} WHERE key = $1`, [key])
      return res.rows.length > 0 ? JSON.parse(res.rows[0].value, BufferJSON.reviver) : null
   }

   const writeData = async (key, value) => {
      const data = JSON.stringify(value, BufferJSON.replacer)
      await client.query(
         `INSERT INTO ${customTableName} (key, value, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = $2, created_at = CURRENT_TIMESTAMP`,
         [key, data]
      )
   }

   const removeData = async (key) => {
      await client.query(`DELETE FROM ${customTableName} WHERE key = $1`, [key])
   }

   const deleteCreds = async () => {
      await client.query(`DELETE FROM ${customTableName}`)
   }

   const autoDeleteOldData = async () => {
      if (maxAge) {
         const cutoffDate = new Date(Date.now() - maxAge)
         await client.query(
            `DELETE FROM ${customTableName} 
            WHERE created_at < $1 AND key NOT LIKE 'app-state%'`,
            [cutoffDate]
         )
      }
   }

   const creds = (await readData('creds')) || initAuthCreds()

   // Hapus data lama jika maxAge diberikan
   if (maxAge) {
      await autoDeleteOldData()
   }

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

module.exports = { usePostgresAuthState }