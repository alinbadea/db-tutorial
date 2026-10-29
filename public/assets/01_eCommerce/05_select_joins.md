# eCommerce Database — Worksheet 5: SELECT — JOINs

## Learning Objectives
- Understand why JOINs are needed and how they work
- Write INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN queries
- Join three or more tables in a single query
- Use table aliases for cleaner, shorter queries
- Find records that have no matching rows in a related table

---

## Why JOINs?

Normalization splits data across multiple tables to eliminate redundancy. JOINs reassemble that data at query time. Without JOINs, you would have to run separate queries and manually match rows in your application code.

Example of the problem: an `OrderDetails` row stores a `ProductID` but not the product name or price. To see the product name alongside the quantity, you need a JOIN.

---

## JOIN Types — Overview

| JOIN Type | Returns |
|---|---|
| `INNER JOIN` | Only rows with a match in **both** tables |
| `LEFT JOIN` | All rows from the left table + matching rows from the right (NULL where no match) |
| `RIGHT JOIN` | All rows from the right table + matching rows from the left (NULL where no match) |
| `FULL OUTER JOIN` | All rows from both tables, NULLs on whichever side has no match |

---

## Table Aliases

Long table names get tedious when joining. Assign a short alias after the table name:

```sql
-- Without aliases (hard to read)
SELECT Products.ProductName, Categories.CategoryName
FROM   Products
INNER JOIN Categories ON Products.CategoryID = Categories.CategoryID;

-- With aliases (cleaner)
SELECT p.ProductName, c.CategoryName
FROM   Products   AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID;
```

Always qualify column names with their alias when joining to avoid ambiguity errors.

---

## INNER JOIN

Returns only rows where the JOIN condition is true in both tables. Rows from either side with no match are excluded.

### Example 1 — Products with their category name

```sql
SELECT
    p.ProductID,
    p.ProductName,
    p.Price,
    c.CategoryName
FROM   Products   AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName, p.ProductName;
```

### Example 2 — Orders with the client's full name

```sql
SELECT
    o.OrderID,
    o.OrderDate,
    o.Status,
    o.TotalAmount,
    cl.FirstName + ' ' + cl.LastName AS ClientName,
    cl.City
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
ORDER BY o.OrderDate DESC;
```

### Example 3 — Order details with product name and order date (3 tables)

```sql
SELECT
    o.OrderID,
    o.OrderDate,
    p.ProductName,
    od.Quantity,
    od.UnitPrice,
    od.Quantity * od.UnitPrice AS LineTotal
FROM   OrderDetails AS od
INNER JOIN Orders    AS o  ON od.OrderID   = o.OrderID
INNER JOIN Products  AS p  ON od.ProductID = p.ProductID
ORDER BY o.OrderID, p.ProductName;
```

### Example 4 — Full order receipt (all 4 tables)

```sql
SELECT
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    cl.City,
    o.OrderID,
    o.OrderDate,
    o.Status,
    c.CategoryName,
    p.ProductName,
    od.Quantity,
    od.UnitPrice,
    od.Quantity * od.UnitPrice         AS LineTotal
FROM   OrderDetails AS od
INNER JOIN Orders      AS o  ON od.OrderID    = o.OrderID
INNER JOIN Clients     AS cl ON o.ClientID    = cl.ClientID
INNER JOIN Products    AS p  ON od.ProductID  = p.ProductID
INNER JOIN Categories  AS c  ON p.CategoryID  = c.CategoryID
ORDER BY o.OrderID, p.ProductName;
```

---

## LEFT OUTER JOIN (LEFT JOIN)

Returns **all** rows from the left table. For rows in the left table with no matching row in the right table, right-side columns are filled with `NULL`.

### Example 1 — Clients and their orders (including clients who never ordered)

```sql
SELECT
    cl.ClientID,
    cl.FirstName + ' ' + cl.LastName AS ClientName,
    o.OrderID,
    o.OrderDate,
    o.Status
FROM   Clients AS cl
LEFT JOIN Orders AS o ON cl.ClientID = o.ClientID
ORDER BY cl.ClientID;
```

Clients with no orders will appear with `NULL` in the OrderID, OrderDate, and Status columns.

### Example 2 — Products and how many times they have been ordered

```sql
SELECT
    p.ProductName,
    p.Price,
    COUNT(od.OrderDetailID) AS TimesOrdered
FROM   Products     AS p
LEFT JOIN OrderDetails AS od ON p.ProductID = od.ProductID
GROUP BY p.ProductID, p.ProductName, p.Price
ORDER BY TimesOrdered DESC;
```

### Anti-join — Find clients who have NEVER placed an order

```sql
SELECT cl.ClientID, cl.FirstName, cl.LastName, cl.Email
FROM   Clients AS cl
LEFT JOIN Orders AS o ON cl.ClientID = o.ClientID
WHERE  o.OrderID IS NULL;
```

**How it works:** The LEFT JOIN includes all clients. The `WHERE o.OrderID IS NULL` keeps only those whose match in `Orders` was missing.

---

## RIGHT OUTER JOIN (RIGHT JOIN)

Returns all rows from the right table. Equivalent to a LEFT JOIN with the tables swapped — most developers prefer LEFT JOINs for consistency.

```sql
-- All categories, including those with no products yet
SELECT
    c.CategoryName,
    p.ProductName,
    p.Price
FROM   Products    AS p
RIGHT JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName;
```

Categories with no products will appear with `NULL` in `ProductName` and `Price`.

---

## FULL OUTER JOIN

Returns all rows from both tables. Rows with no match on either side receive NULLs for the other table's columns.

```sql
-- All products and all categories, showing unmatched on both sides
SELECT
    p.ProductName,
    c.CategoryName
FROM   Products    AS p
FULL OUTER JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName, p.ProductName;
```

---

## Joining All Tables in One Query

A single comprehensive query reporting every order line with all related details:

```sql
SELECT
    cl.ClientID,
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    cl.Country,
    o.OrderID,
    CONVERT(NVARCHAR(10), o.OrderDate, 103) AS OrderDate,
    o.Status,
    c.CategoryName,
    p.ProductName,
    od.Quantity,
    od.UnitPrice,
    od.Quantity * od.UnitPrice          AS LineTotal,
    o.TotalAmount                       AS OrderTotal
FROM   OrderDetails AS od
INNER JOIN Orders     AS o  ON od.OrderID   = o.OrderID
INNER JOIN Clients    AS cl ON o.ClientID   = cl.ClientID
INNER JOIN Products   AS p  ON od.ProductID = p.ProductID
INNER JOIN Categories AS c  ON p.CategoryID = c.CategoryID
ORDER BY o.OrderID, od.OrderDetailID;
```

---

## Common Mistakes

```sql
-- MISTAKE 1: Cartesian product — forgot the ON clause
-- This returns every product combined with every category (dangerous!)
SELECT p.ProductName, c.CategoryName
FROM   Products AS p
INNER JOIN Categories AS c;   -- Error: ON clause is required

-- MISTAKE 2: Ambiguous column name — both tables have 'Email'
SELECT ClientID, Email          -- Which table? SQL Server will throw an error
FROM   Clients
INNER JOIN Orders ON Clients.ClientID = Orders.ClientID;

-- CORRECT: qualify every column that exists in more than one table
SELECT cl.ClientID, cl.Email, o.OrderID
FROM   Clients AS cl
INNER JOIN Orders AS o ON cl.ClientID = o.ClientID;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
List every product together with its category name. Show `ProductName`, `Price`, and `CategoryName`. Sort by `CategoryName`.

**Exercise 2 (Easy)**
Show `OrderID`, `OrderDate`, `Status`, and the full name of the client who placed each order.

**Exercise 3 (Medium)**
For each order detail, show `OrderID`, `ClientName` (full), `ProductName`, `Quantity`, and `LineTotal` (Quantity × UnitPrice). Sort by `OrderID`.

**Exercise 4 (Medium)**
Find all clients who have **never** placed an order. Show their `ClientID`, full name, and `Email`.

**Exercise 5 (Medium)**
List all categories together with the number of products in each. Include categories that have zero products. Show `CategoryName` and a column called `ProductCount`.

**Exercise 6 (Medium)**
Show all products together with the total quantity ever sold (sum of `Quantity` from `OrderDetails`). Include products that have never been sold (show 0 or NULL). Sort by total sold descending.

**Exercise 7 (Hard)**
Write a query that shows, for each client, their `FullName`, `City`, the number of orders they have placed (`OrderCount`), and the sum of all their order totals (`TotalSpent`). Only include clients who have at least one order. Sort by `TotalSpent` descending.

**Exercise 8 (Hard)**
List all order lines where the `UnitPrice` charged differs from the current `Price` in the `Products` table. Show `OrderID`, `ProductName`, `UnitPrice` (as charged), and `CurrentPrice` (from Products). This could indicate price changes since the order was placed.

---

## Answers

**Exercise 1**
```sql
SELECT p.ProductName, p.Price, c.CategoryName
FROM   Products AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName;
```

**Exercise 2**
```sql
SELECT o.OrderID, o.OrderDate, o.Status,
       cl.FirstName + ' ' + cl.LastName AS ClientName
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID;
```

**Exercise 3**
```sql
SELECT o.OrderID, cl.FirstName + ' ' + cl.LastName AS ClientName,
       p.ProductName, od.Quantity,
       od.Quantity * od.UnitPrice AS LineTotal
FROM   OrderDetails AS od
INNER JOIN Orders   AS o  ON od.OrderID   = o.OrderID
INNER JOIN Clients  AS cl ON o.ClientID   = cl.ClientID
INNER JOIN Products AS p  ON od.ProductID = p.ProductID
ORDER BY o.OrderID;
```

**Exercise 4**
```sql
SELECT cl.ClientID, cl.FirstName + ' ' + cl.LastName AS FullName, cl.Email
FROM   Clients AS cl
LEFT JOIN Orders AS o ON cl.ClientID = o.ClientID
WHERE  o.OrderID IS NULL;
```

**Exercise 5**
```sql
SELECT c.CategoryName, COUNT(p.ProductID) AS ProductCount
FROM   Categories AS c
LEFT JOIN Products AS p ON c.CategoryID = p.CategoryID
GROUP BY c.CategoryID, c.CategoryName
ORDER BY ProductCount DESC;
```

**Exercise 6**
```sql
SELECT p.ProductName, COALESCE(SUM(od.Quantity), 0) AS TotalSold
FROM   Products     AS p
LEFT JOIN OrderDetails AS od ON p.ProductID = od.ProductID
GROUP BY p.ProductID, p.ProductName
ORDER BY TotalSold DESC;
```

**Exercise 7**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName, cl.City,
       COUNT(o.OrderID)     AS OrderCount,
       SUM(o.TotalAmount)   AS TotalSpent
FROM   Clients AS cl
INNER JOIN Orders AS o ON cl.ClientID = o.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName, cl.City
ORDER BY TotalSpent DESC;
```

**Exercise 8**
```sql
SELECT o.OrderID, p.ProductName,
       od.UnitPrice AS ChargedPrice,
       p.Price      AS CurrentPrice
FROM   OrderDetails AS od
INNER JOIN Orders   AS o ON od.OrderID   = o.OrderID
INNER JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  od.UnitPrice <> p.Price;
```
