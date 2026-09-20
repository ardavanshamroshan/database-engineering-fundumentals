# ScyllaDB Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (`cqlsh`, CQL, schema, ops).  
**Audience:** Engineers who need ScyllaDB / Cassandra-compatible CQL fast.  
**Notes:** ScyllaDB speaks **CQL** (Cassandra Query Language). Examples fit Scylla 5.x/6.x and generally Cassandra 3/4 CQL. Prefer Scylla Monitoring + `nodetool` for ops.

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [cqlsh essentials](#2-cqlsh-essentials)
3. [Keyspaces](#3-keyspaces)
4. [Tables & types](#4-tables--types)
5. [Insert / update / delete](#5-insert--update--delete)
6. [Select & queries](#6-select--queries)
7. [Collections, UDT, frozen](#7-collections-udt-frozen)
8. [Secondary indexes & materialized views](#8-secondary-indexes--materialized-views)
9. [Users, roles & auth](#9-users-roles--auth)
10. [Batches, LWT & consistency](#10-batches-lwt--consistency)
11. [Import / export](#11-import--export)
12. [Sizes, tracing & metrics](#12-sizes-tracing--metrics)
13. [nodetool & cluster ops](#13-nodetool--cluster-ops)
14. [Compaction, repair & backup](#14-compaction-repair--backup)
15. [Config & useful ops tips](#15-config--useful-ops-tips)
16. [Tools & resources](#16-tools--resources)

Placeholders use `__name__` style. Replace them before running.

---

## 1. Connect & flags

```bash
# Local default CQL port 9042
cqlsh
cqlsh __host__ 9042

# Auth
cqlsh __host__ -u __user__ -p '__password__'

# Keyspace on connect
cqlsh __host__ -k __keyspace__

# File / execute
cqlsh -f schema.cql
cqlsh -e "DESCRIBE KEYSPACES;"

# Connect timeout / SSL (as configured)
cqlsh __host__ --ssl
```

Drivers (app): Shard-aware Scylla drivers recommended (Java, Go, Python, Rust, CPP).

---

## 2. cqlsh essentials

| Action | Command |
| --- | --- |
| Help | `HELP` / `HELP SELECT` |
| Quit | `EXIT` / `QUIT` |
| Show host | `SHOW HOST` |
| Show version | `SHOW VERSION` |
| Paging | `PAGING 100` / `PAGING OFF` |
| Timing | `TRACING ON` / `TRACING OFF` |
| Consistency | `CONSISTENCY QUORUM` |
| Expand rows | `EXPAND ON` |
| Source file | `SOURCE 'schema.cql'` |
| Capture output | `CAPTURE 'out.txt'` |

```sql
DESCRIBE CLUSTER;
DESCRIBE KEYSPACES;
DESCRIBE KEYSPACE __ks__;
DESCRIBE TABLES;
DESCRIBE TABLE __ks__.__table__;
DESCRIBE INDEXES;
DESCRIBE TYPES;
```

---

## 3. Keyspaces

Replication strategy is required. For multi-DC production use `NetworkTopologyStrategy`.

```sql
-- Dev / single node
CREATE KEYSPACE shop
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 1
};

-- Production multi-DC
CREATE KEYSPACE shop
WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3,
  'dc2': 3
}
AND durable_writes = true;

USE shop;
ALTER KEYSPACE shop WITH replication = {
  'class': 'NetworkTopologyStrategy',
  'dc1': 3
};
DROP KEYSPACE IF EXISTS shop;
```

---

## 4. Tables & types

Primary key = **partition key** + optional **clustering columns**.  
Query model first: you can only filter efficiently on PK prefixes (unless using index/ALLOW FILTERING carefully).

```sql
CREATE TABLE orders (
  customer_id uuid,
  order_id    timeuuid,
  status      text,
  total       decimal,
  created_at  timestamp,
  PRIMARY KEY ((customer_id), order_id)
) WITH CLUSTERING ORDER BY (order_id DESC);

-- Composite partition key
PRIMARY KEY ((customer_id, bucket), order_id)

-- Multiple clustering columns
PRIMARY KEY ((customer_id), day, order_id)
```

Common types: `text`, `ascii`, `int`, `bigint`, `smallint`, `tinyint`, `varint`, `float`, `double`, `decimal`, `boolean`, `uuid`, `timeuuid`, `timestamp`, `date`, `time`, `inet`, `blob`, `counter`, `duration`, collections, UDT.

```sql
ALTER TABLE orders ADD note text;
ALTER TABLE orders DROP note;
-- Rename limited; often create new table + migrate

DROP TABLE IF EXISTS orders;
TRUNCATE orders;             -- deletes all data; keep table
```

Table options (examples):

```sql
CREATE TABLE ...
WITH compaction = {
  'class': 'SizeTieredCompactionStrategy'
  -- or 'IncrementalCompactionStrategy' (Scylla), 'LeveledCompactionStrategy', 'TimeWindowCompactionStrategy'
}
AND default_time_to_live = 86400
AND gc_grace_seconds = 864000
AND comment = 'orders by customer';
```

Counters need dedicated counter tables (no mix with normal cols casually):

```sql
CREATE TABLE hits (
  page text PRIMARY KEY,
  views counter
);
UPDATE hits SET views = views + 1 WHERE page = 'home';
```

---

## 5. Insert / update / delete

Writes are upserts by primary key.

```sql
INSERT INTO orders (customer_id, order_id, status, total, created_at)
VALUES (
  55b6f1b0-...,
  now(),
  'new',
  49.90,
  toTimestamp(now())
);

INSERT INTO orders (customer_id, order_id, status)
VALUES (..., ..., 'new')
IF NOT EXISTS;                    -- LWT

UPDATE orders SET status = 'shipped', total = 59.90
WHERE customer_id = ... AND order_id = ...;

UPDATE orders USING TTL 3600 SET status = 'temp'
WHERE customer_id = ... AND order_id = ...;

DELETE status FROM orders
WHERE customer_id = ... AND order_id = ...;

DELETE FROM orders
WHERE customer_id = ... AND order_id = ...;

DELETE FROM orders WHERE customer_id = ...;   -- partition delete
```

Lightweight timestamps / TTL on write:

```sql
INSERT INTO orders (...) VALUES (...) USING TTL 60 AND TIMESTAMP 1720000000000000;
```

---

## 6. Select & queries

```sql
-- Full partition (good)
SELECT * FROM orders WHERE customer_id = 55b6f1b0-...;

-- Partition + clustering range (good)
SELECT * FROM orders
WHERE customer_id = ...
  AND order_id > minTimeuuid('2026-01-01')
  AND order_id < minTimeuuid('2026-02-01');

SELECT status, total FROM orders
WHERE customer_id = ... AND order_id = ...;

SELECT * FROM orders WHERE customer_id = ... LIMIT 50;

-- IN on partition key (careful — fanout)
SELECT * FROM orders WHERE customer_id IN (... , ...);

-- Token range (ops / spark style)
SELECT token(customer_id), customer_id FROM orders
WHERE token(customer_id) >= -9223372036854775808
  AND token(customer_id) <= -1000
LIMIT 100;
```

Avoid:

```sql
SELECT * FROM orders WHERE status = 'new';                 -- needs index or ALLOW FILTERING
SELECT * FROM orders WHERE status = 'new' ALLOW FILTERING; -- expensive; last resort
```

Paging is automatic in drivers; in cqlsh: `PAGING 100`.

---

## 7. Collections, UDT, frozen

```sql
-- set / list / map
CREATE TABLE users (
  id uuid PRIMARY KEY,
  emails set<text>,
  logins list<timestamp>,
  prefs  map<text, text>
);

UPDATE users SET emails = emails + {'a@x.com'} WHERE id = ...;
UPDATE users SET emails = emails - {'old@x.com'} WHERE id = ...;
UPDATE users SET logins = [toTimestamp(now())] + logins WHERE id = ...;
UPDATE users SET prefs['theme'] = 'dark' WHERE id = ...;
```

UDT:

```sql
CREATE TYPE address (
  city text,
  zip  text
);

CREATE TABLE customers (
  id uuid PRIMARY KEY,
  addr frozen<address>
);

INSERT INTO customers (id, addr)
VALUES (..., {city: 'Tehran', zip: '21'});
```

`frozen<...>` = whole-value replace only (required for nested collections / MV / some index cases).

---

## 8. Secondary indexes & materialized views

### Secondary index (use sparingly)

```sql
CREATE INDEX ON orders (status);
CREATE CUSTOM INDEX ... ;     -- SAI / storage-attached (if available on your version)

SELECT * FROM orders WHERE status = 'new';   -- may still be costly
DROP INDEX orders_status_idx;
```

Prefer **new table** denormalized by query over heavy secondary indexes.

### Materialized view

```sql
CREATE MATERIALIZED VIEW orders_by_status AS
  SELECT customer_id, order_id, status, total
  FROM orders
  WHERE customer_id IS NOT NULL
    AND order_id IS NOT NULL
    AND status IS NOT NULL
  PRIMARY KEY (status, customer_id, order_id);

SELECT * FROM orders_by_status WHERE status = 'new';
DROP MATERIALIZED VIEW orders_by_status;
```

MV rules are strict (non-null keys, PK must include base PK). Many teams prefer dual-write tables instead.

---

## 9. Users, roles & auth

```sql
CREATE ROLE app WITH PASSWORD = 'secret' AND LOGIN = true;
CREATE ROLE readonly;
GRANT SELECT ON KEYSPACE shop TO readonly;
GRANT readonly TO app;

GRANT ALL PERMISSIONS ON KEYSPACE shop TO app;
GRANT SELECT ON TABLE shop.orders TO app;
LIST ROLES;
LIST ALL PERMISSIONS OF app;
REVOKE SELECT ON TABLE shop.orders FROM app;
DROP ROLE IF EXISTS app;
```

Enable auth in `scylla.yaml` (`authenticator`, `authorizer`). Default install often allows unauthenticated local access — lock down before production.

---

## 10. Batches, LWT & consistency

### Consistency levels

```sql
CONSISTENCY ONE;
CONSISTENCY LOCAL_ONE;
CONSISTENCY QUORUM;
CONSISTENCY LOCAL_QUORUM;
CONSISTENCY EACH_QUORUM;
CONSISTENCY ALL;
CONSISTENCY SERIAL;          -- for LWT
CONSISTENCY LOCAL_SERIAL;
```

Rule of thumb: **LOCAL_QUORUM** for multi-DC apps; **ONE/LOCAL_ONE** for latency-sensitive cache-like paths (know the risk).

### Batch

```sql
BEGIN BATCH
  INSERT INTO orders_by_customer ...;
  INSERT INTO orders_by_id ...;
APPLY BATCH;

BEGIN UNLOGGED BATCH   -- faster; less atomic across partitions
  ...
APPLY BATCH;
```

Use batch for **same partition** related writes. Multi-partition batches are anti-patterns when large.

### LWT (compare-and-set)

```sql
UPDATE orders SET status = 'shipped'
WHERE customer_id = ... AND order_id = ...
IF status = 'paid';

INSERT INTO users (id, email) VALUES (..., 'a@x.com') IF NOT EXISTS;
```

LWT = higher latency (Paxos/consensus path). Don’t use for every write.

---

## 11. Import / export

```bash
# cqlsh COPY (small/medium data; convenient)
# In cqlsh:
COPY orders (customer_id, order_id, status, total, created_at)
FROM 'orders.csv' WITH HEADER = true;

COPY orders TO 'orders_out.csv' WITH HEADER = true;
```

Bulk loaders (large data):

- **Scylla Spark Migrator / DSBulk / sstableloader**
- `nodetool refresh` after placing SSTables

```bash
dsbulk load -url orders.csv -k shop -t orders -header true
dsbulk unload -k shop -t orders -url out/
```

---

## 12. Sizes, tracing & metrics

```sql
TRACING ON;
SELECT * FROM orders WHERE customer_id = ...;
TRACING OFF;

-- System tables (examples)
SELECT * FROM system.local;
SELECT * FROM system.peers;
SELECT * FROM system_schema.tables WHERE keyspace_name = 'shop';
SELECT * FROM system.size_estimates;          -- rough
```

Prefer **Scylla Monitoring Stack** (Prometheus + Grafana) for real sizes, latency, cache hit, compaction.

```bash
nodetool cfstats shop.orders
nodetool tablestats shop.orders
nodetool cfhistograms shop orders
nodetool proxyhistograms
```

---

## 13. nodetool & cluster ops

```bash
nodetool status                 # UN/DN nodes, load, owns
nodetool info
nodetool describecluster
nodetool getendpoints shop orders __partition_key__
nodetool ring
nodetool gossipinfo

nodetool compact shop orders
nodetool flush
nodetool drain                  # before shutdown
nodetool stopdaemon

nodetool netstats
nodetool tpstats                # thread pools / drops
nodetool compactionstats
nodetool toppartitions shop orders 1000
```

Add / remove node (high level): bootstrap new node → `nodetool decommission` on old → cleanup.

```bash
nodetool cleanup shop
nodetool removenode __id__      # if dead node
nodetool rebuild __dc__
```

---

## 14. Compaction, repair & backup

```bash
# Repair (anti-entropy) — schedule regularly
nodetool repair -pr             # primary range (recommended pattern in rotations)
nodetool repair shop orders

# Snapshots (hardlink SSTables)
nodetool snapshot shop -t pre_migrate
nodetool listsnapshots
nodetool clearsnapshot -t pre_migrate shop
```

Backup practice: snapshots + copy hardlinked SSTables off-box; or Scylla Manager / vendor backup.

TTL + `gc_grace_seconds`: don’t set grace below repair interval or deleted data can “resurrect”.

---

## 15. Config & useful ops tips

Config file: `/etc/scylla/scylla.yaml` (paths vary).

Important ideas:

| Topic | Tip |
| --- | --- |
| Shard-per-core | Scylla uses shared-nothing shards — pin CPU, use shard-aware drivers |
| Partition size | Keep partitions reasonable (aim well under tens/hundreds of MB hot) |
| Hot partitions | Spread keys; add bucket to PK if needed |
| Tombstones | Avoid mass deletes; prefer TTL; monitor tombstone warnings |
| ALLOW FILTERING | Almost never in prod path |
| Query-first model | One table per query pattern (denormalize) |
| QUORUM math | RF=3 → QUORUM=2; design RF + CL together |
| Timeuuid | `now()` for unique time-sortable IDs |

Useful CQL functions:

```sql
SELECT now(), uuid(), toTimestamp(now()), toDate(now()) FROM system.local;
SELECT minTimeuuid('2026-01-01 00:00+0000'), maxTimeuuid('2026-01-01 00:00+0000') FROM system.local;
SELECT token(customer_id) FROM orders WHERE customer_id = ...;
```

Ops reminders (short):

- Model **queries → tables**, not ER diagrams → joins (there are no JOINs).
- Always query by **partition key** (and clustering ranges).
- Use **TTL** for expiring data; repair on a schedule.
- Watch **large partitions** and **tombstones**.
- Prefer Scylla **Incremental Compaction** where appropriate (version-dependent).
- App retries + idempotent writes matter (hinted handoff / unavailable nodes).

---

## 16. Tools & resources

**Tools**

- `cqlsh`, `nodetool`, `scylla`/`scylla-server`  
- **Scylla Monitoring Stack**  
- **Scylla Manager** — repair/backup orchestration  
- DSBulk, Spark + Scylla connector  
- Alternator — DynamoDB-compatible API (if enabled)

**Docs**

- [ScyllaDB docs](https://docs.scylladb.com/)  
- [CQL reference](https://docs.scylladb.com/stable/cql/)  
- [Data modeling](https://docs.scylladb.com/stable/data-modeling/)  
- [nodetool](https://docs.scylladb.com/stable/operating-scylla/nodetool/)

---

## Quick mental map

```
Cluster → Keyspace (RF) → Table (PK) → Partition → Clustering rows
cqlsh   → USE / DESCRIBE / SELECT / INSERT / CONSISTENCY
Ops     → nodetool status/repair/snapshot, monitoring, compaction
```

---

## SQL / Mongo / Redis ↔ Scylla quick diffs

| Idea | Relational | MongoDB | Redis | ScyllaDB |
| --- | --- | --- | --- | --- |
| Primary unit | Row | Document | Key+type | Partition + clustered rows |
| Query flex | High (any WHERE) | High (any field + index) | Per-type commands | **Must match PK design** |
| Joins | Yes | `$lookup` | App-side | No — denormalize |
| Consistency | Strong ACID | Tunable / txn | Mostly single-key atomic | Tunable CL + optional LWT |
| Scale model | Vertical / shard add-on | Replica + shard | Cluster slots | Shared-nothing shards / nodes |
| Secondary access | Indexes | Indexes | Multiple keys | New table / MV / careful index |

### Naming / modeling example

```text
Need: latest orders for customer
Table: orders ((customer_id), order_id DESC)

Need: order by id lookup
Table: orders_by_id (order_id PRIMARY KEY, customer_id, ...)

Need: orders by status (careful cardinality)
Table: orders_by_status ((status, day), order_id)   -- bucket by day
```

---

*Compiled for personal study use. Design tables for queries; treat ALLOW FILTERING and multi-partition BATCH as smells. Confirm compaction strategies, SAI/index features, and nodetool flags for your Scylla version.*
