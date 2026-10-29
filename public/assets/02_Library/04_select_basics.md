# Library Database — Worksheet 4: SELECT — Basic Queries

## Learning Objectives
- Retrieve data from individual library tables using SELECT
- Filter records using WHERE with various operators
- Sort and limit results
- Use built-in string and date functions relevant to a library context

---

## SELECT Syntax

```sql
SELECT [TOP n] [DISTINCT] column_list
FROM   table_name
WHERE  condition
ORDER BY column [ASC | DESC];
```

---

## 1. Selecting All Columns

```sql
SELECT * FROM Authors;
SELECT * FROM Books;
SELECT * FROM Rentals;
```

---

## 2. Selecting Specific Columns

```sql
-- Book catalogue summary
SELECT TitleID, Title, Genre, PublishedYear, ISBN
FROM   Titles;

-- Rental activity
SELECT RentalID, ClientID, BookID, RentalDate, DueDate, ReturnDate
FROM   Rentals;

-- Client directory
SELECT FirstName, LastName, Email, MembershipDate
FROM   Clients;
```

---

## 3. Column Aliases

```sql
SELECT
    FirstName + ' ' + LastName   AS AuthorName,
    Nationality                  AS Country,
    YEAR(GETDATE()) - YEAR(BirthDate) AS ApproximateAge
FROM Authors
WHERE BirthDate IS NOT NULL;

SELECT
    Title                        AS BookTitle,
    PublishedYear                AS YearPublished,
    ISBN                         AS [ISBN Number]
FROM Titles;
```

---

## 4. Computed Columns

```sql
-- How many days is each rental?
SELECT
    RentalID,
    RentalDate,
    DueDate,
    RentalDays,
    DATEDIFF(DAY, RentalDate, DueDate) AS ActualPeriod
FROM Rentals;

-- Is the book overdue? (for unreturned rentals)
SELECT
    RentalID,
    DueDate,
    DATEDIFF(DAY, DueDate, GETDATE()) AS DaysOverdue
FROM Rentals
WHERE ReturnDate IS NULL
AND   DueDate < GETDATE();
```

---

## 5. Filtering with WHERE

### Equality and Inequality

```sql
-- Books currently available
SELECT BookID, TitleID, Condition FROM Books WHERE IsAvailable = 1;

-- Books not available (currently rented out)
SELECT BookID, TitleID FROM Books WHERE IsAvailable = 0;

-- Titles published after the year 2000
SELECT Title, PublishedYear FROM Titles WHERE PublishedYear > 2000;

-- Authors who are NOT British
SELECT FirstName, LastName, Nationality FROM Authors WHERE Nationality <> 'British';
```

### Comparison Operators

```sql
-- Titles published before 1960
SELECT Title, PublishedYear FROM Titles WHERE PublishedYear < 1960;

-- Rentals due within the next 7 days (not yet returned)
SELECT RentalID, BookID, DueDate
FROM   Rentals
WHERE  ReturnDate IS NULL
AND    DueDate <= DATEADD(DAY, 7, GETDATE());

-- Clients who joined on or after 2023-06-01
SELECT FirstName, LastName, MembershipDate
FROM   Clients
WHERE  MembershipDate >= '2023-06-01';
```

### BETWEEN … AND

```sql
-- Titles published between 1990 and 2010
SELECT Title, PublishedYear
FROM   Titles
WHERE  PublishedYear BETWEEN 1990 AND 2010;

-- Rentals made in January 2024
SELECT RentalID, ClientID, BookID, RentalDate
FROM   Rentals
WHERE  RentalDate BETWEEN '2024-01-01' AND '2024-01-31';
```

### IN

```sql
-- Authors from specific nationalities
SELECT FirstName, LastName, Nationality
FROM   Authors
WHERE  Nationality IN ('British', 'American', 'Swiss');

-- Books in a specific condition
SELECT BookID, TitleID, Condition
FROM   Books
WHERE  Condition IN ('New', 'Good');

-- Titles in Fiction or Mystery genre
SELECT Title, Genre FROM Titles WHERE Genre IN ('Fiction', 'Mystery');
```

### LIKE

```sql
-- Titles that start with 'The'
SELECT Title, Genre FROM Titles WHERE Title LIKE 'The %';

-- Authors whose last name starts with 'M'
SELECT FirstName, LastName FROM Authors WHERE LastName LIKE 'M%';

-- Clients with a Gmail address
SELECT FirstName, LastName, Email FROM Clients WHERE Email LIKE '%@gmail.com';

-- ISBN numbers starting with '978-01'
SELECT Title, ISBN FROM Titles WHERE ISBN LIKE '978-01%';

-- Authors with exactly 6 characters in their last name
SELECT FirstName, LastName FROM Authors WHERE LastName LIKE '______';
```

### IS NULL / IS NOT NULL

```sql
-- Rentals that have not been returned yet
SELECT RentalID, ClientID, BookID, DueDate
FROM   Rentals
WHERE  ReturnDate IS NULL;

-- Authors with a known birth date
SELECT FirstName, LastName, BirthDate
FROM   Authors
WHERE  BirthDate IS NOT NULL;

-- Titles without an ISBN recorded
SELECT Title, Genre FROM Titles WHERE ISBN IS NULL;
```

---

## 6. Combining Conditions

```sql
-- Technology books published after 2000
SELECT Title, Genre, PublishedYear
FROM   Titles
WHERE  Genre = 'Technology'
AND    PublishedYear > 2000;

-- Fiction OR Mystery titles
SELECT Title, Genre FROM Titles
WHERE  Genre = 'Fiction' OR Genre = 'Mystery';

-- Available books in Good or New condition
SELECT BookID, TitleID, Condition
FROM   Books
WHERE  IsAvailable = 1
AND    Condition IN ('New', 'Good');

-- Rentals that are overdue (not returned and past due date)
SELECT RentalID, ClientID, DueDate,
       DATEDIFF(DAY, DueDate, GETDATE()) AS DaysLate
FROM   Rentals
WHERE  ReturnDate IS NULL
AND    DueDate < GETDATE();
```

---

## 7. Sorting with ORDER BY

```sql
-- Titles sorted by publication year (oldest first)
SELECT Title, PublishedYear FROM Titles ORDER BY PublishedYear ASC;

-- Clients sorted by last name alphabetically
SELECT FirstName, LastName, Email FROM Clients ORDER BY LastName ASC;

-- Most recent rentals first
SELECT RentalID, RentalDate, DueDate FROM Rentals ORDER BY RentalDate DESC;

-- Books sorted by condition severity (custom order using CASE)
SELECT BookID, TitleID, Condition
FROM   Books
ORDER BY
    CASE Condition
        WHEN 'New'  THEN 1
        WHEN 'Good' THEN 2
        WHEN 'Fair' THEN 3
        WHEN 'Poor' THEN 4
    END;
```

---

## 8. Limiting Results with TOP

```sql
-- The 3 most recently acquired books
SELECT TOP 3 BookID, TitleID, AcquisitionDate
FROM   Books
ORDER BY AcquisitionDate DESC;

-- The oldest 2 titles in the library
SELECT TOP 2 Title, PublishedYear
FROM   Titles
ORDER BY PublishedYear ASC;

-- Top 25% of clients by membership seniority
SELECT TOP 25 PERCENT FirstName, LastName, MembershipDate
FROM   Clients
ORDER BY MembershipDate ASC;
```

---

## 9. DISTINCT

```sql
-- What genres are in the catalogue?
SELECT DISTINCT Genre FROM Titles ORDER BY Genre;

-- Which nationalities are represented among authors?
SELECT DISTINCT Nationality FROM Authors WHERE Nationality IS NOT NULL ORDER BY Nationality;

-- How many distinct clients have made rentals?
SELECT COUNT(DISTINCT ClientID) AS ActiveBorrowers FROM Rentals;
```

---

## 10. Useful Built-in Functions

```sql
-- String functions
SELECT
    UPPER(LastName)              AS UpperLastName,
    LOWER(FirstName)             AS LowerFirstName,
    LEN(Title)                   AS TitleLength,
    LEFT(Title, 20)              AS ShortTitle
FROM Titles;

-- Date functions on rentals
SELECT
    RentalID,
    RentalDate,
    DATEDIFF(DAY,  RentalDate, GETDATE()) AS DaysSinceRental,
    DATEADD(DAY, 7, DueDate)              AS ExtendedDueDate,
    YEAR(RentalDate)                      AS RentalYear,
    DATENAME(MONTH, RentalDate)           AS RentalMonth
FROM Rentals;

-- Handling NULLs
SELECT
    RentalID,
    ISNULL(CAST(ReturnDate AS NVARCHAR(20)), 'Not returned') AS ReturnStatus
FROM Rentals;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
List all titles in the `'Fiction'` genre, sorted alphabetically by title.

**Exercise 2 (Easy)**
Show all rentals that have not been returned yet (`ReturnDate IS NULL`). Display `RentalID`, `ClientID`, `BookID`, and `DueDate`.

**Exercise 3 (Easy)**
Find all authors who are `'British'`. Show their full name and birth date.

**Exercise 4 (Medium)**
List all books where the condition is either `'Fair'` or `'Poor'` and the book is still available (`IsAvailable = 1`).

**Exercise 5 (Medium)**
Show all titles published between 1940 and 1999. Sort by `PublishedYear` descending.

**Exercise 6 (Medium)**
Find all rentals where the rental period was exactly 14 days. Show `RentalID`, `RentalDate`, `DueDate`, and `RentalDays`.

**Exercise 7 (Medium)**
List all clients whose email does not end in `'@mail.com'`. Show full name and email.

**Exercise 8 (Medium)**
Show the top 3 books most recently acquired by the library. Show `BookID`, `TitleID`, `AcquisitionDate`, and `Condition`.

**Exercise 9 (Hard)**
For each rental that has not been returned, calculate and display `RentalID`, `BookID`, `DueDate`, and `DaysOverdue` (use `DATEDIFF`). Only show rentals that are actually overdue (due date is in the past). Sort by `DaysOverdue` descending.

**Exercise 10 (Hard)**
Show a list of distinct genres from `Titles` along with the count of titles in each genre. Use `COUNT` and `GROUP BY`. Sort by count descending.

---

## Answers

1. `SELECT Title, Genre FROM Titles WHERE Genre = 'Fiction' ORDER BY Title;`
2. `SELECT RentalID, ClientID, BookID, DueDate FROM Rentals WHERE ReturnDate IS NULL;`
3. `SELECT FirstName + ' ' + LastName AS FullName, BirthDate FROM Authors WHERE Nationality = 'British';`
4. `SELECT BookID, TitleID, Condition FROM Books WHERE Condition IN ('Fair','Poor') AND IsAvailable = 1;`
5. `SELECT Title, PublishedYear FROM Titles WHERE PublishedYear BETWEEN 1940 AND 1999 ORDER BY PublishedYear DESC;`
6. `SELECT RentalID, RentalDate, DueDate, RentalDays FROM Rentals WHERE RentalDays = 14;`
7. `SELECT FirstName + ' ' + LastName AS FullName, Email FROM Clients WHERE Email NOT LIKE '%@mail.com';`
8. `SELECT TOP 3 BookID, TitleID, AcquisitionDate, Condition FROM Books ORDER BY AcquisitionDate DESC;`
9. `SELECT RentalID, BookID, DueDate, DATEDIFF(DAY, DueDate, GETDATE()) AS DaysOverdue FROM Rentals WHERE ReturnDate IS NULL AND DueDate < GETDATE() ORDER BY DaysOverdue DESC;`
10. `SELECT Genre, COUNT(*) AS TitleCount FROM Titles WHERE Genre IS NOT NULL GROUP BY Genre ORDER BY TitleCount DESC;`
