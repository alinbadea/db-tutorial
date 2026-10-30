# Baza de date Library — Fișa de lucru 8: Instrucțiuni DELETE

## Obiective de învățare
- Ștergerea în siguranță a anumitor rânduri din tabelele bibliotecii folosind WHERE
- Respectarea ordinii corecte de ștergere impuse de FK în toate cele 6 tabele
- Folosirea DELETE cu JOIN-uri pentru a elimina rânduri pe baza condițiilor din tabele asociate
- Înțelegerea diferenței TRUNCATE vs DELETE și a modelului „soft delete”

---

## Sintaxa DELETE

```sql
DELETE FROM table_name
WHERE condition;
```

> **ATENȚIE:** Un DELETE fără clauza WHERE elimină **toate rândurile** din tabel. Verifică întotdeauna mai întâi cu un SELECT și ia în considerare includerea într-o tranzacție.

---

## Bună practică: previzualizează înainte de ștergere

```sql
-- Previzualizare: ce împrumuturi vor fi șterse?
SELECT * FROM Rentals WHERE ClientID = 5;

-- Apoi ștergem
DELETE FROM Rentals WHERE ClientID = 5;
```

---

## DELETE de bază — un singur rând

```sql
-- Eliminăm un anumit împrumut
DELETE FROM Rentals WHERE RentalID = 8;

-- Eliminăm un exemplar scos din uz
DELETE FROM Books WHERE BookID = 9;

-- Eliminăm un client care nu a împrumutat niciodată și dorește să fie șters
DELETE FROM Clients WHERE ClientID = 6;
```

---

## DELETE pe mai multe rânduri cu WHERE

### Clauza IN

```sql
-- Eliminăm toate împrumuturile anumitor clienți
DELETE FROM Rentals WHERE ClientID IN (4, 5);

-- Eliminăm toate cărțile în stare 'Poor'
DELETE FROM Books WHERE Condition = 'Poor';

-- Ștergem titlurile Fiction și Mystery
-- (sigur doar dacă niciun rând din Books nu referă aceste titluri)
DELETE FROM Titles WHERE Genre IN ('Fiction', 'Mystery');
```

### BETWEEN

```sql
-- Eliminăm împrumuturile dintr-un anumit interval de date
DELETE FROM Rentals
WHERE RentalDate BETWEEN '2024-01-01' AND '2024-01-15';
```

### LIKE

```sql
-- Eliminăm conturile de test ale clienților
DELETE FROM Clients
WHERE Email LIKE '%@test.com' OR Email LIKE '%@example.com';
```

### Condiții compuse

```sql
-- Eliminăm împrumuturile returnate mai vechi de 2 ani
DELETE FROM Rentals
WHERE  ReturnDate IS NOT NULL
AND    ReturnDate < DATEADD(YEAR, -2, GETDATE());
```

---

## DELETE cu subinterogare în WHERE

```sql
-- Eliminăm toate împrumuturile cărților scoase din uz (Condition = 'Poor')
DELETE FROM Rentals
WHERE BookID IN (
    SELECT BookID FROM Books WHERE Condition = 'Poor'
);

-- Eliminăm toate cărțile ale căror titluri nu mai există (nu sunt în catalog)
-- (Sigur doar dacă împrumuturile acelor cărți au fost eliminate înainte)
DELETE FROM Books
WHERE TitleID NOT IN (
    SELECT TitleID FROM Titles
);

-- Eliminăm clienții care nu au împrumutat niciodată și s-au înscris acum mai mult de 3 ani
DELETE FROM Clients
WHERE ClientID NOT IN (SELECT DISTINCT ClientID FROM Rentals)
AND   MembershipDate < DATEADD(YEAR, -3, GETDATE());
```

---

## DELETE cu JOIN (clauza FROM din T-SQL)

### Exemplul 1 — Ștergerea tuturor împrumuturilor pentru cărțile unui anumit autor

```sql
-- Previzualizare
SELECT r.RentalID, r.BookID, t.Title, a.LastName
FROM   Rentals AS r
INNER JOIN Books   AS b ON r.BookID   = b.BookID
INNER JOIN Titles  AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
WHERE  a.LastName = 'TestAuthor';

-- Ștergere
DELETE r
FROM   Rentals AS r
INNER JOIN Books   AS b ON r.BookID   = b.BookID
INNER JOIN Titles  AS t ON b.TitleID  = t.TitleID
INNER JOIN Authors AS a ON t.AuthorID = a.AuthorID
WHERE  a.LastName = 'TestAuthor';
```

### Exemplul 2 — Ștergerea tuturor împrumuturilor returnate pentru cărțile Technology

```sql
DELETE r
FROM   Rentals AS r
INNER JOIN Books  AS b ON r.BookID  = b.BookID
INNER JOIN Titles AS t ON b.TitleID = t.TitleID
WHERE  t.Genre = 'Technology'
AND    r.ReturnDate IS NOT NULL;
```

### Exemplul 3 — DELETE cu anti-join: eliminarea cărților care nu au fost împrumutate niciodată

```sql
-- Previzualizare
SELECT b.BookID, t.Title, b.Condition
FROM   Books AS b
LEFT JOIN Rentals AS r ON b.BookID = r.BookID
LEFT JOIN Titles  AS t ON b.TitleID = t.TitleID
WHERE  r.RentalID IS NULL;

-- Ștergere
DELETE b
FROM   Books AS b
LEFT JOIN Rentals AS r ON b.BookID = r.BookID
WHERE  r.RentalID IS NULL;
```

---

## Respectarea constrângerilor de cheie străină

Nu poți șterge un rând părinte dacă există încă rânduri copil care îl referă. Ordinea corectă de ștergere pentru LibraryDB este:

```
1. Rentals           (referă Clients și Books)
2. Books             (referă Titles și Publishers)
3. Titles            (referă Authors)
4. Clients           (nu mai are rânduri copil — se poate șterge în siguranță)
5. Publishers        (nu mai are rânduri copil — se poate șterge în siguranță)
6. Authors           (nu mai are rânduri copil — se poate șterge în siguranță)
```

### Eliminarea completă a unui client și a întregului său istoric

```sql
-- Pasul 1: eliminăm împrumuturile clientului
DELETE FROM Rentals WHERE ClientID = 2;

-- Pasul 2: acum putem elimina clientul în siguranță
DELETE FROM Clients WHERE ClientID = 2;
```

### Eliminarea unui titlu și a tuturor exemplarelor sale fizice

```sql
-- Pasul 1: eliminăm împrumuturile care referă orice exemplar al acestui titlu
DELETE r
FROM   Rentals AS r
INNER JOIN Books AS b ON r.BookID = b.BookID
WHERE  b.TitleID = 3;

-- Pasul 2: eliminăm exemplarele fizice
DELETE FROM Books WHERE TitleID = 3;

-- Pasul 3: acum putem elimina titlul în siguranță
DELETE FROM Titles WHERE TitleID = 3;
```

---

## TRUNCATE TABLE vs DELETE

| Caracteristică | DELETE | TRUNCATE |
|---|---|---|
| Clauza WHERE | Suportată | Nesuportată (elimină toate rândurile) |
| Viteză | Mai lent (jurnalizare la nivel de rând) | Mai rapid (jurnalizare minimă) |
| Resetează contorul IDENTITY | Nu | Da |
| Poate fi anulat (rollback) | Da (într-o tranzacție) | Da (într-o tranzacție) |
| Funcționează cu referințe FK | Da (dacă rândurile copil sunt șterse înainte) | Nu (eșuează dacă există referințe FK) |
| Declanșează triggerele DELETE | Da | Nu |

```sql
-- DELETE pe anumite rânduri
DELETE FROM Rentals WHERE RentalDate < '2020-01-01';

-- TRUNCATE elimină TOATE rândurile și resetează IDENTITY
-- Eșuează dacă Books este referit de FK-ul din Rentals
TRUNCATE TABLE Rentals;   -- OK — Rentals nu este referit de alte tabele
TRUNCATE TABLE Books;     -- EROARE, deoarece Rentals referă Books
```

---

## DELETE cu clauza OUTPUT

```sql
-- Arhivăm împrumuturile șterse înainte de a le elimina
DECLARE @ArchivedRentals TABLE (
    RentalID   INT,
    ClientID   INT,
    BookID     INT,
    RentalDate DATE,
    ReturnDate DATE
);

DELETE FROM Rentals
OUTPUT DELETED.RentalID, DELETED.ClientID, DELETED.BookID,
       DELETED.RentalDate, DELETED.ReturnDate
INTO   @ArchivedRentals
WHERE  ReturnDate IS NOT NULL
AND    ReturnDate < DATEADD(YEAR, -1, GETDATE());

SELECT * FROM @ArchivedRentals;
```

---

## Modelul „Soft Delete”

În loc să ștergi fizic rândurile, marchează-le ca inactive:

```sql
-- Adăugăm indicatorul IsActive
ALTER TABLE Clients ADD IsActive BIT NOT NULL DEFAULT 1;

-- „Ștergem” un client (îl dezactivăm)
UPDATE Clients SET IsActive = 0 WHERE ClientID = 3;

-- Interogare: afișăm doar clienții activi
SELECT * FROM Clients WHERE IsActive = 1;
```

**Compromisuri:** Istoricul este păstrat, iar înregistrările pot fi reactivate. Toate interogările trebuie să filtreze după `IsActive = 1`.

---

## Tranzacții pentru siguranță

```sql
BEGIN TRANSACTION;

-- Eliminăm complet titlul cu TitleID = 4 și toate datele sale
DELETE r
FROM   Rentals AS r
INNER JOIN Books AS b ON r.BookID = b.BookID
WHERE  b.TitleID = 4;

DELETE FROM Books WHERE TitleID = 4;
DELETE FROM Titles WHERE TitleID = 4;

-- Verificăm
SELECT * FROM Titles WHERE TitleID = 4;
SELECT * FROM Books  WHERE TitleID = 4;

COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION dacă ceva pare greșit
```

---

## Exerciții practice

**Exercițiul 1**
Șterge împrumutul cu `RentalID = 7`.

**Exercițiul 2**
Șterge toate împrumuturile la care cartea a fost returnată acum mai mult de 6 luni.

**Exercițiul 3**
Folosind o subinterogare în WHERE, șterge toate cărțile a căror stare este `'Poor'` și care nu au împrumuturi active (nereturnate).

**Exercițiul 4**
Scrie secvența corectă pentru a elimina complet un client (`ClientID = 4`) și toate împrumuturile asociate.

**Exercițiul 5**
Folosind `DELETE ... FROM ... JOIN`, elimină toate împrumuturile clienților al căror email se termină cu `'@test.com'`.

**Exercițiul 6**
Folosind `DELETE ... FROM ... JOIN`, elimină toate exemplarele (din `Books`) ale titlurilor publicate înainte de 1950. Asigură-te că ștergi mai întâi toate rândurile asociate din `Rentals`.

**Exercițiul 7**
Folosind `DELETE` cu `OUTPUT`, elimină toate împrumuturile întârziate cu mai mult de 60 de zile (nereturnate și cu DueDate mai vechi de 60 de zile). Capturează rândurile șterse într-o variabilă de tip tabel și afișează-le.

**Exercițiul 8**
Explică diferența dintre `DELETE FROM Rentals` și `TRUNCATE TABLE Rentals`. Când ai folosi fiecare variantă? Ce se întâmplă cu contorul IDENTITY în fiecare caz? De ce ar eșua `TRUNCATE TABLE Books` în această bază de date?
