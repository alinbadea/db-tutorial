# eCommerce Database — Worksheet 6: SELECT — Grouping and Aggregates

## Learning Objectives
- Use `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` to summarise data
- Group rows with `GROUP BY` using single and multiple columns
- Filter groups with `HAVING`
- Combine JOINs with aggregation for meaningful business reports

---

## Aggregate Functions

Aggregate functions collapse many rows into a single summary value.

### COUNT

```sql
-- Total number of products
SELECT COUNT(*) AS TotalProducts FROM Products;

-- Number of products that have a description (ignores NULLs)
SELECT COUNT(Description) AS ProductsWithDescription FROM Products;

-- Count per category (used with GROUP BY — see below)
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID;
```

> **COUNT(\*) vs COUNT(column):** `COUNT(*)` counts every row including NULLs. `COUNT(column)` counts only rows where that column is not NULL.

### SUM

```sql
-- Total stock across all products
SELECT SUM(Stock) AS TotalStock FROM Products;

-- Total revenue from all order details
SELECT SUM(Quantity * UnitPrice) AS TotalRevenue FROM OrderDetails;
```

### AVG

```sql
-- Average product price
SELECT AVG(Price) AS AveragePrice FROM Products;

-- Average order total
SELECT AVG(TotalAmount) AS AverageOrderValue FROM Orders;
```

### MIN and MAX

```sql
-- Cheapest and most expensive product
SELECT MIN(Price) AS CheapestPrice, MAX(Price) AS MostExpensivePrice
FROM Products;

-- Earliest and most recent order date
SELECT MIN(OrderDate) AS FirstOrder, MAX(OrderDate) AS LastOrder
FROM Orders;
```

---

## GROUP BY

`GROUP BY` divides rows into groups and applies the aggregate function to each group separately.

**Rule:** Every column in the `SELECT` list that is **not** inside an aggregate function **must** appear in the `GROUP BY` clause.

### Single Column

```sql
-- Number of products per category
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID;

-- Total quantity sold per product
SELECT ProductID, SUM(Quantity) AS TotalSold
FROM   OrderDetails
GROUP BY ProductID;

-- Number of orders per status
SELECT Status, COUNT(*) AS OrderCount
FROM   Orders
GROUP BY Status;

-- Total revenue per order
SELECT OrderID, SUM(Quantity * UnitPrice) AS OrderTotal
FROM   OrderDetails
GROUP BY OrderID
ORDER BY OrderTotal DESC;
```

### Multiple Columns

```sql
-- Number of orders per client per status
SELECT ClientID, Status, COUNT(*) AS Count
FROM   Orders
GROUP BY ClientID, Status
ORDER BY ClientID, Status;

-- Revenue per order, per product
SELECT OrderID, ProductID, SUM(Quantity * UnitPrice) AS LineRevenue
FROM   OrderDetails
GROUP BY OrderID, ProductID
ORDER BY OrderID;
```

---

## HAVING

`HAVING` filters groups after aggregation, the same way `WHERE` filters rows before aggregation.

```sql
-- WHERE filters rows (before grouping)
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
WHERE  Price > 20            -- filters individual products first
GROUP BY CategoryID;

-- HAVING filters groups (after grouping)
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID
HAVING COUNT(*) >= 2;        -- keeps only categories with 2 or more products
```

### HAVING Examples

```sql
-- Categories whose total stock exceeds 100 units
SELECT CategoryID, SUM(Stock) AS TotalStock
FROM   Products
GROUP BY CategoryID
HAVING SUM(Stock) > 100;

-- Clients who have placed more than 1 order
SELECT ClientID, COUNT(*) AS OrderCount
FROM   Orders
GROUP BY ClientID
HAVING COUNT(*) > 1;

-- Products whose average line-item quantity is above 1.5
SELECT ProductID, AVG(CAST(Quantity AS DECIMAL(10,2))) AS AvgQty
FROM   OrderDetails
GROUP BY ProductID
HAVING AVG(CAST(Quantity AS DECIMAL(10,2))) > 1.5;
```

---

## GROUP BY with ORDER BY

```sql
-- Categories sorted by most products first
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID
ORDER BY ProductCount DESC;

-- Orders per client sorted by most active client
SELECT ClientID, COUNT(*) AS OrderCount, SUM(TotalAmount) AS TotalSpent
FROM   Orders
GROUP BY ClientID
ORDER BY TotalSpent DESC;
```

---

## GROUP BY with JOINs

Join tables first to bring in descriptive columns, then aggregate.

### Example 1 — Products per category name

```sql
SELECT
    c.CategoryName,
    COUNT(p.ProductID)    AS ProductCount,
    AVG(p.Price)          AS AveragePrice,
    MIN(p.Price)          AS CheapestPrice,
    MAX(p.Price)          AS MostExpensive
FROM   Categories AS c
LEFT JOIN Products AS p ON c.CategoryID = p.CategoryID
GROUP BY c.CategoryID, c.CategoryName
ORDER BY ProductCount DESC;
```

### Example 2 — Total revenue per client

```sql
SELECT
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    cl.Country,
    COUNT(DISTINCT o.OrderID)         AS OrderCount,
    SUM(od.Quantity * od.UnitPrice)   AS TotalRevenue
FROM   Clients AS cl
INNER JOIN Orders      AS o  ON cl.ClientID   = o.ClientID
INNER JOIN OrderDetails AS od ON o.OrderID    = od.OrderID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName, cl.Country
ORDER BY TotalRevenue DESC;
```

### Example 3 — Top products by revenue with category name

```sql
SELECT
    c.CategoryName,
    p.ProductName,
    SUM(od.Quantity)                AS UnitsSold,
    SUM(od.Quantity * od.UnitPrice) AS Revenue
FROM   OrderDetails AS od
INNER JOIN Products   AS p ON od.ProductID = p.ProductID
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
GROUP BY c.CategoryID, c.CategoryName, p.ProductID, p.ProductName
ORDER BY Revenue DESC;
```

### Example 4 — Monthly revenue with HAVING filter

```sql
SELECT
    YEAR(o.OrderDate)               AS OrderYear,
    MONTH(o.OrderDate)              AS OrderMonth,
    COUNT(DISTINCT o.OrderID)       AS OrderCount,
    SUM(od.Quantity * od.UnitPrice) AS MonthlyRevenue
FROM   Orders AS o
INNER JOIN OrderDetails AS od ON o.OrderID = od.OrderID
GROUP BY YEAR(o.OrderDate), MONTH(o.OrderDate)
HAVING SUM(od.Quantity * od.UnitPrice) > 100
ORDER BY OrderYear, OrderMonth;
```

---

## NULL Values in Aggregates

Aggregate functions **ignore NULLs** (except `COUNT(*)`).

```sql
-- TotalAmount may be NULL for new orders
SELECT AVG(TotalAmount) AS AvgOrderValue FROM Orders;
-- AVG ignores NULLs — the result is the average of non-NULL rows only

-- Replace NULLs with 0 before aggregating
SELECT SUM(ISNULL(TotalAmount, 0)) AS TotalWithNulls FROM Orders;

-- COALESCE is the SQL standard equivalent of ISNULL
SELECT AVG(COALESCE(TotalAmount, 0)) AS SafeAvg FROM Orders;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
Count the total number of orders in the `Orders` table.

**Exercise 2 (Easy)**
Find the average, minimum, and maximum price from the `Products` table.

**Exercise 3 (Easy)**
Show each `Status` value and how many orders have that status.

**Exercise 4 (Medium)**
Show each `CategoryID` with the total number of products and the average price of products in that category. Sort by average price descending.

**Exercise 5 (Medium)**
List all products that have been ordered more than once (total quantity sold > 1). Show `ProductID` and total quantity sold.

**Exercise 6 (Medium)**
Show each client (`ClientID`) with their total number of orders and total amount spent. Only include clients who have spent more than €100 in total.

**Exercise 7 (Medium)**
Using a JOIN, show each category name alongside the number of products in it and the sum of all stock in that category. Include categories with no products.

**Exercise 8 (Hard)**
For each client, show their full name, total number of distinct orders, total number of product lines ordered (rows in `OrderDetails`), and total amount spent (sum of Quantity × UnitPrice). Sort by total spent descending.

**Exercise 9 (Hard)**
Show the top 3 products by total revenue (Quantity × UnitPrice) along with the product name and category name. Use a JOIN across all relevant tables.

**Exercise 10 (Hard)**
Find all clients who have placed orders in at least 2 different months. Show their full name and the count of distinct months in which they ordered.

---

## Answers

**Exercise 1**
```sql
SELECT COUNT(*) AS TotalOrders FROM Orders;
```

**Exercise 2**
```sql
SELECT AVG(Price) AS AvgPrice, MIN(Price) AS MinPrice, MAX(Price) AS MaxPrice
FROM Products;
```

**Exercise 3**
```sql
SELECT Status, COUNT(*) AS OrderCount FROM Orders GROUP BY Status;
```

**Exercise 4**
```sql
SELECT CategoryID, COUNT(*) AS ProductCount, AVG(Price) AS AvgPrice
FROM   Products
GROUP BY CategoryID
ORDER BY AvgPrice DESC;
```

**Exercise 5**
```sql
SELECT ProductID, SUM(Quantity) AS TotalQty
FROM   OrderDetails
GROUP BY ProductID
HAVING SUM(Quantity) > 1;
```

**Exercise 6**
```sql
SELECT ClientID, COUNT(*) AS OrderCount, SUM(TotalAmount) AS TotalSpent
FROM   Orders
GROUP BY ClientID
HAVING SUM(TotalAmount) > 100;
```

**Exercise 7**
```sql
SELECT c.CategoryName, COUNT(p.ProductID) AS ProductCount, SUM(ISNULL(p.Stock, 0)) AS TotalStock
FROM   Categories AS c
LEFT JOIN Products AS p ON c.CategoryID = p.CategoryID
GROUP BY c.CategoryID, c.CategoryName;
```

**Exercise 8**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName,
       COUNT(DISTINCT o.OrderID)         AS OrderCount,
       COUNT(od.OrderDetailID)           AS LineCount,
       SUM(od.Quantity * od.UnitPrice)   AS TotalSpent
FROM   Clients AS cl
INNER JOIN Orders      AS o  ON cl.ClientID  = o.ClientID
INNER JOIN OrderDetails AS od ON o.OrderID   = od.OrderID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalSpent DESC;
```

**Exercise 9**
```sql
SELECT TOP 3
    p.ProductName,
    c.CategoryName,
    SUM(od.Quantity * od.UnitPrice) AS Revenue
FROM   OrderDetails AS od
INNER JOIN Products   AS p ON od.ProductID = p.ProductID
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
GROUP BY p.ProductID, p.ProductName, c.CategoryName
ORDER BY Revenue DESC;
```

**Exercise 10**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName,
       COUNT(DISTINCT YEAR(o.OrderDate) * 100 + MONTH(o.OrderDate)) AS DistinctMonths
FROM   Clients AS cl
INNER JOIN Orders AS o ON cl.ClientID = o.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
HAVING COUNT(DISTINCT YEAR(o.OrderDate) * 100 + MONTH(o.OrderDate)) >= 2;
```
