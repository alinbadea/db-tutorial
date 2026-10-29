# Attendance Database — Worksheet 4: SELECT — Basic Queries

## Learning Objectives
- Query individual Attendance database tables with SELECT
- Filter records with WHERE using various operators suited to attendance data
- Sort and limit results
- Use built-in date and string functions in the context of school attendance

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
SELECT * FROM Students;
SELECT * FROM Classes;
SELECT * FROM Attendance;
```

---

## 2. Selecting Specific Columns

```sql
-- Student roster
SELECT StudentID, FirstName, LastName, Email, Grade
FROM   Students;

-- Subject catalogue
SELECT SubjectID, SubjectName, Credits
FROM   Subjects;

-- Attendance log
SELECT AttendanceID, ClassID, TeacherID, AttendanceDate, Status
FROM   Attendance;
```

---

## 3. Column Aliases

```sql
SELECT
    FirstName + ' ' + LastName  AS StudentName,
    Email                       AS ContactEmail,
    Grade                       AS Class
FROM Students;

SELECT
    SubjectName                 AS Subject,
    Credits                     AS CreditHours,
    Credits * 15                AS TotalHoursPerSemester
FROM Subjects;
```

---

## 4. Computed Columns

```sql
-- Days since a student enrolled
SELECT
    FirstName + ' ' + LastName AS StudentName,
    EnrollmentDate,
    DATEDIFF(DAY, EnrollmentDate, GETDATE()) AS DaysEnrolled
FROM Students;

-- Day of the week for each attendance record
SELECT
    AttendanceID,
    AttendanceDate,
    DATENAME(WEEKDAY, AttendanceDate) AS DayOfWeek,
    Status
FROM Attendance;
```

---

## 5. Filtering with WHERE

### Equality and Inequality

```sql
-- Students in grade 10A
SELECT FirstName, LastName, Grade FROM Students WHERE Grade = '10A';

-- Attendance records that are NOT 'Present'
SELECT AttendanceID, ClassID, Status FROM Attendance WHERE Status <> 'Present';

-- Subjects with more than 3 credits
SELECT SubjectName, Credits FROM Subjects WHERE Credits > 3;
```

### Comparison Operators

```sql
-- Students who enrolled after 2022-09-01
SELECT FirstName, LastName, EnrollmentDate
FROM   Students
WHERE  EnrollmentDate > '2022-09-01';

-- Attendance on or after a specific date
SELECT AttendanceID, AttendanceDate, Status
FROM   Attendance
WHERE  AttendanceDate >= '2024-09-05';

-- Subjects with 3 or fewer credits
SELECT SubjectName, Credits FROM Subjects WHERE Credits <= 3;
```

### BETWEEN … AND

```sql
-- Students who enrolled between September 2022 and September 2023
SELECT FirstName, LastName, EnrollmentDate
FROM   Students
WHERE  EnrollmentDate BETWEEN '2022-09-01' AND '2023-08-31';

-- Attendance records from the first week of September 2024
SELECT AttendanceID, ClassID, AttendanceDate, Status
FROM   Attendance
WHERE  AttendanceDate BETWEEN '2024-09-01' AND '2024-09-07';

-- Subjects with 2 to 4 credits
SELECT SubjectName, Credits FROM Subjects WHERE Credits BETWEEN 2 AND 4;
```

### IN

```sql
-- Attendance for specific statuses
SELECT AttendanceID, ClassID, Status
FROM   Attendance
WHERE  Status IN ('Absent', 'Late');

-- Students in grades 10A or 10B
SELECT FirstName, LastName, Grade
FROM   Students
WHERE  Grade IN ('10A', '10B');

-- Attendance records for specific classes
SELECT AttendanceID, ClassID, AttendanceDate
FROM   Attendance
WHERE  ClassID IN (1, 2, 3);
```

### LIKE

```sql
-- Teachers whose specialization starts with 'Math'
SELECT FirstName, LastName, Specialization
FROM   Teachers
WHERE  Specialization LIKE 'Math%';

-- Students whose last name starts with 'P'
SELECT FirstName, LastName FROM Students WHERE LastName LIKE 'P%';

-- Teachers with a school email
SELECT FirstName, LastName, Email
FROM   Teachers
WHERE  Email LIKE '%@school.ro';

-- Subjects containing 'y' in their name
SELECT SubjectName FROM Subjects WHERE SubjectName LIKE '%y%';
```

### IS NULL / IS NOT NULL

```sql
-- Students with no grade assigned
SELECT FirstName, LastName FROM Students WHERE Grade IS NULL;

-- Students who have a grade assigned
SELECT FirstName, LastName, Grade FROM Students WHERE Grade IS NOT NULL;

-- Teachers with no specialization recorded
SELECT FirstName, LastName FROM Teachers WHERE Specialization IS NULL;
```

---

## 6. Combining Conditions

```sql
-- Absent or Late attendance from September 3, 2024
SELECT AttendanceID, ClassID, Status
FROM   Attendance
WHERE  AttendanceDate = '2024-09-03'
AND    Status IN ('Absent', 'Late');

-- Students in grade 10A or 11A
SELECT FirstName, LastName, Grade
FROM   Students
WHERE  Grade = '10A' OR Grade = '11A';

-- Classes in Fall 2024 for a specific subject
SELECT ClassID, StudentID, AcademicYear, Semester
FROM   Classes
WHERE  SubjectID = 1
AND    AcademicYear = 2024
AND    Semester = 'Fall';
```

---

## 7. Sorting with ORDER BY

```sql
-- Students sorted alphabetically by last name
SELECT FirstName, LastName, Grade FROM Students ORDER BY LastName ASC;

-- Attendance sorted by date descending (most recent first)
SELECT AttendanceID, AttendanceDate, Status FROM Attendance ORDER BY AttendanceDate DESC;

-- Subjects sorted by credits (most to least), then alphabetically
SELECT SubjectName, Credits FROM Subjects ORDER BY Credits DESC, SubjectName ASC;

-- Classes sorted by academic year and semester
SELECT ClassID, StudentID, SubjectID, AcademicYear, Semester
FROM   Classes
ORDER BY AcademicYear DESC, Semester ASC;
```

---

## 8. Limiting Results with TOP

```sql
-- The 3 most recently enrolled students
SELECT TOP 3 FirstName, LastName, EnrollmentDate
FROM   Students
ORDER BY EnrollmentDate DESC;

-- The most recent attendance record
SELECT TOP 1 AttendanceID, ClassID, AttendanceDate, Status
FROM   Attendance
ORDER BY AttendanceDate DESC;

-- Top 50% of subjects by credit value
SELECT TOP 50 PERCENT SubjectName, Credits
FROM   Subjects
ORDER BY Credits DESC;
```

---

## 9. DISTINCT

```sql
-- What grades are represented in the student body?
SELECT DISTINCT Grade FROM Students WHERE Grade IS NOT NULL ORDER BY Grade;

-- Which teacher IDs appear in attendance records?
SELECT DISTINCT TeacherID FROM Attendance ORDER BY TeacherID;

-- Which attendance statuses are in use?
SELECT DISTINCT Status FROM Attendance;

-- How many distinct students have at least one attendance record?
SELECT COUNT(DISTINCT ClassID) AS ClassesWithAttendance FROM Attendance;
```

---

## 10. Useful Built-in Functions

```sql
-- String functions
SELECT
    UPPER(FirstName + ' ' + LastName)   AS UpperName,
    LEN(Email)                          AS EmailLength,
    LEFT(Grade, 2)                      AS GradeYear
FROM Students;

-- Date functions on attendance
SELECT
    AttendanceDate,
    YEAR(AttendanceDate)                AS Year,
    MONTH(AttendanceDate)               AS Month,
    DAY(AttendanceDate)                 AS Day,
    DATENAME(WEEKDAY, AttendanceDate)   AS Weekday,
    DATENAME(MONTH, AttendanceDate)     AS MonthName
FROM Attendance;

-- NULL handling
SELECT
    FirstName,
    LastName,
    ISNULL(Grade, 'Unassigned')         AS GradeDisplay,
    ISNULL(Specialization, 'General')   AS SpecializationDisplay
FROM Students
CROSS JOIN Teachers;  -- (illustrative only)
```

---

## Practice Exercises

**Exercise 1 (Easy)**
List all students in grade `'10B'`. Show their full name and email.

**Exercise 2 (Easy)**
Show all attendance records with `Status = 'Absent'`. Display `AttendanceID`, `ClassID`, `AttendanceDate`.

**Exercise 3 (Easy)**
List all subjects with 3 or more credits, sorted by credits descending.

**Exercise 4 (Medium)**
Find all students who enrolled between `'2022-09-01'` and `'2023-08-31'`. Show full name and enrollment date.

**Exercise 5 (Medium)**
Show attendance records from September 4 and 5, 2024. Include `AttendanceID`, `ClassID`, `AttendanceDate`, and `Status`. Sort by date then ClassID.

**Exercise 6 (Medium)**
Find all teachers whose email ends in `'@school.ro'` and whose specialization starts with `'M'`.

**Exercise 7 (Medium)**
Show the distinct list of grades present in the `Students` table.

**Exercise 8 (Medium)**
Show the 3 most recently enrolled students (most recent first). Display full name and enrollment date.

**Exercise 9 (Hard)**
Show each attendance record with `AttendanceID`, `ClassID`, `AttendanceDate`, `Status`, the day-of-week name, and a column `IsWeekend` that shows 1 if the attendance falls on Saturday or Sunday (use `DATEPART(WEEKDAY, ...)`), otherwise 0.

**Exercise 10 (Hard)**
Show classes from Fall 2024 where the `StudentID` is in a grade starting with `'10'`. (Hint: join Classes to Students with a subquery or IN clause.)

---

## Answers

1. `SELECT FirstName + ' ' + LastName AS FullName, Email FROM Students WHERE Grade = '10B';`
2. `SELECT AttendanceID, ClassID, AttendanceDate FROM Attendance WHERE Status = 'Absent';`
3. `SELECT SubjectName, Credits FROM Subjects WHERE Credits >= 3 ORDER BY Credits DESC;`
4. `SELECT FirstName + ' ' + LastName AS FullName, EnrollmentDate FROM Students WHERE EnrollmentDate BETWEEN '2022-09-01' AND '2023-08-31';`
5. `SELECT AttendanceID, ClassID, AttendanceDate, Status FROM Attendance WHERE AttendanceDate BETWEEN '2024-09-04' AND '2024-09-05' ORDER BY AttendanceDate, ClassID;`
6. `SELECT FirstName, LastName, Email, Specialization FROM Teachers WHERE Email LIKE '%@school.ro' AND Specialization LIKE 'M%';`
7. `SELECT DISTINCT Grade FROM Students WHERE Grade IS NOT NULL ORDER BY Grade;`
8. `SELECT TOP 3 FirstName + ' ' + LastName AS FullName, EnrollmentDate FROM Students ORDER BY EnrollmentDate DESC;`
9. `SELECT AttendanceID, ClassID, AttendanceDate, Status, DATENAME(WEEKDAY, AttendanceDate) AS DayName, CASE WHEN DATEPART(WEEKDAY, AttendanceDate) IN (1,7) THEN 1 ELSE 0 END AS IsWeekend FROM Attendance;`
10. `SELECT cl.ClassID, cl.StudentID, cl.SubjectID, cl.Semester FROM Classes cl WHERE cl.AcademicYear = 2024 AND cl.Semester = 'Fall' AND cl.StudentID IN (SELECT StudentID FROM Students WHERE Grade LIKE '10%');`
