# Baza de date eCommerce — Fișa de lucru 4: SELECT — Interogări de bază

## Obiective de învățare
- Scrierea instrucțiunilor `SELECT` pentru a extrage anumite coloane și a filtra rândurile
- Folosirea `WHERE` cu operatori de comparație, interval, listă, model (pattern) și NULL
- Sortarea rezultatelor cu `ORDER BY` și limitarea lor cu `TOP`
- Aplicarea `DISTINCT` și calcularea coloanelor derivate în lista SELECT

---

## Sintaxa SELECT

```sql
SELECT  [TOP n] [DISTINCT] column_list
FROM    table_name
WHERE   condition
ORDER BY column [ASC | DESC];
```

---

## 1. Selectarea tuturor coloanelor (SELECT *)

```sql
-- Toate coloanele din Categories
SELECT * FROM Categories;

-- Toate coloanele din Orders
SELECT * FROM Orders;
```

> **Notă:** `SELECT *` este comod pentru explorare, dar evită-l în interogările de producție. Dacă o coloană este adăugată sau reordonată, interogările care depind de poziția coloanelor nu vor mai funcționa sau vor returna date neașteptate.

---

## 2. Selectarea anumitor coloane

```sql
-- Catalogul de produse
SELECT ProductName, Price, Stock
FROM   Products;

-- Lista de contacte a clienților
SELECT FirstName, LastName, Email, City, Country
FROM   Clients;

-- Rezumatul comenzilor
SELECT OrderID, OrderDate, Status, TotalAmount
FROM   Orders;
```

---

## 3. Aliasuri de coloane (AS)

Redenumește o coloană în setul de rezultate fără a modifica tabelul.

```sql
-- Redenumim coloanele pentru lizibilitate
SELECT
    FirstName + ' ' + LastName  AS FullName,
    Email                       AS ContactEmail,
    City                        AS [Home City]       -- parantezele drepte permit spații
FROM Clients;

-- Coloană calculată, cu alias
SELECT
    ProductName,
    Price          AS ListPrice,
    Price * 0.9    AS DiscountedPrice
FROM Products;

-- Alias fără cuvântul-cheie AS (doar un spațiu — funcționează, dar e mai puțin lizibil)
SELECT OrderID OrderNumber, OrderDate PlacedOn
FROM   Orders;
```

---

## 4. Operații aritmetice în SELECT

```sql
-- Totalul liniei pentru fiecare detaliu de comandă
SELECT
    OrderDetailID,
    Quantity,
    UnitPrice,
    Quantity * UnitPrice          AS LineTotal,
    Quantity * UnitPrice * 0.20   AS VATAmount
FROM OrderDetails;

-- Zilele trecute de la plasarea unei comenzi
SELECT
    OrderID,
    OrderDate,
    DATEDIFF(DAY, OrderDate, GETDATE()) AS DaysSinceOrder
FROM Orders;

-- Valoarea stocului pentru fiecare produs
SELECT
    ProductName,
    Stock,
    Price,
    Stock * Price AS StockValue
FROM Products;
```

---

## 5. Filtrarea cu WHERE

### Egalitate și inegalitate

```sql
-- Comenzile care au fost livrate
SELECT * FROM Orders WHERE Status = 'Delivered';

-- Produsele care NU sunt în Electronics (CategoryID 1)
SELECT ProductName, Price FROM Products WHERE CategoryID <> 1;

-- Clienții care nu sunt din UK
SELECT FirstName, LastName, Country FROM Clients WHERE Country != 'UK';
```

### Operatori de comparație

```sql
-- Produsele care costă mai mult de 50 €
SELECT ProductName, Price FROM Products WHERE Price > 50.00;

-- Produsele cu prețul de 30 € sau mai puțin
SELECT ProductName, Price FROM Products WHERE Price <= 30.00;

-- Comenzile plasate înainte de 12 ianuarie 2024
SELECT OrderID, OrderDate FROM Orders WHERE OrderDate < '2024-01-12';

-- Comenzile plasate pe 15 ianuarie 2024 sau după
SELECT OrderID, OrderDate, Status FROM Orders WHERE OrderDate >= '2024-01-15';
```

### BETWEEN … AND

```sql
-- Produsele cu prețul între 20 € și 80 € (inclusiv)
SELECT ProductName, Price
FROM   Products
WHERE  Price BETWEEN 20.00 AND 80.00;

-- Comenzile plasate în primele două săptămâni din ianuarie 2024
SELECT OrderID, OrderDate, ClientID
FROM   Orders
WHERE  OrderDate BETWEEN '2024-01-01' AND '2024-01-14';
```

### IN (listă de valori)

```sql
-- Comenzile cu anumite statusuri
SELECT OrderID, Status, TotalAmount
FROM   Orders
WHERE  Status IN ('Pending', 'Processing');

-- Clienții din anumite țări
SELECT FirstName, LastName, Country
FROM   Clients
WHERE  Country IN ('UK', 'France', 'Germany');
```

### LIKE — Potrivirea după model

`%` se potrivește cu orice secvență de zero sau mai multe caractere.  
`_` se potrivește cu exact un caracter.

```sql
-- Produsele al căror nume începe cu 'Wire'
SELECT ProductName, Price FROM Products WHERE ProductName LIKE 'Wire%';

-- Produsele al căror nume se termină cu 'e'
SELECT ProductName FROM Products WHERE ProductName LIKE '%e';

-- Produsele al căror nume conține 'keyboard' (implicit nu se face distincție între majuscule și minuscule)
SELECT ProductName FROM Products WHERE ProductName LIKE '%keyboard%';

-- Clienții al căror nume de familie are patru litere
SELECT FirstName, LastName FROM Clients WHERE LastName LIKE '____';

-- Clienții cu o adresă Gmail
SELECT FirstName, LastName, Email FROM Clients WHERE Email LIKE '%@gmail.com';
```

### IS NULL / IS NOT NULL

```sql
-- Comenzile fără adresă de livrare înregistrată
SELECT OrderID, OrderDate FROM Orders WHERE ShippingAddress IS NULL;

-- Produsele care au o descriere
SELECT ProductName, Description FROM Products WHERE Description IS NOT NULL;
```

---

## 6. Combinarea condițiilor: AND, OR, NOT

```sql
-- Produsele Electronics cu prețul sub 100 €
SELECT ProductName, Price
FROM   Products
WHERE  CategoryID = 1
AND    Price < 100.00;

-- Comenzile care sunt Pending SAU Processing
SELECT OrderID, Status FROM Orders
WHERE  Status = 'Pending' OR Status = 'Processing';

-- Clienții care NU sunt din Spain sau Italy
SELECT FirstName, LastName, Country
FROM   Clients
WHERE  Country NOT IN ('Spain', 'Italy');

-- Folosim paranteze pentru a controla precedența
-- Comenzi: (Delivered ȘI > 100 €) SAU (Shipped ȘI > 200 €)
SELECT OrderID, Status, TotalAmount
FROM   Orders
WHERE  (Status = 'Delivered' AND TotalAmount > 100)
OR     (Status = 'Shipped'   AND TotalAmount > 200);
```

---

## 7. Sortarea cu ORDER BY

```sql
-- Produsele sortate de la cel mai ieftin
SELECT ProductName, Price FROM Products ORDER BY Price ASC;

-- Produsele sortate de la cel mai scump
SELECT ProductName, Price FROM Products ORDER BY Price DESC;

-- Clienții sortați după țară, apoi după numele de familie în cadrul fiecărei țări
SELECT FirstName, LastName, Country, City
FROM   Clients
ORDER BY Country ASC, LastName ASC;

-- Comenzile sortate de la cea mai recentă
SELECT OrderID, OrderDate, Status FROM Orders ORDER BY OrderDate DESC;

-- Sortăm după o coloană calculată/cu alias folosind poziția ei
SELECT ProductName, Price, Stock, Price * Stock AS StockValue
FROM   Products
ORDER BY 4 DESC;     -- coloana 4 din lista SELECT = StockValue
```

---

## 8. Limitarea rezultatelor cu TOP

```sql
-- Cele mai scumpe 3 produse
SELECT TOP 3 ProductName, Price
FROM   Products
ORDER BY Price DESC;

-- Primele 20% dintre produse după preț
SELECT TOP 20 PERCENT ProductName, Price
FROM   Products
ORDER BY Price DESC;

-- Cele mai recente 2 comenzi — inclusiv egalitățile pe OrderDate
SELECT TOP 2 WITH TIES OrderID, OrderDate
FROM   Orders
ORDER BY OrderDate DESC;
```

---

## 9. DISTINCT

Elimină valorile duplicate din setul de rezultate.

```sql
-- Din ce țări provin clienții noștri?
SELECT DISTINCT Country FROM Clients ORDER BY Country;

-- Ce categorii conțin produse?
SELECT DISTINCT CategoryID FROM Products;

-- În câte orașe distincte se află clienții noștri?
SELECT COUNT(DISTINCT City) AS UniqueCities FROM Clients;
```

---

## 10. Funcții predefinite utile

```sql
-- Funcții pentru șiruri de caractere
SELECT
    UPPER(FirstName)                     AS UpperName,
    LOWER(LastName)                      AS LowerName,
    LEN(Email)                           AS EmailLength,
    SUBSTRING(Email, 1, CHARINDEX('@', Email) - 1) AS Username
FROM Clients;

-- Funcții pentru date calendaristice
SELECT
    OrderID,
    OrderDate,
    YEAR(OrderDate)    AS OrderYear,
    MONTH(OrderDate)   AS OrderMonth,
    DAY(OrderDate)     AS OrderDay,
    DATEADD(DAY, 30, OrderDate)          AS EstimatedDelivery,
    DATEDIFF(DAY, OrderDate, GETDATE())  AS DaysSinceOrder
FROM Orders;

-- Conversie de tip
SELECT
    OrderID,
    CAST(TotalAmount AS NVARCHAR(50)) AS TotalText,
    CONVERT(NVARCHAR(10), OrderDate, 103) AS DateDDMMYYYY
FROM Orders;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Extrage `ProductName` și `Price` pentru toate produsele din categoria Books (CategoryID = 2).

**Exercițiul 2 (Ușor)**
Listează toți clienții care locuiesc fie în `'London'`, fie în `'Paris'`, afișând numele complet și orașul.

**Exercițiul 3 (Ușor)**
Afișează `OrderID`, `OrderDate` și `TotalAmount` pentru toate comenzile cu `TotalAmount` între 50 și 200, sortate descrescător după sumă.

**Exercițiul 4 (Mediu)**
Găsește toate produsele al căror nume conține cuvântul `'Key'` (fără a ține cont de majuscule). Afișează numele, prețul și stocul.

**Exercițiul 5 (Mediu)**
Listează toate comenzile cu statusul `'Pending'` sau `'Processing'` plasate după `2024-01-12`. Afișează `OrderID`, `Status` și `OrderDate`.

**Exercițiul 6 (Mediu)**
Extrage primele 3 produse cu cea mai mare valoare a stocului (Stock × Price). Afișează `ProductName`, `Stock`, `Price` și valoarea calculată `StockValue`, sortate descrescător.

**Exercițiul 7 (Mediu)**
Afișează lista distinctă a statusurilor de comandă care există în prezent în tabelul `Orders`.

**Exercițiul 8 (Mediu)**
Listează toți clienții al căror email NU se termină cu `@mail.com`. Afișează numele complet și emailul.

**Exercițiul 9 (Dificil)**
Afișează `OrderDetailID`, `Quantity`, `UnitPrice`, totalul calculat al liniei și o coloană numită `PriceCategory` care folosește o expresie `CASE` pentru a eticheta liniile: `'Low'` dacă UnitPrice < 30, `'Medium'` dacă este între 30 și 100, `'High'` dacă este > 100.

**Exercițiul 10 (Dificil)**
Găsește toate comenzile la care `TotalAmount` este `NULL`. Pentru fiecare, calculează totalul așteptat însumând `Quantity * UnitPrice` din `OrderDetails` — afișează `OrderID`, `OrderDate` și totalul calculat. (Indiciu: folosește o subinterogare în lista SELECT sau în clauza WHERE.)

---

## Răspunsuri

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
