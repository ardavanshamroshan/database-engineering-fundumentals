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
