# Baza de date eCommerce — Fișa de lucru 7: Instrucțiuni UPDATE

## Obiective de învățare
- Scrierea instrucțiunilor `UPDATE` pentru a modifica una sau mai multe coloane
- Aplicarea întotdeauna a unei clauze `WHERE`, pentru a evita actualizarea tuturor rândurilor
- Folosirea subinterogărilor și a JOIN-urilor în `UPDATE` pentru a selecta rândurile pe baza datelor asociate
- Capturarea valorilor dinainte/de după cu clauza `OUTPUT`

---

## Sintaxa UPDATE

```sql
UPDATE table_name
SET    column1 = value1,
       column2 = value2
WHERE  condition;
```

> **ATENȚIE — Fără clauza WHERE = toate rândurile sunt actualizate**
>
> Rularea `UPDATE Products SET Price = 0` fără clauza `WHERE` setează la zero prețul **absolut fiecărui produs**. Scrie întotdeauna clauza WHERE înainte de clauza SET. Când ai dubii, rulează mai întâi SELECT-ul echivalent.

---

## Bună practică: previzualizează înainte de actualizare

Înainte de a executa un UPDATE, scrie SELECT-ul echivalent pentru a verifica ce rânduri vor fi afectate:

```sql
-- Previzualizare: ce comenzi vor fi actualizate?
SELECT OrderID, Status FROM Orders WHERE Status = 'Pending';

-- Apoi rulăm UPDATE-ul
UPDATE Orders
SET    Status = 'Processing'
WHERE  Status = 'Pending';
```

---

## UPDATE de bază — o singură coloană

```sql
-- Schimbăm prețul unui produs
UPDATE Products
SET    Price = 34.99
WHERE  ProductID = 1;

-- Marcăm o comandă ca Shipped
UPDATE Orders
SET    Status = 'Shipped'
WHERE  OrderID = 2;

-- Actualizăm orașul unui client
UPDATE Clients
SET    City = 'Manchester'
WHERE  ClientID = 1;
```

---

## UPDATE pe mai multe coloane deodată

Separă atribuirile multiple din SET prin virgule:

```sql
-- Actualizăm atât prețul, cât și stocul unui produs
UPDATE Products
SET    Price = 27.99,
       Stock = 200
WHERE  ProductID = 1;

-- Actualizăm detaliile adresei unui client într-o singură instrucțiune
UPDATE Clients
SET    Address = '45 High Street',
       City    = 'Edinburgh',
       Country = 'UK'
WHERE  ClientID = 3;
```

---

## UPDATE cu condiții WHERE complexe

### Clauza IN

```sql
-- Aplicăm o reducere de 10% tuturor produselor din Books și Sports
UPDATE Products
SET    Price = Price * 0.90
WHERE  CategoryID IN (
    SELECT CategoryID FROM Categories
    WHERE  CategoryName IN ('Books', 'Sports')
);
```

### BETWEEN

```sql
-- Marcăm comenzile plasate în ianuarie 2024 ca arhivate (valoare ipotetică pentru Status)
UPDATE Orders
SET    Status = 'Archived'
WHERE  OrderDate BETWEEN '2024-01-01' AND '2024-01-31'
AND    Status = 'Delivered';
```

### LIKE

```sql
-- Corectăm o greșeală de tipar în toate emailurile care se termină cu '@mail.con'
UPDATE Clients
SET    Email = REPLACE(Email, '@mail.con', '@mail.com')
WHERE  Email LIKE '%@mail.con';
```

---

## UPDATE cu subinterogare în WHERE

```sql
-- Anulăm toate comenzile Pending ale clienților din Romania
UPDATE Orders
SET    Status = 'Cancelled'
WHERE  Status = 'Pending'
AND    ClientID IN (
    SELECT ClientID FROM Clients WHERE Country = 'Romania'
);

-- Mărim stocul produselor care nu au fost comandate niciodată
UPDATE Products
SET    Stock = Stock + 50
WHERE  ProductID NOT IN (
    SELECT DISTINCT ProductID FROM OrderDetails
);
```

---

## UPDATE cu subinterogare în SET

Obținem noua valoare dintr-o subinterogare corelată:

```sql
-- Recalculăm TotalAmount pentru fiecare comandă pe baza rândurilor sale din OrderDetails
UPDATE Orders
SET    TotalAmount = (
    SELECT SUM(Quantity * UnitPrice)
    FROM   OrderDetails
    WHERE  OrderDetails.OrderID = Orders.OrderID
);
```

---

## UPDATE cu JOIN (clauza FROM din T-SQL)

T-SQL îți permite să unești tabele într-un UPDATE pentru a obține valorile sau condițiile de actualizare dintr-un tabel asociat. Aceasta este o facilitate puternică a T-SQL.

**Sintaxă:**
```sql
UPDATE  alias_of_table_to_update
SET     alias_of_table_to_update.column = expression
FROM    TableToUpdate AS alias_of_table_to_update
INNER JOIN OtherTable AS alias ON join_condition
WHERE   optional_filter;
```

### Exemplul 1 — Sincronizarea UnitPrice din OrderDetails cu prețurile curente ale produselor

```sql
-- Mai întâi previzualizăm
SELECT od.OrderDetailID, od.UnitPrice AS OldPrice, p.Price AS NewPrice
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  od.UnitPrice <> p.Price;

-- Actualizare
UPDATE od
SET    od.UnitPrice = p.Price
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  od.UnitPrice <> p.Price;
```

### Exemplul 2 — Aplicarea unei reduceri de 15% produselor din categoriile cu vânzări mari

```sql
-- Previzualizare: ce produse aparțin categoriilor cu vânzări totale > 200?
SELECT p.ProductID, p.ProductName, p.Price, total.TotalSold
FROM   Products AS p
INNER JOIN (
    SELECT p2.CategoryID, SUM(od.Quantity * od.UnitPrice) AS TotalSold
    FROM   OrderDetails AS od
    INNER JOIN Products AS p2 ON od.ProductID = p2.ProductID
    GROUP BY p2.CategoryID
    HAVING SUM(od.Quantity * od.UnitPrice) > 200
) AS total ON p.CategoryID = total.CategoryID;

-- Actualizare
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

### Exemplul 3 — Setarea ShippingAddress din adresa înregistrată a clientului, pentru comenzile care nu au una

```sql
-- Previzualizare
SELECT o.OrderID, o.ShippingAddress, cl.Address + ', ' + cl.City AS ClientAddr
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
WHERE  o.ShippingAddress IS NULL;

-- Actualizare
UPDATE o
SET    o.ShippingAddress = cl.Address + ', ' + cl.City + ', ' + cl.Country
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
WHERE  o.ShippingAddress IS NULL;
```

### Exemplul 4 — LEFT JOIN pentru actualizare condiționată (se actualizează doar dacă există corespondent)

```sql
-- Reducem stocul fiecărui produs vândut cu numărul total de unități vândute
-- LEFT JOIN, astfel încât produsele fără vânzări își păstrează stocul curent
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

## UPDATE cu clauza OUTPUT

`OUTPUT` capturează starea rândurilor înainte și după actualizare.

```sql
-- Actualizăm statusul și vedem valorile vechi și noi
UPDATE Orders
SET    Status = 'Delivered'
OUTPUT DELETED.OrderID,
       DELETED.Status  AS OldStatus,
       INSERTED.Status AS NewStatus
WHERE  Status = 'Shipped';
```

Salvăm modificările capturate într-un tabel de audit:

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

## Tranzacții pentru siguranță

Include un UPDATE riscant într-o tranzacție, ca să-l poți anula (rollback) dacă ceva pare greșit:

```sql
BEGIN TRANSACTION;

UPDATE Products
SET    Price = Price * 1.10
WHERE  CategoryID = 1;

-- Verificăm rezultatul înainte de confirmare (commit)
SELECT ProductID, ProductName, Price FROM Products WHERE CategoryID = 1;

-- Dacă arată corect:
COMMIT TRANSACTION;

-- Dacă ceva este greșit:
-- ROLLBACK TRANSACTION;
```

---

## Greșeli frecvente

```sql
-- GREȘEALA 1: Fără clauza WHERE (actualizează TOATE produsele)
UPDATE Products SET Price = 9.99;   -- PERICOL

-- GREȘEALA 2: Actualizarea aliasului greșit într-un UPDATE cu FROM/JOIN
UPDATE od                           -- alias corect — acesta este tabelul actualizat
SET    od.UnitPrice = p.Price
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID;

-- Dacă ai scris din greșeală:
UPDATE p                            -- GREȘIT — aceasta ar actualiza Products, nu OrderDetails
SET    p.Price = od.UnitPrice
FROM   OrderDetails AS od
INNER JOIN Products AS p ON od.ProductID = p.ProductID;
```

---

## Exerciții practice

**Exercițiul 1**
Actualizează `Stock` pentru produsul cu `ProductID = 3` la valoarea `25`.

**Exercițiul 2**
Mărește cu 5% prețul tuturor produselor din categoria `Clothing`.

**Exercițiul 3**
Setează la `'Cancelled'` valoarea `Status` pentru toate comenzile plasate de clientul cu `ClientID = 2` care sunt în prezent `'Pending'`.

**Exercițiul 4**
Folosind o subinterogare în `WHERE`, actualizează toate rândurile din `OrderDetails`, setând `Quantity = 1` acolo unde `Status`-ul comenzii este `'Cancelled'`.

**Exercițiul 5**
Folosind `UPDATE ... FROM ... JOIN`, actualizează `TotalAmount` pentru fiecare comandă astfel încât să fie egal cu suma `Quantity * UnitPrice` din rândurile sale din `OrderDetails`. (Recalculează de la zero.)

**Exercițiul 6**
Folosind `UPDATE ... FROM ... JOIN`, setează `Description` pentru fiecare produs astfel încât să includă numele categoriei ca prefix, de ex. `'[Electronics] Wireless Mouse'`. Unește `Products` și `Categories`.

**Exercițiul 7**
Folosind `UPDATE` cu `OUTPUT`, schimbă toate comenzile `'Pending'` în `'Processing'` și capturează `OrderID`, statusul vechi și statusul nou într-o variabilă de tip tabel. La final, afișează conținutul variabilei.

**Exercițiul 8**
Folosind o tranzacție, aplică o creștere de preț de 20% tuturor produselor din Electronics, apoi execută imediat un `SELECT` pe acele produse pentru a verifica modificarea. Fă fie `COMMIT`, fie `ROLLBACK`, cu o explicație.
