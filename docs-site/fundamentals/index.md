---
title: Fundamentals
description: Database Engineering Fundamentals study path
outline: deep
---

# Database Engineering Fundamentals

**Personal learning path — chapter by chapter**

Skeleton study guide for the *Database Engineering Fundamentals* course.
Mark progress as you go. Chapter notes grow over time.

**Docs site:** [ardavanshamroshan.github.io/database-engineering-fundumentals](https://ardavanshamroshan.github.io/database-engineering-fundumentals/)

**Language:** English · [فارسی](https://github.com/ardavanshamroshan/database-engineering-fundumentals/blob/main/README.fa.md)

**Cheatsheets:** [PostgreSQL](/sql/postgresql) · [MySQL](/sql/mysql) · [SQLite](/sql/sqlite) · [Redis](/nosql/redis) · [MongoDB](/nosql/mongodb) · [Cassandra](/nosql/cassandra) · [ScyllaDB](/nosql/scylladb)

---

## Progress

| Status | Count |
| ------ | ----- |
| Total chapters | 17 |
| Done | 0 |
| In progress | — |

Marks: `[ ]` not started · `[~]` in progress · `[x]` done

---

## How to use

1. Study one chapter at a time (order below).
2. Tick the checkbox when that chapter is done.
3. Add notes under the chapter as you learn.
4. Skip **01 / 15 / 16 / 17** if you only want core engineering topics; they stay listed for completeness.

---

## Table of contents

### Part 0 — Meta

- [01 — Course Updates](#_01-course-updates)

### Part I — Foundations

- [02 — ACID](#_02-acid)
- [03 — Understanding Database Internals](#_03-understanding-database-internals)
- [04 — Database Indexing](#_04-database-indexing)
- [05 — B-Tree vs B+Tree](#_05-b-tree-vs-btree-in-production-database-systems)

### Part II — Scale & Distribution

- [06 — Database Partitioning](#_06-database-partitioning)
- [07 — Database Sharding](#_07-database-sharding)
- [08 — Concurrency Control](#_08-concurrency-control)
- [09 — Database Replication](#_09-database-replication)

### Part III — Systems & Engines

- [10 — Database System Design](#_10-database-system-design)
- [11 — Database Engines](#_11-database-engines)
- [12 — Database Cursors](#_12-database-cursors)

### Part IV — Security

- [13 — Database Security](#_13-database-security)
- [14 — Homomorphic Encryption](#_14-homomorphic-encryption)

### Part V — Extra

- [15 — Q&A](#_15-qa)
- [16 — Database Discussions](#_16-database-discussions)
- [17 — Archived Lectures](#_17-archived-lectures)

---

## Chapters

### 01 — Course Updates {#_01-course-updates}

- **Status:** `[ ]`
- **Summary:** Course changelog and material updates.
- **Focus:** Stay aligned with latest course content.
- **Notes:** *(later)*

---

### 02 — ACID {#_02-acid}

- **Status:** `[ ]`
- **Summary:** Four transaction properties: Atomicity, Consistency, Isolation, Durability.
- **Focus:** Transaction guarantees in relational systems.
- **Notes:**

ACID: **Atomicity**, **Consistency**, **Isolation**, **Durability**.

In relational database systems, ACID ensures integrity and consistency of the database.

#### What is a Transaction?

A transaction is:

- A group of queries executed as one unit
- Treated as a single, indivisible task (unit of work)
- Example — account transfer:
  - `SELECT`: check that the source account has enough money
  - `UPDATE`: decrease balance on the first account
  - `UPDATE`: increase balance on the second account

```sql
START TRANSACTION;
SELECT * FROM account WHERE account_id = 1;
-- IF balance < 100 THEN ROLLBACK;
UPDATE account SET balance = balance - 100 WHERE account_id = 1;
UPDATE account SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
```

If the account does not have enough money, roll back — database stays in the previous state.  
If it does, commit — database moves to the new state.

To allow undo when needed, changes are first written to memory; only after confirmation are they committed to disk.

#### Atomicity

A transaction is an atomic unit of work that either succeeds or fails as a whole. All queries in a transaction must succeed or fail together.

##### Lab: prove Atomicity with an unfinished transaction (PostgreSQL)

**Goal:** Show that an uncommitted change does **not** become permanent. If the session ends without `COMMIT`, PostgreSQL rolls the transaction back — all-or-nothing.

**What we expect**

| Moment | `products.inventory` |
| ------ | -------------------- |
| Before `BEGIN` | `10` |
| Inside open transaction after `UPDATE` | `0` (visible only in this session) |
| After disconnect without `COMMIT` | `10` again (rollback) |

**Why this proves Atomicity**

- Inside the transaction you *see* inventory go to `0`.
- You never call `COMMIT`.
- Exiting `psql` aborts the open transaction → automatic `ROLLBACK`.
- The unit of work did not complete → none of its changes survive.
- That is Atomicity: succeed entirely, or leave the database as if the work never ran.

> **Note:** You also touch Durability indirectly: only *committed* work is durable. Uncommitted work must disappear on abort.

**1) Setup**

```sql
CREATE DATABASE app;
\c app

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price FLOAT,
  inventory INTEGER
);

CREATE TABLE sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  price FLOAT,
  quantity INTEGER
);

INSERT INTO products (id, name, price, inventory)
VALUES (1, 'Phone', 999.99, 10);

SELECT * FROM products;
-- id=1, name=Phone, price=999.99, inventory=10
```

**2) Start a transaction and change inventory (do not commit)**

```sql
BEGIN;

UPDATE products SET inventory = inventory - 10;

SELECT * FROM products;
-- inventory is 0 in this session
```

**3) Leave without `COMMIT`**

Exit the client (e.g. quit `psql`) while the transaction is still open. PostgreSQL aborts it.

**4) Reconnect and check**

```sql
\c app
SELECT * FROM products;
-- inventory is 10 again
```

**Result:** The `UPDATE` looked real inside the transaction, but after abort the database returned to the previous valid state. Atomic unit = all or nothing.

**Try next (optional):** Repeat the same steps, but run `COMMIT;` before exiting. After reconnect, inventory should stay `0`.

#### Consistency

A transaction must bring the database from one valid state to another.

- **Consistency in data**
  - Defined by the user
  - Referential integrity (foreign keys)
  - Related to atomicity of the transaction
  - Related to isolation of the transaction
- **Consistency in reads**
  - If a transaction committed a change, will a new transaction immediately see it?
  - Affects the system as a whole
  - Both relational and NoSQL databases deal with this
  - Eventual consistency

#### Isolation

**Isolation Level** controls how concurrent transactions see each other’s data.

PostgreSQL uses **MVCC** (Multi-Version Concurrency Control): readers usually do not block writers, and writers usually do not block readers. Isolation still decides *which version* of a row you see.

Simple case: one transaction runs an `UPDATE`, another runs a `SELECT` on the same rows. The isolation level decides whether the reader sees the old row version, waits, or sees a snapshot fixed at transaction start.

Question: can my in-flight transaction see changes made by other transactions?

**Transaction 1:**

```sql
SELECT id, quantity FROM products WHERE id = 1;
SELECT SUM(quantity) FROM products;
```

**Transaction 2:**

```sql
UPDATE products SET quantity = quantity - 1 WHERE id = 1;
```

If transactions are not isolated, results can be wrong.

##### Core anomalies

**Dirty read** — Transaction A changes data but has not committed yet. Transaction B’s `SELECT` reads those pending changes. If A later rolls back, B already used invalid data.

**Non-repeatable read** — You read a row, another transaction commits an update/delete to that row, your next `SELECT` sees a different value (or no row).

**Phantom read** — While Transaction A runs `SELECT`s, another transaction inserts (or deletes) rows that match A’s predicate. A’s later `SELECT` sees a different set of rows — new “ghost” rows appear (or disappear).

| Anomaly | What changed |
| ------- | ------------ |
| Dirty read | You read **uncommitted** changes from another transaction |
| Non-repeatable read | An **existing row** you already read was **updated** (or deleted) |
| Phantom read | The **set of rows** matching your query grew/shrank |

##### Isolation levels in PostgreSQL (overview)

| Level | PostgreSQL behavior | Dirty | Non-repeatable | Phantom |
| ----- | ------------------- | ----- | -------------- | ------- |
| **Read Uncommitted** | Accepted, but behaves like **Read Committed** (no real dirty reads) | 🟢 | 🔴 | 🔴 |
| **Read Committed** | **Default.** Each statement sees only data committed before that statement started | 🟢 | 🔴 | 🔴 |
| **Repeatable Read** | Snapshot of the DB as of transaction start; stable reads; phantoms normally blocked | 🟢 | 🟢 | 🟢 |
| **Serializable** | Snapshot + conflict detection (SSI); may abort a transaction with a serialization failure | 🟢 | 🟢 | 🟢 |

> PostgreSQL has **no separate `SNAPSHOT` isolation level name**. **Repeatable Read** already gives snapshot isolation. **Serializable** is stronger (Serializable Snapshot Isolation).

##### Setup for PostgreSQL labs

Open **two** `psql` sessions connected to `app` (reuse the Atomicity lab DB, or create it). Run setup once:

```sql
CREATE DATABASE app;          -- skip if it already exists
\c app

DROP TABLE IF EXISTS test_table;
CREATE TABLE test_table (
  id SERIAL PRIMARY KEY,
  field1 INT,
  field2 INT,
  field3 INT
);

INSERT INTO test_table (field1, field2, field3) VALUES
  (1, 2, 3),
  (1, 2, 3),
  (1, 2, 3),
  (1, 2, 3);
```

Use `pg_sleep(10)` so you have time to switch sessions (instead of a manual pause only).

##### 1) Read Uncommitted (same as Read Committed in PostgreSQL)

In the SQL standard this is the weakest level and can allow dirty reads. **In PostgreSQL, `READ UNCOMMITTED` is treated like `READ COMMITTED`** — you still cannot see uncommitted data from other sessions.

**Session 1:**

```sql
BEGIN;
UPDATE test_table SET field1 = 2;
SELECT pg_sleep(10);
ROLLBACK;
```

**Session 2 (run while Session 1 is sleeping):**

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT * FROM test_table;
```

You still see the **old** committed values (`field1 = 1`), not `2`. No dirty read. That is intentional PostgreSQL behavior.

##### 2) Read Committed (default)

Each statement sees only rows committed before **that statement** began. You never see dirty data. Across statements in the same transaction, another session’s **committed** updates can still change what you see → non-repeatable / phantom possible.

**Demonstrate non-repeatable read**

**Session 1:**

```sql
BEGIN;  -- default = READ COMMITTED
SELECT * FROM test_table WHERE id = 1;
SELECT pg_sleep(10);
SELECT * FROM test_table WHERE id = 1;  -- may differ after Session 2 commits
COMMIT;
```

**Session 2 (during the sleep):**

```sql
UPDATE test_table SET field1 = 7 WHERE id = 1;
-- auto-commit in psql unless you started a transaction
```

Session 1’s first select shows `field1 = 1`. After Session 2 commits, the second select shows `field1 = 7`. Non-repeatable read.

**Writers vs readers (MVCC):** a `SELECT` in Session 2 usually does **not** block waiting for Session 1’s open `UPDATE` — it reads the previous committed version. Blocking happens mainly when two writers conflict on the same row.

##### 3) Repeatable Read (snapshot)

PostgreSQL takes a **snapshot** at transaction start. All statements in that transaction see the same committed state (as of that snapshot). Committed updates from others do not change your view. Phantoms from inserts are normally **not** visible either.

**Session 1:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT * FROM test_table WHERE id = 1;
SELECT pg_sleep(10);
SELECT * FROM test_table WHERE id = 1;  -- same as first select
COMMIT;
```

**Session 2 (during the sleep):**

```sql
UPDATE test_table SET field1 = 7 WHERE id = 1;
```

Both selects in Session 1 still show the old `field1`. Session 2’s commit does not leak into Session 1’s snapshot.

If Session 1 later tries to `UPDATE` the same row that Session 2 already changed, PostgreSQL may raise: `could not serialize access due to concurrent update`.

##### 4) Serializable (SSI)

Strongest level in PostgreSQL. Like Repeatable Read’s snapshot, plus **serialization failure detection**. If the system detects a dangerous concurrent pattern, one transaction is aborted and must retry.

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- your reads/writes
COMMIT;
```

On conflict you may see:

```text
ERROR: could not serialize access due to read/write dependencies among transactions
```

Application pattern: catch the error → retry the whole transaction.

##### Phantom read lab (PostgreSQL)

A **phantom read** happens when a transaction runs the **same query twice** and the second run sees **new rows** that match the `WHERE` — because another transaction inserted matching rows and committed in between.

**Setup (once):**

```sql
\c app
DROP TABLE IF EXISTS products;
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT,
  price FLOAT,
  inventory INTEGER
);
INSERT INTO products (name, price, inventory)
VALUES ('Phone', 999.99, 10);
```

**Show phantom under Read Committed**

**Session A:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT COUNT(*) FROM products WHERE price > 500;
-- 1
SELECT pg_sleep(10);
SELECT COUNT(*) FROM products WHERE price > 500;
-- 2  ← phantom
COMMIT;
```

**Session B (during the sleep):**

```sql
INSERT INTO products (name, price, inventory)
VALUES ('Laptop', 1299.00, 5);
```

**What happened**

1. Session A counted rows with `price > 500` → `1` (Phone).
2. Session B inserted Laptop (`1299`) and committed.
3. Session A’s second count → `2`.
4. The extra row is the **phantom**.

**Block the phantom with Repeatable Read**

Same script in Session A, but:

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT COUNT(*) FROM products WHERE price > 500;
SELECT pg_sleep(10);
SELECT COUNT(*) FROM products WHERE price > 500;
-- still 1
COMMIT;
```

Session B’s insert can commit; Session A’s snapshot never sees it until A commits.

##### Serializable vs Phantom Read

**Phantom read** = same `SELECT` twice; between runs another transaction inserts/deletes matching rows; result set changes.

| | Read Committed | Repeatable Read (PostgreSQL) | Serializable |
| - | -------------- | ---------------------------- | ------------ |
| Sees other txs’ committed updates mid-transaction? | Yes (per statement) | No (snapshot) | No (snapshot + SSI) |
| Phantoms from INSERT? | 🔴 possible | 🟢 normally blocked | 🟢 blocked |
| May abort your transaction? | Rare for this case | On conflicting write to same row | On detected serialization conflict |

**How PostgreSQL stops phantoms at Repeatable Read**

- Snapshot is fixed at `BEGIN` / first query of the RR transaction.
- Inserts committed by others after that snapshot are invisible to you.
- You do not need range locks the way some lock-based engines do.

**When to use Serializable**

- Use when business rules need true serial execution (e.g. two transactions that each read a set and then write based on that set).
- Expect occasional `could not serialize access` → retry.

**Snapshot semantics vs Serializable (PostgreSQL)**

- **Repeatable Read** ≈ snapshot isolation (stable view, no dirty / non-repeatable / typical phantoms).
- **Serializable** = snapshot + dependency checks; safer for complex concurrent write patterns, higher chance of retry.

**Database implementation of isolation:**

- PostgreSQL isolation is built on **MVCC** + snapshots (+ SSI for Serializable)
- **Pessimistic** engines lean on locks; PostgreSQL readers mostly use versions instead
- **Optimistic** conflict handling appears when RR/Serializable writers collide — fail and retry

#### Durability

A transaction is durable: once committed, it is not lost even if the system fails (power loss, crash). Client changes must persist.

**Durability in practice**

Common strategies:

- **Write-Ahead Logging (WAL)** — record modifications in a log before changing main database files; on crash, replay the log to recover committed work
- **Write-Through Logging (WTL)** — write to log and database together; reduces loss risk and keeps log and storage aligned
- **Write-Behind / Write-Back Logging (WBL)** — write to log first; delay updating main files (often batched). Faster, but recovery must be careful
- **Variations by DBMS** — engines mix these strategies based on speed vs safety trade-offs

Logging guarantees that once a transaction is committed, recovery can reconstruct affected data after failure.

#### Eventual Consistency in Database Systems

**Consistency** (ACID) means a transaction moves the database from one valid state to another.

In distributed systems and many NoSQL databases, **eventual consistency** is common: given enough time without new updates, all replicas converge — but immediate consistency after each write is not guaranteed.

It can also appear in distributed relational setups when availability and partition tolerance are prioritized.

**Key points:**

- ACID consistency enforces integrity rules after each transaction
- Eventual consistency allows temporary differences between nodes; they converge over time
- Not exclusive to NoSQL

**Example**

Master `A`, replicas `A1` and `A2`:

1. Update `X` on master `A`
2. Read from `A1` before replication finishes → old value of `X` (temporary inconsistency)
3. After replication to `A1` and `A2`, all nodes share the same up-to-date `X`

Immediate consistency is not guaranteed; the system eventually becomes consistent once replicas sync.

---

### 03 — Understanding Database Internals {#_03-understanding-database-internals}

- **Status:** `[ ]`
- **Summary:** Inside the database engine — storage, buffer, execution.
- **Focus:** How a DBMS works under the hood.
- **Notes:** *(later)*

---

### 04 — Database Indexing {#_04-database-indexing}

- **Status:** `[ ]`
- **Summary:** What indexes are, when to create them, read/write cost.
- **Focus:** Index types, selectivity, and trade-offs.
- **Notes:** *(later)*

---

### 05 — B-Tree vs B+Tree in Production Database Systems {#_05-b-tree-vs-btree-in-production-database-systems}

- **Status:** `[ ]`
- **Summary:** Compare B-Tree and B+Tree in real systems.
- **Focus:** Tree indexes used by production databases.
- **Notes:** *(later)*

---

### 06 — Database Partitioning {#_06-database-partitioning}

- **Status:** `[ ]`
- **Summary:** Partitioning data within one system.
- **Focus:** Horizontal / vertical partitioning strategies.
- **Notes:** *(later)*

---

### 07 — Database Sharding {#_07-database-sharding}

- **Status:** `[ ]`
- **Summary:** Sharding — distribute data across nodes.
- **Focus:** Shard keys, routing, and cross-shard challenges.
- **Notes:** *(later)*

---

### 08 — Concurrency Control {#_08-concurrency-control}

- **Status:** `[ ]`
- **Summary:** Concurrency control, locks, anomalies.
- **Focus:** Locks, MVCC, isolation levels in practice.
- **Notes:** *(later)*

---

### 09 — Database Replication {#_09-database-replication}

- **Status:** `[ ]`
- **Summary:** Copy data for availability and read scale.
- **Focus:** Leader/follower, sync vs async, lag.
- **Notes:** *(later)*

---

### 10 — Database System Design {#_10-database-system-design}

- **Status:** `[ ]`
- **Summary:** Design a database system for real requirements.
- **Focus:** Modeling requirements into DB architecture choices.
- **Notes:** *(later)*

---

### 11 — Database Engines {#_11-database-engines}

- **Status:** `[ ]`
- **Summary:** Storage engines and how they differ (e.g. InnoDB).
- **Focus:** Storage engines and when to choose which.
- **Notes:** *(later)*

---

### 12 — Database Cursors {#_12-database-cursors}

- **Status:** `[ ]`
- **Summary:** Cursors — walk query results incrementally.
- **Focus:** Server/client cursors and streaming result sets.
- **Notes:** *(later)*

---

### 13 — Database Security {#_13-database-security}

- **Status:** `[ ]`
- **Summary:** Database security — access, encryption, threats.
- **Focus:** AuthZ, encryption at rest/in transit, hardening.
- **Notes:** *(later)*

---

### 14 — Homomorphic Encryption {#_14-homomorphic-encryption}

- **Status:** `[ ]`
- **Summary:** Query encrypted data without full decryption.
- **Focus:** Homomorphic encryption for encrypted-data queries.
- **Full title:** Homomorphic Encryption — Performing Database Queries on Encrypted Data
- **Notes:** *(later)*

---

### 15 — Q&A {#_15-qa}

- **Status:** `[ ]`
- **Summary:** Answers to course questions.
- **Focus:** Instructor Q&A sessions.
- **Notes:** *(later)*

---

### 16 — Database Discussions {#_16-database-discussions}

- **Status:** `[ ]`
- **Summary:** Extra discussions around database topics.
- **Focus:** Extended discussions beyond core lectures.
- **Notes:** *(later)*

---

### 17 — Archived Lectures {#_17-archived-lectures}

- **Status:** `[ ]`
- **Summary:** Archived / older lectures.
- **Focus:** Archived material for reference.
- **Notes:** *(later)*

---

## Legend

| Mark | Meaning |
| ---- | ------- |
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done |

Update the **Progress** table when you change chapter status.
