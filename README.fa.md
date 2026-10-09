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
- **خلاصه:** داده داخل پایگاه‌داده چطور ذخیره و پیدا می‌شود.
- **تمرکز:** پشت صحنه — storage، صفحات، ایندکس، و IO.

#### جدول و ایندکس چطور ذخیره و پیدا می‌شوند — ساده

**ایده‌های کلیدی ذخیره‌سازی:**

- **Table (جدول):** یک جدول شبکه‌ای از سطرها و ستون‌ها.

  *مثال:*

  | id | name    | email              |
  |----|---------|--------------------|
  | 1  | Alice   | alice@email.com    |
  | 2  | Bob     | bob@email.com      |
  | 3  | Charlie | charlie@email.com  |

  هر سطر یک رکورد است. ستون‌ها فیلدهای داده هستند.

  *نمونه کد PostgreSQL:*
  ```sql
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

- **Row ID:** هر سطر یک شناسه یکتا دارد تا پایگاه‌داده سریع همان سطر را پیدا کند. گاهی primary key است؛ گاهی (مثل PostgreSQL) یک مقدار سیستمی پنهان.

- **Page (صفحه):** پایگاه‌داده داده را در «صفحه» جابه‌جا می‌کند — تکه‌هایی معمولاً 8KB یا 16KB. یک صفحه چند سطر نگه می‌دارد. وقتی می‌خواند، کل صفحه را می‌گیرد نه تک‌سطر.

    - مثال: اگر هر صفحه ۳ سطر جا بدهد و جدول ۱٬۰۰۱ سطر داشته باشد، حدود ۳۳۴ صفحه لازم است.

- **IO (Input/Output):** خواندن/نوشتن بین حافظه و دیسک/SSD. هر IO حداقل یک صفحه کامل می‌خواند، نه یک سطر تکی. IO زیاد = پایگاه‌داده کند.

- **Heap:** روش سادهٔ ذخیرهٔ سطرهای جدول: هر سطر را در اولین جای خالی می‌گذارد (بدون مرتب‌سازی). Insert سریع است، ولی جستجو بدون کمک کند است.

    - برای پیدا کردن سریع بدون گشتن همه‌جا، نیاز داری به...

- **Index (ایندکس):** مثل نقشه است که مستقیم به سطر(ها) در جدول (همان «Heap») اشاره می‌کند. اغلب به‌صورت **B-Tree** یا **B+Tree** — درخت‌های مرتب که جستجو را خیلی سریع می‌کنند.

    - **ایندکس چطور کار می‌کند:**
      1. ایندکس دادهٔ کلید (بعضی ستون‌ها) را نگه می‌دارد.
      2. برای هر کلید، pointer به محل در Heap دارد (کدام صفحه، کدام سطر).
      3. در ایندکس جستجو می‌کنی؛ پایگاه‌داده دقیق می‌فهمد رکورد کجاست — بدون اسکن کل جدول.

    - **نکات ایندکس:**
        - می‌تواند یک یا چند ستون را پوشش دهد (موقع ساخت انتخاب می‌کنی).
        - مثل جدول در صفحه ذخیره می‌شود، ولی معمولاً کوچک‌تر و حافظه‌دوست‌تر است.
        - رایج‌ترین ساختار: **B-Tree** یا **B+Tree**.

    - **تصویر ذهنی:**
      ```
      [Index on email]
           |
       "bob@email.com"
           |
      points to
           |
      [Heap Page X] → Row for Bob
      ```

**جمع‌بندی:**
- داده در جدول‌ها ذخیره می‌شود (سطر و ستون).
- هر سطر داخل یک صفحه می‌نشیند.
- پایگاه‌داده صفحه جابه‌جا می‌کند، نه تک‌سطر.
- Heap سطرها را هر جا جا باشد می‌چیند.
- ایندکس کمک جستجو است — مستقیم به داده اشاره می‌کند تا همهٔ سطرها را نگردی.

![ایندکس روی EMP_ID و اشاره‌گر به Heap — دو مرحله IO](images/index-emp-id-heap.png)

**نمودار — جستجو با ایندکس در برابر خواندن از Heap**

1. **IO1 روی ایندکس:** در ایندکس `EMP_ID` بگرد تا pointer به شکل `(page_id, row_id)` پیدا شود.
2. **IO2 روی Heap:** با همان pointer صفحهٔ درست Heap را بخوان و کل سطر را بگیر.

در PostgreSQL هم ایده یکی است: ایندکس ثانویه کلید + اشاره‌گر به tuple در Heap (`ctid`) را نگه می‌دارد؛ معمولاً حداقل یک IO ایندکس + یک IO Heap.

- **مثال کوئری:**  
  فرض کن جدول employees با ایندکس روی `email` داری.

  - **کوئری:**  
    ```sql
    SELECT * FROM employees WHERE email = 'bob@email.com';
    ```

  - **فقط Heap (بدون ایندکس):**  
    پایگاه‌داده باید همهٔ سطرها را اسکن کند تا ایمیل Bob را پیدا کند. اگر ۱۰٬۰۰۰ سطر باشد، همه را چک می‌کند (ممکن است صدها صفحه!). برای جدول بزرگ خیلی کند است.

  - **با ایندکس:**  
    1. اول `'bob@email.com'` را در **ایندکس** پیدا می‌کند (سریع، معمولاً ۱ یا ۲ صفحه).
    2. ایندکس دقیق می‌گوید کدام صفحه و سطر Heap دادهٔ Bob را دارد.
    3. مستقیم همان‌جا می‌پرد و فقط همان صفحه را برای کل سطر می‌خواند.
    4. نتیجه: به‌جای اسکن همه چیز، معمولاً فقط ۲ خواندن (IO). خیلی سریع‌تر!

  #### پایگاه‌داده Row-Oriented در برابر Column-Oriented

- **Row-Oriented (ذخیره‌سازی سطری / Row Store):**  
  - کل هر سطر را کنار هم در هر بلوک دیسک نگه می‌دارد؛ همهٔ ستون‌های یک سطر کنار هم هستند.
  - خواندن یک بلوک، سطرهای کامل را یکجا می‌دهد (همهٔ ستون‌ها و مقادیرشان برای هر سطر).
  - اسکن برای پیدا کردن سطر خاص ممکن است چند IO ببرد، ولی وقتی سطر پیدا شد همهٔ داده‌اش با هم لود می‌شود.
  - بهترین برای:
    - سیستم‌های تراکنشی (OLTP) که اغلب کل سطر را می‌خوانند یا می‌نویسند (مثلاً insert/update رکورد).
    - بارهایی که برای join یا تغییر، یکپارچگی سطر مهم است.
    - مثال سیستم‌ها: PostgreSQL، MySQL، SQLite و غیره.
    - مثال جدول (ذخیرهٔ سطری):
      | id | name    | email              |
      |----|---------|--------------------|
      | 1  | Alice   | alice@email.com    |
      | 2  | Bob     | bob@email.com      |
      | 3  | Charlie | charlie@email.com  |

![جدول در پایگاه‌داده Row-Oriented](images/table-row-oriented.jpg)

- **Column-Oriented (ذخیره‌سازی ستونی / Column Store):**  
  - همهٔ مقادیر هر ستون را در بلوک‌های جدا (تکه‌های ستونی) نگه می‌دارد؛ پس مقادیر یک ستون از نظر فیزیکی کنار هم هستند.
  - خواندن یک بلوک، مقادیر زیاد از **یک** ستون می‌دهد، نه سطر کامل.
  - گرفتن همهٔ مقادیر یک ستون (برای فیلتر یا aggregation) خیلی سریع و کارآمد است — ممکن است فقط چند بلوک لازم باشد. ولی بازسازی سطر کامل از روی چند ستون می‌تواند IO بیشتری بخواهد.
  - بهترین برای:
    - بارهای تحلیلی (OLAP) مثل گزارش، aggregation، و فیلتر روی جدول‌های خیلی بزرگ.
    - وقتی معمولاً فقط چند ستون را یکجا پردازش می‌کنی، یا می‌خواهی مجموعهٔ بزرگ را ستونی اسکن کنی.
    - مثال سیستم‌ها: ClickHouse، Amazon Redshift، Vertica، Apache Parquet و غیره.
    - مثال (نمای ساده) — ستون‌ها جدا ذخیره شده‌اند:
      ```
      id:    [1,   2,    3,    ...]
      name:  [Alice, Bob, Charlie, ...]
      email: [alice@email.com, bob@email.com, charlie@email.com, ...]
      ```

#### مزایا و معایب

| پایگاه‌داده Row-Oriented | پایگاه‌داده Column-Oriented |
| ------------------------ | --------------------------- |
| سریع برای خواندن/نوشتن تراکنشی (سطر کامل) | کندتر برای نوشتن، مخصوصاً وقتی ستون‌های زیاد یکجا تغییر کنند |
| مناسب OLTP (تراکنش، آپدیت مکرر) | مناسب OLAP (آنالیتیکس، aggregation، گزارش) |
| فشرده‌سازی داده معمولاً ضعیف‌تر | فشرده‌سازی عالی (شباهت مقادیر یک ستون) |
| برای aggregation کم‌بازده | برای aggregation، فیلتر، اسکن چند ستون بسیار کارآمد |
| برای کوئری‌هایی که خیلی/همهٔ ستون‌های یک سطر را می‌خواهند کارآمد | برای point query که سطر کامل می‌خواهد کم‌بازده |

![جدول در پایگاه‌داده Column-Oriented](images/table-column-oriented.jpg)


### 04 — ایندکس‌گذاری

- **وضعیت:** `[ ]`
- **خلاصه:** ایندکس چیست، کی بسازیم، هزینه خواندن/نوشتن.
- **تمرکز:** انواع ایندکس، selectivity، و trade-offها.

#### Heap در برابر Index (دو فایل جدا)

سطرهای جدول در PostgreSQL داخل **Heap** زندگی می‌کنند: صفحات نامرتب ۸ کیلوبایتی. Insert سطر را در اولین صفحهٔ دارای جا می‌گذارد. بدون مرتب‌سازی. نوشتن سریع. جستجو بدون کمک کند است — موتور **Seq Scan** می‌کند و همهٔ صفحات Heap را می‌خواند.

**Index** ساختار دوم است (معمولاً B-Tree). هر برگ `(key → ctid)` نگه می‌دارد. `ctid` همان `(page, slot)` است — آدرس سطر در Heap.

```
INSERT  →  نوشتن صفحهٔ Heap  (+ نوشتن هر ایندکس روی آن جدول)
SELECT  →  Seq Scan روی Heap
        یا Index Scan: پیمایش ایندکس → ctid → صفحهٔ Heap (IO1 + IO2)
        یا Index Only Scan: جواب از خود ایندکس؛ Heap Fetches = 0 اگر visibility map بگوید صفحه all-visible است
```

`PRIMARY KEY` / `UNIQUE` از قبل یک B-Tree یکتا می‌سازند. `CREATE INDEX` درخت اضافه می‌سازد. `SELECT *` بدون `WHERE` هیچ‌وقت از ایندکس استفاده نمی‌کند — خواستی همهٔ سطرهای Heap را.

![ایندکس روی EMP_ID و اشاره‌گر به Heap — دو مرحله IO](images/index-emp-id-heap.png)

#### آزمایشگاه (PostgreSQL 18.4)

```sql
CREATE TABLE employees (
  id   serial PRIMARY KEY,   -- btree یکتای employees_pkey
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

EXPLAIN ANALYZE SELECT * FROM grades;  -- اجرا + زمان واقعی
EXPLAIN SELECT * FROM grades;          -- فقط تخمین
```

۱٬۰۰۰ سطر خیلی کوچک است (Heap ≈ ۶ صفحه). Planner اغلب Seq Scan را ترجیح می‌دهد. همان کوئری روی ۱۰۰٬۰۰۰ سطر فاصله را نشان می‌دهد.

`EXPLAIN` = هزینهٔ تخمینی. `EXPLAIN ANALYZE` = واقعاً اجرا می‌کند. `BUFFERS` تعداد صفحات را می‌شمارد.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id FROM employees WHERE id = 2000;
```

#### بنچمارک (لوکال، PostgreSQL 18.4، کش گرم)

| کوئری | Plan | Heap / صفحات | زمان |
| ----- | ---- | ------------ | ---- |
| `SELECT * FROM employees WHERE id = 1` (1k) | **Index Scan** `employees_pkey` | ایندکس + Heap (۳ بافر) | ~0.12 ms |
| `SELECT id FROM employees WHERE id = 2000` (1k، miss) | **Index Only Scan** `employees_pkey` | Heap Fetches: 0 · ۲ بافر | 0.028 ms |
| `SELECT id … WHERE name LIKE '%User %'` (1k) | **Seq Scan** | ۶ صفحه Heap، ۱۰۰۰ hit | 0.17 ms |
| `SELECT * FROM grades` (خالی) | **Seq Scan** | ۰ صفحه | 0.007 ms |
| `SELECT id FROM employees_big WHERE id = 2000` (100k) | **Index Only Scan** | Heap Fetches: 0 · ۳ بافر | **0.005 ms** |
| `SELECT * FROM employees_big WHERE id = 2000` | **Index Scan** | ایندکس + Heap (۳ بافر) | 0.014 ms |
| `SELECT id … WHERE name = 'User 50000'` | **Index Scan** `employees_big_name` | ایندکس + Heap | 0.017 ms |
| `SELECT id … WHERE name LIKE '%User 99999'` | **Seq Scan** | **۵۴۱ صفحه Heap**، ۹۹٬۹۹۹ فیلتر | **3.5 ms** |
| `LIKE 'User 5000%'` btree پیش‌فرض | **Seq Scan** | ۵۴۱ صفحه | ~12 ms |
| `LIKE 'User 5000%'` + `varchar_pattern_ops` | **Index Scan** | ~۵ بافر، ۱۱ سطر | **0.029 ms** |

اندازه (100k سطر): Heap **4328 kB** (۵۴۱ صفحه) · ایندکس PK **2208 kB** · ایندکس name **3104 kB**. ایندکس فضای اضافه است؛ هر `INSERT`/`UPDATE`/`DELETE` باید آن را هم بنویسد.

#### معنی هر Plan

**۱. Index Scan — اول ایندکس، بعد Heap**

```sql
SELECT * FROM employees WHERE id = 1;
-- Index Scan using employees_pkey
-- Index Cond: (id = 1)
```

B-Tree کلید اصلی `ctid` را پیدا می‌کند، بعد همان صفحهٔ Heap را برای `name` می‌خواند. دو IO در نمودار بالا. لازم است وقتی ایندکس همهٔ ستون‌های SELECT را ندارد.

**۲. Index Only Scan — داخل ایندکس بمان**

```sql
SELECT id FROM employees WHERE id = 2000;
-- Index Only Scan using employees_pkey
-- Heap Fetches: 0
```

`id` داخل `employees_pkey` است؛ سطر Heap لازم نیست. `id = 2000` روی جدول ۱k یک **miss** است (`rows=0`) — باز هم ارزان: یک جستجوی ایندکس، نه پیمایش جدول.

`Heap Fetches: 0` بعد از `VACUUM`: visibility map صفحات Heap را all-visible علامت می‌زند. اگر vacuum کهنه باشد، Postgres حتی در plan از نوع index-only به Heap سرک می‌کشد (`Heap Fetches > 0`).

**۳. Seq Scan — پیمایش Heap**

```sql
SELECT id FROM employees WHERE name LIKE '%User %';
-- Seq Scan on employees
-- Filter: (name ~~ '%User %')
```

`%` اول کلید را در B-Tree نمی‌شود seek کرد (درخت از **ابتدای** کلید مرتب است). موتور همهٔ صفحات Heap را می‌خواند و فیلتر می‌زند. همین plan **قبل و بعد** از `CREATE INDEX employees_name`. ایندکس کمک نمی‌کند.

`grades` خالی: `SELECT *` بدون `WHERE`. ایندکس روی `name` بی‌استفاده. Seq Scan صفر صفحه.

**۴. تساوی روی ایندکس ثانویه باز هم Heap می‌زند**

```sql
CREATE INDEX employees_name ON employees(name);

SELECT id FROM employees WHERE name = 'User 500';
-- Index Scan using employees_name   -- نه Index Only
```

ایندکس name فقط `(name → ctid)` دارد، نه `id`. اسم را پیدا کن، بعد سطر Heap را بگیر تا `id` برگردد. Covering index با `INCLUDE (id)` می‌تواند این را Index Only Scan کند.

**۵. `LIKE` پیشوندی opclass درست می‌خواهد**

B-Tree پیش‌فرض روی `varchar` (collation غیر `C`) از `=` و `<` و `>` پشتیبانی می‌کند. از `LIKE 'User 5%'` **پشتیبانی نمی‌کند**. Planner حتی روی 100k سطر Seq Scan می‌کند.

```sql
CREATE INDEX employees_name_pattern ON employees (name varchar_pattern_ops);

-- حالا:
-- Index Cond: (name ~>=~ 'User 5000' AND name ~<~ 'User 5001')
-- Filter: (name ~~ 'User 5000%')
```

رنج روی ایندکس، بعد فیلتر `~~`. `LIKE '%User %'` با `%` اول همچنان Seq Scan است.

#### کی ایندکس بسازیم

بساز برای:

- تساوی / رنج روی ستون selective (`WHERE id =`، `WHERE email =`، `WHERE created_at >`)
- کلید join و `ORDER BY` هم‌تراز با ترتیب ایندکس
- `LIKE 'foo%'` **با** `varchar_pattern_ops` (یا collation `C`)

نساز / هدر است:

- جدول خیلی کوچک (۱k سطر، چند صفحه) — Seq Scan از قبل ارزان است
- `SELECT *` بدون فیلتر
- `LIKE '%…%'` با `%` اول (اگر مجبوری `pg_trgm` GIN)
- ستون کم‌selectivity (`boolean`، status با ۲ مقدار) — lookup ایندکس + IO تصادفی Heap می‌تواند از Seq Scan ببازد

#### هزینه خواندن در برابر نوشتن

| | فقط Heap | Heap + ایندکس‌ها |
| --- | --- | --- |
| `INSERT` | append سطر به یک صفحه Heap | Heap **به‌علاوه** insert در هر btree |
| Point `SELECT` | اسکن همهٔ صفحات Heap | چند صفحه ایندکس + شاید ۱ صفحه Heap |
| `UPDATE` ستون ایندکس‌شده | Heap + سطر جدید (MVCC) | به‌علاوه به‌روز کردن / insert در ایندکس |

ایندکس **خواندن selective** را تند می‌کند. **نوشتن** را کند می‌کند و RAM/دیسک می‌خورد. با `EXPLAIN (ANALYZE, BUFFERS)` روی تعداد سطر واقعی بسنج، نه جدول اسباب‌بازی ۱k.

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
