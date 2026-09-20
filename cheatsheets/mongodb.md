# MongoDB Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (`mongosh`, CRUD, indexes, aggregation, ops).  
**Audience:** Engineers who need MongoDB commands fast (document NoSQL).  
**Notes:** Examples target MongoDB 6+/7+ with `mongosh`. Shell helpers differ slightly from drivers.

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [mongosh essentials](#2-mongosh-essentials)
3. [Databases & collections](#3-databases--collections)
4. [Documents — insert](#4-documents--insert)
5. [Documents — find / query](#5-documents--find--query)
6. [Documents — update / delete](#6-documents--update--delete)
7. [Indexes](#7-indexes)
8. [Aggregation](#8-aggregation)
9. [Users, roles & auth](#9-users-roles--auth)
10. [Import / export](#10-import--export)
11. [Stats & sizes](#11-stats--sizes)
12. [Sessions, transactions & change streams](#12-sessions-transactions--change-streams)
13. [Backup & restore](#13-backup--restore)
14. [Config, replica set & sharding](#14-config-replica-set--sharding)
15. [Profiling, explain & useful ops](#15-profiling-explain--useful-ops)
16. [Tools & resources](#16-tools--resources)

Placeholders use `__name__` style. Replace them before running.

---

## 1. Connect & flags

```bash
# Local default (27017)
mongosh

# URI
mongosh "mongodb://__user__:__pass__@__host__:27017/__db__"
mongosh "mongodb+srv://__user__:__pass__@__cluster__/__db__"   # Atlas

# Auth DB often = admin
mongosh -u __user__ -p --authenticationDatabase admin

# Eval one command
mongosh __db__ --eval 'db.orders.countDocuments({})'

# File
mongosh __db__ script.js
```

Legacy `mongo` shell is deprecated — use **`mongosh`**.

---

## 2. mongosh essentials

| Action | Command |
| --- | --- |
| Show help | `help` / `db.help()` / `db.orders.help()` |
| Current DB | `db` |
| Switch DB | `use __db__` |
| Show DBs | `show dbs` |
| Show collections | `show collections` |
| Exit | `exit` / `quit` |
| Load JS | `load('script.js')` |
| Pretty | `db.orders.find().pretty()` (often default) |

```javascript
db.version()
db.hello()                 // topology / primary info (replaces isMaster)
db.runCommand({ ping: 1 })
```

---

## 3. Databases & collections

```javascript
show dbs
use shop                   // creates on first write
db.getName()

db.createCollection('orders')
db.createCollection('capped_logs', { capped: true, size: 1048576, max: 1000 })
db.orders.renameCollection('customer_orders')
db.orders.drop()
db.dropDatabase()

show collections
db.getCollectionNames()
db.orders.exists()         // mongosh helper; or listCollections
```

Collections are schema-flexible; validation optional:

```javascript
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email'],
      properties: {
        email: { bsonType: 'string' },
        age: { bsonType: 'int', minimum: 0 }
      }
    }
  },
  validationLevel: 'moderate'
})
```

---

## 4. Documents — insert

```javascript
db.orders.insertOne({
  customerId: 1,
  total: 49.9,
  status: 'new',
  createdAt: new Date()
})

db.orders.insertMany([
  { customerId: 1, total: 10 },
  { customerId: 2, total: 20 }
], { ordered: true })

// Upsert-style insert via update (see update section)
```

`_id` auto-generated as `ObjectId` if omitted.

```javascript
ObjectId()
ObjectId('66f1a2b3c4d5e6f7a8b9c0d1').getTimestamp()
```

---

## 5. Documents — find / query

```javascript
db.orders.find()
db.orders.find({ status: 'new' })
db.orders.findOne({ _id: ObjectId('...') })
db.orders.find({ total: { $gt: 20, $lte: 100 } })
db.orders.find({ status: { $in: ['new', 'paid'] } })
db.orders.find({ tags: 'redis' })                  // array contains
db.orders.find({ tags: { $all: ['a', 'b'] } })
db.orders.find({ 'address.city': 'Tehran' })       // nested field

// Projection
db.orders.find({ status: 'new' }, { total: 1, customerId: 1 })
db.orders.find({}, { _id: 0, status: 1 })

// Sort / skip / limit
db.orders.find().sort({ createdAt: -1 }).limit(10).skip(20)

// Count / distinct / exists
db.orders.countDocuments({ status: 'new' })
db.orders.estimatedDocumentCount()
db.orders.distinct('status')
db.orders.find({ email: { $exists: true } })

// Regex / text-ish
db.orders.find({ name: /ada/i })
db.orders.find({ $text: { $search: 'blue shoes' } })  // needs text index

// Comparison & logic
// $eq $ne $gt $gte $lt $lte $in $nin $and $or $nor $not $elemMatch $size $type
db.orders.find({
  $or: [{ status: 'new' }, { total: { $gt: 100 } }]
})
```

Cursor helpers: `.toArray()`, `.forEach()`, `.next()`, `.hasNext()`.

---

## 6. Documents — update / delete

```javascript
// Update operators: $set $unset $inc $mul $min $max $rename $push $pull $addToSet $pop $currentDate
db.orders.updateOne(
  { _id: ObjectId('...') },
  { $set: { status: 'shipped' }, $currentDate: { updatedAt: true } }
)

db.orders.updateMany(
  { status: 'new' },
  { $set: { status: 'open' } }
)

db.orders.replaceOne(
  { _id: ObjectId('...') },
  { customerId: 1, total: 99, status: 'replaced' }
)

// Upsert
db.counters.updateOne(
  { _id: 'order' },
  { $inc: { seq: 1 } },
  { upsert: true }
)

// Find and modify
db.orders.findOneAndUpdate(
  { status: 'new' },
  { $set: { status: 'processing' } },
  { sort: { createdAt: 1 }, returnDocument: 'after' }
)

db.orders.deleteOne({ _id: ObjectId('...') })
db.orders.deleteMany({ status: 'cancelled' })
db.orders.findOneAndDelete({ status: 'new' })
```

Array updates:

```javascript
db.users.updateOne({ _id: 1 }, { $push: { tags: 'vip' } })
db.users.updateOne({ _id: 1 }, { $addToSet: { tags: 'vip' } })
db.users.updateOne({ _id: 1 }, { $pull: { tags: 'old' } })
db.users.updateOne(
  { _id: 1, 'items.sku': 'A' },
  { $set: { 'items.$.qty': 3 } }          // positional
)
```

---

## 7. Indexes

```javascript
db.orders.createIndex({ customerId: 1 })
db.orders.createIndex({ status: 1, createdAt: -1 })
db.orders.createIndex({ email: 1 }, { unique: true })
db.orders.createIndex({ name: 'text', description: 'text' })
db.orders.createIndex({ loc: '2dsphere' })
db.orders.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 3600 }            // TTL index
)
db.orders.createIndex(
  { customerId: 1 },
  { partialFilterExpression: { status: 'active' } }
)

db.orders.getIndexes()
db.orders.dropIndex('customerId_1')
db.orders.dropIndexes()

// Build options
db.orders.createIndex({ a: 1 }, { background: true })  // legacy; modern builds are concurrent
```

Hidden index (test without dropping):

```javascript
db.orders.createIndex({ x: 1 }, { hidden: true })
db.runCommand({ collMod: 'orders', index: { keyPattern: { x: 1 }, hidden: false } })
```

---

## 8. Aggregation

```javascript
db.orders.aggregate([
  { $match: { status: 'paid' } },
  { $group: { _id: '$customerId', total: { $sum: '$total' }, n: { $sum: 1 } } },
  { $sort: { total: -1 } },
  { $limit: 10 }
])
```

Common stages: `$match` `$project` `$addFields` `$unset` `$group` `$sort` `$limit` `$skip` `$lookup` `$unwind` `$facet` `$count` `$out` `$merge` `$setWindowFields`.

```javascript
// Join-like
db.orders.aggregate([
  {
    $lookup: {
      from: 'customers',
      localField: 'customerId',
      foreignField: '_id',
      as: 'customer'
    }
  },
  { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } }
])

// Write results
{ $out: 'orders_report' }          // replace collection
{ $merge: { into: 'stats', whenMatched: 'merge', whenNotMatched: 'insert' } }
```

Explain aggregation: `db.orders.explain('executionStats').aggregate([...])`.

---

## 9. Users, roles & auth

```javascript
use admin
db.createUser({
  user: 'app',
  pwd: 'secret',
  roles: [
    { role: 'readWrite', db: 'shop' },
    { role: 'read', db: 'analytics' }
  ]
})

db.updateUser('app', { pwd: 'newsecret' })
db.changeUserPassword('app', 'newsecret')
db.dropUser('app')
db.getUsers()
db.auth('app', 'secret')

db.grantRolesToUser('app', [{ role: 'dbAdmin', db: 'shop' }])
db.revokeRolesFromUser('app', [{ role: 'dbAdmin', db: 'shop' }])
```

Built-in roles (examples): `read`, `readWrite`, `dbAdmin`, `userAdmin`, `clusterAdmin`, `root`.

Custom role:

```javascript
db.createRole({
  role: 'orderReader',
  privileges: [{
    resource: { db: 'shop', collection: 'orders' },
    actions: ['find']
  }],
  roles: []
})
```

---

## 10. Import / export

```bash
# JSON / JSONL
mongoexport --uri="mongodb://localhost/shop" -c orders -o orders.json --jsonArray
mongoimport --uri="mongodb://localhost/shop" -c orders --file orders.json --jsonArray

# CSV
mongoexport -d shop -c orders --type=csv --fields customerId,total,status -o orders.csv
mongoimport -d shop -c orders --type=csv --headerline --file orders.csv

# BSON dump (preferred for binary fidelity)
mongodump --uri="mongodb://localhost/shop" -o backup/
mongorestore --uri="mongodb://localhost" backup/
```

---

## 11. Stats & sizes

```javascript
db.stats()
db.orders.stats()
db.orders.totalIndexSize()
db.orders.storageSize()
db.orders.dataSize()
db.orders.estimatedDocumentCount()

db.runCommand({ collStats: 'orders', scale: 1024*1024 })
db.serverStatus()
db.serverStatus().connections
db.serverStatus().mem
```

---

## 12. Sessions, transactions & change streams

Multi-document ACID needs **replica set** (or sharded cluster / Atlas):

```javascript
session = db.getMongo().startSession()
session.startTransaction()
try {
  const orders = session.getDatabase('shop').orders
  orders.insertOne({ customerId: 1, total: 10 }, { session })
  session.commitTransaction()
} catch (e) {
  session.abortTransaction()
  throw e
} finally {
  session.endSession()
}
```

Change streams (replica set):

```javascript
const cursor = db.orders.watch([
  { $match: { 'operationType': { $in: ['insert', 'update'] } } }
])
while (!cursor.isClosed()) {
  let next = cursor.tryNext()
  if (next) printjson(next)
}
```

---

## 13. Backup & restore

```bash
mongodump --uri="mongodb://..." --gzip --archive=shop.gz
mongorestore --uri="mongodb://..." --gzip --archive=shop.gz

mongodump -d shop -c orders -o dump/
mongorestore -d shop --drop dump/shop

# Atlas / ops: use Cloud Backup, snapshots, PITR where available
```

Filesystem snapshots of `dbPath` only when done correctly (WiredTiger + consistent snapshot tools). Prefer `mongodump` / managed backups for most apps.

---

## 14. Config, replica set & sharding

```javascript
// Replica set
rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] })
rs.status()
rs.conf()
rs.add('host2:27017')
rs.secondaryOk()              // legacy; prefer readPref
db.getMongo().setReadPref('secondaryPreferred')

// Sharding (mongos)
sh.status()
sh.enableSharding('shop')
db.orders.createIndex({ customerId: 1 })
sh.shardCollection('shop.orders', { customerId: 1 })
```

Config file (`mongod.conf`) essentials: `storage.dbPath`, `net.port`, `replication.replSetName`, `security.authorization`.

```bash
mongod --config /etc/mongod.conf
```

---

## 15. Profiling, explain & useful ops

```javascript
db.orders.find({ status: 'new' }).explain('executionStats')
db.setProfilingLevel(1, { slowms: 100 })   // 0 off, 1 slow, 2 all
db.getProfilingStatus()
db.system.profile.find().sort({ ts: -1 }).limit(5)

db.currentOp()
db.killOp(__opid__)

db.adminCommand({ getParameter: 1, wiredTigerConcurrentReadTransactions: 1 })
db.adminCommand({ getLog: 'global' })
```

Ops reminders (short):

- Model for **query patterns**, not only “normalize like SQL”.
- Always index filter + sort fields used in hot queries.
- Prefer `countDocuments` over deprecated `count()`.
- Use projection to cut payload.
- TTL indexes for expiring data (sessions, caches).
- Working set should fit RAM for low latency.
- Transactions: keep short; avoid in hot single-doc paths when unnecessary.
- Never leave open `find()` without limits on huge collections in shells/scripts.

---

## 16. Tools & resources

**Tools**

- `mongosh`, `mongodump` / `mongorestore`, `mongoexport` / `mongoimport`  
- MongoDB Compass — GUI  
- Atlas — managed MongoDB  

**Docs**

- [MongoDB Manual](https://www.mongodb.com/docs/manual/)  
- [CRUD](https://www.mongodb.com/docs/manual/crud/)  
- [Aggregation](https://www.mongodb.com/docs/manual/aggregation/)  
- [Indexes](https://www.mongodb.com/docs/manual/indexes/)

---

## Quick mental map

```
Database → Collection → Document (BSON)
mongosh  → use / show / find / update / aggregate
Ops      → indexes, explain, profile, dump/restore, rs/sh
```

---

## SQL ↔ MongoDB quick diffs

| SQL | MongoDB |
| --- | --- |
| Database | Database |
| Table | Collection |
| Row | Document |
| Column | Field |
| JOIN | `$lookup` / embed |
| WHERE | filter object / `$match` |
| GROUP BY | `$group` |
| INDEX | `createIndex` |
| PRIMARY KEY | `_id` |
| TRANSACTION | multi-doc txn (replica set) |

---

*Compiled for personal study use. Prefer mongosh + indexes + explain in daily work. Confirm features for your server version and deployment (standalone vs replica set vs Atlas).*
