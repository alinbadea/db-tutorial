# Library Database — Worksheet 7: UPDATE Statements

## Learning Objectives
- Write UPDATE statements to modify library data safely
- Use subqueries and JOINs in UPDATE to change rows based on related table data
- Capture audit trails with the OUTPUT clause
- Apply transactions for safe batch updates

---

## UPDATE Syntax

```sql
UPDATE table_name
SET    column1 = value1,
       column2 = value2
WHERE  condition;
```

> **WARNING:** Without a WHERE clause, every row in the table is updated. Always preview with a SELECT first.

---

## Best Practice: Preview Before Updating

```sql
-- Preview which books will be marked as unavailable
SELECT BookID, IsAvailable FROM Books WHERE TitleID = 1;

-- Then update
UPDATE Books SET IsAvailable = 0 WHERE TitleID = 1;
```

---

## Basic UPDATE — Single Column

```sql
-- Correct a client's phone number
UPDATE Clients
SET    Phone = '555-9999'
WHERE  ClientID = 3;

-- Update a book's condition after inspection
UPDATE Books
SET    Condition = 'Fair'
WHERE  BookID = 4;

-- Mark a rental as returned
UPDATE Rentals
SET    ReturnDate = GETDATE()
WHERE  RentalID = 2;
```

---

## UPDATE Multiple Columns

```sql
-- Update a publisher's contact details
UPDATE Publishers
SET    Phone   = '020-1234-5678',
       Email   = 'contact@penguin.co.uk',
       Address = '80 Strand, London, WC2R 0RL'
WHERE  PublisherName = 'Penguin Books';

-- Update a client's address and phone
UPDATE Clients
SET    Address = 'Calea Florilor 10, Bucharest',
       Phone   = '555-1234'
WHERE  ClientID = 1;
```

---

## UPDATE with Complex WHERE

### IN clause

```sql
-- Mark all Technology books as priority items (add condition check)
UPDATE Books
SET    Condition = 'Good'
WHERE  TitleID IN (
    SELECT TitleID FROM Titles WHERE Genre = 'Technology'
)
AND    Condition = 'Fair';
```

### BETWEEN

```sql
-- Extend due date for all rentals made in a specific period
UPDATE Rentals
SET    DueDate = DATEADD(DAY, 7, DueDate)
WHERE  RentalDate BETWEEN '2024-01-10' AND '2024-01-15'
AND    ReturnDate IS NULL;
```

### LIKE

```sql
-- Update email domain for a client migration
UPDATE Clients
SET    Email = REPLACE(Email, '@mail.com', '@library.org')
WHERE  Email LIKE '%@mail.com';
```

---

## UPDATE with Subquery in WHERE

```sql
-- Mark as returned all rentals for books that have been lost (condition = 'Poor')
UPDATE Rentals
SET    ReturnDate = GETDATE()
WHERE  ReturnDate IS NULL
AND    BookID IN (
    SELECT BookID FROM Books WHERE Condition = 'Poor'
);

-- Reset availability for all books that have no active rentals
UPDATE Books
SET    IsAvailable = 1
WHERE  BookID NOT IN (
    SELECT BookID FROM Rentals WHERE ReturnDate IS NULL
);
```

---

## UPDATE with Subquery in SET

```sql
-- Derive the DueDate from RentalDate + RentalDays for rows where DueDate was not set
UPDATE Rentals
SET    DueDate = DATEADD(DAY, RentalDays, RentalDate)
WHERE  DueDate IS NULL;
```

---

## UPDATE with JOIN (T-SQL FROM Clause)

### Example 1 — Mark a book as unavailable when it is rented out

When a rental is created, the corresponding book should be marked unavailable. This JOIN syncs the two tables.

```sql
-- Preview
SELECT b.BookID, b.IsAvailable, r.RentalID
FROM   Books AS b
INNER JOIN Rentals AS r ON b.BookID = r.BookID
WHERE  r.ReturnDate IS NULL
AND    b.IsAvailable = 1;

-- Update
UPDATE b
SET    b.IsAvailable = 0
FROM   Books   AS b
INNER JOIN Rentals AS r ON b.BookID = r.BookID
WHERE  r.ReturnDate IS NULL;
```

### Example 2 — Mark books as available when their rental is returned

```sql
-- Update availability based on whether any active (unreturned) rental still exists
UPDATE b
SET    b.IsAvailable = CASE
    WHEN active.BookID IS NULL THEN 1   -- no active rental → available
    ELSE 0                               -- still rented → unavailable
END
FROM   Books AS b
LEFT JOIN (
    SELECT DISTINCT BookID
    FROM   Rentals
    WHERE  ReturnDate IS NULL
) AS active ON b.BookID = active.BookID;
```

### Example 3 — Extend due dates for clients with a premium membership

```sql
-- Suppose a PremiumClients table or a flag column identifies VIPs
-- Here we extend due dates for clients who joined before 2023
UPDATE r
SET    r.DueDate = DATEADD(DAY, 7, r.DueDate)
FROM   Rentals  AS r
INNER JOIN Clients AS cl ON r.ClientID = cl.ClientID
WHERE  cl.MembershipDate < '2023-01-01'
AND    r.ReturnDate IS NULL;
```

### Example 4 — Update book condition based on number of times rented

```sql
-- Books rented more than 3 times → downgrade condition one level
UPDATE b
SET    b.Condition = CASE b.Condition
    WHEN 'New'  THEN 'Good'
    WHEN 'Good' THEN 'Fair'
    WHEN 'Fair' THEN 'Poor'
    ELSE b.Condition   -- 'Poor' stays 'Poor'
END
FROM   Books AS b
INNER JOIN (
    SELECT BookID, COUNT(*) AS RentalCount
    FROM   Rentals
    GROUP BY BookID
    HAVING COUNT(*) > 3
) AS frequent ON b.BookID = frequent.BookID;
```

---

## UPDATE with OUTPUT Clause

```sql
-- Return a book: update and capture the event
DECLARE @ReturnLog TABLE (
    RentalID   INT,
    BookID     INT,
    OldReturn  DATE,
    NewReturn  DATE
);

UPDATE Rentals
SET    ReturnDate = CAST(GETDATE() AS DATE)
OUTPUT DELETED.RentalID, DELETED.BookID,
       DELETED.ReturnDate AS OldReturn,
       INSERTED.ReturnDate AS NewReturn
INTO   @ReturnLog
WHERE  RentalID = 2;

SELECT * FROM @ReturnLog;
```

---

## Transactions for Safety

```sql
BEGIN TRANSACTION;

-- Extend all active rentals by 3 days due to library closure
UPDATE Rentals
SET    DueDate = DATEADD(DAY, 3, DueDate)
WHERE  ReturnDate IS NULL;

-- Review results
SELECT RentalID, DueDate FROM Rentals WHERE ReturnDate IS NULL;

-- If correct:
COMMIT TRANSACTION;
-- If wrong:
-- ROLLBACK TRANSACTION;
```

---

## Practice Exercises

**Exercise 1**
Update the `Condition` of book with `BookID = 5` to `'Poor'`.

**Exercise 2**
Update the `MembershipDate` of all clients whose email ends in `'@mail.com'` to `'2024-01-01'`.

**Exercise 3**
Using a subquery in WHERE, mark as returned (`ReturnDate = GETDATE()`) all rentals for books whose condition is `'Poor'` and that are still unreturned.

**Exercise 4**
Using `UPDATE ... FROM ... JOIN`, set `IsAvailable = 1` for all books that have no unreturned rental currently open. Join `Books` to `Rentals` using a LEFT JOIN anti-join pattern.

**Exercise 5**
Using `UPDATE ... FROM ... JOIN`, update the `DueDate` in `Rentals` to `RentalDate + 21` days for all rentals of `'Fiction'` genre books. Join through `Rentals → Books → Titles`.

**Exercise 6**
Using `UPDATE` with `OUTPUT`, record all rentals that are past their due date — change their `RentalDays` to the actual days they were held (using `DATEDIFF(DAY, RentalDate, GETDATE())`), and capture the old and new `RentalDays` in a table variable.

**Exercise 7**
Write a transaction that marks all unreturned rentals as returned (`ReturnDate = GETDATE()`) and simultaneously marks all affected books as available (`IsAvailable = 1`). Use two UPDATE statements inside a single transaction.

**Exercise 8**
Using a JOIN update, copy the publisher's email into a `ContactEmail` column in `Books` (assume you add this column first). Join `Books` to `Publishers` and set `Books.ContactEmail = Publishers.Email`.
