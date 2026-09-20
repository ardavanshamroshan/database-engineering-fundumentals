# SQLite Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (sqlite3 CLI, SQL, pragmas, admin).  
**Audience:** Engineers who already know SQL basics and need SQLite-specific commands fast.  
**Notes:** Examples target SQLite 3.35+ where noted (e.g. `RETURNING`, `STRICT`). One file = one database.

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [sqlite3 meta-commands (dot commands)](#2-sqlite3-meta-commands-dot-commands)
3. [Databases & attach](#3-databases--attach)
4. [Tables & columns](#4-tables--columns)
5. [Rows & data (DML)](#5-rows--data-dml)
6. [Querying, filters & aggregates](#6-querying-filters--aggregates)
7. [Dates, text, null & cast](#7-dates-text-null--cast)
8. [Indexes & constraints](#8-indexes--constraints)
9. [Users & “privileges”](#9-users--privileges)
10. [Import / export](#10-import--export)
11. [Sizes & disk usage](#11-sizes--disk-usage)
12. [Activity, locks & busy handling](#12-activity-locks--busy-handling)
13. [Backup & restore](#13-backup--restore)
14. [Config & pragmas](#14-config--pragmas)
15. [Explain, vacuum & useful ops](#15-explain-vacuum--useful-ops)
16. [Tools & resources](#16-tools--resources)

Placeholders use `__name__` style. Replace them before running.

---

## 1. Connect & flags

```bash
# Open / create a DB file
sqlite3 __db__.sqlite

# In-memory DB (gone when process exits)
sqlite3 :memory:

# Read-only
sqlite3 -readonly __db__.sqlite

# Run SQL then exit
sqlite3 __db__.sqlite 'SELECT COUNT(*) FROM orders;'
sqlite3 __db__.sqlite < script.sql

# Useful startup flags
sqlite3 -header -column __db__.sqlite
sqlite3 -csv __db__.sqlite 'SELECT * FROM orders;'
sqlite3 -json __db__.sqlite 'SELECT * FROM orders LIMIT 5;'
sqlite3 -bail __db__.sqlite < script.sql   # stop on first error
sqlite3 -echo __db__.sqlite < script.sql
```

Common extensions: `.sqlite`, `.db`, `.sqlite3` — convention only.

Init file (`~/.sqliterc`) example:

```text
.headers on
.mode column
.timer on
```

---

## 2. sqlite3 meta-commands (dot commands)

Dot commands are **CLI-only** (not SQL).

| Command | Meaning |
| --- | --- |
| `.help` | List meta-commands |
| `.quit` / `.exit` | Quit |
| `.open __file__` | Open another DB file |
| `.databases` | List attached DBs |
| `.tables` / `.tables %ord%` | List tables (LIKE pattern) |
| `.schema` / `.schema __table__` | Show CREATE statements |
| `.indexes __table__` | Indexes on table |
| `.fullschema` | Schema + sqlite_stat* |
| `.dump` / `.dump __table__` | SQL dump to stdout |
| `.mode column\|list\|csv\|json\|markdown\|html\|insert` | Output format |
| `.headers on\|off` | Show column names |
| `.separator ','` | Field separator (list/csv) |
| `.nullvalue 'NULL'` | How NULLs print |
| `.width 10 20 30` | Column widths (column mode) |
| `.timer on\|off` | Show wall-clock time |
| `.once FILE` / `.output FILE` | Redirect next / all output |
| `.output stdout` | Back to terminal |
| `.read FILE` | Execute SQL file |
| `.import FILE TABLE` | Import delimited file into table |
| `.backup FILE` / `.restore FILE` | Online backup API via CLI |
| `.clone FILE` | Copy DB to new file |
| `.show` | Current settings |
| `.version` | SQLite + CLI version |
| `.shell ls` / `.system ls` | Run shell command |
| `.print hello` | Print text |
| `.eqp on\|off\|full` | Auto EXPLAIN QUERY PLAN |
| `.expert` | Index Advisor (if built with expert) |

Pretty session defaults:

```text
.headers on
.mode column
.timer on
```

---

## 3. Databases & attach

SQLite has **no server**. A database is a file (plus optional WAL/SHM sidecars).

```sql
-- Main DB is whatever you opened with sqlite3
PRAGMA database_list;

-- Attach another file as a named schema
ATTACH DATABASE '__other__.sqlite' AS other;
SELECT * FROM other.orders;
DETACH DATABASE other;

-- Temp schema always exists
CREATE TEMP TABLE scratch (id INTEGER);
```

Schemas you’ll see: `main`, `temp`, plus any `ATTACH` names.

```sql
-- Create empty DB = just open a new path and CREATE TABLE
-- Delete DB = delete the file(s): __db__.sqlite, __db__.sqlite-wal, __db__.sqlite-shm
```

Version / compile options:

```sql
SELECT sqlite_version();
PRAGMA compile_options;
```

---

## 4. Tables & columns

### List / describe

```sql
.tables
.schema orders

SELECT name, type, sql
FROM sqlite_master
WHERE type IN ('table', 'view', 'index', 'trigger')
  AND name NOT LIKE 'sqlite_%'
ORDER BY type, name;

PRAGMA table_info('orders');          -- cid, name, type, notnull, dflt_value, pk
PRAGMA table_xinfo('orders');         -- includes hidden/generated cols
PRAGMA foreign_key_list('orders');
```

### Create / alter / drop

```sql
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,   -- alias for rowid (autoincrement-ish)
  customer_id INTEGER NOT NULL,
  total       REAL NOT NULL,
  status      TEXT NOT NULL DEFAULT 'new',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Strict typing (3.37+)
CREATE TABLE orders_strict (
  id    INTEGER PRIMARY KEY,
  total REAL NOT NULL,
  note  TEXT
) STRICT;

-- Copy
CREATE TABLE orders_backup AS SELECT * FROM orders;
CREATE TABLE orders_empty AS SELECT * FROM orders WHERE 0;

DROP TABLE IF EXISTS orders_backup;
```

`ALTER TABLE` is limited vs Postgres/MySQL:

```sql
ALTER TABLE orders RENAME TO customer_orders;
ALTER TABLE orders RENAME COLUMN total TO amount;   -- 3.25+
ALTER TABLE orders ADD COLUMN note TEXT;
-- No DROP COLUMN until 3.35+
ALTER TABLE orders DROP COLUMN note;                -- 3.35+
```

Complex reshape → recreate table + copy + rename (classic SQLite pattern), or use `.dump` / migration tools.

### Views / generated columns

```sql
CREATE VIEW recent_orders AS
SELECT * FROM orders WHERE created_at >= datetime('now', '-30 days');

CREATE TABLE t (
  cents INTEGER,
  dollars GENERATED ALWAYS AS (cents / 100.0) STORED  -- or VIRTUAL
);
```

No native materialized views — use a table + refresh SQL.

---

## 5. Rows & data (DML)

```sql
INSERT INTO orders (customer_id, total)
VALUES (1, 49.90), (2, 12.00);

INSERT INTO archive (id, total)
SELECT id, total FROM orders WHERE created_at < datetime('now', '-1 year');

-- Last rowid inserted in this connection
SELECT last_insert_rowid();

UPDATE orders SET status = 'shipped' WHERE id = 42;

UPDATE orders
SET total = (
  SELECT amount FROM order_totals WHERE order_id = orders.id
)
WHERE id IN (SELECT order_id FROM order_totals);

-- Upsert (3.24+)
INSERT INTO orders (id, total)
VALUES (1, 49.90)
ON CONFLICT (id) DO UPDATE SET total = excluded.total;

INSERT INTO orders (id, total)
VALUES (1, 49.90)
ON CONFLICT DO NOTHING;

DELETE FROM orders WHERE created_at < datetime('now', '-2 years');

-- RETURNING (3.35+)
INSERT INTO orders (customer_id, total)
VALUES (1, 10.0)
RETURNING id, created_at;

-- Duplicates
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;

DELETE FROM customers
WHERE rowid NOT IN (
  SELECT MIN(rowid) FROM customers GROUP BY email
);
```

`INTEGER PRIMARY KEY` without `AUTOINCREMENT` reuses deleted ids.  
`INTEGER PRIMARY KEY AUTOINCREMENT` never reuses (uses `sqlite_sequence`).

```sql
CREATE TABLE t (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);
```

---

## 6. Querying, filters & aggregates

```sql
SELECT * FROM cars;
SELECT make, model FROM cars;
SELECT make, model, propulsion_type AS engine_type FROM cars;

SELECT * FROM cars ORDER BY time_to_60_mph_s;
SELECT * FROM cars ORDER BY year DESC LIMIT 2 OFFSET 3;
SELECT DISTINCT propulsion_type FROM cars;

WHERE col > 2.1
WHERE col BETWEEN 1.9 AND 2.1
WHERE col IN ('Electric', 'Hybrid')
WHERE col LIKE '%ic%'          -- ASCIIish; GLOB for Unix globs
WHERE col GLOB 'P*'
WHERE col REGEXP '^[A-Z]'      -- only if regexp extension loaded
WHERE col IS NULL / IS NOT NULL
WHERE a AND b / WHERE a OR b

SELECT COUNT(*), SUM(x), AVG(x), MIN(x), MAX(x) FROM cars;

SELECT propulsion_type, COUNT(*)
FROM cars
GROUP BY propulsion_type
HAVING AVG(time_to_60_mph_s) > 2;

SELECT c.name, o.name
FROM city AS c
JOIN country AS o ON c.country_id = o.id;
-- INNER | LEFT | CROSS  (RIGHT/FULL via rewrite or newer versions)

-- Window functions (3.25+)
SELECT created_at,
       SUM(total) OVER (ORDER BY created_at) AS running_total
FROM orders;

SELECT customer_id, group_concat(sku, ', ') AS skus
FROM order_items
GROUP BY customer_id;

-- JSON1 (usually built-in)
SELECT json_extract(payload, '$.status') AS status
FROM events
WHERE json_extract(payload, '$.user.id') = '42';
-- Operators (3.38+): payload -> '$.status' , ->>
```

Recursive series:

```sql
WITH RECURSIVE days(day) AS (
  SELECT date('2026-01-01')
  UNION ALL
  SELECT date(day, '+1 day') FROM days WHERE day < date('2026-01-31')
)
SELECT * FROM days;
```

---

## 7. Dates, text, null & cast

### Types & affinity

Declared types are **affinities**, not rigid (unless `STRICT`):  
`NULL`, `INTEGER`, `REAL`, `TEXT`, `BLOB`.

```sql
CAST(col AS INTEGER)
CAST(col AS REAL)
CAST(col AS TEXT)
CAST(col AS BLOB)
typeof(col)                -- runtime type of a value
```

### Null helpers

```sql
IFNULL(col, 'default')
COALESCE(a, b, c)
NULLIF(a, b)
```

### Text

```sql
'a' || 'b'
printf('%s-%s', a, b)      -- or format() in newer builds
length(s)
lower(s) / upper(s)
substr(s, 1, 5)
replace(s, 'SQL', 'Python')
trim(s)
instr(s, 'x')
```

### Dates

Stored usually as `TEXT` (ISO8601), `REAL` (Julian day), or `INTEGER` (Unix time). Prefer ISO `TEXT`.

```sql
SELECT date('now');
SELECT datetime('now');
SELECT datetime('now', 'localtime');
SELECT date('now', '+2 months');
SELECT date('now', '-3 days');
SELECT strftime('%Y-%m-%d %H:%M', 'now');
SELECT julianday('2024-01-01') - julianday('2023-01-02');
SELECT unixepoch('now');                    -- 3.38+
SELECT datetime(1700000000, 'unixepoch');
```

Modifiers: `'+1 day'`, `'-1 month'`, `'start of month'`, `'weekday 0'`, `'utc'`, `'localtime'`.

---

## 8. Indexes & constraints

```sql
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE UNIQUE INDEX uq_customers_email ON customers (email);
CREATE INDEX idx_customers_email_lower ON customers (LOWER(email));  -- expression index

.indexes orders
PRAGMA index_list('orders');
PRAGMA index_info('idx_orders_created_at');

DROP INDEX IF EXISTS idx_orders_created_at;

-- Partial index
CREATE INDEX idx_open_orders ON orders (created_at) WHERE status = 'open';
```

Constraints:

```sql
CREATE TABLE orders (
  id          INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  total       REAL NOT NULL CHECK (total >= 0),
  email       TEXT UNIQUE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- FKs are OFF by default per connection — turn on!
PRAGMA foreign_keys = ON;
```

Put `PRAGMA foreign_keys = ON;` in `~/.sqliterc` or every connection.

---

## 9. Users & “privileges”

SQLite has **no users/roles/GRANT** inside the engine.

Access control = **OS file permissions** (+ app-level auth if any).

```bash
chmod 600 __db__.sqlite
chown appuser:appuser __db__.sqlite
```

Optional: encrypt with **SQLCipher** (third-party), or put the file on encrypted disk.

For multi-app access: one writer at a time is safest; use WAL mode for concurrent readers + one writer.

---

## 10. Import / export

```text
-- CLI CSV export
.headers on
.mode csv
.once orders.csv
SELECT * FROM orders;

-- CLI CSV import (table must exist; column order = file order)
.mode csv
.import orders.csv orders

-- Skip header row (3.32+ .import options vary; common pattern:)
.import --skip 1 orders.csv orders
```

SQL dump:

```text
.output dump.sql
.dump
.output stdout
```

```bash
sqlite3 __db__.sqlite .dump > dump.sql
sqlite3 __new__.sqlite < dump.sql
```

Load extension (if enabled):

```sql
SELECT load_extension('mod_spatialite');
```

---

## 11. Sizes & disk usage

```bash
ls -lh __db__.sqlite __db__.sqlite-wal __db__.sqlite-shm 2>/dev/null
```

```sql
PRAGMA page_count;
PRAGMA page_size;
PRAGMA freelist_count;

-- Approx DB size
SELECT (page_count - freelist_count) * page_size AS used_bytes,
       page_count * page_size AS file_bytes
FROM pragma_page_count(), pragma_page_size(), pragma_freelist_count();

-- Table/index sizes via dbstat (if available)
SELECT name, SUM(pgsize) AS size
FROM dbstat
GROUP BY name
ORDER BY size DESC;
```

`sqlite_master` has no byte sizes; use file size + `dbstat` / `sqlite3_analyzer`.

---

## 12. Activity, locks & busy handling

No `PROCESSLIST`. Concurrency = file locks.

```sql
PRAGMA journal_mode;          -- delete | wal | ...
PRAGMA locking_mode;          -- normal | exclusive
PRAGMA busy_timeout;          -- ms
PRAGMA busy_timeout = 5000;   -- wait up to 5s on lock

PRAGMA lock_status;           -- if compiled in / debug builds
```

Busy errors:

```text
SQL error: database is locked
```

Fixes:

- `PRAGMA busy_timeout = 5000;`
- Enable **WAL**: `PRAGMA journal_mode = WAL;`
- Short transactions; avoid long `BEGIN` while holding write lock
- Don’t share one connection across threads without care (use SQLite serialized mode / pool)

WAL files:

```text
__db__.sqlite       -- main
__db__.sqlite-wal   -- write-ahead log
__db__.sqlite-shm   -- shared memory index
```

Checkpoint:

```sql
PRAGMA wal_checkpoint(TRUNCATE);
```

---

## 13. Backup & restore

```text
-- Online-ish copy via CLI
.backup main backup.sqlite
.restore main backup.sqlite

.clone backup.sqlite
```

```bash
# Consistent copy while idle (or after checkpoint)
sqlite3 __db__.sqlite "VACUUM INTO 'backup.sqlite';"   # 3.27+

# Cold copy (stop writers first if not using backup API)
cp __db__.sqlite backup.sqlite

# Dump / restore
sqlite3 __db__.sqlite .dump > dump.sql
sqlite3 restore.sqlite < dump.sql
```

Prefer `.backup` / Backup API / `VACUUM INTO` over copying a live file mid-write (corruption risk without WAL care).

---

## 14. Config & pragmas

Pragmas are SQLite’s “config”. Many are **per-connection**.

```sql
-- Safety / durability
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;     -- FULL = safer/slower; OFF = dangerous
PRAGMA temp_store = MEMORY;
PRAGMA mmap_size = 30000000000;
PRAGMA cache_size = -64000;      -- negative = KB of cache

-- Integrity
PRAGMA quick_check;
PRAGMA integrity_check;
PRAGMA foreign_key_check;
PRAGMA foreign_key_check('orders');

-- Schema / info
PRAGMA encoding;                 -- UTF-8 typical
PRAGMA schema_version;
PRAGMA user_version;             -- app-defined int (migrations)
PRAGMA user_version = 3;

-- Query planner helpers
PRAGMA optimize;
ANALYZE;
```

Recommended baseline for apps:

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
PRAGMA synchronous = NORMAL;
```

---

## 15. Explain, vacuum & useful ops

```sql
EXPLAIN QUERY PLAN
SELECT * FROM orders WHERE customer_id = 1;

EXPLAIN
SELECT * FROM orders WHERE customer_id = 1;

ANALYZE;
ANALYZE orders;
PRAGMA optimize;

VACUUM;                          -- rebuild; reclaim freelist; exclusive
VACUUM INTO 'clean.sqlite';      -- 3.27+: compact copy
PRAGMA incremental_vacuum;       -- if auto_vacuum=incremental
PRAGMA auto_vacuum;              -- none | full | incremental
```

Triggers / upsert helpers:

```sql
CREATE TRIGGER orders_touch AFTER UPDATE ON orders
BEGIN
  UPDATE orders SET created_at = created_at WHERE id = NEW.id;  -- example stub
END;
```

Transactions:

```sql
BEGIN;                 -- deferred
BEGIN IMMEDIATE;       -- acquire write lock now
BEGIN EXCLUSIVE;
COMMIT;
ROLLBACK;
SAVEPOINT sp1;
RELEASE sp1;
ROLLBACK TO sp1;
```

Ops reminders (short):

- **One writer** at a time; many readers OK in WAL mode.
- **Always** `PRAGMA foreign_keys = ON` per connection.
- Store timestamps as ISO **TEXT** unless you have a reason not to.
- Use `STRICT` tables when you want real type enforcement.
- Keep transactions short; long writes block other writers.
- Ship migrations via `PRAGMA user_version` + schema scripts.
- For mobile/embedded: WAL + busy_timeout + careful multi-thread access.

---

## 16. Tools & resources

**Tools**

- `sqlite3` — official CLI  
- [DB Browser for SQLite](https://sqlitebrowser.org/) — GUI  
- `sqlite3_analyzer` — space analysis  
- Litestream — continuous streaming backup for SQLite files  
- ORMs: SQLAlchemy, Prisma, Room, Diesel, etc.

**Docs**

- [SQLite docs](https://www.sqlite.org/docs.html)  
- [Language reference](https://www.sqlite.org/lang.html)  
- [PRAGMA reference](https://www.sqlite.org/pragma.html)  
- [JSON1](https://www.sqlite.org/json1.html)  
- [STRICT tables](https://www.sqlite.org/stricttables.html)

---

## Quick mental map

```
sqlite3 →  .tables .schema .mode .import .dump .backup
SQL     →  CREATE / INSERT / UPDATE / DELETE / SELECT / UPSERT
Admin   →  PRAGMA, ANALYZE, VACUUM, WAL checkpoint
Ops     →  file permissions, backup API, user_version migrations
```

---

## Postgres / MySQL ↔ SQLite quick diffs

| Task | PostgreSQL | MySQL | SQLite |
| --- | --- | --- | --- |
| Server | Yes | Yes | No (library + file) |
| List tables | `\dt` | `SHOW TABLES` | `.tables` / `sqlite_master` |
| Describe | `\d t` | `DESC t` | `PRAGMA table_info('t')` |
| Upsert | `ON CONFLICT` | `ON DUPLICATE KEY` | `ON CONFLICT` |
| Users/GRANT | Yes | Yes | OS file perms only |
| Auto ID | `serial` / identity | `AUTO_INCREMENT` | `INTEGER PRIMARY KEY` |
| Dump | `pg_dump` | `mysqldump` | `.dump` / `.backup` |
| Config | `postgresql.conf` | `my.cnf` | `PRAGMA` (per connection) |
| FK default | On | On (InnoDB) | **Off** until pragma |

---

*Compiled for personal study use. Prefer WAL + foreign_keys=ON + busy_timeout for app databases. Confirm features against your SQLite version (`sqlite_version()`).*
