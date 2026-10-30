# Baza de date Attendance — Fișa de lucru 3: Instrucțiuni INSERT

## Obiective de învățare
- Scrierea instrucțiunilor INSERT pentru toate cele 5 tabele ale bazei de date Attendance
- Popularea tabelelor în ordinea corectă, care respectă cheile străine
- Folosirea INSERT...SELECT și OUTPUT pentru scenarii avansate
- Lucrul corect cu coloanele IDENTITY și cu inserările pe mai multe rânduri

---

## Sintaxa INSERT

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

---

## Metoda 1: INSERT fără listă de coloane

```sql
-- Inserăm un elev fără a specifica coloanele
-- Valorile trebuie să respecte ordinea coloanelor, fără coloana IDENTITY
INSERT INTO Students
VALUES ('Maria', 'Popescu', 'maria@school.ro', '2023-09-01', '10A');
```

> **Atenție:** Dacă o coloană este adăugată sau reordonată, acest INSERT va eșua sau va insera date greșite. Folosește întotdeauna forma cu listă de coloane în aplicațiile reale.

---

## Metoda 2: INSERT cu listă de coloane (bună practică)

```sql
INSERT INTO Students (FirstName, LastName, Email, EnrollmentDate, Grade)
VALUES ('Maria', 'Popescu', 'maria@school.ro', '2023-09-01', '10A');

-- Omitem coloanele care acceptă NULL — primesc automat NULL
INSERT INTO Students (FirstName, LastName, Email)
VALUES ('Anonymous', 'Student', 'anon@school.ro');
```

---

## Metoda 3: Inserarea mai multor rânduri într-o singură instrucțiune

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

## Metoda 4: INSERT … SELECT

Copiem date dintr-o altă sursă:

```sql
-- Înscriem toți elevii din clasa 10A la Mathematics (SubjectID = 1) pentru Fall 2024
INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
SELECT 1, StudentID, 2024, 'Fall'
FROM   Students
WHERE  Grade = '10A';

-- Copiem prezența de la o dată la alta (oră reprogramată)
INSERT INTO Attendance (ClassID, TeacherID, AttendanceDate, Status)
SELECT ClassID, TeacherID, '2024-09-10', 'Present'
FROM   Attendance
WHERE  AttendanceDate = '2024-09-03'
AND    Status = 'Present';
```

Folosind un CTE:

```sql
-- Înscriem toți elevii la toate materiile pentru Fall 2024
WITH Enrollments AS (
    SELECT s.StudentID, sub.SubjectID
    FROM   Students AS s
    CROSS JOIN Subjects AS sub   -- toate combinațiile
)
INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
SELECT SubjectID, StudentID, 2024, 'Fall'
FROM   Enrollments;
```

---

## Coloane IDENTITY

```sql
-- Corect: StudentID este omis — SQL Server îl generează
INSERT INTO Students (FirstName, LastName, Email, Grade)
VALUES ('Andrei', 'Constantin', 'andrei@school.ro', '10B');

-- Obținem ID-ul generat
SELECT SCOPE_IDENTITY() AS NewStudentID;

-- Sau obținem valoarea IDENTITY curentă pentru un anumit tabel
SELECT IDENT_CURRENT('Students') AS LatestStudentID;
```

---

## SET IDENTITY_INSERT

Se folosește când trebuie să inserezi un anumit ID (de ex., la migrarea datelor):

```sql
SET IDENTITY_INSERT Students ON;

INSERT INTO Students (StudentID, FirstName, LastName, Email, Grade)
VALUES (100, 'Test', 'Student', 'test@school.ro', '11A');

SET IDENTITY_INSERT Students OFF;
```

---

## INSERT cu clauza OUTPUT

```sql
-- Inserăm o înscriere nouă și capturăm valoarea ClassID generată
DECLARE @NewClasses TABLE (ClassID INT, StudentID INT, SubjectID INT);

INSERT INTO Classes (SubjectID, StudentID, AcademicYear, Semester)
OUTPUT INSERTED.ClassID, INSERTED.StudentID, INSERTED.SubjectID
INTO   @NewClasses
VALUES (2, 1, 2024, 'Fall'),
       (2, 2, 2024, 'Fall');

SELECT * FROM @NewClasses;
```

---

## Script complet cu date de exemplu

Inserează într-o ordine sigură față de cheile străine: Students → Teachers → Subjects → Classes → Attendance.

```sql
USE AttendanceDB;
GO

-- ===========================
-- Students (8 rânduri)
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
-- Teachers (5 rânduri)
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
-- Subjects (5 rânduri)
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
-- Classes (10 înscrieri)
-- ===========================
-- Elevii din clasa 10A se înscriu la Mathematics și Physics
-- Elevii din clasa 10B se înscriu la Mathematics și Literature
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
-- Attendance (12 înregistrări)
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
    (1, 1, '2024-09-05', 'Present'),  -- Maria/Math (a doua oră)
    (2, 1, '2024-09-05', 'Absent'),   -- Ion/Math
    (9, 4, '2024-09-05', 'Present'),  -- Elena/Chemistry
    (10,5, '2024-09-05', 'Present');  -- Andrei/History
GO
```

---

## Exerciții practice

**Exercițiul 1**
Inserează un elev nou: `'Raluca Georgescu'`, email `'raluca@school.ro'`, clasa `'10A'`, înscris astăzi. Obține valoarea `StudentID` generată.

**Exercițiul 2**
Într-un singur INSERT, adaugă 3 profesori noi: un profesor de Biology, unul de English și unul de Art (folosește nume și emailuri realiste).

**Exercițiul 3**
Folosind `INSERT ... SELECT`, înscrie toți elevii din clasa 10A (cei cu `Grade = '10A'`) la materia Chemistry (`SubjectID = 4`) pentru Fall 2024.

**Exercițiul 4**
Folosind `INSERT` cu `OUTPUT`, adaugă două înregistrări de prezență pentru `ClassID = 9` și `ClassID = 10` pe `'2024-09-06'` (ambele Present, cu `TeacherID` = 4, respectiv 5). Capturează valorile `AttendanceID` generate.

**Exercițiul 5**
Scrie un `INSERT ... SELECT` care creează înregistrări de prezență pentru toate înscrierile pe `'2024-09-10'`, folosind profesorul din cea mai recentă înregistrare de prezență a fiecăreia. (Indiciu: unește Classes cu cel mai recent rând din Attendance pentru fiecare înscriere.)
