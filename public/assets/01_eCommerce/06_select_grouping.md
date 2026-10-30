# Baza de date eCommerce — Fișa de lucru 6: SELECT — Grupare și funcții de agregare

## Obiective de învățare
- Folosirea `COUNT`, `SUM`, `AVG`, `MIN` și `MAX` pentru a sintetiza datele
- Gruparea rândurilor cu `GROUP BY` după una sau mai multe coloane
- Filtrarea grupurilor cu `HAVING`
- Combinarea JOIN-urilor cu agregarea pentru rapoarte de business relevante

---

## Funcții de agregare

Funcțiile de agregare comprimă mai multe rânduri într-o singură valoare de sinteză.

### COUNT

```sql
-- Numărul total de produse
SELECT COUNT(*) AS TotalProducts FROM Products;

-- Numărul de produse care au o descriere (ignoră valorile NULL)
SELECT COUNT(Description) AS ProductsWithDescription FROM Products;

-- Numărare pe categorii (folosit cu GROUP BY — vezi mai jos)
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID;
```

> **COUNT(\*) vs COUNT(coloană):** `COUNT(*)` numără fiecare rând, inclusiv cele cu NULL. `COUNT(coloană)` numără doar rândurile în care acea coloană nu este NULL.

### SUM

```sql
-- Stocul total al tuturor produselor
SELECT SUM(Stock) AS TotalStock FROM Products;

-- Venitul total din toate detaliile de comandă
SELECT SUM(Quantity * UnitPrice) AS TotalRevenue FROM OrderDetails;
```

### AVG

```sql
-- Prețul mediu al produselor
SELECT AVG(Price) AS AveragePrice FROM Products;

-- Valoarea medie a unei comenzi
SELECT AVG(TotalAmount) AS AverageOrderValue FROM Orders;
```

### MIN și MAX

```sql
-- Cel mai ieftin și cel mai scump produs
SELECT MIN(Price) AS CheapestPrice, MAX(Price) AS MostExpensivePrice
FROM Products;

-- Cea mai veche și cea mai recentă dată de comandă
SELECT MIN(OrderDate) AS FirstOrder, MAX(OrderDate) AS LastOrder
FROM Orders;
```

---

## GROUP BY

`GROUP BY` împarte rândurile în grupuri și aplică funcția de agregare fiecărui grup în parte.

**Regulă:** Fiecare coloană din lista `SELECT` care **nu** se află într-o funcție de agregare **trebuie** să apară în clauza `GROUP BY`.

### O singură coloană

```sql
-- Numărul de produse pe categorie
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID;

-- Cantitatea totală vândută pe produs
SELECT ProductID, SUM(Quantity) AS TotalSold
FROM   OrderDetails
GROUP BY ProductID;

-- Numărul de comenzi pe status
SELECT Status, COUNT(*) AS OrderCount
FROM   Orders
GROUP BY Status;

-- Venitul total pe comandă
SELECT OrderID, SUM(Quantity * UnitPrice) AS OrderTotal
FROM   OrderDetails
GROUP BY OrderID
ORDER BY OrderTotal DESC;
```

### Mai multe coloane

```sql
-- Numărul de comenzi pe client și pe status
SELECT ClientID, Status, COUNT(*) AS Count
FROM   Orders
GROUP BY ClientID, Status
ORDER BY ClientID, Status;

-- Venitul pe comandă și pe produs
SELECT OrderID, ProductID, SUM(Quantity * UnitPrice) AS LineRevenue
FROM   OrderDetails
GROUP BY OrderID, ProductID
ORDER BY OrderID;
```

---

## HAVING

`HAVING` filtrează grupurile după agregare, la fel cum `WHERE` filtrează rândurile înainte de agregare.

```sql
-- WHERE filtrează rânduri (înainte de grupare)
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
WHERE  Price > 20            -- mai întâi filtrează produsele individuale
GROUP BY CategoryID;

-- HAVING filtrează grupuri (după grupare)
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID
HAVING COUNT(*) >= 2;        -- păstrează doar categoriile cu 2 sau mai multe produse
```

### Exemple HAVING

```sql
-- Categoriile al căror stoc total depășește 100 de unități
SELECT CategoryID, SUM(Stock) AS TotalStock
FROM   Products
GROUP BY CategoryID
HAVING SUM(Stock) > 100;

-- Clienții care au plasat mai mult de o comandă
SELECT ClientID, COUNT(*) AS OrderCount
FROM   Orders
GROUP BY ClientID
HAVING COUNT(*) > 1;

-- Produsele a căror cantitate medie pe linie de comandă este peste 1,5
SELECT ProductID, AVG(CAST(Quantity AS DECIMAL(10,2))) AS AvgQty
FROM   OrderDetails
GROUP BY ProductID
HAVING AVG(CAST(Quantity AS DECIMAL(10,2))) > 1.5;
```

---

## GROUP BY cu ORDER BY

```sql
-- Categoriile sortate începând cu cea cu cele mai multe produse
SELECT CategoryID, COUNT(*) AS ProductCount
FROM   Products
GROUP BY CategoryID
ORDER BY ProductCount DESC;

-- Comenzile pe client, sortate începând cu clientul cel mai activ
SELECT ClientID, COUNT(*) AS OrderCount, SUM(TotalAmount) AS TotalSpent
FROM   Orders
GROUP BY ClientID
ORDER BY TotalSpent DESC;
```

---

## GROUP BY cu JOIN-uri

Mai întâi unește tabelele pentru a aduce coloanele descriptive, apoi agregă.

### Exemplul 1 — Produsele pe nume de categorie

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

### Exemplul 2 — Venitul total pe client

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

### Exemplul 3 — Topul produselor după venit, cu numele categoriei

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

### Exemplul 4 — Venitul lunar, cu filtru HAVING

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

## Valori NULL în agregări

Funcțiile de agregare **ignoră valorile NULL** (cu excepția `COUNT(*)`).

```sql
-- TotalAmount poate fi NULL pentru comenzile noi
SELECT AVG(TotalAmount) AS AvgOrderValue FROM Orders;
-- AVG ignoră valorile NULL — rezultatul este media doar a rândurilor non-NULL

-- Înlocuim valorile NULL cu 0 înainte de agregare
SELECT SUM(ISNULL(TotalAmount, 0)) AS TotalWithNulls FROM Orders;

-- COALESCE este echivalentul din standardul SQL al funcției ISNULL
SELECT AVG(COALESCE(TotalAmount, 0)) AS SafeAvg FROM Orders;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Numără totalul comenzilor din tabelul `Orders`.

**Exercițiul 2 (Ușor)**
Găsește prețul mediu, minim și maxim din tabelul `Products`.

**Exercițiul 3 (Ușor)**
Afișează fiecare valoare `Status` și câte comenzi au acel status.

**Exercițiul 4 (Mediu)**
Afișează fiecare `CategoryID` cu numărul total de produse și prețul mediu al produselor din acea categorie. Sortează descrescător după prețul mediu.

**Exercițiul 5 (Mediu)**
Listează toate produsele care au fost comandate de mai multe ori (cantitatea totală vândută > 1). Afișează `ProductID` și cantitatea totală vândută.

**Exercițiul 6 (Mediu)**
Afișează fiecare client (`ClientID`) cu numărul total de comenzi și suma totală cheltuită. Include doar clienții care au cheltuit în total mai mult de 100 €.

**Exercițiul 7 (Mediu)**
Folosind un JOIN, afișează numele fiecărei categorii alături de numărul de produse din ea și suma întregului stoc din acea categorie. Include categoriile fără produse.

**Exercițiul 8 (Dificil)**
Pentru fiecare client, afișează numele complet, numărul total de comenzi distincte, numărul total de linii de produs comandate (rânduri în `OrderDetails`) și suma totală cheltuită (suma Quantity × UnitPrice). Sortează descrescător după suma cheltuită.

**Exercițiul 9 (Dificil)**
Afișează primele 3 produse după venitul total (Quantity × UnitPrice), împreună cu numele produsului și numele categoriei. Folosește un JOIN între toate tabelele relevante.

**Exercițiul 10 (Dificil)**
Găsește toți clienții care au plasat comenzi în cel puțin 2 luni diferite. Afișează numele complet și numărul de luni distincte în care au comandat.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT COUNT(*) AS TotalOrders FROM Orders;
```

**Exercițiul 2**
```sql
SELECT AVG(Price) AS AvgPrice, MIN(Price) AS MinPrice, MAX(Price) AS MaxPrice
FROM Products;
```

**Exercițiul 3**
```sql
SELECT Status, COUNT(*) AS OrderCount FROM Orders GROUP BY Status;
```

**Exercițiul 4**
```sql
SELECT CategoryID, COUNT(*) AS ProductCount, AVG(Price) AS AvgPrice
FROM   Products
GROUP BY CategoryID
ORDER BY AvgPrice DESC;
```

**Exercițiul 5**
```sql
SELECT ProductID, SUM(Quantity) AS TotalQty
FROM   OrderDetails
GROUP BY ProductID
HAVING SUM(Quantity) > 1;
```

**Exercițiul 6**
```sql
SELECT ClientID, COUNT(*) AS OrderCount, SUM(TotalAmount) AS TotalSpent
FROM   Orders
GROUP BY ClientID
HAVING SUM(TotalAmount) > 100;
```

**Exercițiul 7**
```sql
SELECT c.CategoryName, COUNT(p.ProductID) AS ProductCount, SUM(ISNULL(p.Stock, 0)) AS TotalStock
FROM   Categories AS c
LEFT JOIN Products AS p ON c.CategoryID = p.CategoryID
GROUP BY c.CategoryID, c.CategoryName;
```

**Exercițiul 8**
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

**Exercițiul 9**
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

**Exercițiul 10**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName,
       COUNT(DISTINCT YEAR(o.OrderDate) * 100 + MONTH(o.OrderDate)) AS DistinctMonths
FROM   Clients AS cl
INNER JOIN Orders AS o ON cl.ClientID = o.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
HAVING COUNT(DISTINCT YEAR(o.OrderDate) * 100 + MONTH(o.OrderDate)) >= 2;
```
