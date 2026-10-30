# Baza de date Library — Fișa de lucru 2: DDL — Crearea bazei de date

## Obiective de învățare
- Crearea schemei LibraryDB de la zero, folosind instrucțiuni DDL T-SQL
- Definirea tabelelor în ordinea corectă, respectând dependențele de cheie străină
- Aplicarea constrângerilor potrivite (PK, FK, UNIQUE, CHECK, DEFAULT, NOT NULL)
- Modificarea și ștergerea în siguranță a tabelelor

---

## Prezentare generală DDL

| Instrucțiune | Scop |
|---|---|
| `CREATE DATABASE` | Creează o bază de date nouă |
| `CREATE TABLE` | Definește un tabel nou, cu coloane și constrângeri |
| `ALTER TABLE` | Adaugă, modifică sau șterge coloane și constrângeri |
| `DROP TABLE` | Elimină definitiv un tabel și datele sale |
| `TRUNCATE TABLE` | Elimină toate rândurile, dar păstrează structura tabelului |

---

## Pasul 1: Crearea bazei de date

```sql
USE master;
GO

CREATE DATABASE LibraryDB;
GO

USE LibraryDB;
GO
```

---

## Pasul 2: Crearea tabelelor

**Ordinea de creare (mai întâi tabelele părinte):**
Authors → Publishers → Titles → Books → Clients → Rentals

---

### Tabelul 1: Authors

Stochează informații despre autorii cărților. Fără dependențe FK.

```sql
CREATE TABLE Authors (
    AuthorID    INT           IDENTITY(1,1) NOT NULL,
    FirstName   NVARCHAR(100)               NOT NULL,
    LastName    NVARCHAR(100)               NOT NULL,
    Nationality NVARCHAR(100)               NULL,
    BirthDate   DATE                        NULL,

    CONSTRAINT PK_Authors PRIMARY KEY (AuthorID)
);
GO
```

---

### Tabelul 2: Publishers

Stochează informații despre edituri. Fără dependențe FK.

```sql
CREATE TABLE Publishers (
    PublisherID   INT           IDENTITY(1,1) NOT NULL,
    PublisherName NVARCHAR(200)               NOT NULL,
    Address       NVARCHAR(300)               NULL,
    Phone         NVARCHAR(20)                NULL,
    Email         NVARCHAR(200)               NULL,

    CONSTRAINT PK_Publishers      PRIMARY KEY (PublisherID),
    CONSTRAINT UQ_Publishers_Name UNIQUE (PublisherName)
);
GO
```

---

### Tabelul 3: Titles

Reprezintă titlul unei cărți (opera intelectuală). Referă `Authors`.

```sql
CREATE TABLE Titles (
    TitleID       INT            IDENTITY(1,1) NOT NULL,
    Title         NVARCHAR(300)                NOT NULL,
    AuthorID      INT                          NOT NULL,
    Genre         NVARCHAR(100)                NULL,
    PublishedYear INT                          NULL,
    ISBN          NVARCHAR(20)                 NULL,

    CONSTRAINT PK_Titles          PRIMARY KEY (TitleID),
    CONSTRAINT FK_Titles_Authors  FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID),
    CONSTRAINT UQ_Titles_ISBN     UNIQUE (ISBN),
    CONSTRAINT CHK_Titles_Year    CHECK (PublishedYear IS NULL OR PublishedYear BETWEEN 1450 AND 2100)
);
GO
```

---

### Tabelul 4: Books

Reprezintă un exemplar fizic al unui titlu. Referă atât `Titles`, cât și `Publishers`.

```sql
CREATE TABLE Books (
    BookID          INT           IDENTITY(1,1)  NOT NULL,
    TitleID         INT                          NOT NULL,
    PublisherID     INT                          NOT NULL,
    AcquisitionDate DATE                         NULL,
    Condition       NVARCHAR(50)  DEFAULT 'New'  NOT NULL,
    IsAvailable     BIT           DEFAULT 1      NOT NULL,

    CONSTRAINT PK_Books              PRIMARY KEY (BookID),
    CONSTRAINT FK_Books_Titles       FOREIGN KEY (TitleID)     REFERENCES Titles(TitleID),
    CONSTRAINT FK_Books_Publishers   FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID),
    CONSTRAINT CHK_Books_Condition   CHECK (Condition IN ('New', 'Good', 'Fair', 'Poor'))
);
GO
```

---

### Tabelul 5: Clients

Membrii bibliotecii, care pot împrumuta cărți. Fără dependențe FK.

```sql
CREATE TABLE Clients (
    ClientID       INT           IDENTITY(1,1)    NOT NULL,
    FirstName      NVARCHAR(100)                  NOT NULL,
    LastName       NVARCHAR(100)                  NOT NULL,
    Email          NVARCHAR(200)                  NOT NULL,
    Phone          NVARCHAR(20)                   NULL,
    Address        NVARCHAR(300)                  NULL,
    MembershipDate DATE          DEFAULT GETDATE() NOT NULL,

    CONSTRAINT PK_Clients       PRIMARY KEY (ClientID),
    CONSTRAINT UQ_Clients_Email UNIQUE (Email)
);
GO
```

---

### Tabelul 6: Rentals

Înregistrează fiecare tranzacție de împrumut. Referă `Clients` și `Books`.

```sql
CREATE TABLE Rentals (
    RentalID    INT  IDENTITY(1,1)    NOT NULL,
    ClientID    INT                   NOT NULL,
    BookID      INT                   NOT NULL,
    RentalDate  DATE DEFAULT GETDATE() NOT NULL,
    DueDate     DATE                  NOT NULL,
    ReturnDate  DATE                  NULL,        -- NULL = încă nereturnată
    RentalDays  INT                   NOT NULL,

    CONSTRAINT PK_Rentals          PRIMARY KEY (RentalID),
    CONSTRAINT FK_Rentals_Clients  FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    CONSTRAINT FK_Rentals_Books    FOREIGN KEY (BookID)   REFERENCES Books(BookID),
    CONSTRAINT CHK_Rentals_Days    CHECK (RentalDays > 0),
    CONSTRAINT CHK_Rentals_Due     CHECK (DueDate >= RentalDate),
    CONSTRAINT CHK_Rentals_Return  CHECK (ReturnDate IS NULL OR ReturnDate >= RentalDate)
);
GO
```

---

## Pasul 3: Adăugarea cheilor străine cu ALTER TABLE

Ca alternativă la definirea FK direct în tabel:

```sql
-- Adăugăm FK în Titles după ce ambele tabele există
ALTER TABLE Titles
ADD CONSTRAINT FK_Titles_Authors
    FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID);
GO

-- Adăugăm FK-urile în Books
ALTER TABLE Books
ADD CONSTRAINT FK_Books_Titles
    FOREIGN KEY (TitleID) REFERENCES Titles(TitleID);
GO

ALTER TABLE Books
ADD CONSTRAINT FK_Books_Publishers
    FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID);
GO

-- Adăugăm FK-urile în Rentals
ALTER TABLE Rentals
ADD CONSTRAINT FK_Rentals_Clients
    FOREIGN KEY (ClientID) REFERENCES Clients(ClientID);
GO

ALTER TABLE Rentals
ADD CONSTRAINT FK_Rentals_Books
    FOREIGN KEY (BookID) REFERENCES Books(BookID);
GO
```

---

## Pasul 4: Verificarea schemei

```sql
-- Vizualizăm structura unui anumit tabel
EXEC sp_help 'Rentals';
GO

-- Listăm toate tabelele și coloanele lor
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM   INFORMATION_SCHEMA.COLUMNS
WHERE  TABLE_NAME IN ('Authors','Publishers','Titles','Books','Clients','Rentals')
ORDER  BY TABLE_NAME, ORDINAL_POSITION;
GO

-- Listăm toate constrângerile
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM   INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER  BY TABLE_NAME, CONSTRAINT_TYPE;
GO
```

---

## Pasul 5: Modificarea tabelelor

```sql
-- Adăugăm coloana 'Website' în Publishers
ALTER TABLE Publishers
ADD Website NVARCHAR(200) NULL;
GO

-- Schimbăm lungimea coloanei Genre
ALTER TABLE Titles
ALTER COLUMN Genre NVARCHAR(150) NULL;
GO

-- Adăugăm o constrângere CHECK care asigură că emailul conține '@'
ALTER TABLE Clients
ADD CONSTRAINT CHK_Clients_Email CHECK (Email LIKE '%@%');
GO

-- Eliminăm o constrângere
ALTER TABLE Clients
DROP CONSTRAINT CHK_Clients_Email;
GO

-- Ștergem coloana Website
ALTER TABLE Publishers
DROP COLUMN Website;
GO
```

---

## Pasul 6: Ștergerea tabelelor și a bazei de date

```sql
-- Ștergem în ordinea inversă a dependențelor (mai întâi tabelele copil)
DROP TABLE IF EXISTS Rentals;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Titles;
DROP TABLE IF EXISTS Clients;
DROP TABLE IF EXISTS Publishers;
DROP TABLE IF EXISTS Authors;
GO

-- Ștergem baza de date
USE master;
GO
DROP DATABASE IF EXISTS LibraryDB;
GO
```

---

## Script complet, gata de rulat

```sql
-- ============================================================
-- LibraryDB — Script complet de creare
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'LibraryDB')
BEGIN
    ALTER DATABASE LibraryDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE LibraryDB;
END
GO

CREATE DATABASE LibraryDB;
GO
USE LibraryDB;
GO

-- Authors
CREATE TABLE Authors (
    AuthorID    INT           IDENTITY(1,1) NOT NULL,
    FirstName   NVARCHAR(100)               NOT NULL,
    LastName    NVARCHAR(100)               NOT NULL,
    Nationality NVARCHAR(100)               NULL,
    BirthDate   DATE                        NULL,
    CONSTRAINT PK_Authors PRIMARY KEY (AuthorID)
);
GO

-- Publishers
CREATE TABLE Publishers (
    PublisherID   INT           IDENTITY(1,1) NOT NULL,
    PublisherName NVARCHAR(200)               NOT NULL,
    Address       NVARCHAR(300)               NULL,
    Phone         NVARCHAR(20)                NULL,
    Email         NVARCHAR(200)               NULL,
    CONSTRAINT PK_Publishers      PRIMARY KEY (PublisherID),
    CONSTRAINT UQ_Publishers_Name UNIQUE (PublisherName)
);
GO

-- Titles
CREATE TABLE Titles (
    TitleID       INT            IDENTITY(1,1) NOT NULL,
    Title         NVARCHAR(300)                NOT NULL,
    AuthorID      INT                          NOT NULL,
    Genre         NVARCHAR(100)                NULL,
    PublishedYear INT                          NULL,
    ISBN          NVARCHAR(20)                 NULL,
    CONSTRAINT PK_Titles         PRIMARY KEY (TitleID),
    CONSTRAINT FK_Titles_Authors FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID),
    CONSTRAINT UQ_Titles_ISBN    UNIQUE (ISBN),
    CONSTRAINT CHK_Titles_Year   CHECK (PublishedYear IS NULL OR PublishedYear BETWEEN 1450 AND 2100)
);
GO

-- Books
CREATE TABLE Books (
    BookID          INT          IDENTITY(1,1)  NOT NULL,
    TitleID         INT                         NOT NULL,
    PublisherID     INT                         NOT NULL,
    AcquisitionDate DATE                        NULL,
    Condition       NVARCHAR(50) DEFAULT 'New'  NOT NULL,
    IsAvailable     BIT          DEFAULT 1      NOT NULL,
    CONSTRAINT PK_Books            PRIMARY KEY (BookID),
    CONSTRAINT FK_Books_Titles     FOREIGN KEY (TitleID)     REFERENCES Titles(TitleID),
    CONSTRAINT FK_Books_Publishers FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID),
    CONSTRAINT CHK_Books_Condition CHECK (Condition IN ('New','Good','Fair','Poor'))
);
GO

-- Clients
CREATE TABLE Clients (
    ClientID       INT           IDENTITY(1,1)    NOT NULL,
    FirstName      NVARCHAR(100)                  NOT NULL,
    LastName       NVARCHAR(100)                  NOT NULL,
    Email          NVARCHAR(200)                  NOT NULL,
    Phone          NVARCHAR(20)                   NULL,
    Address        NVARCHAR(300)                  NULL,
    MembershipDate DATE          DEFAULT GETDATE() NOT NULL,
    CONSTRAINT PK_Clients       PRIMARY KEY (ClientID),
    CONSTRAINT UQ_Clients_Email UNIQUE (Email)
);
GO

-- Rentals
CREATE TABLE Rentals (
    RentalID   INT  IDENTITY(1,1)    NOT NULL,
    ClientID   INT                   NOT NULL,
    BookID     INT                   NOT NULL,
    RentalDate DATE DEFAULT GETDATE() NOT NULL,
    DueDate    DATE                  NOT NULL,
    ReturnDate DATE                  NULL,
    RentalDays INT                   NOT NULL,
    CONSTRAINT PK_Rentals         PRIMARY KEY (RentalID),
    CONSTRAINT FK_Rentals_Clients FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    CONSTRAINT FK_Rentals_Books   FOREIGN KEY (BookID)   REFERENCES Books(BookID),
    CONSTRAINT CHK_Rentals_Days   CHECK (RentalDays > 0),
    CONSTRAINT CHK_Rentals_Due    CHECK (DueDate >= RentalDate),
    CONSTRAINT CHK_Rentals_Return CHECK (ReturnDate IS NULL OR ReturnDate >= RentalDate)
);
GO
```

---

## Exerciții practice

**Exercițiul 1**
Scrie o instrucțiune `CREATE TABLE` pentru un tabel `BookReservations`: `ReservationID` (PK auto-incrementat), `ClientID` (FK către Clients), `TitleID` (FK către Titles), `ReservationDate` (dată, implicit ziua curentă), `ExpiryDate` (dată, obligatorie), `Status` (`'Active'` sau `'Expired'`, implicit `'Active'`).

**Exercițiul 2**
Adaugă în tabelul `Clients`, folosind `ALTER TABLE`, o coloană `MaxRentalDays` (INT, implicit 14, cu valori obligatoriu între 1 și 60).

**Exercițiul 3**
Scrie o interogare care folosește `INFORMATION_SCHEMA` pentru a găsi toate coloanele de tip cheie străină din LibraryDB — afișează numele tabelului, numele coloanei și numele tabelului referit.

**Exercițiul 4**
Un programator începător încearcă să creeze `Rentals` înainte de `Books`. Ce mesaj de eroare va genera SQL Server și de ce?

**Exercițiul 5**
Scrie secvența completă de DROP pentru a elimina toate tabelele din LibraryDB într-o ordine sigură, apoi șterge baza de date propriu-zisă.
