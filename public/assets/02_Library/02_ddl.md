# Library Database — Worksheet 2: DDL — Creating the Database

## Learning Objectives
- Create the LibraryDB schema from scratch using T-SQL DDL statements
- Define tables in the correct order respecting foreign key dependencies
- Apply appropriate constraints (PK, FK, UNIQUE, CHECK, DEFAULT, NOT NULL)
- Modify and drop tables safely

---

## DDL Overview

| Statement | Purpose |
|---|---|
| `CREATE DATABASE` | Creates a new database |
| `CREATE TABLE` | Defines a new table with columns and constraints |
| `ALTER TABLE` | Adds, modifies, or drops columns and constraints |
| `DROP TABLE` | Permanently removes a table and its data |
| `TRUNCATE TABLE` | Removes all rows but keeps the table structure |

---

## Step 1: Creating the Database

```sql
USE master;
GO

CREATE DATABASE LibraryDB;
GO

USE LibraryDB;
GO
```

---

## Step 2: Creating the Tables

**Creation order (parent tables first):**
Authors → Publishers → Titles → Books → Clients → Rentals

---

### Table 1: Authors

Stores information about book authors. No FK dependencies.

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

### Table 2: Publishers

Stores publishing company information. No FK dependencies.

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

### Table 3: Titles

Represents a book title (the intellectual work). References `Authors`.

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

### Table 4: Books

Represents a physical copy of a title. References both `Titles` and `Publishers`.

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

### Table 5: Clients

Library members who can rent books. No FK dependencies.

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

### Table 6: Rentals

Records each rental transaction. References `Clients` and `Books`.

```sql
CREATE TABLE Rentals (
    RentalID    INT  IDENTITY(1,1)    NOT NULL,
    ClientID    INT                   NOT NULL,
    BookID      INT                   NOT NULL,
    RentalDate  DATE DEFAULT GETDATE() NOT NULL,
    DueDate     DATE                  NOT NULL,
    ReturnDate  DATE                  NULL,        -- NULL = not yet returned
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

## Step 3: Adding Foreign Keys with ALTER TABLE

As an alternative to inline FK definitions:

```sql
-- Add FK to Titles after both tables exist
ALTER TABLE Titles
ADD CONSTRAINT FK_Titles_Authors
    FOREIGN KEY (AuthorID) REFERENCES Authors(AuthorID);
GO

-- Add FKs to Books
ALTER TABLE Books
ADD CONSTRAINT FK_Books_Titles
    FOREIGN KEY (TitleID) REFERENCES Titles(TitleID);
GO

ALTER TABLE Books
ADD CONSTRAINT FK_Books_Publishers
    FOREIGN KEY (PublisherID) REFERENCES Publishers(PublisherID);
GO

-- Add FKs to Rentals
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

## Step 4: Verifying the Schema

```sql
-- View structure of a specific table
EXEC sp_help 'Rentals';
GO

-- List all tables and their columns
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM   INFORMATION_SCHEMA.COLUMNS
WHERE  TABLE_NAME IN ('Authors','Publishers','Titles','Books','Clients','Rentals')
ORDER  BY TABLE_NAME, ORDINAL_POSITION;
GO

-- List all constraints
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM   INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER  BY TABLE_NAME, CONSTRAINT_TYPE;
GO
```

---

## Step 5: Modifying Tables

```sql
-- Add a 'Website' column to Publishers
ALTER TABLE Publishers
ADD Website NVARCHAR(200) NULL;
GO

-- Change the Genre column length
ALTER TABLE Titles
ALTER COLUMN Genre NVARCHAR(150) NULL;
GO

-- Add a CHECK constraint ensuring email contains '@'
ALTER TABLE Clients
ADD CONSTRAINT CHK_Clients_Email CHECK (Email LIKE '%@%');
GO

-- Remove a constraint
ALTER TABLE Clients
DROP CONSTRAINT CHK_Clients_Email;
GO

-- Drop the Website column
ALTER TABLE Publishers
DROP COLUMN Website;
GO
```

---

## Step 6: Dropping Tables and the Database

```sql
-- Drop in reverse dependency order (child first)
DROP TABLE IF EXISTS Rentals;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Titles;
DROP TABLE IF EXISTS Clients;
DROP TABLE IF EXISTS Publishers;
DROP TABLE IF EXISTS Authors;
GO

-- Drop the database
USE master;
GO
DROP DATABASE IF EXISTS LibraryDB;
GO
```

---

## Complete Ready-to-Run Script

```sql
-- ============================================================
-- LibraryDB — Full Creation Script
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

## Practice Exercises

**Exercise 1**
Write a `CREATE TABLE` statement for a `BookReservations` table: `ReservationID` (auto PK), `ClientID` (FK to Clients), `TitleID` (FK to Titles), `ReservationDate` (date, default today), `ExpiryDate` (date, required), `Status` (`'Active'` or `'Expired'`, default `'Active'`).

**Exercise 2**
Add a `MaxRentalDays` column (INT, default 14, must be between 1 and 60) to the `Clients` table using `ALTER TABLE`.

**Exercise 3**
Write a query using `INFORMATION_SCHEMA` to find all foreign key columns in the LibraryDB — show table name, column name, and referenced table name.

**Exercise 4**
A junior developer tries to create `Rentals` before `Books`. What error message will SQL Server produce and why?

**Exercise 5**
Write the complete DROP sequence to remove all tables from LibraryDB in a safe order, then drop the database itself.
