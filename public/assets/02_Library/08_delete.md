# Library Database — Worksheet 8: DELETE Statements

## Learning Objectives
- Delete specific rows from library tables safely using WHERE
- Follow the correct FK deletion order across all 6 tables
- Use DELETE with JOINs to remove rows based on conditions in related tables
- Understand TRUNCATE vs DELETE and soft-delete patterns

---

## DELETE Syntax

```sql
DELETE FROM table_name
WHERE condition;
```

> **WARNING:** A DELETE without a WHERE clause removes **all rows** from the table. Always verify with SELECT first, and consider wrapping in a transaction.

---

## Best Practice: Preview Before Deleting

```sql
-- Preview: which rentals will be deleted?
SELECT * FROM Rentals WHERE ClientID = 5;

-- Then delete
DELETE FROM Rentals WHERE ClientID = 5;
```

---

## Basic DELETE — Single Row

```sql
-- Remove a specific rental record
DELETE FROM Rentals WHERE RentalID = 8;

-- Remove a book copy that is decommissioned
DELETE FROM Books WHERE BookID = 9;

-- Remove a client who never rented and wants to be removed
DELETE FROM Clients WHERE ClientID = 6;
```

---

## DELETE Multiple Rows with WHERE

### IN clause

```sql
-- Remove all rentals for specific clients
DELETE FROM Rentals WHERE ClientID IN (4, 5);

-- Remove all books in 'Poor' condition
DELETE FROM Books WHERE Condition = 'Poor';

-- Delete Fiction and Mystery titles
-- (only safe if no Books reference these Titles)
DELETE FROM Titles WHERE Genre IN ('Fiction', 'Mystery');
```

### BETWEEN

```sql
-- Remove rental records from a specific date range
DELETE FROM Rentals
WHERE RentalDate BETWEEN '2024-01-01' AND '2024-01-15';
```

### LIKE

```sql
-- Remove test client accounts
DELETE FROM Clients
WHERE Email LIKE '%@test.com' OR Email LIKE '%@example.com';
```

### Compound conditions

```sql
-- Remove returned rentals older than 2 years
DELETE FROM Rentals
WHERE  ReturnDate IS NOT NULL
AND    ReturnDate < DATEADD(YEAR, -2, GETDATE());
```

---

## DELETE with Subquery in WHERE

```sql
-- Remove all rentals for books that have been decommissioned (Condition = 'Poor')
DELETE FROM Rentals
WHERE BookID IN (
    SELECT BookID FROM Books WHERE Condition = 'Poor'
);

-- Remove all books of titles that are out of print (not in catalogue)
-- (Only safe if Rentals for those books are removed first)
DELETE FROM Books
WHERE TitleID NOT IN (
    SELECT TitleID FROM Titles
);

-- Remove clients who have never rented and joined more than 3 years ago
DELETE FROM Clients
WHERE ClientID NOT IN (SELECT DISTINCT ClientID FROM Rentals)
AND   MembershipDate < DATEADD(YEAR, -3, GETDATE());
```

---

## DELETE with JOIN (T-SQL FROM Clause)

### Example 1 — Delete all rentals for books of a specific author

```sql
-- Preview
SELECT r.RentalID, r.BookID, t.Title, a.LastName
FROM   Rentals AS r
INNER JOIN Books   AS b ON r.BookID   = b.BookID
INNER JOIN Titles  AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
WHERE  a.LastName = 'TestAuthor';

-- Delete
DELETE r
FROM   Rentals AS r
INNER JOIN Books   AS b ON r.BookID   = b.BookID
INNER JOIN Titles  AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
WHERE  a.LastName = 'TestAuthor';
```

### Example 2 — Delete all rentals for Technology books that were returned

```sql
DELETE r
FROM   Rentals AS r
INNER JOIN Books  AS b ON r.BookID  = b.BookID
INNER JOIN Titles AS t ON b.TitleID = t.TitleID
WHERE  t.Genre = 'Technology'
AND    r.ReturnDate IS NOT NULL;
```

### Example 3 — Anti-join DELETE: remove books that have never been rented

```sql
-- Preview
SELECT b.BookID, t.Title, b.Condition
FROM   Books AS b
LEFT JOIN Rentals AS r ON b.BookID = r.BookID
LEFT JOIN Titles  AS t ON b.TitleID = t.TitleID
WHERE  r.RentalID IS NULL;

-- Delete
DELETE b
FROM   Books AS b
LEFT JOIN Rentals AS r ON b.BookID = r.BookID
WHERE  r.RentalID IS NULL;
```

---

## Respecting Foreign Key Constraints

You cannot delete a parent row if child rows still reference it. The correct deletion order for LibraryDB is:

```
1. Rentals           (references Clients and Books)
2. Books             (references Titles and Publishers)
3. Titles            (references Authors)
4. Clients           (no child FK dependencies — safe to delete)
5. Publishers        (no child FK dependencies — safe to delete)
6. Authors           (no child FK dependencies — safe to delete)
```

### Complete removal of a client and all their history

```sql
-- Step 1: remove the client's rentals
DELETE FROM Rentals WHERE ClientID = 2;

-- Step 2: now safe to remove the client
DELETE FROM Clients WHERE ClientID = 2;
```

### Remove a title and all its physical copies

```sql
-- Step 1: remove rentals referencing any copy of this title
DELETE r
FROM   Rentals AS r
INNER JOIN Books AS b ON r.BookID = b.BookID
WHERE  b.TitleID = 3;

-- Step 2: remove the physical copies
DELETE FROM Books WHERE TitleID = 3;

-- Step 3: now safe to remove the title
DELETE FROM Titles WHERE TitleID = 3;
```

---

## TRUNCATE TABLE vs DELETE

| Feature | DELETE | TRUNCATE |
|---|---|---|
| WHERE clause | Supported | Not supported (removes all rows) |
| Speed | Slower (row-level logging) | Faster (minimal logging) |
| Resets IDENTITY counter | No | Yes |
| Can be rolled back | Yes (inside transaction) | Yes (inside transaction) |
| Works with FK references | Yes (if children deleted first) | No (fails if FK references exist) |
| Fires DELETE triggers | Yes | No |

```sql
-- DELETE specific rows
DELETE FROM Rentals WHERE RentalDate < '2020-01-01';

-- TRUNCATE removes ALL rows and resets IDENTITY
-- Fails if Books is referenced by Rentals FK
TRUNCATE TABLE Rentals;   -- OK — Rentals has no child FKs
TRUNCATE TABLE Books;     -- ERROR if Rentals still references Books
```

---

## DELETE with OUTPUT Clause

```sql
-- Archive deleted rentals before removing them
DECLARE @ArchivedRentals TABLE (
    RentalID   INT,
    ClientID   INT,
    BookID     INT,
    RentalDate DATE,
    ReturnDate DATE
);

DELETE FROM Rentals
OUTPUT DELETED.RentalID, DELETED.ClientID, DELETED.BookID,
       DELETED.RentalDate, DELETED.ReturnDate
INTO   @ArchivedRentals
WHERE  ReturnDate IS NOT NULL
AND    ReturnDate < DATEADD(YEAR, -1, GETDATE());

SELECT * FROM @ArchivedRentals;
```

---

## Soft Delete Pattern

Instead of physically deleting, mark rows as inactive:

```sql
-- Add IsActive flag
ALTER TABLE Clients ADD IsActive BIT NOT NULL DEFAULT 1;

-- "Delete" a client (deactivate)
UPDATE Clients SET IsActive = 0 WHERE ClientID = 3;

-- Query: only show active clients
SELECT * FROM Clients WHERE IsActive = 1;
```

**Trade-offs:** History is preserved, records can be reactivated. All queries must filter on `IsActive = 1`.

---

## Transactions for Safety

```sql
BEGIN TRANSACTION;

-- Fully remove title TitleID = 4 and all its data
DELETE r
FROM   Rentals AS r
INNER JOIN Books AS b ON r.BookID = b.BookID
WHERE  b.TitleID = 4;

DELETE FROM Books WHERE TitleID = 4;
DELETE FROM Titles WHERE TitleID = 4;

-- Verify
SELECT * FROM Titles WHERE TitleID = 4;
SELECT * FROM Books  WHERE TitleID = 4;

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION if anything looks wrong
```

---

## Practice Exercises

**Exercise 1**
Delete the rental with `RentalID = 7`.

**Exercise 2**
Delete all rental records where the book was returned more than 6 months ago.

**Exercise 3**
Using a subquery in WHERE, delete all books whose condition is `'Poor'` and which have no active (unreturned) rentals.

**Exercise 4**
Write the correct sequence to completely remove a client (`ClientID = 4`) and all related rental records.

**Exercise 5**
Using `DELETE ... FROM ... JOIN`, remove all rentals belonging to clients whose email ends in `'@test.com'`.

**Exercise 6**
Using `DELETE ... FROM ... JOIN`, remove all book copies (from `Books`) of titles published before 1950. Make sure to delete any related `Rentals` first.

**Exercise 7**
Using `DELETE` with `OUTPUT`, remove all rentals that are overdue by more than 60 days (not returned and DueDate < 60 days ago). Capture the deleted rows into a table variable and display them.

**Exercise 8**
Explain the difference between `DELETE FROM Rentals` and `TRUNCATE TABLE Rentals`. When would you use each? What happens to the IDENTITY counter in each case? Why would `TRUNCATE TABLE Books` fail in this database?
