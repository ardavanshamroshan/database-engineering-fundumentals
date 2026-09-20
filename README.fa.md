# مبانی مهندسی پایگاه‌داده (Database Engineering Fundamentals)

**مسیر یادگیری شخصی — فصل‌به‌فصل**

کتابچه اسکلت برای دنبال کردن کورس *Database Engineering Fundamentals*.
پیشرفت را علامت بزن. یادداشت فصل‌ها به‌مرور کامل می‌شود.

**سایت مستندات:** [ardavanshamroshan.github.io/database-engineering-fundumentals](https://ardavanshamroshan.github.io/database-engineering-fundumentals/)

**زبان:** فارسی · [English](README.md)

**چیت‌شیت‌ها:** [PostgreSQL](cheatsheets/postgresql.md) · [MySQL](cheatsheets/mysql.md) · [SQLite](cheatsheets/sqlite.md) · [Redis](cheatsheets/redis.md) · [MongoDB](cheatsheets/mongodb.md) · [Cassandra](cheatsheets/cassandra.md) · [ScyllaDB](cheatsheets/scylladb.md)

---

## پیشرفت

| وضعیت | تعداد |
| ----- | ----- |
| کل فصل‌ها | 17 |
| انجام‌شده | 0 |
| در حال انجام | — |

علامت‌ها: `[ ]` شروع‌نشده · `[~]` در حال انجام · `[x]` تمام‌شده

---

## نحوه استفاده

1. هر بار یک فصل بخوان (ترتیب زیر).
2. وقتی فصل تمام شد چک‌باکس را بزن.
3. یادداشت‌ها را زیر همان فصل اضافه کن.
4. اگر فقط موضوعات اصلی مهندسی را می‌خواهی، **01 / 15 / 16 / 17** را رد کن؛ برای کامل بودن در فهرست مانده‌اند.

**مسیر محلی مواد کورس:**

`/Users/ardavan/Documents/Coding/Tutorials/Database Engineering Fundumentals`

---

## فهرست مطالب

### بخش ۰ — متا

- [01 — به‌روزرسانی کورس](#01--بهروزرسانی-کورس)

### بخش ۱ — مبانی

- [02 — ACID](#02--acid)
- [03 — آشنایی با داخلیات پایگاه‌داده](#03--آشنایی-با-داخلیات-پایگاهداده)
- [04 — ایندکس‌گذاری](#04--ایندکسگذاری)
- [05 — B-Tree در برابر B+Tree](#05--b-tree-در-برابر-btree)

### بخش ۲ — مقیاس و توزیع

- [06 — پارتیشن‌بندی](#06--پارتیشنبندی)
- [07 — شاردینگ](#07--شاردینگ)
- [08 — کنترل همزمانی](#08--کنترل-همزمانی)
- [09 — Replication](#09--replication)

### بخش ۳ — سیستم‌ها و موتورها

- [10 — طراحی سیستم پایگاه‌داده](#10--طراحی-سیستم-پایگاهداده)
- [11 — موتورهای پایگاه‌داده](#11--موتورهای-پایگاهداده)
- [12 — Cursorها](#12--cursorها)

### بخش ۴ — امنیت

- [13 — امنیت پایگاه‌داده](#13--امنیت-پایگاهداده)
- [14 — رمزنگاری همومورفیک](#14--رمزنگاری-همومورفیک)

### بخش ۵ — اضافی

- [15 — پرسش و پاسخ](#15--پرسش-و-پاسخ)
- [16 — بحث‌های پایگاه‌داده](#16--بحثهای-پایگاهداده)
- [17 — لکتچرهای آرشیو](#17--لکتچرهای-آرشیو)

---

## فصل‌ها

### 01 — به‌روزرسانی کورس

- **وضعیت:** `[ ]`
- **خلاصه:** تغییرات و به‌روزرسانی مواد کورس.
- **تمرکز:** هم‌راستا ماندن با آخرین محتوای دوره.
- **یادداشت:** *(بعداً)*

---

### 02 — ACID

- **وضعیت:** `[ ]`
- **خلاصه:** چهار ویژگی تراکنش: Atomicity، Consistency، Isolation، Durability.
- **تمرکز:** تضمین‌های تراکنش در سیستم‌های رابطه‌ای.
- **یادداشت:**

ACID: **Atomicity**، **Consistency**، **Isolation**، **Durability**.

در سیستم‌های پایگاه‌داده رابطه‌ای، ACID یکپارچگی و سازگاری پایگاه‌داده را تضمین می‌کند.

#### تراکنش چیست؟ (What is a Transaction?)

تراکنش یعنی:

- گروهی از کوئری‌ها که به‌صورت یک واحد اجرا می‌شوند
- یک کار تجزیه‌ناپذیر (unit of work)
- مثال — انتقال پول بین حساب‌ها:
  - `SELECT`: بررسی کافی بودن موجودی حساب مبدأ
  - `UPDATE`: کم کردن موجودی حساب اول
  - `UPDATE`: زیاد کردن موجودی حساب دوم

```sql
START TRANSACTION;
SELECT * FROM account WHERE account_id = 1;
-- IF balance < 100 THEN ROLLBACK;
UPDATE account SET balance = balance - 100 WHERE account_id = 1;
UPDATE account SET balance = balance + 100 WHERE account_id = 2;
COMMIT;
```

اگر موجودی کافی نباشد → `ROLLBACK`؛ پایگاه‌داده در حالت قبلی می‌ماند.  
اگر کافی باشد → `COMMIT`؛ پایگاه‌داده به حالت جدید می‌رود.

برای امکان Undo، تغییرات اول در حافظه نوشته می‌شوند؛ فقط بعد از تأیید، به دیسک commit می‌شوند.

#### Atomicity (اتمی بودن)

تراکنش یک واحد اتمیک است که یا کامل موفق می‌شود یا کامل شکست می‌خورد. همه کوئری‌های داخل تراکنش باید با هم موفق یا با هم ناموفق باشند.

##### آزمایش: اثبات Atomicity با تراکنش ناتمام (PostgreSQL)

**هدف:** نشان بده تغییر commit‌نشده دائمی نمی‌شود. اگر session بدون `COMMIT` تمام شود، PostgreSQL تراکنش را rollback می‌کند — همه یا هیچ.

**انتظار ما**

| لحظه | `products.inventory` |
| ---- | -------------------- |
| قبل از `BEGIN` | `10` |
| داخل تراکنش باز، بعد از `UPDATE` | `0` (فقط در همین session دیده می‌شود) |
| بعد از قطع اتصال بدون `COMMIT` | دوباره `10` (rollback) |

**چرا این آزمایش Atomicity را ثابت می‌کند؟**

- داخل تراکنش موجودی را `0` می‌بینی.
- هرگز `COMMIT` نمی‌زنی.
- با خروج از `psql` تراکنش باز abort می‌شود → خودکار `ROLLBACK`.
- واحد کار کامل نشد → هیچ‌کدام از تغییراتش باقی نمی‌ماند.
- این همان Atomicity است: یا کامل موفق، یا طوری که انگار اصلاً اجرا نشده.

> **نکته:** اینجا غیرمستقیم Durability هم دیده می‌شود: فقط کار *commit‌شده* ماندگار است. کار commit‌نشده بعد از abort باید ناپدید شود.

**۱) آماده‌سازی**

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

**۲) شروع تراکنش و تغییر موجودی (بدون commit)**

```sql
BEGIN;

UPDATE products SET inventory = inventory - 10;

SELECT * FROM products;
-- در همین session موجودی 0 است
```

**۳) خروج بدون `COMMIT`**

کلاینت را ببند (مثلاً خروج از `psql`) در حالی که تراکنش هنوز باز است. PostgreSQL آن را abort می‌کند.

**۴) اتصال دوباره و بررسی**

```sql
\c app
SELECT * FROM products;
-- موجودی دوباره 10 است
```

**نتیجه:** داخل تراکنش `UPDATE` واقعی به نظر می‌رسید، ولی بعد از abort پایگاه‌داده به حالت معتبر قبلی برگشت. واحد اتمیک = همه یا هیچ.

**گام اختیاری بعدی:** همین مراحل را تکرار کن، فقط قبل از خروج `COMMIT;` بزن. بعد از reconnect موجودی باید `0` بماند.

#### Consistency (سازگاری)

تراکنش باید پایگاه‌داده را از یک حالت معتبر به حالت معتبر دیگر ببرد.

- **سازگاری در داده (Consistency in data)**
  - توسط کاربر تعریف می‌شود
  - یکپارچگی ارجاعی (Referential integrity / foreign keys)
  - مرتبط با Atomicity تراکنش
  - مرتبط با Isolation تراکنش
- **سازگاری در خواندن (Consistency in reads)**
  - اگر تراکنشی تغییر را commit کرد، تراکنش جدید فوراً آن را می‌بیند؟
  - روی کل سیستم اثر دارد
  - هم رابطه‌ای و هم NoSQL با این موضوع روبه‌رو هستند
  - سازگاری نهایی (Eventual consistency)

#### Isolation (انزوا)

**Isolation Level** مشخص می‌کند تراکنش‌های هم‌زمان چه نسخه‌ای از دادهٔ هم را می‌بینند.

PostgreSQL از **MVCC** (کنترل همزمانی چندنسخه‌ای) استفاده می‌کند: معمولاً خواننده نویسنده را بلوکه نمی‌کند و برعکس. Isolation فقط تعیین می‌کند *کدام نسخه* سطر را می‌بینی.

مثال ساده: یک تراکنش `UPDATE` می‌زند، دیگری روی همان سطرها `SELECT` می‌کند. سطح Isolation تصمیم می‌گیرد خواننده نسخهٔ قدیمی را ببیند، منتظر بماند، یا snapshot ثابت از شروع تراکنش را ببیند.

سؤال: آیا تراکنش در حال اجرا می‌تواند تغییرات تراکنش‌های دیگر را ببیند؟

**تراکنش ۱:**

```sql
SELECT id, quantity FROM products WHERE id = 1;
SELECT SUM(quantity) FROM products;
```

**تراکنش ۲:**

```sql
UPDATE products SET quantity = quantity - 1 WHERE id = 1;
```

اگر Isolation نباشد، نتیجه می‌تواند غلط شود.

##### ناهنجاری‌های اصلی

**Dirty read (خواندن کثیف)** — تراکنش A داده را عوض کرده ولی هنوز commit نکرده. `SELECT` تراکنش B همان تغییرات معلق را می‌خواند. اگر A بعداً rollback کند، B از قبل دادهٔ نامعتبر دیده است.

**Non-repeatable read** — سطری را می‌خوانی؛ تراکنش دیگر UPDATE/DELETE را commit می‌کند؛ `SELECT` بعدی تو مقدار متفاوت (یا بدون سطر) می‌بیند.

**Phantom read (خواندن شبح)** — وسط `SELECT`های تراکنش A، تراکنش دیگری سطرهای مطابق شرط A را INSERT (یا DELETE) می‌کند. `SELECT` بعدی A مجموعهٔ متفاوتی می‌بیند.

| ناهنجاری | چه چیزی عوض شد؟ |
| -------- | --------------- |
| Dirty read | تغییرات **commit‌نشده** تراکنش دیگر را خواندی |
| Non-repeatable read | یک **سطر موجود** که قبلاً خوانده بودی **آپدیت** (یا حذف) شد |
| Phantom read | **مجموعه سطرهای** مطابق کوئری بزرگ/کوچک شد |

##### سطوح Isolation در PostgreSQL (نمای کلی)

| سطح | رفتار در PostgreSQL | Dirty | Non-repeatable | Phantom |
| --- | ------------------- | ----- | -------------- | ------- |
| **Read Uncommitted** | پذیرفته می‌شود، ولی مثل **Read Committed** عمل می‌کند (Dirty واقعی نیست) | 🟢 | 🔴 | 🔴 |
| **Read Committed** | **پیش‌فرض.** هر statement فقط دادهٔ commit‌شده قبل از شروع همان statement را می‌بیند | 🟢 | 🔴 | 🔴 |
| **Repeatable Read** | Snapshot از لحظهٔ شروع تراکنش؛ خواندن پایدار؛ معمولاً بدون phantom | 🟢 | 🟢 | 🟢 |
| **Serializable** | Snapshot + تشخیص تعارض (SSI)؛ ممکن است تراکنش با serialization failure abort شود | 🟢 | 🟢 | 🟢 |

> در PostgreSQL سطح جداگانه‌ای به نام **`SNAPSHOT`** نیست. **Repeatable Read** همان رفتار snapshot isolation را می‌دهد. **Serializable** قوی‌تر است (SSI).

##### آماده‌سازی آزمایش‌های PostgreSQL

دو session جدا در `psql` به دیتابیس `app` وصل کن (همان DB آزمایش Atomicity، یا بساز). یک‌بار:

```sql
CREATE DATABASE app;          -- اگر از قبل هست رد شو
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

برای فرصت سوییچ بین sessionها از `pg_sleep(10)` استفاده کن.

##### ۱) Read Uncommitted (در PostgreSQL = Read Committed)

در استاندارد SQL ضعیف‌ترین سطح است و می‌تواند Dirty read بدهد. **در PostgreSQL، `READ UNCOMMITTED` مثل `READ COMMITTED` رفتار می‌کند** — دادهٔ commit‌نشده session دیگر را نمی‌بینی.

**Session 1:**

```sql
BEGIN;
UPDATE test_table SET field1 = 2;
SELECT pg_sleep(10);
ROLLBACK;
```

**Session 2 (وسط sleep سشن ۱):**

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT * FROM test_table;
```

هنوز مقادیر **قدیمی commit‌شده** را می‌بینی (`field1 = 1`)، نه `2`. Dirty read رخ نمی‌دهد. این رفتار عمدی PostgreSQL است.

##### ۲) Read Committed (پیش‌فرض)

هر statement فقط سطرهایی را می‌بیند که قبل از **شروع همان statement** commit شده‌اند. Dirty نمی‌بینی. بین statementهای یک تراکنش، UPDATEهای **commit‌شده** دیگران هنوز می‌توانند دید تو را عوض کنند → Non-repeatable / Phantom ممکن است.

**نمایش Non-repeatable read**

**Session 1:**

```sql
BEGIN;  -- پیش‌فرض = READ COMMITTED
SELECT * FROM test_table WHERE id = 1;
SELECT pg_sleep(10);
SELECT * FROM test_table WHERE id = 1;  -- بعد از commit سشن ۲ ممکن است فرق کند
COMMIT;
```

**Session 2 (وسط sleep):**

```sql
UPDATE test_table SET field1 = 7 WHERE id = 1;
-- در psql اگر تراکنش باز نکرده باشی auto-commit است
```

select اول سشن ۱: `field1 = 1`. بعد از commit سشن ۲، select دوم: `field1 = 7`. Non-repeatable read.

**خواننده در برابر نویسنده (MVCC):** معمولاً `SELECT` سشن ۲ پشت `UPDATE` باز سشن ۱ **گیر نمی‌کند** — نسخهٔ قبلی commit‌شده را می‌خواند. بلوکه عمدتاً وقتی دو writer روی یک سطر تعارض دارند پیش می‌آید.

##### ۳) Repeatable Read (snapshot)

PostgreSQL در شروع تراکنش یک **snapshot** می‌گیرد. همهٔ statementهای آن تراکنش همان حالت commit‌شده را می‌بینند. UPDATEهای commit‌شده دیگران وارد دید تو نمی‌شوند. INSERTهای phantom هم معمولاً **دیده نمی‌شوند**.

**Session 1:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT * FROM test_table WHERE id = 1;
SELECT pg_sleep(10);
SELECT * FROM test_table WHERE id = 1;  -- مثل select اول
COMMIT;
```

**Session 2 (وسط sleep):**

```sql
UPDATE test_table SET field1 = 7 WHERE id = 1;
```

هر دو select در سشن ۱ هنوز `field1` قدیمی را نشان می‌دهند. commit سشن ۲ به snapshot سشن ۱ نشت نمی‌کند.

اگر سشن ۱ بعداً همان سطری را `UPDATE` کند که سشن ۲ عوض کرده، ممکن است خطا بگیری: `could not serialize access due to concurrent update`.

##### ۴) Serializable (SSI)

قوی‌ترین سطح در PostgreSQL. مثل snapshot در Repeatable Read، به‌علاوه **تشخیص شکست سریال‌سازی**. اگر الگوی خطرناک هم‌زمانی دیده شود، یک تراکنش abort می‌شود و باید retry کند.

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- خواندن/نوشتن تو
COMMIT;
```

در تعارض ممکن است ببینی:

```text
ERROR: could not serialize access due to read/write dependencies among transactions
```

الگوی اپلیکیشن: خطا را بگیر → کل تراکنش را دوباره اجرا کن.

##### آزمایش Phantom read (PostgreSQL)

**Phantom read** وقتی است که تراکنش **همان کوئری را دو بار** اجرا کند و بار دوم **سطرهای جدید** مطابق `WHERE` ببیند — چون تراکنش دیگری INSERT مطابق را commit کرده است.

**آماده‌سازی (یک‌بار):**

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

**نمایش phantom زیر Read Committed**

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

**Session B (وسط sleep):**

```sql
INSERT INTO products (name, price, inventory)
VALUES ('Laptop', 1299.00, 5);
```

**چه اتفاقی افتاد؟**

1. Session A شمارش `price > 500` → `1` (Phone).
2. Session B لپ‌تاپ (`1299`) را insert و commit کرد.
3. شمارش دوم Session A → `2`.
4. سطر اضافه همان **phantom** است.

**بستن phantom با Repeatable Read**

همان اسکریپت در Session A، ولی:

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
SELECT COUNT(*) FROM products WHERE price > 500;
SELECT pg_sleep(10);
SELECT COUNT(*) FROM products WHERE price > 500;
-- هنوز 1
COMMIT;
```

INSERT سشن B می‌تواند commit شود؛ snapshot سشن A تا قبل از commit خودش آن را نمی‌بیند.

##### Serializable در برابر Phantom Read

**Phantom read** = دو بار همان `SELECT`؛ بین دو اجرا INSERT/DELETE مطابق شرط؛ مجموعهٔ نتیجه عوض می‌شود.

| | Read Committed | Repeatable Read (PostgreSQL) | Serializable |
| - | -------------- | ---------------------------- | ------------ |
| UPDATEهای commit‌شده دیگران وسط تراکنش دیده می‌شود؟ | بله (per statement) | خیر (snapshot) | خیر (snapshot + SSI) |
| Phantom از INSERT؟ | 🔴 ممکن | 🟢 معمولاً بسته | 🟢 بسته |
| ممکن است تراکنش abort شود؟ | برای این مورد نادر | روی نوشتن متعارض همان سطر | روی تعارض تشخیص‌داده‌شده SSI |

**PostgreSQL چطور در Repeatable Read phantom را می‌بندد؟**

- Snapshot در `BEGIN` / اولین کوئری تراکنش RR ثابت می‌شود.
- INSERTهایی که بعد از آن snapshot commit شوند برای تو نامرئی‌اند.
- معمولاً به range lock به‌سبک بعضی موتورهای قفل‌محور نیاز نیست.

**کی Serializable؟**

- وقتی قواعد کسب‌وکار نیاز به اجرای واقعاً سریال دارند (مثلاً دو تراکنش هر کدام یک مجموعه را می‌خوانند و بر اساس آن می‌نویسند).
- انتظار `could not serialize access` گاه‌به‌گاه → retry.

**معنای Snapshot در برابر Serializable (PostgreSQL)**

- **Repeatable Read** ≈ snapshot isolation (دید پایدار؛ بدون Dirty / Non-repeatable / phantom معمول).
- **Serializable** = snapshot + بررسی وابستگی؛ برای الگوهای نوشتن پیچیده امن‌تر، احتمال retry بیشتر.

**پیاده‌سازی Isolation در پایگاه‌داده:**

- Isolation در PostgreSQL روی **MVCC** + snapshot (+ SSI برای Serializable) بنا شده
- موتورهای **Pessimistic** بیشتر روی قفل تکیه می‌کنند؛ خواننده‌های PostgreSQL بیشتر با نسخه کار می‌کنند
- مدیریت **Optimistic** وقتی writerهای RR/Serializable برخورد می‌کنند دیده می‌شود — fail و retry

#### Durability (دوام)

تراکنش پایدار است: بعد از commit، حتی با قطع برق یا کرش سیستم از بین نمی‌رود. تغییرات کلاینت باید ماندگار بمانند.

**Durability در عمل**

راهکارهای رایج:

- **Write-Ahead Logging (WAL)** — قبل از تغییر فایل‌های اصلی، تغییرات در لاگ ثبت می‌شود؛ بعد از کرش با replay لاگ، کار commit‌شده بازیابی می‌شود
- **Write-Through Logging (WTL)** — هم‌زمان به لاگ و پایگاه‌داده می‌نویسد؛ ریسک از دست رفتن داده کمتر و هم‌راستایی لاگ و storage بهتر
- **Write-Behind / Write-Back Logging (WBL)** — اول لاگ؛ به‌روزرسانی فایل اصلی عقب می‌افتد (اغلب batch). سریع‌تر است ولی recovery باید دقیق باشد
- **تفاوت DBMSها** — موتورها این استراتژی‌ها را با تعادل سرعت در برابر ایمنی ترکیب می‌کنند

لاگ‌گذاری تضمین می‌کند که بعد از commit، recovery بتواند دادهٔ آسیب‌دیده را بازسازی کند.

#### سازگاری نهایی (Eventual Consistency)

**Consistency** در ACID یعنی تراکنش پایگاه‌داده را از یک حالت معتبر به حالت معتبر دیگر می‌برد.

در سیستم‌های توزیع‌شده و بسیاری از NoSQLها، **Eventual consistency** رایج است: اگر به‌اندازه کافی بدون آپدیت جدید بگذرد، همه replicaها هم‌گرا می‌شوند — اما سازگاری فوری بعد از هر نوشتن تضمین نیست.

در راه‌اندازی‌های رابطه‌ای توزیع‌شده هم، وقتی اولویت Availability و Partition tolerance باشد، ممکن است دیده شود.

**نکات کلیدی:**

- Consistency در ACID یعنی اعمال قوانین یکپارچگی بعد از هر تراکنش
- Eventual consistency اختلاف موقت بین نودها را می‌پذیرد؛ با زمان هم‌گرا می‌شوند
- فقط مخصوص NoSQL نیست

**مثال**

Master به نام `A` و دو replica به نام `A1` و `A2`:

1. مقدار `X` روی master `A` آپدیت می‌شود
2. قبل از تمام شدن replication از `A1` می‌خوانی → مقدار قدیمی `X` (ناسازگاری موقت)
3. بعد از رسیدن آپدیت به `A1` و `A2`، همه نودها همان `X` به‌روز را دارند

سازگاری فوری تضمین نیست؛ وقتی replicaها sync شوند، سیستم در نهایت سازگار می‌شود.

---

### 03 — آشنایی با داخلیات پایگاه‌داده

- **وضعیت:** `[ ]`
- **خلاصه:** داخل موتور پایگاه‌داده — storage، buffer، execution.
- **تمرکز:** DBMS زیر پوسته چطور کار می‌کند.
- **یادداشت:** *(بعداً)*

---

### 04 — ایندکس‌گذاری

- **وضعیت:** `[ ]`
- **خلاصه:** ایندکس چیست، کی بسازیم، هزینه خواندن/نوشتن.
- **تمرکز:** انواع ایندکس، selectivity، و trade-offها.
- **یادداشت:** *(بعداً)*

---

### 05 — B-Tree در برابر B+Tree

- **وضعیت:** `[ ]`
- **خلاصه:** مقایسه B-Tree و B+Tree در سیستم‌های واقعی.
- **تمرکز:** ایندکس‌های درختی در پایگاه‌داده‌های production.
- **یادداشت:** *(بعداً)*

---

### 06 — پارتیشن‌بندی

- **وضعیت:** `[ ]`
- **خلاصه:** پارتیشن‌بندی داده داخل یک سیستم.
- **تمرکز:** استراتژی‌های Horizontal / Vertical partitioning.
- **یادداشت:** *(بعداً)*

---

### 07 — شاردینگ

- **وضعیت:** `[ ]`
- **خلاصه:** شاردینگ — توزیع داده بین چند نود.
- **تمرکز:** Shard key، routing، و چالش‌های cross-shard.
- **یادداشت:** *(بعداً)*

---

### 08 — کنترل همزمانی

- **وضعیت:** `[ ]`
- **خلاصه:** کنترل همزمانی، قفل، anomalyها.
- **تمرکز:** قفل‌ها، MVCC، سطوح Isolation در عمل.
- **یادداشت:** *(بعداً)*

---

### 09 — Replication

- **وضعیت:** `[ ]`
- **خلاصه:** کپی داده برای دسترس‌پذیری و مقیاس خواندن.
- **تمرکز:** Leader/follower، sync در برابر async، lag.
- **یادداشت:** *(بعداً)*

---

### 10 — طراحی سیستم پایگاه‌داده

- **وضعیت:** `[ ]`
- **خلاصه:** طراحی سیستم پایگاه‌داده برای نیاز واقعی.
- **تمرکز:** تبدیل نیازها به انتخاب معماری DB.
- **یادداشت:** *(بعداً)*

---

### 11 — موتورهای پایگاه‌داده

- **وضعیت:** `[ ]`
- **خلاصه:** موتورهای ذخیره‌سازی و تفاوت‌ها (مثلاً InnoDB).
- **تمرکز:** Storage engineها و زمان انتخاب هر کدام.
- **یادداشت:** *(بعداً)*

---

### 12 — Cursorها

- **وضعیت:** `[ ]`
- **خلاصه:** Cursor — پیمایش تدریجی نتیجه کوئری.
- **تمرکز:** Cursor سمت سرور/کلاینت و streaming نتیجه.
- **یادداشت:** *(بعداً)*

---

### 13 — امنیت پایگاه‌داده

- **وضعیت:** `[ ]`
- **خلاصه:** امنیت پایگاه‌داده — دسترسی، رمزنگاری، تهدیدها.
- **تمرکز:** AuthZ، encryption at rest/in transit، hardening.
- **یادداشت:** *(بعداً)*

---

### 14 — رمزنگاری همومورفیک

- **وضعیت:** `[ ]`
- **خلاصه:** کوئری روی داده رمزشده بدون رمزگشایی کامل.
- **تمرکز:** Homomorphic encryption برای کوئری روی داده رمزشده.
- **عنوان کامل:** Homomorphic Encryption — Performing Database Queries on Encrypted Data
- **یادداشت:** *(بعداً)*

---

### 15 — پرسش و پاسخ

- **وضعیت:** `[ ]`
- **خلاصه:** پاسخ به سوالات کورس.
- **تمرکز:** جلسات Q&A مدرس.
- **یادداشت:** *(بعداً)*

---

### 16 — بحث‌های پایگاه‌داده

- **وضعیت:** `[ ]`
- **خلاصه:** بحث‌های تکمیلی حول موضوعات پایگاه‌داده.
- **تمرکز:** بحث‌های فراتر از لکتچرهای اصلی.
- **یادداشت:** *(بعداً)*

---

### 17 — لکتچرهای آرشیو

- **وضعیت:** `[ ]`
- **خلاصه:** لکتچرهای آرشیو / قدیمی‌تر.
- **تمرکز:** مواد آرشیو برای مراجعه.
- **یادداشت:** *(بعداً)*

---

## راهنمای علامت‌ها

| علامت | معنی |
| ----- | ---- |
| `[ ]` | شروع‌نشده |
| `[~]` | در حال انجام |
| `[x]` | تمام‌شده |

وقتی وضعیت فصل عوض شد، جدول **پیشرفت** را هم به‌روز کن.
