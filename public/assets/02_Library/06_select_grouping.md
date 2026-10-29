# Library Database — Worksheet 6: SELECT — Grouping and Aggregates

## Learning Objectives
- Apply aggregate functions (COUNT, SUM, AVG, MIN, MAX) to library data
- Group results by single and multiple columns
- Filter groups using HAVING
- Combine JOINs with GROUP BY to produce meaningful library reports

---

## Aggregate Functions

### COUNT

```sql
-- Total number of physical books in the library
SELECT COUNT(*) AS TotalBooks FROM Books;

-- Number of books that have a recorded acquisition date
SELECT COUNT(AcquisitionDate) AS BooksWithDate FROM Books;

-- COUNT(*) vs COUNT(column) — important difference
-- ReturnDate is NULL for unreturned rentals
SELECT
    COUNT(*)             AS TotalRentals,
    COUNT(ReturnDate)    AS ReturnedRentals,
    COUNT(*) - COUNT(ReturnDate) AS UnreturnedRentals
FROM Rentals;
```

### SUM

```sql
-- Total number of rental days across all rentals
SELECT SUM(RentalDays) AS TotalRentalDays FROM Rentals;

-- Total overdue days for books not yet returned
SELECT SUM(DATEDIFF(DAY, DueDate, GETDATE())) AS TotalOverdueDays
FROM   Rentals
WHERE  ReturnDate IS NULL
AND    DueDate < GETDATE();
```

### AVG

```sql
-- Average rental period
SELECT AVG(CAST(RentalDays AS DECIMAL(10,2))) AS AvgRentalDays FROM Rentals;

-- Average publication year of titles in the catalogue
SELECT AVG(CAST(PublishedYear AS DECIMAL(10,2))) AS AvgPublicationYear
FROM   Titles
WHERE  PublishedYear IS NOT NULL;
```

### MIN and MAX

```sql
-- Earliest and most recent rental
SELECT MIN(RentalDate) AS FirstRental, MAX(RentalDate) AS LatestRental FROM Rentals;

-- Oldest and newest title in the catalogue
SELECT MIN(PublishedYear) AS OldestTitle, MAX(PublishedYear) AS NewestTitle
FROM   Titles
WHERE  PublishedYear IS NOT NULL;

-- Earliest book acquisition
SELECT MIN(AcquisitionDate) AS OldestBook FROM Books WHERE AcquisitionDate IS NOT NULL;
```

---

## GROUP BY

### Single Column

```sql
-- Number of titles per genre
SELECT Genre, COUNT(*) AS TitleCount
FROM   Titles
WHERE  Genre IS NOT NULL
GROUP BY Genre
ORDER BY TitleCount DESC;

-- Number of physical copies per title
SELECT TitleID, COUNT(*) AS CopyCount
FROM   Books
GROUP BY TitleID
ORDER BY CopyCount DESC;

-- Number of rentals per client
SELECT ClientID, COUNT(*) AS RentalCount
FROM   Rentals
GROUP BY ClientID
ORDER BY RentalCount DESC;

-- Books per availability status
SELECT IsAvailable, COUNT(*) AS BookCount
FROM   Books
GROUP BY IsAvailable;
```

### Multiple Columns

```sql
-- Number of rentals per client per rental-days duration
SELECT ClientID, RentalDays, COUNT(*) AS RentalCount
FROM   Rentals
GROUP BY ClientID, RentalDays
ORDER BY ClientID, RentalDays;

-- Books per title per condition
SELECT TitleID, Condition, COUNT(*) AS Copies
FROM   Books
GROUP BY TitleID, Condition
ORDER BY TitleID;
```

---

## HAVING

```sql
-- Clients who have rented more than 2 books
SELECT ClientID, COUNT(*) AS RentalCount
FROM   Rentals
GROUP BY ClientID
HAVING COUNT(*) > 2;

-- Genres that have at least 2 titles
SELECT Genre, COUNT(*) AS TitleCount
FROM   Titles
WHERE  Genre IS NOT NULL
GROUP BY Genre
HAVING COUNT(*) >= 2;

-- Titles that have more than 1 physical copy
SELECT TitleID, COUNT(*) AS CopyCount
FROM   Books
GROUP BY TitleID
HAVING COUNT(*) > 1;
```

---

## GROUP BY with JOINs

### Example 1 — Number of books per genre (with genre name)

```sql
SELECT
    t.Genre,
    COUNT(b.BookID)    AS TotalCopies,
    COUNT(DISTINCT t.TitleID) AS UniqueTitles
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  t.Genre IS NOT NULL
GROUP BY t.Genre
ORDER BY TotalCopies DESC;
```

### Example 2 — Rental count per client with client name

```sql
SELECT
    cl.FirstName + ' ' + cl.LastName AS ClientName,
    COUNT(r.RentalID)                AS TotalRentals,
    SUM(r.RentalDays)                AS TotalDaysRented,
    MAX(r.RentalDate)                AS LastRentalDate
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalRentals DESC;
```

### Example 3 — Most rented titles with author name (3 tables)

```sql
SELECT
    t.Title,
    a.FirstName + ' ' + a.LastName AS Author,
    t.Genre,
    COUNT(r.RentalID)              AS TimesRented
FROM   Titles  AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
INNER JOIN Books   AS b ON t.TitleID  = b.TitleID
INNER JOIN Rentals AS r ON b.BookID   = r.BookID
GROUP BY t.TitleID, t.Title, a.FirstName, a.LastName, t.Genre
ORDER BY TimesRented DESC;
```

### Example 4 — Monthly rental activity with HAVING

```sql
SELECT
    YEAR(r.RentalDate)                   AS RentalYear,
    MONTH(r.RentalDate)                  AS RentalMonth,
    DATENAME(MONTH, r.RentalDate)        AS MonthName,
    COUNT(r.RentalID)                    AS RentalCount,
    COUNT(DISTINCT r.ClientID)           AS UniqueClients
FROM   Rentals AS r
GROUP BY YEAR(r.RentalDate), MONTH(r.RentalDate), DATENAME(MONTH, r.RentalDate)
HAVING COUNT(r.RentalID) >= 2
ORDER BY RentalYear, RentalMonth;
```

---

## NULL Values in Aggregates

```sql
-- AVG ignores NULLs — result is based only on non-NULL rows
SELECT AVG(CAST(PublishedYear AS DECIMAL)) AS AvgYear FROM Titles;
-- Only titles where PublishedYear is NOT NULL are included

-- To treat NULLs as 0 (or another default):
SELECT AVG(ISNULL(CAST(PublishedYear AS DECIMAL), 0)) AS AvgYearWithZeros FROM Titles;

-- COUNT(*) counts ALL rows; COUNT(column) skips NULLs
SELECT
    COUNT(*)           AS AllTitles,
    COUNT(PublishedYear) AS TitlesWithYear,
    COUNT(ISBN)          AS TitlesWithISBN
FROM Titles;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
Count the total number of rentals in the `Rentals` table.

**Exercise 2 (Easy)**
Find the earliest and most recent `MembershipDate` in the `Clients` table.

**Exercise 3 (Easy)**
Count how many books are available (IsAvailable = 1) and how many are not.

**Exercise 4 (Medium)**
Show the number of physical book copies per title (TitleID). Sort by copy count descending.

**Exercise 5 (Medium)**
List all genres with more than 1 title. Show the genre name and count.

**Exercise 6 (Medium)**
Show the total number of rentals and total rental days per client. Only include clients with at least 2 rentals.

**Exercise 7 (Medium)**
Join `Titles` and `Authors`, then show how many titles each author has written. Show author full name and title count. Sort by count descending.

**Exercise 8 (Hard)**
For each genre, show the genre name, number of unique titles, total number of physical copies, and average publication year. Include genres with no physical copies (use LEFT JOIN). Sort by title count descending.

**Exercise 9 (Hard)**
Show each publisher name along with how many distinct titles they have published and how many physical copies. Only include publishers that have published at least 2 copies. Sort by copy count descending.

**Exercise 10 (Hard)**
For each client who has unreturned rentals, show their full name, number of unreturned books, and the total overdue days (use DATEDIFF on DueDate vs today, only for overdue items). Sort by total overdue days descending.

---

## Answers

**Exercise 1**
```sql
SELECT COUNT(*) AS TotalRentals FROM Rentals;
```

**Exercise 2**
```sql
SELECT MIN(MembershipDate) AS Earliest, MAX(MembershipDate) AS Latest FROM Clients;
```

**Exercise 3**
```sql
SELECT IsAvailable, COUNT(*) AS BookCount FROM Books GROUP BY IsAvailable;
```

**Exercise 4**
```sql
SELECT TitleID, COUNT(*) AS CopyCount FROM Books GROUP BY TitleID ORDER BY CopyCount DESC;
```

**Exercise 5**
```sql
SELECT Genre, COUNT(*) AS TitleCount FROM Titles WHERE Genre IS NOT NULL
GROUP BY Genre HAVING COUNT(*) > 1 ORDER BY TitleCount DESC;
```

**Exercise 6**
```sql
SELECT ClientID, COUNT(*) AS TotalRentals, SUM(RentalDays) AS TotalDays
FROM   Rentals
GROUP BY ClientID
HAVING COUNT(*) >= 2;
```

**Exercise 7**
```sql
SELECT a.FirstName + ' ' + a.LastName AS Author, COUNT(t.TitleID) AS TitleCount
FROM   Authors AS a
INNER JOIN Titles AS t ON a.AuthorID = t.AuthorID
GROUP BY a.AuthorID, a.FirstName, a.LastName
ORDER BY TitleCount DESC;
```

**Exercise 8**
```sql
SELECT t.Genre,
       COUNT(DISTINCT t.TitleID)   AS UniqueTitles,
       COUNT(b.BookID)             AS TotalCopies,
       AVG(CAST(t.PublishedYear AS DECIMAL)) AS AvgYear
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  t.Genre IS NOT NULL
GROUP BY t.Genre
ORDER BY UniqueTitles DESC;
```

**Exercise 9**
```sql
SELECT p.PublisherName,
       COUNT(DISTINCT b.TitleID) AS DistinctTitles,
       COUNT(b.BookID)           AS TotalCopies
FROM   Publishers AS p
INNER JOIN Books AS b ON p.PublisherID = b.PublisherID
GROUP BY p.PublisherID, p.PublisherName
HAVING COUNT(b.BookID) >= 2
ORDER BY TotalCopies DESC;
```

**Exercise 10**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS ClientName,
       COUNT(r.RentalID) AS UnreturnedBooks,
       SUM(CASE WHEN r.DueDate < GETDATE()
                THEN DATEDIFF(DAY, r.DueDate, GETDATE())
                ELSE 0 END) AS TotalOverdueDays
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID
WHERE  r.ReturnDate IS NULL
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalOverdueDays DESC;
```
