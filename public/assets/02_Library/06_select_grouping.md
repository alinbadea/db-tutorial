# Baza de date Library — Fișa de lucru 6: SELECT — Grupare și funcții de agregare

## Obiective de învățare
- Aplicarea funcțiilor de agregare (COUNT, SUM, AVG, MIN, MAX) pe datele bibliotecii
- Gruparea rezultatelor după una sau mai multe coloane
- Filtrarea grupurilor folosind HAVING
- Combinarea JOIN-urilor cu GROUP BY pentru a produce rapoarte relevante despre bibliotecă

---

## Funcții de agregare

### COUNT

```sql
-- Numărul total de cărți fizice din bibliotecă
SELECT COUNT(*) AS TotalBooks FROM Books;

-- Numărul de cărți care au data achiziției înregistrată
SELECT COUNT(AcquisitionDate) AS BooksWithDate FROM Books;

-- COUNT(*) vs COUNT(coloană) — diferență importantă
-- ReturnDate este NULL pentru împrumuturile nereturnate
SELECT
    COUNT(*)             AS TotalRentals,
    COUNT(ReturnDate)    AS ReturnedRentals,
    COUNT(*) - COUNT(ReturnDate) AS UnreturnedRentals
FROM Rentals;
```

### SUM

```sql
-- Numărul total de zile de împrumut, pentru toate împrumuturile
SELECT SUM(RentalDays) AS TotalRentalDays FROM Rentals;

-- Totalul zilelor de întârziere pentru cărțile încă nereturnate
SELECT SUM(DATEDIFF(DAY, DueDate, GETDATE())) AS TotalOverdueDays
FROM   Rentals
WHERE  ReturnDate IS NULL
AND    DueDate < GETDATE();
```

### AVG

```sql
-- Perioada medie de împrumut
SELECT AVG(CAST(RentalDays AS DECIMAL(10,2))) AS AvgRentalDays FROM Rentals;

-- Anul mediu de publicare al titlurilor din catalog
SELECT AVG(CAST(PublishedYear AS DECIMAL(10,2))) AS AvgPublicationYear
FROM   Titles
WHERE  PublishedYear IS NOT NULL;
```

### MIN și MAX

```sql
-- Cel mai vechi și cel mai recent împrumut
SELECT MIN(RentalDate) AS FirstRental, MAX(RentalDate) AS LatestRental FROM Rentals;

-- Cel mai vechi și cel mai nou titlu din catalog
SELECT MIN(PublishedYear) AS OldestTitle, MAX(PublishedYear) AS NewestTitle
FROM   Titles
WHERE  PublishedYear IS NOT NULL;

-- Cea mai veche achiziție de carte
SELECT MIN(AcquisitionDate) AS OldestBook FROM Books WHERE AcquisitionDate IS NOT NULL;
```

---

## GROUP BY

### O singură coloană

```sql
-- Numărul de titluri pe gen
SELECT Genre, COUNT(*) AS TitleCount
FROM   Titles
WHERE  Genre IS NOT NULL
GROUP BY Genre
ORDER BY TitleCount DESC;

-- Numărul de exemplare fizice pe titlu
SELECT TitleID, COUNT(*) AS CopyCount
FROM   Books
GROUP BY TitleID
ORDER BY CopyCount DESC;

-- Numărul de împrumuturi pe client
SELECT ClientID, COUNT(*) AS RentalCount
FROM   Rentals
GROUP BY ClientID
ORDER BY RentalCount DESC;

-- Cărțile pe statusul de disponibilitate
SELECT IsAvailable, COUNT(*) AS BookCount
FROM   Books
GROUP BY IsAvailable;
```

### Mai multe coloane

```sql
-- Numărul de împrumuturi pe client și pe durata împrumutului (în zile)
SELECT ClientID, RentalDays, COUNT(*) AS RentalCount
FROM   Rentals
GROUP BY ClientID, RentalDays
ORDER BY ClientID, RentalDays;

-- Cărțile pe titlu și pe stare
SELECT TitleID, Condition, COUNT(*) AS Copies
FROM   Books
GROUP BY TitleID, Condition
ORDER BY TitleID;
```

---

## HAVING

```sql
-- Clienții care au împrumutat mai mult de 2 cărți
SELECT ClientID, COUNT(*) AS RentalCount
FROM   Rentals
GROUP BY ClientID
HAVING COUNT(*) > 2;

-- Genurile care au cel puțin 2 titluri
SELECT Genre, COUNT(*) AS TitleCount
FROM   Titles
WHERE  Genre IS NOT NULL
GROUP BY Genre
HAVING COUNT(*) >= 2;

-- Titlurile care au mai mult de un exemplar fizic
SELECT TitleID, COUNT(*) AS CopyCount
FROM   Books
GROUP BY TitleID
HAVING COUNT(*) > 1;
```

---

## GROUP BY cu JOIN-uri

### Exemplul 1 — Numărul de cărți pe gen (cu numele genului)

```sql
SELECT
    t.Genre,
    COUNT(b.BookID)    AS TotalCopies,
    COUNT(DISTINCT t.TitleID) AS UniqueTitles
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  t.Genre IS NOT NULL
GROUP BY t.Genre
ORDER BY TotalCopies DESC;
```

### Exemplul 2 — Numărul de împrumuturi pe client, cu numele clientului

```sql
SELECT
    cl.FirstName + ' ' + cl.LastName AS ClientName,
    COUNT(r.RentalID)                AS TotalRentals,
    SUM(r.RentalDays)                AS TotalDaysRented,
    MAX(r.RentalDate)                AS LastRentalDate
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalRentals DESC;
```

### Exemplul 3 — Cele mai împrumutate titluri, cu numele autorului (3 tabele)

```sql
SELECT
    t.Title,
    a.FirstName + ' ' + a.LastName AS Author,
    t.Genre,
    COUNT(r.RentalID)              AS TimesRented
FROM   Titles  AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
INNER JOIN Books   AS b ON t.TitleID  = b.TitleID
INNER JOIN Rentals AS r ON b.BookID   = r.BookID
GROUP BY t.TitleID, t.Title, a.FirstName, a.LastName, t.Genre
ORDER BY TimesRented DESC;
```

### Exemplul 4 — Activitatea lunară de împrumut, cu HAVING

```sql
SELECT
    YEAR(r.RentalDate)                   AS RentalYear,
    MONTH(r.RentalDate)                  AS RentalMonth,
    DATENAME(MONTH, r.RentalDate)        AS MonthName,
    COUNT(r.RentalID)                    AS RentalCount,
    COUNT(DISTINCT r.ClientID)           AS UniqueClients
FROM   Rentals AS r
GROUP BY YEAR(r.RentalDate), MONTH(r.RentalDate), DATENAME(MONTH, r.RentalDate)
HAVING COUNT(r.RentalID) >= 2
ORDER BY RentalYear, RentalMonth;
```

---

## Valori NULL în agregări

```sql
-- AVG ignoră valorile NULL — rezultatul se bazează doar pe rândurile non-NULL
SELECT AVG(CAST(PublishedYear AS DECIMAL)) AS AvgYear FROM Titles;
-- Sunt incluse doar titlurile la care PublishedYear NU este NULL

-- Pentru a trata valorile NULL ca 0 (sau altă valoare implicită):
SELECT AVG(ISNULL(CAST(PublishedYear AS DECIMAL), 0)) AS AvgYearWithZeros FROM Titles;

-- COUNT(*) numără TOATE rândurile; COUNT(coloană) omite valorile NULL
SELECT
    COUNT(*)           AS AllTitles,
    COUNT(PublishedYear) AS TitlesWithYear,
    COUNT(ISBN)          AS TitlesWithISBN
FROM Titles;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Numără totalul împrumuturilor din tabelul `Rentals`.

**Exercițiul 2 (Ușor)**
Găsește cea mai veche și cea mai recentă valoare `MembershipDate` din tabelul `Clients`.

**Exercițiul 3 (Ușor)**
Numără câte cărți sunt disponibile (IsAvailable = 1) și câte nu sunt.

**Exercițiul 4 (Mediu)**
Afișează numărul de exemplare fizice pe titlu (TitleID). Sortează descrescător după numărul de exemplare.

**Exercițiul 5 (Mediu)**
Listează toate genurile cu mai mult de un titlu. Afișează numele genului și numărul.

**Exercițiul 6 (Mediu)**
Afișează numărul total de împrumuturi și totalul zilelor de împrumut pe client. Include doar clienții cu cel puțin 2 împrumuturi.

**Exercițiul 7 (Mediu)**
Unește `Titles` și `Authors`, apoi afișează câte titluri a scris fiecare autor. Afișează numele complet al autorului și numărul de titluri. Sortează descrescător după număr.

**Exercițiul 8 (Dificil)**
Pentru fiecare gen, afișează numele genului, numărul de titluri unice, numărul total de exemplare fizice și anul mediu de publicare. Include genurile fără exemplare fizice (folosește LEFT JOIN). Sortează descrescător după numărul de titluri.

**Exercițiul 9 (Dificil)**
Afișează numele fiecărei edituri, împreună cu numărul de titluri distincte publicate și numărul de exemplare fizice. Include doar editurile care au publicat cel puțin 2 exemplare. Sortează descrescător după numărul de exemplare.

**Exercițiul 10 (Dificil)**
Pentru fiecare client care are împrumuturi nereturnate, afișează numele complet, numărul de cărți nereturnate și totalul zilelor de întârziere (folosește DATEDIFF între DueDate și data de azi, doar pentru împrumuturile întârziate). Sortează descrescător după totalul zilelor de întârziere.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT COUNT(*) AS TotalRentals FROM Rentals;
```

**Exercițiul 2**
```sql
SELECT MIN(MembershipDate) AS Earliest, MAX(MembershipDate) AS Latest FROM Clients;
```

**Exercițiul 3**
```sql
SELECT IsAvailable, COUNT(*) AS BookCount FROM Books GROUP BY IsAvailable;
```

**Exercițiul 4**
```sql
SELECT TitleID, COUNT(*) AS CopyCount FROM Books GROUP BY TitleID ORDER BY CopyCount DESC;
```

**Exercițiul 5**
```sql
SELECT Genre, COUNT(*) AS TitleCount FROM Titles WHERE Genre IS NOT NULL
GROUP BY Genre HAVING COUNT(*) > 1 ORDER BY TitleCount DESC;
```

**Exercițiul 6**
```sql
SELECT ClientID, COUNT(*) AS TotalRentals, SUM(RentalDays) AS TotalDays
FROM   Rentals
GROUP BY ClientID
HAVING COUNT(*) >= 2;
```

**Exercițiul 7**
```sql
SELECT a.FirstName + ' ' + a.LastName AS Author, COUNT(t.TitleID) AS TitleCount
FROM   Authors AS a
INNER JOIN Titles AS t ON a.AuthorID = t.AuthorID
GROUP BY a.AuthorID, a.FirstName, a.LastName
ORDER BY TitleCount DESC;
```

**Exercițiul 8**
```sql
SELECT t.Genre,
       COUNT(DISTINCT t.TitleID)   AS UniqueTitles,
       COUNT(b.BookID)             AS TotalCopies,
       AVG(CAST(t.PublishedYear AS DECIMAL)) AS AvgYear
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  t.Genre IS NOT NULL
GROUP BY t.Genre
ORDER BY UniqueTitles DESC;
```

**Exercițiul 9**
```sql
SELECT p.PublisherName,
       COUNT(DISTINCT b.TitleID) AS DistinctTitles,
       COUNT(b.BookID)           AS TotalCopies
FROM   Publishers AS p
INNER JOIN Books AS b ON p.PublisherID = b.PublisherID
GROUP BY p.PublisherID, p.PublisherName
HAVING COUNT(b.BookID) >= 2
ORDER BY TotalCopies DESC;
```

**Exercițiul 10**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS ClientName,
       COUNT(r.RentalID) AS UnreturnedBooks,
       SUM(CASE WHEN r.DueDate < GETDATE()
                THEN DATEDIFF(DAY, r.DueDate, GETDATE())
                ELSE 0 END) AS TotalOverdueDays
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID
WHERE  r.ReturnDate IS NULL
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalOverdueDays DESC;
```
