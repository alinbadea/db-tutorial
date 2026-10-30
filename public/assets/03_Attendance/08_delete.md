# Baza de date Attendance — Fișa de lucru 8: Instrucțiuni DELETE

## Obiective de învățare
- Ștergerea în siguranță a rândurilor din tabelele de prezență, cu WHERE
- Ștergerea în ordinea corectă impusă de FK, pentru a evita încălcarea constrângerilor
- Folosirea DELETE cu JOIN-uri pentru a elimina rânduri pe baza condițiilor din tabele asociate
- Înțelegerea diferenței TRUNCATE vs DELETE în contextul unui sistem de prezență

---

## Sintaxa DELETE

```sql
DELETE FROM table_name
WHERE condition;
```

> **ATENȚIE:** Fără WHERE, fiecare rând din tabel este șters. Previzualizează întotdeauna mai întâi cu un SELECT și ia în considerare includerea operațiilor distructive într-o tranzacție.

---

## Bună practică: previzualizează înainte de ștergere

```sql
-- Previzualizare: ce înregistrări de prezență vor fi eliminate?
SELECT * FROM Attendance WHERE ClassID = 5;

-- Apoi ștergem
DELETE FROM Attendance WHERE ClassID = 5;
```

---

## DELETE de bază — un singur rând

```sql
-- Eliminăm o anumită înregistrare de prezență (de ex., o eroare la introducerea datelor)
DELETE FROM Attendance WHERE AttendanceID = 11;

-- Eliminăm o anumită înscriere (elevul a renunțat la o materie)
DELETE FROM Classes WHERE ClassID = 9;

-- Eliminăm un elev (rândurile dependente trebuie șterse înainte)
DELETE FROM Students WHERE StudentID = 8;
```

---

## DELETE pe mai multe rânduri cu WHERE

### Clauza IN

```sql
-- Eliminăm înregistrările de prezență pentru anumite înscrieri
DELETE FROM Attendance WHERE ClassID IN (9, 10);

-- Eliminăm toate înscrierile la o anumită materie
DELETE FROM Classes WHERE SubjectID = 5;
```

### BETWEEN

```sql
-- Eliminăm înregistrările de prezență dintr-un interval de date de test
DELETE FROM Attendance
WHERE AttendanceDate BETWEEN '2024-09-01' AND '2024-09-02';
```

### LIKE

```sql
-- Eliminăm conturile de test ale elevilor
DELETE FROM Students
WHERE Email LIKE '%@test.ro' OR Email LIKE '%@example.com';
```

### Condiții compuse

```sql
-- Eliminăm înregistrările vechi de prezență care nu mai sunt necesare
DELETE FROM Attendance
WHERE AttendanceDate < DATEADD(YEAR, -5, GETDATE());

-- Eliminăm înregistrările 'Absent' pentru o anumită dată (de ex., o zi liberă — toată lumea a lipsit)
DELETE FROM Attendance
WHERE Status = 'Absent'
AND   AttendanceDate = '2024-12-25';
```

---

## DELETE cu subinterogare în WHERE

```sql
-- Eliminăm toate înregistrările de prezență ale elevilor din clasa '10B'
DELETE FROM Attendance
WHERE ClassID IN (
    SELECT cl.ClassID
    FROM   Classes  AS cl
    INNER JOIN Students AS s ON cl.StudentID = s.StudentID
    WHERE  s.Grade = '10B'
);

-- Eliminăm înscrierile la o materie care nu se mai predă
DELETE FROM Classes
WHERE SubjectID = (
    SELECT SubjectID FROM Subjects WHERE SubjectName = 'History'
);

-- Eliminăm elevii care nu au nicio înscriere
DELETE FROM Students
WHERE StudentID NOT IN (
    SELECT DISTINCT StudentID FROM Classes
);
```

---

## DELETE cu JOIN (clauza FROM din T-SQL)

### Exemplul 1 — Ștergerea înregistrărilor de prezență pentru o anumită materie

```sql
-- Previzualizare
SELECT a.AttendanceID, sub.SubjectName, a.AttendanceDate
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'History';

-- Ștergere
DELETE a
FROM   Attendance AS a
INNER JOIN Classes  AS cl  ON a.ClassID    = cl.ClassID
INNER JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectName = 'History';
```

### Exemplul 2 — Ștergerea prezenței unei anumite clase la o anumită dată

```sql
-- Ștergem toată prezența clasei 10A din 5 septembrie (ore anulate)
DELETE a
FROM   Attendance AS a
INNER JOIN Classes  AS cl ON a.ClassID    = cl.ClassID
INNER JOIN Students AS s  ON cl.StudentID = s.StudentID
WHERE  s.Grade           = '10A'
AND    a.AttendanceDate  = '2024-09-05';
```

### Exemplul 3 — DELETE cu anti-join: eliminarea înscrierilor la materii care nu mai există

```sql
-- Previzualizăm înscrierile orfane
SELECT cl.ClassID, cl.SubjectID
FROM   Classes AS cl
LEFT JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectID IS NULL;

-- Ștergem înscrierile orfane
DELETE cl
FROM   Classes AS cl
LEFT JOIN Subjects AS sub ON cl.SubjectID = sub.SubjectID
WHERE  sub.SubjectID IS NULL;
```

---

## Respectarea constrângerilor de cheie străină

Ordinea corectă de ștergere pentru AttendanceDB (de la tabelele copil la tabelele părinte):

```
1. Attendance   (referă Classes și Teachers)
2. Classes      (referă Students și Subjects)
3. Students     (nu mai are rânduri copil — sigur)
4. Teachers     (nu mai are rânduri copil — sigur)
5. Subjects     (nu mai are rânduri copil — sigur)
```

### Eliminarea completă a unui elev

```sql
-- Pasul 1: Eliminăm înregistrările de prezență pentru înscrierile acestui elev
DELETE a
FROM   Attendance AS a
INNER JOIN Classes AS cl ON a.ClassID = cl.ClassID
WHERE  cl.StudentID = 3;

-- Pasul 2: Eliminăm înscrierile
DELETE FROM Classes WHERE StudentID = 3;

-- Pasul 3: Eliminăm elevul
DELETE FROM Students WHERE StudentID = 3;
```

### Eliminarea completă a unei materii (retragerea unei materii)

```sql
-- Pasul 1: Eliminăm înregistrările de prezență pentru toate înscrierile la această materie
DELETE a
FROM   Attendance AS a
INNER JOIN Classes AS cl ON a.ClassID = cl.ClassID
WHERE  cl.SubjectID = 5;

-- Pasul 2: Eliminăm înscrierile la această materie
DELETE FROM Classes WHERE SubjectID = 5;

-- Pasul 3: Eliminăm materia propriu-zisă
DELETE FROM Subjects WHERE SubjectID = 5;
```

---

## TRUNCATE TABLE vs DELETE

| Caracteristică | DELETE | TRUNCATE |
|---|---|---|
| Clauza WHERE | Suportată | Nesuportată |
| Viteză | Mai lent (jurnalizare pe rând) | Mai rapid (jurnalizare minimă) |
| Resetează contorul IDENTITY | Nu | Da |
| Poate fi anulat (rollback) | Da (într-o tranzacție) | Da (într-o tranzacție) |
| Funcționează cu referințe FK | Da (dacă rândurile copil au fost eliminate) | Nu |
| Declanșează triggerele DELETE | Da | Nu |

```sql
-- DELETE: precis, rând cu rând
DELETE FROM Attendance WHERE AttendanceDate < '2020-01-01';

-- TRUNCATE: elimină TOATE rândurile, resetează IDENTITY
TRUNCATE TABLE Attendance;   -- OK — niciun tabel nu referă Attendance printr-o FK
TRUNCATE TABLE Classes;      -- EROARE — Attendance referă Classes printr-o FK
```

---

## DELETE cu clauza OUTPUT

```sql
-- Arhivăm înregistrările de prezență șterse înainte de a le elimina
DECLARE @Deleted TABLE (
    AttendanceID   INT,
    ClassID        INT,
    TeacherID      INT,
    AttendanceDate DATE,
    Status         NVARCHAR(20)
);

DELETE FROM Attendance
OUTPUT DELETED.AttendanceID, DELETED.ClassID, DELETED.TeacherID,
       DELETED.AttendanceDate, DELETED.Status
INTO   @Deleted
WHERE  AttendanceDate < DATEADD(YEAR, -1, GETDATE());

SELECT * FROM @Deleted;
```

---

## Modelul „Soft Delete”

În loc să ștergi, dezactivează cu un indicator (flag):

```sql
-- Adăugăm IsActive în Students
ALTER TABLE Students ADD IsActive BIT NOT NULL DEFAULT 1;

-- „Ștergem” un elev
UPDATE Students SET IsActive = 0 WHERE StudentID = 3;

-- Doar elevii activi
SELECT * FROM Students WHERE IsActive = 1;
```

---

## Tranzacții pentru siguranță

```sql
BEGIN TRANSACTION;

-- Eliminăm complet materia 'History' (SubjectID = 5) și toate datele asociate
DELETE a
FROM   Attendance AS a
INNER JOIN Classes AS cl ON a.ClassID = cl.ClassID
WHERE  cl.SubjectID = 5;

DELETE FROM Classes WHERE SubjectID = 5;
DELETE FROM Subjects WHERE SubjectID = 5;

-- Verificăm
SELECT * FROM Subjects WHERE SubjectID = 5;
SELECT * FROM Classes  WHERE SubjectID = 5;

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION dacă ceva a mers prost
```

---

## Exerciții practice

**Exercițiul 1**
Șterge înregistrarea de prezență cu `AttendanceID = 12`.

**Exercițiul 2**
Șterge toate înregistrările de prezență cu `Status = 'Late'` din `'2024-09-04'`.

**Exercițiul 3**
Folosind o subinterogare, șterge toate înscrierile (rândurile din `Classes`) ale elevilor din clasa `'10B'` — dar numai după ce te-ai asigurat că înregistrările lor de prezență au fost șterse înainte.

**Exercițiul 4**
Scrie secvența completă pentru a elimina din sistem profesorul cu `TeacherID = 5` — mai întâi actualizează înregistrările lui de prezență pentru a le reatribui lui `TeacherID = 1`, apoi (opțional) șterge profesorul.

**Exercițiul 5**
Folosind `DELETE ... FROM ... JOIN`, elimină toate înregistrările de prezență pentru materia `'Physics'` (unește pe traseul Attendance → Classes → Subjects).

**Exercițiul 6**
Folosind `DELETE ... FROM ... JOIN`, elimină toate înscrierile elevilor al căror email se termină cu `'@test.ro'`. (Unește Classes → Students.)

**Exercițiul 7**
Folosind `DELETE` cu `OUTPUT`, elimină toate înregistrările de prezență din `'2024-09-03'` și capturează rândurile șterse într-o variabilă de tip tabel. Afișează `AttendanceID`, `ClassID` și `Status`.

**Exercițiul 8**
Explică diferența dintre `DELETE FROM Attendance` și `TRUNCATE TABLE Attendance`:
- Ce se întâmplă cu contorul IDENTITY în fiecare caz?
- Poți folosi o clauză WHERE cu TRUNCATE?
- De ce ar eșua `TRUNCATE TABLE Classes` dacă Attendance încă mai conține rânduri?
- În ce scenariu ai folosi TRUNCATE în loc de DELETE?
