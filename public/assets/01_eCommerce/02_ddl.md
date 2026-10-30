# Baza de date eCommerce — Fișa de lucru 2: DDL — Crearea bazei de date

## Obiective de învățare
- Folosirea `CREATE DATABASE` și `CREATE TABLE` pentru a construi o bază de date de la zero
- Definirea cheilor primare, a cheilor străine și a altor constrângeri în T-SQL
- Folosirea `ALTER TABLE` pentru a adăuga sau modifica constrângeri după crearea unui tabel
- Ștergerea în siguranță a tabelelor și a bazelor de date, în ordinea corectă

---

## Prezentare generală DDL

Instrucțiunile DDL (Data Definition Language — limbajul de definire a datelor) definesc și modifică **structura** obiectelor bazei de date.

| Instrucțiune | Scop |
|---|---|
| `CREATE` | Creează o bază de date nouă, un tabel, o vedere, un index etc. |
| `ALTER` | Modifică o structură existentă (adaugă/elimină/schimbă coloane sau constrângeri) |
| `DROP` | Elimină definitiv un obiect al bazei de date |
| `TRUNCATE` | Elimină toate rândurile dintr-un tabel, dar păstrează structura |

---

## Pasul 1: Crearea bazei de date

```sql
-- Creăm baza de date
CREATE DATABASE eCommerceDB;
GO

-- Trecem la ea
USE eCommerceDB;
GO
```

> **Notă:** Cuvântul-cheie `GO` nu este SQL — este un separator de loturi (batch) folosit de SQL Server Management Studio (SSMS) și de sqlcmd pentru a trimite serverului comenzile precedente ca un singur lot.

---

## Pasul 2: Crearea tabelelor

Tabelele trebuie create **începând cu tabelele părinte**. Un tabel copil care referă un părinte printr-o cheie străină nu poate fi creat înainte ca părintele să existe.

**Ordinea de creare:** Categories → Clients → Products → Orders → OrderDetails

---

### Tabelul 1: Categories

Stochează categoriile de produse. Este un tabel părinte, fără chei străine.

```sql
CREATE TABLE Categories (
    CategoryID   INT            IDENTITY(1,1)  NOT NULL,
    CategoryName NVARCHAR(100)                 NOT NULL,
    Description  NVARCHAR(500)                 NULL,

    CONSTRAINT PK_Categories PRIMARY KEY (CategoryID),
    CONSTRAINT UQ_Categories_Name UNIQUE (CategoryName)
);
GO
```

---

### Tabelul 2: Clients

Stochează clienții înregistrați.

```sql
CREATE TABLE Clients (
    ClientID    INT           IDENTITY(1,1)   NOT NULL,
    FirstName   NVARCHAR(100)                 NOT NULL,
    LastName    NVARCHAR(100)                 NOT NULL,
    Email       NVARCHAR(200)                 NOT NULL,
    Phone       NVARCHAR(20)                  NULL,
    Address     NVARCHAR(300)                 NULL,
    City        NVARCHAR(100)                 NULL,
    Country     NVARCHAR(100)                 NULL,
    CreatedDate DATE          DEFAULT GETDATE() NOT NULL,

    CONSTRAINT PK_Clients PRIMARY KEY (ClientID),
    CONSTRAINT UQ_Clients_Email UNIQUE (Email)
);
GO
```

---

### Tabelul 3: Products

Stochează articolele de vânzare. Referă `Categories`.

```sql
CREATE TABLE Products (
    ProductID   INT              IDENTITY(1,1)  NOT NULL,
    ProductName NVARCHAR(200)                   NOT NULL,
    Description NVARCHAR(500)                   NULL,
    Price       DECIMAL(10, 2)                  NOT NULL,
    Stock       INT              DEFAULT 0       NOT NULL,
    CategoryID  INT                              NOT NULL,

    CONSTRAINT PK_Products    PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Categories
        FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT CHK_Products_Price
        CHECK (Price >= 0),
    CONSTRAINT CHK_Products_Stock
        CHECK (Stock >= 0)
);
GO
```

---

### Tabelul 4: Orders

Stochează antetele comenzilor. Referă `Clients`.

```sql
CREATE TABLE Orders (
    OrderID         INT              IDENTITY(1,1)    NOT NULL,
    ClientID        INT                               NOT NULL,
    OrderDate       DATETIME         DEFAULT GETDATE() NOT NULL,
    ShippingAddress NVARCHAR(300)                     NULL,
    Status          NVARCHAR(50)     DEFAULT 'Pending' NOT NULL,
    TotalAmount     DECIMAL(10, 2)                    NULL,

    CONSTRAINT PK_Orders PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Clients
        FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    CONSTRAINT CHK_Orders_Status
        CHECK (Status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    CONSTRAINT CHK_Orders_TotalAmount
        CHECK (TotalAmount IS NULL OR TotalAmount >= 0)
);
GO
```

---

### Tabelul 5: OrderDetails

Stochează liniile individuale (articolele) dintr-o comandă. Referă atât `Orders`, cât și `Products`.

```sql
CREATE TABLE OrderDetails (
    OrderDetailID INT            IDENTITY(1,1) NOT NULL,
    OrderID       INT                          NOT NULL,
    ProductID     INT                          NOT NULL,
    Quantity      INT                          NOT NULL,
    UnitPrice     DECIMAL(10, 2)               NOT NULL,

    CONSTRAINT PK_OrderDetails PRIMARY KEY (OrderDetailID),
    CONSTRAINT FK_OrderDetails_Orders
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT FK_OrderDetails_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT CHK_OrderDetails_Quantity
        CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderDetails_UnitPrice
        CHECK (UnitPrice >= 0)
);
GO
```

---

## Pasul 3: Adăugarea cheilor străine cu ALTER TABLE (metodă alternativă)

În loc să definești cheile străine în interiorul `CREATE TABLE`, le poți adăuga ulterior:

```sql
-- Adăugăm FK în Products după ce ambele tabele există
ALTER TABLE Products
ADD CONSTRAINT FK_Products_Categories
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID);
GO

-- Adăugăm FK în Orders după ce ambele tabele există
ALTER TABLE Orders
ADD CONSTRAINT FK_Orders_Clients
    FOREIGN KEY (ClientID) REFERENCES Clients(ClientID);
GO

-- Adăugăm FK-urile în OrderDetails
ALTER TABLE OrderDetails
ADD CONSTRAINT FK_OrderDetails_Orders
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID);
GO

ALTER TABLE OrderDetails
ADD CONSTRAINT FK_OrderDetails_Products
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID);
GO
```

> **Când folosim această abordare:** Când trebuie să creăm tabele ale căror referințe FK formează un ciclu sau când adăugăm constrângeri unei baze de date existente fără a reconstrui tabelele.

---

## Pasul 4: Verificarea schemei

```sql
-- Vizualizăm toate coloanele unui tabel
EXEC sp_help 'Products';
GO

-- Listăm toate coloanele cu tipurile lor de date
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Products';
GO

-- Listăm toate constrângerile
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
GO

-- Listăm relațiile de cheie străină
SELECT
    fk.name                       AS FK_Name,
    tp.name                       AS Parent_Table,
    cp.name                       AS Parent_Column,
    tr.name                       AS Referenced_Table,
    cr.name                       AS Referenced_Column
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.tables tp  ON fkc.parent_object_id     = tp.object_id
JOIN sys.columns cp ON fkc.parent_object_id     = cp.object_id
                    AND fkc.parent_column_id     = cp.column_id
JOIN sys.tables tr  ON fkc.referenced_object_id = tr.object_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id
                    AND fkc.referenced_column_id = cr.column_id;
GO
```

---

## Pasul 5: Modificarea tabelelor cu ALTER TABLE

```sql
-- Adăugăm o coloană nouă
ALTER TABLE Clients
ADD DateOfBirth DATE NULL;
GO

-- Schimbăm tipul de date al unei coloane
ALTER TABLE Clients
ALTER COLUMN Phone NVARCHAR(30) NULL;
GO

-- Ștergem o coloană
ALTER TABLE Clients
DROP COLUMN DateOfBirth;
GO

-- Adăugăm o constrângere CHECK unui tabel existent
ALTER TABLE Products
ADD CONSTRAINT CHK_Products_Name CHECK (LEN(ProductName) >= 2);
GO

-- Ștergem o constrângere
ALTER TABLE Products
DROP CONSTRAINT CHK_Products_Name;
GO
```

---

## Pasul 6: Ștergerea tabelelor și a bazei de date

Tabelele trebuie șterse **începând cu tabelele copil** (în ordinea inversă creării).

```sql
-- Ștergem în ordinea inversă a dependențelor
DROP TABLE IF EXISTS OrderDetails;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Clients;
DROP TABLE IF EXISTS Categories;
GO

-- Ștergem baza de date (mai întâi trebuie să trecem pe altă bază de date)
USE master;
GO
DROP DATABASE IF EXISTS eCommerceDB;
GO
```

---

## Script complet, gata de rulat

```sql
-- ============================================================
-- eCommerceDB — Script complet de creare
-- Rulează acest script în SSMS pentru a construi baza de date de la zero
-- ============================================================

USE master;
GO

-- Ștergem baza de date existentă, dacă există
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'eCommerceDB')
BEGIN
    ALTER DATABASE eCommerceDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE eCommerceDB;
END
GO

CREATE DATABASE eCommerceDB;
GO
USE eCommerceDB;
GO

-- Categories
CREATE TABLE Categories (
    CategoryID   INT            IDENTITY(1,1)  NOT NULL,
    CategoryName NVARCHAR(100)                 NOT NULL,
    Description  NVARCHAR(500)                 NULL,
    CONSTRAINT PK_Categories PRIMARY KEY (CategoryID),
    CONSTRAINT UQ_Categories_Name UNIQUE (CategoryName)
);
GO

-- Clients
CREATE TABLE Clients (
    ClientID    INT           IDENTITY(1,1)    NOT NULL,
    FirstName   NVARCHAR(100)                  NOT NULL,
    LastName    NVARCHAR(100)                  NOT NULL,
    Email       NVARCHAR(200)                  NOT NULL,
    Phone       NVARCHAR(20)                   NULL,
    Address     NVARCHAR(300)                  NULL,
    City        NVARCHAR(100)                  NULL,
    Country     NVARCHAR(100)                  NULL,
    CreatedDate DATE          DEFAULT GETDATE() NOT NULL,
    CONSTRAINT PK_Clients      PRIMARY KEY (ClientID),
    CONSTRAINT UQ_Clients_Email UNIQUE (Email)
);
GO

-- Products
CREATE TABLE Products (
    ProductID   INT              IDENTITY(1,1) NOT NULL,
    ProductName NVARCHAR(200)                  NOT NULL,
    Description NVARCHAR(500)                  NULL,
    Price       DECIMAL(10, 2)                 NOT NULL,
    Stock       INT              DEFAULT 0      NOT NULL,
    CategoryID  INT                             NOT NULL,
    CONSTRAINT PK_Products PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT CHK_Products_Price CHECK (Price >= 0),
    CONSTRAINT CHK_Products_Stock CHECK (Stock >= 0)
);
GO

-- Orders
CREATE TABLE Orders (
    OrderID         INT              IDENTITY(1,1)     NOT NULL,
    ClientID        INT                                NOT NULL,
    OrderDate       DATETIME         DEFAULT GETDATE()  NOT NULL,
    ShippingAddress NVARCHAR(300)                      NULL,
    Status          NVARCHAR(50)     DEFAULT 'Pending'  NOT NULL,
    TotalAmount     DECIMAL(10, 2)                     NULL,
    CONSTRAINT PK_Orders PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Clients FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending','Processing','Shipped','Delivered','Cancelled'))
);
GO

-- OrderDetails
CREATE TABLE OrderDetails (
    OrderDetailID INT            IDENTITY(1,1) NOT NULL,
    OrderID       INT                          NOT NULL,
    ProductID     INT                          NOT NULL,
    Quantity      INT                          NOT NULL,
    UnitPrice     DECIMAL(10, 2)               NOT NULL,
    CONSTRAINT PK_OrderDetails      PRIMARY KEY (OrderDetailID),
    CONSTRAINT FK_OrderDetails_Orders   FOREIGN KEY (OrderID)    REFERENCES Orders(OrderID),
    CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (ProductID)  REFERENCES Products(ProductID),
    CONSTRAINT CHK_OrderDetails_Qty   CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderDetails_Price CHECK (UnitPrice >= 0)
);
GO
```

---

## Exerciții practice

**Exercițiul 1**
Scrie instrucțiunea `CREATE TABLE` pentru un tabel nou numit `ProductReviews` cu următoarele coloane: `ReviewID` (PK cu auto-incrementare), `ProductID` (FK către Products), `ClientID` (FK către Clients), `Rating` (număr întreg 1–5, obligatoriu), `Comment` (până la 1000 de caractere, opțional), `ReviewDate` (dată, implicit ziua curentă).

**Exercițiul 2**
Tabelul `Orders` are nevoie de o coloană nouă `DiscountAmount` de tip `DECIMAL(10,2)`, care nu poate fi negativă și are valoarea implicită `0`. Scrie instrucțiunea `ALTER TABLE`.

**Exercițiul 3**
Scrie o interogare care folosește `INFORMATION_SCHEMA` pentru a lista numele fiecărui tabel și numărul de coloane ale fiecăruia.

**Exercițiul 4**
Un programator a creat tabelul `OrderDetails` înainte de `Orders` și a primit o eroare. Explică ce eroare este și de ce a apărut.

**Exercițiul 5**
Scrie instrucțiunile pentru a șterge în siguranță întreaga bază de date `eCommerceDB`, tratând inclusiv cazul în care aceasta nu există.
