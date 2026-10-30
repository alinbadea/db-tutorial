# Baza de date Library — Fișa de lucru 4: SELECT — Interogări de bază

## Obiective de învățare
- Extragerea datelor din tabelele individuale ale bibliotecii folosind SELECT
- Filtrarea înregistrărilor folosind WHERE cu diverși operatori
- Sortarea și limitarea rezultatelor
- Folosirea funcțiilor predefinite pentru șiruri de caractere și date calendaristice, relevante într-o bibliotecă

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
SELECT * FROM Authors;
SELECT * FROM Books;
SELECT * FROM Rentals;
```

---

## 2. Selectarea anumitor coloane

```sql
-- Rezumatul catalogului de cărți
SELECT TitleID, Title, Genre, PublishedYear, ISBN
FROM   Titles;

-- Activitatea de împrumut
SELECT RentalID, ClientID, BookID, RentalDate, DueDate, ReturnDate
FROM   Rentals;

-- Lista clienților
SELECT FirstName, LastName, Email, MembershipDate
FROM   Clients;
```

---

## 3. Aliasuri de coloane

```sql
SELECT
    FirstName + ' ' + LastName   AS AuthorName,
    Nationality                  AS Country,
    YEAR(GETDATE()) - YEAR(BirthDate) AS ApproximateAge
FROM Authors
WHERE BirthDate IS NOT NULL;

SELECT
    Title                        AS BookTitle,
    PublishedYear                AS YearPublished,
    ISBN                         AS [ISBN Number]
FROM Titles;
```

---

## 4. Coloane calculate

```sql
-- Câte zile durează fiecare împrumut?
SELECT
    RentalID,
    RentalDate,
    DueDate,
    RentalDays,
    DATEDIFF(DAY, RentalDate, DueDate) AS ActualPeriod
FROM Rentals;

-- Este cartea întârziată? (pentru împrumuturile nereturnate)
SELECT
    RentalID,
    DueDate,
    DATEDIFF(DAY, DueDate, GETDATE()) AS DaysOverdue
FROM Rentals
WHERE ReturnDate IS NULL
AND   DueDate < GETDATE();
```

---

## 5. Filtrarea cu WHERE

### Egalitate și inegalitate

```sql
-- Cărțile disponibile în prezent
SELECT BookID, TitleID, Condition FROM Books WHERE IsAvailable = 1;

-- Cărțile indisponibile (împrumutate în prezent)
SELECT BookID, TitleID FROM Books WHERE IsAvailable = 0;

-- Titlurile publicate după anul 2000
SELECT Title, PublishedYear FROM Titles WHERE PublishedYear > 2000;

-- Autorii care NU sunt britanici
SELECT FirstName, LastName, Nationality FROM Authors WHERE Nationality <> 'British';
```

### Operatori de comparație

```sql
-- Titlurile publicate înainte de 1960
SELECT Title, PublishedYear FROM Titles WHERE PublishedYear < 1960;

-- Împrumuturile cu termenul în următoarele 7 zile (încă nereturnate)
SELECT RentalID, BookID, DueDate
FROM   Rentals
WHERE  ReturnDate IS NULL
AND    DueDate <= DATEADD(DAY, 7, GETDATE());

-- Clienții înscriși pe 2023-06-01 sau după
SELECT FirstName, LastName, MembershipDate
FROM   Clients
WHERE  MembershipDate >= '2023-06-01';
```

### BETWEEN … AND

```sql
-- Titlurile publicate între 1990 și 2010
SELECT Title, PublishedYear
FROM   Titles
WHERE  PublishedYear BETWEEN 1990 AND 2010;

-- Împrumuturile făcute în ianuarie 2024
SELECT RentalID, ClientID, BookID, RentalDate
FROM   Rentals
WHERE  RentalDate BETWEEN '2024-01-01' AND '2024-01-31';
```

### IN

```sql
-- Autorii de anumite naționalități
SELECT FirstName, LastName, Nationality
FROM   Authors
WHERE  Nationality IN ('British', 'American', 'Swiss');

-- Cărțile aflate într-o anumită stare
SELECT BookID, TitleID, Condition
FROM   Books
WHERE  Condition IN ('New', 'Good');

-- Titlurile din genul Fiction sau Mystery
SELECT Title, Genre FROM Titles WHERE Genre IN ('Fiction', 'Mystery');
```

### LIKE

```sql
-- Titlurile care încep cu 'The'
SELECT Title, Genre FROM Titles WHERE Title LIKE 'The %';

-- Autorii al căror nume de familie începe cu 'M'
SELECT FirstName, LastName FROM Authors WHERE LastName LIKE 'M%';

-- Clienții cu o adresă Gmail
SELECT FirstName, LastName, Email FROM Clients WHERE Email LIKE '%@gmail.com';

-- Codurile ISBN care încep cu '978-01'
SELECT Title, ISBN FROM Titles WHERE ISBN LIKE '978-01%';

-- Autorii al căror nume de familie are exact 6 caractere
SELECT FirstName, LastName FROM Authors WHERE LastName LIKE '______';
```

### IS NULL / IS NOT NULL

```sql
-- Împrumuturile care nu au fost încă returnate
SELECT RentalID, ClientID, BookID, DueDate
FROM   Rentals
WHERE  ReturnDate IS NULL;

-- Autorii cu data nașterii cunoscută
SELECT FirstName, LastName, BirthDate
FROM   Authors
WHERE  BirthDate IS NOT NULL;

-- Titlurile fără ISBN înregistrat
SELECT Title, Genre FROM Titles WHERE ISBN IS NULL;
```

---

## 6. Combinarea condițiilor

```sql
-- Cărțile Technology publicate după 2000
SELECT Title, Genre, PublishedYear
FROM   Titles
WHERE  Genre = 'Technology'
AND    PublishedYear > 2000;

-- Titlurile Fiction SAU Mystery
SELECT Title, Genre FROM Titles
WHERE  Genre = 'Fiction' OR Genre = 'Mystery';

-- Cărțile disponibile, în stare Good sau New
SELECT BookID, TitleID, Condition
FROM   Books
WHERE  IsAvailable = 1
AND    Condition IN ('New', 'Good');

-- Împrumuturile întârziate (nereturnate și cu termenul depășit)
SELECT RentalID, ClientID, DueDate,
       DATEDIFF(DAY, DueDate, GETDATE()) AS DaysLate
FROM   Rentals
WHERE  ReturnDate IS NULL
AND    DueDate < GETDATE();
```

---

## 7. Sortarea cu ORDER BY

```sql
-- Titlurile sortate după anul publicării (cele mai vechi primele)
SELECT Title, PublishedYear FROM Titles ORDER BY PublishedYear ASC;

-- Clienții sortați alfabetic după numele de familie
SELECT FirstName, LastName, Email FROM Clients ORDER BY LastName ASC;

-- Cele mai recente împrumuturi primele
SELECT RentalID, RentalDate, DueDate FROM Rentals ORDER BY RentalDate DESC;

-- Cărțile sortate după gradul de uzură (ordine personalizată folosind CASE)
SELECT BookID, TitleID, Condition
FROM   Books
ORDER BY
    CASE Condition
        WHEN 'New'  THEN 1
        WHEN 'Good' THEN 2
        WHEN 'Fair' THEN 3
        WHEN 'Poor' THEN 4
    END;
```

---

## 8. Limitarea rezultatelor cu TOP

```sql
-- Cele mai recent achiziționate 3 cărți
SELECT TOP 3 BookID, TitleID, AcquisitionDate
FROM   Books
ORDER BY AcquisitionDate DESC;

-- Cele mai vechi 2 titluri din bibliotecă
SELECT TOP 2 Title, PublishedYear
FROM   Titles
ORDER BY PublishedYear ASC;

-- Primii 25% dintre clienți după vechimea ca membru
SELECT TOP 25 PERCENT FirstName, LastName, MembershipDate
FROM   Clients
ORDER BY MembershipDate ASC;
```

---

## 9. DISTINCT

```sql
-- Ce genuri există în catalog?
SELECT DISTINCT Genre FROM Titles ORDER BY Genre;

-- Ce naționalități sunt reprezentate printre autori?
SELECT DISTINCT Nationality FROM Authors WHERE Nationality IS NOT NULL ORDER BY Nationality;

-- Câți clienți distincți au făcut împrumuturi?
SELECT COUNT(DISTINCT ClientID) AS ActiveBorrowers FROM Rentals;
```

---

## 10. Funcții predefinite utile

```sql
-- Funcții pentru șiruri de caractere
SELECT
    UPPER(LastName)              AS UpperLastName,
    LOWER(FirstName)             AS LowerFirstName,
    LEN(Title)                   AS TitleLength,
    LEFT(Title, 20)              AS ShortTitle
FROM Titles;

-- Funcții pentru date calendaristice aplicate împrumuturilor
SELECT
    RentalID,
    RentalDate,
    DATEDIFF(DAY,  RentalDate, GETDATE()) AS DaysSinceRental,
    DATEADD(DAY, 7, DueDate)              AS ExtendedDueDate,
    YEAR(RentalDate)                      AS RentalYear,
    DATENAME(MONTH, RentalDate)           AS RentalMonth
FROM Rentals;

-- Tratarea valorilor NULL
SELECT
    RentalID,
    ISNULL(CAST(ReturnDate AS NVARCHAR(20)), 'Not returned') AS ReturnStatus
FROM Rentals;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Listează toate titlurile din genul `'Fiction'`, sortate alfabetic după titlu.

**Exercițiul 2 (Ușor)**
Afișează toate împrumuturile care nu au fost încă returnate (`ReturnDate IS NULL`). Afișează `RentalID`, `ClientID`, `BookID` și `DueDate`.

**Exercițiul 3 (Ușor)**
Găsește toți autorii care sunt `'British'`. Afișează numele complet și data nașterii.

**Exercițiul 4 (Mediu)**
Listează toate cărțile a căror stare este `'Fair'` sau `'Poor'` și care sunt încă disponibile (`IsAvailable = 1`).

**Exercițiul 5 (Mediu)**
Afișează toate titlurile publicate între 1940 și 1999. Sortează descrescător după `PublishedYear`.

**Exercițiul 6 (Mediu)**
Găsește toate împrumuturile cu o perioadă de exact 14 zile. Afișează `RentalID`, `RentalDate`, `DueDate` și `RentalDays`.

**Exercițiul 7 (Mediu)**
Listează toți clienții al căror email nu se termină cu `'@mail.com'`. Afișează numele complet și emailul.

**Exercițiul 8 (Mediu)**
Afișează cele mai recent achiziționate 3 cărți ale bibliotecii. Afișează `BookID`, `TitleID`, `AcquisitionDate` și `Condition`.

**Exercițiul 9 (Dificil)**
Pentru fiecare împrumut nereturnat, calculează și afișează `RentalID`, `BookID`, `DueDate` și `DaysOverdue` (folosește `DATEDIFF`). Afișează doar împrumuturile care sunt efectiv întârziate (termenul este în trecut). Sortează descrescător după `DaysOverdue`.

**Exercițiul 10 (Dificil)**
Afișează lista genurilor distincte din `Titles`, împreună cu numărul de titluri din fiecare gen. Folosește `COUNT` și `GROUP BY`. Sortează descrescător după număr.

---

## Răspunsuri

1. `SELECT Title, Genre FROM Titles WHERE Genre = 'Fiction' ORDER BY Title;`
2. `SELECT RentalID, ClientID, BookID, DueDate FROM Rentals WHERE ReturnDate IS NULL;`
3. `SELECT FirstName + ' ' + LastName AS FullName, BirthDate FROM Authors WHERE Nationality = 'British';`
4. `SELECT BookID, TitleID, Condition FROM Books WHERE Condition IN ('Fair','Poor') AND IsAvailable = 1;`
5. `SELECT Title, PublishedYear FROM Titles WHERE PublishedYear BETWEEN 1940 AND 1999 ORDER BY PublishedYear DESC;`
6. `SELECT RentalID, RentalDate, DueDate, RentalDays FROM Rentals WHERE RentalDays = 14;`
7. `SELECT FirstName + ' ' + LastName AS FullName, Email FROM Clients WHERE Email NOT LIKE '%@mail.com';`
8. `SELECT TOP 3 BookID, TitleID, AcquisitionDate, Condition FROM Books ORDER BY AcquisitionDate DESC;`
9. `SELECT RentalID, BookID, DueDate, DATEDIFF(DAY, DueDate, GETDATE()) AS DaysOverdue FROM Rentals WHERE ReturnDate IS NULL AND DueDate < GETDATE() ORDER BY DaysOverdue DESC;`
10. `SELECT Genre, COUNT(*) AS TitleCount FROM Titles WHERE Genre IS NOT NULL GROUP BY Genre ORDER BY TitleCount DESC;`
