# Baza de date Library — Fișa de lucru 5: SELECT — JOIN-uri

## Obiective de învățare
- Unirea mai multor tabele ale bibliotecii pentru a răspunde la întrebări reale
- Diferențierea între INNER JOIN, LEFT JOIN, RIGHT JOIN și FULL OUTER JOIN
- Găsirea înregistrărilor lipsă sau neasociate folosind modelul anti-join
- Scrierea de interogări eficiente pe mai multe tabele folosind aliasuri de tabel

---

## De ce JOIN-uri?

Baza de date Library stochează datele asociate în tabele separate. Pentru a afișa o fișă completă de împrumut (cine a împrumutat ce exemplar, ce titlu, de ce autor, de la ce editură), trebuie să unim șase tabele. JOIN-urile reconstruiesc imaginea completă în momentul interogării, fără a duplica datele.

---

## Tipuri de JOIN — Prezentare generală

| JOIN | Returnează |
|---|---|
| `INNER JOIN` | Rândurile care au corespondent în ambele tabele |
| `LEFT JOIN` | Toate din stânga + corespondentele din dreapta (NULL dacă nu există corespondent) |
| `RIGHT JOIN` | Toate din dreapta + corespondentele din stânga (NULL dacă nu există corespondent) |
| `FULL OUTER JOIN` | Toate rândurile din ambele tabele, cu NULL pe partea fără corespondent |

---

## Aliasuri de tabel

```sql
-- Fără aliasuri (prea lung)
SELECT Titles.Title, Authors.FirstName, Authors.LastName
FROM   Titles
INNER JOIN Authors ON Titles.AuthorID = Authors.AuthorID;

-- Cu aliasuri (recomandat)
SELECT t.Title, a.FirstName, a.LastName
FROM   Titles  AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID;
```

---

## INNER JOIN

### Exemplul 1 — Titlurile cu numele complet al autorului

```sql
SELECT
    t.TitleID,
    t.Title,
    a.FirstName + ' ' + a.LastName AS Author,
    a.Nationality,
    t.Genre,
    t.PublishedYear
FROM   Titles  AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
ORDER BY t.Title;
```

### Exemplul 2 — Exemplarele fizice cu titlul și editura

```sql
SELECT
    b.BookID,
    t.Title,
    p.PublisherName,
    b.Condition,
    b.IsAvailable,
    b.AcquisitionDate
FROM   Books       AS b
INNER JOIN Titles    AS t ON b.TitleID     = t.TitleID
INNER JOIN Publishers AS p ON b.PublisherID = p.PublisherID
ORDER BY t.Title, b.BookID;
```

### Exemplul 3 — Istoricul împrumuturilor cu toate detaliile (4 tabele)

```sql
SELECT
    r.RentalID,
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    t.Title,
    a.FirstName + ' ' + a.LastName    AS Author,
    r.RentalDate,
    r.DueDate,
    r.ReturnDate,
    r.RentalDays
FROM   Rentals AS r
INNER JOIN Clients    AS cl ON r.ClientID    = cl.ClientID
INNER JOIN Books      AS b  ON r.BookID      = b.BookID
INNER JOIN Titles     AS t  ON b.TitleID     = t.TitleID
INNER JOIN Authors    AS a  ON t.AuthorID    = a.AuthorID
ORDER BY r.RentalDate DESC;
```

### Exemplul 4 — Fișa completă (toate cele 6 tabele)

```sql
SELECT
    r.RentalID,
    cl.FirstName + ' ' + cl.LastName  AS ClientName,
    t.Title,
    a.FirstName + ' ' + a.LastName    AS Author,
    p.PublisherName,
    b.Condition,
    r.RentalDate,
    r.DueDate,
    ISNULL(CAST(r.ReturnDate AS NVARCHAR(20)), 'Not returned') AS ReturnDate,
    r.RentalDays
FROM   Rentals     AS r
INNER JOIN Clients     AS cl ON r.ClientID    = cl.ClientID
INNER JOIN Books       AS b  ON r.BookID      = b.BookID
INNER JOIN Titles      AS t  ON b.TitleID     = t.TitleID
INNER JOIN Authors     AS a  ON t.AuthorID    = a.AuthorID
INNER JOIN Publishers  AS p  ON b.PublisherID = p.PublisherID
ORDER BY r.RentalDate DESC;
```

---

## LEFT OUTER JOIN

### Exemplul 1 — Clienții și împrumuturile lor (inclusiv clienții care nu au împrumutat niciodată)

```sql
SELECT
    cl.ClientID,
    cl.FirstName + ' ' + cl.LastName AS ClientName,
    cl.MembershipDate,
    r.RentalID,
    r.RentalDate
FROM   Clients AS cl
LEFT JOIN Rentals AS r ON cl.ClientID = r.ClientID
ORDER BY cl.ClientID;
```

Clienții fără împrumuturi apar cu NULL în coloanele de împrumut.

### Exemplul 2 — Titlurile cu exemplarele lor fizice (inclusiv titlurile fără exemplare)

```sql
SELECT
    t.Title,
    t.Genre,
    b.BookID,
    b.Condition,
    b.IsAvailable
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
ORDER BY t.Title, b.BookID;
```

### Anti-join — Găsirea clienților care NU au împrumutat NICIODATĂ o carte

```sql
SELECT cl.ClientID, cl.FirstName + ' ' + cl.LastName AS ClientName, cl.Email
FROM   Clients AS cl
LEFT JOIN Rentals AS r ON cl.ClientID = r.ClientID
WHERE  r.RentalID IS NULL;
```

### Anti-join — Găsirea titlurilor care nu au exemplare fizice în bibliotecă

```sql
SELECT t.TitleID, t.Title, t.Genre
FROM   Titles AS t
LEFT JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  b.BookID IS NULL;
```

---

## RIGHT OUTER JOIN

```sql
-- Toate editurile, inclusiv cele ale căror cărți nu se află în bibliotecă
SELECT
    p.PublisherName,
    b.BookID,
    t.Title
FROM   Books       AS b
RIGHT JOIN Publishers AS p ON b.PublisherID = p.PublisherID
LEFT  JOIN Titles     AS t ON b.TitleID     = t.TitleID
ORDER BY p.PublisherName;
```

---

## FULL OUTER JOIN

```sql
-- Toate titlurile și toate cărțile — afișăm și rândurile fără corespondent din ambele părți
SELECT
    t.Title,
    b.BookID,
    b.Condition
FROM   Titles AS t
FULL OUTER JOIN Books AS b ON t.TitleID = b.TitleID
ORDER BY t.Title;
```

---

## Unirea celor 6 tabele

O vedere cuprinzătoare a catalogului, care afișează fiecare carte fizică, titlul, autorul și editura sa:

```sql
SELECT
    b.BookID,
    t.Title,
    a.FirstName + ' ' + a.LastName AS Author,
    a.Nationality,
    p.PublisherName,
    t.Genre,
    t.PublishedYear,
    b.AcquisitionDate,
    b.Condition,
    CASE b.IsAvailable WHEN 1 THEN 'Available' ELSE 'Rented Out' END AS Status
FROM   Books      AS b
INNER JOIN Titles     AS t ON b.TitleID     = t.TitleID
INNER JOIN Authors    AS a ON t.AuthorID    = a.AuthorID
INNER JOIN Publishers AS p ON b.PublisherID = p.PublisherID
ORDER BY t.Title, b.BookID;
```

---

## Greșeli frecvente

```sql
-- GREȘEALĂ: Nume de coloană ambiguu — ambele tabele au 'ClientID'
SELECT ClientID, Email     -- din ce tabel? SQL Server va da eroare
FROM   Clients
INNER JOIN Rentals ON Clients.ClientID = Rentals.ClientID;

-- CORECTARE: calificăm întotdeauna cu aliasul
SELECT cl.ClientID, cl.Email
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID;

-- GREȘEALĂ: JOIN pe coloana greșită
-- Books.TitleID corespunde cu Titles.TitleID — nu cu Books.BookID!
SELECT t.Title, b.BookID
FROM   Titles AS t
INNER JOIN Books AS b ON t.TitleID = b.BookID;  -- GREȘIT!

-- CORECT
INNER JOIN Books AS b ON t.TitleID = b.TitleID;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Listează toate cărțile (exemplarele fizice) cu titlul și numele complet al autorului. Afișează `BookID`, `Title`, `AuthorName` și `Condition`.

**Exercițiul 2 (Ușor)**
Afișează toate împrumuturile cu numele complet al clientului. Afișează `RentalID`, `ClientName`, `BookID`, `RentalDate` și `ReturnDate`.

**Exercițiul 3 (Mediu)**
Găsește toți clienții care **nu au împrumutat niciodată** o carte. Afișează numele complet și data înscrierii.

**Exercițiul 4 (Mediu)**
Afișează toate titlurile care au cel puțin un exemplar fizic, împreună cu numărul de exemplare disponibile. Grupează după titlu. (Indiciu: unește Titles și Books, filtrează IsAvailable = 1.)

**Exercițiul 5 (Mediu)**
Listează toate împrumuturile nereturnate în prezent, cu: numele complet al clientului, titlul cărții, numele complet al autorului, data împrumutului, termenul de returnare și numărul de zile de întârziere (dacă termenul a trecut, altfel 0).

**Exercițiul 6 (Mediu)**
Afișează toate titlurile din genul `'Technology'`, împreună cu naționalitatea autorului lor. Folosește un INNER JOIN între Titles și Authors.

**Exercițiul 7 (Dificil)**
Pentru fiecare client, afișează numele complet, de câte ori a împrumutat cărți, data celui mai recent împrumut și dacă are în prezent vreo carte nereturnată (afișează 'Yes'/'No').

**Exercițiul 8 (Dificil)**
Afișează toate cărțile care au fost împrumutate de mai multe ori. Afișează `BookID`, `Title`, `Author` și `RentalCount`. Sortează descrescător după `RentalCount`.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT b.BookID, t.Title, a.FirstName + ' ' + a.LastName AS AuthorName, b.Condition
FROM   Books   AS b
INNER JOIN Titles  AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID;
```

**Exercițiul 2**
```sql
SELECT r.RentalID, cl.FirstName + ' ' + cl.LastName AS ClientName,
       r.BookID, r.RentalDate, r.ReturnDate
FROM   Rentals AS r
INNER JOIN Clients AS cl ON r.ClientID = cl.ClientID;
```

**Exercițiul 3**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName, cl.MembershipDate
FROM   Clients AS cl
LEFT JOIN Rentals AS r ON cl.ClientID = r.ClientID
WHERE  r.RentalID IS NULL;
```

**Exercițiul 4**
```sql
SELECT t.Title, COUNT(b.BookID) AS AvailableCopies
FROM   Titles AS t
INNER JOIN Books AS b ON t.TitleID = b.TitleID
WHERE  b.IsAvailable = 1
GROUP BY t.TitleID, t.Title
ORDER BY AvailableCopies DESC;
```

**Exercițiul 5**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS ClientName,
       t.Title, a.FirstName + ' ' + a.LastName AS Author,
       r.RentalDate, r.DueDate,
       CASE WHEN r.DueDate < GETDATE() THEN DATEDIFF(DAY, r.DueDate, GETDATE()) ELSE 0 END AS DaysOverdue
FROM   Rentals AS r
INNER JOIN Clients  AS cl ON r.ClientID  = cl.ClientID
INNER JOIN Books    AS b  ON r.BookID    = b.BookID
INNER JOIN Titles   AS t  ON b.TitleID  = t.TitleID
INNER JOIN Authors  AS a  ON t.AuthorID = a.AuthorID
WHERE  r.ReturnDate IS NULL
ORDER BY DaysOverdue DESC;
```

**Exercițiul 6**
```sql
SELECT t.Title, t.Genre, a.FirstName + ' ' + a.LastName AS Author, a.Nationality
FROM   Titles AS t
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
WHERE  t.Genre = 'Technology';
```

**Exercițiul 7**
```sql
SELECT cl.FirstName + ' ' + cl.LastName AS FullName,
       COUNT(r.RentalID) AS TotalRentals,
       MAX(r.RentalDate) AS LastRentalDate,
       CASE WHEN SUM(CASE WHEN r.ReturnDate IS NULL THEN 1 ELSE 0 END) > 0
            THEN 'Yes' ELSE 'No' END AS HasUnreturnedBook
FROM   Clients AS cl
INNER JOIN Rentals AS r ON cl.ClientID = r.ClientID
GROUP BY cl.ClientID, cl.FirstName, cl.LastName
ORDER BY TotalRentals DESC;
```

**Exercițiul 8**
```sql
SELECT b.BookID, t.Title, a.FirstName + ' ' + a.LastName AS Author,
       COUNT(r.RentalID) AS RentalCount
FROM   Books AS b
INNER JOIN Titles   AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors  AS a ON t.AuthorID = a.AuthorID
INNER JOIN Rentals  AS r ON b.BookID   = r.BookID
GROUP BY b.BookID, t.Title, a.FirstName, a.LastName
HAVING COUNT(r.RentalID) > 1
ORDER BY RentalCount DESC;
```
