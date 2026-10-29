# eCommerce Database — Worksheet 7: UPDATE Statements

## Learning Objectives
- Write `UPDATE` statements to change single and multiple columns
- Always apply a `WHERE` clause to avoid updating every row
- Use subqueries and JOINs inside `UPDATE` to target rows based on related data
- Capture before/after values with the `OUTPUT` clause

---

## UPDATE Syntax

```sql
UPDATE table_name
SET    column1 = value1,
       column2 = value2
WHERE  condition;
```

> **WARNING — No WHERE Clause = All Rows Updated**
>
> Running `UPDATE Products SET Price = 0` without a `WHERE` clause sets the price of **every single product** to zero. Always write the WHERE clause before writing the SET clause. When in doubt, run the equivalent SELECT first.

---

## Best Practice: Preview Before Updating

Before executing an UPDATE, write the equivalent SELECT to verify which rows will be affected:

```sql
-- Preview: which orders will be updated?
SELECT OrderID, Status FROM Orders WHERE Status = 'Pending';

-- Then run the UPDATE
UPDATE Orders
SET    Status = 'Processing'
WHERE  Status = 'Pending';
```

---

## Basic UPDATE — Single Column

```sql
-- Change a product's price
UPDATE Products
SET    Price = 34.99
WHERE  ProductID = 1;

-- Mark an order as Shipped
UPDATE Orders
SET    Status = 'Shipped'
WHERE  OrderID = 2;

-- Update a client's city
UPDATE Clients
SET    City = 'Manchester'
WHERE  ClientID = 1;
```

---

## UPDATE Multiple Columns at Once

Separate multiple SET assignments with commas:

```sql
-- Update both price and stock for a product
UPDATE Products
SET    Price = 27.99,
       Stock = 200
WHERE  ProductID = 1;

-- Update a client's address details in one statement
UPDATE Clients
SET    Address = '45 High Street',
       City    = 'Edinburgh',
       Country = 'UK'
WHERE  ClientID = 3;
```

---

## UPDATE with Complex WHERE Conditions

### IN clause

```sql
-- Apply a 10% discount to all Books and Sports products
UPDATE Products
SET    Price = Price * 0.90
WHERE  CategoryID IN (
    SELECT CategoryID FROM Categories
    WHERE  CategoryName IN ('Books', 'Sports')
);
```

### BETWEEN

```sql
-- Flag orders placed in January 2024 as archived (hypothetical Status value)
UPDATE Orders
SET    Status = 'Archived'
WHERE  OrderDate BETWEEN '2024-01-01' AND '2024-01-31'
AND    Status = 'Delivered';
```

### LIKE

```sql
-- Fix a typo in all emails ending in '@mail.con'
UPDATE Clients
SET    Email = REPLACE(Email, '@mail.con', '@mail.com')
WHERE  Email LIKE '%@mail.con';
```

---

## UPDATE with Subquery in WHERE

```sql
-- Cancel all Pending orders for clients from Romania
UPDATE Orders
SET    Status = 'Cancelled'
WHERE  Status = 'Pending'
AND    ClientID IN (
    SELECT ClientID FROM Clients WHERE Country = 'Romania'
);

-- Increase stock for products that have never been ordered
UPDATE Products
SET    Stock = Stock + 50
WHERE  ProductID NOT IN (
    SELECT DISTINCT ProductID FROM OrderDetails
);
```

---

## UPDATE with Subquery in SET

Derive the new value from a correlated subquery:

```sql
-- Recalculate TotalAmount for every order from its OrderDetails rows
UPDATE Orders
SET    TotalAmount = (
    SELECT SUM(Quantity * UnitPrice)
    FROM   OrderDetails
    WHERE  OrderDetails.OrderID = Orders.OrderID
);
```

---

## UPDATE with JOIN (T-SQL FROM Clause)

T-SQL allows you to join tables in an UPDATE to derive update values or conditions from a related table. This is a powerful T-SQL feature.

**Syntax:**
```sql
UPDATE  alias_of_table_to_update
SET     alias_of_table_to_update.column = expression
FROM    TableToUpdate AS alias_of_table_to_update
INNER JOIN OtherTable AS alias ON join_condition
WHERE   optional_filter;
```

### Example 1 — Sync UnitPrice in OrderDetails with current product prices

```sql
-- Preview first
SELECT od.OrderDetailID, od.UnitPrice AS OldPrice, p.Price AS NewPrice
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  od.UnitPrice <> p.Price;

-- Update
UPDATE od
SET    od.UnitPrice = p.Price
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  od.UnitPrice <> p.Price;
```

### Example 2 — Apply a 15% discount to products in categories ordered by high-value clients

```sql
-- Preview: which products belong to categories where total sales > 200?
SELECT p.ProductID, p.ProductName, p.Price, total.TotalSold
FROM   Products AS p
INNER JOIN (
    SELECT p2.CategoryID, SUM(od.Quantity * od.UnitPrice) AS TotalSold
    FROM   OrderDetails AS od
    INNER JOIN Products AS p2 ON od.ProductID = p2.ProductID
    GROUP BY p2.CategoryID
    HAVING SUM(od.Quantity * od.UnitPrice) > 200
) AS total ON p.CategoryID = total.CategoryID;

-- Update
UPDATE p
SET    p.Price = p.Price * 0.85
FROM   Products AS p
INNER JOIN (
    SELECT p2.CategoryID
    FROM   OrderDetails AS od
    INNER JOIN Products AS p2 ON od.ProductID = p2.ProductID
    GROUP BY p2.CategoryID
    HAVING SUM(od.Quantity * od.UnitPrice) > 200
) AS hot_categories ON p.CategoryID = hot_categories.CategoryID;
```

### Example 3 — Set ShippingAddress from the client's registered address for orders that have none

```sql
-- Preview
SELECT o.OrderID, o.ShippingAddress, cl.Address + ', ' + cl.City AS ClientAddr
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
WHERE  o.ShippingAddress IS NULL;

-- Update
UPDATE o
SET    o.ShippingAddress = cl.Address + ', ' + cl.City + ', ' + cl.Country
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
WHERE  o.ShippingAddress IS NULL;
```

### Example 4 — LEFT JOIN for conditional update (only update if a match exists)

```sql
-- Reduce stock for each product that has been sold, by the total units sold
-- LEFT JOIN so products with no sales keep their current stock
UPDATE p
SET    p.Stock = p.Stock - ISNULL(sold.TotalSold, 0)
FROM   Products AS p
LEFT JOIN (
    SELECT ProductID, SUM(Quantity) AS TotalSold
    FROM   OrderDetails
    GROUP BY ProductID
) AS sold ON p.ProductID = sold.ProductID;
```

---

## UPDATE with OUTPUT Clause

`OUTPUT` captures the state of rows before and after the update.

```sql
-- Update status and see old and new values
UPDATE Orders
SET    Status = 'Delivered'
OUTPUT DELETED.OrderID,
       DELETED.Status  AS OldStatus,
       INSERTED.Status AS NewStatus
WHERE  Status = 'Shipped';
```

Save the captured changes to an audit table:

```sql
DECLARE @AuditLog TABLE (
    OrderID   INT,
    OldStatus NVARCHAR(50),
    NewStatus NVARCHAR(50),
    ChangedAt DATETIME DEFAULT GETDATE()
);

UPDATE Orders
SET    Status = 'Delivered'
OUTPUT DELETED.OrderID, DELETED.Status, INSERTED.Status
INTO   @AuditLog (OrderID, OldStatus, NewStatus)
WHERE  Status = 'Shipped';

SELECT * FROM @AuditLog;
```

---

## Transactions for Safety

Wrap a risky UPDATE in a transaction so you can roll it back if something looks wrong:

```sql
BEGIN TRANSACTION;

UPDATE Products
SET    Price = Price * 1.10
WHERE  CategoryID = 1;

-- Review the result before committing
SELECT ProductID, ProductName, Price FROM Products WHERE CategoryID = 1;

-- If it looks right:
COMMIT TRANSACTION;

-- If something is wrong:
-- ROLLBACK TRANSACTION;
```

---

## Common Mistakes

```sql
-- MISTAKE 1: No WHERE clause (updates ALL products)
UPDATE Products SET Price = 9.99;   -- DANGER

-- MISTAKE 2: Updating the wrong alias in a FROM/JOIN update
UPDATE od                           -- correct alias — this is the table being updated
SET    od.UnitPrice = p.Price
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID;

-- If you accidentally wrote:
UPDATE p                            -- WRONG — this would update Products, not OrderDetails
SET    p.Price = od.UnitPrice
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID;
```

---

## Practice Exercises

**Exercise 1**
Update the `Stock` of the product with `ProductID = 3` to `25`.

**Exercise 2**
Increase the price of all products in the `Clothing` category by 5%.

**Exercise 3**
Set the `Status` of all orders placed by the client with `ClientID = 2` that are currently `'Pending'` to `'Cancelled'`.

**Exercise 4**
Using a subquery in `WHERE`, update all `OrderDetails` rows to set `Quantity = 1` where the order's `Status` is `'Cancelled'`.

**Exercise 5**
Using `UPDATE ... FROM ... JOIN`, update the `TotalAmount` of every order to equal the sum of `Quantity * UnitPrice` from its `OrderDetails` rows. (Recalculate from scratch.)

**Exercise 6**
Using `UPDATE ... FROM ... JOIN`, set the `Description` of every product to include its category name as a prefix, e.g. `'[Electronics] Wireless Mouse'`. Join `Products` and `Categories`.

**Exercise 7**
Using `UPDATE` with `OUTPUT`, change all `'Pending'` orders to `'Processing'` and capture the `OrderID`, old status, and new status in a table variable. Display the table variable contents at the end.

**Exercise 8**
Using a transaction, apply a 20% price increase to all Electronics products, then immediately `SELECT` those products to review the change. Either `COMMIT` or `ROLLBACK` with an explanation.
