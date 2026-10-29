# Attendance Database — Worksheet 7: UPDATE Statements

## Learning Objectives
- Update attendance records, student data, and class enrollments safely
- Use JOINs in UPDATE to modify rows based on conditions in related tables
- Capture before/after state with the OUTPUT clause
- Wrap risky updates in transactions

---

## UPDATE Syntax

```sql
UPDATE table_name
SET    column1 = value1,
       column2 = value2
WHERE  condition;
```

> **WARNING:** Without a WHERE clause every row is updated. Always preview with SELECT first.

---

## Best Practice: Preview Before Updating

```sql
-- Preview which attendance records will be updated
SELECT AttendanceID, Status FROM Attendance WHERE ClassID = 1;

-- Then update
UPDATE Attendance SET Status = 'Present' WHERE ClassID = 1;
```

---

## Basic UPDATE — Single Column

```sql
-- Correct an attendance record
UPDATE Attendance
SET    Status = 'Late'
WHERE  AttendanceID = 3;

-- Update a student's grade
UPDATE Students
SET    Grade = '11A'
WHERE  StudentID = 1;

-- Fix a typo in a teacher's specialization
UPDATE Teachers
SET    Specialization = 'Mathematics'
WHERE  TeacherID = 1 AND Specialization = 'Maths';
```

---

## UPDATE Multiple Columns

```sql
-- Correct a student's contact details
UPDATE Students
SET    Email = 'maria.p.new@school.ro',
       Grade = '11A'
WHERE  StudentID = 1;

-- Update teacher name (e.g., name change after marriage)
UPDATE Teachers
SET    LastName = 'Munteanu-Pop',
       Email    = 'munteanu.pop@school.ro'
WHERE  TeacherID = 1;
```

---

## UPDATE with Complex WHERE

### IN clause

```sql
-- Mark several specific attendance records as 'Present'
UPDATE Attendance
SET    Status = 'Present'
WHERE  AttendanceID IN (3, 5, 7);

-- Update grade for multiple students
UPDATE Students
SET    Grade = '11A'
WHERE  StudentID IN (1, 2);
```

### BETWEEN

```sql
-- Set all attendance from September 3-5 for a cancelled week to 'Absent'
-- (Only affects unrerecorded/excused absence scenario)
UPDATE Attendance
SET    Status = 'Absent'
WHERE  AttendanceDate BETWEEN '2024-09-03' AND '2024-09-05'
AND    Status = 'Present';
```

### LIKE

```sql
-- Standardize specialization naming
UPDATE Teachers
SET    Specialization = 'Information Technology'
WHERE  Specialization LIKE '%IT%' OR Specialization LIKE '%Informatics%';
```

---

## UPDATE with Subquery in WHERE

```sql
-- Mark as 'Absent' all attendance for students in grade 10B on a specific date
UPDATE Attendance
SET    Status = 'Absent'
WHERE  AttendanceDate = '2024-09-05'
AND    ClassID IN (
    SELECT cl.ClassID
    FROM   Classes  AS cl
    INNER JOIN Students AS s ON cl.StudentID = s.StudentID
    WHERE  s.Grade = '10B'
);

-- Remove late status for classes of a specific subject
UPDATE Attendance
SET    Status = 'Present'
WHERE  Status = 'Late'
AND    ClassID IN (
    SELECT ClassID FROM Classes WHERE SubjectID = 2
);
```

---

## UPDATE with Subquery in SET

```sql
-- Reassign all attendance records for TeacherID=2 to TeacherID=1
-- (when a teacher takes over another's classes)
UPDATE Attendance
SET    TeacherID = 1
WHERE  TeacherID = 2;
-- (Simple, but shows how to reassign)
```

---

## UPDATE with JOIN (T-SQL FROM Clause)

### Example 1 — Update student grades based on their enrollment year

```sql
-- Preview
SELECT s.StudentID, s.FirstName, s.Grade,
       CASE WHEN YEAR(s.EnrollmentDate) = 2021 THEN '12A'
            WHEN YEAR(s.EnrollmentDate) = 2022 THEN '11A'
            WHEN YEAR(s.EnrollmentDate) = 2023 THEN '10A'
       END AS NewGrade
FROM   Students AS s;

-- Update
UPDATE s
SET    s.Grade = CASE WHEN YEAR(s.EnrollmentDate) = 2021 THEN '12A'
                      WHEN YEAR(s.EnrollmentDate) = 2022 THEN '11A'
                      WHEN YEAR(s.EnrollmentDate) = 2023 THEN '10A'
                      ELSE s.Grade
                 END
FROM   Students AS s;
```

### Example 2 — Change the teacher for all Mathematics attendance records

```sql
-- All Math sessions should now be taught by TeacherID 1
-- Preview
SELECT a.AttendanceID, a.TeacherID, sub.SubjectName
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'Mathematics';

-- Update
UPDATE a
SET    a.TeacherID = 1
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'Mathematics';
```

### Example 3 — Mark all attendance as 'Absent' for a grade that had a cancelled school day

```sql
-- All grade 10A students' attendance on 2024-09-05 should be 'Absent'
-- Preview
SELECT a.AttendanceID, s.Grade, a.AttendanceDate, a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s  ON cl.StudentID = s.StudentID
WHERE  a.AttendanceDate = '2024-09-05'
AND    s.Grade = '10A';

-- Update
UPDATE a
SET    a.Status = 'Absent'
FROM   Attendance AS a
INNER JOIN Classes  AS cl ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s  ON cl.StudentID = s.StudentID
WHERE  a.AttendanceDate = '2024-09-05'
AND    s.Grade = '10A';
```

### Example 4 — Promote students (update grade) and reassign their classes to a new semester

```sql
-- Two separate updates in one logical operation: promote grade 10A to 11A,
-- and update their Fall 2024 classes to Spring 2025

-- Step 1: Update student grades
UPDATE Students
SET    Grade = '11A'
WHERE  Grade = '10A';

-- Step 2: Update semester for their existing classes
UPDATE cl
SET    cl.Semester     = 'Spring',
       cl.AcademicYear = 2025
FROM   Classes  AS cl
INNER JOIN Students AS s ON cl.StudentID = s.StudentID
WHERE  s.Grade = '11A'           -- now '11A' after step 1
AND    cl.AcademicYear = 2024
AND    cl.Semester = 'Fall';
```

---

## UPDATE with OUTPUT Clause

```sql
-- Audit log: capture attendance status changes
DECLARE @StatusChanges TABLE (
    AttendanceID INT,
    OldStatus    NVARCHAR(20),
    NewStatus    NVARCHAR(20),
    ChangeDate   DATE
);

UPDATE Attendance
SET    Status = 'Present'
OUTPUT DELETED.AttendanceID,
       DELETED.Status   AS OldStatus,
       INSERTED.Status  AS NewStatus,
       INSERTED.AttendanceDate AS ChangeDate
INTO   @StatusChanges
WHERE  Status = 'Late'
AND    ClassID IN (1, 2, 3);

SELECT * FROM @StatusChanges;
```

---

## Transactions for Safety

```sql
BEGIN TRANSACTION;

-- Reassign all attendance for TeacherID=3 to TeacherID=1 (teacher leaves)
UPDATE Attendance
SET    TeacherID = 1
WHERE  TeacherID = 3;

-- Review
SELECT TeacherID, COUNT(*) AS Records
FROM   Attendance
GROUP BY TeacherID;

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION if the results look wrong
```

---

## Practice Exercises

**Exercise 1**
Update the `Specialization` of the teacher with `TeacherID = 2` to `'Applied Physics'`.

**Exercise 2**
Change all `'Late'` attendance records to `'Present'` for `ClassID = 4`.

**Exercise 3**
Using a subquery in WHERE, update all attendance records to `'Absent'` for students in grade `'10B'` on `'2024-09-05'`.

**Exercise 4**
Using `UPDATE ... FROM ... JOIN`, change the teacher for all Literature class (`SubjectName = 'Literature'`) attendance records to `TeacherID = 3`.

**Exercise 5**
Using `UPDATE ... FROM ... JOIN`, update the `AcademicYear` from `2024` to `2025` for all classes where the enrolled student is in grade `'11A'`.

**Exercise 6**
Using `UPDATE ... FROM ... JOIN` with a 3-table join, mark all attendance records as `'Absent'` for students whose email ends in `'@school.ro'` on `'2024-09-03'`.

**Exercise 7**
Using `UPDATE` with `OUTPUT`, change all `'Absent'` attendance records to `'Present'` on `'2024-09-04'`, and capture the `AttendanceID`, old status, and new status in a table variable. Display the results.

**Exercise 8**
Write a transaction that:
1. Promotes all students with `Grade = '10A'` to `Grade = '11A'`
2. Verifies the change with a SELECT
3. COMMITs or ROLLBACKs with a comment explaining the choice
