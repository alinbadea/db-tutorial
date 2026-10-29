# Library Database — Worksheet 5: SELECT — JOINs

## Learning Objectives
- Join multiple library tables to answer real business questions
- Distinguish between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN
- Find missing or unrelated records using the anti-join pattern
- Write efficient multi-table queries using table aliases

---

## Why JOINs?

The Library database stores related data in separate tables. To show a complete rental receipt (who rented which book copy, which title, by which author, from which publisher), we need to join six tables. JOINs reconstruct the full picture at query time without duplicating data.

---

## JOIN Types — Overview

| JOIN | Returns |
|---|---|
| `INNER JOIN` | Rows matched in both tables |
| `LEFT JOIN` | All from left + matches from right (NULL if no match) |
| `RIGHT JOIN` | All from right + matches from left (NULL if no match) |
| `FULL OUTER JOIN` | All rows from both tables, NULLs on unmatched sides |

---

## Table Aliases

```sql
-- Without aliases (verbose)
SELECT Titles.Title, Authors.FirstName, Authors.LastName
FROM   Titles
INNER JOIN Authors ON Titles.AuthorID = Authors.AuthorID;

-- With aliases (recommended)
SELECT t.Title, a.FirstName, a.LastName
FROM   Titles  AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID;
```

---

## INNER JOIN

### Example 1 — Titles with their author's full name

```sql
SELECT
    t.TitleID,
    t.Title,
    a.FirstName + ' ' + a.LastName AS Author,
    a.Nationality,
    t.Genre,
    t.PublishedYear
FROM   Titles  AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
ORDER BY t.Title;
```

### Example 2 — Physical book copies with title and publisher

```sql
SELECT
    b.BookID,
    t.Title,
    p.PublisherName,
    b.Condition,
    b.IsAvailable,
    b.AcquisitionDate
FROM   Books       AS b
INNER JOIN Titles    AS t ON b.TitleID     = t.TitleID
INNER JOIN Publishers AS p ON b.PublisherID = p.PublisherID
ORDER BY t.Title, b.BookID;
```

### Example 3 — Rental history with all details (4 tables)

```sql
SELECT
    r.RentalID,
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    t.Title,
    a.FirstName + ' ' + a.LastName    AS Author,
    r.RentalDate,
    r.DueDate,
    r.ReturnDate,
    r.RentalDays
FROM   Rentals AS r
INNER JOIN Clients    AS cl ON r.ClientID    = cl.ClientID
INNER JOIN Books      AS b  ON r.BookID      = b.BookID
INNER JOIN Titles     AS t  ON b.TitleID     = t.TitleID
INNER JOIN Authors    AS a  ON t.AuthorID    = a.AuthorID
ORDER BY r.RentalDate DESC;
```

### Example 4 — Full receipt (all 6 tables)

```sql
SELECT
    r.RentalID,
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    t.Title,
    a.FirstName + ' ' + a.LastName    AS Author,
    p.PublisherName,
    b.Condition,
    r.RentalDate,
    r.DueDate,
    ISNULL(CAST(r.ReturnDate AS NVARCHAR(20)), 'Not returned') AS ReturnDate,
    r.RentalDays
FROM   Rentals     AS r
INNER JOIN Clients     AS cl ON r.ClientID    = cl.ClientID
INNER JOIN Books       AS b  ON r.BookID      = b.BookID
INNER JOIN Titles      AS t  ON b.TitleID     = t.TitleID
INNER JOIN Authors     AS a  ON t.AuthorID    = a.AuthorID
INNER JOIN Publishers  AS p  ON b.PublisherID = p.PublisherID
ORDER BY r.RentalDate DESC;
```

---

## LEFT OUTER JOIN

### Example 1 — Clients and their rentals (including clients who never rented)

```sql
SELECT
    cl.ClientID,
    cl.FirstName + ' ' + cl.LastName AS ClientName,
    cl.MembershipDate,
    r.RentalID,
    r.RentalDate
FROM   Clients AS cl
LEFT JOIN Rentals AS r ON cl.ClientID = r.ClientID
ORDER BY cl.ClientID;
```

Clients with no rentals appear with NULL in the rental columns.

### Example 2 — Titles with their physical copies (including titles with no copies)

```sql
SELECT
    t.Title,
    t.Genre,
    b.BookID,
    b.Condition,
    b.IsAvailable
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
ORDER BY t.Title, b.BookID;
```

### Anti-join — Find clients who have NEVER rented a book

```sql
SELECT cl.ClientID, cl.FirstName + ' ' + cl.LastName AS ClientName, cl.Email
FROM   Clients AS cl
LEFT JOIN Rentals AS r ON cl.ClientID = r.ClientID
WHERE  r.RentalID IS NULL;
```

### Anti-join — Find titles that have no physical copies in the library

```sql
SELECT t.TitleID, t.Title, t.Genre
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  b.BookID IS NULL;
```

---

## RIGHT OUTER JOIN

```sql
-- All publishers, including those whose books are not in the library
SELECT
    p.PublisherName,
    b.BookID,
    t.Title
FROM   Books       AS b
RIGHT JOIN Publishers AS p ON b.PublisherID = p.PublisherID
LEFT  JOIN Titles     AS t ON b.TitleID     = t.TitleID
ORDER BY p.PublisherName;
```

---

## FULL OUTER JOIN

```sql
-- All titles and all books — show unmatched on both sides
SELECT
    t.Title,
    b.BookID,
    b.Condition
FROM   Titles AS t
FULL OUTER JOIN Books AS b ON t.TitleID = b.TitleID
ORDER BY t.Title;
```

---

## Joining All 6 Tables

A comprehensive catalogue view showing every physical book, its title, author, and publisher:

```sql
SELECT
    b.BookID,
    t.Title,
    a.FirstName + ' ' + a.LastName AS Author,
    a.Nationality,
    p.PublisherName,
    t.Genre,
    t.PublishedYear,
    b.AcquisitionDate,
    b.Condition,
    CASE b.IsAvailable WHEN 1 THEN 'Available' ELSE 'Rented Out' END AS Status
FROM   Books      AS b
INNER JOIN Titles     AS t ON b.TitleID     = t.TitleID
INNER JOIN Authors    AS a ON t.AuthorID    = a.AuthorID
INNER JOIN Publishers AS p ON b.PublisherID = p.PublisherID
ORDER BY t.Title, b.BookID;
```

---

## Common Mistakes

```sql
-- MISTAKE: Ambiguous column name when both tables have 'Email'
SELECT ClientID, Email     -- which table? SQL Server will error
FROM   Clients
INNER JOIN Rentals ON Clients.ClientID = Rentals.ClientID;

-- FIX: always qualify with alias
SELECT cl.ClientID, cl.Email
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID;

-- MISTAKE: Joining on the wrong column
-- Books.TitleID matches Titles.TitleID — not Books.BookID!
SELECT t.Title, b.BookID
FROM   Titles AS t
INNER JOIN Books AS b ON t.TitleID = b.BookID;  -- WRONG!

-- CORRECT
INNER JOIN Books AS b ON t.TitleID = b.TitleID;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
List all books (physical copies) with their title and author's full name. Show `BookID`, `Title`, `AuthorName`, and `Condition`.

**Exercise 2 (Easy)**
Show all rental records with the client's full name. Show `RentalID`, `ClientName`, `BookID`, `RentalDate`, and `ReturnDate`.

**Exercise 3 (Medium)**
Find all clients who have **never** rented a book. Show their full name and membership date.

**Exercise 4 (Medium)**
Show all titles that have at least one physical book copy, together with the number of copies available. Group by title. (Hint: join Titles and Books, filter IsAvailable = 1.)

**Exercise 5 (Medium)**
List all currently unreturned rentals with: client full name, book title, author full name, rental date, due date, and how many days overdue (if past due date, else 0).

**Exercise 6 (Medium)**
Show all titles from the `'Technology'` genre along with their author's nationality. Use an INNER JOIN between Titles and Authors.

**Exercise 7 (Hard)**
For each client, show their full name, how many times they have rented books, the most recent rental date, and whether they currently have any book not yet returned (show 'Yes'/'No').

**Exercise 8 (Hard)**
Show all books that have been rented more than once. Show `BookID`, `Title`, `Author`, and `RentalCount`. Sort by `RentalCount` descending.

---

## Answers

**Exercise 1**
```sql
SELECT b.BookID, t.Title, a.FirstName + ' ' + a.LastName AS AuthorName, b.Condition
FROM   Books   AS b
INNER JOIN Titles  AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID;
```

**Exercise 2**
```sql
SELECT r.RentalID, cl.FirstName + ' ' + cl.LastName AS ClientName,
       r.BookID, r.RentalDate, r.ReturnDate
FROM   Rentals AS r
INNER JOIN Clients AS cl ON r.ClientID = cl.ClientID;
```

**Exercise 3**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName, cl.MembershipDate
FROM   Clients AS cl
LEFT JOIN Rentals AS r ON cl.ClientID = r.ClientID
WHERE  r.RentalID IS NULL;
```

**Exercise 4**
```sql
SELECT t.Title, COUNT(b.BookID) AS AvailableCopies
FROM   Titles AS t
INNER JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  b.IsAvailable = 1
GROUP BY t.TitleID, t.Title
ORDER BY AvailableCopies DESC;
```

**Exercise 5**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS ClientName,
       t.Title, a.FirstName + ' ' + a.LastName AS Author,
       r.RentalDate, r.DueDate,
       CASE WHEN r.DueDate < GETDATE() THEN DATEDIFF(DAY, r.DueDate, GETDATE()) ELSE 0 END AS DaysOverdue
FROM   Rentals AS r
INNER JOIN Clients  AS cl ON r.ClientID  = cl.ClientID
INNER JOIN Books    AS b  ON r.BookID    = b.BookID
INNER JOIN Titles   AS t  ON b.TitleID  = t.TitleID
INNER JOIN Authors  AS a  ON t.AuthorID = a.AuthorID
WHERE  r.ReturnDate IS NULL
ORDER BY DaysOverdue DESC;
```

**Exercise 6**
```sql
SELECT t.Title, t.Genre, a.FirstName + ' ' + a.LastName AS Author, a.Nationality
FROM   Titles AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
WHERE  t.Genre = 'Technology';
```

**Exercise 7**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName,
       COUNT(r.RentalID) AS TotalRentals,
       MAX(r.RentalDate) AS LastRentalDate,
       CASE WHEN SUM(CASE WHEN r.ReturnDate IS NULL THEN 1 ELSE 0 END) > 0
            THEN 'Yes' ELSE 'No' END AS HasUnreturnedBook
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalRentals DESC;
```

**Exercise 8**
```sql
SELECT b.BookID, t.Title, a.FirstName + ' ' + a.LastName AS Author,
       COUNT(r.RentalID) AS RentalCount
FROM   Books AS b
INNER JOIN Titles   AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors  AS a ON t.AuthorID = a.AuthorID
INNER JOIN Rentals  AS r ON b.BookID   = r.BookID
GROUP BY b.BookID, t.Title, a.FirstName, a.LastName
HAVING COUNT(r.RentalID) > 1
ORDER BY RentalCount DESC;
```
