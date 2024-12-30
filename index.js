const sqlite3 = require('sqlite3').verbose()
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

const useSQLiteAuthState = async (dbPath, maxAge = 24 * 60 * 60 * 1000) => {
   const { proto, initAuthCreds, BufferJSON } = await checkAndRequireModules()
   const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
         console.error("Error opening SQLite database:", err.message)
      }
   })

   await new Promise((resolve, reject) => {
      db.run(`
            CREATE TABLE IF NOT EXISTS auth_data (
                key TEXT PRIMARY KEY,
                value TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )
        `, (err) => {
         if (err) reject(err)
         resolve()
      })
   })

   const writeData = (key, value) => {
      const data = JSON.stringify(value, BufferJSON.replacer)
      return new Promise((resolve, reject) => {
         db.run(
            `INSERT OR REPLACE INTO auth_data (key, value, created_at) VALUES (?, ?, strftime('%s', 'now'))`,
            [key, data],
            (err) => {
               if (err) reject(err)
               resolve()
            }
         )
      })
   }

   const readData = (key) => {
      return new Promise((resolve, reject) => {
         db.get(`SELECT value FROM auth_data WHERE key = ?`, [key], (err, row) => {
            if (err) reject(err)
            resolve(row ? JSON.parse(row.value, BufferJSON.reviver) : null)
         })
      })
   }

   const removeData = (key) => {
      return new Promise((resolve, reject) => {
         db.run(`DELETE FROM auth_data WHERE key = ?`, [key], (err) => {
            if (err) reject(err)
            resolve()
         })
      })
   }

   const deleteCreds = async () => {
      await removeData('creds')
   }

   const autoDeleteOldData = async () => {
      const cutoffTime = Math.floor(Date.now() / 1000) - Math.floor(maxAge / 1000)
      await new Promise((resolve, reject) => {
         db.run(
            `
               DELETE FROM auth_data
               WHERE created_at < ? AND key != 'creds' AND key NOT LIKE 'app-state%'
            `,
            [cutoffTime],
            (err) => {
               if (err) reject(err)
               resolve()
            }
         )
      })
   }

   const creds = (await readData('creds')) || initAuthCreds()

   // Memanggil auto-delete jika maxAge diberikan
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

module.exports = { useSQLiteAuthState }