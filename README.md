## BAILEYS SESSION

> Saving multi session baileys into an external database to save resources.

### Baileys Module Supported

- [x] baileys [npm](https://www.npmjs.com/package/baileys)
- [x] @whiskeysockets/baileys [npm](https://www.npmjs.com/package/@whiskeysockets/baileys)
- [x] @neoxr/baileys [npm](https://www.npmjs.com/package/@neoxr/baileys)  (Recommended)

### Database Provider

- [x] PostgreSQL
- [x] SQL Lite
- [x] MongoDB
- [x] Firebase (Firestore)

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
   const { state, saveCreds, deleteCreds } = await usePostgresAuthState('postgres://xxxxx', 'session')
   
   const client = makeWASocket({
      // your configuration
   })
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
   const { state, saveCreds, deleteCreds } = await useSQLiteAuthState('session.db', 'session')
   
   const client = makeWASocket({
      // your configuration
   })
   
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
   const { state, saveCreds, deleteCreds } = await useMongoAuthState('mongodb://xxxxx', 'session')
   
   const client = makeWASocket({
      // your configuration
   })
   
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
   const { state, saveCreds, deleteCreds } = await useFirebaseAuthState(, 'session')
   
   const client = makeWASocket({
      // your configuration
   })
   
   // your code ...
}
```

