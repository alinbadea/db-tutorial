# Baza de date Attendance — Fișa de lucru 6: SELECT — Grupare și funcții de agregare

## Obiective de învățare
- Aplicarea funcțiilor de agregare pentru a sintetiza datele de prezență
- Gruparea rezultatelor după elev, materie, profesor, dată și clasă
- Filtrarea grupurilor cu HAVING pentru a evidenția problemele de prezență
- Combinarea JOIN-urilor cu GROUP BY pentru a construi rapoarte de prezență școlară

---

## Funcții de agregare

### COUNT

```sql
-- Numărul total de înregistrări de prezență
SELECT COUNT(*) AS TotalRecords FROM Attendance;

-- Înregistrările de prezență pe status
SELECT Status, COUNT(*) AS Count FROM Attendance GROUP BY Status;

-- COUNT(*) vs COUNT(coloană) când există NULL
-- AttendanceDate nu ar trebui să fie niciodată NULL, dar exemplul ilustrează conceptul:
SELECT
    COUNT(*)             AS TotalRows,
    COUNT(AttendanceDate) AS RowsWithDate
FROM Attendance;
```

### SUM

```sql
-- Totalul absențelor din toate înregistrările
SELECT SUM(CASE WHEN Status = 'Absent' THEN 1 ELSE 0 END) AS TotalAbsences
FROM   Attendance;

-- Totalul creditelor pentru toate materiile
SELECT SUM(Credits) AS TotalCredits FROM Subjects;
```

### AVG

```sql
-- Media creditelor pe materie
SELECT AVG(CAST(Credits AS DECIMAL(10,2))) AS AvgCredits FROM Subjects;

-- Numărul mediu de înregistrări de prezență pe înscriere (ClassID)
SELECT AVG(cnt) AS AvgSessionsPerClass
FROM (
    SELECT ClassID, COUNT(*) AS cnt
    FROM   Attendance
    GROUP BY ClassID
) AS sub;
```

### MIN și MAX

```sql
-- Cea mai veche și cea mai recentă dată de prezență
SELECT MIN(AttendanceDate) AS FirstSession, MAX(AttendanceDate) AS LastSession
FROM   Attendance;

-- Cel mai mic și cel mai mare număr de credite
SELECT MIN(Credits) AS MinCredits, MAX(Credits) AS MaxCredits FROM Subjects;

-- Cea mai veche și cea mai recentă dată de înscriere
SELECT MIN(EnrollmentDate) AS FirstEnrolled, MAX(EnrollmentDate) AS LastEnrolled
FROM   Students;
```

---

## GROUP BY

### O singură coloană

```sql
-- Numărul de prezențe pe status
SELECT Status, COUNT(*) AS Count
FROM   Attendance
GROUP BY Status
ORDER BY Count DESC;

-- Numărul de înscrieri pe materie
SELECT SubjectID, COUNT(*) AS StudentCount
FROM   Classes
GROUP BY SubjectID
ORDER BY StudentCount DESC;

-- Numărul de înregistrări de prezență pe profesor
SELECT TeacherID, COUNT(*) AS SessionsTaught
FROM   Attendance
GROUP BY TeacherID
ORDER BY SessionsTaught DESC;

-- Înscrierile pe an școlar
SELECT AcademicYear, COUNT(*) AS EnrollmentCount
FROM   Classes
GROUP BY AcademicYear
ORDER BY AcademicYear;
```

### Mai multe coloane

```sql
-- Defalcarea prezenței pe înscriere și pe status
SELECT ClassID, Status, COUNT(*) AS Count
FROM   Attendance
GROUP BY ClassID, Status
ORDER BY ClassID, Status;

-- Înscrierile pe materie și pe semestru
SELECT SubjectID, Semester, COUNT(*) AS StudentCount
FROM   Classes
GROUP BY SubjectID, Semester
ORDER BY SubjectID, Semester;
```

---

## HAVING

```sql
-- Înscrierile cu mai mult de 2 absențe
SELECT ClassID, COUNT(*) AS AbsenceCount
FROM   Attendance
WHERE  Status = 'Absent'
GROUP BY ClassID
HAVING COUNT(*) > 2;

-- Materiile cu 3 sau mai mulți elevi înscriși
SELECT SubjectID, COUNT(*) AS StudentCount
FROM   Classes
GROUP BY SubjectID
HAVING COUNT(*) >= 3;

-- Profesorii care au ținut mai mult de o oră
SELECT TeacherID, COUNT(*) AS SessionCount
FROM   Attendance
GROUP BY TeacherID
HAVING COUNT(*) > 1;
```

---

## GROUP BY cu JOIN-uri

### Exemplul 1 — Rezumatul prezenței pe elev, cu numele complet

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

### Exemplul 2 — Rata de prezență pe materie

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

### Exemplul 3 — Rezumatul încărcării profesorilor

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

### Exemplul 4 — Identificarea elevilor cu risc (HAVING + JOIN-uri)

Elevii care au cel puțin 2 absențe la o materie:

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

## Valori NULL în agregări

```sql
-- AVG și SUM ignoră valorile NULL
-- Grade acceptă NULL — AVG ar eșua pe NVARCHAR; folosim COUNT în schimb
SELECT
    COUNT(Grade)  AS StudentsWithGrade,
    COUNT(*)      AS TotalStudents
FROM Students;

-- ISNULL pentru a înlocui cu o valoare implicită înainte de agregare
SELECT
    SUM(ISNULL(Credits, 0)) AS TotalCreditsIncludingNulls
FROM Subjects;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Numără înregistrările de prezență pentru fiecare valoare `Status`. Afișează `Status` și `Count`.

**Exercițiul 2 (Ușor)**
Afișează numărul total de elevi înscriși la fiecare materie (grupat după `SubjectID`). Sortează descrescător după număr.

**Exercițiul 3 (Ușor)**
Găsește cea mai veche și cea mai recentă dată de înscriere din `Students`.

**Exercițiul 4 (Mediu)**
Afișează numele fiecărei materii alături de numărul de elevi înscriși la ea pentru `AcademicYear = 2024`. Unește `Subjects` și `Classes`.

**Exercițiul 5 (Mediu)**
Listează toate înscrierile (`ClassID`) care au cel puțin 3 înregistrări de prezență. Afișează `ClassID` și numărul.

**Exercițiul 6 (Mediu)**
Afișează numele fiecărui profesor și numărul de elevi distincți cărora le-a predat (prin Attendance → Classes → Students). Sortează descrescător după numărul de elevi.

**Exercițiul 7 (Dificil)**
Pentru fiecare clasă (de ex., 10A, 10B), afișează numărul total de înregistrări Present, Absent și Late. Unește tabelele pe traseul Students → Classes → Attendance.

**Exercițiul 8 (Dificil)**
Calculează rata de prezență (Present / Total × 100) pe materie. Afișează numele materiei, numărul total de ore, numărul total de prezențe și rata de prezență ca procent. Folosește `NULLIF` pentru a evita împărțirea la zero.

**Exercițiul 9 (Dificil)**
Pentru fiecare elev, afișează numele, clasa și rata de absență pe materie (absențe / total ore × 100). Afișează doar combinațiile elev-materie la care rata de absență depășește 20%.

**Exercițiul 10 (Dificil)**
Afișează un rezumat zilnic al prezenței: pentru fiecare dată, câți elevi au fost Present, Absent și Late. Include doar datele care au cel puțin 3 înregistrări de prezență.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT Status, COUNT(*) AS Count FROM Attendance GROUP BY Status ORDER BY Count DESC;
```

**Exercițiul 2**
```sql
SELECT SubjectID, COUNT(*) AS StudentCount FROM Classes GROUP BY SubjectID ORDER BY StudentCount DESC;
```

**Exercițiul 3**
```sql
SELECT MIN(EnrollmentDate) AS MinDate, MAX(EnrollmentDate) AS MaxDate FROM Students;
```

**Exercițiul 4**
```sql
SELECT sub.SubjectName, COUNT(cl.ClassID) AS StudentCount
FROM   Subjects AS sub
INNER JOIN Classes AS cl ON sub.SubjectID = cl.SubjectID
WHERE  cl.AcademicYear = 2024
GROUP BY sub.SubjectID, sub.SubjectName
ORDER BY StudentCount DESC;
```

**Exercițiul 5**
```sql
SELECT ClassID, COUNT(*) AS AttendanceCount
FROM   Attendance
GROUP BY ClassID
HAVING COUNT(*) >= 3;
```

**Exercițiul 6**
```sql
SELECT t.FirstName + ' ' + t.LastName AS TeacherName,
       COUNT(DISTINCT cl.StudentID) AS DistinctStudents
FROM   Teachers AS t
INNER JOIN Attendance AS a  ON t.TeacherID  = a.TeacherID
INNER JOIN Classes    AS cl ON a.ClassID    = cl.ClassID
GROUP BY t.TeacherID, t.FirstName, t.LastName
ORDER BY DistinctStudents DESC;
```

**Exercițiul 7**
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

**Exercițiul 8**
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

**Exercițiul 9**
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

**Exercițiul 10**
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
