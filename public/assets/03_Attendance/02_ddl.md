# Attendance Database — Worksheet 2: DDL — Creating the Database

## Learning Objectives
- Build the AttendanceDB schema using T-SQL DDL in the correct table order
- Apply IDENTITY, PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, and DEFAULT constraints
- Modify and extend the schema using ALTER TABLE
- Drop the schema safely in reverse dependency order

---

## DDL Overview

| Statement | Purpose |
|---|---|
| `CREATE DATABASE` | Creates a new database |
| `CREATE TABLE` | Defines a table with columns and constraints |
| `ALTER TABLE` | Adds, modifies, or removes columns and constraints |
| `DROP TABLE` | Permanently removes a table |
| `TRUNCATE TABLE` | Removes all rows but keeps the structure |

---

## Step 1: Creating the Database

```sql
USE master;
GO

CREATE DATABASE AttendanceDB;
GO

USE AttendanceDB;
GO
```

---

## Step 2: Creating the Tables

**Creation order (parent tables first):**
Students → Teachers → Subjects → Classes → Attendance

---

### Table 1: Students

Stores enrolled students. No FK dependencies.

```sql
CREATE TABLE Students (
    StudentID      INT           IDENTITY(1,1)    NOT NULL,
    FirstName      NVARCHAR(100)                  NOT NULL,
    LastName       NVARCHAR(100)                  NOT NULL,
    Email          NVARCHAR(200)                  NOT NULL,
    EnrollmentDate DATE          DEFAULT GETDATE() NOT NULL,
    Grade          NVARCHAR(10)                   NULL,

    CONSTRAINT PK_Students       PRIMARY KEY (StudentID),
    CONSTRAINT UQ_Students_Email UNIQUE (Email)
);
GO
```

---

### Table 2: Teachers

Stores teaching staff. No FK dependencies.

```sql
CREATE TABLE Teachers (
    TeacherID      INT           IDENTITY(1,1) NOT NULL,
    FirstName      NVARCHAR(100)               NOT NULL,
    LastName       NVARCHAR(100)               NOT NULL,
    Email          NVARCHAR(200)               NOT NULL,
    Specialization NVARCHAR(200)               NULL,

    CONSTRAINT PK_Teachers       PRIMARY KEY (TeacherID),
    CONSTRAINT UQ_Teachers_Email UNIQUE (Email)
);
GO
```

---

### Table 3: Subjects

Stores academic subjects. No FK dependencies.

```sql
CREATE TABLE Subjects (
    SubjectID   INT           IDENTITY(1,1) NOT NULL,
    SubjectName NVARCHAR(200)               NOT NULL,
    Description NVARCHAR(500)               NULL,
    Credits     INT           DEFAULT 3     NOT NULL,

    CONSTRAINT PK_Subjects      PRIMARY KEY (SubjectID),
    CONSTRAINT UQ_Subjects_Name UNIQUE (SubjectName),
    CONSTRAINT CHK_Subjects_Credits CHECK (Credits BETWEEN 1 AND 10)
);
GO
```

---

### Table 4: Classes

Records student-subject enrollments. References `Students` and `Subjects`.

```sql
CREATE TABLE Classes (
    ClassID      INT          IDENTITY(1,1) NOT NULL,
    SubjectID    INT                        NOT NULL,
    StudentID    INT                        NOT NULL,
    AcademicYear INT                        NOT NULL,
    Semester     NVARCHAR(20)               NOT NULL,

    CONSTRAINT PK_Classes         PRIMARY KEY (ClassID),
    CONSTRAINT FK_Classes_Subjects FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID),
    CONSTRAINT FK_Classes_Students FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    CONSTRAINT CHK_Classes_Year    CHECK (AcademicYear BETWEEN 2000 AND 2100),
    CONSTRAINT CHK_Classes_Sem     CHECK (Semester IN ('Fall', 'Spring', 'Summer')),
    CONSTRAINT UQ_Classes_Enrollment UNIQUE (SubjectID, StudentID, AcademicYear, Semester)
);
GO
```

> **Note:** The UNIQUE constraint on `(SubjectID, StudentID, AcademicYear, Semester)` prevents a student from being enrolled in the same subject twice in the same semester.

---

### Table 5: Attendance

Records daily attendance for each class enrollment. References `Classes` and `Teachers`.

```sql
CREATE TABLE Attendance (
    AttendanceID   INT          IDENTITY(1,1)    NOT NULL,
    ClassID        INT                           NOT NULL,
    TeacherID      INT                           NOT NULL,
    AttendanceDate DATE                          NOT NULL,
    Status         NVARCHAR(20) DEFAULT 'Present' NOT NULL,

    CONSTRAINT PK_Attendance          PRIMARY KEY (AttendanceID),
    CONSTRAINT FK_Attendance_Classes  FOREIGN KEY (ClassID)   REFERENCES Classes(ClassID),
    CONSTRAINT FK_Attendance_Teachers FOREIGN KEY (TeacherID) REFERENCES Teachers(TeacherID),
    CONSTRAINT CHK_Attendance_Status  CHECK (Status IN ('Present', 'Absent', 'Late')),
    CONSTRAINT UQ_Attendance_Day      UNIQUE (ClassID, AttendanceDate)
);
GO
```

> **Note:** The UNIQUE constraint on `(ClassID, AttendanceDate)` prevents duplicate attendance entries for the same student-subject enrollment on the same day.

---

## Step 3: Adding Foreign Keys with ALTER TABLE

```sql
-- Add FK to Classes (Subjects reference)
ALTER TABLE Classes
ADD CONSTRAINT FK_Classes_Subjects
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID);
GO

ALTER TABLE Classes
ADD CONSTRAINT FK_Classes_Students
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID);
GO

-- Add FKs to Attendance
ALTER TABLE Attendance
ADD CONSTRAINT FK_Attendance_Classes
    FOREIGN KEY (ClassID) REFERENCES Classes(ClassID);
GO

ALTER TABLE Attendance
ADD CONSTRAINT FK_Attendance_Teachers
    FOREIGN KEY (TeacherID) REFERENCES Teachers(TeacherID);
GO
```

---

## Step 4: Verifying the Schema

```sql
-- View all details of the Attendance table
EXEC sp_help 'Attendance';
GO

-- List all columns with types and nullability
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM   INFORMATION_SCHEMA.COLUMNS
WHERE  TABLE_NAME IN ('Students','Teachers','Subjects','Classes','Attendance')
ORDER  BY TABLE_NAME, ORDINAL_POSITION;
GO

-- View all constraints
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM   INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER  BY TABLE_NAME, CONSTRAINT_TYPE;
GO

-- List FK relationships
SELECT
    fk.name         AS FK_Name,
    tp.name         AS Child_Table,
    tr.name         AS Parent_Table
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id     = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id;
GO
```

---

## Step 5: Modifying Tables

```sql
-- Add a 'Notes' column to Attendance for teacher comments
ALTER TABLE Attendance
ADD Notes NVARCHAR(500) NULL;
GO

-- Add a phone column to Students
ALTER TABLE Students
ADD Phone NVARCHAR(20) NULL;
GO

-- Increase the Grade column length
ALTER TABLE Students
ALTER COLUMN Grade NVARCHAR(20) NULL;
GO

-- Add a CHECK constraint for valid email format
ALTER TABLE Teachers
ADD CONSTRAINT CHK_Teachers_Email CHECK (Email LIKE '%@%');
GO

-- Drop that constraint
ALTER TABLE Teachers
DROP CONSTRAINT CHK_Teachers_Email;
GO
```

---

## Step 6: Dropping Tables and the Database

```sql
-- Drop in reverse order (children first)
DROP TABLE IF EXISTS Attendance;
DROP TABLE IF EXISTS Classes;
DROP TABLE IF EXISTS Students;
DROP TABLE IF EXISTS Teachers;
DROP TABLE IF EXISTS Subjects;
GO

USE master;
GO
DROP DATABASE IF EXISTS AttendanceDB;
GO
```

---

## Complete Ready-to-Run Script

```sql
-- ============================================================
-- AttendanceDB — Full Creation Script
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'AttendanceDB')
BEGIN
    ALTER DATABASE AttendanceDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE AttendanceDB;
END
GO

CREATE DATABASE AttendanceDB;
GO
USE AttendanceDB;
GO

-- Students
CREATE TABLE Students (
    StudentID      INT           IDENTITY(1,1)    NOT NULL,
    FirstName      NVARCHAR(100)                  NOT NULL,
    LastName       NVARCHAR(100)                  NOT NULL,
    Email          NVARCHAR(200)                  NOT NULL,
    EnrollmentDate DATE          DEFAULT GETDATE() NOT NULL,
    Grade          NVARCHAR(10)                   NULL,
    CONSTRAINT PK_Students       PRIMARY KEY (StudentID),
    CONSTRAINT UQ_Students_Email UNIQUE (Email)
);
GO

-- Teachers
CREATE TABLE Teachers (
    TeacherID      INT           IDENTITY(1,1) NOT NULL,
    FirstName      NVARCHAR(100)               NOT NULL,
    LastName       NVARCHAR(100)               NOT NULL,
    Email          NVARCHAR(200)               NOT NULL,
    Specialization NVARCHAR(200)               NULL,
    CONSTRAINT PK_Teachers       PRIMARY KEY (TeacherID),
    CONSTRAINT UQ_Teachers_Email UNIQUE (Email)
);
GO

-- Subjects
CREATE TABLE Subjects (
    SubjectID   INT           IDENTITY(1,1) NOT NULL,
    SubjectName NVARCHAR(200)               NOT NULL,
    Description NVARCHAR(500)               NULL,
    Credits     INT           DEFAULT 3     NOT NULL,
    CONSTRAINT PK_Subjects      PRIMARY KEY (SubjectID),
    CONSTRAINT UQ_Subjects_Name UNIQUE (SubjectName),
    CONSTRAINT CHK_Subjects_Credits CHECK (Credits BETWEEN 1 AND 10)
);
GO

-- Classes
CREATE TABLE Classes (
    ClassID      INT          IDENTITY(1,1) NOT NULL,
    SubjectID    INT                        NOT NULL,
    StudentID    INT                        NOT NULL,
    AcademicYear INT                        NOT NULL,
    Semester     NVARCHAR(20)               NOT NULL,
    CONSTRAINT PK_Classes           PRIMARY KEY (ClassID),
    CONSTRAINT FK_Classes_Subjects  FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID),
    CONSTRAINT FK_Classes_Students  FOREIGN KEY (StudentID) REFERENCES Students(StudentID),
    CONSTRAINT CHK_Classes_Year     CHECK (AcademicYear BETWEEN 2000 AND 2100),
    CONSTRAINT CHK_Classes_Sem      CHECK (Semester IN ('Fall','Spring','Summer')),
    CONSTRAINT UQ_Classes_Enrollment UNIQUE (SubjectID, StudentID, AcademicYear, Semester)
);
GO

-- Attendance
CREATE TABLE Attendance (
    AttendanceID   INT          IDENTITY(1,1)     NOT NULL,
    ClassID        INT                            NOT NULL,
    TeacherID      INT                            NOT NULL,
    AttendanceDate DATE                           NOT NULL,
    Status         NVARCHAR(20) DEFAULT 'Present'  NOT NULL,
    CONSTRAINT PK_Attendance          PRIMARY KEY (AttendanceID),
    CONSTRAINT FK_Attendance_Classes  FOREIGN KEY (ClassID)   REFERENCES Classes(ClassID),
    CONSTRAINT FK_Attendance_Teachers FOREIGN KEY (TeacherID) REFERENCES Teachers(TeacherID),
    CONSTRAINT CHK_Attendance_Status  CHECK (Status IN ('Present','Absent','Late')),
    CONSTRAINT UQ_Attendance_Day      UNIQUE (ClassID, AttendanceDate)
);
GO
```

---

## Practice Exercises

**Exercise 1**
Write a `CREATE TABLE` statement for an `Exams` table: `ExamID` (auto PK), `ClassID` (FK to Classes), `TeacherID` (FK to Teachers), `ExamDate` (date, required), `Score` (decimal 5,2, must be between 0 and 100), `ExamType` (CHECK: `'Midterm'`, `'Final'`, `'Quiz'`).

**Exercise 2**
Add a `MaxAbsences` column to `Subjects` (INT, default 3, must be >= 0) using `ALTER TABLE`.

**Exercise 3**
Explain why the UNIQUE constraint `UQ_Classes_Enrollment` on `(SubjectID, StudentID, AcademicYear, Semester)` is important. What would happen without it?

**Exercise 4**
A student tries to insert a Class record where `Semester = 'Winter'`. What constraint will SQL Server enforce and what error will occur?

**Exercise 5**
Write the full DROP sequence to safely remove the entire AttendanceDB schema and database.
