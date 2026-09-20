# MySQL Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (mysql client, SQL, admin, monitoring).  
**Audience:** Engineers who already know SQL basics and need MySQL/MariaDB-specific commands fast.  
**Notes:** Examples target MySQL 8.0+ unless marked. Most commands also work on MariaDB with small differences.

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [mysql client meta-commands](#2-mysql-client-meta-commands)
3. [Databases](#3-databases)
4. [Tables & columns](#4-tables--columns)
5. [Rows & data (DML)](#5-rows--data-dml)
6. [Querying, filters & aggregates](#6-querying-filters--aggregates)
7. [Dates, text, null & cast](#7-dates-text-null--cast)
8. [Indexes & constraints](#8-indexes--constraints)
9. [Users & privileges](#9-users--privileges)
10. [Import / export](#10-import--export)
11. [Sizes & disk usage](#11-sizes--disk-usage)
12. [Activity, slow queries & kill](#12-activity-slow-queries--kill)
13. [Backup & restore](#13-backup--restore)
14. [Config, service & logging](#14-config-service--logging)
15. [Explain, optimize & useful ops](#15-explain-optimize--useful-ops)
16. [Tools & resources](#16-tools--resources)

Placeholders use `__name__` style. Replace them before running.

---

## 1. Connect & flags

```bash
# Local (socket)
mysql -u root -p

# User / DB / host / port
mysql -u __user__ -p -h __host__ -P 3306 __db__

# Run one statement / SQL file
mysql -u __user__ -p -e 'SHOW DATABASES;'
mysql -u __user__ -p __db__ < script.sql

# Vertical output for wide rows
mysql -u __user__ -p -E -e 'SHOW FULL PROCESSLIST;'

# Batch / skip pager chrome
mysql -u __user__ -p -B -N -e 'SELECT id FROM t;'

# Defaults file (~/.my.cnf)
# [client]
# user=...
# password=...
# host=...
chmod 600 ~/.my.cnf
```

URI-style (MySQL Shell / some tools):

```text
mysql://__user__:__pass__@__host__:3306/__db__
```

---

## 2. mysql client meta-commands

Inside the `mysql>` prompt:

| Command | Meaning |
| --- | --- |
| `help` / `?` / `\h` | Help |
| `help contents` | Topic list |
| `help SELECT` | SQL help for a keyword |
| `quit` / `exit` / `\q` | Quit |
| `status` / `\s` | Connection status |
| `use __db__` / `\u __db__` | Switch database |
| `source file.sql` / `\. file.sql` | Run SQL file |
| `system ls` / `\! ls` | Shell command |
| `pager less` / `nopager` | Pipe output through pager |
| `tee out.log` / `notee` | Log session output |
| `warnings` / `\W` | Show warnings after statements |
| `nowarning` / `\w` | Disable auto-warnings |
| `prompt` | Customize prompt |
| `clear` / `\c` | Clear current input |
| `ego` / `\G` | Send query; vertical result |
| `go` / `\g` | Send query |

Useful prompt tip:

```sql
prompt mysql (\u@\h) [\d]>\_
```

---

## 3. Databases

```sql
SHOW DATABASES;
SELECT SCHEMA_NAME FROM information_schema.SCHEMATA;

CREATE DATABASE __db__
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;   -- MySQL 8 default-ish

DROP DATABASE IF EXISTS __db__;
ALTER DATABASE __db__ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE __db__;
SELECT DATABASE();

SHOW CREATE DATABASE __db__;
SELECT VERSION(), USER(), @@hostname, @@port;
```

Charset rule of thumb: prefer **`utf8mb4`** (full Unicode). Avoid legacy `utf8` (= `utf8mb3`).

---

## 4. Tables & columns

### List / describe

```sql
SHOW TABLES;
SHOW FULL TABLES WHERE Table_type = 'BASE TABLE';
SHOW TABLE STATUS LIKE '__table__';

DESCRIBE __table__;      -- or: DESC __table__;
SHOW COLUMNS FROM __table__;
SHOW CREATE TABLE __table__;

SELECT TABLE_SCHEMA, TABLE_NAME, ENGINE, TABLE_ROWS, CREATE_TIME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = '__db__'
ORDER BY TABLE_NAME;

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = '__db__' AND TABLE_NAME = '__table__'
ORDER BY ORDINAL_POSITION;
```

### Create / alter / drop

```sql
CREATE TABLE orders (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id  BIGINT UNSIGNED NOT NULL,
  total        DECIMAL(10,2) NOT NULL,
  status       VARCHAR(32) NOT NULL DEFAULT 'new',
  created_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                 ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_orders_customer (customer_id),
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Copy structure only
CREATE TABLE orders_backup LIKE orders;
-- Copy structure + data
CREATE TABLE orders_backup AS SELECT * FROM orders;

RENAME TABLE orders TO customer_orders;
ALTER TABLE orders RENAME TO customer_orders;

DROP TABLE IF EXISTS orders_backup;
TRUNCATE TABLE orders;   -- fast; resets AUTO_INCREMENT on InnoDB
```

### Columns

```sql
ALTER TABLE orders ADD COLUMN note TEXT NULL AFTER status;
ALTER TABLE orders CHANGE COLUMN total amount DECIMAL(12,2) NOT NULL;  -- rename+retype
ALTER TABLE orders MODIFY COLUMN status VARCHAR(64) NOT NULL DEFAULT 'new';
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new';
ALTER TABLE orders DROP COLUMN note;
```

### Views

```sql
CREATE OR REPLACE VIEW recent_orders AS
SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 30 DAY;

DROP VIEW IF EXISTS recent_orders;
```

MySQL has no native materialized views (use tables + jobs, or Flexviews / app logic).

---

## 5. Rows & data (DML)

```sql
INSERT INTO orders (customer_id, total)
VALUES (1, 49.90), (2, 12.00);

INSERT INTO archive (id, total)
SELECT id, total FROM orders WHERE created_at < NOW() - INTERVAL 1 YEAR;

-- Last insert id (session)
SELECT LAST_INSERT_ID();

UPDATE orders SET status = 'shipped' WHERE id = 42;

UPDATE orders o
JOIN order_totals t ON t.order_id = o.id
SET o.total = t.amount;

-- Upsert
INSERT INTO orders (id, total)
VALUES (1, 49.90)
ON DUPLICATE KEY UPDATE total = VALUES(total);
-- MySQL 8.0.20+: prefer alias form
INSERT INTO orders (id, total)
VALUES (1, 49.90) AS new
ON DUPLICATE KEY UPDATE total = new.total;

REPLACE INTO orders (id, total) VALUES (1, 49.90);  -- delete+insert if PK/UK hit

DELETE FROM orders WHERE created_at < NOW() - INTERVAL 2 YEAR;

-- Safe multi-table delete
DELETE o FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE c.active = 0;

-- Duplicates
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;

DELETE c1 FROM customers c1
INNER JOIN customers c2
WHERE c1.id > c2.id AND c1.email = c2.email;
```

Bulk random data:

```sql
INSERT INTO some_table (a_float_value)
SELECT RAND() * 100000
FROM (
  SELECT a.N + b.N * 10 + c.N * 100 AS n
  FROM
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) b,
    (SELECT 0 N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
     UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) c
) t;
-- Or use a numbers table / recursive CTE (8.0+)
```

---

## 6. Querying, filters & aggregates

```sql
SELECT * FROM cars;
SELECT make, model FROM cars;
SELECT make, model, propulsion_type AS engine_type FROM cars;

SELECT * FROM cars ORDER BY time_to_60_mph_s;
SELECT * FROM cars ORDER BY year DESC LIMIT 2 OFFSET 3;
-- Same: LIMIT 3, 2  (offset, count) — older style

SELECT DISTINCT propulsion_type FROM cars;

WHERE col > 2.1
WHERE col BETWEEN 1.9 AND 2.1
WHERE col IN ('Electric', 'Hybrid')
WHERE col LIKE '%ic%'            -- case depends on collation
WHERE col LIKE 'P%'
WHERE col REGEXP '^[A-Z]'        -- regex
WHERE col IS NULL / IS NOT NULL
WHERE a AND b / WHERE a OR b

SELECT COUNT(*), SUM(x), AVG(x), MIN(x), MAX(x) FROM cars;

SELECT propulsion_type, COUNT(*)
FROM cars
GROUP BY propulsion_type
HAVING AVG(time_to_60_mph_s) > 2;

SELECT c.name, o.name
FROM city c
JOIN country o ON c.country_id = o.id;
-- INNER | LEFT | RIGHT | CROSS  (FULL OUTER: emulate with UNION)

-- Window (8.0+)
SELECT created_at,
       SUM(total) OVER (ORDER BY created_at) AS running_total
FROM orders;

SELECT customer_id, GROUP_CONCAT(sku ORDER BY sku SEPARATOR ', ') AS skus
FROM order_items
GROUP BY customer_id;

-- JSON (5.7+/8.0)
SELECT payload->>'$.status' AS status
FROM events
WHERE payload->'$.user.id' = '42';
-- Or: JSON_EXTRACT(payload, '$.status')
```

Recursive series (8.0+):

```sql
WITH RECURSIVE days AS (
  SELECT DATE('2026-01-01') AS day
  UNION ALL
  SELECT day + INTERVAL 1 DAY FROM days WHERE day < '2026-01-31'
)
SELECT * FROM days;
```

---

## 7. Dates, text, null & cast

### Cast / convert

```sql
CAST(col AS UNSIGNED)
CAST(col AS DECIMAL(12,2))
CONVERT(col, CHAR)
col + 0                    -- numeric coercion hack (avoid in prod)
SELECT CAST('2023-12-31' AS DATE);
```

### Null helpers

```sql
IFNULL(col, 'default')
COALESCE(a, b, c)
NULLIF(last_month, 0)
IFNULL(NULLIF(col, ''), 'missing')
```

### Text

```sql
CONCAT('a', 'b')           -- NULL if any arg NULL (unless CONCAT_WS)
CONCAT_WS('-', a, b, c)    -- skips NULL; separator between non-null
LENGTH / CHAR_LENGTH
LOWER / UPPER
SUBSTRING(s, 1, 5)
REPLACE(s, 'SQL', 'Python')
TRIM / LTRIM / RTRIM
LEFT(s, n) / RIGHT(s, n)
```

Collation tip: `utf8mb4_0900_ai_ci` is accent/case insensitive; use `_bin` for binary compare.

### Dates

```sql
SELECT CURDATE(), CURTIME(), NOW(), UTC_TIMESTAMP();
SELECT DATE(created_at), TIME(created_at);
SELECT DATE_FORMAT(created_at, '%Y-%m-%d %H:%i');
SELECT EXTRACT(MONTH FROM '2023-12-31');
SELECT DATE_ADD(NOW(), INTERVAL 2 MONTH);
SELECT DATE_SUB(NOW(), INTERVAL 3 DAY);
SELECT DATEDIFF('2024-01-01', '2023-01-02');     -- days
SELECT TIMESTAMPDIFF(HOUR, start_ts, end_ts);
SELECT LAST_DAY(NOW());
```

Common types: `DATE`, `TIME`, `DATETIME`, `TIMESTAMP` (timezone-aware conversion via `time_zone`), `YEAR`. Prefer `DATETIME(6)` for app timestamps unless you need `TIMESTAMP` auto-convert.

```sql
SET time_zone = '+00:00';
SELECT @@global.time_zone, @@session.time_zone;
```

---

## 8. Indexes & constraints

```sql
-- Create
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE UNIQUE INDEX uq_customers_email ON customers (email);
CREATE INDEX idx_customers_email_lower ON customers ((LOWER(email)));  -- functional (8.0.13+)

-- Prefix index (long VARCHAR/TEXT)
CREATE INDEX idx_posts_title ON posts (title(100));

SHOW INDEX FROM orders;
SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX, NON_UNIQUE, INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = '__db__' AND TABLE_NAME = 'orders'
ORDER BY INDEX_NAME, SEQ_IN_INDEX;

DROP INDEX idx_orders_created_at ON orders;

-- Online DDL (algorithm/lock vary by version & change)
ALTER TABLE orders ADD INDEX idx_status (status), ALGORITHM=INPLACE, LOCK=NONE;

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers (id)
  ON DELETE CASCADE;

ALTER TABLE orders
  ADD CONSTRAINT chk_orders_total CHECK (total >= 0);   -- 8.0.16+ enforced

ALTER TABLE orders ADD PRIMARY KEY (id);
```

`EXPLAIN` + unused indexes: check `sys.schema_unused_indexes` (sys schema) on 5.7+/8.0.

---

## 9. Users & privileges

```sql
-- List
SELECT user, host FROM mysql.user;
SHOW GRANTS FOR CURRENT_USER;
SHOW GRANTS FOR '__user__'@'__host__';

-- Create (MySQL 8 auth plugin default: caching_sha2_password)
CREATE USER '__user__'@'%' IDENTIFIED BY '__password__';
CREATE USER '__user__'@'localhost' IDENTIFIED BY '__password__';

ALTER USER '__user__'@'%' IDENTIFIED BY '__new_password__';
RENAME USER '__old__'@'%' TO '__new__'@'%';
DROP USER IF EXISTS '__user__'@'%';

-- Grants
GRANT ALL PRIVILEGES ON __db__.* TO '__user__'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE ON __db__.* TO '__user__'@'%';
GRANT SELECT ON __db__.orders TO '__user__'@'%';
GRANT EXECUTE ON PROCEDURE __db__.__proc__ TO '__user__'@'%';
GRANT PROCESS, REPLICATION CLIENT ON *.* TO 'monitor'@'%';

REVOKE INSERT ON __db__.* FROM '__user__'@'%';
FLUSH PRIVILEGES;   -- needed after direct mysql.* edits; not usually after GRANT

-- Roles (8.0+)
CREATE ROLE 'app_read';
GRANT SELECT ON __db__.* TO 'app_read';
GRANT 'app_read' TO '__user__'@'%';
SET DEFAULT ROLE 'app_read' TO '__user__'@'%';
SET ROLE 'app_read';
```

Hosts matter: `'user'@'localhost'` ≠ `'user'@'%'`.

---

## 10. Import / export

```bash
# Dump → SQL
mysqldump -u __user__ -p __db__ > __db__.sql
mysqldump -u __user__ -p __db__ __table__ > __table__.sql
mysqldump -u __user__ -p --all-databases > all.sql
mysqldump -u __user__ -p --no-data __db__ > schema.sql
mysqldump -u __user__ -p --no-create-info __db__ > data.sql

# Restore
mysql -u __user__ -p __db__ < __db__.sql

# CSV via client
mysql -u __user__ -p __db__ -e "SELECT * FROM orders" | sed 's/\t/,/g' > orders.csv
```

Server-side (needs `FILE` privilege + secure_file_priv):

```sql
SHOW VARIABLES LIKE 'secure_file_priv';

SELECT * FROM orders
INTO OUTFILE '/var/lib/mysql-files/orders.csv'
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
LINES TERMINATED BY '\n';

LOAD DATA INFILE '/var/lib/mysql-files/orders.csv'
INTO TABLE orders
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
IGNORE 1 LINES;

-- Client-local file (no server FILE priv)
LOAD DATA LOCAL INFILE '/path/orders.csv'
INTO TABLE orders
FIELDS TERMINATED BY ',' ENCLOSED BY '"'
IGNORE 1 LINES;
```

Enable local infile when needed:

```bash
mysql --local-infile=1 -u __user__ -p __db__
```

---

## 11. Sizes & disk usage

```sql
SELECT table_schema AS db,
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.TABLES
GROUP BY table_schema
ORDER BY size_mb DESC;

SELECT table_name,
       ROUND(data_length / 1024 / 1024, 2) AS data_mb,
       ROUND(index_length / 1024 / 1024, 2) AS index_mb,
       ROUND((data_length + index_length) / 1024 / 1024, 2) AS total_mb,
       table_rows
FROM information_schema.TABLES
WHERE table_schema = '__db__'
ORDER BY (data_length + index_length) DESC;

SHOW TABLE STATUS FROM __db__;
```

---

## 12. Activity, slow queries & kill

```sql
SHOW FULL PROCESSLIST;
SHOW PROCESSLIST;

SELECT id, user, host, db, command, time, state, info
FROM information_schema.PROCESSLIST
WHERE command <> 'Sleep'
ORDER BY time DESC;

-- Kill connection / query
KILL 12345;              -- connection id from PROCESSLIST
KILL QUERY 12345;        -- cancel statement only (keeps session)

-- InnoDB status snapshot
SHOW ENGINE INNODB STATUS\G

-- Current locks (8.0 Performance Schema)
SELECT * FROM performance_schema.data_locks\G
SELECT * FROM performance_schema.data_lock_waits\G

-- Metadata locks
SELECT * FROM performance_schema.metadata_locks;

-- Sys schema helpers (if installed)
SELECT * FROM sys.session\G
SELECT * FROM sys.innodb_lock_waits\G;
```

Slow query log:

```sql
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';
SET GLOBAL slow_query_log = ON;
SET GLOBAL long_query_time = 1;   -- seconds
```

Digest summary (Performance Schema):

```sql
SELECT SCHEMA_NAME, DIGEST_TEXT, COUNT_STAR, AVG_TIMER_WAIT/1e12 AS avg_sec
FROM performance_schema.events_statements_summary_by_digest
ORDER BY SUM_TIMER_WAIT DESC
LIMIT 20;
```

---

## 13. Backup & restore

```bash
# Logical
mysqldump -u root -p --single-transaction --routines --triggers --events __db__ > __db__.sql
mysqldump -u root -p --all-databases --single-transaction > all.sql

# Parallel / physical (install separately)
# mysqlpump, mydumper/myloader, Percona XtraBackup, MariaDB backup

mysql -u root -p __db__ < __db__.sql
```

`--single-transaction`: consistent InnoDB dump without global read lock (still lock non-InnoDB).

Point-in-time: enable binary logs + `mysqlbinlog`.

```sql
SHOW BINARY LOGS;
SHOW MASTER STATUS;          -- older name
SHOW BINARY LOG STATUS;      -- MySQL 8.4+
```

---

## 14. Config, service & logging

```bash
# Service
sudo systemctl start|stop|restart mysqld
# or: mysql / mariadb service name depending on distro

# Find options file / datadir
mysql -e "SHOW VARIABLES LIKE 'datadir';"
mysql -e "SHOW VARIABLES LIKE 'basedir';"
```

Key variables:

```sql
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'sql_mode';
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'log_error';
SHOW VARIABLES LIKE 'general_log%';
SHOW VARIABLES LIKE 'binlog_format';

SET GLOBAL max_connections = 300;
SET SESSION sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES';
```

Config files (typical): `/etc/my.cnf`, `/etc/mysql/my.cnf`, `~/.my.cnf`.

Remote access: bind-address in config + user `@'%'` + firewall. Prefer TLS/`REQUIRE SSL` in production.

Error log / general log:

```sql
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/tmp/general.log';
```

---

## 15. Explain, optimize & useful ops

```sql
EXPLAIN SELECT * FROM orders WHERE customer_id = 1;
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 1;   -- 8.0.18+
EXPLAIN FORMAT=JSON SELECT ...;

ANALYZE TABLE orders;          -- refresh optimizer stats
OPTIMIZE TABLE orders;         -- reclaim space / rebuild (locks vary)
CHECK TABLE orders;
REPAIR TABLE orders;           -- MyISAM-oriented; limited for InnoDB

SHOW CREATE TABLE orders\G
SHOW INDEX FROM orders;
SHOW TABLE STATUS LIKE 'orders'\G
```

Handy session settings:

```sql
SELECT @@autocommit;
SET autocommit = 0;
START TRANSACTION;
COMMIT;   -- or ROLLBACK;

SHOW SESSION STATUS LIKE 'Handler%';
SHOW GLOBAL STATUS LIKE 'Threads_connected';
SHOW GLOBAL STATUS LIKE 'Questions';
SHOW GLOBAL STATUS LIKE 'Slow_queries';
```

Ops reminders (short):

- **Engine:** use **InnoDB** (transactions, FK, crash-safe). Avoid MyISAM for new work.
- **Buffer pool:** main cache — size it for working set (`innodb_buffer_pool_size`).
- **MVCC-ish:** InnoDB undo + isolation levels; long transactions bloat history list.
- **DDL:** many `ALTER`s are online in 8.0, but always check lock/`ALGORITHM`.
- **Connections:** use pooling (ProxySQL, app pool); watch `max_connections` + `Threads_running`.
- **sql_mode:** keep strict modes on; don’t “fix” bad data silently.
- **Replicas:** binlog + GTID; `READ ONLY` / `super_read_only` on replicas.

Isolation:

```sql
SELECT @@transaction_isolation;
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

---

## 16. Tools & resources

**Tools**

- `mysql` / `mysqlsh` (MySQL Shell — JS/Python/SQL modes)
- `mysqldump` / `mysqlpump` / `mydumper`
- Percona Toolkit (`pt-query-digest`, `pt-online-schema-change`)
- `mytop` / `innotop` — live activity
- GUIs: MySQL Workbench, DBeaver, TablePlus

**Docs & learning**

- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- [InnoDB lock / transaction docs](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-transaction-model.html)
- [Performance Schema](https://dev.mysql.com/doc/refman/8.0/en/performance-schema.html)
- [sys schema](https://dev.mysql.com/doc/refman/8.0/en/sys-schema.html)

---

## Quick mental map

```
mysql  →  USE / SHOW / DESC / \G / source / status
SQL    →  CREATE / ALTER / INSERT / UPDATE / DELETE / SELECT
Admin  →  PROCESSLIST, KILL, sizes, ANALYZE, EXPLAIN
Ops    →  mysqldump, GRANTs, my.cnf, slow log, binlog
```

---

## Postgres ↔ MySQL quick diffs

| Task | PostgreSQL | MySQL |
| --- | --- | --- |
| List DBs | `\l` | `SHOW DATABASES;` |
| Switch DB | `\c db` | `USE db;` |
| Describe table | `\d table` | `DESC table;` / `SHOW CREATE TABLE` |
| Upsert | `ON CONFLICT` | `ON DUPLICATE KEY UPDATE` |
| String agg | `string_agg` | `GROUP_CONCAT` |
| Client CSV | `\copy` | `LOAD DATA` / outfile / client export |
| Dump | `pg_dump` | `mysqldump` |
| Kill session | `pg_terminate_backend` | `KILL id` |
| Auto ID | `serial` / `identity` / `generated` | `AUTO_INCREMENT` |
| Schema | real schemas inside DB | DB ≈ schema (usual mental model) |

---

*Compiled for personal study use. Prefer InnoDB + utf8mb4. Check your major version for `EXPLAIN ANALYZE`, roles, CHECK constraints, and renamed replication statements.*
