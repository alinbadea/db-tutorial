# Attendance Database — Worksheet 6: SELECT — Grouping and Aggregates

## Learning Objectives
- Apply aggregate functions to summarise attendance data
- Group results by student, subject, teacher, date, and grade
- Filter groups with HAVING to highlight attendance issues
- Combine JOINs with GROUP BY to build school attendance reports

---

## Aggregate Functions

### COUNT

```sql
-- Total number of attendance records
SELECT COUNT(*) AS TotalRecords FROM Attendance;

-- Attendance records per status
SELECT Status, COUNT(*) AS Count FROM Attendance GROUP BY Status;

-- COUNT(*) vs COUNT(column) with NULL
-- AttendanceDate should never be NULL, but illustrates the concept:
SELECT
    COUNT(*)             AS TotalRows,
    COUNT(AttendanceDate) AS RowsWithDate
FROM Attendance;
```

### SUM

```sql
-- Total absences across all records
SELECT SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) AS TotalAbsences
FROM   Attendance;

-- Total credits for all subjects
SELECT SUM(Credits) AS TotalCredits FROM Subjects;
```

### AVG

```sql
-- Average credits per subject
SELECT AVG(CAST(Credits AS DECIMAL(10,2))) AS AvgCredits FROM Subjects;

-- Average number of attendance records per class (ClassID)
SELECT AVG(cnt) AS AvgSessionsPerClass
FROM (
    SELECT ClassID, COUNT(*) AS cnt
    FROM   Attendance
    GROUP BY ClassID
) AS sub;
```

### MIN and MAX

```sql
-- Earliest and most recent attendance dates
SELECT MIN(AttendanceDate) AS FirstSession, MAX(AttendanceDate) AS LastSession
FROM   Attendance;

-- Smallest and largest credit counts
SELECT MIN(Credits) AS MinCredits, MAX(Credits) AS MaxCredits FROM Subjects;

-- Earliest and latest enrollment dates
SELECT MIN(EnrollmentDate) AS FirstEnrolled, MAX(EnrollmentDate) AS LastEnrolled
FROM   Students;
```

---

## GROUP BY

### Single Column

```sql
-- Attendance count per status
SELECT Status, COUNT(*) AS Count
FROM   Attendance
GROUP BY Status
ORDER BY Count DESC;

-- Number of enrollments per subject
SELECT SubjectID, COUNT(*) AS StudentCount
FROM   Classes
GROUP BY SubjectID
ORDER BY StudentCount DESC;

-- Number of attendance records per teacher
SELECT TeacherID, COUNT(*) AS SessionsTaught
FROM   Attendance
GROUP BY TeacherID
ORDER BY SessionsTaught DESC;

-- Enrollments per academic year
SELECT AcademicYear, COUNT(*) AS EnrollmentCount
FROM   Classes
GROUP BY AcademicYear
ORDER BY AcademicYear;
```

### Multiple Columns

```sql
-- Attendance breakdown per class per status
SELECT ClassID, Status, COUNT(*) AS Count
FROM   Attendance
GROUP BY ClassID, Status
ORDER BY ClassID, Status;

-- Enrollments per subject per semester
SELECT SubjectID, Semester, COUNT(*) AS StudentCount
FROM   Classes
GROUP BY SubjectID, Semester
ORDER BY SubjectID, Semester;
```

---

## HAVING

```sql
-- Classes with more than 2 absences
SELECT ClassID, COUNT(*) AS AbsenceCount
FROM   Attendance
WHERE  Status = 'Absent'
GROUP BY ClassID
HAVING COUNT(*) > 2;

-- Subjects with 3 or more enrolled students
SELECT SubjectID, COUNT(*) AS StudentCount
FROM   Classes
GROUP BY SubjectID
HAVING COUNT(*) >= 3;

-- Teachers who have taught more than 1 session
SELECT TeacherID, COUNT(*) AS SessionCount
FROM   Attendance
GROUP BY TeacherID
HAVING COUNT(*) > 1;
```

---

## GROUP BY with JOINs

### Example 1 — Attendance summary per student with full name

```sql
SELECT
    s.FirstName + ' ' + s.LastName     AS StudentName,
    s.Grade,
    COUNT(a.AttendanceID)              AS TotalSessions,
    SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS Present,
    SUM(CASE WHEN a.Status = 'Absent'  THEN 1 ELSE 0 END) AS Absent,
    SUM(CASE WHEN a.Status = 'Late'    THEN 1 ELSE 0 END) AS Late
FROM   Students AS s
INNER JOIN Classes    AS cl ON s.StudentID = cl.StudentID
INNER JOIN Attendance AS a  ON cl.ClassID  = a.ClassID
GROUP BY s.StudentID, s.FirstName, s.LastName, s.Grade
ORDER BY Absent DESC, s.LastName;
```

### Example 2 — Subject attendance rates

```sql
SELECT
    sub.SubjectName,
    COUNT(a.AttendanceID)              AS TotalSessions,
    SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS Present,
    SUM(CASE WHEN a.Status = 'Absent'  THEN 1 ELSE 0 END) AS Absent,
    CAST(
        100.0 * SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END)
        / NULLIF(COUNT(a.AttendanceID), 0)
    AS DECIMAL(5,2))                   AS AttendanceRatePct
FROM   Subjects AS sub
INNER JOIN Classes    AS cl ON sub.SubjectID = cl.SubjectID
INNER JOIN Attendance AS a  ON cl.ClassID    = a.ClassID
GROUP BY sub.SubjectID, sub.SubjectName
ORDER BY AttendanceRatePct ASC;
```

### Example 3 — Teacher workload summary

```sql
SELECT
    t.FirstName + ' ' + t.LastName   AS TeacherName,
    t.Specialization,
    COUNT(DISTINCT a.AttendanceDate) AS DistinctDaysTaught,
    COUNT(a.AttendanceID)            AS TotalStudentSessions,
    COUNT(DISTINCT cl.SubjectID)     AS SubjectsTaught
FROM   Teachers AS t
INNER JOIN Attendance AS a  ON t.TeacherID  = a.TeacherID
INNER JOIN Classes    AS cl ON a.ClassID    = cl.ClassID
GROUP BY t.TeacherID, t.FirstName, t.LastName, t.Specialization
ORDER BY TotalStudentSessions DESC;
```

### Example 4 — Flagging at-risk students (HAVING + JOINs)

Students whose absence count for any subject exceeds 2:

```sql
SELECT
    s.FirstName + ' ' + s.LastName  AS StudentName,
    sub.SubjectName,
    COUNT(*) AS AbsenceCount
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  a.Status = 'Absent'
GROUP BY s.StudentID, s.FirstName, s.LastName, sub.SubjectID, sub.SubjectName
HAVING COUNT(*) >= 2
ORDER BY AbsenceCount DESC;
```

---

## NULL Values in Aggregates

```sql
-- AVG and SUM ignore NULLs
-- Grade is nullable — AVG would fail on NVARCHAR; use COUNT instead
SELECT
    COUNT(Grade)  AS StudentsWithGrade,
    COUNT(*)      AS TotalStudents
FROM Students;

-- ISNULL to substitute a default value before aggregating
SELECT
    SUM(ISNULL(Credits, 0)) AS TotalCreditsIncludingNulls
FROM Subjects;
```

---

## Practice Exercises

**Exercise 1 (Easy)**
Count the number of attendance records for each `Status` value. Show `Status` and `Count`.

**Exercise 2 (Easy)**
Show the total number of students enrolled in each subject (grouped by `SubjectID`). Sort by count descending.

**Exercise 3 (Easy)**
Find the minimum and maximum enrollment dates in `Students`.

**Exercise 4 (Medium)**
Show each subject name alongside the number of students enrolled in it for `AcademicYear = 2024`. Join `Subjects` and `Classes`.

**Exercise 5 (Medium)**
List all classes (`ClassID`) that have at least 3 attendance records. Show `ClassID` and the count.

**Exercise 6 (Medium)**
Show each teacher's name and the number of distinct students they have taught (via Attendance → Classes → Students). Sort by student count descending.

**Exercise 7 (Hard)**
For each grade (e.g., 10A, 10B), show the total number of Present, Absent, and Late records. Join through Students → Classes → Attendance.

**Exercise 8 (Hard)**
Calculate the attendance rate (Present / Total × 100) per subject. Show subject name, total sessions, total present, and attendance rate as a percentage. Use `NULLIF` to avoid division by zero.

**Exercise 9 (Hard)**
For each student, show their name, grade, and their absence rate per subject (absences / total sessions × 100). Only show student-subject combinations where the absence rate is above 20%.

**Exercise 10 (Hard)**
Show a daily attendance summary: for each date, show how many students were Present, Absent, and Late. Include only dates that had at least 3 attendance records.

---

## Answers

**Exercise 1**
```sql
SELECT Status, COUNT(*) AS Count FROM Attendance GROUP BY Status ORDER BY Count DESC;
```

**Exercise 2**
```sql
SELECT SubjectID, COUNT(*) AS StudentCount FROM Classes GROUP BY SubjectID ORDER BY StudentCount DESC;
```

**Exercise 3**
```sql
SELECT MIN(EnrollmentDate) AS MinDate, MAX(EnrollmentDate) AS MaxDate FROM Students;
```

**Exercise 4**
```sql
SELECT sub.SubjectName, COUNT(cl.ClassID) AS StudentCount
FROM   Subjects AS sub
INNER JOIN Classes AS cl ON sub.SubjectID = cl.SubjectID
WHERE  cl.AcademicYear = 2024
GROUP BY sub.SubjectID, sub.SubjectName
ORDER BY StudentCount DESC;
```

**Exercise 5**
```sql
SELECT ClassID, COUNT(*) AS AttendanceCount
FROM   Attendance
GROUP BY ClassID
HAVING COUNT(*) >= 3;
```

**Exercise 6**
```sql
SELECT t.FirstName + ' ' + t.LastName AS TeacherName,
       COUNT(DISTINCT cl.StudentID) AS DistinctStudents
FROM   Teachers AS t
INNER JOIN Attendance AS a  ON t.TeacherID  = a.TeacherID
INNER JOIN Classes    AS cl ON a.ClassID    = cl.ClassID
GROUP BY t.TeacherID, t.FirstName, t.LastName
ORDER BY DistinctStudents DESC;
```

**Exercise 7**
```sql
SELECT s.Grade,
       SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS Present,
       SUM(CASE WHEN a.Status = 'Absent'  THEN 1 ELSE 0 END) AS Absent,
       SUM(CASE WHEN a.Status = 'Late'    THEN 1 ELSE 0 END) AS Late
FROM   Students AS s
INNER JOIN Classes    AS cl ON s.StudentID = cl.StudentID
INNER JOIN Attendance AS a  ON cl.ClassID  = a.ClassID
GROUP BY s.Grade
ORDER BY s.Grade;
```

**Exercise 8**
```sql
SELECT sub.SubjectName,
       COUNT(a.AttendanceID) AS TotalSessions,
       SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS TotalPresent,
       CAST(100.0 * SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(a.AttendanceID), 0) AS DECIMAL(5,2)) AS AttendanceRate
FROM   Subjects AS sub
INNER JOIN Classes    AS cl ON sub.SubjectID = cl.SubjectID
INNER JOIN Attendance AS a  ON cl.ClassID    = a.ClassID
GROUP BY sub.SubjectID, sub.SubjectName
ORDER BY AttendanceRate ASC;
```

**Exercise 9**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName, s.Grade,
       sub.SubjectName,
       CAST(100.0 * SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END)
            / NULLIF(COUNT(a.AttendanceID), 0) AS DECIMAL(5,2)) AS AbsenceRate
FROM   Students AS s
INNER JOIN Classes    AS cl  ON s.StudentID  = cl.StudentID
INNER JOIN Subjects   AS sub ON cl.SubjectID = sub.SubjectID
INNER JOIN Attendance AS a   ON cl.ClassID   = a.ClassID
GROUP BY s.StudentID, s.FirstName, s.LastName, s.Grade, sub.SubjectID, sub.SubjectName
HAVING 100.0 * SUM(CASE WHEN a.Status = 'Absent' THEN 1 ELSE 0 END)
       / NULLIF(COUNT(a.AttendanceID), 0) > 20
ORDER BY AbsenceRate DESC;
```

**Exercise 10**
```sql
SELECT a.AttendanceDate,
       SUM(CASE WHEN a.Status = 'Present' THEN 1 ELSE 0 END) AS Present,
       SUM(CASE WHEN a.Status = 'Absent'  THEN 1 ELSE 0 END) AS Absent,
       SUM(CASE WHEN a.Status = 'Late'    THEN 1 ELSE 0 END) AS Late,
       COUNT(*) AS Total
FROM   Attendance AS a
GROUP BY a.AttendanceDate
HAVING COUNT(*) >= 3
ORDER BY a.AttendanceDate;
```
