## BAILEYS SESSION

> Saving multi session baileys into an external database to save resources.

### Baileys Module Supported

- [x] baileys [npm](https://www.npmjs.com/package/baileys)
- [x] @whiskeysockets/baileys [npm](https://www.npmjs.com/package/@whiskeysockets/baileys)
- [x] @neoxr/baileys [npm](https://www.npmjs.com/package/@neoxr/baileys)  (Recommended)

### Database Provider

- [x] PostgreSQL
- [x] SQL Lite (Recommended)
- [x] MongoDB
- [x] Firebase (Firestore) (Recommended)

### Installation

> The following is the installation for each database.

### PostgreSQL

Add this to dependencies ```package.json``` :

```JSON
"session": "github:neoxr/session#postgresql" 
```

Then call the default function in your bot connection file

```Javascript
const { usePostgresAuthState } = require('session')

async function start() {
   const { state, saveCreds, deleteCreds, autoDeleteOldData } = await usePostgresAuthState('postgres://xxxxx', 'session', 5 * 60 * 60 * 1000) // set maxAge default 24 hours, but this example is 5 hours
   
   const client = makeWASocket({
      // your configuration
   })
   
   client.ev.on('connection.update', async (session) => {
      if (session.reason === 401) {
         await deleteCreds()
         throw new Error('Device Logout')
      }
   })
   
   client.ev.on('creds.update', saveCreds)
   
   setInterval(async () => {
      await autoDeleteOldData()
   }, 1 * 60 * 60 * 1000) // checking every 1 hour
   
   // your code ...
}
```

### SQL Lite

Add this to dependencies ```package.json``` :

```JSON
"session": "github:neoxr/session#sqlite" 
```

Then call the default function in your bot connection file

```Javascript
const { useSQLiteAuthState } = require('session')

async function start() {
   const { state, saveCreds, deleteCreds, autoDeleteOldData } = await useSQLiteAuthState('session.db', 'session', 5 * 60 * 60 * 1000) // set maxAge default 24 hours, but this example is 5 hours
   
   const client = makeWASocket({
      // your configuration
   })
   
   client.ev.on('connection.update', async (session) => {
      if (session.reason === 401) {
         await deleteCreds()
         throw new Error('Device Logout')
      }
   })
   
   client.ev.on('creds.update', saveCreds)
   
   setInterval(async () => {
      await autoDeleteOldData()
   }, 1 * 60 * 60 * 1000) // checking every 1 hour
   
   // your code ...
}
```

### MongoDB

Add this to dependencies ```package.json``` :

```JSON
"session": "github:neoxr/session#mongo" 
```

Then call the default function in your bot connection file

```Javascript
const { useMongoAuthState } = require('session')

async function start() {
   const { state, saveCreds, deleteCreds, autoDeleteOldData } = await useMongoAuthState('mongodb://xxxxx', 'session', 5 * 60 * 60 * 1000) // set maxAge default 24 hours, but this example is 5 hours
   
   const client = makeWASocket({
      // your configuration
   })
   
   client.ev.on('connection.update', async (session) => {
      if (session.reason === 401) {
         await deleteCreds()
         throw new Error('Device Logout')
      }
   })
   
   client.ev.on('creds.update', saveCreds)
   
   setInterval(async () => {
      await autoDeleteOldData()
   }, 1 * 60 * 60 * 1000) // checking every 1 hour
   
   // your code ...
}
```

### Firebase (Firestore)

Add this to dependencies ```package.json``` :

```JSON
"session": "github:neoxr/session#firebase" 
```

Then call the default function in your bot connection file

```Javascript
const { useFirebaseAuthState } = require('session')
const fs = require('fs')
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase.json', 'utf-8))

async function start() {
   const { state, saveCreds, deleteCreds } = await useFirebaseAuthState(firebaseConfig, 'session', 5 * 60 * 60 * 1000) // set maxAge default 24 hours, but this example is 5 hours
   
   const client = makeWASocket({
      // your configuration
   })
   
   client.ev.on('connection.update', async (session) => {
      if (session.reason === 401) {
         await deleteCreds()
         throw new Error('Device Logout')
      }
   })
   
   client.ev.on('creds.update', saveCreds)
   
   setInterval(async () => {
      await autoDeleteOldData()
   }, 1 * 60 * 60 * 1000) // checking every 1 hour
   
   // your code ...
}
```

## Explanation

**Notes** :
+ ```deleteCreds``` : used when the device logout or certain conditions require re-pairing

+ ```autoDeleteOldData``` : used to delete sessions by excluding creds and app-state-sync


> If there is an error make an issue, this script was made by [neoxr](https://github.com/neoxr/session) and I hope this script is useful for everyone.