# eCommerce Database — Worksheet 3: INSERT Statements

## Learning Objectives
- Write `INSERT` statements using all major T-SQL forms
- Understand why a column list is best practice
- Insert multiple rows in a single statement
- Use `INSERT...SELECT` and the `OUTPUT` clause
- Work correctly with `IDENTITY` columns

---

## INSERT Syntax

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

All parts explained:
- `INSERT INTO` — keyword introducing the target table
- `(column1, column2, ...)` — optional but recommended column list
- `VALUES (...)` — the data to insert

---

## Method 1: INSERT Without a Column List

You omit the column names and supply values in the exact order columns were defined in the table.

```sql
INSERT INTO Categories
VALUES ('Electronics', 'Electronic devices and accessories');
```

> **Warning:** This breaks the moment anyone adds, reorders, or removes a column from the table. It also requires you to supply values for every non-IDENTITY column. Avoid this in production code.

---

## Method 2: INSERT With a Column List (Best Practice)

Always name the columns you are inserting into:

```sql
INSERT INTO Categories (CategoryName, Description)
VALUES ('Electronics', 'Electronic devices and accessories');
```

**Why this is better:**
- Order of columns does not matter
- IDENTITY columns are automatically skipped
- Nullable columns can be omitted (they receive NULL)
- If the table schema changes, the INSERT still works as long as required columns are provided

---

## Method 3: Inserting Multiple Rows in One Statement

T-SQL lets you supply multiple `VALUES` clauses separated by commas:

```sql
INSERT INTO Categories (CategoryName, Description)
VALUES
    ('Electronics',   'Electronic devices and accessories'),
    ('Books',         'Books and educational materials'),
    ('Sports',        'Sports equipment and apparel'),
    ('Clothing',      'Fashion and everyday clothing'),
    ('Home & Garden', 'Furniture, gardening, and home decor');
```

**Performance benefit:** One network round-trip and one transaction for all rows, which is faster than five separate `INSERT` statements.

---

## Method 4: INSERT … SELECT

Insert the results of a query into a table. Useful for copying data, populating from a staging table, or deriving rows from existing data.

```sql
-- Copy all Electronics products to an ArchiveProducts table
INSERT INTO ArchiveProducts (ProductName, Price, Stock)
SELECT ProductName, Price, Stock
FROM   Products
WHERE  CategoryID = (SELECT CategoryID FROM Categories WHERE CategoryName = 'Electronics');
```

Using a CTE (Common Table Expression) to build the inserted rows:

```sql
-- Recalculate TotalAmount for each order from its detail rows
WITH OrderTotals AS (
    SELECT OrderID, SUM(Quantity * UnitPrice) AS Calculated
    FROM   OrderDetails
    GROUP  BY OrderID
)
UPDATE Orders
SET    TotalAmount = ot.Calculated
FROM   Orders o
JOIN   OrderTotals ot ON o.OrderID = ot.OrderID;
```

---

## IDENTITY Columns

`IDENTITY(seed, increment)` tells SQL Server to generate the PK value automatically.

- `seed` — the value for the first row (usually 1)
- `increment` — how much to add for each new row (usually 1)

**You never include an IDENTITY column in an INSERT.** SQL Server fills it in automatically.

```sql
-- Correct: CategoryID is omitted; SQL Server assigns it
INSERT INTO Categories (CategoryName, Description)
VALUES ('Toys', 'Children toys and games');

-- Retrieve the ID just generated (scope-safe)
SELECT SCOPE_IDENTITY();          -- recommended: ID from this session and scope
SELECT @@IDENTITY;                 -- ID from this session (any scope — avoid if triggers exist)
SELECT IDENT_CURRENT('Categories'); -- most recent ID inserted into that table by anyone
```

---

## SET IDENTITY_INSERT

Occasionally you need to supply a specific PK value (e.g., restoring from a backup or filling a gap). Enable this temporarily:

```sql
SET IDENTITY_INSERT Categories ON;

INSERT INTO Categories (CategoryID, CategoryName, Description)
VALUES (99, 'Legacy', 'Old category for migration purposes');

SET IDENTITY_INSERT Categories OFF;
```

> **Important:** Only one table at a time can have `IDENTITY_INSERT ON` within a session. Always turn it OFF when done.

---

## INSERT with OUTPUT Clause

`OUTPUT` lets you capture the rows that were just inserted, including auto-generated IDENTITY values.

```sql
-- Capture the new CategoryID immediately after inserting
INSERT INTO Categories (CategoryName, Description)
OUTPUT INSERTED.CategoryID, INSERTED.CategoryName
VALUES ('Automotive', 'Car accessories and parts');
```

Save the output into a table variable:

```sql
DECLARE @NewIDs TABLE (CategoryID INT, CategoryName NVARCHAR(100));

INSERT INTO Categories (CategoryName, Description)
OUTPUT INSERTED.CategoryID, INSERTED.CategoryName
INTO   @NewIDs
VALUES ('Automotive', 'Car accessories and parts');

SELECT * FROM @NewIDs;
```

---

## Complete Sample Data Script

Run this script after creating the database with Worksheet 2. Insert in the correct FK order: Categories → Clients → Products → Orders → OrderDetails.

```sql
USE eCommerceDB;
GO

-- ===========================
-- Categories (5 rows)
-- ===========================
INSERT INTO Categories (CategoryName, Description)
VALUES
    ('Electronics',   'Electronic devices and accessories'),
    ('Books',         'Books and educational materials'),
    ('Sports',        'Sports equipment and apparel'),
    ('Clothing',      'Fashion and everyday clothing'),
    ('Home & Garden', 'Furniture, gardening, and home decor');
GO

-- ===========================
-- Clients (6 rows)
-- ===========================
INSERT INTO Clients (FirstName, LastName, Email, Phone, Address, City, Country)
VALUES
    ('John',    'Smith',    'john.smith@mail.com',    '555-0101', '12 Baker Street',   'London',    'UK'),
    ('Maria',   'Garcia',   'maria.garcia@mail.com',  '555-0202', 'Calle Mayor 5',     'Madrid',    'Spain'),
    ('Ana',     'Popescu',  'ana.popescu@mail.com',   '555-0303', 'Str. Unirii 7',     'Bucharest', 'Romania'),
    ('Luca',    'Rossi',    'luca.rossi@mail.com',    '555-0404', 'Via Roma 22',       'Rome',      'Italy'),
    ('Sophie',  'Dubois',   'sophie.dubois@mail.com', '555-0505', '3 Rue de Rivoli',   'Paris',     'France'),
    ('Tobias',  'Müller',   'tobias.muller@mail.com', '555-0606', 'Hauptstrasse 10',   'Berlin',    'Germany');
GO

-- ===========================
-- Products (8 rows)
-- ===========================
INSERT INTO Products (ProductName, Description, Price, Stock, CategoryID)
VALUES
    ('Wireless Mouse',       'Ergonomic 2.4GHz wireless mouse',          29.99,  150, 1),
    ('USB Mechanical Keyboard','Full-size mechanical keyboard, RGB',      74.99,   80, 1),
    ('27" Monitor',          '4K IPS panel, 144Hz refresh rate',         399.99,  30, 1),
    ('SQL Server 2022 Guide','Comprehensive T-SQL programming book',       59.99,   45, 2),
    ('Clean Code',           'Best practices for software development',   39.99,   60, 2),
    ('Running Shoes',        'Lightweight trail running shoes',            89.99,   55, 3),
    ('Cotton T-Shirt',       'Classic crew-neck cotton t-shirt',          19.99,  200, 4),
    ('Garden Hoe',           'Steel blade garden hoe, 140cm handle',      24.99,   70, 5);
GO

-- ===========================
-- Orders (6 rows)
-- ===========================
INSERT INTO Orders (ClientID, OrderDate, ShippingAddress, Status)
VALUES
    (1, '2024-01-10', '12 Baker Street, London, UK',        'Delivered'),
    (2, '2024-01-11', 'Calle Mayor 5, Madrid, Spain',       'Shipped'),
    (1, '2024-01-14', '12 Baker Street, London, UK',        'Pending'),
    (3, '2024-01-15', 'Str. Unirii 7, Bucharest, Romania',  'Delivered'),
    (4, '2024-01-17', 'Via Roma 22, Rome, Italy',           'Processing'),
    (5, '2024-01-18', '3 Rue de Rivoli, Paris, France',     'Pending');
GO

-- ===========================
-- OrderDetails (10 rows)
-- ===========================
INSERT INTO OrderDetails (OrderID, ProductID, Quantity, UnitPrice)
VALUES
    (1, 1, 2,  29.99),   -- Order 1: 2x Wireless Mouse
    (1, 2, 1,  74.99),   -- Order 1: 1x USB Keyboard
    (2, 4, 1,  59.99),   -- Order 2: 1x SQL Server 2022 Guide
    (2, 5, 2,  39.99),   -- Order 2: 2x Clean Code
    (3, 6, 1,  89.99),   -- Order 3: 1x Running Shoes
    (3, 7, 3,  19.99),   -- Order 3: 3x Cotton T-Shirt
    (4, 1, 1,  29.99),   -- Order 4: 1x Wireless Mouse
    (4, 3, 1, 399.99),   -- Order 4: 1x 27" Monitor
    (5, 2, 2,  74.99),   -- Order 5: 2x USB Keyboard
    (6, 8, 1,  24.99);   -- Order 6: 1x Garden Hoe
GO

-- Update TotalAmount based on actual order details
UPDATE o
SET o.TotalAmount = totals.Total
FROM Orders o
JOIN (
    SELECT OrderID, SUM(Quantity * UnitPrice) AS Total
    FROM   OrderDetails
    GROUP  BY OrderID
) AS totals ON o.OrderID = totals.OrderID;
GO
```

---

## Practice Exercises

**Exercise 1**
Write an `INSERT` statement to add a new category called `"Automotive"` with the description `"Car parts and accessories"`. Retrieve the auto-generated `CategoryID` immediately after.

**Exercise 2**
Write a single `INSERT` statement that adds three new clients at once: one from New York (USA), one from Tokyo (Japan), and one from Sydney (Australia). Include only the required fields.

**Exercise 3**
Using `INSERT...SELECT`, write a query that inserts into an `ArchiveOrders` table (assume it has the same structure as `Orders`) all orders whose `Status` is `'Cancelled'`.

**Exercise 4**
An order has been manually placed in an external system and given `OrderID = 1000`. Write the statements to insert it into the `Orders` table with that specific ID, then insert two `OrderDetails` rows for it.

**Exercise 5**
Write an `INSERT` with an `OUTPUT` clause that inserts a new product and returns its auto-generated `ProductID`, `ProductName`, and `Price` in the result set.
