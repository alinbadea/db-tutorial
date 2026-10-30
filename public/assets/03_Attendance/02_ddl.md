# Baza de date Attendance — Fișa de lucru 2: DDL — Crearea bazei de date

## Obiective de învățare
- Construirea schemei AttendanceDB folosind DDL T-SQL, în ordinea corectă a tabelelor
- Aplicarea constrângerilor IDENTITY, PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK și DEFAULT
- Modificarea și extinderea schemei folosind ALTER TABLE
- Ștergerea în siguranță a schemei, în ordinea inversă a dependențelor

---

## Prezentare generală DDL

| Instrucțiune | Scop |
|---|---|
| `CREATE DATABASE` | Creează o bază de date nouă |
| `CREATE TABLE` | Definește un tabel, cu coloane și constrângeri |
| `ALTER TABLE` | Adaugă, modifică sau elimină coloane și constrângeri |
| `DROP TABLE` | Elimină definitiv un tabel |
| `TRUNCATE TABLE` | Elimină toate rândurile, dar păstrează structura |

---

## Pasul 1: Crearea bazei de date

```sql
USE master;
GO

CREATE DATABASE AttendanceDB;
GO

USE AttendanceDB;
GO
```

---

## Pasul 2: Crearea tabelelor

**Ordinea de creare (mai întâi tabelele părinte):**
Students → Teachers → Subjects → Classes → Attendance

---

### Tabelul 1: Students

Stochează elevii înscriși. Fără dependențe FK.

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

### Tabelul 2: Teachers

Stochează personalul didactic. Fără dependențe FK.

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

### Tabelul 3: Subjects

Stochează materiile de studiu. Fără dependențe FK.

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

### Tabelul 4: Classes

Înregistrează înscrierile elevilor la materii. Referă `Students` și `Subjects`.

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

> **Notă:** Constrângerea UNIQUE pe `(SubjectID, StudentID, AcademicYear, Semester)` împiedică înscrierea unui elev de două ori la aceeași materie în același semestru.

---

### Tabelul 5: Attendance

Înregistrează prezența zilnică pentru fiecare înscriere. Referă `Classes` și `Teachers`.

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

> **Notă:** Constrângerea UNIQUE pe `(ClassID, AttendanceDate)` împiedică înregistrările de prezență duplicate pentru aceeași înscriere elev-materie în aceeași zi.

---

## Pasul 3: Adăugarea cheilor străine cu ALTER TABLE

```sql
-- Adăugăm FK în Classes (referința către Subjects)
ALTER TABLE Classes
ADD CONSTRAINT FK_Classes_Subjects
    FOREIGN KEY (SubjectID) REFERENCES Subjects(SubjectID);
GO

ALTER TABLE Classes
ADD CONSTRAINT FK_Classes_Students
    FOREIGN KEY (StudentID) REFERENCES Students(StudentID);
GO

-- Adăugăm FK-urile în Attendance
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

## Pasul 4: Verificarea schemei

```sql
-- Vizualizăm toate detaliile tabelului Attendance
EXEC sp_help 'Attendance';
GO

-- Listăm toate coloanele, cu tipurile lor și dacă acceptă NULL
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM   INFORMATION_SCHEMA.COLUMNS
WHERE  TABLE_NAME IN ('Students','Teachers','Subjects','Classes','Attendance')
ORDER  BY TABLE_NAME, ORDINAL_POSITION;
GO

-- Vizualizăm toate constrângerile
SELECT TABLE_NAME, CONSTRAINT_NAME, CONSTRAINT_TYPE
FROM   INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER  BY TABLE_NAME, CONSTRAINT_TYPE;
GO

-- Listăm relațiile FK
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

## Pasul 5: Modificarea tabelelor

```sql
-- Adăugăm o coloană 'Notes' în Attendance pentru comentariile profesorilor
ALTER TABLE Attendance
ADD Notes NVARCHAR(500) NULL;
GO

-- Adăugăm o coloană pentru telefon în Students
ALTER TABLE Students
ADD Phone NVARCHAR(20) NULL;
GO

-- Mărim lungimea coloanei Grade
ALTER TABLE Students
ALTER COLUMN Grade NVARCHAR(20) NULL;
GO

-- Adăugăm o constrângere CHECK pentru un format de email valid
ALTER TABLE Teachers
ADD CONSTRAINT CHK_Teachers_Email CHECK (Email LIKE '%@%');
GO

-- Ștergem acea constrângere
ALTER TABLE Teachers
DROP CONSTRAINT CHK_Teachers_Email;
GO
```

---

## Pasul 6: Ștergerea tabelelor și a bazei de date

```sql
-- Ștergem în ordine inversă (mai întâi tabelele copil)
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

## Script complet, gata de rulat

```sql
-- ============================================================
-- AttendanceDB — Script complet de creare
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

## Exerciții practice

**Exercițiul 1**
Scrie o instrucțiune `CREATE TABLE` pentru un tabel `Exams`: `ExamID` (PK auto-incrementat), `ClassID` (FK către Classes), `TeacherID` (FK către Teachers), `ExamDate` (dată, obligatorie), `Score` (decimal 5,2, obligatoriu între 0 și 100), `ExamType` (CHECK: `'Midterm'`, `'Final'`, `'Quiz'`).

**Exercițiul 2**
Adaugă în `Subjects`, folosind `ALTER TABLE`, o coloană `MaxAbsences` (INT, implicit 3, obligatoriu >= 0).

**Exercițiul 3**
Explică de ce este importantă constrângerea UNIQUE `UQ_Classes_Enrollment` pe `(SubjectID, StudentID, AcademicYear, Semester)`. Ce s-ar întâmpla fără ea?

**Exercițiul 4**
Cineva încearcă să insereze în Classes o înregistrare cu `Semester = 'Winter'`. Ce constrângere va aplica SQL Server și ce eroare va apărea?

**Exercițiul 5**
Scrie secvența completă de DROP pentru a elimina în siguranță întreaga schemă AttendanceDB și baza de date.
