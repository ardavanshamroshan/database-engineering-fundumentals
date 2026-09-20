# PostgreSQL Cheatsheet

**Author:** Ardavan ShamRoshan  
**Scope:** Practical day-to-day reference (psql, SQL, admin, monitoring).  
**Audience:** Engineers who already know SQL basics and need Postgres-specific commands fast.

---

## Table of contents

1. [Connect & flags](#1-connect--flags)
2. [psql meta-commands](#2-psql-meta-commands)
3. [Databases](#3-databases)
4. [Schemas, tables & columns](#4-schemas-tables--columns)
5. [Rows & data (DML)](#5-rows--data-dml)
6. [Querying, filters & aggregates](#6-querying-filters--aggregates)
7. [Dates, text, null & cast](#7-dates-text-null--cast)
8. [Indexes & constraints](#8-indexes--constraints)
9. [Users, roles & privileges](#9-users-roles--privileges)
10. [Import / export (COPY)](#10-import--export-copy)
11. [Sizes & disk usage](#11-sizes--disk-usage)
12. [Activity, slow queries & kill](#12-activity-slow-queries--kill)
13. [Backup & restore](#13-backup--restore)
14. [Config, service & logging](#14-config-service--logging)
15. [Explain, vacuum & useful ops](#15-explain-vacuum--useful-ops)
16. [Tools & resources](#16-tools--resources)

Placeholders use `__name__` style. Replace them before running.

---

## 1. Connect & flags

```bash
# Local as postgres OS user
sudo -u postgres psql

# User / DB / host / port
psql -U __user__ -d __db__ -h __host__ -p 5432

# Force password prompt
psql -W -U __user__ __db__

# List DBs then exit (handy when no default DB, e.g. RDS)
psql -U __user__ -l

# Run one command / SQL file
psql -U __user__ -d __db__ -c '\dt'
psql -U __user__ -d __db__ -f script.sql

# Echo hidden SQL behind \ commands (great for learning)
psql -E -U __user__ -d __db__

# HTML report of databases
psql -c '\l+' -H -q postgres > out.html
```

Connection URI:

```bash
psql "postgresql://__user__@__host__:5432/__db__"
```

Credentials file (`hostname:port:database:username:password`):

```bash
chmod 600 ~/.pgpass
```

Unix-like reverse search in psql (readline/editline):

```bash
echo 'bind "^R" em-inc-search-prev' > "$HOME/.editrc"
source "$HOME/.editrc"
```

Keyboard: `Ctrl+R` — reverse-i-search in shell history.

---

## 2. psql meta-commands

Most `\d*` commands accept `__schema__.__name__` and wildcards like `*.*`.

### Help & session

| Command | Meaning |
| --- | --- |
| `\?` | List psql commands |
| `\h` / `\h DELETE` | SQL syntax help |
| `\q` | Quit |
| `\c __db__` | Connect to database |
| `\conninfo` | Current connection info |
| `\encoding` | Show/set client encoding |
| `\password [USER]` | Change password (hashed safely) |
| `\timing [on\|off]` | Toggle query timing |
| `\x [on\|off\|auto]` | Expanded (pretty) output |
| `\! __bash__` | Run shell command (`\! ls`, `\! clear`) |

### Inspect objects

| Command | Meaning |
| --- | --- |
| `\l` / `\l+` | List databases (+ size/detail) |
| `\dn[S+]` | List schemas |
| `\dt` / `\dt+` | List tables (+ size) |
| `\dt *.*` | Tables in all schemas |
| `\dt __schema__.*` | Tables in one schema |
| `\d __table__` | Table definition (+ triggers) |
| `\d+ __table__` | More detail (desc, disk size) |
| `\di[S+]` | Indexes |
| `\dv[S+]` | Views |
| `\df[antw][S+]` | Functions |
| `\df+ __fn__` | Function source |
| `\ds[S+]` | Sequences |
| `\du[+]` / `\du __user__` | Roles |
| `\dp` | Table access privileges |
| `\dT+` | Data types |
| `\dx[+]` | Installed extensions |
| `\dy` | Events |
| `\des[+]` | Foreign servers |
| `\dE[S+]` / `\det[+]` | Foreign tables |
| `\deu[+]` | User mappings |
| `\dd[S]` | Object descriptions |

`S` = include system objects · `+` = extra detail.

### Query buffer & I/O

| Command | Meaning |
| --- | --- |
| `\e [FILE]` | Edit query buffer |
| `\p` | Print buffer |
| `\r` | Reset buffer |
| `\s [FILE]` | History |
| `\w FILE` | Write buffer to file |
| `\i FILE` | Execute SQL file |
| `\o [FILE]` | Send results to file |
| `\copy ...` | Client-side COPY (no superuser needed) |

---

## 3. Databases

```sql
-- List
\l
SELECT datname FROM pg_database WHERE datistemplate = false;

-- Current
SELECT current_database();

-- Create / drop / rename
CREATE DATABASE __db__ WITH OWNER __user__ ENCODING 'UTF8' TEMPLATE template0;
DROP DATABASE IF EXISTS __db__;
ALTER DATABASE __old__ RENAME TO __new__;

-- Connect
\c __db__

-- Version / who am I
SELECT version(), current_user, inet_server_addr();
SHOW SERVER_VERSION;
```

Cluster defaults after `initdb`: `template0`, `template1` (clone source), `postgres`.

---

## 4. Schemas, tables & columns

### Schemas

```sql
\dn
CREATE SCHEMA IF NOT EXISTS __schema__;
DROP SCHEMA IF EXISTS __schema__ CASCADE;
```

### Tables

```sql
-- List
\dt
SELECT table_schema, table_name
FROM information_schema.tables
ORDER BY 1, 2;

-- Describe
\d __table__
\d+ __table__

SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = '__table__'
ORDER BY ordinal_position;

-- Create
CREATE TABLE orders (
  id          bigserial PRIMARY KEY,
  customer_id bigint NOT NULL,
  total       numeric(10,2) NOT NULL,
  status      text NOT NULL DEFAULT 'new',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- FK example
CREATE TABLE animal (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64),
  habitat_id INT REFERENCES habitat(id)
);

-- Copy structure + data
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- Rename / drop / empty
ALTER TABLE orders RENAME TO customer_orders;
DROP TABLE IF EXISTS orders_backup CASCADE;
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;
```

### Columns

```sql
ALTER TABLE orders ADD COLUMN note text;
ALTER TABLE orders RENAME COLUMN total TO amount;
ALTER TABLE orders ALTER COLUMN amount TYPE numeric(12,2) USING amount::numeric(12,2);
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new';
ALTER TABLE orders ALTER COLUMN status DROP DEFAULT;
ALTER TABLE orders DROP COLUMN note;
```

### Views

```sql
CREATE OR REPLACE VIEW recent_orders AS
SELECT * FROM orders WHERE created_at > now() - interval '30 days';

CREATE MATERIALIZED VIEW daily_totals AS
SELECT date_trunc('day', created_at) AS day, sum(total) AS total
FROM orders GROUP BY 1;

REFRESH MATERIALIZED VIEW CONCURRENTLY daily_totals;
```

DDL dump for one table:

```bash
pg_dump -t '__schema__.__table__' --schema-only __db__
```

---

## 5. Rows & data (DML)

```sql
-- Insert
INSERT INTO orders (customer_id, total)
VALUES (1, 49.90), (2, 12.00)
RETURNING id;

INSERT INTO archive (id, total)
SELECT id, total FROM orders WHERE created_at < now() - interval '1 year';

-- Update
UPDATE orders SET status = 'shipped' WHERE id = 42;

UPDATE orders o
SET total = t.amount
FROM order_totals t
WHERE t.order_id = o.id;

-- Upsert
INSERT INTO orders (id, total)
VALUES (1, 49.90)
ON CONFLICT (id) DO UPDATE SET total = EXCLUDED.total;

INSERT INTO orders (id, total)
VALUES (1, 49.90)
ON CONFLICT DO NOTHING;

-- Delete
DELETE FROM orders WHERE created_at < now() - interval '2 years';

-- Duplicates
SELECT email, count(*) FROM customers GROUP BY email HAVING count(*) > 1;

DELETE FROM customers a
USING customers b
WHERE a.id > b.id AND a.email = b.email;
```

Random bulk data:

```sql
INSERT INTO some_table (a_float_value)
SELECT random() * 100000 FROM generate_series(1, 1000000);
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

-- Filters
WHERE col > 2.1
WHERE col BETWEEN 1.9 AND 2.1
WHERE col IN ('Electric', 'Hybrid')
WHERE col LIKE '%ic%'          -- case-sensitive
WHERE col ILIKE '%ic%'         -- case-insensitive
WHERE col IS NULL / IS NOT NULL
WHERE a AND b / WHERE a OR b

-- Aggregates
SELECT COUNT(*), SUM(x), AVG(x), MIN(x), MAX(x) FROM cars;

SELECT propulsion_type, COUNT(*)
FROM cars
GROUP BY propulsion_type
HAVING AVG(time_to_60_mph_s) > 2;

-- Join
SELECT c.name, o.name
FROM city c
JOIN country o ON c.country_id = o.id;
-- INNER | LEFT | RIGHT | FULL

-- Window / string_agg / JSON
SELECT created_at, sum(total) OVER (ORDER BY created_at) AS running_total FROM orders;

SELECT customer_id, string_agg(sku, ', ' ORDER BY sku)
FROM order_items GROUP BY customer_id;

SELECT payload->>'status'
FROM events
WHERE payload->'user'->>'id' = '42';

-- Series
SELECT generate_series('2026-01-01'::date, '2026-01-31'::date, '1 day') AS day;
```

Sampling (fast):

```sql
CREATE EXTENSION IF NOT EXISTS tsm_system_rows;
SELECT * FROM mytable TABLESAMPLE SYSTEM_ROWS(1);
```

---

## 7. Dates, text, null & cast

### Cast

```sql
CAST(col AS type)
col::type
'__table__'::regclass::oid
SELECT 25.5::integer;
SELECT CAST(col AS double precision);
```

### Null helpers

```sql
COALESCE(nickname, first_name, 'there')
NULLIF(last_month, 0)   -- avoid /0
```

### Text

```sql
'a' || 'b'                 -- NULL if any side NULL
CONCAT('a', 'b', NULL)     -- ignores NULL
LENGTH / LOWER / UPPER / INITCAP
SUBSTRING(s FROM 1 FOR 5)
REPLACE(s, 'SQL', 'Python')
```

### Dates

```sql
SELECT CURRENT_DATE, CURRENT_TIME, CURRENT_TIMESTAMP, now();
SELECT make_date(2021, 3, 25);
SELECT age(ts1, ts2);
SELECT to_char(created_at, 'YYYY-MM-DD HH24:MI');
SELECT EXTRACT(MONTH FROM '2023-12-31'::date);
SELECT DATE_PART('day', '2023-12-31'::date);
SELECT DATE_TRUNC('month', created_at);

SELECT '2023-10-31'::date + INTERVAL '2 months';
SELECT delivered_at::date - created_at::date AS days;
```

Types: `date`, `time`, `timestamp`, `timestamptz`, `interval`. Prefer `timestamptz` for real-world events.

---

## 8. Indexes & constraints

```sql
CREATE INDEX orders_created_at_idx ON orders (created_at);
CREATE INDEX CONCURRENTLY orders_status_idx ON orders (status);  -- no write lock
CREATE UNIQUE INDEX customers_email_idx ON customers (lower(email));

\di
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';
DROP INDEX CONCURRENTLY IF EXISTS orders_status_idx;

ALTER TABLE orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE orders
  ADD CONSTRAINT orders_customer_fk
  FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE;
ALTER TABLE orders ADD CONSTRAINT orders_total_positive CHECK (total >= 0);
```

All indexes for a schema (catalog join):

```sql
SELECT t.relname AS table_name, i.relname AS index_name, a.attname AS column_name
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (ix.indkey)
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = '__schema__'
ORDER BY 1, 2;
```

---

## 9. Users, roles & privileges

```sql
-- List
\du
SELECT rolname FROM pg_roles;

-- Create / alter / drop
CREATE ROLE __role__;
CREATE ROLE __role__ NOINHERIT LOGIN PASSWORD '__password__';
CREATE USER __user__ WITH PASSWORD '__password__';   -- USER ≈ ROLE + LOGIN
ALTER ROLE __user__ WITH PASSWORD '__password__';
DROP USER IF EXISTS __user__;

SET ROLE __role__;
GRANT __role2__ TO __role1__;   -- role1 can SET ROLE role2

-- Grants
GRANT CONNECT ON DATABASE __db__ TO __user__;
GRANT USAGE ON SCHEMA public TO __user__;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO __user__;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO __user__;
GRANT ALL PRIVILEGES ON DATABASE __db__ TO __user__;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO __user__;
```

Inspect grants:

```sql
SELECT table_catalog, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = '__user__'
ORDER BY table_name;

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = '__table__';

SELECT r.rolname, r.rolsuper, r.rolinherit, r.rolcreaterole, r.rolcreatedb,
       r.rolcanlogin, r.rolconnlimit, r.rolvaliduntil,
       ARRAY(
         SELECT b.rolname
         FROM pg_catalog.pg_auth_members m
         JOIN pg_catalog.pg_roles b ON m.roleid = b.oid
         WHERE m.member = r.oid
       ) AS memberof,
       r.rolreplication
FROM pg_catalog.pg_roles r
ORDER BY 1;
```

Note: roles **inherit** by default (unlike SQL standard). Use `NOINHERIT` on login users if you want explicit `SET ROLE`.

---

## 10. Import / export (COPY)

Server-side `COPY` needs file access on the DB host. Client-side `\copy` runs through psql (works on RDS/etc.).

```sql
-- Server
COPY table_name (col1, col2)
FROM '/path/file.csv' WITH (FORMAT csv, HEADER true);

COPY (SELECT * FROM table_name) TO '/path/out.csv' WITH (FORMAT csv, HEADER true);

-- Client (psql)
\copy table FROM 'file.csv' CSV HEADER
\copy table(col1, col2) TO 'out.csv' CSV
\copy (SELECT * FROM table) TO 'out.csv' WITH CSV HEADER
```

On managed Postgres, prefer `\COPY` / `\copy`.

---

## 11. Sizes & disk usage

```sql
SELECT pg_size_pretty(pg_database_size('__db__'));
SELECT pg_size_pretty(pg_total_relation_size('__table__'));
SELECT pg_size_pretty(pg_relation_size('__table__'));      -- heap only
SELECT pg_size_pretty(pg_indexes_size('__table__'));

SELECT current_database() AS database,
       pg_size_pretty(pg_database_size(current_database())) AS db_size,
       schemaname AS schema_name,
       relname AS table_name,
       pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) AS total,
       pg_size_pretty(pg_relation_size(schemaname || '.' || relname)) AS table_only,
       pg_size_pretty(pg_indexes_size(schemaname || '.' || relname)) AS indexes
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname || '.' || relname) DESC;
```

---

## 12. Activity, slow queries & kill

```sql
-- Connections by DB
SELECT datname, numbackends FROM pg_stat_database;

-- Running queries on one DB
SELECT datname, application_name, pid, backend_start, query_start,
       state_change, state, query
FROM pg_stat_activity
WHERE datname = '__db__';

-- Slow (> 1s), non-idle
SELECT pid,
       now() - query_start AS duration,
       state,
       wait_event_type,
       wait_event,
       query
FROM pg_stat_activity
WHERE state <> 'idle'
  AND query_start IS NOT NULL
  AND now() - query_start > interval '1 second'
ORDER BY duration DESC;

-- Top 50 by mean time (needs pg_stat_statements)
SELECT calls AS num_calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms,
       rows,
       query
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Cancel vs kill
SELECT pg_cancel_backend(12345);      -- soft cancel query
SELECT pg_terminate_backend(12345);   -- drop connection

-- Kill all other connections on current DB
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid();
```

Waiting column note: older docs used `waiting='t'`. Modern Postgres uses `wait_event` / `wait_event_type`.

Extensions:

```sql
SELECT * FROM pg_extension;
SELECT * FROM pg_available_extension_versions;
```

---

## 13. Backup & restore

```bash
# One database
pg_dump -U __user__ -d __db__ -f __db__.sql
pg_dump -d __db__ -Fc -f __db__.dump          # custom format
pg_dump -t '__schema__.__table__' --schema-only __db__

# Useful flags: -a data only | -s schema only | -c drop objects | -C create DB | -t table | -F c|d|t|p

# All databases (roles + globals + DBs)
pg_dumpall -U postgres > all.sql

# Restore
psql -U __user__ -d __db__ < __db__.sql
pg_restore -d __db__ -c __db__.dump
```

After major upgrade / cold stats: `ANALYZE VERBOSE;`

---

## 14. Config, service & logging

```bash
# Service (distro-dependent)
sudo service postgresql start|stop|restart
sudo systemctl restart postgresql

# Find config
psql -U postgres -c 'SHOW config_file'
```

Common settings (`postgresql.conf`):

```conf
listen_addresses = '*'
log_min_messages = warning
log_min_error_statement = error
log_min_duration_statement = 1000   # ms; -1 = off
log_line_prefix = '%t %u %d %a '
```

`pg_hba.conf` (remote example — tighten for production):

```conf
host  all  all  0.0.0.0/0  scram-sha-256
```

Session / DB scoped logging:

```sql
ALTER USER oltp_user SET log_min_duration_statement = '3s';
ALTER DATABASE analytics_db SET log_min_duration_statement = '60s';
SHOW statement_timeout;
SHOW ALL;
```

Client-only debug without flooding server log:

```bash
export PGOPTIONS='-c client_min_messages=DEBUG5'
psql -d postgres -c 'select 1'
```

---

## 15. Explain, vacuum & useful ops

```sql
EXPLAIN __query__;
EXPLAIN ANALYZE __query__;
EXPLAIN (ANALYZE, BUFFERS, FORMAT text) __query__;

ANALYZE [__table__];
ANALYZE VERBOSE;
VACUUM (ANALYZE) __table__;
VACUUM FULL __table__;   -- exclusive lock; rewrites table
```

Catalog lookups:

```sql
SELECT * FROM pg_proc WHERE proname = '__name__';
SELECT * FROM pg_views WHERE viewname = '__name__';
SELECT * FROM pg_indexes
WHERE tablename = '__table__' AND schemaname = '__schema__';
```

Ops reminders (short):

- **MVCC:** readers don’t block writers; UPDATE/DELETE leave dead tuples → need VACUUM.
- **Autovacuum:** reclaims space, refreshes stats, freezes XIDs; tune thresholds on large/hot tables.
- **WAL:** crash recovery + replication; checkpoints flush dirty buffers.
- **Replication:** streaming = whole cluster; logical = publications/subscriptions (tables; no DDL).
- **Connections:** prefer a pooler; keep `max_connections` modest.
- **work_mem:** set carefully — per sort/hash, per session (and parallel workers).

---

## 16. Tools & resources

**Tools**

- `ptop` / `pg_top` — top for Postgres  
- `pg_activity` — live activity monitor  
- `pg_dump` / `pg_restore` / `pg_upgrade`  
- GUIs: pgAdmin (easy `CREATE TABLE` reverse-engineer)

**Docs & learning**

- [PostgreSQL docs](https://www.postgresql.org/docs/current/)
- [Operations cheat sheet (PG wiki)](https://wiki.postgresql.org/wiki/Operations_cheat_sheet)
- [Postgres Weekly](https://postgresweekly.com/)
- [100 psql Tips](https://www.postgresqltutorial.com/)
- [PostgreSQL Exercises](https://pgexercises.com/)
- Community gists / quickrefs (Kartones, QuickRef, etc.) — useful supplements

---

## Quick mental map

```
psql  →  \l \c \dt \d+ \x \copy \du \dx
SQL   →  CREATE / ALTER / INSERT / UPDATE / DELETE / SELECT
Admin →  pg_stat_activity, sizes, VACUUM, ANALYZE, EXPLAIN
Ops   →  pg_dump, roles/grants, postgresql.conf, pg_hba.conf
```

---

*Compiled for personal study use. Commands verified against common PostgreSQL 12+ behaviour; check your major version for edge cases (`waiting` vs `wait_event`, `pg_stat_statements` column names, etc.).*
