# Baza de date Attendance — Fișa de lucru 5: SELECT — JOIN-uri

## Obiective de învățare
- Unirea tuturor celor 5 tabele ale bazei de date Attendance pentru a răspunde la întrebări reale de raportare școlară
- Folosirea INNER JOIN, LEFT JOIN, RIGHT JOIN și FULL OUTER JOIN
- Găsirea elevilor fără prezență, a materiilor fără înscrieri și a altor scenarii de tip anti-join
- Scrierea de interogări curate pe mai multe tabele folosind aliasuri de tabel

---

## De ce JOIN-uri?

Baza de date Attendance împarte responsabilitățile în 5 tabele. Pentru a răspunde la întrebarea „Ce elevi au absentat pe 3 septembrie?” trebuie să unim Attendance → Classes → Students. JOIN-urile ne permit să reconstruim imaginea completă fără a stoca date redundante.

---

## Tipuri de JOIN — Prezentare generală

| JOIN | Returnează |
|---|---|
| `INNER JOIN` | Doar rândurile care au corespondent în **ambele** tabele |
| `LEFT JOIN` | Toate din stânga + rândurile corespondente din dreapta (NULL dacă nu există corespondent) |
| `RIGHT JOIN` | Toate din dreapta + rândurile corespondente din stânga (NULL dacă nu există corespondent) |
| `FULL OUTER JOIN` | Toate rândurile din ambele tabele; NULL pe partea fără corespondent |

---

## Aliasuri de tabel

```sql
-- Fără aliasuri
SELECT Students.FirstName, Subjects.SubjectName
FROM   Classes
INNER JOIN Students ON Classes.StudentID = Students.StudentID
INNER JOIN Subjects ON Classes.SubjectID = Subjects.SubjectID;

-- Cu aliasuri (mult mai curat)
SELECT s.FirstName, sub.SubjectName
FROM   Classes   AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID;
```

---

## INNER JOIN

### Exemplul 1 — Înscrierile cu numele elevilor și ale materiilor

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

### Exemplul 2 — Prezența cu numele elevilor și ale profesorilor

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

### Exemplul 3 — Raport complet de prezență (toate cele 5 tabele)

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

### Exemplul 4 — Elevii absenți sau întârziați la o anumită dată

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

### Exemplul 1 — Toți elevii și înregistrările lor de prezență (inclusiv elevii fără nicio înregistrare)

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

### Exemplul 2 — Toți elevii înscriși și numărul lor de prezențe pe materie

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

### Anti-join — Elevii fără nicio înregistrare de prezență

```sql
SELECT s.StudentID, s.FirstName + ' ' + s.LastName AS StudentName, s.Grade
FROM   Students AS s
LEFT JOIN Classes AS cl ON s.StudentID = cl.StudentID
LEFT JOIN Attendance AS a ON cl.ClassID = a.ClassID
WHERE  a.AttendanceID IS NULL;
```

### Anti-join — Materiile fără înscrieri (niciun elev în tabelul Classes)

```sql
SELECT sub.SubjectID, sub.SubjectName, sub.Credits
FROM   Subjects AS sub
LEFT JOIN Classes AS cl ON sub.SubjectID = cl.SubjectID
WHERE  cl.ClassID IS NULL;
```

---

## RIGHT OUTER JOIN

```sql
-- Toți profesorii, inclusiv cei care nu au făcut niciodată prezența
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
-- Toți elevii și toate înscrierile — afișăm și rândurile fără corespondent din ambele părți
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

## Unirea celor 5 tabele

O vedere cuprinzătoare a catalogului zilnic de prezență:

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

## Greșeli frecvente

```sql
-- GREȘEALĂ: JOIN pe coloana greșită
SELECT s.FirstName, sub.SubjectName
FROM   Classes AS cl
INNER JOIN Students AS s   ON cl.ClassID  = s.StudentID  -- GREȘIT! Ar trebui să fie cl.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID;

-- GREȘEALĂ: Lipsa condiției de JOIN produce un produs cartezian
SELECT s.FirstName, t.FirstName
FROM   Students AS s
INNER JOIN Teachers AS t;  -- Eroare: clauza ON este obligatorie

-- CORECT: nu există o FK directă între Students și Teachers
-- Trecem întotdeauna prin Classes → Attendance → Teachers
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Afișează numele complete ale tuturor elevilor înscriși la materia `'Mathematics'` (SubjectID = 1) în Fall 2024.

**Exercițiul 2 (Ușor)**
Afișează toate înregistrările de prezență din `'2024-09-04'`, cu numele complet al elevului și numele materiei.

**Exercițiul 3 (Mediu)**
Găsește toți elevii care **nu au avut niciodată** vreo înregistrare de prezență. Afișează numele complet și clasa.

**Exercițiul 4 (Mediu)**
Afișează toate materiile, împreună cu numărul de elevi înscriși la fiecare. Include materiile fără înscrieri (afișează 0). Sortează descrescător după numărul de înscrieri.

**Exercițiul 5 (Mediu)**
Listează toate înregistrările de prezență cu statusul `'Absent'`, afișând numele elevului, numele materiei, numele profesorului și data. Sortează după dată.

**Exercițiul 6 (Mediu)**
Afișează toți profesorii și numărul de date distincte în care au făcut prezența. Include profesorii care nu au făcut prezența niciodată. Sortează descrescător după numărul de date.

**Exercițiul 7 (Dificil)**
Pentru fiecare elev, afișează numele complet, clasa, numărul de materii la care este înscris, numărul total de înregistrări de prezență și numărul de absențe. Sortează descrescător după numărul de absențe.

**Exercițiul 8 (Dificil)**
Afișează fiecare combinație elev-materie din `Classes`, împreună cu cel mai recent status de prezență (din cea mai recentă înregistrare din `Attendance`). Elevii fără prezență trebuie să aibă NULL la status.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName
FROM   Classes  AS cl
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'Mathematics'
AND    cl.AcademicYear = 2024 AND cl.Semester = 'Fall';
```

**Exercițiul 2**
```sql
SELECT a.AttendanceDate, s.FirstName + ' ' + s.LastName AS StudentName,
       sub.SubjectName, a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s   ON cl.StudentID = s.StudentID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  a.AttendanceDate = '2024-09-04';
```

**Exercițiul 3**
```sql
SELECT s.FirstName + ' ' + s.LastName AS StudentName, s.Grade
FROM   Students AS s
LEFT JOIN Classes    AS cl ON s.StudentID = cl.StudentID
LEFT JOIN Attendance AS a  ON cl.ClassID  = a.ClassID
WHERE  a.AttendanceID IS NULL;
```

**Exercițiul 4**
```sql
SELECT sub.SubjectName, COUNT(cl.ClassID) AS EnrolledStudents
FROM   Subjects AS sub
LEFT JOIN Classes AS cl ON sub.SubjectID = cl.SubjectID
GROUP BY sub.SubjectID, sub.SubjectName
ORDER BY EnrolledStudents DESC;
```

**Exercițiul 5**
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

**Exercițiul 6**
```sql
SELECT t.FirstName + ' ' + t.LastName AS TeacherName,
       COUNT(DISTINCT a.AttendanceDate) AS DistinctDates
FROM   Teachers AS t
LEFT JOIN Attendance AS a ON t.TeacherID = a.TeacherID
GROUP BY t.TeacherID, t.FirstName, t.LastName
ORDER BY DistinctDates DESC;
```

**Exercițiul 7**
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

**Exercițiul 8**
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
