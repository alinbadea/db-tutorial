# eCommerce Database — Worksheet 8: DELETE Statements

## Learning Objectives
- Write `DELETE` statements to remove specific rows safely
- Understand and respect foreign key constraint order
- Use `DELETE ... FROM ... JOIN` to delete rows based on related table data
- Know the differences between `DELETE` and `TRUNCATE TABLE`

---

## DELETE Syntax

```sql
DELETE FROM table_name
WHERE condition;
```

> **WARNING — No WHERE Clause = All Rows Deleted**
>
> `DELETE FROM Orders` without a `WHERE` clause removes **every row** in the Orders table. Always write and verify your `WHERE` clause first. Preview with a SELECT before executing DELETE.

---

## Best Practice: Preview Before Deleting

Write the equivalent SELECT to confirm which rows will be removed:

```sql
-- Preview: which order details will be deleted?
SELECT * FROM OrderDetails WHERE OrderID = 3;

-- Only then delete
DELETE FROM OrderDetails WHERE OrderID = 3;
```

---

## Basic DELETE — Single Row

```sql
-- Delete a specific order detail by its primary key
DELETE FROM OrderDetails WHERE OrderDetailID = 7;

-- Delete a specific order (only safe if OrderDetails are removed first)
DELETE FROM Orders WHERE OrderID = 5;

-- Delete a product (only safe if no OrderDetails reference it)
DELETE FROM Products WHERE ProductID = 8;
```

---

## DELETE Multiple Rows with WHERE

### IN clause

```sql
-- Delete all order details belonging to orders 4 and 5
DELETE FROM OrderDetails
WHERE OrderID IN (4, 5);

-- Delete all Cancelled orders
DELETE FROM Orders
WHERE Status = 'Cancelled';
```

### BETWEEN

```sql
-- Delete order details for a range of OrderDetailIDs
DELETE FROM OrderDetails
WHERE OrderDetailID BETWEEN 8 AND 10;
```

### LIKE

```sql
-- Delete clients whose email domain is '@testdomain.com'
DELETE FROM Clients
WHERE Email LIKE '%@testdomain.com';
```

### Compound conditions

```sql
-- Delete Pending orders older than 30 days
DELETE FROM Orders
WHERE  Status = 'Pending'
AND    OrderDate < DATEADD(DAY, -30, GETDATE());
```

---

## DELETE with Subquery in WHERE

```sql
-- Delete all order details for Cancelled orders
DELETE FROM OrderDetails
WHERE OrderID IN (
    SELECT OrderID FROM Orders WHERE Status = 'Cancelled'
);

-- Delete products that have never been ordered
DELETE FROM Products
WHERE ProductID NOT IN (
    SELECT DISTINCT ProductID FROM OrderDetails
);

-- Delete clients who registered more than 2 years ago and have never placed an order
DELETE FROM Clients
WHERE ClientID NOT IN (SELECT DISTINCT ClientID FROM Orders)
AND   CreatedDate < DATEADD(YEAR, -2, GETDATE());
```

---

## DELETE with JOIN (T-SQL FROM Clause)

In T-SQL you can join tables in a DELETE to delete rows from one table based on conditions in another.

**Syntax:**
```sql
DELETE alias_of_table_to_delete
FROM   TableToDelete AS alias_of_table_to_delete
INNER JOIN OtherTable AS other ON join_condition
WHERE  optional_filter;
```

### Example 1 — Delete OrderDetails for all Cancelled orders (JOIN version)

```sql
-- Preview
SELECT od.OrderDetailID, od.OrderID, o.Status
FROM   OrderDetails AS od
INNER JOIN Orders AS o ON od.OrderID = o.OrderID
WHERE  o.Status = 'Cancelled';

-- Delete
DELETE od
FROM   OrderDetails AS od
INNER JOIN Orders AS o ON od.OrderID = o.OrderID
WHERE  o.Status = 'Cancelled';
```

### Example 2 — Delete orders placed by clients from a specific country

```sql
-- First delete the child rows (OrderDetails)
DELETE od
FROM   OrderDetails AS od
INNER JOIN Orders   AS o  ON od.OrderID  = o.OrderID
INNER JOIN Clients  AS cl ON o.ClientID  = cl.ClientID
WHERE  cl.Country = 'TestCountry';

-- Then delete the parent rows (Orders)
DELETE o
FROM   Orders   AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
WHERE  cl.Country = 'TestCountry';
```

### Example 3 — Anti-join DELETE: delete products that belong to categories with no name starting with a letter

```sql
-- Delete products whose category name starts with 'Z'
DELETE p
FROM   Products    AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
WHERE  c.CategoryName LIKE 'Z%';
```

### Example 4 — Delete order details where the product no longer exists (orphan cleanup)

```sql
-- Find orphan order details (product was deleted outside FK constraints)
SELECT od.OrderDetailID
FROM   OrderDetails AS od
LEFT JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  p.ProductID IS NULL;

-- Delete them
DELETE od
FROM   OrderDetails AS od
LEFT JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  p.ProductID IS NULL;
```

---

## Respecting Foreign Key Constraints

You cannot delete a parent row if child rows reference it. The database will throw a FK constraint violation error.

**Correct deletion order for eCommerceDB (most-child to most-parent):**

```
1. OrderDetails   (references Orders and Products)
2. Orders         (references Clients)
3. Products       (references Categories)
4. Clients        (no FK dependencies from other tables — safe to delete)
5. Categories     (no FK dependencies from other tables — safe to delete)
```

### Complete client removal example

```sql
-- Safely delete client with ClientID = 2 and all their related data
-- Step 1: delete order details for this client's orders
DELETE od
FROM   OrderDetails AS od
INNER JOIN Orders AS o ON od.OrderID = o.OrderID
WHERE  o.ClientID = 2;

-- Step 2: delete the orders
DELETE FROM Orders WHERE ClientID = 2;

-- Step 3: now safe to delete the client
DELETE FROM Clients WHERE ClientID = 2;
```

---

## TRUNCATE TABLE vs DELETE

| Feature | DELETE | TRUNCATE |
|---|---|---|
| `WHERE` clause | Supported | Not supported |
| Speed | Slower (row-by-row logging) | Faster (minimal logging) |
| Resets IDENTITY counter | No | Yes |
| Can be rolled back | Yes (inside a transaction) | Yes (inside a transaction) |
| Works with FK constraints | Yes (if child rows deleted first) | No (fails if FK references exist) |
| Fires `DELETE` triggers | Yes | No |

```sql
-- DELETE: removes specific rows, keeps identity seed
DELETE FROM OrderDetails WHERE OrderID = 99;

-- TRUNCATE: removes ALL rows, resets identity to seed value
TRUNCATE TABLE OrderDetails;
-- Error if OrderDetails is referenced by a FK from another table
```

---

## DELETE with OUTPUT Clause

Capture the deleted rows before they are gone:

```sql
-- Delete old pending orders and capture what was deleted
DECLARE @Deleted TABLE (
    OrderID   INT,
    ClientID  INT,
    OrderDate DATETIME,
    Status    NVARCHAR(50)
);

DELETE FROM Orders
OUTPUT DELETED.OrderID, DELETED.ClientID, DELETED.OrderDate, DELETED.Status
INTO   @Deleted
WHERE  Status = 'Pending'
AND    OrderDate < DATEADD(DAY, -90, GETDATE());

SELECT * FROM @Deleted;
```

---

## The Soft Delete Pattern (Alternative)

Instead of physically removing rows, mark them as deleted with a flag column. This preserves history and allows recovery.

```sql
-- Add an IsDeleted flag to Clients
ALTER TABLE Clients ADD IsDeleted BIT NOT NULL DEFAULT 0;

-- "Delete" a client
UPDATE Clients SET IsDeleted = 1 WHERE ClientID = 3;

-- Query: only show active clients
SELECT * FROM Clients WHERE IsDeleted = 0;
```

**Trade-offs:** History is preserved and records can be recovered. However, all queries must filter on `IsDeleted = 0`, and the table grows indefinitely.

---

## Transactions for Safety

```sql
BEGIN TRANSACTION;

-- Delete a complete order and its details
DELETE FROM OrderDetails WHERE OrderID = 1;
DELETE FROM Orders       WHERE OrderID = 1;

-- Review: check that both are gone
SELECT * FROM Orders       WHERE OrderID = 1;
SELECT * FROM OrderDetails WHERE OrderID = 1;

-- If correct:
COMMIT TRANSACTION;
-- If something went wrong:
-- ROLLBACK TRANSACTION;
```

---

## Common Mistakes

```sql
-- MISTAKE 1: Missing WHERE (deletes ALL rows)
DELETE FROM Orders;    -- deletes everything!

-- MISTAKE 2: Wrong deletion order (FK violation)
DELETE FROM Orders WHERE OrderID = 1;
-- Error: The DELETE statement conflicted with the REFERENCE constraint
-- "FK_OrderDetails_Orders". You must delete OrderDetails first.

-- CORRECT: child rows first
DELETE FROM OrderDetails WHERE OrderID = 1;
DELETE FROM Orders       WHERE OrderID = 1;

-- MISTAKE 3: TRUNCATE with active FK references
TRUNCATE TABLE Orders;
-- Error: Cannot truncate table 'Orders' because it is being referenced by a FK.
```

---

## Practice Exercises

**Exercise 1**
Delete the order detail with `OrderDetailID = 10`.

**Exercise 2**
Delete all order details for orders with `Status = 'Cancelled'`. Use a subquery in the `WHERE` clause.

**Exercise 3**
Using `DELETE ... FROM ... JOIN`, delete all `OrderDetails` rows for orders placed by clients from `'Germany'`.

**Exercise 4**
Delete a complete order: first remove all its `OrderDetails`, then remove the `Order` row itself. Use `OrderID = 6`.

**Exercise 5**
Delete all products that have never appeared in any `OrderDetails` row. Use a subquery.

**Exercise 6**
Using `DELETE ... FROM ... JOIN`, remove all clients who have no orders AND whose `CreatedDate` is more than 1 year ago. (Delete them directly — no FK children to worry about because they have no orders.)

**Exercise 7**
Using `DELETE` with `OUTPUT`, delete all `Pending` orders and capture the `OrderID`, `ClientID`, and `OrderDate` of each deleted row into a table variable. Display the results.

**Exercise 8**
Explain the difference between `DELETE FROM Products` and `TRUNCATE TABLE Products`. In which situations would you choose each, and what would happen to the IDENTITY counter in each case?
