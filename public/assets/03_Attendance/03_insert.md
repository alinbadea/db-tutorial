# Attendance Database — Worksheet 3: INSERT Statements

## Learning Objectives
- Write INSERT statements for all 5 Attendance database tables
- Populate tables in the correct FK-respecting order
- Use INSERT...SELECT and OUTPUT for advanced scenarios
- Work correctly with IDENTITY columns and multi-row inserts

---

## INSERT Syntax

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

---

## Method 1: INSERT Without a Column List

```sql
-- Insert a student without specifying columns
-- Values must match the column order, skipping IDENTITY
INSERT INTO Students
VALUES ('Maria', 'Popescu', 'maria@school.ro', '2023-09-01', '10A');
```

> **Warning:** If a column is added or reordered, this will fail or insert wrong data. Always use the column list form in real applications.

---

## Method 2: INSERT With a Column List (Best Practice)

```sql
INSERT INTO Students (FirstName, LastName, Email, EnrollmentDate, Grade)
VALUES ('Maria', 'Popescu', 'maria@school.ro', '2023-09-01', '10A');

-- Omit nullable columns — they receive NULL automatically
INSERT INTO Students (FirstName, LastName, Email)
VALUES ('Anonymous', 'Student', 'anon@school.ro');
```

---

## Method 3: Inserting Multiple Rows in One Statement

```sql
INSERT INTO Subjects (SubjectName, Description, Credits)
VALUES
    ('Mathematics',  'Algebra, calculus, and statistics', 4),
    ('Physics',      'Mechanics, thermodynamics, optics', 3),
    ('Chemistry',    'Organic and inorganic chemistry',   3),
    ('Literature',   'Romanian and world literature',     3),
    ('History',      'World and national history',        2);
```

---

## Method 4: INSERT … SELECT

Copy data from another source:

```sql
-- Enroll all grade-10A students in Mathematics (SubjectID = 1) for Fall 2024
INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
SELECT 1, StudentID, 2024, 'Fall'
FROM   Students
WHERE  Grade = '10A';

-- Copy attendance from one date to another (rescheduled class)
INSERT INTO Attendance (ClassID, TeacherID, AttendanceDate, Status)
SELECT ClassID, TeacherID, '2024-09-10', 'Present'
FROM   Attendance
WHERE  AttendanceDate = '2024-09-03'
AND    Status = 'Present';
```

Using a CTE:

```sql
-- Enroll all students in all subjects for Fall 2024
WITH Enrollments AS (
    SELECT s.StudentID, sub.SubjectID
    FROM   Students AS s
    CROSS JOIN Subjects AS sub   -- all combinations
)
INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
SELECT SubjectID, StudentID, 2024, 'Fall'
FROM   Enrollments;
```

---

## IDENTITY Columns

```sql
-- Correct: StudentID omitted — SQL Server generates it
INSERT INTO Students (FirstName, LastName, Email, Grade)
VALUES ('Andrei', 'Constantin', 'andrei@school.ro', '10B');

-- Retrieve the generated ID
SELECT SCOPE_IDENTITY() AS NewStudentID;

-- Or get the current identity value for a specific table
SELECT IDENT_CURRENT('Students') AS LatestStudentID;
```

---

## SET IDENTITY_INSERT

Used when you need to insert a specific ID (e.g., data migration):

```sql
SET IDENTITY_INSERT Students ON;

INSERT INTO Students (StudentID, FirstName, LastName, Email, Grade)
VALUES (100, 'Test', 'Student', 'test@school.ro', '11A');

SET IDENTITY_INSERT Students OFF;
```

---

## INSERT with OUTPUT Clause

```sql
-- Insert a new class enrollment and capture the generated ClassID
DECLARE @NewClasses TABLE (ClassID INT, StudentID INT, SubjectID INT);

INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
OUTPUT INSERTED.ClassID, INSERTED.StudentID, INSERTED.SubjectID
INTO   @NewClasses
VALUES (2, 1, 2024, 'Fall'),
       (2, 2, 2024, 'Fall');

SELECT * FROM @NewClasses;
```

---

## Complete Sample Data Script

Insert in FK-safe order: Students → Teachers → Subjects → Classes → Attendance.

```sql
USE AttendanceDB;
GO

-- ===========================
-- Students (8 rows)
-- ===========================
INSERT INTO Students (FirstName, LastName, Email, EnrollmentDate, Grade)
VALUES
    ('Maria',   'Popescu',     'maria.p@school.ro',    '2023-09-01', '10A'),
    ('Ion',     'Ionescu',     'ion.i@school.ro',      '2023-09-01', '10A'),
    ('Ana',     'Dumitrescu',  'ana.d@school.ro',      '2023-09-01', '10B'),
    ('Mihai',   'Constantin',  'mihai.c@school.ro',    '2023-09-01', '10B'),
    ('Elena',   'Radu',        'elena.r@school.ro',    '2022-09-01', '11A'),
    ('Andrei',  'Stan',        'andrei.s@school.ro',   '2022-09-01', '11A'),
    ('Cristina','Moldovan',    'cristina.m@school.ro', '2022-09-01', '11B'),
    ('Vlad',    'Petrescu',    'vlad.p@school.ro',     '2021-09-01', '12A');
GO

-- ===========================
-- Teachers (5 rows)
-- ===========================
INSERT INTO Teachers (FirstName, LastName, Email, Specialization)
VALUES
    ('Ion',     'Munteanu',  'munteanu@school.ro', 'Mathematics'),
    ('Elena',   'Radu',      'e.radu@school.ro',   'Physics'),
    ('Mihai',   'Pop',       'm.pop@school.ro',    'Literature'),
    ('Sorina',  'Ionescu',   's.ionescu@school.ro','Chemistry'),
    ('Bogdan',  'Dima',      'b.dima@school.ro',   'History');
GO

-- ===========================
-- Subjects (5 rows)
-- ===========================
INSERT INTO Subjects (SubjectName, Description, Credits)
VALUES
    ('Mathematics', 'Algebra, calculus, and geometry',  4),
    ('Physics',     'Mechanics, optics, thermodynamics', 3),
    ('Literature',  'Romanian and world literature',     3),
    ('Chemistry',   'Organic and inorganic chemistry',   3),
    ('History',     'World history and civics',          2);
GO

-- ===========================
-- Classes (10 enrollments)
-- ===========================
-- Grade 10A students enroll in Mathematics and Physics
-- Grade 10B students enroll in Mathematics and Literature
INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
VALUES
    (1, 1, 2024, 'Fall'),   -- Maria  → Mathematics
    (1, 2, 2024, 'Fall'),   -- Ion    → Mathematics
    (2, 1, 2024, 'Fall'),   -- Maria  → Physics
    (2, 2, 2024, 'Fall'),   -- Ion    → Physics
    (1, 3, 2024, 'Fall'),   -- Ana    → Mathematics
    (3, 3, 2024, 'Fall'),   -- Ana    → Literature
    (1, 4, 2024, 'Fall'),   -- Mihai  → Mathematics
    (3, 4, 2024, 'Fall'),   -- Mihai  → Literature
    (4, 5, 2024, 'Fall'),   -- Elena  → Chemistry
    (5, 6, 2024, 'Fall');   -- Andrei → History
GO

-- ===========================
-- Attendance (12 records)
-- ===========================
INSERT INTO Attendance (ClassID, TeacherID, AttendanceDate, Status)
VALUES
    (1, 1, '2024-09-03', 'Present'),  -- Maria/Math
    (2, 1, '2024-09-03', 'Present'),  -- Ion/Math
    (5, 1, '2024-09-03', 'Absent'),   -- Ana/Math
    (7, 1, '2024-09-03', 'Present'),  -- Mihai/Math
    (3, 2, '2024-09-04', 'Present'),  -- Maria/Physics
    (4, 2, '2024-09-04', 'Late'),     -- Ion/Physics
    (6, 3, '2024-09-04', 'Present'),  -- Ana/Literature
    (8, 3, '2024-09-04', 'Present'),  -- Mihai/Literature
    (1, 1, '2024-09-05', 'Present'),  -- Maria/Math (second session)
    (2, 1, '2024-09-05', 'Absent'),   -- Ion/Math
    (9, 4, '2024-09-05', 'Present'),  -- Elena/Chemistry
    (10,5, '2024-09-05', 'Present');  -- Andrei/History
GO
```

---

## Practice Exercises

**Exercise 1**
Insert a new student: `'Raluca Georgescu'`, email `'raluca@school.ro'`, grade `'10A'`, enrolled today. Retrieve the generated `StudentID`.

**Exercise 2**
In a single INSERT, add 3 new teachers: a Biology teacher, an English teacher, and an Art teacher (use realistic names and emails).

**Exercise 3**
Using `INSERT ... SELECT`, enroll all grade-10A students (those with `Grade = '10A'`) in the Chemistry subject (`SubjectID = 4`) for Fall 2024.

**Exercise 4**
Using `INSERT` with `OUTPUT`, add two attendance records for `ClassID = 9` and `ClassID = 10` on `'2024-09-06'` (both Present, `TeacherID` = 4 and 5 respectively). Capture the generated `AttendanceID`s.

**Exercise 5**
Write an `INSERT ... SELECT` that creates attendance records for all classes on `'2024-09-10'` using the teacher from their most recent attendance entry. (Hint: join Classes to the most recent Attendance row per class.)
