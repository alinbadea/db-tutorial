# Attendance Database — Worksheet 5: SELECT — JOINs

## Learning Objectives
- Join all 5 Attendance database tables to answer real school reporting questions
- Use INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN
- Find students with no attendance, subjects with no enrollments, and other anti-join scenarios
- Write clean multi-table queries using table aliases

---

## Why JOINs?

The Attendance database separates concerns across 5 tables. To answer "Which students were absent on September 3?" we need to join Attendance → Classes → Students. JOINs let us reconstruct the full picture without storing redundant data.

---

## JOIN Types — Overview

| JOIN | Returns |
|---|---|
| `INNER JOIN` | Only rows with a match in **both** tables |
| `LEFT JOIN` | All from left + matched right rows (NULL if no match) |
| `RIGHT JOIN` | All from right + matched left rows (NULL if no match) |
| `FULL OUTER JOIN` | All rows from both tables; NULLs on the unmatched side |

---

## Table Aliases

```sql
-- Without aliases
SELECT Students.FirstName, Subjects.SubjectName
FROM   Classes
INNER JOIN Students ON Classes.StudentID = Students.StudentID
INNER JOIN Subjects ON Classes.SubjectID = Subjects.SubjectID;

-- With aliases (much cleaner)
SELECT s.FirstName, sub.SubjectName
FROM   Classes   AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID;
```

---

## INNER JOIN

### Example 1 — Classes with student and subject names

```sql
SELECT
    cl.ClassID,
    s.FirstName + ' ' + s.LastName AS StudentName,
    s.Grade,
    sub.SubjectName,
    cl.AcademicYear,
    cl.Semester
FROM   Classes  AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
ORDER BY cl.AcademicYear, cl.Semester, sub.SubjectName, s.LastName;
```

### Example 2 — Attendance with student and teacher names

```sql
SELECT
    a.AttendanceDate,
    s.FirstName + ' ' + s.LastName  AS StudentName,
    sub.SubjectName,
    t.FirstName + ' ' + t.LastName  AS TeacherName,
    a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID   = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
INNER JOIN Teachers AS t   ON a.TeacherID  = t.TeacherID
ORDER BY a.AttendanceDate, s.LastName;
```

### Example 3 — Full attendance report (all 5 tables)

```sql
SELECT
    a.AttendanceID,
    a.AttendanceDate,
    DATENAME(WEEKDAY, a.AttendanceDate)  AS DayOfWeek,
    s.FirstName + ' ' + s.LastName       AS StudentName,
    s.Grade,
    sub.SubjectName,
    sub.Credits,
    t.FirstName + ' ' + t.LastName       AS TeacherName,
    t.Specialization,
    cl.Semester,
    cl.AcademicYear,
    a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
INNER JOIN Teachers AS t   ON a.TeacherID  = t.TeacherID
ORDER BY a.AttendanceDate, s.LastName, sub.SubjectName;
```

### Example 4 — Absent or late students on a specific date

```sql
SELECT
    a.AttendanceDate,
    s.FirstName + ' ' + s.LastName  AS StudentName,
    sub.SubjectName,
    a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  a.AttendanceDate = '2024-09-03'
AND    a.Status IN ('Absent', 'Late')
ORDER BY sub.SubjectName, s.LastName;
```

---

## LEFT OUTER JOIN

### Example 1 — All students and their attendance records (including students with none)

```sql
SELECT
    s.StudentID,
    s.FirstName + ' ' + s.LastName AS StudentName,
    s.Grade,
    a.AttendanceDate,
    a.Status
FROM   Students   AS s
LEFT JOIN Classes    AS cl ON s.StudentID  = cl.StudentID
LEFT JOIN Attendance AS a  ON cl.ClassID   = a.ClassID
ORDER BY s.StudentID, a.AttendanceDate;
```

### Example 2 — All enrolled students and their attendance count per subject

```sql
SELECT
    s.FirstName + ' ' + s.LastName  AS StudentName,
    sub.SubjectName,
    COUNT(a.AttendanceID)           AS SessionsAttended
FROM   Classes  AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
LEFT JOIN Attendance AS a  ON a.ClassID    = cl.ClassID
GROUP BY s.StudentID, s.FirstName, s.LastName, sub.SubjectName
ORDER BY s.LastName, sub.SubjectName;
```

### Anti-join — Students with no attendance records at all

```sql
SELECT s.StudentID, s.FirstName + ' ' + s.LastName AS StudentName, s.Grade
FROM   Students AS s
LEFT JOIN Classes AS cl ON s.StudentID = cl.StudentID
LEFT JOIN Attendance AS a ON cl.ClassID = a.ClassID
WHERE  a.AttendanceID IS NULL;
```

### Anti-join — Subjects that have no enrollments (no students in Classes table)

```sql
SELECT sub.SubjectID, sub.SubjectName, sub.Credits
FROM   Subjects AS sub
LEFT JOIN Classes AS cl ON sub.SubjectID = cl.SubjectID
WHERE  cl.ClassID IS NULL;
```

---

## RIGHT OUTER JOIN

```sql
-- All teachers, including those who have never taken attendance
SELECT
    t.FirstName + ' ' + t.LastName AS TeacherName,
    t.Specialization,
    a.AttendanceDate,
    a.Status
FROM   Attendance AS a
RIGHT JOIN Teachers AS t ON a.TeacherID = t.TeacherID
ORDER BY t.LastName, a.AttendanceDate;
```

---

## FULL OUTER JOIN

```sql
-- All students and all classes — show unmatched on both sides
SELECT
    s.FirstName + ' ' + s.LastName AS StudentName,
    cl.ClassID,
    cl.AcademicYear,
    cl.Semester
FROM   Students AS s
FULL OUTER JOIN Classes AS cl ON s.StudentID = cl.StudentID
ORDER BY s.StudentID, cl.ClassID;
```

---

## Joining All 5 Tables

A comprehensive daily roll call view:

```sql
SELECT
    a.AttendanceDate,
    s.Grade,
    sub.SubjectName,
    s.FirstName + ' ' + s.LastName   AS StudentName,
    t.FirstName + ' ' + t.LastName   AS TeacherName,
    a.Status,
    cl.Semester,
    cl.AcademicYear
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
INNER JOIN Teachers AS t   ON a.TeacherID  = t.TeacherID
ORDER BY a.AttendanceDate, s.Grade, sub.SubjectName;
```

---

## Common Mistakes

```sql
-- MISTAKE: Joining on wrong column
SELECT s.FirstName, sub.SubjectName
FROM   Classes AS cl
INNER JOIN Students AS s   ON cl.ClassID  = s.StudentID  -- WRONG! Should be cl.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID;

-- MISTAKE: Missing JOIN condition gives Cartesian product
SELECT s.FirstName, t.FirstName
FROM   Students AS s
INNER JOIN Teachers AS t;  -- Error: ON clause required

-- CORRECT: there is no direct FK between Students and Teachers
-- Always route through Classes → Attendance → Teachers
```

---

## Practice Exercises

**Exercise 1 (Easy)**
Show the full names of all students enrolled in the `'Mathematics'` subject (SubjectID = 1) in Fall 2024.

**Exercise 2 (Easy)**
Show all attendance records from `'2024-09-04'` with the student's full name and subject name.

**Exercise 3 (Medium)**
Find all students who have **never** had any attendance record. Show their full name and grade.

**Exercise 4 (Medium)**
Show all subjects along with how many students are enrolled in each. Include subjects with no enrollments (show 0). Sort by enrollment count descending.

**Exercise 5 (Medium)**
List all attendance records where the status is `'Absent'`, showing student name, subject name, teacher name, and attendance date. Sort by date.

**Exercise 6 (Medium)**
Show all teachers and the number of distinct dates on which they have taken attendance. Include teachers who have taken attendance zero times. Sort by date count descending.

**Exercise 7 (Hard)**
For each student, show their full name, grade, number of subjects enrolled in, total attendance records, and count of absences. Sort by absence count descending.

**Exercise 8 (Hard)**
Show every student-subject combination from `Classes` along with their latest attendance status (from the most recent `Attendance` record). Students with no attendance should show NULL for status.

---

## Answers

**Exercise 1**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName
FROM   Classes  AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'Mathematics'
AND    cl.AcademicYear = 2024 AND cl.Semester = 'Fall';
```

**Exercise 2**
```sql
SELECT a.AttendanceDate, s.FirstName + ' ' + s.LastName AS StudentName,
       sub.SubjectName, a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  a.AttendanceDate = '2024-09-04';
```

**Exercise 3**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName, s.Grade
FROM   Students AS s
LEFT JOIN Classes    AS cl ON s.StudentID = cl.StudentID
LEFT JOIN Attendance AS a  ON cl.ClassID  = a.ClassID
WHERE  a.AttendanceID IS NULL;
```

**Exercise 4**
```sql
SELECT sub.SubjectName, COUNT(cl.ClassID) AS EnrolledStudents
FROM   Subjects AS sub
LEFT JOIN Classes AS cl ON sub.SubjectID = cl.SubjectID
GROUP BY sub.SubjectID, sub.SubjectName
ORDER BY EnrolledStudents DESC;
```

**Exercise 5**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName,
       sub.SubjectName,
       t.FirstName + ' ' + t.LastName AS TeacherName,
       a.AttendanceDate
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
INNER JOIN Teachers AS t   ON a.TeacherID  = t.TeacherID
WHERE  a.Status = 'Absent'
ORDER BY a.AttendanceDate;
```

**Exercise 6**
```sql
SELECT t.FirstName + ' ' + t.LastName AS TeacherName,
       COUNT(DISTINCT a.AttendanceDate) AS DistinctDates
FROM   Teachers AS t
LEFT JOIN Attendance AS a ON t.TeacherID = a.TeacherID
GROUP BY t.TeacherID, t.FirstName, t.LastName
ORDER BY DistinctDates DESC;
```

**Exercise 7**
```sql
SELECT s.FirstName + ' ' + s.LastName AS FullName,
       s.Grade,
       COUNT(DISTINCT cl.ClassID)        AS SubjectsEnrolled,
       COUNT(a.AttendanceID)             AS TotalAttendance,
       SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END) AS Absences
FROM   Students AS s
LEFT JOIN Classes    AS cl ON s.StudentID = cl.StudentID
LEFT JOIN Attendance AS a  ON cl.ClassID  = a.ClassID
GROUP BY s.StudentID, s.FirstName, s.LastName, s.Grade
ORDER BY Absences DESC;
```

**Exercise 8**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName,
       sub.SubjectName,
       latest.Status AS LatestStatus
FROM   Classes  AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
LEFT JOIN (
    SELECT a.ClassID, a.Status,
           ROW_NUMBER() OVER (PARTITION BY a.ClassID ORDER BY a.AttendanceDate DESC) AS rn
    FROM   Attendance AS a
) AS latest ON cl.ClassID = latest.ClassID AND latest.rn = 1
ORDER BY s.LastName, sub.SubjectName;
```
