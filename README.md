# Database Engineering Fundamentals

## مسیر یادگیری شخصی — فصل‌به‌فصل

کتابچه اسکلت برای دنبال کردن کورس **Database Engineering Fundamentals**.  
عنوان و خلاصه هر بخش به فارسی؛ بدنه و اصطلاحات به انگلیسی.

Personal learning path. Skeleton only — chapter notes come later.  
Mark progress with checkboxes as you finish each section.

---

## Progress


| Status         | Count |
| -------------- | ----- |
| Total chapters | 17    |
| Done           | 0     |
| In progress    | —     |


Overall: `[ ]` not started · `[~]` in progress · `[x]` done

---

## How to use / نحوه استفاده

1. Study one chapter at a time (order below).
2. Tick the checkbox when that chapter is done.
3. Add your own notes under the chapter later (or in linked files).
4. Skip **01 / 15 / 16 / 17** if you only want core engineering topics; still listed for completeness.

Local course materials:

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

- **وضعیت:** `[ ]`
- **خلاصه:** به‌روزرسانی‌ها و تغییرات کورس.
- **Focus:** Course changelog and material updates.
- **Notes:** *(later)*

---



### 02 — ACID

- **وضعیت:** `[ ]`
- **خلاصه:** چهار ویژگی تراکنش: Atomicity, Consistency, Isolation, Durability.
- **Focus:** Transaction guarantees in relational systems.
- **Notes:** *(later)*

ACID: **Atomicity**, **Consistency**, **Isolation**, **Durability**.
In Relational Database Systems, ACID is used to ensure the integrity and consistency of the database.

### What is a Transaction?

- A transaction is:
  - A group of queries executed as one unit
  - Treated as a single, indivisible task (unit of work)
  - E.g. Account deposit: 
    - SELECT: select the money from the first account check if the guy has enough money
    - UPDATE: update the first account with the new balance
    - UPDATE: update the second account with the new balance. deposit the money in the second account.
      - `START TRANSACTION; SELECT * FROM account WHERE account_id = 1; IF balance < 100 THEN ROLLBACK; UPDATE account SET balance = balance - 100 WHERE account_id = 1; UPDATE account SET balance = balance + 100 WHERE account_id = 2; COMMIT;`
        If the guy doesn't have enough money, the transaction will be rolled back and the database will be in the same state as before the transaction. If the guy has enough money, the transaction will be committed and the database will be in the new state.
  - To ensure you can undo a transaction if needed, all changes are first written to memory; only after confirming the transaction should they be committed to disk.



### Atomicity

A transaction is an atomic unit of work that either succeeds or fails as a whole. All queries in a transaction must succeed or fail together. That is the definition of atomicity.

### Consistency

A transaction must bring the database from one valid state to another.

- Consistency in Data
- Consistency in reads: 
  - If a transation committed a change will a new transaction immediately see the change?
  - Affects the system as whole.
  - Relational and NoSQL databases suffer from this.
  - Eventual consistency



### Isolation

A transaction is isolated from other transactions, so that each transaction sees a consistent snapshot of the database.
Can my inflight transaction see changes made by other transactions?
Begin Transaction 1: 
`SELECT id, quantity FROM products WHERE id = 1;`
`SELECT SUM(quantity) FROM products;`
Begin Transaction 2:
`UPDATE products SET quantity = quantity - 1 WHERE id = 1;`
If the transactions are not isolated, the result of the second transaction will be wrong.

**Isolation levels for inflight transactions:**
- **Read Uncommitted**: No isolation, any change from outside is visible to the transaction, committed or not.
    - 🔴 Dirty reads: may occur 
    - 🔴 Lost updates: may occur 
    - 🔴 Non-repeatable reads: may occur 
    - 🔴 Phantom reads: may occur 

- **Read Committed**: Each query in a transaction only sees changes committed by other transactions.
    - 🟢 Dirty reads: dont occur 
    - 🔴 Lost updates: may occur 
    - 🔴 Non-repeatable reads: may occur 
    - 🔴 Phantom reads: may occur 

- **Repeatable Read**: The transaction will make sure that when a query reads a row, that row will remain unchanged the transaction while its running.
    - 🟢 Dirty reads: dont occur 
    - 🟢 Lost updates: dont occur 
    - 🔴 Non-repeatable reads: dont occur
    - 🔴  Phantom reads: may occur
    

- **Snapshot**: Each query in a transaction only sees changes that have been committed up to the start of the transaction. it's like a snapshot version of the database at the start of the transaction.
    - 🟢 Dirty reads: dont occur
    - 🟢 Lost updates: dont occur
    - 🟢 Non-repeatable reads: dont occur
    - 🟢 Phantom reads: dont occur

Database implementation of isolation:
- Each DBMS implements isolcation levels differently.
- Pessimistic - Row level locks, table locks, page locs to avoid lost updates.
- Optimistic No locks - just track if things changed and fail the transaction if so.
- Repeatable read "locks" the rows it read but it could be expensive if you read a lot of rows, postgres implements RR as snapshot. that is why you don't get phantom read with postgres in repeatable rea.


### Durability

A transaction is durable, so that it will not be lost even if the system fails.

---



### 03 — Understanding Database Internals

- **وضعیت:** `[ ]`
- **خلاصه:** داخل موتور دیتابیس — storage، buffer، execution.
- **Focus:** How a DBMS works under the hood.
- **Notes:** *(later)*

---



### 04 — Database Indexing

- **وضعیت:** `[ ]`
- **خلاصه:** ایندکس چیست، کی بسازیم، هزینه خواندن/نوشتن.
- **Focus:** Index types, selectivity, and trade-offs.
- **Notes:** *(later)*

---



### 05 — B-Tree vs B+Tree in Production Database Systems

- **وضعیت:** `[ ]`
- **خلاصه:** مقایسه B-Tree و B+Tree در سیستم‌های واقعی.
- **Focus:** Tree indexes used by production databases.
- **Notes:** *(later)*

---



### 06 — Database Partitioning

- **وضعیت:** `[ ]`
- **خلاصه:** پارتیشن‌بندی داده داخل یک سیستم.
- **Focus:** Horizontal/vertical partitioning strategies.
- **Notes:** *(later)*

---



### 07 — Database Sharding

- **وضعیت:** `[ ]`
- **خلاصه:** شاردینگ — توزیع داده بین چند نود.
- **Focus:** Shard keys, routing, and cross-shard challenges.
- **Notes:** *(later)*

---



### 08 — Concurrency Control

- **وضعیت:** `[ ]`
- **خلاصه:** کنترل همزمانی، قفل، anomalyها.
- **Focus:** Locks, MVCC, isolation levels in practice.
- **Notes:** *(later)*

---



### 09 — Database Replication

- **وضعیت:** `[ ]`
- **خلاصه:** کپی داده برای دسترس‌پذیری و مقیاس خواندن.
- **Focus:** Leader/follower, sync vs async, lag.
- **Notes:** *(later)*

---



### 10 — Database System Design

- **وضعیت:** `[ ]`
- **خلاصه:** طراحی سیستم دیتابیس برای نیاز واقعی.
- **Focus:** Modeling requirements into DB architecture choices.
- **Notes:** *(later)*

---



### 11 — Database Engines

- **وضعیت:** `[ ]`
- **خلاصه:** موتورهای ذخیره‌سازی و تفاوت‌ها (مثلاً InnoDB و مشابه).
- **Focus:** Storage engines and when to choose which.
- **Notes:** *(later)*

---



### 12 — Database Cursors

- **وضعیت:** `[ ]`
- **خلاصه:** کرسر — پیمایش نتیجه کوئری به‌صورت تدریجی.
- **Focus:** Server/client cursors and streaming result sets.
- **Notes:** *(later)*

---



### 13 — Database Security

- **وضعیت:** `[ ]`
- **خلاصه:** امنیت دیتابیس — دسترسی، رمزنگاری، تهدیدها.
- **Focus:** AuthZ, encryption at rest/in transit, hardening.
- **Notes:** *(later)*

---



### 14 — Homomorphic Encryption

- **وضعیت:** `[ ]`
- **خلاصه:** کوئری روی داده رمزشده بدون رمزگشایی کامل.
- **Focus:** Homomorphic encryption for encrypted-data queries.
- **Full title:** Homomorphic Encryption — Performing Database Queries on Encrypted Data
- **Notes:** *(later)*

---



### 15 — Q&A

- **وضعیت:** `[ ]`
- **خلاصه:** پاسخ به سوالات کورس.
- **Focus:** Instructor Q&A sessions.
- **Notes:** *(later)*

---



### 16 — Database Discussions

- **وضعیت:** `[ ]`
- **خلاصه:** بحث‌های تکمیلی حول موضوعات دیتابیس.
- **Focus:** Extended discussions beyond core lectures.
- **Notes:** *(later)*

---



### 17 — Archived Lectures

- **وضعیت:** `[ ]`
- **خلاصه:** لکتچرهای آرشیو / قدیمی‌تر.
- **Focus:** Archived material for reference.
- **Notes:** *(later)*

---



## Legend


| Mark  | Meaning     |
| ----- | ----------- |
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Done        |


Update **Progress** table when you change chapter status.