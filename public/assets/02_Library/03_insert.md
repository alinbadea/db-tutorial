# Library Database — Worksheet 3: INSERT Statements

## Learning Objectives
- Write INSERT statements using all major T-SQL forms for the Library database
- Populate tables in the correct FK-respecting order
- Use INSERT...SELECT to copy or derive rows
- Retrieve auto-generated IDs with SCOPE_IDENTITY() and OUTPUT

---

## INSERT Syntax

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

---

## Method 1: INSERT Without a Column List

```sql
-- Insert an author without specifying column names
-- Values must match the exact column order (skip IDENTITY column)
INSERT INTO Authors
VALUES ('Agatha', 'Christie', 'British', '1890-09-15');
```

> **Warning:** If the table schema changes (column added or reordered), this INSERT will fail or insert data into wrong columns. Always prefer the column list form.

---

## Method 2: INSERT With a Column List (Best Practice)

```sql
INSERT INTO Authors (FirstName, LastName, Nationality, BirthDate)
VALUES ('Agatha', 'Christie', 'British', '1890-09-15');
```

Nullable columns can be omitted — they receive NULL automatically:

```sql
-- Insert an author without BirthDate
INSERT INTO Authors (FirstName, LastName, Nationality)
VALUES ('Anonymous', 'Author', NULL);
```

---

## Method 3: Inserting Multiple Rows in One Statement

```sql
INSERT INTO Authors (FirstName, LastName, Nationality, BirthDate)
VALUES
    ('Robert',  'Martin', 'American', '1952-12-05'),
    ('David',   'Thomas', 'British',  NULL),
    ('Erich',   'Gamma',  'Swiss',    '1961-03-13'),
    ('George',  'Orwell', 'British',  '1903-06-25'),
    ('J.K.',    'Rowling','British',  '1965-07-31');
```

---

## Method 4: INSERT … SELECT

Insert data derived from an existing query:

```sql
-- Copy all Technology titles to an archive table
INSERT INTO TitlesArchive (Title, AuthorID, Genre, ISBN)
SELECT Title, AuthorID, Genre, ISBN
FROM   Titles
WHERE  Genre = 'Technology';
```

Using a CTE to prepare data before inserting:

```sql
-- Mark all overdue rentals as a new batch in an OverdueLog table
WITH Overdue AS (
    SELECT RentalID, ClientID, BookID, DueDate,
           DATEDIFF(DAY, DueDate, GETDATE()) AS DaysLate
    FROM   Rentals
    WHERE  ReturnDate IS NULL
    AND    DueDate < GETDATE()
)
INSERT INTO OverdueLog (RentalID, ClientID, BookID, DueDate, DaysLate)
SELECT RentalID, ClientID, BookID, DueDate, DaysLate
FROM   Overdue;
```

---

## IDENTITY Columns

`IDENTITY(1,1)` generates the PK automatically. Never include it in an INSERT.

```sql
-- Correct: AuthorID is omitted
INSERT INTO Authors (FirstName, LastName, Nationality)
VALUES ('Tolkien', 'John Ronald Reuel', 'British');

-- Retrieve the generated ID
SELECT SCOPE_IDENTITY() AS NewAuthorID;    -- recommended
SELECT @@IDENTITY;                          -- last ID in this session (any scope)
SELECT IDENT_CURRENT('Authors');            -- last ID inserted into Authors by anyone
```

---

## SET IDENTITY_INSERT

Used to insert a specific ID value (e.g., data migration):

```sql
SET IDENTITY_INSERT Authors ON;

INSERT INTO Authors (AuthorID, FirstName, LastName, Nationality)
VALUES (99, 'Test', 'Author', 'Unknown');

SET IDENTITY_INSERT Authors OFF;
```

---

## INSERT with OUTPUT Clause

Capture the auto-generated BookID immediately:

```sql
DECLARE @NewBooks TABLE (BookID INT, TitleID INT, PublisherID INT);

INSERT INTO Books (TitleID, PublisherID, AcquisitionDate, Condition, IsAvailable)
OUTPUT INSERTED.BookID, INSERTED.TitleID, INSERTED.PublisherID
INTO   @NewBooks
VALUES (1, 1, '2024-01-05', 'New', 1),
       (1, 2, '2024-01-06', 'Good', 1);

SELECT * FROM @NewBooks;
```

---

## Complete Sample Data Script

Insert data in FK-safe order: Authors → Publishers → Titles → Books → Clients → Rentals.

```sql
USE LibraryDB;
GO

-- ===========================
-- Authors (6 rows)
-- ===========================
INSERT INTO Authors (FirstName, LastName, Nationality, BirthDate)
VALUES
    ('Robert',  'Martin',  'American', '1952-12-05'),
    ('David',   'Thomas',  'British',  NULL),
    ('Erich',   'Gamma',   'Swiss',    '1961-03-13'),
    ('George',  'Orwell',  'British',  '1903-06-25'),
    ('J.K.',    'Rowling', 'British',  '1965-07-31'),
    ('Agatha',  'Christie','British',  '1890-09-15');
GO

-- ===========================
-- Publishers (5 rows)
-- ===========================
INSERT INTO Publishers (PublisherName, Address, Phone, Email)
VALUES
    ('Prentice Hall',    '1 Lake Street, Upper Saddle River, NJ',    '201-555-0100', 'info@ph.com'),
    ('Addison-Wesley',   '75 Arlington Street, Boston, MA',          '617-555-0200', 'info@aw.com'),
    ('O''Reilly Media',  '1005 Gravenstein Highway N, Sebastopol, CA','707-555-0300', 'info@oreilly.com'),
    ('Penguin Books',    '80 Strand, London, UK',                    '020-555-0400', 'info@penguin.com'),
    ('Bloomsbury',       '50 Bedford Square, London, UK',            '020-555-0500', 'info@bloomsbury.com');
GO

-- ===========================
-- Titles (6 rows)
-- ===========================
INSERT INTO Titles (Title, AuthorID, Genre, PublishedYear, ISBN)
VALUES
    ('Clean Code',                   1, 'Technology', 2008, '978-0132350884'),
    ('The Pragmatic Programmer',     2, 'Technology', 2019, '978-0135957059'),
    ('Design Patterns',              3, 'Technology', 1994, '978-0201633610'),
    ('1984',                         4, 'Fiction',    1949, '978-0141036144'),
    ('Harry Potter and the Sorcerer''s Stone', 5, 'Fiction', 1997, '978-0439708180'),
    ('Murder on the Orient Express', 6, 'Mystery',    1934, '978-0062693662');
GO

-- ===========================
-- Books (9 physical copies)
-- ===========================
INSERT INTO Books (TitleID, PublisherID, AcquisitionDate, Condition, IsAvailable)
VALUES
    (1, 1, '2022-03-10', 'Good',  1),   -- Clean Code copy 1 — Prentice Hall
    (1, 3, '2023-06-15', 'New',   1),   -- Clean Code copy 2 — O'Reilly
    (2, 2, '2022-01-20', 'Good',  1),   -- Pragmatic Programmer — Addison-Wesley
    (3, 2, '2021-09-05', 'Fair',  1),   -- Design Patterns — Addison-Wesley
    (4, 4, '2020-11-12', 'Good',  1),   -- 1984 — Penguin
    (4, 4, '2023-02-28', 'New',   1),   -- 1984 copy 2 — Penguin
    (5, 5, '2022-08-01', 'Good',  1),   -- Harry Potter — Bloomsbury
    (6, 4, '2021-05-17', 'Fair',  1),   -- Orient Express — Penguin
    (2, 1, '2024-01-03', 'New',   1);   -- Pragmatic Programmer copy 2 — Prentice Hall
GO

-- ===========================
-- Clients (6 rows)
-- ===========================
INSERT INTO Clients (FirstName, LastName, Email, Phone, Address, MembershipDate)
VALUES
    ('Maria',   'Popescu',   'maria.pop@mail.com',     '555-0101', 'Str. Florilor 12, Bucharest',  '2023-01-15'),
    ('Ion',     'Ionescu',   'ion.ionescu@mail.com',   '555-0202', 'Bd. Unirii 34, Bucharest',     '2023-03-22'),
    ('Ana',     'Dumitrescu','ana.d@mail.com',          '555-0303', 'Calea Victoriei 5, Bucharest', '2022-11-08'),
    ('Mihai',   'Constantin','mihai.c@mail.com',        '555-0404', 'Str. Rosetti 7, Bucharest',   '2023-07-30'),
    ('Elena',   'Radu',      'elena.radu@mail.com',     '555-0505', 'Aleea Trandafirilor 2, Cluj', '2024-01-05'),
    ('Andrei',  'Stan',      'andrei.stan@mail.com',    '555-0606', 'Str. Mihai Viteazu 9, Iasi',  '2023-09-14');
GO

-- ===========================
-- Rentals (8 rows)
-- ===========================
INSERT INTO Rentals (ClientID, BookID, RentalDate, DueDate, ReturnDate, RentalDays)
VALUES
    (1, 1, '2024-01-10', '2024-01-24', '2024-01-20', 14),  -- Maria rented Clean Code (copy 1) — returned
    (2, 3, '2024-01-11', '2024-01-25', NULL,           14),  -- Ion rented Pragmatic Programmer — still out
    (1, 4, '2024-01-12', '2024-01-19', '2024-01-17',  7),   -- Maria rented Design Patterns — returned
    (3, 5, '2024-01-14', '2024-01-28', NULL,           14),  -- Ana rented 1984 — still out
    (4, 7, '2024-01-15', '2024-01-22', '2024-01-21',  7),   -- Mihai rented Harry Potter — returned
    (1, 8, '2024-01-17', '2024-01-31', NULL,           14),  -- Maria rented Orient Express — still out
    (2, 2, '2024-01-18', '2024-01-25', '2024-01-24',  7),   -- Ion rented Clean Code (copy 2) — returned
    (5, 6, '2024-01-20', '2024-02-03', NULL,           14);  -- Elena rented 1984 (copy 2) — still out
GO
```

---

## Practice Exercises

**Exercise 1**
Insert a new author: `'Leo Tolstoy'`, Russian, born `'1828-09-09'`. Retrieve the generated `AuthorID` immediately.

**Exercise 2**
In a single `INSERT` statement, add two new titles by the same author (use the author from Exercise 1): "War and Peace" (Fiction, 1869, ISBN: `978-1400079988`) and "Anna Karenina" (Fiction, 1878, ISBN: `978-0143035008`).

**Exercise 3**
Add three physical copies of "War and Peace" (from Exercise 2) — one from Penguin Books (Condition: New), one from Penguin Books (Condition: Good), one from O'Reilly Media (Condition: Fair). Use a single multi-row INSERT.

**Exercise 4**
Using `INSERT ... SELECT`, insert into a `LongRentals` table (same structure as `Rentals`) all rental records where `RentalDays >= 14` and the book has not yet been returned.

**Exercise 5**
Using `INSERT` with `OUTPUT`, add a new rental for `ClientID = 3`, `BookID = 9`, with today's date, due in 7 days. Capture and display the newly generated `RentalID`.
