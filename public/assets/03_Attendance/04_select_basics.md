# Baza de date Attendance — Fișa de lucru 4: SELECT — Interogări de bază

## Obiective de învățare
- Interogarea tabelelor individuale ale bazei de date Attendance cu SELECT
- Filtrarea înregistrărilor cu WHERE, folosind diverși operatori potriviți pentru datele de prezență
- Sortarea și limitarea rezultatelor
- Folosirea funcțiilor predefinite pentru date calendaristice și șiruri de caractere în contextul prezenței școlare

---

## Sintaxa SELECT

```sql
SELECT [TOP n] [DISTINCT] column_list
FROM   table_name
WHERE  condition
ORDER BY column [ASC | DESC];
```

---

## 1. Selectarea tuturor coloanelor

```sql
SELECT * FROM Students;
SELECT * FROM Classes;
SELECT * FROM Attendance;
```

---

## 2. Selectarea anumitor coloane

```sql
-- Lista elevilor
SELECT StudentID, FirstName, LastName, Email, Grade
FROM   Students;

-- Catalogul materiilor
SELECT SubjectID, SubjectName, Credits
FROM   Subjects;

-- Registrul de prezență
SELECT AttendanceID, ClassID, TeacherID, AttendanceDate, Status
FROM   Attendance;
```

---

## 3. Aliasuri de coloane

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

## 4. Coloane calculate

```sql
-- Zilele trecute de la înscrierea unui elev
SELECT
    FirstName + ' ' + LastName AS StudentName,
    EnrollmentDate,
    DATEDIFF(DAY, EnrollmentDate, GETDATE()) AS DaysEnrolled
FROM Students;

-- Ziua săptămânii pentru fiecare înregistrare de prezență
SELECT
    AttendanceID,
    AttendanceDate,
    DATENAME(WEEKDAY, AttendanceDate) AS DayOfWeek,
    Status
FROM Attendance;
```

---

## 5. Filtrarea cu WHERE

### Egalitate și inegalitate

```sql
-- Elevii din clasa 10A
SELECT FirstName, LastName, Grade FROM Students WHERE Grade = '10A';

-- Înregistrările de prezență care NU sunt 'Present'
SELECT AttendanceID, ClassID, Status FROM Attendance WHERE Status <> 'Present';

-- Materiile cu mai mult de 3 credite
SELECT SubjectName, Credits FROM Subjects WHERE Credits > 3;
```

### Operatori de comparație

```sql
-- Elevii înscriși după 2022-09-01
SELECT FirstName, LastName, EnrollmentDate
FROM   Students
WHERE  EnrollmentDate > '2022-09-01';

-- Prezența la o anumită dată sau după aceasta
SELECT AttendanceID, AttendanceDate, Status
FROM   Attendance
WHERE  AttendanceDate >= '2024-09-05';

-- Materiile cu 3 credite sau mai puține
SELECT SubjectName, Credits FROM Subjects WHERE Credits <= 3;
```

### BETWEEN … AND

```sql
-- Elevii înscriși între septembrie 2022 și septembrie 2023
SELECT FirstName, LastName, EnrollmentDate
FROM   Students
WHERE  EnrollmentDate BETWEEN '2022-09-01' AND '2023-08-31';

-- Înregistrările de prezență din prima săptămână a lunii septembrie 2024
SELECT AttendanceID, ClassID, AttendanceDate, Status
FROM   Attendance
WHERE  AttendanceDate BETWEEN '2024-09-01' AND '2024-09-07';

-- Materiile cu 2 până la 4 credite
SELECT SubjectName, Credits FROM Subjects WHERE Credits BETWEEN 2 AND 4;
```

### IN

```sql
-- Prezența cu anumite statusuri
SELECT AttendanceID, ClassID, Status
FROM   Attendance
WHERE  Status IN ('Absent', 'Late');

-- Elevii din clasele 10A sau 10B
SELECT FirstName, LastName, Grade
FROM   Students
WHERE  Grade IN ('10A', '10B');

-- Înregistrările de prezență pentru anumite înscrieri (ClassID)
SELECT AttendanceID, ClassID, AttendanceDate
FROM   Attendance
WHERE  ClassID IN (1, 2, 3);
```

### LIKE

```sql
-- Profesorii a căror specializare începe cu 'Math'
SELECT FirstName, LastName, Specialization
FROM   Teachers
WHERE  Specialization LIKE 'Math%';

-- Elevii al căror nume de familie începe cu 'P'
SELECT FirstName, LastName FROM Students WHERE LastName LIKE 'P%';

-- Profesorii cu email de la școală
SELECT FirstName, LastName, Email
FROM   Teachers
WHERE  Email LIKE '%@school.ro';

-- Materiile care conțin 'y' în nume
SELECT SubjectName FROM Subjects WHERE SubjectName LIKE '%y%';
```

### IS NULL / IS NOT NULL

```sql
-- Elevii fără clasă atribuită
SELECT FirstName, LastName FROM Students WHERE Grade IS NULL;

-- Elevii care au o clasă atribuită
SELECT FirstName, LastName, Grade FROM Students WHERE Grade IS NOT NULL;

-- Profesorii fără specializare înregistrată
SELECT FirstName, LastName FROM Teachers WHERE Specialization IS NULL;
```

---

## 6. Combinarea condițiilor

```sql
-- Prezența Absent sau Late din 3 septembrie 2024
SELECT AttendanceID, ClassID, Status
FROM   Attendance
WHERE  AttendanceDate = '2024-09-03'
AND    Status IN ('Absent', 'Late');

-- Elevii din clasa 10A sau 11A
SELECT FirstName, LastName, Grade
FROM   Students
WHERE  Grade = '10A' OR Grade = '11A';

-- Înscrierile din Fall 2024 la o anumită materie
SELECT ClassID, StudentID, AcademicYear, Semester
FROM   Classes
WHERE  SubjectID = 1
AND    AcademicYear = 2024
AND    Semester = 'Fall';
```

---

## 7. Sortarea cu ORDER BY

```sql
-- Elevii sortați alfabetic după numele de familie
SELECT FirstName, LastName, Grade FROM Students ORDER BY LastName ASC;

-- Prezența sortată descrescător după dată (cele mai recente primele)
SELECT AttendanceID, AttendanceDate, Status FROM Attendance ORDER BY AttendanceDate DESC;

-- Materiile sortate după credite (de la cele mai multe la cele mai puține), apoi alfabetic
SELECT SubjectName, Credits FROM Subjects ORDER BY Credits DESC, SubjectName ASC;

-- Înscrierile sortate după anul școlar și semestru
SELECT ClassID, StudentID, SubjectID, AcademicYear, Semester
FROM   Classes
ORDER BY AcademicYear DESC, Semester ASC;
```

---

## 8. Limitarea rezultatelor cu TOP

```sql
-- Cei mai recent înscriși 3 elevi
SELECT TOP 3 FirstName, LastName, EnrollmentDate
FROM   Students
ORDER BY EnrollmentDate DESC;

-- Cea mai recentă înregistrare de prezență
SELECT TOP 1 AttendanceID, ClassID, AttendanceDate, Status
FROM   Attendance
ORDER BY AttendanceDate DESC;

-- Primele 50% dintre materii după numărul de credite
SELECT TOP 50 PERCENT SubjectName, Credits
FROM   Subjects
ORDER BY Credits DESC;
```

---

## 9. DISTINCT

```sql
-- Ce clase sunt reprezentate printre elevi?
SELECT DISTINCT Grade FROM Students WHERE Grade IS NOT NULL ORDER BY Grade;

-- Ce ID-uri de profesori apar în înregistrările de prezență?
SELECT DISTINCT TeacherID FROM Attendance ORDER BY TeacherID;

-- Ce statusuri de prezență sunt folosite?
SELECT DISTINCT Status FROM Attendance;

-- Câte înscrieri distincte au cel puțin o înregistrare de prezență?
SELECT COUNT(DISTINCT ClassID) AS ClassesWithAttendance FROM Attendance;
```

---

## 10. Funcții predefinite utile

```sql
-- Funcții pentru șiruri de caractere
SELECT
    UPPER(FirstName + ' ' + LastName)   AS UpperName,
    LEN(Email)                          AS EmailLength,
    LEFT(Grade, 2)                      AS GradeYear
FROM Students;

-- Funcții pentru date calendaristice aplicate prezenței
SELECT
    AttendanceDate,
    YEAR(AttendanceDate)                AS Year,
    MONTH(AttendanceDate)               AS Month,
    DAY(AttendanceDate)                 AS Day,
    DATENAME(WEEKDAY, AttendanceDate)   AS Weekday,
    DATENAME(MONTH, AttendanceDate)     AS MonthName
FROM Attendance;

-- Tratarea valorilor NULL
SELECT
    FirstName,
    LastName,
    ISNULL(Grade, 'Unassigned')         AS GradeDisplay,
    ISNULL(Specialization, 'General')   AS SpecializationDisplay
FROM Students
CROSS JOIN Teachers;  -- (doar cu titlu ilustrativ)
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Listează toți elevii din clasa `'10B'`. Afișează numele complet și emailul.

**Exercițiul 2 (Ușor)**
Afișează toate înregistrările de prezență cu `Status = 'Absent'`. Afișează `AttendanceID`, `ClassID`, `AttendanceDate`.

**Exercițiul 3 (Ușor)**
Listează toate materiile cu 3 sau mai multe credite, sortate descrescător după credite.

**Exercițiul 4 (Mediu)**
Găsește toți elevii înscriși între `'2022-09-01'` și `'2023-08-31'`. Afișează numele complet și data înscrierii.

**Exercițiul 5 (Mediu)**
Afișează înregistrările de prezență din 4 și 5 septembrie 2024. Include `AttendanceID`, `ClassID`, `AttendanceDate` și `Status`. Sortează după dată, apoi după ClassID.

**Exercițiul 6 (Mediu)**
Găsește toți profesorii al căror email se termină cu `'@school.ro'` și a căror specializare începe cu `'M'`.

**Exercițiul 7 (Mediu)**
Afișează lista distinctă a claselor (Grade) prezente în tabelul `Students`.

**Exercițiul 8 (Mediu)**
Afișează cei mai recent înscriși 3 elevi (cel mai recent primul). Afișează numele complet și data înscrierii.

**Exercițiul 9 (Dificil)**
Afișează fiecare înregistrare de prezență cu `AttendanceID`, `ClassID`, `AttendanceDate`, `Status`, numele zilei săptămânii și o coloană `IsWeekend` care are valoarea 1 dacă prezența cade sâmbăta sau duminica (folosește `DATEPART(WEEKDAY, ...)`), altfel 0.

**Exercițiul 10 (Dificil)**
Afișează înscrierile din Fall 2024 ale elevilor dintr-o clasă care începe cu `'10'`. (Indiciu: leagă Classes de Students printr-o subinterogare sau o clauză IN.)

---

## Răspunsuri

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
