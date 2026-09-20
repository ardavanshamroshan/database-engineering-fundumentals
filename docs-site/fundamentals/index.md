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

A transaction is isolated from other transactions so each sees a consistent snapshot of the database.

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

**Isolation levels for in-flight transactions:**

- **Read Uncommitted** — no isolation; outside changes are visible, committed or not
  - 🔴 Dirty reads: may occur
  - 🔴 Lost updates: may occur
  - 🔴 Non-repeatable reads: may occur
  - 🔴 Phantom reads: may occur
- **Read Committed** — each query only sees changes committed by other transactions
  - 🟢 Dirty reads: do not occur
  - 🔴 Lost updates: may occur
  - 🔴 Non-repeatable reads: may occur
  - 🔴 Phantom reads: may occur
- **Repeatable Read** — once a query reads a row, that row stays unchanged for the rest of the transaction
  - 🟢 Dirty reads: do not occur
  - 🟢 Lost updates: do not occur
  - 🟢 Non-repeatable reads: do not occur
  - 🔴 Phantom reads: may occur
- **Snapshot** — each query only sees changes committed up to the start of the transaction (a snapshot)
  - 🟢 Dirty reads: do not occur
  - 🟢 Lost updates: do not occur
  - 🟢 Non-repeatable reads: do not occur
  - 🟢 Phantom reads: do not occur

##### Phantom read

A **phantom read** happens when a transaction runs the **same query twice** and the second run sees **new rows** (or missing rows) that match the `WHERE` predicate — because another transaction **inserted** or **deleted** matching rows and committed in between.

| Anomaly | What changed |
| ------- | ------------ |
| Non-repeatable read | An **existing row** you already read was **updated** (or deleted) |
| Phantom read | The **set of rows** matching your query grew/shrank — a new “ghost” row appears (or disappears) |

**Lab (PostgreSQL) — two sessions**

Use the `products` table from the Atomicity lab (or recreate it). Open **two** `psql` sessions to `app`.

**Setup (once):**

```sql
\c app
TRUNCATE products RESTART IDENTITY;
INSERT INTO products (name, price, inventory)
VALUES ('Phone', 999.99, 10);
```

**Session A — start transaction, count matching rows:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT COUNT(*) FROM products WHERE price > 500;
-- 1
```

**Session B — insert a matching row and commit:**

```sql
INSERT INTO products (name, price, inventory)
VALUES ('Laptop', 1299.00, 5);
COMMIT;  -- if you were in a transaction; otherwise the INSERT auto-commits
```

**Session A — same query again (still inside the open transaction):**

```sql
SELECT COUNT(*) FROM products WHERE price > 500;
-- 2  ← phantom: a new row appeared in the result set
COMMIT;
```

**What happened**

1. Session A counted rows with `price > 500` → `1` (Phone).
2. Session B inserted Laptop (`1299`) and committed.
3. Session A ran the same predicate again → `2`.
4. The extra row is the **phantom**: it was not in the first result set of this transaction.

**Under stronger isolation**

Repeat the same steps, but in Session A use:

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- or: SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

In PostgreSQL, Repeatable Read uses a snapshot — the second `COUNT(*)` usually stays `1` until you commit. Snapshot / Serializable block this phantom; Read Committed allows it.

**Database implementation of isolation:**

- Each DBMS implements isolation levels differently
- **Pessimistic** — row / table / page locks to avoid lost updates
- **Optimistic** — no locks; track changes and fail the transaction if conflict
- Repeatable Read often “locks” rows it read; expensive on large reads. PostgreSQL implements RR as snapshot — that is why you typically do not get phantom reads with Postgres under Repeatable Read

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
