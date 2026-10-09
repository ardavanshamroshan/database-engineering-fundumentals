# Database Engineering Fundamentals

**Personal learning path — chapter by chapter**

Skeleton study guide for the *Database Engineering Fundamentals* course.
Mark progress as you go. Chapter notes grow over time.

**Docs site:** [ardavanshamroshan.github.io/database-engineering-fundumentals](https://ardavanshamroshan.github.io/database-engineering-fundumentals/)

**Language:** English · [فارسی](README.fa.md)

**Cheatsheets:** [PostgreSQL](cheatsheets/postgresql.md) · [MySQL](cheatsheets/mysql.md) · [SQLite](cheatsheets/sqlite.md) · [Redis](cheatsheets/redis.md) · [MongoDB](cheatsheets/mongodb.md) · [Cassandra](cheatsheets/cassandra.md) · [ScyllaDB](cheatsheets/scylladb.md)

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

**Local course materials:**

`/Users/ardavan/Documents/Coding/Tutorials/Database Engineering Fundumentals`

---

## Table of contents

### Part 0 — Meta

- [01 — Course Updates](#01--course-updates)

### Part I — Foundations

- [02 — ACID](#02--acid)
- [03 — Understanding Database Internals](#03--understanding-database-internals)
- [04 — Database Indexing](#04--database-indexing)
- [05 — B-Tree vs B+Tree](#05--b-tree-vs-btree-in-production-database-systems)

### Part II — Scale & Distribution

- [06 — Database Partitioning](#06--database-partitioning)
- [07 — Database Sharding](#07--database-sharding)
- [08 — Concurrency Control](#08--concurrency-control)
- [09 — Database Replication](#09--database-replication)

### Part III — Systems & Engines

- [10 — Database System Design](#10--database-system-design)
- [11 — Database Engines](#11--database-engines)
- [12 — Database Cursors](#12--database-cursors)

### Part IV — Security

- [13 — Database Security](#13--database-security)
- [14 — Homomorphic Encryption](#14--homomorphic-encryption)

### Part V — Extra

- [15 — Q&A](#15--qa)
- [16 — Database Discussions](#16--database-discussions)
- [17 — Archived Lectures](#17--archived-lectures)

---

## Chapters

### 01 — Course Updates

- **Status:** `[ ]`
- **Summary:** Course changelog and material updates.
- **Focus:** Stay aligned with latest course content.
- **Notes:** *(later)*

---

### 02 — ACID

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

### 03 — Understanding Database Internals

- **Status:** `[ ]`
- **Summary:** How data is stored and found inside a database.
- **Focus:** What happens "under the hood"—storage, pages, indexes, and IO.

#### How tables and indexes are stored and found — explained simply

**Key Database Storage Ideas:**

- **Table:** Just a grid that stores your data as rows and columns.
  
  *Example:*
  
  | id | name    | email              |
  |----|---------|--------------------|
  | 1  | Alice   | alice@email.com    |
  | 2  | Bob     | bob@email.com      |
  | 3  | Charlie | charlie@email.com  |
  
  Each row is a record. Columns are data fields.
  
  *PostgreSQL code sample:*
  ```sql
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- **Row ID:** Every row has a unique identifier. This helps the database find exactly the row it needs, quickly. Sometimes it's the primary key; sometimes (like in PostgreSQL) it's a hidden system value.

- **Page:** Databases store and move data in "pages" — chunks (usually 8KB or 16KB). One page holds several rows. When the database reads data, it grabs whole pages, not just single rows.

    - Example: If each page can hold 3 rows, and your table has 1,001 rows, you'll use about 334 pages.

- **IO (Input/Output):** The act of reading/writing between the computer’s memory and the storage disk/SSD. Each IO operation reads at least a whole page, never a single row. Too many IOs = slow database.

- **Heap:** This is a simple way the database saves table rows: just stick each row in the next available spot (no sorting). Fast to insert, but slow to search unless there's help.

    - If you want to find something fast without looking everywhere, you need...

- **Index:** An index is like a map that points you straight to the row(s) you want in the table (the "heap"). Most often, indexes are organized as **B-Trees** or **B+Trees**—special kinds of sorted trees that make finding data very fast.

    - **How indexes work:**
      1. The index holds key data (some columns).
      2. For each key, it has a pointer to the heap location (what page, what row).
      3. You search the index, and it tells the database exactly where to find your record—no need to scan the whole table!

    - **Index highlights:**
        - Can cover one or multiple columns (you pick when you create the index).
        - Stored as pages, like tables, but usually much smaller and more memory-friendly.
        - Most common: **B-Tree** or **B+Tree** structures.

    - **Picture it:**
      ```
      [Index on email]
           |
       "bob@email.com"
           |
      points to
           |
      [Heap Page X] → Row for Bob
      ```

**In summary**:  
- Data is stored in tables (rows & columns).
- Each row sits in a page.  
- The database moves pages, not individual rows.
- The heap just packs rows wherever there’s space.
- Indexes are search aids—they point straight to data, so you don’t have to look through every row.

![Index on EMP_ID pointing into a Heap — two I/O steps](images/index-emp-id-heap.png)

**Diagram — Index lookup vs Heap fetch**

1. **IO1 on the index:** search the index on `EMP_ID` to find the pointer `(page_id, row_id)`.
2. **IO2 on the heap:** use that pointer to read the exact heap page and pull the full row.

Non-clustered / secondary indexes in PostgreSQL work the same idea: the index stores keys + a tuple pointer (`ctid`) into the heap; matching usually costs (at least) index I/O then heap I/O.

- **Example of a query:**  
  Suppose you have a table of employees with an index on `email`.

  - **Query:**  
    ```sql
    SELECT * FROM employees WHERE email = 'bob@email.com';
    ```
  
  - **Heap Only (no index):**  
    The database has to scan every row in the table to find the one with Bob's email. If the table has 10,000 rows, it checks all 10,000 (could be hundreds of pages!). Very slow for big tables.

  - **With Index:**  
    1. The database first looks up `'bob@email.com'` in the **index** (fast, usually just 1 or 2 pages read).
    2. The index tells it exactly which heap page and row has Bob's data.
    3. It jumps straight there and reads just that page to get the full row.
    4. Result: The database does just 2 reads (IOs) instead of scanning everything. Much faster!

  #### Row vs Column Oriented Databases

- **Row-Oriented Database (Row Store):**  
  - Stores entire rows together in each block on disk; all the columns of a row are side-by-side.
  - Reading a block gives you complete rows at once (all columns and their values for each row).
  - Scanning for particular rows can take multiple IOs, but once you find the row, all its data is loaded together.
  - Best for:
    - Transactional systems (OLTP) where you often read or write full rows (e.g. inserting or updating records).
    - Workloads that require keeping row integrity for joins or modifications.
    - Example systems: PostgreSQL, MySQL, SQLite, etc.
    - Example table (row storage):
      | id | name    | email              |
      |----|---------|--------------------|
      | 1  | Alice   | alice@email.com    |
      | 2  | Bob     | bob@email.com      |
      | 3  | Charlie | charlie@email.com  |

![Table in a Row-Oriented Database](images/table-row-oriented.jpg)

- **Column-Oriented Database (Column Store):**  
  - Stores all values of each column together in separate blocks (column chunks), so values for a given column are physically grouped.
  - Reading a block returns many values from one column, but not whole rows.
  - Fetching all values for a column (for filtering or aggregation) is very fast and efficient—just a few blocks might need to be loaded. But reconstructing full rows across many columns can require more IOs.
  - Best for:
    - Analytical workloads (OLAP), like reporting, aggregations, and filtering across huge tables.
    - When you usually process only a few columns at a time, or want to scan large datasets column-wise.
    - Example systems: ClickHouse, Amazon Redshift, Vertica, Apache Parquet, etc.
    - Example (simplified view) — columns stored separately:
      ```
      id:    [1,   2,    3,    ...]
      name:  [Alice, Bob, Charlie, ...]
      email: [alice@email.com, bob@email.com, charlie@email.com, ...]
      ```

#### Pros and Cons

| Row-Oriented Databases           | Column-Oriented Databases        |
| -------------------------------- | -------------------------------- |
| Fast for transactional reads/writes (full rows) | Slower for writes, especially for many columns at once |
| Ideal for OLTP (transactions, frequent updates) | Ideal for OLAP (analytics, aggregations, reporting) |
| Less effective data compression  | Excellent compression (column similarity) |
| Inefficient for aggregation workloads | Extremely efficient for aggregation, filtering, scans on few columns |
| Efficient for queries involving many/all columns of a row | Inefficient for point queries fetching full rows |

![Table in a Column-Oriented Database](images/table-column-oriented.jpg)


### 04 — Database Indexing

- **Status:** `[ ]`
- **Summary:** What indexes are, when to create them, read/write cost.
- **Focus:** Index types, selectivity, and trade-offs.

#### Heap vs index (the two files)

PostgreSQL table rows live in the **heap**: unordered 8KB pages. Insert puts the tuple in the first page with space. No sort. Fast write. Slow lookup — without help, the engine **Seq Scans** every heap page.

An **index** is a second structure (usually a B-Tree). Each leaf stores `(key → ctid)`. `ctid` is `(page, slot)` — the heap address.

```
INSERT  →  write heap page  (+ write every index on that table)
SELECT  →  Seq Scan heap
        or Index Scan: walk index → ctid → heap page (IO1 + IO2)
        or Index Only Scan: answer from index; Heap Fetches = 0 if visibility map says page all-visible
```

`PRIMARY KEY` / `UNIQUE` already create a unique B-Tree. `CREATE INDEX` adds extra trees. `SELECT *` with no `WHERE` never uses them — you asked for every heap row.

![Index on EMP_ID pointing into a Heap — two I/O steps](images/index-emp-id-heap.png)

#### Lab (PostgreSQL 18.4)

```sql
CREATE TABLE employees (
  id   serial PRIMARY KEY,   -- creates unique btree employees_pkey
  name varchar(255)
);

INSERT INTO employees (name)
SELECT 'User ' || generate_series(1, 1000);

SELECT * FROM employees WHERE id = 1;

EXPLAIN ANALYZE SELECT id FROM employees WHERE id = 2000;
EXPLAIN ANALYZE SELECT id FROM employees WHERE name LIKE '%User %';

CREATE INDEX employees_name ON employees(name);

CREATE TABLE grades (
  id   serial PRIMARY KEY,
  name varchar(255)
);
CREATE INDEX idx_grades_names ON grades(name);

EXPLAIN ANALYZE SELECT * FROM grades;  -- measured
EXPLAIN SELECT * FROM grades;          -- estimate only
```

1 000 rows is tiny (heap ≈ 6 pages). Planner often prefers Seq Scan. Same queries on 100 000 rows make the gap obvious.

`EXPLAIN` = estimated cost. `EXPLAIN ANALYZE` = actually run it. Add `BUFFERS` to count pages.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM employees WHERE id = 2000;
```

#### Benchmarks (local, PostgreSQL 18.4, warm cache)

| Query | Plan | Heap fetches / pages | Time |
| ----- | ---- | -------------------- | ---- |
| `SELECT * FROM employees WHERE id = 1` (1k) | **Index Scan** `employees_pkey` | index + heap (3 buffers) | ~0.12 ms |
| `SELECT id FROM employees WHERE id = 2000` (1k, miss) | **Index Only Scan** `employees_pkey` | Heap Fetches: 0 · 2 buffers | 0.028 ms |
| `SELECT id … WHERE name LIKE '%User %'` (1k) | **Seq Scan** | 6 heap pages, 1000 hits | 0.17 ms |
| `SELECT * FROM grades` (empty) | **Seq Scan** | 0 pages | 0.007 ms |
| `SELECT id FROM employees_big WHERE id = 2000` (100k) | **Index Only Scan** | Heap Fetches: 0 · 3 buffers | **0.005 ms** |
| `SELECT * FROM employees_big WHERE id = 2000` | **Index Scan** | index + heap (3 buffers) | 0.014 ms |
| `SELECT id … WHERE name = 'User 50000'` | **Index Scan** `employees_big_name` | index + heap | 0.017 ms |
| `SELECT id … WHERE name LIKE '%User 99999'` | **Seq Scan** | **541 heap pages**, 99 999 filtered | **3.5 ms** |
| `LIKE 'User 5000%'` default btree | **Seq Scan** | 541 pages | ~12 ms |
| `LIKE 'User 5000%'` + `varchar_pattern_ops` | **Index Scan** | ~5 buffers, 11 rows | **0.029 ms** |

Sizes (100k rows): heap **4328 kB** (541 pages) · PK index **2208 kB** · name index **3104 kB**. Index is extra storage you rewrite on every `INSERT`/`UPDATE`/`DELETE`.

#### What each plan means

**1. Index Scan — index then heap**

```sql
SELECT * FROM employees WHERE id = 1;
-- Index Scan using employees_pkey
-- Index Cond: (id = 1)
```

PK btree finds `ctid`, then reads that heap page for `name`. Two I/Os in the diagram above. Needed whenever the index does not store every selected column.

**2. Index Only Scan — stay in the index**

```sql
SELECT id FROM employees WHERE id = 2000;
-- Index Only Scan using employees_pkey
-- Heap Fetches: 0
```

`id` lives in `employees_pkey`, so no heap row. `id = 2000` on a 1k table is a **miss** (`rows=0`) — still cheap: one index probe, not a table walk.

`Heap Fetches: 0` after `VACUUM`: visibility map marks heap pages all-visible. If vacuum is stale, Postgres still peeks at the heap (`Heap Fetches > 0`) even on an index-only plan.

**3. Seq Scan — walk the heap**

```sql
SELECT id FROM employees WHERE name LIKE '%User %';
-- Seq Scan on employees
-- Filter: (name ~~ '%User %')
```

Leading `%` cannot seek in a B-Tree (tree is sorted from the **start** of the key). Engine reads every heap page and applies the filter. Same plan **before and after** `CREATE INDEX employees_name`. Index does not help.

Empty `grades`: `SELECT *` has no `WHERE`. Index on `name` unused. Seq Scan of zero pages.

**4. Equality on a secondary index still hits the heap**

```sql
CREATE INDEX employees_name ON employees(name);

SELECT id FROM employees WHERE name = 'User 500';
-- Index Scan using employees_name   -- not Index Only
```

Name index stores `(name → ctid)`, not `id`. Lookup name, then heap-fetch the row to return `id`. Covering index (`INCLUDE (id)`) can turn this into Index Only Scan.

**5. Prefix `LIKE` needs the right opclass**

Default btree on `varchar` (non-C collation) supports `=`, `<`, `>`. It does **not** support `LIKE 'User 5%'`. Planner Seq Scans even at 100k rows.

```sql
CREATE INDEX employees_name_pattern ON employees (name varchar_pattern_ops);

-- now:
-- Index Cond: (name ~>=~ 'User 5000' AND name ~<~ 'User 5001')
-- Filter: (name ~~ 'User 5000%')
```

Range on the index, then `~~` filter. Leading-wildcard `LIKE '%User %'` still Seq Scan.

#### When to create an index

Create for:

- Equality / range on a selective column (`WHERE id =`, `WHERE email =`, `WHERE created_at >`)
- Join keys and `ORDER BY` that match the index order
- Prefix `LIKE 'foo%'` / `LIKE 'foo_'` **with** `varchar_pattern_ops` (or `C` collation)

Skip / waste:

- Tiny tables (1k rows, a few pages) — Seq Scan already cheap
- `SELECT *` with no filter
- Leading-wildcard `LIKE '%…%'` (use `pg_trgm` GIN if you must)
- Low-selectivity columns (`boolean`, status with 2 values) — index lookup + random heap I/O can lose to Seq Scan

#### Read vs write cost

| | Heap only | Heap + indexes |
| --- | --- | --- |
| `INSERT` | append tuple to a heap page | heap **plus** a leaf insert in every btree |
| Point `SELECT` | scan all heap pages | few index pages + maybe 1 heap page |
| `UPDATE` of indexed column | heap + new tuple (MVCC) | also update / insert index entries |

Indexes speed **selective reads**. They slow **writes** and consume RAM/disk. Measure with `EXPLAIN (ANALYZE, BUFFERS)` on realistic row counts, not 1k toy tables.

### 04.1 — Index Scan vs Index Only Scan

- **Status:** `[ ]`
- **Summary:** How PostgreSQL retrieves rows through an index, and when it can avoid reading the heap entirely.
- **Focus:** `Index Scan`, `Index Only Scan`, heap fetches, covering indexes, and visibility map.

#### Index Scan — index → heap

An **Index Scan** uses the index to find matching rows, but then goes to the table's **heap** to retrieve the remaining columns.

For a B-Tree index, the basic flow is:

```text
Query
  ↓
B-Tree index
  ↓
find matching key
  ↓
CTID
  ↓
heap page
  ↓
table row
```

Example:

```sql
CREATE TABLE employees (
    id   serial PRIMARY KEY,
    name varchar(255),
    email varchar(255)
);

INSERT INTO employees (name, email)
SELECT
    'User ' || i,
    'user' || i || '@example.com'
FROM generate_series(1, 100000) AS i;

CREATE INDEX employees_email ON employees(email);
```

Now query by email:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM employees
WHERE email = 'user50000@example.com';
```

A typical plan:

```text
Index Scan using employees_email on employees
  Index Cond: (email = 'user50000@example.com')
```

Why is it an **Index Scan**?

The index contains approximately:

```text
email → CTID
```

For example:

```text
user50000@example.com → (page 270, slot 15)
```

The index can find the row's location, but the query asks for:

```sql
SELECT *
```

The index does not contain all columns of the table.

So PostgreSQL must visit the heap:

```text
employees_email
      │
      │ find email
      ↓
    CTID
      │
      │ visit heap
      ↓
┌─────────────────────┐
│ id                  │
│ name                │
│ email               │
└─────────────────────┘
```

### Simple example

```sql
SELECT id
FROM employees
WHERE email = 'user50000@example.com';
```

The index knows:

```text
email → CTID
```

but it does **not** normally know:

```text
email → id
```

Therefore PostgreSQL still needs to visit the heap to retrieve `id`.

---

#### Index Only Scan — stay inside the index

An **Index Only Scan** is different.

PostgreSQL can answer the query directly from the index without reading the heap row.

For example, the primary key creates an index:

```sql
CREATE TABLE employees (
    id   serial PRIMARY KEY,
    name varchar(255)
);
```

The primary key index contains:

```text
id → CTID
```

Now:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM employees
WHERE id = 50000;
```

PostgreSQL may use:

```text
Index Only Scan using employees_pkey on employees
  Index Cond: (id = 50000)
  Heap Fetches: 0
```

The important part is:

```text
Heap Fetches: 0
```

The query only needs `id`.

The index already contains `id`, so PostgreSQL does not need the heap.

```text
Query
  ↓
B-Tree index
  ↓
find id = 50000
  ↓
return id
```

No second trip to the heap.

---

#### Index Scan vs Index Only Scan

The easiest way to remember the difference:

```text
Index Scan

Index
  ↓
CTID
  ↓
Heap
  ↓
Result
```

```text
Index Only Scan

Index
  ↓
Result
```

| | Index Scan | Index Only Scan |
|---|---|---|
| Uses index | Yes | Yes |
| Reads heap | Usually yes | Can avoid it |
| Needs CTID | Yes | Not for returning indexed values |
| Can return indexed columns | Yes | Yes |
| `Heap Fetches: 0` possible | No | Yes |
| Usually faster | Sometimes | Often |

---

#### Why can Index Only Scan still access the heap?

There is an important PostgreSQL detail.

PostgreSQL uses **MVCC**, so an index entry alone does not always tell PostgreSQL whether the corresponding row is visible to the current transaction.

PostgreSQL maintains a **visibility map** for heap pages.

Conceptually:

```text
Visibility Map

Heap Page 1 → all-visible
Heap Page 2 → all-visible
Heap Page 3 → not all-visible
Heap Page 4 → all-visible
```

If the heap page containing the row is marked **all-visible**, PostgreSQL knows it does not need to check the heap for visibility.

Therefore:

```text
Index Only Scan
Heap Fetches: 0
```

is possible.

If the visibility information is not sufficient:

```text
Index Only Scan
Heap Fetches: 150
```

can happen.

So:

> **Index Only Scan means PostgreSQL has a plan that can answer from the index, but it may still perform heap fetches to check visibility.**

---

#### Check it yourself

Create a larger table:

```sql
CREATE TABLE employees_big (
    id   serial PRIMARY KEY,
    name varchar(255),
    email varchar(255)
);

INSERT INTO employees_big (name, email)
SELECT
    'User ' || i,
    'user' || i || '@example.com'
FROM generate_series(1, 100000) AS i;
```

Run:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM employees_big
WHERE id = 50000;
```

You may see something similar to:

```text
Index Only Scan using employees_big_pkey on employees_big
  Index Cond: (id = 50000)
  Heap Fetches: 0
```

The important observation is:

```text
SELECT id
```

and:

```text
PRIMARY KEY → index contains id
```

Therefore PostgreSQL can potentially answer the entire query from the index.

---

#### `SELECT *` changes the situation

Compare:

```sql
SELECT id
FROM employees_big
WHERE id = 50000;
```

with:

```sql
SELECT *
FROM employees_big
WHERE id = 50000;
```

The first query only needs:

```text
id
```

which exists in the primary-key index.

The second needs:

```text
id
name
email
```

but the primary-key index does not contain `name` and `email`.

Therefore PostgreSQL normally needs the heap:

```text
SELECT id
       ↓
Index Only Scan
       ↓
Index

SELECT *
       ↓
Index Scan
       ↓
Index
       ↓
Heap
```

---

#### Covering Index with `INCLUDE`

PostgreSQL allows us to store additional columns in an index using `INCLUDE`.

Example:

```sql
CREATE INDEX employees_email_covering
ON employees_big(email)
INCLUDE (id);
```

Now the index conceptually contains:

```text
email → id + CTID
```

Run:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM employees_big
WHERE email = 'user50000@example.com';
```

The query can potentially use:

```text
Index Only Scan using employees_email_covering
```

because:

```text
WHERE email = ...
```

is supported by the indexed key, and:

```text
SELECT id
```

is available from the included column.

This is called a **covering index**.

---

#### `INCLUDE` vs normal index columns

Consider:

```sql
CREATE INDEX employees_email
ON employees_big(email);
```

The index key is:

```text
email
```

Now:

```sql
SELECT id
FROM employees_big
WHERE email = 'user50000@example.com';
```

may require a heap lookup.

With:

```sql
CREATE INDEX employees_email_covering
ON employees_big(email)
INCLUDE (id);
```

the index contains the additional `id` value.

Conceptually:

```text
Key columns:
email

Included columns:
id
```

The included column is stored for covering queries; it is not part of the index's search/order key.

---

#### Lab — Compare the two

First create the normal index:

```sql
DROP INDEX IF EXISTS employees_email;

CREATE INDEX employees_email
ON employees_big(email);
```

Run:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM employees_big
WHERE email = 'user50000@example.com';
```

Now replace it with a covering index:

```sql
DROP INDEX employees_email;

CREATE INDEX employees_email_covering
ON employees_big(email)
INCLUDE (id);
```

Run the same query:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM employees_big
WHERE email = 'user50000@example.com';
```

Compare:

```text
Normal index:

Index Scan
    ↓
Heap
```

with:

```text
Covering index:

Index Only Scan
    ↓
Index
```

Then check:

```text
Heap Fetches: 0
```

---

#### Important: `Index Only Scan` is not automatically faster

An Index Only Scan can be faster because it can avoid heap reads, but PostgreSQL still considers the total cost.

For example:

```sql
SELECT *
FROM employees_big
WHERE email = 'user50000@example.com';
```

If the index does not contain every requested column, PostgreSQL still needs the heap.

Adding every column to an index is usually a bad idea:

```sql
CREATE INDEX huge_index
ON employees_big(email)
INCLUDE (id, name, address, phone, ...)
```

Indexes consume:

- Disk space
- Memory/cache
- Insert cost
- Update cost
- Delete cost
- Maintenance time

The goal is not:

> "Make every query use Index Only Scan."

The goal is:

> **Create indexes that make important queries cheaper without making writes and maintenance unnecessarily expensive.**

---

#### Practical rule

When reading an execution plan:

```text
Index Scan
```

think:

> **"PostgreSQL found the row through the index, then went to the heap."**

When you see:

```text
Index Only Scan
Heap Fetches: 0
```

think:

> **"PostgreSQL answered the query directly from the index without reading the heap."**

And when you see:

```text
Index Only Scan
Heap Fetches: 1000
```

think:

> **"The index contains the required columns, but PostgreSQL still had to visit heap pages for visibility checks."**

---

#### Quick mental model

```text
                  PostgreSQL SELECT
                         │
              ┌──────────┴──────────┐
              │                     │
          Index Scan          Index Only Scan
              │                     │
        Find matching key     Find matching key
              │                     │
             CTID            Data already in index
              │                     │
            Heap              Visibility Map
              │                     │
              └───────┬─────────────┘
                      ↓
                    Result
```

The key distinction is simple:

```text
Index Scan
= Index + Heap

Index Only Scan
= Index (+ visibility check)
```

This distinction becomes especially important when designing **covering indexes**, analyzing `EXPLAIN (ANALYZE, BUFFERS)`, and optimizing high-frequency read queries.


### 04.2 — Key vs Non-Key Columns in Database Indexing

- **Status:** `[ ]`
- **Summary:** Understand the difference between index key columns and non-key (included) columns, and how they affect query performance.
- **Focus:** B-Tree structure, `INCLUDE`, covering indexes, heap lookups, index size, and read/write trade-offs.
- **Database:** PostgreSQL 18.4

#### 1. Understanding key and non-key columns

When creating a database index, we need to distinguish between two concepts:

**Key columns** are used to search, filter, and organize entries in the index.

**Non-key columns**, when supported through an `INCLUDE` clause, are stored in the index to provide additional data without becoming part of its search or ordering key.

For example, consider this table:

```sql
CREATE TABLE students (
    id         serial PRIMARY KEY,
    firstname  varchar(255),
    lastname   varchar(255),
    middlename varchar(255),
    address    varchar(255),
    bio        text,
    dob        date,
    id1        integer,
    id2        integer,
    id3        integer,
    id4        integer,
    id5        integer,
    id6        integer
);
```

The primary key automatically creates a unique B-Tree index on `id`.

Verify it:

```sql
\d students
```

Initially, you should see an index similar to:

```text
Indexes:
    "students_pkey" PRIMARY KEY, btree (id)
```

This means PostgreSQL has created an index for `id`, but it has not automatically indexed the other columns.

For example:

```sql
SELECT *
FROM students
WHERE id = 10;
```

PostgreSQL can use the primary key index to locate the row.

However:

```sql
SELECT *
FROM students
WHERE lastname = 'Smith';
```

There is no index on `lastname`, so PostgreSQL will generally need a sequential scan unless another suitable index exists.

---

#### 2. Key columns: the search structure

Let's create an index on `lastname`.

```sql
CREATE INDEX idx_students_lastname
ON students(lastname);
```

The index's key column is `lastname`.

Conceptually, its entries look like this:

```text
idx_students_lastname

Key: lastname
       |
       v
+------------------+
| Anderson → CTID  |
| Brown    → CTID  |
| Davis    → CTID  |
| Smith    → CTID  |
| Wilson   → CTID  |
+------------------+
```

The actual B-Tree is organized into pages, not one simple list. This diagram illustrates the concept.

Now execute:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM students
WHERE lastname = 'Smith';
```

If the table is sufficiently large and the planner considers the index efficient, you may see:

```text
Index Scan using idx_students_lastname on students
  Index Cond: (lastname = 'Smith')
```

The process is:

1. Search the B-Tree for `lastname = 'Smith'`.
2. Find the matching index entry.
3. Obtain the heap tuple location.
4. Read the heap to retrieve the requested columns.

Why does PostgreSQL visit the heap?

Because the query requests `*`, including columns such as `firstname`, `address`, and `bio`.

The index on `lastname` does not contain all those values.

**Key columns help PostgreSQL find matching rows. They do not automatically make every column available without accessing the heap.**

---

#### 3. Non-key columns: the `INCLUDE` clause

PostgreSQL supports non-key index columns through `INCLUDE`.

Suppose this query is common in your application:

```sql
SELECT firstname, lastname
FROM students
WHERE lastname = 'Smith';
```

We can create a covering index:

```sql
CREATE INDEX idx_students_lastname_covering
ON students(lastname)
INCLUDE (firstname);
```

Here:

- `lastname` is the **key column**.
- `firstname` is the **non-key included column**.

Conceptually:

```text
idx_students_lastname_covering

Key column: lastname
Included column: firstname

+-----------------------------+
| lastname | firstname        |
+-----------------------------+
| Brown    | Michael          |
| Davis    | Sarah             |
| Smith    | John              |
| Smith    | Alice             |
| Wilson   | David             |
+-----------------------------+
```

The index is organized by `lastname`. The included `firstname` values are stored to make them available when the query needs them.

Now run:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT firstname, lastname
FROM students
WHERE lastname = 'Smith';
```

PostgreSQL may choose:

```text
Index Only Scan using idx_students_lastname_covering on students
  Index Cond: (lastname = 'Smith')
```

If the relevant heap pages are marked all-visible in PostgreSQL's visibility map, you may also see:

```text
Heap Fetches: 0
```

This means PostgreSQL can return the requested columns without fetching the heap rows.

**Important:** `INCLUDE` makes an index-only plan possible; it does not guarantee that PostgreSQL will choose that plan or that every heap fetch will be avoided.

---

#### 4. Key columns vs non-key columns

Consider these two indexes:

```sql
CREATE INDEX idx_students_lastname_firstname
ON students(lastname, firstname);
```

And:

```sql
CREATE INDEX idx_students_lastname_include
ON students(lastname)
INCLUDE (firstname);
```

They are not equivalent.

| Feature | `(lastname, firstname)` | `(lastname) INCLUDE (firstname)` |
|---|---|---|
| `lastname` is a key | Yes | Yes |
| `firstname` is a key | Yes | No |
| `firstname` determines index ordering | Yes, after `lastname` | No |
| Can search by `lastname` | Yes | Yes |
| Can search efficiently by `lastname` and `firstname` together | Yes | The included column does not provide a search key |
| Can potentially cover a query selecting both columns | Yes | Yes |
| Additional storage | Yes | Yes |
| Additional write and maintenance cost | Yes | Yes |

The most important difference is how PostgreSQL uses the columns to navigate and order index entries.

With:

```sql
ON students(lastname, firstname)
```

both columns participate in the index key.

With:

```sql
ON students(lastname)
INCLUDE (firstname)
```

only `lastname` participates in the key. `firstname` is stored as additional data.

For example, the second index can support:

```sql
SELECT firstname, lastname
FROM students
WHERE lastname = 'Smith';
```

But it does not provide a B-Tree search key for this query:

```sql
SELECT firstname, lastname
FROM students
WHERE firstname = 'Alice';
```

PostgreSQL cannot efficiently navigate the index by `firstname` alone because it is an included column, not a key.

---

#### 5. Lab: Create a realistic dataset

Your table has many columns, so let's populate it with sample data and compare the plans.

First, generate 100,000 students:

```sql
INSERT INTO students (
    firstname,
    lastname,
    middlename,
    address,
    bio,
    dob,
    id1,
    id2,
    id3,
    id4,
    id5,
    id6
)
SELECT
    'First' || i,
    'Last' || (i % 1000),
    'Middle' || (i % 100),
    'Address ' || i,
    'Biography for student ' || i,
    DATE '1990-01-01' + (i % 10000),
    i,
    i + 1,
    i + 2,
    i + 3,
    i + 4,
    i + 5
FROM generate_series(1, 100000) AS series(i);
```

Update PostgreSQL's statistics:

```sql
ANALYZE students;
```

Check the row count:

```sql
SELECT COUNT(*)
FROM students;
```

Expected result:

```text
 count
--------
 100000
```

Now test the query without a `lastname` index:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT firstname, lastname
FROM students
WHERE lastname = 'Last500';
```

Without a suitable index, PostgreSQL will generally perform a sequential scan.

Create a key-only index:

```sql
CREATE INDEX idx_students_lastname
ON students(lastname);
```

Run the query again:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT firstname, lastname
FROM students
WHERE lastname = 'Last500';
```

The planner may use an `Index Scan`. It can search by `lastname`, but must visit the heap to retrieve `firstname`.

Now create a covering index:

```sql
CREATE INDEX idx_students_lastname_covering
ON students(lastname)
INCLUDE (firstname);
```

Run the same query:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT firstname, lastname
FROM students
WHERE lastname = 'Last500';
```

The planner may choose an `Index Only Scan`.

Compare the execution plans and look for:

```text
Index Scan
```

versus:

```text
Index Only Scan
Heap Fetches: 0
```

The exact plan and execution time depend on table statistics, cache state, visibility information, and the cost estimates.

**Lab note:** Both indexes exist during the final test. PostgreSQL may choose either one. For a cleaner comparison, drop the redundant index before measuring each design independently.

---

#### 6. When should you use `INCLUDE`?

Consider a common application query:

```sql
SELECT firstname, lastname
FROM students
WHERE lastname = 'Last500';
```

A suitable index is:

```sql
CREATE INDEX idx_students_lastname_covering
ON students(lastname)
INCLUDE (firstname);
```

But suppose you need the student's address, biography, and date of birth:

```sql
SELECT *
FROM students
WHERE lastname = 'Last500';
```

Including every column would create a much larger index:

```sql
-- Usually not recommended
CREATE INDEX idx_students_cover_everything
ON students(lastname)
INCLUDE (
    firstname,
    middlename,
    address,
    bio,
    dob,
    id1,
    id2,
    id3,
    id4,
    id5,
    id6
);
```

This is especially undesirable when including large values such as `bio`.

A larger index requires more storage and can increase write and maintenance costs. PostgreSQL also has limits on index tuple sizes, so sufficiently large included values can cause index creation or subsequent writes to fail.

A better approach is to include only the additional columns that are useful for frequent queries.

For example:

```sql
CREATE INDEX idx_students_lastname_firstname
ON students(lastname)
INCLUDE (firstname);
```

This can be appropriate if your application frequently filters by `lastname` and returns only `firstname` and `lastname`.

---

#### 7. Important trade-offs

| Consideration | Key column | Included column |
|---|---|---|
| Used for index search | Yes | No |
| Participates in key ordering | Yes | No |
| Can help satisfy a query without a heap lookup | Yes | Yes |
| Increases index size | Yes | Yes |
| Adds write and maintenance cost | Yes | Yes |
| Should be added automatically to every index | No | No |

Remember that PostgreSQL indexes have a cost.

When you execute:

```sql
INSERT INTO students (...);
```

PostgreSQL must maintain the relevant indexes.

When you update an indexed value, index maintenance may also be necessary. Updating an included column can prevent a HOT update when that column belongs to an index, and can require index maintenance.

Therefore, do not create covering indexes for every possible query.

Instead, identify the queries that matter most, inspect their execution plans, and add included columns only when the expected read benefits justify the additional cost.

---

#### 8. Practical rules

**Use key columns when:**

- You filter with `WHERE`.
- You need an index to support joins.
- You need index ordering for a query.
- You need a composite index for frequently used filtering conditions.

**Consider `INCLUDE` when:**

- You already have an appropriate search key.
- Your query frequently selects a small number of additional columns.
- You want PostgreSQL to have the option of using an Index Only Scan.
- The additional columns are relatively small and do not make the index unnecessarily large.

**Avoid unnecessary included columns when:**

- Queries rarely use those columns.
- The columns are large, especially `text` or large variable-length values.
- The table receives frequent writes.
- The additional index size outweighs the potential benefit.

### Final takeaway

```sql
-- Both columns are keys
CREATE INDEX idx1
ON students(lastname, firstname);

-- lastname is the key; firstname is included
CREATE INDEX idx2
ON students(lastname)
INCLUDE (firstname);
```

The distinction is:

**Key columns determine how PostgreSQL searches and orders index entries. Non-key included columns provide additional data that may allow PostgreSQL to answer a query directly from the index.**

Use `INCLUDE` to optimize specific, frequently executed queries—not simply to make indexes contain more columns.

# 04.3 — PostgreSQL Index Types and Strategies

- **Status:** `[ ]`
- **Summary:** Explore PostgreSQL index types, composite indexes, partial and expression indexes, and index maintenance.
- **Focus:** B-Tree vs Hash, GIN, GiST, BRIN, column ordering, query patterns, index selectivity, and performance trade-offs.
- **Database:** PostgreSQL 18.4

This chapter continues Chapter 04 — Database Indexing. It builds on the previous sections about heap storage, Index Scan, Index Only Scan, and key vs non-key columns.

The goal is to understand not just how to create an index, but **how to choose the right index for a specific query**.

## 1. B-Tree Indexes

### 1.1 What is a B-Tree index?

B-Tree is PostgreSQL's default index type. It is suitable for most common database queries, including equality comparisons, range queries, and sorting.

For example:

```sql
CREATE INDEX idx_students_lastname
ON students(lastname);
```

This creates a B-Tree index because `USING BTREE` is the default.

You can also specify the type explicitly:

```sql
CREATE INDEX idx_students_lastname_btree
ON students USING BTREE(lastname);
```

Do not execute both examples on the same table as written: they create redundant indexes. Use one or the other.

A B-Tree maintains an ordered structure that lets PostgreSQL navigate toward matching values without scanning every table row.

For example:

```sql
SELECT *
FROM students
WHERE lastname = 'Last500';
```

The index can help locate rows matching `Last500`.

### 1.2 Equality queries

B-Tree indexes support equality comparisons:

```sql
SELECT *
FROM students
WHERE id = 50000;
```

The primary key already creates a unique B-Tree index on `id`, so an additional index on that column is unnecessary.

For a frequently queried, non-unique column:

```sql
CREATE INDEX idx_students_dob
ON students(dob);
```

You can then investigate:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM students
WHERE dob = DATE '2000-01-15';
```

PostgreSQL may choose an Index Scan, a Bitmap Heap Scan, or a Sequential Scan depending on selectivity, table size, and estimated costs.

### 1.3 Range queries

B-Tree indexes also support comparisons such as `<`, `>`, `<=`, and `>=`.

```sql
CREATE INDEX idx_students_dob
ON students(dob);
```

Example:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, firstname, lastname
FROM students
WHERE dob >= DATE '1995-01-01'
  AND dob < DATE '2000-01-01';
```

The index can help locate the relevant date range.

Using an exclusive upper bound is particularly useful for timestamps because it avoids problems with fractional seconds at the end of a date.

### 1.4 Sorting

B-Tree indexes can also help with `ORDER BY`.

```sql
CREATE INDEX idx_students_lastname_firstname
ON students(lastname, firstname);
```

This query matches the index's ordering:

```sql
SELECT id, firstname, lastname
FROM students
ORDER BY lastname, firstname
LIMIT 50;
```

PostgreSQL may read the index in order and avoid an explicit sorting step.

An index does not guarantee that sorting will be avoided: the planner may prefer another execution plan based on estimated costs.

### 1.5 When to use B-Tree

Use B-Tree as your starting point for:

- Equality lookups: `WHERE email = ...`
- Range queries: `WHERE created_at >= ...`
- Sorting: `ORDER BY created_at`
- Composite indexes for multiple conditions
- Unique constraints and primary keys
- Prefix searches when the collation and operator class support them

For most ordinary application queries, B-Tree is the first index type to consider.

---

## 2. Hash Indexes

### 2.1 How Hash indexes work

A Hash index uses a hash function to organize entries rather than maintaining the sorted key order provided by a B-Tree.

In PostgreSQL, Hash indexes support equality comparisons (`=`). They do not support range comparisons or ordered scans.

Create one:

```sql
CREATE INDEX idx_students_lastname_hash
ON students USING HASH(lastname);
```

Example:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM students
WHERE lastname = 'Last500';
```

PostgreSQL may use the Hash index for this equality query.

However, a B-Tree index can support the same equality query while also supporting additional operations.

### 2.2 Hash vs B-Tree

| Feature | B-Tree | Hash |
|---|---|---|
| Equality (`=`) | Yes | Yes |
| Range comparisons | Yes | No |
| Ordered index scans | Yes | No |
| Supports `ORDER BY` through index ordering | Yes | No |
| Supports unique indexes | Yes | No |
| Default PostgreSQL index type | Yes | No |

A Hash index is not automatically faster just because its name suggests direct lookup.

Modern PostgreSQL B-Tree indexes are highly optimized. You should benchmark both approaches before choosing Hash for a performance-sensitive workload.

### 2.3 Practical lab

Create a dedicated test table:

```sql
CREATE TABLE index_hash_lab (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token text NOT NULL
);

INSERT INTO index_hash_lab(token)
SELECT 'token-' || i
FROM generate_series(1, 100000) AS s(i);

ANALYZE index_hash_lab;
```

First, create a B-Tree index:

```sql
CREATE INDEX idx_hash_lab_token_btree
ON index_hash_lab USING BTREE(token);
```

Test equality:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM index_hash_lab
WHERE token = 'token-50000';
```

Now remove the B-Tree index and create a Hash index:

```sql
DROP INDEX idx_hash_lab_token_btree;

CREATE INDEX idx_hash_lab_token_hash
ON index_hash_lab USING HASH(token);

ANALYZE index_hash_lab;
```

Run the same query:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM index_hash_lab
WHERE token = 'token-50000';
```

Compare execution time, buffers, and index size.

The selected plan and measured performance depend on your environment. Do not assume the Hash index will win.

Clean up when finished:

```sql
DROP TABLE index_hash_lab;
```

**Practical rule:** Use B-Tree by default. Consider Hash only when your workload is limited to equality comparisons and measurements justify it.

---

## 3. Specialized Indexes: GIN, GiST, and BRIN

B-Tree and Hash are not suitable for every data type or query pattern.

PostgreSQL provides specialized index types for searching documents, working with JSONB, handling geographic data, and querying very large tables.

The three important types to understand are:

- **GIN:** Generalized Inverted Index.
- **GiST:** Generalized Search Tree.
- **BRIN:** Block Range Index.

### 3.1 GIN — Generalized Inverted Index

GIN is particularly useful when a single column contains multiple searchable values, such as:

- JSONB documents
- Arrays
- Full-text search vectors

Unlike a typical B-Tree, which organizes entries around individual key values, GIN can map individual elements to the rows containing them.

#### Example A: JSONB indexing

Suppose you're building an application that stores user preferences.

```sql
CREATE TABLE user_preferences (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL,
    settings jsonb NOT NULL
);

INSERT INTO user_preferences (user_id, settings)
VALUES
    (1, '{"theme": "dark", "language": "en"}'),
    (2, '{"theme": "light", "language": "en"}'),
    (3, '{"theme": "dark", "language": "fa"}');
```

Consider this query:

```sql
SELECT *
FROM user_preferences
WHERE settings @> '{"theme": "dark"}';
```

The `@>` operator checks whether the left JSONB value contains the right JSONB value.

A GIN index can support this containment query:

```sql
CREATE INDEX idx_preferences_settings
ON user_preferences USING GIN(settings);
```

Test the execution plan:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM user_preferences
WHERE settings @> '{"theme": "dark"}';
```

On a sufficiently large table, PostgreSQL may use a Bitmap Index Scan followed by a Bitmap Heap Scan.

For a tiny table, it may correctly choose a Sequential Scan instead.

#### Example B: Full-text search

PostgreSQL provides full-text search through `tsvector` and `tsquery`.

Create a table:

```sql
CREATE TABLE articles (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL
);
```

Insert some sample content:

```sql
INSERT INTO articles (title, content)
VALUES
    ('Database Indexing', 'B-tree indexes improve database lookup performance.'),
    ('PostgreSQL Basics', 'PostgreSQL supports several index types.'),
    ('Query Optimization', 'Execution plans help identify expensive queries.');
```

Create a GIN index over the processed document:

```sql
CREATE INDEX idx_articles_search
ON articles USING GIN (
    to_tsvector(
        'english',
        title || ' ' || content
    )
);
```

Search the articles:

```sql
SELECT id, title
FROM articles
WHERE to_tsvector(
    'english',
    title || ' ' || content
) @@ plainto_tsquery('english', 'database indexes');
```

The query expression matches the expression used in the index.

The GIN index can help PostgreSQL find documents containing the search terms without scanning every article's content.

For a production application, you might store a generated or maintained search vector, particularly when the same expression is used repeatedly.

#### GIN trade-offs

GIN can be excellent for document and multi-value searches, but it has costs:

- Indexes can become large.
- Updates can be more expensive than maintaining a simple B-Tree.
- Index creation and maintenance can require substantial resources.
- Not every operator is supported by every GIN operator class.

**Use GIN when the query requires searching inside JSONB documents, arrays, or full-text search vectors.**

---

### 3.2 GiST — Generalized Search Tree

GiST is a flexible index framework used by PostgreSQL extensions and data types that require specialized search operations.

It is commonly used for:

- Geographic and geometric data
- Spatial relationships
- Range types
- Certain nearest-neighbor searches

A typical application is searching for locations near a given point.

#### Example: Geographic searches with PostGIS

PostGIS adds geographic data types and spatial operations to PostgreSQL.

Install the extension if it is available on your PostgreSQL server:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Create a table:

```sql
CREATE TABLE restaurants (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL,
    location geography(POINT, 4326)
);
```

Insert sample locations:

```sql
INSERT INTO restaurants (name, location)
VALUES
    (
        'Restaurant A',
        ST_SetSRID(ST_MakePoint(-123.1207, 49.2827), 4326)::geography
    ),
    (
        'Restaurant B',
        ST_SetSRID(ST_MakePoint(-123.1000, 49.2800), 4326)::geography
    );
```

Create a spatial index:

```sql
CREATE INDEX idx_restaurants_location
ON restaurants USING GIST(location);
```

Find restaurants within five kilometres of a location:

```sql
SELECT
    id,
    name
FROM restaurants
WHERE ST_DWithin(
    location,
    ST_SetSRID(
        ST_MakePoint(-123.1207, 49.2827),
        4326
    )::geography,
    5000
);
```

The distance argument is in metres for the `geography` type.

PostGIS can use the spatial index to narrow down the candidate rows before applying the exact spatial condition.

The query's performance depends on the data distribution, spatial conditions, and execution plan.

#### GiST trade-offs

- Performance depends on the operator class and data type.
- Some searches require rechecking candidate rows.
- Index size and maintenance vary with the indexed data.
- A GiST index is not a universal replacement for B-Tree.

**Use GiST when the operators and data type require spatial, range, or other specialized search capabilities.**

---

### 3.3 BRIN — Block Range Index

BRIN stands for **Block Range Index**.

Unlike a typical B-Tree, BRIN summarizes values across physical ranges of heap pages.

This makes it particularly useful for very large tables where values correlate with the physical order of the stored rows.

Consider an event table:

```sql
CREATE TABLE events (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type text NOT NULL,
    created_at timestamptz NOT NULL
);
```

Imagine millions of events are inserted in approximately chronological order.

A query frequently requests recent events:

```sql
SELECT *
FROM events
WHERE created_at >= now() - INTERVAL '7 days';
```

Create a BRIN index:

```sql
CREATE INDEX idx_events_created_at_brin
ON events USING BRIN(created_at);
```

BRIN stores summaries for ranges of heap pages. These summaries help PostgreSQL identify page ranges that might contain matching timestamps.

Conceptually:

```text
Heap page ranges

Range 1: January 1–January 3
Range 2: January 3–January 5
Range 3: January 5–January 7
Range 4: January 7–January 9
```

If the query requests January 8, PostgreSQL may be able to skip ranges whose summaries prove they cannot contain matching rows.

The dates above are illustrative. BRIN stores summaries according to the selected operator class, not literal date labels.

Unlike a B-Tree, BRIN does not maintain a separate entry for every individual table row.

#### Test BRIN

Populate the table:

```sql
INSERT INTO events (event_type, created_at)
SELECT
    'event-' || (i % 10),
    timestamptz '2025-01-01 00:00:00+00'
        + i * INTERVAL '1 second'
FROM generate_series(1, 1000000) AS s(i);

ANALYZE events;
```

Create the BRIN index:

```sql
CREATE INDEX idx_events_created_at_brin
ON events USING BRIN(created_at);
```

Inspect the plan:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM events
WHERE created_at >= timestamptz '2025-01-12 00:00:00+00'
  AND created_at <  timestamptz '2025-01-13 00:00:00+00';
```

PostgreSQL may use a Bitmap Index Scan and Bitmap Heap Scan, depending on the data and planner estimates.

#### BRIN trade-offs

| Characteristic | BRIN |
|---|---|
| Index size | Usually very small |
| Lookup method | Uses summaries of heap page ranges |
| Best data pattern | Values correlate with physical row order |
| Ideal example | Large append-oriented event tables |
| Precision | May return candidate ranges containing nonmatching rows |
| Main limitation | Less effective when values are poorly correlated with physical storage |

**Use BRIN when the table is very large and the indexed values correlate well with physical storage order.**

A BRIN index on randomly distributed timestamps is generally less useful than one on a table where timestamps increase alongside inserts.

---

### 3.4 Comparing index types

| Index type | Primary use | Example |
|---|---|---|
| B-Tree | Equality, ranges, sorting | `WHERE id = 10` |
| Hash | Equality comparisons | `WHERE token = 'abc'` |
| GIN | JSONB, arrays, full-text search | `settings @> '{"theme":"dark"}'` |
| GiST | Spatial and specialized operator searches | Find nearby locations |
| BRIN | Summarized ranges in large tables | Filter by correlated timestamps |

PostgreSQL also supports SP-GiST for certain partitioned search structures and other specialized index types. You do not need to memorize every index type immediately.

Start with B-Tree. Learn GIN, GiST, and BRIN when you encounter a query pattern that benefits from them.

---

## 4. Composite Indexes

### 4.1 What is a composite index?

A composite index contains multiple key columns.

For example:

```sql
CREATE INDEX idx_students_lastname_dob
ON students(lastname, dob);
```

This index is organized first by `lastname`, then by `dob` within each lastname.

Conceptually:

```text
(lastname, dob)

Anderson | 1998-01-10
Anderson | 2001-03-15
Brown    | 1997-04-20
Brown    | 2000-07-12
Smith    | 1995-02-08
Smith    | 2002-11-30
```

The order of the columns matters.

### 4.2 The leftmost-prefix principle

Consider:

```sql
CREATE INDEX idx_students_lastname_dob
ON students(lastname, dob);
```

This index is well suited to:

```sql
SELECT *
FROM students
WHERE lastname = 'Smith';
```

It can also support:

```sql
SELECT *
FROM students
WHERE lastname = 'Smith'
  AND dob >= DATE '2000-01-01';
```

But this query does not have a leading condition on `lastname`:

```sql
SELECT *
FROM students
WHERE dob >= DATE '2000-01-01';
```

PostgreSQL generally cannot use the composite index as efficiently for this query because the leading column is unconstrained.

**Important:** This is not an absolute rule that PostgreSQL cannot use an index when the leading column is absent. PostgreSQL can sometimes use skip scans or other plans when appropriate. The practical rule is that leading-column conditions are usually the most effective way to use a conventional multicolumn B-Tree index.

### 4.3 Lab: Compare index column order

Create a separate table:

```sql
CREATE TABLE orders_lab (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id integer NOT NULL,
    status text NOT NULL,
    created_at timestamptz NOT NULL
);
```

Insert test data:

```sql
INSERT INTO orders_lab (user_id, status, created_at)
SELECT
    (i % 10000) + 1,
    CASE
        WHEN i % 10 = 0 THEN 'pending'
        WHEN i % 10 = 1 THEN 'processing'
        ELSE 'completed'
    END,
    timestamptz '2025-01-01 00:00:00+00'
        + i * INTERVAL '1 second'
FROM generate_series(1, 500000) AS s(i);

ANALYZE orders_lab;
```

Create the composite index:

```sql
CREATE INDEX idx_orders_user_status_date
ON orders_lab(user_id, status, created_at DESC);
```

Test the following queries separately.

**Query A — All three columns:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM orders_lab
WHERE user_id = 100
  AND status = 'pending'
  AND created_at >= timestamptz '2025-01-05 00:00:00+00'
ORDER BY created_at DESC;
```

**Query B — First two columns:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM orders_lab
WHERE user_id = 100
  AND status = 'pending';
```

**Query C — First column only:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM orders_lab
WHERE user_id = 100;
```

**Query D — No condition on the first column:**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM orders_lab
WHERE status = 'pending'
  AND created_at >= timestamptz '2025-01-05 00:00:00+00';
```

The first three queries align with the index's leading columns. The fourth does not.

Do not assume that an index scan is always faster. The number of matching rows and the amount of data retrieved can change the best execution plan.

### 4.4 Column order: equality, range, and sorting

When designing a composite index, consider the actual query.

For example:

```sql
SELECT *
FROM orders_lab
WHERE user_id = 100
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

A suitable index is:

```sql
CREATE INDEX idx_orders_user_status_date
ON orders_lab(user_id, status, created_at DESC);
```

The equality conditions come first, followed by the column used for ordering.

This allows PostgreSQL to navigate to the selected user and status, then retrieve rows in the required date order.

It can be especially effective when the query uses `LIMIT`, because PostgreSQL may stop after finding enough matching rows.

### 4.5 Does the most selective column always go first?

Not necessarily.

A common rule says to put the most selective column first. Selectivity matters, but the correct order depends on:

- Which conditions appear together in real queries.
- Which queries need only a leading subset of the index.
- Whether conditions are equality or range comparisons.
- Whether the index must support sorting.
- The distribution of values.
- Whether the query needs to retrieve a small or large portion of the table.

For example, if most queries filter by `user_id` and then sort by `created_at`, this may be the right index:

```sql
CREATE INDEX idx_orders_user_date
ON orders_lab(user_id, created_at DESC);
```

Adding `status` to the index is not automatically beneficial. First determine whether the query also filters on status and whether the added index cost is justified.

### 4.6 Avoid redundant indexes

Suppose you already have:

```sql
CREATE INDEX idx_orders_user_status_date
ON orders_lab(user_id, status, created_at DESC);
```

A separate index on `user_id` alone may be redundant because the composite index can support many queries filtering only on `user_id`.

However, there are exceptions involving index size, write patterns, index-only queries, and specific query plans.

Do not remove an index solely because its leading columns overlap with another index. Verify usage and performance first.

---

## 5. Partial Indexes

### 5.1 What is a partial index?

A partial index contains entries only for rows that satisfy a specified condition.

For example, an application may have millions of orders, but most dashboard queries only need pending orders.

Instead of indexing every order, you can create an index for pending orders only.

```sql
CREATE TABLE orders_partial_lab (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id bigint NOT NULL,
    status text NOT NULL,
    total_amount numeric(12, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

Create a partial index:

```sql
CREATE INDEX idx_orders_pending_user_date
ON orders_partial_lab(user_id, created_at DESC)
WHERE status = 'pending';
```

Only rows whose status is `pending` are included in this index.

Conceptually:

```text
Table
├── Pending order
├── Completed order
├── Pending order
├── Cancelled order
└── Pending order

Partial index
├── Pending order
├── Pending order
└── Pending order
```

This can reduce index size and write overhead compared with an equivalent full index, particularly when pending orders are a small fraction of the table.

### 5.2 Query using a partial index

Consider:

```sql
SELECT *
FROM orders_partial_lab
WHERE user_id = 100
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

The query predicate implies the partial index's condition.

PostgreSQL can therefore consider:

```text
idx_orders_pending_user_date
```

The index can locate the user's pending orders and provide them in descending date order.

Test it:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM orders_partial_lab
WHERE user_id = 100
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

Whether PostgreSQL actually uses the index depends on the data and planner estimates.

### 5.3 Partial index vs regular index

Compare:

```sql
CREATE INDEX idx_orders_user_date_full
ON orders_partial_lab(user_id, created_at DESC);
```

with:

```sql
CREATE INDEX idx_orders_user_date_pending
ON orders_partial_lab(user_id, created_at DESC)
WHERE status = 'pending';
```

| Characteristic | Full index | Partial index |
|---|---|---|
| Contains all rows | Yes | No |
| Can support queries for completed orders | Potentially | No |
| Index size | Usually larger | Potentially smaller |
| Write maintenance | All indexed rows | Rows entering, leaving, or remaining in the predicate |
| Best use | Queries across many statuses | Queries focused on a subset |

Do not create both automatically. They serve different query patterns and incur separate maintenance costs.

### 5.4 Important limitation: partial-index predicates must be stable

This is a tempting but invalid design:

```sql
-- Invalid in PostgreSQL
CREATE INDEX idx_recent_orders
ON orders_partial_lab(user_id)
WHERE created_at > now() - INTERVAL '30 days';
```

PostgreSQL requires functions and operators used in index expressions and partial-index predicates to satisfy immutability requirements. `now()` is not immutable because its result changes with time.

Instead, use a stable predicate:

```sql
CREATE INDEX idx_pending_orders
ON orders_partial_lab(user_id, created_at DESC)
WHERE status = 'pending';
```

For recent-data queries, a regular index on `created_at` or a suitable BRIN index may be more appropriate.

If you need a rolling time window, partitioning or a process that maintains a stable subset may be worth considering.

**Practical rule:** Partial indexes are especially useful when a frequently queried subset of rows can be defined by a stable condition.

---

## 6. Expression Indexes

### 6.1 What is an expression index?

An expression index stores the result of an expression rather than simply indexing the original column value.

This is useful when queries repeatedly apply a function to a column.

For example:

```sql
SELECT *
FROM users
WHERE lower(email) = lower('Ardavan@example.com');
```

A conventional index on `email` does not necessarily support this expression efficiently.

An expression index can help:

```sql
CREATE INDEX idx_users_email_lower
ON users(lower(email));
```

PostgreSQL can use the indexed expression when the query expression matches appropriately.

### 6.2 Lab: Case-insensitive email lookup

Create a test table:

```sql
CREATE TABLE users_expression_lab (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email text NOT NULL
);
```

Insert sample data:

```sql
INSERT INTO users_expression_lab(email)
VALUES
    ('ardavan@example.com'),
    ('Alice@example.com'),
    ('BOB@example.com');
```

Create the expression index:

```sql
CREATE INDEX idx_users_email_lower
ON users_expression_lab(lower(email));
```

Query:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM users_expression_lab
WHERE lower(email) = lower('ALICE@EXAMPLE.COM');
```

The index can support the lookup because the search uses the indexed expression.

On this tiny table, PostgreSQL may prefer a Sequential Scan. The purpose of the example is to understand the index design, not to expect an index scan on every small table.

### 6.3 Expression indexes for JSONB

Suppose an application stores settings in JSONB:

```sql
CREATE TABLE preferences_expression_lab (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    settings jsonb NOT NULL
);
```

An expression index can target a specific JSONB field:

```sql
CREATE INDEX idx_preferences_theme
ON preferences_expression_lab((settings ->> 'theme'));
```

Then:

```sql
SELECT *
FROM preferences_expression_lab
WHERE settings ->> 'theme' = 'dark';
```

can use the index when PostgreSQL determines that doing so is beneficial.

For broad JSONB containment searches, a GIN index may be a better fit. Choose the index based on the operators and query patterns you need to support.

### 6.4 Expression index vs generated column

An expression index can avoid introducing another table column solely for indexing purposes.

However, generated columns may be easier to understand when the derived value is also used frequently in queries, reporting, or application logic.

For example, a generated lowercase email column could be useful when the normalized value is part of the application's data model.

Choose the simplest design that fits the application's requirements.

### 6.5 Expression-index trade-offs

- The expression must satisfy PostgreSQL's immutability requirements.
- The expression needs to match the query appropriately.
- The index requires storage and maintenance.
- The planner must still determine that the index is cost-effective.

**Use expression indexes when important queries repeatedly search by a computed value.**

---

## 7. Covering Indexes and `INCLUDE`

Chapter 04.2 introduced key and non-key columns. Here, we connect that concept to practical indexing strategies.

A covering index contains the columns needed to satisfy a particular query.

In PostgreSQL, `INCLUDE` allows you to store additional columns in a B-Tree index without making them part of the search key.

Consider:

```sql
CREATE INDEX idx_orders_user_covering
ON orders_partial_lab(user_id)
INCLUDE (status, total_amount);
```

This index has:

- **Key column:** `user_id`
- **Included columns:** `status`, `total_amount`

A query such as:

```sql
SELECT user_id, status, total_amount
FROM orders_partial_lab
WHERE user_id = 100;
```

may be answered through an Index Only Scan because all the requested columns are available in the index.

Check the execution plan:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id, status, total_amount
FROM orders_partial_lab
WHERE user_id = 100;
```

Look for:

```text
Index Only Scan
```

and:

```text
Heap Fetches: 0
```

Remember that an Index Only Scan may still perform heap fetches when PostgreSQL cannot establish row visibility from the visibility map.

### 7.1 Why not include every column?

Consider:

```sql
CREATE INDEX idx_students_cover_everything
ON students(lastname)
INCLUDE (
    firstname,
    middlename,
    address,
    bio,
    dob,
    id1,
    id2,
    id3,
    id4,
    id5,
    id6
);
```

This is usually not a good default design.

It creates a potentially large index, especially because `bio` and `address` can contain substantial amounts of text.

A large index:

- Consumes more disk space.
- Requires more cache memory to keep frequently accessed pages resident.
- Increases write and maintenance costs.
- Can become inefficient for the workload.
- May encounter PostgreSQL's index tuple size limits.

Instead, include only columns that provide a meaningful benefit for important queries.

---

## 8. Index Maintenance and Monitoring

Indexes need maintenance and monitoring as the application grows.

PostgreSQL manages many maintenance tasks automatically through autovacuum, but developers and database engineers should understand how to inspect index usage and diagnose performance problems.

### 8.1 Inspect existing indexes

In `psql`, run:

```sql
\d students
```

To list indexes on the table:

```sql
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'students';
```

This shows the index definitions, including their indexed columns and access methods.

### 8.2 Check index size and usage

PostgreSQL provides index statistics through `pg_stat_user_indexes`.

```sql
SELECT
    schemaname,
    relname AS table_name,
    indexrelname AS index_name,
    idx_scan AS index_scans,
    idx_tup_read AS index_tuples_read,
    idx_tup_fetch AS index_tuples_fetched,
    pg_size_pretty(
        pg_relation_size(indexrelid)
    ) AS index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;
```

These statistics help you understand which indexes are being used and how much space they occupy.

However, interpret the results carefully:

- Statistics generally accumulate since the last reset or relevant statistics reset event.
- An index with zero scans may still be important for a workload that has not run recently.
- Unique and primary-key indexes may be essential even if they have low scan counts.
- `idx_tup_fetch` does not account for every row access pattern in the same way, especially when bitmap scans are involved.

Do not automatically drop an index just because `idx_scan` is zero.

### 8.3 Find potentially unused indexes

This query identifies indexes with zero recorded scans, excluding indexes supporting primary-key and unique constraints:

```sql
SELECT
    s.schemaname,
    s.relname AS table_name,
    s.indexrelname AS index_name,
    pg_size_pretty(
        pg_relation_size(s.indexrelid)
    ) AS index_size,
    s.idx_scan
FROM pg_stat_user_indexes AS s
JOIN pg_index AS i
    ON i.indexrelid = s.indexrelid
WHERE s.idx_scan = 0
  AND NOT i.indisprimary
  AND NOT i.indisunique
ORDER BY pg_relation_size(s.indexrelid) DESC;
```

Treat the results as candidates for investigation, not as a list of indexes to delete immediately.

### 8.4 Understand `VACUUM` and `ANALYZE`

These commands have different purposes.

`VACUUM` helps PostgreSQL reclaim space from dead tuples for reuse and performs other maintenance tasks.

```sql
VACUUM (VERBOSE) students;
```

`ANALYZE` collects statistics used by the query planner.

```sql
ANALYZE students;
```

You can run both:

```sql
VACUUM (VERBOSE, ANALYZE) students;
```

Regular vacuuming does not necessarily shrink an index file or return disk space to the operating system.

PostgreSQL's autovacuum normally handles routine vacuuming and statistics collection. Manual commands should be based on a specific need rather than run on an arbitrary schedule.

**Important:** `VACUUM` cannot run inside a transaction block.

### 8.5 Rebuild an index with `REINDEX`

If you have evidence that an index needs rebuilding, PostgreSQL provides `REINDEX`.

For example:

```sql
REINDEX INDEX idx_students_lastname;
```

On a production system, ordinary `REINDEX` can block writes to the table while the index is rebuilt.

For supported cases, PostgreSQL offers:

```sql
REINDEX INDEX CONCURRENTLY idx_students_lastname;
```

The concurrent form reduces blocking of normal writes, but it takes longer, performs additional work, and has operational limitations.

Do not rebuild every index periodically without evidence that it is needed.

---

## 9. Foreign Keys and Indexing

A foreign key enforces a relationship between tables, but PostgreSQL does **not automatically create an index on the referencing columns**.

For example:

```sql
CREATE TABLE customers (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name text NOT NULL
);

CREATE TABLE customer_orders (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL REFERENCES customers(id),
    total_amount numeric(12, 2) NOT NULL
);
```

The primary key on `customers.id` automatically creates a unique B-Tree index.

However, PostgreSQL does not automatically index `customer_orders.customer_id`.

You can create an index:

```sql
CREATE INDEX idx_customer_orders_customer_id
ON customer_orders(customer_id);
```

This can help with queries such as:

```sql
SELECT *
FROM customer_orders
WHERE customer_id = 100;
```

It can also help PostgreSQL find referencing rows when a customer is deleted or its referenced key is updated.

Without a suitable index on the referencing columns, those operations may need to scan the referencing table.

### 9.1 When should you index foreign keys?

Index foreign-key columns when the workload benefits from them, particularly when:

- You frequently join tables using the foreign key.
- You frequently retrieve related records.
- You delete or update referenced records.
- The referencing table is large.

However, not every foreign key necessarily needs a separate index. An existing composite index may already support the relevant queries.

For example:

```sql
CREATE INDEX idx_orders_customer_status
ON customer_orders(customer_id, total_amount);
```

This index can support lookups by `customer_id` because it is the leading column.

**Important:** Foreign-key constraints enforce data integrity. Indexes improve access performance. They serve different purposes.

---

## 10. Monitoring Query Performance

Creating indexes is only part of database optimization. You also need to determine which queries are expensive and whether your indexes are helping.

### 10.1 Read an execution plan

Consider:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM customer_orders
WHERE customer_id = 100;
```

A possible plan might look like:

```text
Index Scan using idx_customer_orders_customer_id
  on customer_orders
  (actual time=0.020..0.030 rows=5 loops=1)

  Index Cond: (customer_id = 100)

Planning Time: 0.100 ms
Execution Time: 0.050 ms
```

The numbers are illustrative.

Focus on these fields:

| Field | Meaning |
|---|---|
| `Index Scan` | PostgreSQL retrieves rows using an index and may access the heap |
| `Index Only Scan` | PostgreSQL can potentially answer using only the index |
| `Seq Scan` | PostgreSQL scans the table's heap |
| `Index Cond` | Conditions used to navigate or restrict the index scan |
| `Filter` | A condition applied to rows after they are obtained by the plan node |
| `actual time` | Measured execution time for the plan node |
| `rows` | Number of rows produced by the plan node |
| `Buffers` | Buffer activity associated with the plan |
| `Heap Fetches` | Heap visibility fetches reported by an Index Only Scan |

A Sequential Scan is not automatically bad. It can be the best choice for a small table or a query that returns a large percentage of its rows.

Likewise, an Index Scan is not automatically good. An index may locate many rows that require expensive heap access.

### 10.2 Check Sequential Scan statistics

Use PostgreSQL's table statistics:

```sql
SELECT
    schemaname,
    relname AS table_name,
    seq_scan,
    seq_tup_read,
    idx_scan,
    idx_tup_fetch
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC;
```

This helps identify tables with substantial sequential-scan activity.

But a high `seq_scan` count alone does not mean a missing index exists. Small tables and queries that retrieve most rows often benefit from Sequential Scans.

Investigate the query patterns before changing the index design.

### 10.3 Monitor expensive queries with `pg_stat_statements`

PostgreSQL provides the `pg_stat_statements` extension for collecting aggregated query statistics.

First, check whether the extension is available and configured on your server.

In many installations, enabling it requires adding `pg_stat_statements` to `shared_preload_libraries` and restarting PostgreSQL before creating the extension.

Then run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

Inspect queries with high average execution time:

```sql
SELECT
    round(mean_exec_time::numeric, 2) AS avg_ms,
    round(total_exec_time::numeric, 2) AS total_ms,
    calls,
    rows,
    query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

Look at both average and total execution time.

For example:

- A query taking 500 ms and running twice might be less important than one taking 30 ms and running 100,000 times.
- A query taking several seconds might be an immediate problem even if it runs infrequently.

Use the statistics to identify candidates, then inspect the relevant queries with `EXPLAIN (ANALYZE, BUFFERS)`.

**Caution:** `EXPLAIN ANALYZE` actually executes the query. Be careful when analyzing statements that modify data, particularly in production.

---

## 11. Best Practices for Index Design

### 11.1 Start with actual query patterns

Do not begin by indexing every column.

Instead, identify the queries your application executes most frequently.

For example, an order-management application might frequently run:

```sql
SELECT *
FROM customer_orders
WHERE customer_id = 100
ORDER BY id DESC
LIMIT 20;
```

A suitable index could be:

```sql
CREATE INDEX idx_customer_orders_customer_id_id
ON customer_orders(customer_id, id DESC);
```

This index matches the filtering and ordering pattern.

The right index depends on the actual workload, including how many rows each customer has and how much data the query retrieves.

### 11.2 Avoid indexing every column

Consider the `students` table from the previous chapters.

Creating separate indexes on every column might look like this:

```sql
CREATE INDEX idx_students_firstname
ON students(firstname);

CREATE INDEX idx_students_lastname
ON students(lastname);

CREATE INDEX idx_students_middlename
ON students(middlename);

CREATE INDEX idx_students_address
ON students(address);

CREATE INDEX idx_students_dob
ON students(dob);
```

These indexes are not automatically useful just because the columns exist.

Each index consumes storage and adds maintenance overhead.

Create an index when you have a query pattern that benefits from it, and verify that the improvement justifies the cost.

### 11.3 Be careful with low-selectivity columns

Selectivity describes how effectively a condition narrows down the rows being considered.

Suppose an orders table contains these values:

```text
status
------
pending
completed
completed
completed
completed
completed
```

A standalone index on `status` might be less useful when most rows have the same status.

For example:

```sql
SELECT *
FROM orders_partial_lab
WHERE status = 'completed';
```

If almost every row is completed, PostgreSQL might prefer a Sequential Scan.

But if a query targets a small subset of rows, a partial index can help:

```sql
CREATE INDEX idx_orders_pending_user
ON orders_partial_lab(user_id)
WHERE status = 'pending';
```

Low cardinality does not automatically make a column unsuitable for indexing. The number and distribution of matching rows, the query's other conditions, and the cost of fetching the result all matter.

### 11.4 Avoid duplicate indexes

Suppose you have:

```sql
CREATE INDEX idx_students_lastname
ON students(lastname);
```

Creating the same index again under another name provides no meaningful additional search capability:

```sql
CREATE INDEX idx_students_lastname_duplicate
ON students(lastname);
```

This wastes storage and increases write overhead.

Also inspect overlapping composite indexes before adding new ones. Some indexes may be redundant, although different column ordering, uniqueness, included columns, or query patterns can justify separate indexes.

### 11.5 Measure before and after

Always compare the execution plan before and after a proposed change.

Before:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM students
WHERE lastname = 'Last500';
```

Create the index:

```sql
CREATE INDEX idx_students_lastname
ON students(lastname);
```

Then measure again:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM students
WHERE lastname = 'Last500';
```

Compare:

- Execution time
- Rows scanned and returned
- Buffer activity
- Execution plan
- Index size
- Write performance where relevant

For reliable benchmarks, use realistic data volumes, representative value distributions, and repeated measurements. A single execution is not enough to establish a reliable performance improvement.

---

## 12. Real-World Example: E-Commerce Order History

Let's combine several indexing principles in one practical example.

Suppose an e-commerce application needs to support three queries:

1. A customer viewing their recent orders.
2. A customer viewing their pending orders.
3. An administrator viewing recent orders across all customers.

Create the table:

```sql
CREATE TABLE orders_demo (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id bigint NOT NULL,
    status text NOT NULL,
    total_amount numeric(12, 2) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
```

### Query A: Customer order history

```sql
SELECT *
FROM orders_demo
WHERE customer_id = 100
ORDER BY created_at DESC
LIMIT 50;
```

A suitable index:

```sql
CREATE INDEX idx_orders_demo_customer_date
ON orders_demo(customer_id, created_at DESC);
```

The leading column supports customer filtering, and the second column supports the requested ordering.

### Query B: Pending orders

```sql
SELECT *
FROM orders_demo
WHERE customer_id = 100
  AND status = 'pending'
ORDER BY created_at DESC
LIMIT 20;
```

One option is a composite index:

```sql
CREATE INDEX idx_orders_demo_customer_status_date
ON orders_demo(customer_id, status, created_at DESC);
```

Alternatively, if pending orders form a relatively small subset and this query is important, consider:

```sql
CREATE INDEX idx_orders_demo_pending_customer_date
ON orders_demo(customer_id, created_at DESC)
WHERE status = 'pending';
```

These indexes have different trade-offs. Do not automatically create both.

### Query C: Recent orders across all customers

```sql
SELECT *
FROM orders_demo
ORDER BY created_at DESC
LIMIT 100;
```

A possible index:

```sql
CREATE INDEX idx_orders_demo_date
ON orders_demo(created_at DESC);
```

This index is independent of `customer_id`, so it can support the global ordering.

### Review the design

| Index | Main purpose |
|---|---|
| `(customer_id, created_at DESC)` | Customer order history |
| `(customer_id, status, created_at DESC)` | Filtering by customer and status |
| `(customer_id, created_at DESC) WHERE status = 'pending'` | Smaller index for pending orders |
| `(created_at DESC)` | Recent orders across all customers |

These are alternative design options, not instructions to create every index at once.

Choose indexes based on actual query frequency, data distribution, storage constraints, and measured performance.

---

## 13. Practical Lab: Compare Index Types

Use this final lab to reinforce the main ideas.

Create a test table:

```sql
CREATE TABLE indexing_lab (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    category integer NOT NULL,
    email text NOT NULL,
    created_at timestamptz NOT NULL,
    metadata jsonb NOT NULL
);
```

Populate it:

```sql
INSERT INTO indexing_lab (
    category,
    email,
    created_at,
    metadata
)
SELECT
    i % 100,
    'user' || i || '@example.com',
    timestamptz '2025-01-01 00:00:00+00'
        + i * INTERVAL '1 second',
    jsonb_build_object(
        'active', i % 2 = 0,
        'group', i % 10
    )
FROM generate_series(1, 100000) AS s(i);

ANALYZE indexing_lab;
```

### Experiment A: B-Tree

```sql
CREATE INDEX idx_lab_category
ON indexing_lab USING BTREE(category);

EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM indexing_lab
WHERE category = 50;
```

Observe how PostgreSQL handles a condition that matches approximately one percent of the rows.

### Experiment B: Composite index

```sql
CREATE INDEX idx_lab_category_date
ON indexing_lab(category, created_at DESC);

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, category, created_at
FROM indexing_lab
WHERE category = 50
ORDER BY created_at DESC
LIMIT 20;
```

Check whether the index helps with filtering and sorting.

### Experiment C: Partial index

```sql
CREATE INDEX idx_lab_category_active
ON indexing_lab(category)
WHERE (metadata ->> 'active') = 'true';
```

Test:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM indexing_lab
WHERE category = 50
  AND (metadata ->> 'active') = 'true';
```

The query predicate matches the partial-index condition, so PostgreSQL can consider this index.

### Experiment D: Expression index

```sql
CREATE INDEX idx_lab_email_lower
ON indexing_lab(lower(email));
```

Test:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM indexing_lab
WHERE lower(email) = lower('USER50000@EXAMPLE.COM');
```

Observe how the expression index supports the case-insensitive lookup.

### Experiment E: GIN

```sql
CREATE INDEX idx_lab_metadata_gin
ON indexing_lab USING GIN(metadata);
```

Test a JSONB containment query:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM indexing_lab
WHERE metadata @> '{"group": 5}';
```

This experiment demonstrates an index designed for JSONB operators rather than ordinary B-Tree comparisons.

### Experiment F: BRIN

```sql
CREATE INDEX idx_lab_created_brin
ON indexing_lab USING BRIN(created_at);
```

Test a time range:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT *
FROM indexing_lab
WHERE created_at >= timestamptz '2025-01-02 00:00:00+00'
  AND created_at <  timestamptz '2025-01-02 01:00:00+00';
```

Because the timestamps were inserted in increasing order, they correlate well with physical row order. However, a B-Tree might still be a better choice for this particular dataset and query.

Compare the plans and index sizes rather than assuming BRIN must win.

**Lab cleanup:**

```sql
DROP TABLE indexing_lab;
```

Dropping the table also removes its associated indexes.

---

## 14. Final Reference: Which Index Should You Choose?

| Requirement | First option to consider |
|---|---|
| `WHERE id = 100` | B-Tree |
| `WHERE created_at >= ...` | B-Tree; possibly BRIN for very large correlated tables |
| `ORDER BY created_at DESC LIMIT 50` | B-Tree |
| Search by several columns | Composite B-Tree |
| Retrieve additional columns without heap access | Covering B-Tree using `INCLUDE` |
| Index only pending orders | Partial B-Tree |
| Case-insensitive lookup using `lower(email)` | Expression B-Tree |
| JSONB containment | GIN |
| Full-text search | GIN |
| Geographic distance searches | GiST with PostGIS |
| Equality-only lookup | B-Tree by default; benchmark Hash if justified |
| Large, append-oriented time-series table | Consider BRIN |

### Key takeaways

1. **B-Tree is the default starting point.** It supports equality, ranges, and ordering.
2. **Hash is specialized.** It supports equality but lacks B-Tree's ordering and range capabilities.
3. **GIN and GiST solve different problems.** Choose them based on the data type and operators involved.
4. **BRIN is designed for efficient summaries of large, physically correlated data.**
5. **Composite-index column order matters.** Design around the application's actual filtering and ordering patterns.
6. **Partial indexes can reduce overhead** when queries consistently target a well-defined subset of rows.
7. **Expression indexes support computed-value lookups** when the query uses a matching expression.
8. **Covering indexes can reduce heap access**, but larger indexes have storage and write costs.
9. **Foreign keys do not automatically create indexes on referencing columns** in PostgreSQL.
10. **Always measure.** Use `EXPLAIN (ANALYZE, BUFFERS)`, realistic data, and query statistics to validate your decisions.

The goal of database indexing is not to maximize the number of indexes or force every query to use one. It is to choose structures that make important queries efficient while keeping storage, write performance, and maintenance costs under control.

---

### 05 — B-Tree vs B+Tree in Production Database Systems

- **Status:** `[ ]`
- **Summary:** Compare B-Tree and B+Tree in real systems.
- **Focus:** Tree indexes used by production databases.
- **Notes:** *(later)*

---

### 06 — Database Partitioning

- **Status:** `[ ]`
- **Summary:** Partitioning data within one system.
- **Focus:** Horizontal / vertical partitioning strategies.
- **Notes:** *(later)*

---

### 07 — Database Sharding

- **Status:** `[ ]`
- **Summary:** Sharding — distribute data across nodes.
- **Focus:** Shard keys, routing, and cross-shard challenges.
- **Notes:** *(later)*

---

### 08 — Concurrency Control

- **Status:** `[ ]`
- **Summary:** Concurrency control, locks, anomalies.
- **Focus:** Locks, MVCC, isolation levels in practice.
- **Notes:** *(later)*

---

### 09 — Database Replication

- **Status:** `[ ]`
- **Summary:** Copy data for availability and read scale.
- **Focus:** Leader/follower, sync vs async, lag.
- **Notes:** *(later)*

---

### 10 — Database System Design

- **Status:** `[ ]`
- **Summary:** Design a database system for real requirements.
- **Focus:** Modeling requirements into DB architecture choices.
- **Notes:** *(later)*

---

### 11 — Database Engines

- **Status:** `[ ]`
- **Summary:** Storage engines and how they differ (e.g. InnoDB).
- **Focus:** Storage engines and when to choose which.
- **Notes:** *(later)*

---

### 12 — Database Cursors

- **Status:** `[ ]`
- **Summary:** Cursors — walk query results incrementally.
- **Focus:** Server/client cursors and streaming result sets.
- **Notes:** *(later)*

---

### 13 — Database Security

- **Status:** `[ ]`
- **Summary:** Database security — access, encryption, threats.
- **Focus:** AuthZ, encryption at rest/in transit, hardening.
- **Notes:** *(later)*

---

### 14 — Homomorphic Encryption

- **Status:** `[ ]`
- **Summary:** Query encrypted data without full decryption.
- **Focus:** Homomorphic encryption for encrypted-data queries.
- **Full title:** Homomorphic Encryption — Performing Database Queries on Encrypted Data
- **Notes:** *(later)*

---

### 15 — Q&A

- **Status:** `[ ]`
- **Summary:** Answers to course questions.
- **Focus:** Instructor Q&A sessions.
- **Notes:** *(later)*

---

### 16 — Database Discussions

- **Status:** `[ ]`
- **Summary:** Extra discussions around database topics.
- **Focus:** Extended discussions beyond core lectures.
- **Notes:** *(later)*

---

### 17 — Archived Lectures

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
