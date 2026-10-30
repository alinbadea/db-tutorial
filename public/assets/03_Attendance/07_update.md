# Baza de date Attendance — Fișa de lucru 7: Instrucțiuni UPDATE

## Obiective de învățare
- Actualizarea în siguranță a înregistrărilor de prezență, a datelor elevilor și a înscrierilor
- Folosirea JOIN-urilor în UPDATE pentru a modifica rânduri pe baza condițiilor din tabele asociate
- Capturarea stării dinainte/de după cu clauza OUTPUT
- Includerea actualizărilor riscante în tranzacții

---

## Sintaxa UPDATE

```sql
UPDATE table_name
SET    column1 = value1,
       column2 = value2
WHERE  condition;
```

> **ATENȚIE:** Fără clauza WHERE, fiecare rând este actualizat. Previzualizează întotdeauna mai întâi cu SELECT.

---

## Bună practică: previzualizează înainte de actualizare

```sql
-- Previzualizăm ce înregistrări de prezență vor fi actualizate
SELECT AttendanceID, Status FROM Attendance WHERE ClassID = 1;

-- Apoi actualizăm
UPDATE Attendance SET Status = 'Present' WHERE ClassID = 1;
```

---

## UPDATE de bază — o singură coloană

```sql
-- Corectăm o înregistrare de prezență
UPDATE Attendance
SET    Status = 'Late'
WHERE  AttendanceID = 3;

-- Actualizăm clasa unui elev
UPDATE Students
SET    Grade = '11A'
WHERE  StudentID = 1;

-- Corectăm o greșeală de scriere în specializarea unui profesor
UPDATE Teachers
SET    Specialization = 'Mathematics'
WHERE  TeacherID = 1 AND Specialization = 'Maths';
```

---

## UPDATE pe mai multe coloane

```sql
-- Corectăm datele de contact ale unui elev
UPDATE Students
SET    Email = 'maria.p.new@school.ro',
       Grade = '11A'
WHERE  StudentID = 1;

-- Actualizăm numele unui profesor (de ex., schimbare de nume după căsătorie)
UPDATE Teachers
SET    LastName = 'Munteanu-Pop',
       Email    = 'munteanu.pop@school.ro'
WHERE  TeacherID = 1;
```

---

## UPDATE cu WHERE complex

### Clauza IN

```sql
-- Marcăm mai multe înregistrări de prezență ca 'Present'
UPDATE Attendance
SET    Status = 'Present'
WHERE  AttendanceID IN (3, 5, 7);

-- Actualizăm clasa mai multor elevi
UPDATE Students
SET    Grade = '11A'
WHERE  StudentID IN (1, 2);
```

### BETWEEN

```sql
-- Setăm la 'Absent' toată prezența din 3–5 septembrie, pentru o săptămână anulată
-- (Afectează doar scenariul absențelor neînregistrate/motivate)
UPDATE Attendance
SET    Status = 'Absent'
WHERE  AttendanceDate BETWEEN '2024-09-03' AND '2024-09-05'
AND    Status = 'Present';
```

### LIKE

```sql
-- Standardizăm denumirile specializărilor
UPDATE Teachers
SET    Specialization = 'Information Technology'
WHERE  Specialization LIKE '%IT%' OR Specialization LIKE '%Informatics%';
```

---

## UPDATE cu subinterogare în WHERE

```sql
-- Marcăm ca 'Absent' toată prezența elevilor din clasa 10B la o anumită dată
UPDATE Attendance
SET    Status = 'Absent'
WHERE  AttendanceDate = '2024-09-05'
AND    ClassID IN (
    SELECT cl.ClassID
    FROM   Classes  AS cl
    INNER JOIN Students AS s ON cl.StudentID = s.StudentID
    WHERE  s.Grade = '10B'
);

-- Eliminăm statusul de întârziere pentru înscrierile la o anumită materie
UPDATE Attendance
SET    Status = 'Present'
WHERE  Status = 'Late'
AND    ClassID IN (
    SELECT ClassID FROM Classes WHERE SubjectID = 2
);
```

---

## UPDATE cu subinterogare în SET

```sql
-- Reatribuim toate înregistrările de prezență ale TeacherID=2 către TeacherID=1
-- (când un profesor preia orele altuia)
UPDATE Attendance
SET    TeacherID = 1
WHERE  TeacherID = 2;
-- (Simplu, dar arată cum se face reatribuirea)
```

---

## UPDATE cu JOIN (clauza FROM din T-SQL)

### Exemplul 1 — Actualizarea claselor elevilor în funcție de anul înscrierii

```sql
-- Previzualizare
SELECT s.StudentID, s.FirstName, s.Grade,
       CASE WHEN YEAR(s.EnrollmentDate) = 2021 THEN '12A'
            WHEN YEAR(s.EnrollmentDate) = 2022 THEN '11A'
            WHEN YEAR(s.EnrollmentDate) = 2023 THEN '10A'
       END AS NewGrade
FROM   Students AS s;

-- Actualizare
UPDATE s
SET    s.Grade = CASE WHEN YEAR(s.EnrollmentDate) = 2021 THEN '12A'
                      WHEN YEAR(s.EnrollmentDate) = 2022 THEN '11A'
                      WHEN YEAR(s.EnrollmentDate) = 2023 THEN '10A'
                      ELSE s.Grade
                 END
FROM   Students AS s;
```

### Exemplul 2 — Schimbarea profesorului pentru toate înregistrările de prezență de la Mathematics

```sql
-- Toate orele de Math ar trebui acum să fie predate de TeacherID 1
-- Previzualizare
SELECT a.AttendanceID, a.TeacherID, sub.SubjectName
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'Mathematics';

-- Actualizare
UPDATE a
SET    a.TeacherID = 1
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'Mathematics';
```

### Exemplul 3 — Marcarea întregii prezențe ca 'Absent' pentru o clasă care a avut o zi de școală anulată

```sql
-- Prezența tuturor elevilor din clasa 10A pe 2024-09-05 trebuie să fie 'Absent'
-- Previzualizare
SELECT a.AttendanceID, s.Grade, a.AttendanceDate, a.Status
FROM   Attendance AS a
INNER JOIN Classes  AS cl ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s  ON cl.StudentID = s.StudentID
WHERE  a.AttendanceDate = '2024-09-05'
AND    s.Grade = '10A';

-- Actualizare
UPDATE a
SET    a.Status = 'Absent'
FROM   Attendance AS a
INNER JOIN Classes  AS cl ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s  ON cl.StudentID = s.StudentID
WHERE  a.AttendanceDate = '2024-09-05'
AND    s.Grade = '10A';
```

### Exemplul 4 — Promovarea elevilor (actualizarea clasei) și mutarea înscrierilor lor într-un semestru nou

```sql
-- Două actualizări separate într-o singură operație logică: promovăm clasa 10A în 11A
-- și mutăm înscrierile lor din Fall 2024 în Spring 2025

-- Pasul 1: Actualizăm clasele elevilor
UPDATE Students
SET    Grade = '11A'
WHERE  Grade = '10A';

-- Pasul 2: Actualizăm semestrul înscrierilor existente
UPDATE cl
SET    cl.Semester     = 'Spring',
       cl.AcademicYear = 2025
FROM   Classes  AS cl
INNER JOIN Students AS s ON cl.StudentID = s.StudentID
WHERE  s.Grade = '11A'           -- acum '11A' după pasul 1
AND    cl.AcademicYear = 2024
AND    cl.Semester = 'Fall';
```

---

## UPDATE cu clauza OUTPUT

```sql
-- Jurnal de audit: capturăm modificările statusului de prezență
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

## Tranzacții pentru siguranță

```sql
BEGIN TRANSACTION;

-- Reatribuim toată prezența de la TeacherID=3 la TeacherID=1 (profesorul pleacă)
UPDATE Attendance
SET    TeacherID = 1
WHERE  TeacherID = 3;

-- Verificare
SELECT TeacherID, COUNT(*) AS Records
FROM   Attendance
GROUP BY TeacherID;

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION dacă rezultatele par greșite
```

---

## Exerciții practice

**Exercițiul 1**
Actualizează `Specialization` pentru profesorul cu `TeacherID = 2` la `'Applied Physics'`.

**Exercițiul 2**
Schimbă toate înregistrările de prezență `'Late'` în `'Present'` pentru `ClassID = 4`.

**Exercițiul 3**
Folosind o subinterogare în WHERE, actualizează la `'Absent'` toate înregistrările de prezență ale elevilor din clasa `'10B'` din `'2024-09-05'`.

**Exercițiul 4**
Folosind `UPDATE ... FROM ... JOIN`, schimbă profesorul la `TeacherID = 3` pentru toate înregistrările de prezență de la Literature (`SubjectName = 'Literature'`).

**Exercițiul 5**
Folosind `UPDATE ... FROM ... JOIN`, actualizează `AcademicYear` din `2024` în `2025` pentru toate înscrierile în care elevul este în clasa `'11A'`.

**Exercițiul 6**
Folosind `UPDATE ... FROM ... JOIN` cu un JOIN pe 3 tabele, marchează ca `'Absent'` toate înregistrările de prezență din `'2024-09-03'` ale elevilor al căror email se termină cu `'@school.ro'`.

**Exercițiul 7**
Folosind `UPDATE` cu `OUTPUT`, schimbă toate înregistrările de prezență `'Absent'` în `'Present'` pentru `'2024-09-04'` și capturează `AttendanceID`, statusul vechi și statusul nou într-o variabilă de tip tabel. Afișează rezultatele.

**Exercițiul 8**
Scrie o tranzacție care:
1. Promovează toți elevii cu `Grade = '10A'` la `Grade = '11A'`
2. Verifică modificarea cu un SELECT
3. Face COMMIT sau ROLLBACK, cu un comentariu care explică alegerea
