# Attendance Database — Worksheet 8: DELETE Statements

## Learning Objectives
- Delete rows from attendance tables safely with WHERE
- Delete in the correct FK order to avoid constraint violations
- Use DELETE with JOINs to remove rows based on conditions in related tables
- Understand TRUNCATE vs DELETE in the context of an attendance system

---

## DELETE Syntax

```sql
DELETE FROM table_name
WHERE condition;
```

> **WARNING:** Without WHERE, every row in the table is deleted. Always preview with a SELECT first, and consider wrapping destructive operations in a transaction.

---

## Best Practice: Preview Before Deleting

```sql
-- Preview: which attendance records will be removed?
SELECT * FROM Attendance WHERE ClassID = 5;

-- Then delete
DELETE FROM Attendance WHERE ClassID = 5;
```

---

## Basic DELETE — Single Row

```sql
-- Remove a specific attendance record (e.g., data entry error)
DELETE FROM Attendance WHERE AttendanceID = 11;

-- Remove a specific class enrollment (student dropped a subject)
DELETE FROM Classes WHERE ClassID = 9;

-- Remove a student record (must delete dependent rows first)
DELETE FROM Students WHERE StudentID = 8;
```

---

## DELETE Multiple Rows with WHERE

### IN clause

```sql
-- Remove attendance records for specific classes
DELETE FROM Attendance WHERE ClassID IN (9, 10);

-- Remove all classes for a specific subject
DELETE FROM Classes WHERE SubjectID = 5;
```

### BETWEEN

```sql
-- Remove attendance records from a test date range
DELETE FROM Attendance
WHERE AttendanceDate BETWEEN '2024-09-01' AND '2024-09-02';
```

### LIKE

```sql
-- Remove test student accounts
DELETE FROM Students
WHERE Email LIKE '%@test.ro' OR Email LIKE '%@example.com';
```

### Compound conditions

```sql
-- Remove old attendance records that are no longer needed
DELETE FROM Attendance
WHERE AttendanceDate < DATEADD(YEAR, -5, GETDATE());

-- Remove 'Absent' records for a specific date (e.g., holiday — everyone was absent)
DELETE FROM Attendance
WHERE Status = 'Absent'
AND   AttendanceDate = '2024-12-25';
```

---

## DELETE with Subquery in WHERE

```sql
-- Remove all attendance records for students in grade '10B'
DELETE FROM Attendance
WHERE ClassID IN (
    SELECT cl.ClassID
    FROM   Classes  AS cl
    INNER JOIN Students AS s ON cl.StudentID = s.StudentID
    WHERE  s.Grade = '10B'
);

-- Remove class enrollments for a subject that is being discontinued
DELETE FROM Classes
WHERE SubjectID = (
    SELECT SubjectID FROM Subjects WHERE SubjectName = 'History'
);

-- Remove students who have no class enrollments
DELETE FROM Students
WHERE StudentID NOT IN (
    SELECT DISTINCT StudentID FROM Classes
);
```

---

## DELETE with JOIN (T-SQL FROM Clause)

### Example 1 — Delete attendance records for a specific subject

```sql
-- Preview
SELECT a.AttendanceID, sub.SubjectName, a.AttendanceDate
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'History';

-- Delete
DELETE a
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'History';
```

### Example 2 — Delete attendance for a specific grade on a specific date

```sql
-- Delete all attendance for grade 10A on September 5 (cancelled classes)
DELETE a
FROM   Attendance AS a
INNER JOIN Classes  AS cl ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s  ON cl.StudentID = s.StudentID
WHERE  s.Grade           = '10A'
AND    a.AttendanceDate  = '2024-09-05';
```

### Example 3 — Anti-join DELETE: remove classes for subjects that no longer exist

```sql
-- Preview orphaned class enrollments
SELECT cl.ClassID, cl.SubjectID
FROM   Classes AS cl
LEFT JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectID IS NULL;

-- Delete orphaned class enrollments
DELETE cl
FROM   Classes AS cl
LEFT JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectID IS NULL;
```

---

## Respecting Foreign Key Constraints

The correct deletion order for AttendanceDB (most-child to most-parent):

```
1. Attendance   (references Classes and Teachers)
2. Classes      (references Students and Subjects)
3. Students     (no child FK references — safe)
4. Teachers     (no child FK references — safe)
5. Subjects     (no child FK references — safe)
```

### Complete removal of a student

```sql
-- Step 1: Remove attendance records for this student's classes
DELETE a
FROM   Attendance AS a
INNER JOIN Classes AS cl ON a.ClassID = cl.ClassID
WHERE  cl.StudentID = 3;

-- Step 2: Remove the class enrollments
DELETE FROM Classes WHERE StudentID = 3;

-- Step 3: Remove the student
DELETE FROM Students WHERE StudentID = 3;
```

### Complete removal of a subject (retiring a subject)

```sql
-- Step 1: Remove attendance records for all classes of this subject
DELETE a
FROM   Attendance AS a
INNER JOIN Classes AS cl ON a.ClassID = cl.ClassID
WHERE  cl.SubjectID = 5;

-- Step 2: Remove the class enrollments for this subject
DELETE FROM Classes WHERE SubjectID = 5;

-- Step 3: Remove the subject itself
DELETE FROM Subjects WHERE SubjectID = 5;
```

---

## TRUNCATE TABLE vs DELETE

| Feature | DELETE | TRUNCATE |
|---|---|---|
| WHERE clause | Supported | Not supported |
| Speed | Slower (row logging) | Faster (minimal logging) |
| Resets IDENTITY counter | No | Yes |
| Can be rolled back | Yes (in transaction) | Yes (in transaction) |
| Works with FK references | Yes (if children removed) | No |
| Fires DELETE triggers | Yes | No |

```sql
-- DELETE: precise, row-by-row
DELETE FROM Attendance WHERE AttendanceDate < '2020-01-01';

-- TRUNCATE: removes ALL rows, resets identity
TRUNCATE TABLE Attendance;   -- OK — no table has Attendance as a FK target
TRUNCATE TABLE Classes;      -- ERROR — Attendance references Classes via FK
```

---

## DELETE with OUTPUT Clause

```sql
-- Archive deleted attendance records before removing them
DECLARE @Deleted TABLE (
    AttendanceID   INT,
    ClassID        INT,
    TeacherID      INT,
    AttendanceDate DATE,
    Status         NVARCHAR(20)
);

DELETE FROM Attendance
OUTPUT DELETED.AttendanceID, DELETED.ClassID, DELETED.TeacherID,
       DELETED.AttendanceDate, DELETED.Status
INTO   @Deleted
WHERE  AttendanceDate < DATEADD(YEAR, -1, GETDATE());

SELECT * FROM @Deleted;
```

---

## Soft Delete Pattern

Instead of deleting, deactivate with a flag:

```sql
-- Add IsActive to Students
ALTER TABLE Students ADD IsActive BIT NOT NULL DEFAULT 1;

-- "Delete" a student
UPDATE Students SET IsActive = 0 WHERE StudentID = 3;

-- Active students only
SELECT * FROM Students WHERE IsActive = 1;
```

---

## Transactions for Safety

```sql
BEGIN TRANSACTION;

-- Fully remove subject 'History' (SubjectID = 5) and all related data
DELETE a
FROM   Attendance AS a
INNER JOIN Classes AS cl ON a.ClassID = cl.ClassID
WHERE  cl.SubjectID = 5;

DELETE FROM Classes WHERE SubjectID = 5;
DELETE FROM Subjects WHERE SubjectID = 5;

-- Verify
SELECT * FROM Subjects WHERE SubjectID = 5;
SELECT * FROM Classes  WHERE SubjectID = 5;

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION if something went wrong
```

---

## Practice Exercises

**Exercise 1**
Delete the attendance record with `AttendanceID = 12`.

**Exercise 2**
Delete all attendance records where `Status = 'Late'` on `'2024-09-04'`.

**Exercise 3**
Using a subquery, delete all class enrollments (`Classes` rows) for students in grade `'10B'` — but only after ensuring their attendance records are deleted first.

**Exercise 4**
Write the complete sequence to remove the teacher with `TeacherID = 5` from the system — first update their attendance records to reassign them to `TeacherID = 1`, then (optionally) delete the teacher.

**Exercise 5**
Using `DELETE ... FROM ... JOIN`, remove all attendance records for the `'Physics'` subject (join through Attendance → Classes → Subjects).

**Exercise 6**
Using `DELETE ... FROM ... JOIN`, remove all class enrollments for students whose email ends in `'@test.ro'`. (Join Classes → Students.)

**Exercise 7**
Using `DELETE` with `OUTPUT`, remove all attendance records from `'2024-09-03'` and capture the deleted rows in a table variable. Display `AttendanceID`, `ClassID`, and `Status`.

**Exercise 8**
Explain the difference between `DELETE FROM Attendance` and `TRUNCATE TABLE Attendance`:
- What happens to the identity counter in each case?
- Can you use a WHERE clause with TRUNCATE?
- Why would `TRUNCATE TABLE Classes` fail if Attendance still contains rows?
- In what scenario would you use TRUNCATE rather than DELETE?
