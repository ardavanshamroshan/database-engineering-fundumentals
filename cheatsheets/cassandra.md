# Apache Cassandra Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (`cqlsh`, CQL, schema, nodetool, ops).  
**Audience:** Engineers who need Cassandra CQL and cluster ops fast.  
**Notes:** Examples fit Cassandra **4.x / 5.x**. CQL is largely shared with ScyllaDB; ops/config/tools differ. See also `scylladb.md`.

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [cqlsh essentials](#2-cqlsh-essentials)
3. [Keyspaces](#3-keyspaces)
4. [Tables & types](#4-tables--types)
5. [Insert / update / delete](#5-insert--update--delete)
6. [Select & queries](#6-select--queries)
7. [Collections, UDT, frozen](#7-collections-udt-frozen)
8. [Secondary indexes, SAI & materialized views](#8-secondary-indexes-sai--materialized-views)
9. [Users, roles & auth](#9-users-roles--auth)
10. [Batches, LWT & consistency](#10-batches-lwt--consistency)
11. [Import / export](#11-import--export)
12. [Sizes, tracing & system tables](#12-sizes-tracing--system-tables)
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
cqlsh __host__ -u __user__ -p

# Keyspace on connect
cqlsh __host__ -k __keyspace__

# Execute / file
cqlsh -e "DESCRIBE KEYSPACES;"
cqlsh -f schema.cql

# SSL (cluster-dependent)
cqlsh __host__ --ssl
```

App drivers: DataStax Java Driver, Python `cassandra-driver`, gocql, etc. Prefer token-aware load balancing.

---

## 2. cqlsh essentials

| Action | Command |
| --- | --- |
| Help | `HELP` / `HELP SELECT` |
| Quit | `EXIT` / `QUIT` |
| Show host | `SHOW HOST` |
| Show version | `SHOW VERSION` |
| Paging | `PAGING 100` / `PAGING OFF` |
| Tracing | `TRACING ON` / `TRACING OFF` |
| Consistency | `CONSISTENCY LOCAL_QUORUM` |
| Serial consistency | `SERIAL CONSISTENCY LOCAL_SERIAL` |
| Expand | `EXPAND ON` |
| Source | `SOURCE 'schema.cql'` |
| Capture | `CAPTURE 'out.txt'` |

```sql
DESCRIBE CLUSTER;
DESCRIBE KEYSPACES;
DESCRIBE KEYSPACE __ks__;
DESCRIBE TABLES;
DESCRIBE TABLE __ks__.__table__;
DESCRIBE INDEX;
DESCRIBE TYPES;
DESCRIBE ROLES;
```

---

## 3. Keyspaces

```sql
-- Single-DC / lab
CREATE KEYSPACE shop
WITH replication = {
  'class': 'SimpleStrategy',
  'replication_factor': 3
};

-- Multi-DC production (preferred)
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
  'dc1': 3,
  'dc2': 3
};

DROP KEYSPACE IF EXISTS shop;
```

RF + consistency level must be designed together (e.g. RF=3, `LOCAL_QUORUM` → 2 replicas per DC).

---

## 4. Tables & types

Primary key = **partition key** + optional **clustering columns**.  
No arbitrary JOINs / WHERE — design tables per query.

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

Types: `text`, `ascii`, `int`, `bigint`, `smallint`, `tinyint`, `varint`, `float`, `double`, `decimal`, `boolean`, `uuid`, `timeuuid`, `timestamp`, `date`, `time`, `inet`, `blob`, `counter`, `duration`, collections, UDT, `vector` (Cassandra 5+ / search use-cases).

```sql
ALTER TABLE orders ADD note text;
ALTER TABLE orders DROP note;
DROP TABLE IF EXISTS orders;
TRUNCATE orders;
```

Table options:

```sql
CREATE TABLE ...
WITH compaction = {
  'class': 'org.apache.cassandra.db.compaction.LeveledCompactionStrategy'
  -- SizeTieredCompactionStrategy (STCS)
  -- TimeWindowCompactionStrategy (TWCS) — time-series / TTL heavy
  -- UnifiedCompactionStrategy (UCS) — Cassandra 5+
}
AND default_time_to_live = 86400
AND gc_grace_seconds = 864000
AND caching = {'keys': 'ALL', 'rows_per_partition': 'NONE'}
AND comment = 'orders by customer';
```

Counters:

```sql
CREATE TABLE hits (
  page text PRIMARY KEY,
  views counter
);
UPDATE hits SET views = views + 1 WHERE page = 'home';
```

---

## 5. Insert / update / delete

All writes are upserts on primary key.

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
IF NOT EXISTS;                          -- LWT

UPDATE orders SET status = 'shipped', total = 59.90
WHERE customer_id = ... AND order_id = ...;

UPDATE orders USING TTL 3600 SET status = 'temp'
WHERE customer_id = ... AND order_id = ...;

DELETE status FROM orders
WHERE customer_id = ... AND order_id = ...;

DELETE FROM orders
WHERE customer_id = ... AND order_id = ...;

DELETE FROM orders WHERE customer_id = ...;   -- whole partition
```

Write-time TTL / timestamp:

```sql
INSERT INTO orders (...) VALUES (...)
USING TTL 60 AND TIMESTAMP 1720000000000000;
```

---

## 6. Select & queries

```sql
-- Good: full partition
SELECT * FROM orders WHERE customer_id = 55b6f1b0-...;

-- Good: partition + clustering range
SELECT * FROM orders
WHERE customer_id = ...
  AND order_id > minTimeuuid('2026-01-01')
  AND order_id < minTimeuuid('2026-02-01');

SELECT status, total FROM orders
WHERE customer_id = ... AND order_id = ...;

SELECT * FROM orders WHERE customer_id = ... LIMIT 50;

-- IN on partition key (coordinator fanout — keep small)
SELECT * FROM orders WHERE customer_id IN (... , ...);

-- Token ranges (Spark / analytics / repair tooling)
SELECT token(customer_id), customer_id FROM orders
WHERE token(customer_id) >= minToken
  AND token(customer_id) <= maxToken
LIMIT 100;
```

Avoid on hot paths:

```sql
SELECT * FROM orders WHERE status = 'new';                 -- needs index
SELECT * FROM orders WHERE status = 'new' ALLOW FILTERING; -- cluster scan risk
```

Group-by / aggregates are limited vs SQL; often precompute or use Spark/Flink.

---

## 7. Collections, UDT, frozen

```sql
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

`frozen<T>` = read/write entire value; required for nested collections and many MV/index cases.

---

## 8. Secondary indexes, SAI & materialized views

### Legacy secondary index

```sql
CREATE INDEX orders_status_idx ON orders (status);
SELECT * FROM orders WHERE status = 'new';
DROP INDEX orders_status_idx;
```

### SAI — Storage-Attached Index (Cassandra 5+ / DataStax)

Better for multi-column / numeric / text search style filters than classic 2i (when available):

```sql
CREATE CUSTOM INDEX ON orders (status)
USING 'StorageAttachedIndex';

CREATE CUSTOM INDEX ON orders (total)
USING 'StorageAttachedIndex';
```

Still not a free pass for relational-style querying — model carefully.

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

Many production teams prefer **manual denormalized tables** (dual write) over MV for control.

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

Enable in `cassandra.yaml`:

```yaml
authenticator: PasswordAuthenticator
authorizer: CassandraAuthorizer
# role_manager: CassandraRoleManager
```

Default often `AllowAllAuthenticator` — change before production. Superuser bootstrap: `cassandra` / `cassandra` (change immediately).

---

## 10. Batches, LWT & consistency

### Consistency

```sql
CONSISTENCY ONE;
CONSISTENCY LOCAL_ONE;
CONSISTENCY QUORUM;
CONSISTENCY LOCAL_QUORUM;     -- common default for apps
CONSISTENCY EACH_QUORUM;
CONSISTENCY ALL;
CONSISTENCY SERIAL;
CONSISTENCY LOCAL_SERIAL;
```

Read repair / speculative retry are server/driver concerns — tune via yaml + driver policies.

### Batch

```sql
BEGIN BATCH
  INSERT INTO orders_by_customer ...;
  INSERT INTO orders_by_id ...;
APPLY BATCH;

BEGIN UNLOGGED BATCH
  ...
APPLY BATCH;

BEGIN COUNTER BATCH
  UPDATE hits SET views = views + 1 WHERE page = 'home';
APPLY BATCH;
```

Best practice: batch **same partition**. Large multi-partition batches → coordinator hotspot + timeouts.

### LWT (Paxos / consensus path)

```sql
UPDATE orders SET status = 'shipped'
WHERE customer_id = ... AND order_id = ...
IF status = 'paid';

INSERT INTO users (id, email) VALUES (..., 'a@x.com') IF NOT EXISTS;
```

Higher latency. Use for uniqueness / conditional state — not every write.

---

## 11. Import / export

```sql
-- cqlsh COPY (OK for small/medium)
COPY orders (customer_id, order_id, status, total, created_at)
FROM 'orders.csv' WITH HEADER = true;

COPY orders TO 'orders_out.csv' WITH HEADER = true;
```

Large loads:

```bash
# DataStax DSBulk
dsbulk load -url orders.csv -k shop -t orders -header true
dsbulk unload -k shop -t orders -url out/

# SSTable loader (ops)
sstableloader -d __hosts__ /path/to/keyspace/table
```

---

## 12. Sizes, tracing & system tables

```sql
TRACING ON;
SELECT * FROM orders WHERE customer_id = ...;
TRACING OFF;

SELECT * FROM system.local;
SELECT * FROM system.peers;
SELECT * FROM system.peers_v2;                 -- 4+
SELECT * FROM system_schema.keyspaces;
SELECT * FROM system_schema.tables WHERE keyspace_name = 'shop';
SELECT * FROM system.size_estimates;
```

```bash
nodetool tablestats shop.orders
nodetool tablehistograms shop orders
nodetool proxyhistograms
nodetool tpstats
```

Metrics: Prometheus JMX exporter / DataStax Metrics Collector / Metrics Collector for Apache Cassandra (MCAC).

---

## 13. nodetool & cluster ops

```bash
nodetool status
nodetool status shop              # per-keyspace ownership (version-dependent)
nodetool info
nodetool describecluster
nodetool getendpoints shop orders <partition_key>
nodetool ring
nodetool gossipinfo
nodetool netstats
nodetool compactionstats
nodetool toppartitions shop orders 1000

nodetool flush
nodetool compact shop orders
nodetool drain                    # before clean shutdown
nodetool stopdaemon

# Topology
nodetool cleanup shop
nodetool decommission             # on node leaving
nodetool removenode <id>          # dead node
nodetool move <token>             # rare; careful
nodetool rebuild <dc>
```

Bootstrap: start new node with correct `cluster_name`, seeds, rack/DC snitch → auto-joins → watch streaming.

---

## 14. Compaction, repair & backup

```bash
# Anti-entropy repair — schedule!
nodetool repair -pr               # primary-range; rotate across nodes
nodetool repair shop orders
# Cassandra 4+: incremental repair is default behavior historically nuanced —
# know your version; prefer documented ops procedures / reaper

# Snapshots (hardlinks to SSTables)
nodetool snapshot shop -t pre_migrate
nodetool listsnapshots
nodetool clearsnapshot -t pre_migrate shop
```

**Cassandra Reaper** — common tool to schedule/orchestrate repairs safely.

Backup pattern: snapshot → copy SSTables off-node → clear snapshot. Or Medusa / vendor backup.

`gc_grace_seconds` ≥ longest repair interval to avoid zombie deletes (resurrection).

---

## 15. Config & useful ops tips

Main config: `cassandra.yaml`  
Also: `cassandra-env.sh`, `jvm-server.options`, `cassandra-rackdc.properties` (GossipingPropertyFileSnitch).

| Topic | Tip |
| --- | --- |
| Snitch | Must reflect real DC/rack topology |
| Seeds | Few stable seeds; not all nodes |
| Partition size | Keep hot partitions bounded; bucket keys |
| Tombstones | Prefer TTL; monitor `TombstoneOverwhelmingException` |
| ALLOW FILTERING | Not for prod request paths |
| Data model | Query → table; denormalize |
| Compaction | TWCS for TTL time-series; LCS for read-heavy; UCS on 5+ |
| Heap vs off-heap | Watch GC; Cassandra is sensitive to JVM tuning |
| Native transport | Port 9042 CQL; 7000/7001 gossip/SSL |

Useful functions:

```sql
SELECT now(), uuid(), toTimestamp(now()), toDate(now()) FROM system.local;
SELECT minTimeuuid('2026-01-01 00:00+0000'),
       maxTimeuuid('2026-01-01 00:00+0000') FROM system.local;
SELECT token(customer_id) FROM orders WHERE customer_id = ...;
```

Ops reminders (short):

- Model **for queries**, not 3NF.
- Always include **partition key** in WHERE for online traffic.
- Run **repair** regularly (Reaper).
- Monitor **large partitions**, **tombstones**, **pending compactions**, **dropped mutations**.
- Idempotent writes + proper CL beat fragile multi-partition BATCH/LWT spam.
- Change default auth before exposing any network path.

---

## 16. Tools & resources

**Tools**

- `cqlsh`, `nodetool`, `cassandra`, `sstableloader`  
- [Cassandra Reaper](https://cassandra-reaper.io/) — repairs  
- DSBulk — bulk load/unload  
- Medusa — backups  
- AxonOps / K8ssandra / DataStax Enterprise tooling (ecosystem)

**Docs**

- [Apache Cassandra docs](https://cassandra.apache.org/doc/latest/)  
- [CQL reference](https://cassandra.apache.org/doc/latest/cassandra/cql/)  
- [Data modeling](https://cassandra.apache.org/doc/latest/cassandra/data_modeling/)  
- [Operations](https://cassandra.apache.org/doc/latest/cassandra/operating/)

---

## Quick mental map

```
Cluster → DC/Rack → Keyspace (RF) → Table (PK) → Partition → Rows
cqlsh   → USE / DESCRIBE / SELECT / INSERT / CONSISTENCY
Ops     → nodetool status/repair/snapshot, Reaper, compaction
```

---

## Cassandra ↔ ScyllaDB (short)

| Area | Cassandra | ScyllaDB |
| --- | --- | --- |
| Language | CQL | CQL (very similar) |
| Architecture | JVM, shared thread pools | C++/Seastar, shard-per-core |
| Compaction | STCS/LCS/TWCS/UCS | Includes Incremental CS, etc. |
| Indexes | 2i, SAI (5+) | 2i / SAI (version-dependent) |
| DynamoDB API | — | Alternator (optional) |
| Drivers | Token-aware | Prefer **shard-aware** Scylla drivers |
| Ops | nodetool + Reaper | nodetool + Scylla Manager/Monitoring |

CQL skills transfer; **capacity planning, drivers, and monitoring** do not 1:1.

---

## SQL ↔ Cassandra quick diffs

| SQL | Cassandra |
| --- | --- |
| Database | Keyspace |
| Table | Table |
| Primary key | Partition key (+ clustering) |
| Secondary filter | New table / index / SAI / MV |
| JOIN | Denormalize (duplicate data) |
| ACID txn | Single-partition atomicity; LWT optional |
| ORDER BY any col | Only clustering order inside partition |
| Aggregates | Limited; often precompute |

### Modeling sketch

```text
Q: latest orders for customer
→ orders ((customer_id), order_id DESC)

Q: order by id
→ orders_by_id (order_id PRIMARY KEY, customer_id, ...)

Q: by status (high cardinality caution)
→ orders_by_status ((status, day), order_id)
```

---

*Compiled for personal study use. Pair with `scylladb.md` if you work both. Confirm SAI/UCS/repair defaults for your exact Cassandra major version.*
