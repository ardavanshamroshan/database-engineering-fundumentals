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

**Isolation Level** مشخص می‌کند تراکنش‌های هم‌زمان چطور روی دادهٔ هم قفل بگذارند و چه چیزی از هم ببینند.

مثال ساده: یک تراکنش `UPDATE` می‌زند، دیگری روی همان سطرها `SELECT` می‌کند. سطح Isolation تصمیم می‌گیرد خواننده منتظر بماند، دادهٔ قدیمی ببیند، دادهٔ commit‌نشده ببیند، یا snapshot ببیند.

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

**Phantom read (خواندن شبح)** — وسط `SELECT`های تراکنش A، تراکنش دیگری سطرهایی مطابق شرط A را INSERT (یا DELETE) می‌کند. `SELECT` بعدی A مجموعهٔ سطرهای متفاوتی می‌بیند — سطرهای «شبح» ظاهر (یا غیب) می‌شوند.

| ناهنجاری | چه چیزی عوض شد؟ |
| -------- | --------------- |
| Dirty read | تغییرات **commit‌نشده** تراکنش دیگر را خواندی |
| Non-repeatable read | یک **سطر موجود** که قبلاً خوانده بودی **آپدیت** (یا حذف) شد |
| Phantom read | **مجموعه سطرهای** مطابق کوئری بزرگ/کوچک شد |

##### سطوح Isolation (نمای کلی)

| سطح | رفتار معمول | Dirty | Non-repeatable | Phantom |
| --- | ----------- | ----- | -------------- | ------- |
| **Read Uncommitted** | تقریباً بدون قفل خواندن؛ دادهٔ commit‌نشده هم دیده می‌شود | 🔴 | 🔴 | 🔴 |
| **Read Committed** | پیش‌فرض SQL Server / PostgreSQL؛ فقط دادهٔ commit‌شده | 🟢 | 🔴 | 🔴 |
| **Repeatable Read** | سطرهایی که خواندی تا پایان تراکنش پایدار می‌مانند؛ نویسنده‌ها منتظر می‌مانند | 🟢 | 🟢 | 🔴 (SQL Server) / اغلب 🟢 (snapshot در PostgreSQL) |
| **Serializable** | مثل Repeatable Read + جلوی INSERTهایی که phantom می‌سازند | 🟢 | 🟢 | 🟢 |
| **Snapshot** | نتیجه پایدار بدون قفل‌گذاری مشابه روی writerها؛ نسخه‌ها در tempdb (SQL Server) | 🟢 | 🟢 | 🟢 |

##### آماده‌سازی آزمایش‌های SQL Server

نمونه‌های زیر الگوی کلاسیک دو پنجره Query در SQL Server هستند. یک‌بار بساز:

```sql
CREATE DATABASE IsolationLevelTest;
GO
USE IsolationLevelTest;
GO

CREATE TABLE TestTable
(
  ID INT IDENTITY,
  Field1 INT NULL,
  Field2 INT NULL,
  Field3 INT NULL
);
GO

INSERT INTO TestTable (Field1, Field2, Field3) VALUES (1, 2, 3);
INSERT INTO TestTable (Field1, Field2, Field3) VALUES (1, 2, 3);
INSERT INTO TestTable (Field1, Field2, Field3) VALUES (1, 2, 3);
INSERT INTO TestTable (Field1, Field2, Field3) VALUES (1, 2, 3);
```

##### ۱) Read Uncommitted

پایین‌ترین سطح: برای خواننده تقریباً قفلی نیست. session دیگر می‌تواند داده‌ای را بخواند (یا حتی عوض کند) که هنوز داخل تراکنش باز است. `SELECT` ممکن است مقداری بدهد که هنوز نهایی نیست → **Dirty read**.

**Session 1:**

```sql
BEGIN TRAN;
UPDATE TestTable SET Field1 = 2;
WAITFOR DELAY '00:00:10';
ROLLBACK;
```

**Session 2 (سریع، وقتی Session 1 منتظر است):**

```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
SELECT * FROM TestTable;
```

اجرای اول Session 2 اغلب `Field1 = 2` را نشان می‌دهد، حتی اگر Session 1 بعداً rollback کند. ۱۰ ثانیه صبر کن و دوباره select بزن — مقادیر به حالت قبل برمی‌گردند. همان select اول Dirty read بود.

##### ۲) Read Committed

پیش‌فرض SQL Server. داده‌ای که داخل تراکنش باز عوض شده تا پایان آن تراکنش قفل است. `SELECT` / نوشتن هم‌زمان روی همان سطرها **منتظر** commit یا rollback می‌ماند. دادهٔ commit‌نشده نمی‌خوانی — ولی بین statementها هنوز Non-repeatable و Phantom ممکن است.

**Session 1:**

```sql
BEGIN TRAN;
UPDATE TestTable SET Field1 = 2;
WAITFOR DELAY '00:00:10';
ROLLBACK;
```

**Session 2:**

```sql
SELECT * FROM TestTable;  -- تا تمام شدن Session 1 بلوکه می‌شود
```

نتیجهٔ Session 2 فقط بعد از پایان Session 1 می‌آید (اینجا: بعد از rollback). Dirty read رخ نمی‌دهد.

##### ۳) Repeatable Read

مثل Read Committed، به‌علاوه: وقتی سطرهایی را `SELECT` کردی، **UPDATE** آن سطرها توسط دیگران تا پایان تراکنش تو منتظر می‌ماند. دو بار همان `SELECT` معمولاً **همان مقادیر سطر** را برمی‌گرداند.

**Session 1:**

```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
BEGIN TRAN;
SELECT * FROM TestTable;
WAITFOR DELAY '00:00:10';
SELECT * FROM TestTable;
ROLLBACK;
```

**Session 2 (وسط انتظار Session 1):**

```sql
UPDATE TestTable SET Field1 = 7;  -- منتظر Session 1 می‌ماند
```

هر دو select در Session 1 یکی هستند. اگر سطح را **Read Committed** کنی، UPDATE Session 2 می‌تواند بین دو select commit شود و select دوم مقادیر متفاوت بدهد (Non-repeatable read).

**نکته مهم (SQL Server):** زیر Repeatable Read هنوز **INSERT** روی همان جدول ممکن است موفق شود. select دوم ممکن است سطر اضافه ببیند → **Phantom read** هنوز ممکن است. برای بستن آن از **Serializable** (یا Snapshot) استفاده کن.

##### ۴) Serializable

مثل Repeatable Read، با تضمین اضافه: تا پایان تراکنش تو، sessionهای دیگر نمی‌توانند سطری INSERT کنند که نتیجهٔ تو را عوض کند. جلوی Phantom گرفته می‌شود (ممکن است قفل‌ها بیشتر طول بکشند).

**Session 1:**

```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
SELECT * FROM TestTable;
WAITFOR DELAY '00:00:10';
SELECT * FROM TestTable;
ROLLBACK;
```

**Session 2:**

```sql
INSERT INTO TestTable (Field1, Field2, Field3)
VALUES (100, 100, 100);  -- تا پایان Session 1 منتظر می‌ماند
```

هر دو select در Session 1 یکی می‌مانند؛ insert منتظر می‌ماند.

##### ۵) Snapshot

هدف دیده‌شدن مثل Serializable است (نتیجه پایدار)، ولی writerها به همان شکل قفل نمی‌شوند. UPDATE/INSERT هم‌زمان به‌صورت **row version** مدیریت می‌شود (در SQL Server معمولاً در `tempdb`). تراکنش Snapshot نسخهٔ شروع تراکنش را می‌خواند.

یک‌بار برای دیتابیس فعال کن:

```sql
ALTER DATABASE IsolationLevelTest
SET ALLOW_SNAPSHOT_ISOLATION ON;
```

**Session 1:**

```sql
SET TRANSACTION ISOLATION LEVEL SNAPSHOT;
BEGIN TRAN;
SELECT * FROM TestTable;
WAITFOR DELAY '00:00:10';
SELECT * FROM TestTable;
ROLLBACK;
```

**Session 2:**

```sql
INSERT INTO TestTable (Field1, Field2, Field3)
VALUES (200, 200, 200);  -- منتظر Session 1 نمی‌ماند
```

Session 2 فوراً جلو می‌رود. هر دو select در Session 1 همچنان یکی هستند — snapshot می‌خوانند، نه insert جدید را.

##### Phantom read — آزمایش PostgreSQL

**Phantom read** وقتی رخ می‌دهد که یک تراکنش **همان کوئری را دو بار** اجرا کند و بار دوم **سطرهای جدیدی** (یا سطرهایی که غیب شده‌اند) مطابق `WHERE` ببیند — چون تراکنش دیگری در این فاصله سطرهای مطابق را **INSERT** یا **DELETE** کرده و commit کرده است.

**آزمایش (PostgreSQL) — دو session**

از جدول `products` آزمایش Atomicity استفاده کن (یا دوباره بساز). دو session جدا در `psql` به دیتابیس `app` باز کن.

**آماده‌سازی (یک‌بار):**

```sql
\c app
TRUNCATE products RESTART IDENTITY;
INSERT INTO products (name, price, inventory)
VALUES ('Phone', 999.99, 10);
```

**Session A — شروع تراکنش و شمارش سطرهای مطابق:**

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;

SELECT COUNT(*) FROM products WHERE price > 500;
-- 1
```

**Session B — درج یک سطر مطابق و commit:**

```sql
INSERT INTO products (name, price, inventory)
VALUES ('Laptop', 1299.00, 5);
COMMIT;  -- اگر داخل تراکنش بودی؛ وگرنه INSERT خودش auto-commit است
```

**Session A — همان کوئری دوباره (هنوز داخل تراکنش باز):**

```sql
SELECT COUNT(*) FROM products WHERE price > 500;
-- 2  ← phantom: سطر جدید در نتیجه ظاهر شد
COMMIT;
```

**چه اتفاقی افتاد؟**

1. Session A سطرهای با `price > 500` را شمرد → `1` (Phone).
2. Session B لپ‌تاپ (`1299`) را insert کرد و commit کرد.
3. Session A همان شرط را دوباره اجرا کرد → `2`.
4. سطر اضافه همان **phantom** است: در نتیجهٔ اول این تراکنش نبود.

**با Isolation قوی‌تر**

همان مراحل را تکرار کن، ولی در Session A:

```sql
BEGIN;
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- یا: SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

در PostgreSQL، Repeatable Read از snapshot استفاده می‌کند — معمولاً `COUNT(*)` دوم تا قبل از commit همان `1` می‌ماند. Snapshot / Serializable جلوی این phantom را می‌گیرند؛ Read Committed اجازه می‌دهد.

> **نکته موتور:** در SQL Server، Repeatable Read هنوز می‌تواند phantom بدهد (INSERT). در PostgreSQL، Repeatable Read مبتنی بر snapshot است و معمولاً phantom نمی‌دهد. همیشه docs همان DBMS را چک کن.

**پیاده‌سازی Isolation در پایگاه‌داده:**

- هر DBMS سطوح Isolation را متفاوت پیاده می‌کند
- **Pessimistic** — قفل سطح سطر / جدول / صفحه برای جلوگیری از Lost updates
- **Optimistic** — بدون قفل؛ تغییر را ردیابی می‌کند و در تعارض تراکنش را fail می‌کند
- Repeatable Read معمولاً سطرهای خوانده‌شده را «قفل» می‌کند؛ روی خواندن زیاد گران است. PostgreSQL معمولاً RR را مثل Snapshot پیاده می‌کند — به همین دلیل معمولاً در Postgres زیر Repeatable Read، Phantom read نمی‌گیری

##### Serializable در برابر Phantom Read

**Phantom read** = تراکنش تو همان `SELECT` را دو بار اجرا می‌کند؛ بین دو اجرا تراکنش دیگری سطرهای مطابق شرط را **INSERT** (یا DELETE) می‌کند و مجموعهٔ نتیجه عوض می‌شود.

**Serializable** سطحی است که برای **جلوگیری از همین کلاس ناهنجاری** طراحی شده (همراه با Dirty و Non-repeatable).

| | Repeatable Read (SQL Server) | Serializable |
| - | ---------------------------- | ------------ |
| جلوی UPDATE سطرهایی که خواندی را می‌گیرد؟ | بله | بله |
| جلوی INSERTهایی که نتیجه را عوض می‌کنند؟ | **خیر** → phantom ممکن است | **بله** → phantom بسته می‌شود |
| هزینه معمول | کمتر | بیشتر (قفل / range lock بیشتر) |

**Serializable چطور phantom را می‌بندد؟**

- نه فقط سطرهای موجود، بلکه **محدودهٔ شرط** (range کلیدهایی که کوئری پوشش می‌دهد) را هم در نظر می‌گیرد.
- تا وقتی تراکنش تو باز است، session دیگر نمی‌تواند داخل آن range سطری INSERT کند.
- بنابراین `SELECT` دوم نمی‌تواند ناگهان سطر مطابق جدید ببیند.

**تفاوت سریع (جدول `TestTable` در SQL Server)**

1. زیر **Repeatable Read**: Session A دو بار select با تأخیر؛ Session B **INSERT** می‌زند → معمولاً موفق → select دوم A ممکن است سطر جدید ببیند (**phantom**).
2. زیر **Serializable**: همان اسکریپت → **INSERT** در Session B **منتظر** می‌ماند → هر دو select در A یکی می‌مانند → **بدون phantom**.

```sql
-- Session A
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
BEGIN TRAN;
SELECT * FROM TestTable;
WAITFOR DELAY '00:00:10';
SELECT * FROM TestTable;  -- همان سطرهای select اول
ROLLBACK;
```

```sql
-- Session B (وسط تأخیر)
INSERT INTO TestTable (Field1, Field2, Field3)
VALUES (100, 100, 100);  -- تا پایان Session A بلوکه است
```

**Snapshot در برابر Serializable (هدف یکی، مکانیزم فرق)**

- هر دو می‌خواهند نتیجه بدون phantom باشد.
- **Serializable** اغلب با **قفل** کار می‌کند (writer ممکن است منتظر بماند).
- **Snapshot** با **row version** کار می‌کند (writer معمولاً جلو می‌رود؛ reader نسخهٔ قدیمی را نگه می‌دارد).

**نکته PostgreSQL:** Repeatable Read از قبل snapshot-based است؛ معمولاً بدون Serializable هم phantom نمی‌بینی — ولی Serializable هنوز برای تعارض‌های write/write تشخیص قوی‌تری می‌دهد.

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
