# eCommerce Database — Worksheet 4: SELECT — Basic Queries

## Learning Objectives
- Write `SELECT` statements to retrieve specific columns and filter rows
- Use `WHERE` with comparison, range, list, pattern, and NULL operators
- Sort results with `ORDER BY` and limit them with `TOP`
- Apply `DISTINCT` and compute derived columns in the select list

---

## SELECT Syntax

```sql
SELECT  [TOP n] [DISTINCT] column_list
FROM    table_name
WHERE   condition
ORDER BY column [ASC | DESC];
```

---

## 1. Selecting All Columns (SELECT *)

```sql
-- Every column from Categories
SELECT * FROM Categories;

-- Every column from Orders
SELECT * FROM Orders;
```

> **Note:** `SELECT *` is convenient for exploration but avoid it in production queries. If a column is added or reordered, queries that depend on column position will break or return unexpected data.

---

## 2. Selecting Specific Columns

```sql
-- Product catalogue view
SELECT ProductName, Price, Stock
FROM   Products;

-- Client contact list
SELECT FirstName, LastName, Email, City, Country
FROM   Clients;

-- Order summary
SELECT OrderID, OrderDate, Status, TotalAmount
FROM   Orders;
```

---

## 3. Column Aliases (AS)

Rename a column in the result set without changing the table.

```sql
-- Rename columns for readability
SELECT
    FirstName + ' ' + LastName  AS FullName,
    Email                       AS ContactEmail,
    City                        AS [Home City]       -- brackets allow spaces
FROM Clients;

-- Computed column with alias
SELECT
    ProductName,
    Price          AS ListPrice,
    Price * 0.9    AS DiscountedPrice
FROM Products;

-- Alias without the AS keyword (space only — works but less readable)
SELECT OrderID OrderNumber, OrderDate PlacedOn
FROM   Orders;
```

---

## 4. Arithmetic in SELECT

```sql
-- Line total for each order detail
SELECT
    OrderDetailID,
    Quantity,
    UnitPrice,
    Quantity * UnitPrice          AS LineTotal,
    Quantity * UnitPrice * 0.20   AS VATAmount
FROM OrderDetails;

-- Days since an order was placed
SELECT
    OrderID,
    OrderDate,
    DATEDIFF(DAY, OrderDate, GETDATE()) AS DaysSinceOrder
FROM Orders;

-- Stock value per product
SELECT
    ProductName,
    Stock,
    Price,
    Stock * Price AS StockValue
FROM Products;
```

---

## 5. Filtering with WHERE

### Equality and Inequality

```sql
-- Orders that have been delivered
SELECT * FROM Orders WHERE Status = 'Delivered';

-- Products that are NOT in Electronics (CategoryID 1)
SELECT ProductName, Price FROM Products WHERE CategoryID <> 1;

-- Clients who are not from the UK
SELECT FirstName, LastName, Country FROM Clients WHERE Country != 'UK';
```

### Comparison Operators

```sql
-- Products that cost more than €50
SELECT ProductName, Price FROM Products WHERE Price > 50.00;

-- Products priced at €30 or less
SELECT ProductName, Price FROM Products WHERE Price <= 30.00;

-- Orders placed before 12 January 2024
SELECT OrderID, OrderDate FROM Orders WHERE OrderDate < '2024-01-12';

-- Orders placed on or after 15 January 2024
SELECT OrderID, OrderDate, Status FROM Orders WHERE OrderDate >= '2024-01-15';
```

### BETWEEN … AND

```sql
-- Products priced between €20 and €80 (inclusive)
SELECT ProductName, Price
FROM   Products
WHERE  Price BETWEEN 20.00 AND 80.00;

-- Orders placed in the first two weeks of January 2024
SELECT OrderID, OrderDate, ClientID
FROM   Orders
WHERE  OrderDate BETWEEN '2024-01-01' AND '2024-01-14';
```

### IN (list of values)

```sql
-- Orders with specific statuses
SELECT OrderID, Status, TotalAmount
FROM   Orders
WHERE  Status IN ('Pending', 'Processing');

-- Clients from selected countries
SELECT FirstName, LastName, Country
FROM   Clients
WHERE  Country IN ('UK', 'France', 'Germany');
```

### LIKE — Pattern Matching

`%` matches any sequence of zero or more characters.  
`_` matches exactly one character.

```sql
-- Products whose name starts with 'Wire'
SELECT ProductName, Price FROM Products WHERE ProductName LIKE 'Wire%';

-- Products whose name ends with 'e'
SELECT ProductName FROM Products WHERE ProductName LIKE '%e';

-- Products whose name contains 'keyboard' (case-insensitive by default)
SELECT ProductName FROM Products WHERE ProductName LIKE '%keyboard%';

-- Clients whose last name is four letters
SELECT FirstName, LastName FROM Clients WHERE LastName LIKE '____';

-- Clients with a Gmail address
SELECT FirstName, LastName, Email FROM Clients WHERE Email LIKE '%@gmail.com';
```

### IS NULL / IS NOT NULL

```sql
-- Orders with no shipping address recorded
SELECT OrderID, OrderDate FROM Orders WHERE ShippingAddress IS NULL;

-- Products that have a description
SELECT ProductName, Description FROM Products WHERE Description IS NOT NULL;
```

---

## 6. Combining Conditions: AND, OR, NOT

```sql
-- Electronics products priced under €100
SELECT ProductName, Price
FROM   Products
WHERE  CategoryID = 1
AND    Price < 100.00;

-- Orders that are Pending OR Processing
SELECT OrderID, Status FROM Orders
WHERE  Status = 'Pending' OR Status = 'Processing';

-- Clients NOT from Spain or Italy
SELECT FirstName, LastName, Country
FROM   Clients
WHERE  Country NOT IN ('Spain', 'Italy');

-- Use parentheses to control precedence
-- Orders: (Delivered AND > €100) OR (Shipped AND > €200)
SELECT OrderID, Status, TotalAmount
FROM   Orders
WHERE  (Status = 'Delivered' AND TotalAmount > 100)
OR     (Status = 'Shipped'   AND TotalAmount > 200);
```

---

## 7. Sorting with ORDER BY

```sql
-- Products sorted cheapest first
SELECT ProductName, Price FROM Products ORDER BY Price ASC;

-- Products sorted most expensive first
SELECT ProductName, Price FROM Products ORDER BY Price DESC;

-- Clients sorted by country, then by last name within each country
SELECT FirstName, LastName, Country, City
FROM   Clients
ORDER BY Country ASC, LastName ASC;

-- Orders sorted by most recent first
SELECT OrderID, OrderDate, Status FROM Orders ORDER BY OrderDate DESC;

-- Sort by a computed/aliased column using its position
SELECT ProductName, Price, Stock, Price * Stock AS StockValue
FROM   Products
ORDER BY 4 DESC;     -- column 4 in the SELECT list = StockValue
```

---

## 8. Limiting Results with TOP

```sql
-- The 3 most expensive products
SELECT TOP 3 ProductName, Price
FROM   Products
ORDER BY Price DESC;

-- Top 20% of products by price
SELECT TOP 20 PERCENT ProductName, Price
FROM   Products
ORDER BY Price DESC;

-- Top 2 most recent orders — including ties on OrderDate
SELECT TOP 2 WITH TIES OrderID, OrderDate
FROM   Orders
ORDER BY OrderDate DESC;
```

---

## 9. DISTINCT

Remove duplicate values from the result set.

```sql
-- Which countries do our clients come from?
SELECT DISTINCT Country FROM Clients ORDER BY Country;

-- Which categories have products in them?
SELECT DISTINCT CategoryID FROM Products;

-- How many distinct cities are our clients in?
SELECT COUNT(DISTINCT City) AS UniqueCities FROM Clients;
```

---

## 10. Useful Built-in Functions

```sql
-- String functions
SELECT
    UPPER(FirstName)                     AS UpperName,
    LOWER(LastName)                      AS LowerName,
    LEN(Email)                           AS EmailLength,
    SUBSTRING(Email, 1, CHARINDEX('@', Email) - 1) AS Username
FROM Clients;

-- Date functions
SELECT
    OrderID,
    OrderDate,
    YEAR(OrderDate)    AS OrderYear,
    MONTH(OrderDate)   AS OrderMonth,
    DAY(OrderDate)     AS OrderDay,
    DATEADD(DAY, 30, OrderDate)          AS EstimatedDelivery,
    DATEDIFF(DAY, OrderDate, GETDATE())  AS DaysSinceOrder
FROM Orders;

-- Type conversion
SELECT
    OrderID,
    CAST(TotalAmount AS NVARCHAR(50)) AS TotalText,
    CONVERT(NVARCHAR(10), OrderDate, 103) AS DateDDMMYYYY
FROM Orders;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
Retrieve the `ProductName` and `Price` of all products in the Books category (CategoryID = 2).

**Exercise 2 (Easy)**
List all clients who live in either `'London'` or `'Paris'`, showing their full name and city.

**Exercise 3 (Easy)**
Show the `OrderID`, `OrderDate`, and `TotalAmount` of all orders with a `TotalAmount` between 50 and 200, sorted by amount descending.

**Exercise 4 (Medium)**
Find all products whose name contains the word `'Key'` (case-insensitive). Show the name, price, and stock.

**Exercise 5 (Medium)**
List all orders that are either `'Pending'` or `'Processing'` placed after `2024-01-12`. Show `OrderID`, `Status`, and `OrderDate`.

**Exercise 6 (Medium)**
Retrieve the top 3 products with the highest stock value (Stock × Price). Show `ProductName`, `Stock`, `Price`, and the computed `StockValue`, sorted descending.

**Exercise 7 (Medium)**
Show the distinct list of order statuses that currently exist in the `Orders` table.

**Exercise 8 (Medium)**
List all clients whose email does NOT end in `@mail.com`. Show full name and email.

**Exercise 9 (Hard)**
Show `OrderDetailID`, `Quantity`, `UnitPrice`, the computed line total, and a column called `PriceCategory` that uses a `CASE` expression to label lines: `'Low'` if UnitPrice < 30, `'Medium'` if 30–100, `'High'` if > 100.

**Exercise 10 (Hard)**
Find all orders where `TotalAmount` is `NULL`. For each, calculate the expected total by summing `Quantity * UnitPrice` from `OrderDetails` — show `OrderID`, `OrderDate`, and the calculated total. (Hint: use a subquery in the SELECT list or a WHERE clause.)

---

## Answers

1. `SELECT ProductName, Price FROM Products WHERE CategoryID = 2;`
2. `SELECT FirstName + ' ' + LastName AS FullName, City FROM Clients WHERE City IN ('London', 'Paris');`
3. `SELECT OrderID, OrderDate, TotalAmount FROM Orders WHERE TotalAmount BETWEEN 50 AND 200 ORDER BY TotalAmount DESC;`
4. `SELECT ProductName, Price, Stock FROM Products WHERE ProductName LIKE '%Key%';`
5. `SELECT OrderID, Status, OrderDate FROM Orders WHERE Status IN ('Pending','Processing') AND OrderDate > '2024-01-12';`
6. `SELECT TOP 3 ProductName, Stock, Price, Stock * Price AS StockValue FROM Products ORDER BY StockValue DESC;`
7. `SELECT DISTINCT Status FROM Orders;`
8. `SELECT FirstName + ' ' + LastName AS FullName, Email FROM Clients WHERE Email NOT LIKE '%@mail.com';`
9. `SELECT OrderDetailID, Quantity, UnitPrice, Quantity * UnitPrice AS LineTotal, CASE WHEN UnitPrice < 30 THEN 'Low' WHEN UnitPrice <= 100 THEN 'Medium' ELSE 'High' END AS PriceCategory FROM OrderDetails;`
10. `SELECT o.OrderID, o.OrderDate, (SELECT SUM(od.Quantity * od.UnitPrice) FROM OrderDetails od WHERE od.OrderID = o.OrderID) AS CalculatedTotal FROM Orders o WHERE o.TotalAmount IS NULL;`
