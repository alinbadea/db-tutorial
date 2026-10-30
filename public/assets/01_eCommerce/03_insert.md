# Baza de date eCommerce — Fișa de lucru 3: Instrucțiuni INSERT

## Obiective de învățare
- Scrierea instrucțiunilor `INSERT` folosind toate formele principale din T-SQL
- Înțelegerea motivului pentru care o listă de coloane este o bună practică
- Inserarea mai multor rânduri într-o singură instrucțiune
- Folosirea `INSERT...SELECT` și a clauzei `OUTPUT`
- Lucrul corect cu coloanele `IDENTITY`

---

## Sintaxa INSERT

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

Explicarea tuturor părților:
- `INSERT INTO` — cuvântul-cheie care introduce tabelul țintă
- `(column1, column2, ...)` — lista de coloane, opțională, dar recomandată
- `VALUES (...)` — datele de inserat

---

## Metoda 1: INSERT fără listă de coloane

Omiți numele coloanelor și furnizezi valorile exact în ordinea în care au fost definite coloanele în tabel.

```sql
INSERT INTO Categories
VALUES ('Electronics', 'Electronic devices and accessories');
```

> **Atenție:** Această formă nu mai funcționează din momentul în care cineva adaugă, reordonează sau elimină o coloană din tabel. De asemenea, te obligă să furnizezi valori pentru fiecare coloană care nu este IDENTITY. Evit-o în codul de producție.

---

## Metoda 2: INSERT cu listă de coloane (bună practică)

Numește întotdeauna coloanele în care inserezi:

```sql
INSERT INTO Categories (CategoryName, Description)
VALUES ('Electronics', 'Electronic devices and accessories');
```

**De ce este mai bine:**
- Ordinea coloanelor nu contează
- Coloanele IDENTITY sunt omise automat
- Coloanele care acceptă NULL pot fi omise (primesc NULL)
- Dacă schema tabelului se schimbă, INSERT-ul funcționează în continuare, atât timp cât sunt furnizate coloanele obligatorii

---

## Metoda 3: Inserarea mai multor rânduri într-o singură instrucțiune

T-SQL îți permite să furnizezi mai multe seturi de valori în `VALUES`, separate prin virgule:

```sql
INSERT INTO Categories (CategoryName, Description)
VALUES
    ('Electronics',   'Electronic devices and accessories'),
    ('Books',         'Books and educational materials'),
    ('Sports',        'Sports equipment and apparel'),
    ('Clothing',      'Fashion and everyday clothing'),
    ('Home & Garden', 'Furniture, gardening, and home decor');
```

**Avantaj de performanță:** O singură comunicare prin rețea și o singură tranzacție pentru toate rândurile, ceea ce este mai rapid decât cinci instrucțiuni `INSERT` separate.

---

## Metoda 4: INSERT … SELECT

Inserează rezultatele unei interogări într-un tabel. Util pentru copierea datelor, popularea dintr-un tabel intermediar (staging) sau derivarea de rânduri din date existente.

```sql
-- Copiem toate produsele din categoria Electronics în tabelul ArchiveProducts
INSERT INTO ArchiveProducts (ProductName, Price, Stock)
SELECT ProductName, Price, Stock
FROM   Products
WHERE  CategoryID = (SELECT CategoryID FROM Categories WHERE CategoryName = 'Electronics');
```

Folosirea unui CTE (Common Table Expression — expresie de tabel comună) pentru a construi rândurile:

```sql
-- Recalculăm TotalAmount pentru fiecare comandă pe baza rândurilor sale de detaliu
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

## Coloane IDENTITY

`IDENTITY(seed, increment)` îi spune lui SQL Server să genereze automat valoarea cheii primare.

- `seed` — valoarea pentru primul rând (de obicei 1)
- `increment` — cât se adaugă pentru fiecare rând nou (de obicei 1)

**Nu incluzi niciodată o coloană IDENTITY într-un INSERT.** SQL Server o completează automat.

```sql
-- Corect: CategoryID este omis; SQL Server îl atribuie
INSERT INTO Categories (CategoryName, Description)
VALUES ('Toys', 'Children toys and games');

-- Obținem ID-ul tocmai generat (sigur față de domeniul de vizibilitate)
SELECT SCOPE_IDENTITY();          -- recomandat: ID-ul din această sesiune și acest domeniu
SELECT @@IDENTITY;                 -- ID-ul din această sesiune (orice domeniu — evită dacă există triggere)
SELECT IDENT_CURRENT('Categories'); -- cel mai recent ID inserat în acel tabel, de oricine
```

---

## SET IDENTITY_INSERT

Ocazional trebuie să furnizezi o anumită valoare pentru cheia primară (de ex., la restaurarea dintr-o copie de siguranță sau pentru a umple un gol). Activează temporar această opțiune:

```sql
SET IDENTITY_INSERT Categories ON;

INSERT INTO Categories (CategoryID, CategoryName, Description)
VALUES (99, 'Legacy', 'Old category for migration purposes');

SET IDENTITY_INSERT Categories OFF;
```

> **Important:** Într-o sesiune, doar un singur tabel o dată poate avea `IDENTITY_INSERT ON`. Dezactivează-l întotdeauna (OFF) după ce ai terminat.

---

## INSERT cu clauza OUTPUT

`OUTPUT` îți permite să capturezi rândurile tocmai inserate, inclusiv valorile IDENTITY generate automat.

```sql
-- Capturăm noul CategoryID imediat după inserare
INSERT INTO Categories (CategoryName, Description)
OUTPUT INSERTED.CategoryID, INSERTED.CategoryName
VALUES ('Automotive', 'Car accessories and parts');
```

Salvăm rezultatul într-o variabilă de tip tabel:

```sql
DECLARE @NewIDs TABLE (CategoryID INT, CategoryName NVARCHAR(100));

INSERT INTO Categories (CategoryName, Description)
OUTPUT INSERTED.CategoryID, INSERTED.CategoryName
INTO   @NewIDs
VALUES ('Automotive', 'Car accessories and parts');

SELECT * FROM @NewIDs;
```

---

## Script complet cu date de exemplu

Rulează acest script după ce ai creat baza de date cu Fișa de lucru 2. Inserează în ordinea corectă impusă de cheile străine: Categories → Clients → Products → Orders → OrderDetails.

```sql
USE eCommerceDB;
GO

-- ===========================
-- Categories (5 rânduri)
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
-- Clients (6 rânduri)
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
-- Products (8 rânduri)
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
-- Orders (6 rânduri)
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
-- OrderDetails (10 rânduri)
-- ===========================
INSERT INTO OrderDetails (OrderID, ProductID, Quantity, UnitPrice)
VALUES
    (1, 1, 2,  29.99),   -- Comanda 1: 2x Wireless Mouse
    (1, 2, 1,  74.99),   -- Comanda 1: 1x USB Keyboard
    (2, 4, 1,  59.99),   -- Comanda 2: 1x SQL Server 2022 Guide
    (2, 5, 2,  39.99),   -- Comanda 2: 2x Clean Code
    (3, 6, 1,  89.99),   -- Comanda 3: 1x Running Shoes
    (3, 7, 3,  19.99),   -- Comanda 3: 3x Cotton T-Shirt
    (4, 1, 1,  29.99),   -- Comanda 4: 1x Wireless Mouse
    (4, 3, 1, 399.99),   -- Comanda 4: 1x 27" Monitor
    (5, 2, 2,  74.99),   -- Comanda 5: 2x USB Keyboard
    (6, 8, 1,  24.99);   -- Comanda 6: 1x Garden Hoe
GO

-- Actualizăm TotalAmount pe baza detaliilor reale ale comenzilor
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

## Exerciții practice

**Exercițiul 1**
Scrie o instrucțiune `INSERT` care adaugă o categorie nouă numită `"Automotive"` cu descrierea `"Car parts and accessories"`. Obține imediat după aceea valoarea `CategoryID` generată automat.

**Exercițiul 2**
Scrie o singură instrucțiune `INSERT` care adaugă trei clienți noi deodată: unul din New York (USA), unul din Tokyo (Japan) și unul din Sydney (Australia). Include doar câmpurile obligatorii.

**Exercițiul 3**
Folosind `INSERT...SELECT`, scrie o interogare care inserează într-un tabel `ArchiveOrders` (presupune că are aceeași structură ca `Orders`) toate comenzile al căror `Status` este `'Cancelled'`.

**Exercițiul 4**
O comandă a fost plasată manual într-un sistem extern și a primit `OrderID = 1000`. Scrie instrucțiunile pentru a o insera în tabelul `Orders` cu acel ID anume, apoi inserează două rânduri `OrderDetails` pentru ea.

**Exercițiul 5**
Scrie un `INSERT` cu clauza `OUTPUT` care inserează un produs nou și returnează în setul de rezultate valorile `ProductID` (generată automat), `ProductName` și `Price`.
