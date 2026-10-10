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
  - [04.1 — Key vs Non-Key Columns (Lesson 005)](#041--key-vs-non-key-columns-lesson-005)
  - [04.2 — Combining Indexes (Lesson 006)](#042--combining-indexes-lesson-006)
  - [04.3 — How the Optimizer Chooses an Index (Lesson 007)](#043--how-the-optimizer-chooses-an-index-lesson-007)
  - [04.4 — Bitmap Scan vs Index Scan vs Table Scan (Lesson 008)](#044--bitmap-scan-vs-index-scan-vs-table-scan-lesson-008)
  - [04.5 — Create Index Concurrently (Lesson 009)](#045--create-index-concurrently-lesson-009)
  - [04.6 — Bloom Filters (Lesson 010)](#046--bloom-filters-lesson-010)
  - [04.7 — Working with Billion-Row Tables (Lesson 011)](#047--working-with-billion-row-tables-lesson-011)
- [05 — B-Tree vs B+Tree](#05--b-tree-vs-btree-in-production-database-systems)
  - [05.1 — Introduction and Learning Path (Lesson 001)](#051--introduction-and-learning-path-lesson-001)
  - [05.2 — Full Table Scans (Lesson 002)](#052--full-table-scans-lesson-002)
  - [05.3 — The Original B-Tree (Lesson 003)](#053--the-original-b-tree-lesson-003)
  - [05.4 — How B-Trees Improve Performance (Lesson 004)](#054--how-b-trees-improve-performance-lesson-004)
  - [05.5 — Limitations of the Classic B-Tree (Lesson 005)](#055--limitations-of-the-classic-b-tree-lesson-005)
  - [05.6 — B+Tree Structure and Range Queries (Lesson 006)](#056--btree-structure-and-range-queries-lesson-006)
  - [05.7 — Production DBMS Considerations (Lesson 007)](#057--production-dbms-considerations-lesson-007)
  - [05.8 — Storage Costs: PostgreSQL vs MySQL InnoDB (Lesson 008)](#058--storage-costs-postgresql-vs-mysql-innodb-lesson-008)
  - [05.9 — Summary and Self-Check (Lesson 009)](#059--summary-and-self-check-lesson-009)

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
- **Summary:** Find rows efficiently, choose indexes for real queries, and measure the result.
- **Focus:** Scan plans, key vs included columns, index types, and read/write trade-offs.

**Learning goal:** By the end, you should be able to explain why a query uses an index, build a suitable one, and check whether it helps.

#### 1. What an index does

Think of an index as a book's index: it helps you find a topic without reading every page. In PostgreSQL, table rows live in the **heap**, and an index is a separate structure that points to those rows.

A **B-Tree**, the default index type, stores ordered keys and references to heap tuples. It helps with equality (`=`), ranges (`>`, `BETWEEN`), and matching `ORDER BY` clauses. It does not sort the table itself.

![An index finds a key, then points to the row in the heap](images/index-emp-id-heap.png)

**The trade-off:** Indexes can reduce read work, but take disk space and add write and maintenance work. Create them for queries you actually need to speed up.

#### 2. Lab: compare a query before and after indexing

Use a PostgreSQL practice database. Run the blocks in order, in the same session, with autocommit enabled. The temporary table disappears when you disconnect, so you can repeat the lab in a new session.

**Step 1 — Create 100,000 rows.**

```sql
CREATE TEMP TABLE indexing_employees (
  id integer PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  department_id integer NOT NULL,
  active boolean NOT NULL
);

INSERT INTO indexing_employees
SELECT n,
       'User ' || n,
       'user' || n || '@example.com',
       n % 100,
       n % 10 = 0
FROM generate_series(1, 100000) AS g(n);

ANALYZE indexing_employees;
```

The primary key already creates a unique B-Tree on `id`. It does **not** create an index on `email`. `ANALYZE` gives the planner statistics about the data.

**Step 2 — Measure an email lookup without an email index.**

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name
FROM indexing_employees
WHERE email = 'user50000@example.com';
```

Expect a **Seq Scan**: PostgreSQL examines the table and filters out nonmatching rows. Save the plan and execution time.

**Step 3 — Add an index and run the same query.**

```sql
CREATE INDEX indexing_employees_email_idx
ON indexing_employees (email);

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name
FROM indexing_employees
WHERE email = 'user50000@example.com';
```

Expect an **Index Scan**: find the email in the index, then fetch `id` and `name` from the heap. Compare the work done and execution time with Step 2.

Plans and times depend on your data, settings, and cache. Repeat each query a few times; compare under similar conditions rather than expecting a fixed speedup.

#### 3. Read the execution plan

| Plan | How it retrieves data | Common use |
| --- | --- | --- |
| **Seq Scan** | Reads table pages and applies a filter. | Small tables or queries returning many rows. |
| **Index Scan** | Finds entries in the index, then visits the heap. | Selective lookups that need columns outside the index. |
| **Index Only Scan** | Gets values from the index; checks visibility and may visit the heap. | Queries whose required columns are available in the index. |
| **Bitmap Index Scan + Bitmap Heap Scan** | Collects row locations, then visits heap pages in page order. | Fetching multiple matches or combining indexes. |

Start with these fields:

- **Index Cond:** The condition used to search the index.
- **Filter / Rows Removed by Filter:** Work done after retrieving candidate rows.
- **Estimated vs actual rows:** Large differences can indicate outdated statistics or data the planner estimates poorly.
- **Buffers:** Page accesses through memory or reads; these are not a count of unique pages or physical disk operations.
- **Heap Fetches:** Heap visits during an index-only scan. Zero means no heap visits were needed for that execution.
- **Execution Time:** Time spent executing this measured query; planner cost is a separate estimate, not milliseconds.

`EXPLAIN` shows estimates. `EXPLAIN ANALYZE` **executes** the statement, including any changes made by an `INSERT`, `UPDATE`, or `DELETE`.

#### 4. Key columns vs included columns

**Key columns** guide index searches and define ordering. **Included columns** store extra values for returning results; they do not define search order or uniqueness.

For `WHERE email = ...`, `email` is the search key. To return `id` and `name` without fetching their values from the heap, replace the lab's index with a **covering index**:

```sql
DROP INDEX indexing_employees_email_idx;

CREATE INDEX indexing_employees_email_cover_idx
ON indexing_employees (email) INCLUDE (id, name);

VACUUM (ANALYZE) indexing_employees;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name
FROM indexing_employees
WHERE email = 'user50000@example.com';
```

An **Index Only Scan** is now possible. PostgreSQL still checks whether each row is visible to the transaction. `VACUUM` can mark heap pages as all-visible in the **visibility map**, allowing heap visits to be skipped. Recent writes can make heap checks necessary again.

| Definition | Search / ordering keys | Extra values stored |
| --- | --- | --- |
| `(email)` | `email` | None |
| `(email, id)` | `email`, then `id` | None |
| `(email) INCLUDE (id, name)` | `email` | `id`, `name` |

A unique index on `(email) INCLUDE (id)` enforces uniqueness of **email alone**. Adding every column with `INCLUDE` can make the index expensive; an index-only plan is not automatically faster.

#### 5. Three useful index strategies

These examples continue the same lab. Each solves a different query pattern.

**Composite index — filter and sort together.**

```sql
CREATE INDEX indexing_employees_department_id_idx
ON indexing_employees (department_id, id);

EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM indexing_employees
WHERE department_id = 42
ORDER BY id
LIMIT 20;
```

The index groups rows by department, then orders each group by `id`. For this query, put the equality filter first and the ordering column next. Queries on `id` alone are usually better served by the existing primary-key index. Later columns can sometimes be used without the leading column, including via PostgreSQL 18's skip scan; measure rather than treating the leftmost-prefix rule as absolute.

**Partial index — index only the rows a query needs.**

```sql
CREATE INDEX indexing_employees_active_id_idx
ON indexing_employees (id) WHERE active;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM indexing_employees
WHERE active
ORDER BY id
LIMIT 20;
```

Only 10% of the lab rows are active, so this index is smaller than one covering every row. The planner must be able to prove that the query's condition implies the index predicate. A generic parameterized condition such as `active = $1` may prevent that proof. Index predicates cannot use changing expressions such as `now()`.

**Expression index — search a computed value.**

```sql
CREATE INDEX indexing_employees_email_lower_idx
ON indexing_employees (lower(email));

ANALYZE indexing_employees;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM indexing_employees
WHERE lower(email) = lower('USER50000@EXAMPLE.COM');
```

Use a matching expression in the query. A plain index on `email` does not directly support searching `lower(email)`; the expression index stores the computed value and adds write work.

#### 6. Choose the index type

| Type | Useful for | Keep in mind |
| --- | --- | --- |
| **B-Tree** | Equality, ranges, and ordering. | Start here for ordinary lookups. |
| **Hash** | Equality only. | Does not support ranges or ordering; compare with B-Tree before choosing it. |
| **GIN** | JSONB containment, arrays, and full-text search. | Matches components inside values; can add substantial write work. |
| **GiST / SP-GiST** | Spatial, range, or nearest-neighbor queries, depending on the type and operator class. | Choose according to the operators you need; PostGIS adds geographic support. |
| **BRIN** | Very large tables where values correlate with physical row order, such as append-only timestamps. | Stores compact summaries of page ranges; candidate rows still need checking. |

Index types are selected with `USING`, for example `CREATE INDEX ... USING gin (metadata)` for a JSONB column. The data type and operators must match the index's operator class.

For text patterns:

- `LIKE 'User 5%'` can use a B-Tree; outside the `C` locale, prefix searches generally need `text_pattern_ops` for `text` or `varchar_pattern_ops` for `varchar`.
- `LIKE '%User 5%'` cannot use a normal B-Tree to seek a prefix. Consider a GIN or GiST trigram index through `pg_trgm` for substring searches.

#### 7. Keep indexes useful

1. Start with frequent or expensive queries and their `WHERE`, `JOIN`, and `ORDER BY` clauses.
2. Prefer indexes that narrow the search to a small part of the table. A low-cardinality column can still be useful when a particular value is rare.
3. Check existing indexes: `PRIMARY KEY` and `UNIQUE` constraints already create them. PostgreSQL does not automatically index the referencing columns of a foreign key; consider those indexes for joins and parent-row updates or deletes.
4. Keep `ANALYZE` statistics and vacuum maintenance current. Inspect size and usage before removing an index; zero recorded scans alone is not proof that it is unnecessary.
5. Measure the read benefit against disk usage and write cost. On busy production tables, consider `CREATE INDEX CONCURRENTLY` to allow writes during the build; it cannot run inside a transaction block.

Inspect the lab's index sizes and definitions:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname LIKE 'pg_temp_%'
  AND tablename = 'indexing_employees';

SELECT pg_size_pretty(pg_table_size('indexing_employees')) AS table_size,
       pg_size_pretty(pg_indexes_size('indexing_employees')) AS indexes_size;
```

A Seq Scan is not automatically a problem: it can be the cheapest plan for a small table or a query needing most rows. `SELECT *` does not forbid index use, but it often requires heap access because the index lacks some columns.

#### 8. Check your understanding

- Why did the email lookup need a Seq Scan before Step 3?
- Why can `INCLUDE (id, name)` make an index-only scan possible without making `name` a search key?
- Why can an index-only scan still show heap fetches?
- Which lab index matches `WHERE department_id = 42 ORDER BY id LIMIT 20`?
- What would you measure before keeping another index?

**Answers:** There was no email index; included columns supply result values; visibility checks may need the heap; `(department_id, id)` matches the filter and order; compare query work and time, index size, and write overhead.

**Remember:** Design for the query → measure the plan → add the smallest useful index → measure again.

**Further reading:** PostgreSQL documentation on [index types](https://www.postgresql.org/docs/18/indexes-types.html), [multicolumn indexes](https://www.postgresql.org/docs/18/indexes-multicolumn.html), [covering indexes](https://www.postgresql.org/docs/18/indexes-index-only-scans.html), [partial indexes](https://www.postgresql.org/docs/18/indexes-partial.html), and [expression indexes](https://www.postgresql.org/docs/18/indexes-expressional.html).

---

### 04.1 — Key vs Non-Key Columns (Lesson 005)

**Goal:** Decide which columns should guide a search and which should only supply output values.

A key column is part of the index's search order. A non-key column added with `INCLUDE` is stored as payload. For `WHERE grade >= 90 ORDER BY grade DESC`, `grade` should be a key; `id` can be included if the query only returns `id` and `grade`.

**Practice setup:** Run the following lessons in order in one PostgreSQL practice session with autocommit enabled. The temporary tables disappear when you disconnect. Lesson 009 uses a separate, ordinary practice table because temporary tables cannot demonstrate concurrent writes from another session.

```sql
CREATE TEMP TABLE indexing_students (
  id integer PRIMARY KEY,
  grade integer NOT NULL,
  name text NOT NULL,
  notes text NOT NULL
);

INSERT INTO indexing_students
SELECT n, n % 101, 'Student ' || n, repeat('Practice notes. ', 20)
FROM generate_series(1, 100000) AS g(n);

CREATE INDEX indexing_students_grade_idx
ON indexing_students (grade);

VACUUM (ANALYZE) indexing_students;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, grade FROM indexing_students
WHERE grade >= 90
ORDER BY grade DESC
LIMIT 100;
```

The grade index can support the filter and ordering, but PostgreSQL must fetch `id` from the heap. The primary-key index does not automatically add `id` to every other index.

Replace the index and measure again:

```sql
DROP INDEX indexing_students_grade_idx;

CREATE INDEX indexing_students_grade_cover_idx
ON indexing_students (grade) INCLUDE (id);

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, grade FROM indexing_students
WHERE grade >= 90
ORDER BY grade DESC
LIMIT 100;
```

An index-only scan is possible because both required columns are available. Check `Heap Fetches`, buffers, and execution time. A backward B-Tree scan can provide descending order; a separate descending index is unnecessary for this single-column sort.

**Check:** Would `INCLUDE (id)` also cover `SELECT name, grade`? **No.** `name` is absent, so heap access is still required. Include only values needed by important queries; wider indexes take more space and add write work.

[Reference: covering indexes](https://www.postgresql.org/docs/18/indexes-index-only-scans.html).

---

### 04.2 — Combining Indexes (Lesson 006)

**Goal:** Choose between separate indexes and a composite index for `AND` and `OR` queries.

```sql
CREATE TEMP TABLE indexing_pairs (
  id integer PRIMARY KEY,
  a integer NOT NULL,
  b integer NOT NULL,
  payload text NOT NULL
);

INSERT INTO indexing_pairs
SELECT n, n % 100, (n / 100) % 100, repeat('Payload ', 20)
FROM generate_series(1, 100000) AS g(n);

CREATE INDEX indexing_pairs_a_idx ON indexing_pairs (a);
CREATE INDEX indexing_pairs_b_idx ON indexing_pairs (b);
ANALYZE indexing_pairs;

EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE a = 42 AND b = 17;

EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE a = 42 OR b = 17;
```

PostgreSQL can build row-location bitmaps from separate indexes. **BitmapAnd** intersects matches; **BitmapOr** combines them. The planner can also choose one index and filter, or scan the table. Two available indexes do not mean both must be used, and combining them does not imply parallel execution.

Now replace the index on `a` with a composite index; keep the index on `b`:

```sql
DROP INDEX indexing_pairs_a_idx;
CREATE INDEX indexing_pairs_ab_idx ON indexing_pairs (a, b);

EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE a = 42 AND b = 17;
```

| Query pattern | Design to consider |
| --- | --- |
| `a = ...` | `(a)` or the leading part of `(a, b)`. |
| `b = ...` | `(b)`; `(a, b)` may also help in some cases through skip scan. |
| `a = ... AND b = ...` | `(a, b)` can search the pair directly; separate indexes can be combined. |
| `a = ... OR b = ...` | Separate searchable paths, such as `(a, b)` plus `(b)`, can allow BitmapOr. |

**Check:** Why keep `(b)` alongside `(a, b)`? It provides a direct path for `b`-only queries. Keep it only if the workload justifies its storage and maintenance cost.

[Reference: combining multiple indexes](https://www.postgresql.org/docs/18/indexes-bitmap-scans.html).

---

### 04.3 — How the Optimizer Chooses an Index (Lesson 007)

**Goal:** Understand why a valid index can be ignored.

The optimizer compares estimated plan costs. It considers table size, matching-row estimates, the columns needed, ordering, `LIMIT`, data distribution, and the expected cost of reading index and heap pages.

| Choice | Why it may be cheaper |
| --- | --- |
| One index, then a filter | The first condition already narrows the search to very few rows. |
| Combined indexes | Their intersection avoids enough heap work to justify scanning both. |
| Sequential scan | Most rows are needed, so walking the table avoids repeated index-to-heap lookups. |

Continue with the table from Lesson 006:

```sql
-- A primary-key lookup finds at most one row; b can be checked afterward.
EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE id = 1742 AND b = 17;

-- Every row matches: a full table scan is a reasonable choice.
EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE a >= 0;

-- Refresh sampled statistics after substantial data changes.
ANALYZE indexing_pairs;
```

Compare estimated `rows` with `actual rows`. A large gap is a reason to investigate statistics or correlations between columns. `ANALYZE` updates planner statistics; `VACUUM` handles dead tuples and visibility maintenance. `VACUUM FULL` rewrites and locks the table, so it is not a routine fix for a poor plan.

**Check:** Is an index on a column with two distinct values always useless? **No.** One value may be rare enough for an index to help. The distribution and the actual query matter more than the count of distinct values alone.

[Reference: planner statistics](https://www.postgresql.org/docs/18/planner-stats.html).

---

### 04.4 — Bitmap Scan vs Index Scan vs Table Scan (Lesson 008)

**Goal:** Recognize how PostgreSQL balances scattered heap reads against reading the entire table.

An **Index Scan** follows matching index entries to heap tuples as it proceeds. A **Bitmap Index Scan** first collects matching locations; a **Bitmap Heap Scan** then visits the selected heap pages in physical order. A **Seq Scan** walks the table directly.

```sql
-- A single row: usually an Index Scan.
EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE id = 50000;

-- Multiple matches across the table: a bitmap plan is a candidate.
EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE a = 42;

-- Most rows: usually a Seq Scan.
EXPLAIN (ANALYZE, BUFFERS)
SELECT payload FROM indexing_pairs WHERE id > 100;
```

These are candidates, not guaranteed plans. There is no universal percentage at which PostgreSQL must switch scan types.

Read a bitmap plan from the inner nodes outward:

```text
Bitmap Heap Scan
  Recheck Cond: ...
  -> BitmapAnd / BitmapOr       (only when combining scans)
       -> Bitmap Index Scan
       -> Bitmap Index Scan
```

- **Exact heap blocks:** The bitmap retains matching tuple locations within a page.
- **Lossy heap blocks:** Under memory pressure, it may keep only page-level information. Tuples on those pages must be rechecked.
- **Rows Removed by Index Recheck:** Candidates rejected when the index condition is checked again. Some index methods also require rechecks.
- **Ordering:** Bitmap processing loses index order. `ORDER BY` may need an additional sort.

**Check:** Why might `ORDER BY ... LIMIT 10` favor an ordinary index scan? A matching B-Tree can return the first rows in order and stop early, avoiding bitmap construction and sorting.

[Reference: interpreting EXPLAIN](https://www.postgresql.org/docs/18/using-explain.html).

---

### 04.5 — Create Index Concurrently (Lesson 009)

**Goal:** Add an index while allowing application writes to continue.

A normal `CREATE INDEX` permits reads but blocks writes to its table during the build. `CREATE INDEX CONCURRENTLY` permits ordinary reads and writes, at the cost of extra scanning and waiting for relevant transactions.

Use an **ordinary table in a disposable practice database**, not the temporary tables above. Run each command separately with autocommit enabled:

```sql
CREATE TABLE indexing_live_demo (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL
);

INSERT INTO indexing_live_demo (email)
SELECT 'user' || n || '@example.com'
FROM generate_series(1, 100000) AS g(n);

CREATE INDEX CONCURRENTLY indexing_live_demo_email_idx
ON indexing_live_demo (email);
```

To observe concurrent writes, try an insert from a second connection while the build is running. This small build may finish too quickly to observe; a larger practice dataset makes the overlap easier to see. In the second connection, use:

```sql
INSERT INTO indexing_live_demo (email) VALUES ('new-user@example.com');
```

Before treating the index as ready, inspect it:

```sql
SELECT c.relname AS index_name, i.indisready, i.indisvalid
FROM pg_index AS i
JOIN pg_class AS c ON c.oid = i.indexrelid
WHERE i.indexrelid = 'indexing_live_demo_email_idx'::regclass;

SELECT pid, phase, blocks_done, blocks_total
FROM pg_stat_progress_create_index
WHERE relid = 'indexing_live_demo'::regclass;
```

A successful completed build has `indisvalid = true`; the progress view has no row after completion. Important limits:

- It cannot run inside `BEGIN` / `COMMIT`, including migrations automatically wrapped in a transaction.
- Long-running transactions can delay completion. Only one concurrent index build can run on a given table at a time.
- It still consumes CPU, I/O, and storage, so application queries may slow down during the build.
- Failure can leave an invalid index that the planner cannot use but that may still add write overhead. Diagnose the cause, then drop the invalid index and retry. Do not rely on `IF NOT EXISTS` to repair it.

**Check:** Does “concurrently” mean “instant and free of locks”? **No.** It avoids the write-blocking table lock of a normal build, but still takes other locks, does work, and may wait.

[Reference: CREATE INDEX and concurrent-build caveats](https://www.postgresql.org/docs/18/sql-createindex.html).

---

### 04.6 — Bloom Filters (Lesson 010)

**Goal:** Avoid expensive lookups when an item is definitely absent.

A Bloom filter represents a set using a bit array and several hash functions. It stores membership information rather than the original values.

1. **Insert:** Hash the item to several positions and set those bits to 1.
2. **Check:** Hash the candidate using the same functions.
3. **Any bit is 0:** The candidate is definitely absent from the represented set.
4. **All bits are 1:** The candidate may be present; perform the authoritative lookup.

For example, suppose `Ali` sets positions 2, 5, and 9. A name checking positions 2, 4, and 9 is absent if bit 4 is still 0. Another name may map to three bits already set by other names, producing a **false positive**.

```text
Username request
  → Bloom filter says absent → skip the database lookup
  → Bloom filter says maybe  → query the database to confirm
```

**Correctness matters:** The “no false negatives” guarantee applies only to a correctly maintained filter containing every item in the set. If a database insert is missing from the filter, an “absent” result is unsafe. Coordinate updates and rebuilds; when coverage is uncertain, fall back to the database. A unique database constraint remains responsible for enforcing username uniqueness.

More items in a fixed-size filter increase false positives. Size it for expected capacity and a target false-positive rate. A standard Bloom filter cannot safely delete an item by clearing its bits because other items may share them; use a suitable variant or rebuild.

**Check:** Can a Bloom filter return a user's profile or confirm that a username is taken? **No.** It only answers “definitely absent” or “possibly present.” PostgreSQL's optional `bloom` index uses Bloom signatures and heap rechecks; it is distinct from an application-side membership filter.

[References: Bloom filter survey](https://www.eecs.harvard.edu/~michaelm/postscripts/im2005b.pdf) · [PostgreSQL bloom index](https://www.postgresql.org/docs/18/bloom.html).

---

### 04.7 — Working with Billion-Row Tables (Lesson 011)

**Goal:** Reduce the amount of data a query processes before adding infrastructure.

A billion rows is not, by itself, a reason to shard. Row width, query patterns, write rate, working-set size, maintenance, and hardware determine the pressure on the system.

| Approach | What it changes | Main trade-off |
| --- | --- | --- |
| Indexing | Narrows searches to matching entries and rows. | Extra storage and write work. |
| Partitioning | Splits one logical table; pruning can skip irrelevant partitions. | Queries need useful partition-key conditions; more objects to manage. |
| Sharding | Distributes data and load across database hosts. | Routing, cross-shard queries, transactions, and rebalancing become harder. |
| Parallel processing | Divides scanning or computation among workers. | More resources; useful for large analytics, not a substitute for selective lookups. |
| Retention / summaries | Removes obsolete data or stores reusable aggregate results. | Must preserve business requirements and manage freshness. |

**Example: a social-following table.** A separate row per relationship supports uniqueness, reverse lookups, and pagination. Storing every follower in one growing JSON array can create a large, frequently rewritten row and contention; fewer rows do not automatically mean a more scalable design.

For a large practice table, match the index to the query and paginate by a stable key:

```sql
CREATE TEMP TABLE indexing_follows (
  follower_id bigint NOT NULL,
  followed_id bigint NOT NULL,
  PRIMARY KEY (follower_id, followed_id)
);

INSERT INTO indexing_follows
SELECT follower, followed
FROM generate_series(1, 1000) AS f(follower)
CROSS JOIN generate_series(1, 100) AS t(followed);

CREATE INDEX indexing_follows_reverse_idx
ON indexing_follows (followed_id, follower_id);
ANALYZE indexing_follows;

EXPLAIN (ANALYZE, BUFFERS)
SELECT follower_id FROM indexing_follows
WHERE followed_id = 42 AND follower_id > 500
ORDER BY follower_id
LIMIT 50;
```

`500` is the last follower ID from the previous page. The reverse index matches the equality condition, cursor range, and sort order. This **keyset pagination** avoids walking an ever-growing `OFFSET`. The small dataset tests the query shape; it does not demonstrate billion-row performance or guarantee a fixed snapshot across page requests.

**Practical order:** Measure slow queries → improve indexes and result sizes → consider retention and partition pruning → shard when measured capacity or distribution requirements justify it. For time partitioning, include a time condition that lets PostgreSQL prune partitions; partitioning without pruning may still read many partitions.

**Check:** Will adding more workers make a one-row lookup efficient if every worker still scans a large part of the table? **No.** Reducing the searched data is usually the first improvement for that workload.

[Reference: PostgreSQL partitioning and pruning](https://www.postgresql.org/docs/18/ddl-partitioning.html). Continue with Chapters 06 and 07 for partitioning and sharding in more detail.

---

### 05 — B-Tree vs B+Tree in Production Database Systems

- **Status:** `[ ]`
- **Summary:** Understand how balanced trees reduce lookup work and how database storage changes the cost.
- **Focus:** All nine course lessons: scans, B-Tree structure, B+Tree ranges, caching, and PostgreSQL vs MySQL InnoDB.

### 05.1 — Introduction and Learning Path (Lesson 001)

**Goal:** Connect the tree diagrams to what a database actually reads.

The main question is: **How can we find a few rows without reading the entire table?** Follow the path from full scans to balanced trees, then compare how PostgreSQL and InnoDB retrieve the row after finding an index entry.

Keep three things separate:

- **Search key:** The value being indexed, such as an employee ID.
- **Child pointer:** A reference to another page inside the tree.
- **Row reference or payload:** The information used to retrieve or return the result.

A textbook tree illustrates the structure; a production index adds page layouts, concurrency, caching, and transaction visibility. Database documentation often calls the whole family **B-Tree**, even when its implementation has B+Tree-style leaves and separators.

**Check:** Does knowing that an index is a B-Tree tell you where the full row is stored? **No.** You also need to know the storage engine and index layout.

### 05.2 — Full Table Scans (Lesson 002)

**Goal:** Recognize the problem an index solves and when scanning remains sensible.

A full scan examines table pages and tests rows against a condition. It can be expensive when a large table has only one matching row, but sensible when most rows are needed. Pages already in memory avoid storage reads; a page access is not automatically one physical disk operation.

**Practice:** Use one PostgreSQL practice session with autocommit enabled. Run the SQL blocks in order. The temporary table disappears when you disconnect.

```sql
CREATE TEMP TABLE btree_people (
  id integer NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  notes text NOT NULL
);

INSERT INTO btree_people
SELECT n, 'Person ' || n, 'person' || n || '@example.com',
       repeat('Learning about trees. ', 10)
FROM generate_series(1, 100000) AS g(n);

ANALYZE btree_people;

EXPLAIN (ANALYZE, BUFFERS)
SELECT name FROM btree_people WHERE id = 50000;
```

There is no index yet, so expect a **Seq Scan**. Save the plan, rows removed by the filter, buffers, and execution time. Parallel scans can distribute work for eligible tables and queries; they do not eliminate that work. PostgreSQL temporary tables are not scanned by parallel workers.

**Check:** Is a Seq Scan always the slowest choice? **No.** For a small table or a query returning most rows, it may be cheapest.

### 05.3 — The Original B-Tree (Lesson 003)

**Goal:** Understand nodes, keys, balance, and fan-out.

A B-Tree is a balanced, multiway search tree. Each node holds ordered keys. Internal nodes have child pointers that divide the remaining key space; all leaves are at the same depth.

In the classic B-Tree model, entries associated with records can appear in **internal nodes as well as leaves**. Their associated value might be a row reference rather than the full row.

```text
                  [4 | 8]
                /    |    \
          [1 2 3] [5 6 7] [9 10 11]
```

Every displayed key has an associated record value or reference in this simplified model. To search for `7`, compare it with `4` and `8`, follow the middle child, then find `7` there. To search for `4`, the matching entry is already in the root.

**Fan-out** is the number of children an internal node can address. If a node has `k` separator keys, it normally has `k + 1` children. Textbooks use different definitions of “order” and “degree”; focus on the structure rather than assuming those terms always mean the same number.

**Check:** Why use many children instead of a binary tree? More branches per page can make the tree shallower, reducing the number of pages on a search path.

### 05.4 — How B-Trees Improve Performance (Lesson 004)

**Goal:** Explain why a lookup can touch far fewer pages than a table scan.

At each level, the search chooses a smaller key range. In database implementations, a tree node typically occupies a page containing many entries. With high fan-out, even a large index can have relatively few levels.

For intuition, a fan-out of 100 gives up to 100 child pages from one internal page and 10,000 pages after another branching level. Real capacity depends on occupancy, key width, payload, and page overhead; these are not benchmark guarantees.

Continue the lab:

```sql
CREATE UNIQUE INDEX btree_people_id_idx ON btree_people (id);

EXPLAIN (ANALYZE, BUFFERS)
SELECT name FROM btree_people WHERE id = 50000;
```

Expect an **Index Scan**: the tree finds the index entry, then PostgreSQL fetches `name` from the heap. Compare with Lesson 002. Index traversal and heap retrieval are distinct costs, and repeated runs can benefit from caching.

Inserting a key into a full page can cause a **page split**. Entries are divided, a parent separator is added, and a split may propagate upward. These operations preserve the tree's balance but add write work.

**Check:** Does an index make writes free? **No.** Inserts must maintain the tree, and splits can require additional page changes.

### 05.5 — Limitations of the Classic B-Tree (Lesson 005)

**Goal:** Understand the motivation for separating navigation from record data.

When internal entries carry both keys and record payload or references, fewer navigation entries may fit on a page. That can reduce fan-out and increase the number of pages in the tree.

Classic B-Trees can answer range queries through an ordered traversal. They do **not** inherently require a fresh root-to-leaf search for every key. However, entries spread across internal nodes and leaves make range traversal less straightforward than walking a linked sequence of leaves.

The design questions are:

- Can internal pages mostly store navigation information?
- Can all record entries be gathered at the leaf level?
- Can a range scan continue from one leaf to the next?

**Check:** Does removing payload from internal pages remove it from the index? **No.** A B+Tree moves record entries to the leaves; it still needs to store them.

### 05.6 — B+Tree Structure and Range Queries (Lesson 006)

**Goal:** Follow a range scan from its first matching leaf entry.

In the textbook B+Tree model, internal nodes hold **separator keys and child pointers**. The record entries are stored in the leaves, which are commonly linked in key order. Some separator values also appear among the leaf keys.

```text
                    [4 | 7]              navigation
                   /   |   \
              [1 2 3] → [4 5 6] → [7 8 9]  leaf entries
```

To retrieve keys `4` through `8`:

1. Descend through the separators to the leaf containing `4`.
2. Read entries `4`, `5`, and `6`.
3. Follow the next-leaf link and read `7` and `8`.
4. Stop when the upper bound is exceeded.

The keys are logically adjacent, but their pages are not guaranteed to be physically adjacent on disk. Fetching full rows through a secondary index can still involve scattered table reads.

Continue the PostgreSQL lab:

```sql
VACUUM (ANALYZE) btree_people;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM btree_people
WHERE id BETWEEN 50000 AND 50100
ORDER BY id;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name FROM btree_people
WHERE id BETWEEN 50000 AND 50100
ORDER BY id;
```

The first query can use an **Index Only Scan**; inspect `Heap Fetches`. The second needs `name`, which is outside this index, and can use an **Index Scan**. A matching B-Tree scan can provide the requested ordering without a separate sort. The planner still chooses the actual plan.

**Check:** Is a range scan free after finding the first key? **No.** It must read the matching entries and, when necessary, fetch their rows.

### 05.7 — Production DBMS Considerations (Lesson 007)

**Goal:** Account for pages, cache, and write behavior beyond the diagram.

| Consideration | Practical effect |
| --- | --- |
| Key and payload width | Wider entries often mean fewer entries per page and a larger index. |
| Internal-page caching | Frequently used upper levels may stay in memory even when the whole index does not fit. |
| Leaf pages | Range scans can touch many leaf pages; caching and locality matter. |
| Page splits | Inserts can add maintenance work and change page occupancy. |
| MVCC visibility | Having a value in an index does not automatically mean PostgreSQL can skip heap checks. |

PostgreSQL pages are normally 8 KiB; InnoDB's default page size is 16 KiB. These are database pages, not necessarily storage-device block sizes. Larger pages alone do not determine which engine is faster.

Inspect your PostgreSQL configuration and the lab's storage:

```sql
SHOW block_size;

SELECT pg_size_pretty(pg_table_size('btree_people')) AS table_size,
       pg_size_pretty(pg_indexes_size('btree_people')) AS indexes_size;
```

Compare buffer counts and execution time under similar conditions. Do not equate tree height with disk reads: cached internal pages can make traversal cheap, while fetching many heap rows can dominate the query.

**Check:** Must the entire index fit in RAM to be useful? **No.** Cached upper levels and frequently accessed leaves can still help substantially.

### 05.8 — Storage Costs: PostgreSQL vs MySQL InnoDB (Lesson 008)

**Goal:** Understand what an index entry points to in each engine.

| Detail | PostgreSQL | MySQL InnoDB |
| --- | --- | --- |
| Main row storage | Heap, separate from indexes. | Leaf records of the clustered index, normally organized by primary key. |
| Secondary-index leaf | Indexed values and heap tuple references (TIDs), plus optional included values. | Secondary-key values and primary-key columns. |
| Lookup needing other columns | Search index → fetch heap tuple. | Search secondary index → search clustered index by primary key → retrieve row. |
| Primary-key lookup | Search primary-key index → fetch heap if needed. | Search clustered index → retrieve row at its leaf. |
| Wider primary key | Enlarges its own index; not automatically copied into unrelated secondary indexes. | Adds storage to secondary indexes that carry the primary-key columns. |

These are ordinary lookup paths; covering queries and transaction visibility can change the work needed. PostgreSQL's B-Tree implementation uses leaf entries and navigation pages; its documentation and SQL still call the method `btree`.

```text
PostgreSQL:    email index → heap tuple → name
InnoDB:       email index → primary key → clustered leaf → name
```

**Key-width example:** A `BIGINT` value uses 8 bytes; a binary UUID uses 16 bytes. A UUID written as text usually contains 36 characters. Those figures describe the values, not the complete size of an index entry or its overhead.

In InnoDB, wider primary keys can enlarge multiple secondary indexes. Random insertion order can also spread writes across leaf pages; increasing keys often improve locality but can concentrate concurrent inserts on the right edge. UUID choice is therefore a workload decision, not an automatic mistake. Time-ordered UUIDs and compact binary storage address different aspects of the cost.

PostgreSQL has its own update trade-offs: a changed row version may require new index entries. Eligible **HOT updates** can avoid that when columns referenced by ordinary indexes are unchanged and the new version fits on the same heap page. The row-reference difference alone does not establish a universally faster engine.

**Check:** Does InnoDB's clustered leaf contain just a pointer to the row? **No.** It holds the row record itself, although large values may have parts stored off-page.

[References: InnoDB clustered and secondary indexes](https://dev.mysql.com/doc/refman/8.4/en/innodb-index-types.html) · [InnoDB physical index structure](https://dev.mysql.com/doc/refman/8.4/en/innodb-physical-structure.html) · [PostgreSQL HOT updates](https://www.postgresql.org/docs/18/storage-hot.html).

### 05.9 — Summary and Self-Check (Lesson 009)

**Goal:** Explain the complete path from a query to its result.

| Question | Answer |
| --- | --- |
| Why does a tree help? | It narrows the search at each level instead of inspecting every row. |
| What changes in a B+Tree? | Internal pages guide navigation; record entries are in the leaves. |
| Why are linked leaves useful? | A range scan can continue through ordered leaf entries. |
| What determines lookup cost? | Tree pages, caching, matching-entry count, row retrieval, and visibility checks. |
| Why does the engine matter? | PostgreSQL points into a heap; InnoDB secondary indexes lead to a clustered index. |

**Try explaining these without looking back:**

1. Trace the path for `SELECT name FROM btree_people WHERE id = 50000` in each engine.
2. Explain why `SELECT id` can avoid work that `SELECT id, name` requires in the lab.
3. Describe how a wider primary key affects InnoDB secondary indexes.
4. Explain why an index-only plan may still fetch heap tuples.
5. Name a workload where scanning the table is a reasonable choice.

**Answers:** PostgreSQL searches its primary-key index then the heap; InnoDB reaches the row in the clustered leaf. The lab's index stores `id`, not `name`. InnoDB secondary entries carry primary-key columns. PostgreSQL may need heap visibility checks. Scanning can suit a small table or a query returning most rows.

**Remember:** Tree structure narrows the search; storage layout, cache, and workload determine the real cost.

**Further reading:** [PostgreSQL B-Tree indexes](https://www.postgresql.org/docs/18/btree.html), [PostgreSQL B-Tree implementation notes](https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/access/nbtree/README), and [index-only scans](https://www.postgresql.org/docs/18/indexes-index-only-scans.html).

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
