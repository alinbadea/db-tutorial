# Baza de date eCommerce — Fișa de lucru 5: SELECT — JOIN-uri

## Obiective de învățare
- Înțelegerea motivului pentru care avem nevoie de JOIN-uri și a modului în care funcționează
- Scrierea interogărilor cu INNER JOIN, LEFT JOIN, RIGHT JOIN și FULL OUTER JOIN
- Unirea a trei sau mai multe tabele într-o singură interogare
- Folosirea aliasurilor de tabel pentru interogări mai curate și mai scurte
- Găsirea înregistrărilor care nu au rânduri corespondente într-un tabel asociat

---

## De ce JOIN-uri?

Normalizarea împarte datele în mai multe tabele pentru a elimina redundanța. JOIN-urile reasamblează aceste date în momentul interogării. Fără JOIN-uri, ar trebui să rulezi interogări separate și să potrivești manual rândurile în codul aplicației.

Exemplu de problemă: un rând din `OrderDetails` stochează un `ProductID`, dar nu și numele sau prețul produsului. Pentru a vedea numele produsului alături de cantitate, ai nevoie de un JOIN.

---

## Tipuri de JOIN — Prezentare generală

| Tip de JOIN | Returnează |
|---|---|
| `INNER JOIN` | Doar rândurile care au corespondent în **ambele** tabele |
| `LEFT JOIN` | Toate rândurile din tabelul din stânga + rândurile corespondente din dreapta (NULL unde nu există corespondent) |
| `RIGHT JOIN` | Toate rândurile din tabelul din dreapta + rândurile corespondente din stânga (NULL unde nu există corespondent) |
| `FULL OUTER JOIN` | Toate rândurile din ambele tabele, cu NULL pe partea care nu are corespondent |

---

## Aliasuri de tabel

Numele lungi de tabele devin obositoare la scrierea JOIN-urilor. Atribuie un alias scurt după numele tabelului:

```sql
-- Fără aliasuri (greu de citit)
SELECT Products.ProductName, Categories.CategoryName
FROM   Products
INNER JOIN Categories ON Products.CategoryID = Categories.CategoryID;

-- Cu aliasuri (mai curat)
SELECT p.ProductName, c.CategoryName
FROM   Products   AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID;
```

Când faci JOIN, califică întotdeauna numele coloanelor cu aliasul tabelului, pentru a evita erorile de ambiguitate.

---

## INNER JOIN

Returnează doar rândurile pentru care condiția de JOIN este adevărată în ambele tabele. Rândurile fără corespondent, din oricare parte, sunt excluse.

### Exemplul 1 — Produsele cu numele categoriei lor

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

### Exemplul 2 — Comenzile cu numele complet al clientului

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

### Exemplul 3 — Detaliile comenzilor cu numele produsului și data comenzii (3 tabele)

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

### Exemplul 4 — Bonul complet al comenzii (toate cele 4 tabele)

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

Returnează **toate** rândurile din tabelul din stânga. Pentru rândurile din tabelul din stânga care nu au corespondent în tabelul din dreapta, coloanele din dreapta sunt completate cu `NULL`.

### Exemplul 1 — Clienții și comenzile lor (inclusiv clienții care nu au comandat niciodată)

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

Clienții fără comenzi vor apărea cu `NULL` în coloanele OrderID, OrderDate și Status.

### Exemplul 2 — Produsele și de câte ori au fost comandate

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

### Anti-join — Găsirea clienților care NU au plasat NICIODATĂ o comandă

```sql
SELECT cl.ClientID, cl.FirstName, cl.LastName, cl.Email
FROM   Clients AS cl
LEFT JOIN Orders AS o ON cl.ClientID = o.ClientID
WHERE  o.OrderID IS NULL;
```

**Cum funcționează:** LEFT JOIN include toți clienții. Condiția `WHERE o.OrderID IS NULL` îi păstrează doar pe cei care nu au avut corespondent în `Orders`.

---

## RIGHT OUTER JOIN (RIGHT JOIN)

Returnează toate rândurile din tabelul din dreapta. Este echivalent cu un LEFT JOIN cu tabelele inversate — majoritatea programatorilor preferă LEFT JOIN pentru consecvență.

```sql
-- Toate categoriile, inclusiv cele care încă nu au produse
SELECT
    c.CategoryName,
    p.ProductName,
    p.Price
FROM   Products    AS p
RIGHT JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName;
```

Categoriile fără produse vor apărea cu `NULL` în `ProductName` și `Price`.

---

## FULL OUTER JOIN

Returnează toate rândurile din ambele tabele. Rândurile fără corespondent, din oricare parte, primesc NULL în coloanele celuilalt tabel.

```sql
-- Toate produsele și toate categoriile, afișând și rândurile fără corespondent din ambele părți
SELECT
    p.ProductName,
    c.CategoryName
FROM   Products    AS p
FULL OUTER JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName, p.ProductName;
```

---

## Unirea tuturor tabelelor într-o singură interogare

O singură interogare cuprinzătoare care raportează fiecare linie de comandă cu toate detaliile asociate:

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

## Greșeli frecvente

```sql
-- GREȘEALA 1: Produs cartezian — am uitat clauza ON
-- Aceasta ar returna fiecare produs combinat cu fiecare categorie (periculos!)
SELECT p.ProductName, c.CategoryName
FROM   Products AS p
INNER JOIN Categories AS c;   -- Eroare: clauza ON este obligatorie

-- GREȘEALA 2: Nume de coloană ambiguu — ambele tabele au 'ClientID'
SELECT ClientID, Email          -- Din ce tabel? SQL Server va genera o eroare
FROM   Clients
INNER JOIN Orders ON Clients.ClientID = Orders.ClientID;

-- CORECT: calificăm fiecare coloană care există în mai multe tabele
SELECT cl.ClientID, cl.Email, o.OrderID
FROM   Clients AS cl
INNER JOIN Orders AS o ON cl.ClientID = o.ClientID;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Listează fiecare produs împreună cu numele categoriei sale. Afișează `ProductName`, `Price` și `CategoryName`. Sortează după `CategoryName`.

**Exercițiul 2 (Ușor)**
Afișează `OrderID`, `OrderDate`, `Status` și numele complet al clientului care a plasat fiecare comandă.

**Exercițiul 3 (Mediu)**
Pentru fiecare detaliu de comandă, afișează `OrderID`, `ClientName` (complet), `ProductName`, `Quantity` și `LineTotal` (Quantity × UnitPrice). Sortează după `OrderID`.

**Exercițiul 4 (Mediu)**
Găsește toți clienții care **nu au plasat niciodată** o comandă. Afișează `ClientID`, numele complet și `Email`.

**Exercițiul 5 (Mediu)**
Listează toate categoriile împreună cu numărul de produse din fiecare. Include și categoriile care nu au niciun produs. Afișează `CategoryName` și o coloană numită `ProductCount`.

**Exercițiul 6 (Mediu)**
Afișează toate produsele împreună cu cantitatea totală vândută vreodată (suma `Quantity` din `OrderDetails`). Include produsele care nu au fost vândute niciodată (afișează 0 sau NULL). Sortează descrescător după totalul vândut.

**Exercițiul 7 (Dificil)**
Scrie o interogare care afișează, pentru fiecare client, `FullName`, `City`, numărul de comenzi plasate (`OrderCount`) și suma totalurilor tuturor comenzilor sale (`TotalSpent`). Include doar clienții care au cel puțin o comandă. Sortează descrescător după `TotalSpent`.

**Exercițiul 8 (Dificil)**
Listează toate liniile de comandă la care `UnitPrice` facturat diferă de `Price` curent din tabelul `Products`. Afișează `OrderID`, `ProductName`, `UnitPrice` (cel facturat) și `CurrentPrice` (din Products). Acest lucru poate indica modificări de preț de la plasarea comenzii.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT p.ProductName, p.Price, c.CategoryName
FROM   Products AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
ORDER BY c.CategoryName;
```

**Exercițiul 2**
```sql
SELECT o.OrderID, o.OrderDate, o.Status,
       cl.FirstName + ' ' + cl.LastName AS ClientName
FROM   Orders AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID;
```

**Exercițiul 3**
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

**Exercițiul 4**
```sql
SELECT cl.ClientID, cl.FirstName + ' ' + cl.LastName AS FullName, cl.Email
FROM   Clients AS cl
LEFT JOIN Orders AS o ON cl.ClientID = o.ClientID
WHERE  o.OrderID IS NULL;
```

**Exercițiul 5**
```sql
SELECT c.CategoryName, COUNT(p.ProductID) AS ProductCount
FROM   Categories AS c
LEFT JOIN Products AS p ON c.CategoryID = p.CategoryID
GROUP BY c.CategoryID, c.CategoryName
ORDER BY ProductCount DESC;
```

**Exercițiul 6**
```sql
SELECT p.ProductName, COALESCE(SUM(od.Quantity), 0) AS TotalSold
FROM   Products     AS p
LEFT JOIN OrderDetails AS od ON p.ProductID = od.ProductID
GROUP BY p.ProductID, p.ProductName
ORDER BY TotalSold DESC;
```

**Exercițiul 7**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName, cl.City,
       COUNT(o.OrderID)     AS OrderCount,
       SUM(o.TotalAmount)   AS TotalSpent
FROM   Clients AS cl
INNER JOIN Orders AS o ON cl.ClientID = o.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName, cl.City
ORDER BY TotalSpent DESC;
```

**Exercițiul 8**
```sql
SELECT o.OrderID, p.ProductName,
       od.UnitPrice AS ChargedPrice,
       p.Price      AS CurrentPrice
FROM   OrderDetails AS od
INNER JOIN Orders   AS o ON od.OrderID   = o.OrderID
INNER JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  od.UnitPrice <> p.Price;
```
