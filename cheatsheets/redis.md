# Redis Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (`redis-cli`, data types, keys, persistence, ops).  
**Audience:** Engineers who need Redis commands fast (cache, sessions, queues, counters).  
**Notes:** Examples target Redis 6+/7+. ACL & some commands differ on Redis Cluster / managed Redis (ElastiCache, Memorystore, Upstash).

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [redis-cli essentials](#2-redis-cli-essentials)
3. [Keys & generic commands](#3-keys--generic-commands)
4. [Strings](#4-strings)
5. [Hashes](#5-hashes)
6. [Lists](#6-lists)
7. [Sets](#7-sets)
8. [Sorted sets (ZSET)](#8-sorted-sets-zset)
9. [Streams](#9-streams)
10. [Pub/Sub](#10-pubsub)
11. [Expiry, TTL & memory](#11-expiry-ttl--memory)
12. [Transactions, Lua & pipelines](#12-transactions-lua--pipelines)
13. [Users, ACL & security](#13-users-acl--security)
14. [Persistence, backup & replication](#14-persistence-backup--replication)
15. [Info, slowlog & useful ops](#15-info-slowlog--useful-ops)
16. [Tools & resources](#16-tools--resources)

Placeholders use `__name__` style. Replace them before running.

---

## 1. Connect & flags

```bash
# Local default (6379)
redis-cli

# Host / port / password / DB index
redis-cli -h __host__ -p 6379 -a '__password__' -n 0

# URI
redis-cli -u redis://:__password__@__host__:6379/0
redis-cli -u rediss://:__password__@__host__:6380/0   # TLS

# One-shot command
redis-cli PING
redis-cli SET greeting hello
redis-cli GET greeting

# Read from file / stdin
redis-cli < script.txt
redis-cli --pipe < bulk.txt

# Scan-friendly / big output
redis-cli --scan --pattern 'user:*'
redis-cli --bigkeys
redis-cli --memkeys
redis-cli --hotkeys          # needs LFU maxmemory-policy
redis-cli --latency
redis-cli --latency-history
redis-cli --stat
```

Inside CLI: `AUTH __password__` then `SELECT 0`.

DB indexes (`SELECT 0..15` by default) are **not** namespaces in Cluster — Cluster only uses DB `0`.

---

## 2. redis-cli essentials

| Action | Command / tip |
| --- | --- |
| Ping | `PING` → `PONG` |
| Quit | `QUIT` or `Ctrl+D` |
| Clear screen | `CLEAR` |
| Monitor all commands (debug) | `MONITOR` — expensive; prod caution |
| Subscribe mode | `SUBSCRIBE __channel__` — blocking |
| Raw / CSV mode | `redis-cli --raw` / `--csv` |
| Replica read | `redis-cli --replica` (when applicable) |
| Cluster mode | `redis-cli -c` (follow redirects) |

Help:

```text
HELP @string
HELP SET
COMMAND DOCS SET
COMMAND GETKEYS SET a b
```

---

## 3. Keys & generic commands

```text
EXISTS __key__
TYPE __key__
DEL __key__ [__key__ ...]
UNLINK __key__                 # async delete (prefer for big keys)
RENAME __old__ __new__
RENAMENX __old__ __new__
COPY __src__ __dest__ [DB n] [REPLACE]   # Redis 6.2+
RANDOMKEY
TOUCH __key__                  # update LRU without reading
```

Scan (never use `KEYS *` in production):

```text
SCAN 0 MATCH user:* COUNT 100
KEYS user:*                    # blocking — DEV ONLY
```

Dump / restore binary value:

```text
DUMP __key__
RESTORE __key__ 0 __payload__ REPLACE
```

Move between DBs (standalone only):

```text
MOVE __key__ 1
SELECT 1
```

Object introspection:

```text
OBJECT ENCODING __key__
OBJECT IDLETIME __key__
OBJECT FREQ __key__            # with LFU policy
OBJECT REFCOUNT __key__
MEMORY USAGE __key__
```

---

## 4. Strings

Cache values, counters, feature flags, serialized JSON blobs.

```text
SET __key__ __value__
SET __key__ __value__ EX 60            # expire seconds
SET __key__ __value__ PX 60000         # expire ms
SET __key__ __value__ EXAT __unix__    # expire at unix seconds
SET __key__ __value__ NX               # set if Not eXists
SET __key__ __value__ XX               # set if eXists
SET __key__ __value__ GET              # set and return old (6.2+)
SET __key__ __value__ KEEPTTL

GET __key__
MGET k1 k2 k3
MSET k1 v1 k2 v2
MSETNX k1 v1 k2 v2

GETRANGE __key__ 0 3
SETRANGE __key__ 0 'Hi'
STRLEN __key__
APPEND __key__ '!'

GETDEL __key__                         # 6.2+
GETEX __key__ EX 30                    # get + set TTL

INCR __key__
INCRBY __key__ 10
INCRBYFLOAT __key__ 1.5
DECR __key__
DECRBY __key__ 3
```

Bit ops (bloom-ish / flags):

```text
SETBIT __key__ 7 1
GETBIT __key__ 7
BITCOUNT __key__
BITOP AND dest k1 k2
```

---

## 5. Hashes

Object fields without full JSON rewrite. Good for user profiles, configs.

```text
HSET user:1 name Ada email ada@ex.com
HSET user:1 age 36
HGET user:1 name
HMGET user:1 name email
HGETALL user:1
HKEYS user:1
HVALS user:1
HEXISTS user:1 email
HDEL user:1 age
HLEN user:1

HINCRBY user:1 login_count 1
HINCRBYFLOAT user:1 score 0.5

HSETNX user:1 role admin
HRANDFIELD user:1 2 WITHVALUES      # 6.2+

HSCAN user:1 0 MATCH e* COUNT 50
```

---

## 6. Lists

Queues, timelines, recent-N. Left = head, right = tail.

```text
LPUSH q job1
RPUSH q job2 job3
LPOP q
RPOP q
LPOP q COUNT 3                     # 6.2+ multi pop
LMOVE src dest LEFT RIGHT          # 6.2+ atomic move (replaces RPOPLPUSH)

BLPOP q 5                          # block up to 5s
BRPOP q 0                          # block forever
BLMOVE src dest LEFT RIGHT 5

LLEN q
LRANGE q 0 -1                      # all elements
LRANGE q 0 9                       # first 10
LINDEX q 0
LSET q 0 jobX
LTRIM q 0 99                       # keep newest 100 if LPUSH pattern
LINSERT q BEFORE pivot value
LREM q 2 value                     # remove 2 matches
```

Simple reliable queue pattern: `LPUSH` + `BRPOP` / `BLMOVE` to processing list.

---

## 7. Sets

Unique membership, tags, relations, random sampling.

```text
SADD tags:1 redis cache nosql
SREM tags:1 cache
SISMEMBER tags:1 redis
SMISMEMBER tags:1 redis sql        # 6.2+
SMEMBERS tags:1                    # care on large sets
SCARD tags:1
SRANDMEMBER tags:1 3
SPOP tags:1

SINTER a b
SINTERCARD a b                     # 7.0+
SUNION a b
SDIFF a b
SINTERSTORE dest a b
SUNIONSTORE dest a b
SDIFFSTORE dest a b

SSCAN tags:1 0 MATCH r* COUNT 50
```

---

## 8. Sorted sets (ZSET)

Leaderboards, time indexes, rate-limit windows, delayed jobs (score = timestamp).

```text
ZADD lb 100 alice 200 bob 150 cara
ZADD lb NX 120 dave                # only if new
ZADD lb XX CH INCR 5 alice         # increment existing

ZSCORE lb alice
ZINCRBY lb 10 alice
ZCARD lb
ZCOUNT lb 100 200
ZRANK lb alice                     # low→high
ZREVRANK lb alice                  # high→low

ZRANGE lb 0 2 WITHSCORES           # by rank (Redis 6.2+ unified)
ZRANGE lb 100 200 BYSCORE WITHSCORES
ZRANGE lb 100 200 BYSCORE REV LIMIT 0 10
ZREVRANGE lb 0 9 WITHSCORES        # legacy still common

ZRANGEBYSCORE lb -inf +inf
ZREMRANGEBYRANK lb 0 0
ZREMRANGEBYSCORE lb -inf 50
ZREM lb alice

ZPOPMIN lb
ZPOPMAX lb
BZPOPMIN lb 5

ZUNIONSTORE dest 2 za zb WEIGHTS 1 2
ZINTERSTORE dest 2 za zb
ZDIFFSTORE dest 2 za zb            # 6.2+

ZSCAN lb 0 MATCH a* COUNT 50
```

---

## 9. Streams

Append-only log; consumer groups (Kafka-lite inside Redis).

```text
XADD events * user 1 action login
XADD events MAXLEN ~ 10000 * user 2 action logout
XADD events 1700000000000-0 user 3 action click

XLEN events
XRANGE events - + COUNT 10
XREVRANGE events + - COUNT 10
XREAD COUNT 10 BLOCK 5000 STREAMS events 0-0
XREAD STREAMS events $                 # only new

# Consumer group
XGROUP CREATE events g1 0 MKSTREAM
XREADGROUP GROUP g1 worker1 COUNT 10 BLOCK 2000 STREAMS events >
XACK events g1 1700000000000-0
XPENDING events g1
XCLAIM events g1 worker2 60000 1700000000000-0
XAUTOCLAIM events g1 worker2 60000 0-0 COUNT 10

XDEL events 1700000000000-0
XTRIM events MAXLEN ~ 5000
XINFO STREAM events
XINFO GROUPS events
XINFO CONSUMERS events g1
```

`>` = never-delivered messages for this consumer. `$` = new messages only for `XREAD`.

---

## 10. Pub/Sub

Fire-and-forget messaging (no persistence of messages).

```text
SUBSCRIBE news sports
PSUBSCRIBE news.*
UNSUBSCRIBE news
PUBLISH news 'hello'
PUBSUB CHANNELS
PUBSUB NUMSUB news
PUBSUB NUMPAT
```

Sharded pub/sub (Cluster-friendly, Redis 7+): `SSUBSCRIBE` / `SPUBLISH`.

Note: subscribers are blocking connections; don’t reuse them for normal commands.

---

## 11. Expiry, TTL & memory

```text
EXPIRE __key__ 60
PEXPIRE __key__ 60000
EXPIREAT __key__ __unix_s__
PEXPIREAT __key__ __unix_ms__
EXPIRE __key__ 60 NX|XX|GT|LT      # Redis 7+ conditions
TTL __key__                        # seconds; -1 no expire; -2 missing
PTTL __key__
PERSIST __key__                    # remove expiry
```

Maxmemory & eviction:

```text
CONFIG GET maxmemory
CONFIG GET maxmemory-policy
# common policies:
#   noeviction | allkeys-lru | volatile-lru
#   allkeys-lfu | volatile-lfu | volatile-ttl | allkeys-random ...
```

```text
MEMORY STATS
MEMORY DOCTOR
MEMORY PURGE
INFO memory
```

---

## 12. Transactions, Lua & pipelines

### MULTI / EXEC (optimistic transaction)

```text
MULTI
INCR counter
SET flag 1
EXEC
# or DISCARD

WATCH balance:1
MULTI
DECRBY balance:1 10
EXEC                     # fails if watched key changed → retry
UNWATCH
```

Not rollback-on-error like SQL; commands queue then run sequentially.

### Pipeline (client-side)

Batch many commands, cut RTT. In `redis-cli`:

```bash
redis-cli --pipe < commands.txt
```

### Lua scripts (atomic server-side)

```text
EVAL "return redis.call('GET', KEYS[1])" 1 mykey
EVALSHA __sha__ 1 mykey
SCRIPT LOAD "return 1"
SCRIPT EXISTS __sha__
SCRIPT FLUSH
```

Redis Functions (7+): `FUNCTION LOAD`, `FCALL` — prefer for reusable logic.

### Locks (simple)

```text
SET lock:resource token NX EX 30
# release safely via Lua: delete only if value == token
```

Prefer Redlock / library only when you understand the tradeoffs.

---

## 13. Users, ACL & security

Redis 6+ ACL (replaces single global password-only model):

```text
ACL LIST
ACL WHOAMI
ACL GETUSER default
ACL SETUSER alice on >secret_pass ~cached:* +@read +@write -@dangerous
ACL SETUSER alice resetpass >newpass
ACL DELUSER alice
ACL CAT
ACL CAT string
ACL LOG
ACL SAVE
ACL LOAD
```

Legacy:

```text
AUTH __password__
CONFIG GET requirepass
```

TLS: use `rediss://` and server `tls-port` / cert config.  
Bind carefully (`bind 127.0.0.1`); never expose unprotected Redis to the internet.  
Disable dangerous commands in prod (`FLUSHALL`, `KEYS`, `CONFIG`) via ACL rename/block.

---

## 14. Persistence, backup & replication

### RDB (snapshot)

```text
SAVE                 # blocking
BGSAVE               # background
LASTSAVE
```

### AOF (append-only log)

```text
BGREWRITEAOF
CONFIG GET appendonly
CONFIG GET appendfsync     # always | everysec | no
```

Typical prod: **AOF everysec** and/or RDB snapshots. Managed Redis often handles this for you.

### Copy files (cold)

```bash
# Stop writes / use BGSAVE then copy dump.rdb / appendonly.aof
cp /var/lib/redis/dump.rdb backup/
```

### Replication

```text
INFO replication
ROLE
REPLICAOF __host__ __port__    # (SLAVEOF legacy alias)
REPLICAOF NO ONE               # promote
```

### Cluster (high level)

```bash
redis-cli -c -h __host__
CLUSTER INFO
CLUSTER NODES
CLUSTER KEYSLOT __key__
CLUSTER SLOTS
```

### Flush (danger)

```text
FLUSHDB                  # current DB
FLUSHDB ASYNC
FLUSHALL                 # all DBs — catastrophic
FLUSHALL ASYNC
```

---

## 15. Info, slowlog & useful ops

```text
INFO
INFO server
INFO clients
INFO memory
INFO stats
INFO replication
INFO keyspace
INFO commandstats

DBSIZE
CLIENT LIST
CLIENT ID
CLIENT KILL ID __id__
CLIENT PAUSE 1000
CLIENT UNPAUSE
CLIENT NO-EVICT on         # 7+ protect connection memory

SLOWLOG GET 10
SLOWLOG LEN
SLOWLOG RESET
CONFIG GET slowlog-log-slower-than

CONFIG GET *
CONFIG SET maxmemory 2gb
CONFIG REWRITE                 # persist CONFIG SET to redis.conf

MONITOR                        # live command stream
LATENCY DOCTOR
LATENCY LATEST

MODULE LIST
COMMAND COUNT
TIME
LASTSAVE
```

Keyspace notifications (expire events, etc.):

```text
CONFIG SET notify-keyspace-events Ex
PSUBSCRIBE __keyevent@0__:expired
```

Ops reminders (short):

- Use **`SCAN`**, not `KEYS *`, in production.
- Prefer **`UNLINK`** over `DEL` for big keys.
- Set **TTL** on cache keys; avoid unbounded growth.
- Pick **maxmemory-policy** deliberately (`allkeys-lru` common for cache).
- Big keys hurt: check `--bigkeys`; split or use hashes/streams.
- Pipelines + Lua for atomic multi-step work; don’t pretend MULTI is SQL ACID across keys under failover without care.
- One connection for Pub/Sub; another for normal commands.
- Cluster: hash tags `{user:1}:profile` keep related keys on same slot.

---

## 16. Tools & resources

**Tools**

- `redis-cli` — official CLI  
- Redis Insight — GUI  
- `redis-benchmark` — load testing  
- Libraries: `redis-py`, `ioredis`, `go-redis`, Jedis/Lettuce  

**Docs**

- [Redis commands](https://redis.io/commands/)  
- [Data types](https://redis.io/docs/data-types/)  
- [ACL](https://redis.io/docs/management/security/acl/)  
- [Persistence](https://redis.io/docs/management/persistence/)  
- [Streams tutorial](https://redis.io/docs/data-types/streams/)

---

## Quick mental map

```
String  → SET/GET, counters, cache blobs
Hash    → fielded objects
List    → queue / recent-N
Set     → unique tags / membership
ZSET    → ranked / time-ordered
Stream  → log + consumer groups
Pub/Sub → live notify (no history)
```

```
redis-cli → PING AUTH SELECT SCAN INFO SLOWLOG
Ops       → TTL, maxmemory, RDB/AOF, REPLICAOF, ACL
```

---

## SQL DB ↔ Redis quick diffs

| Idea | Postgres / MySQL / SQLite | Redis |
| --- | --- | --- |
| Primary model | Tables / rows | Keys + typed values |
| Query language | SQL | Command vocabulary per type |
| Durable by default | Yes | Optional (RDB/AOF); often used as cache |
| Schema | Declared | Implicit (app convention) |
| Transactions | ACID SQL tx | `MULTI/EXEC`, Lua (different guarantees) |
| Users | GRANT/ROLE | ACL (6+) / requirepass |
| “Tables” | DDL | Key prefixes: `user:1`, `order:99` |
| Scan all | `SELECT` | `SCAN` (cursor) |

### Common key naming

```text
user:{id}                 # string JSON or hash
user:{id}:sessions        # set
feed:{id}                 # list / stream
lb:game:{id}              # zset
lock:{resource}           # string token
cache:page:{slug}         # string with TTL
```

---

*Compiled for personal study use. Prefer SCAN, TTLs, and ACL in production. Confirm command availability for your Redis major version and hosting platform.*
