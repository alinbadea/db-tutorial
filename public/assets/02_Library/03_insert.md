# Baza de date Library — Fișa de lucru 3: Instrucțiuni INSERT

## Obiective de învățare
- Scrierea instrucțiunilor INSERT pentru baza de date Library, folosind toate formele principale din T-SQL
- Popularea tabelelor în ordinea corectă, care respectă cheile străine
- Folosirea INSERT...SELECT pentru a copia sau a deriva rânduri
- Obținerea ID-urilor generate automat cu SCOPE_IDENTITY() și OUTPUT

---

## Sintaxa INSERT

```sql
INSERT INTO table_name (column1, column2, ...)
VALUES (value1, value2, ...);
```

---

## Metoda 1: INSERT fără listă de coloane

```sql
-- Inserăm un autor fără a specifica numele coloanelor
-- Valorile trebuie să respecte exact ordinea coloanelor (fără coloana IDENTITY)
INSERT INTO Authors
VALUES ('Agatha', 'Christie', 'British', '1890-09-15');
```

> **Atenție:** Dacă schema tabelului se schimbă (se adaugă sau se reordonează o coloană), acest INSERT va eșua sau va insera datele în coloanele greșite. Preferă întotdeauna forma cu listă de coloane.

---

## Metoda 2: INSERT cu listă de coloane (bună practică)

```sql
INSERT INTO Authors (FirstName, LastName, Nationality, BirthDate)
VALUES ('Agatha', 'Christie', 'British', '1890-09-15');
```

Coloanele care acceptă NULL pot fi omise — primesc automat NULL:

```sql
-- Inserăm un autor fără BirthDate
INSERT INTO Authors (FirstName, LastName, Nationality)
VALUES ('Anonymous', 'Author', NULL);
```

---

## Metoda 3: Inserarea mai multor rânduri într-o singură instrucțiune

```sql
INSERT INTO Authors (FirstName, LastName, Nationality, BirthDate)
VALUES
    ('Robert',  'Martin', 'American', '1952-12-05'),
    ('David',   'Thomas', 'British',  NULL),
    ('Erich',   'Gamma',  'Swiss',    '1961-03-13'),
    ('George',  'Orwell', 'British',  '1903-06-25'),
    ('J.K.',    'Rowling','British',  '1965-07-31');
```

---

## Metoda 4: INSERT … SELECT

Inserează date obținute dintr-o interogare existentă:

```sql
-- Copiem toate titlurile din genul Technology într-un tabel de arhivă
INSERT INTO TitlesArchive (Title, AuthorID, Genre, ISBN)
SELECT Title, AuthorID, Genre, ISBN
FROM   Titles
WHERE  Genre = 'Technology';
```

Folosirea unui CTE pentru a pregăti datele înainte de inserare:

```sql
-- Înregistrăm toate împrumuturile întârziate ca un lot nou în tabelul OverdueLog
WITH Overdue AS (
    SELECT RentalID, ClientID, BookID, DueDate,
           DATEDIFF(DAY, DueDate, GETDATE()) AS DaysLate
    FROM   Rentals
    WHERE  ReturnDate IS NULL
    AND    DueDate < GETDATE()
)
INSERT INTO OverdueLog (RentalID, ClientID, BookID, DueDate, DaysLate)
SELECT RentalID, ClientID, BookID, DueDate, DaysLate
FROM   Overdue;
```

---

## Coloane IDENTITY

`IDENTITY(1,1)` generează automat cheia primară. Nu o include niciodată într-un INSERT.

```sql
-- Corect: AuthorID este omis
INSERT INTO Authors (FirstName, LastName, Nationality)
VALUES ('Tolkien', 'John Ronald Reuel', 'British');

-- Obținem ID-ul generat
SELECT SCOPE_IDENTITY() AS NewAuthorID;    -- recomandat
SELECT @@IDENTITY;                          -- ultimul ID din această sesiune (orice domeniu)
SELECT IDENT_CURRENT('Authors');            -- ultimul ID inserat în Authors, de oricine
```

---

## SET IDENTITY_INSERT

Se folosește pentru a insera o anumită valoare de ID (de ex., la migrarea datelor):

```sql
SET IDENTITY_INSERT Authors ON;

INSERT INTO Authors (AuthorID, FirstName, LastName, Nationality)
VALUES (99, 'Test', 'Author', 'Unknown');

SET IDENTITY_INSERT Authors OFF;
```

---

## INSERT cu clauza OUTPUT

Capturăm imediat valoarea BookID generată automat:

```sql
DECLARE @NewBooks TABLE (BookID INT, TitleID INT, PublisherID INT);

INSERT INTO Books (TitleID, PublisherID, AcquisitionDate, Condition, IsAvailable)
OUTPUT INSERTED.BookID, INSERTED.TitleID, INSERTED.PublisherID
INTO   @NewBooks
VALUES (1, 1, '2024-01-05', 'New', 1),
       (1, 2, '2024-01-06', 'Good', 1);

SELECT * FROM @NewBooks;
```

---

## Script complet cu date de exemplu

Inserează datele într-o ordine sigură față de cheile străine: Authors → Publishers → Titles → Books → Clients → Rentals.

```sql
USE LibraryDB;
GO

-- ===========================
-- Authors (6 rânduri)
-- ===========================
INSERT INTO Authors (FirstName, LastName, Nationality, BirthDate)
VALUES
    ('Robert',  'Martin',  'American', '1952-12-05'),
    ('David',   'Thomas',  'British',  NULL),
    ('Erich',   'Gamma',   'Swiss',    '1961-03-13'),
    ('George',  'Orwell',  'British',  '1903-06-25'),
    ('J.K.',    'Rowling', 'British',  '1965-07-31'),
    ('Agatha',  'Christie','British',  '1890-09-15');
GO

-- ===========================
-- Publishers (5 rânduri)
-- ===========================
INSERT INTO Publishers (PublisherName, Address, Phone, Email)
VALUES
    ('Prentice Hall',    '1 Lake Street, Upper Saddle River, NJ',    '201-555-0100', 'info@ph.com'),
    ('Addison-Wesley',   '75 Arlington Street, Boston, MA',          '617-555-0200', 'info@aw.com'),
    ('O''Reilly Media',  '1005 Gravenstein Highway N, Sebastopol, CA','707-555-0300', 'info@oreilly.com'),
    ('Penguin Books',    '80 Strand, London, UK',                    '020-555-0400', 'info@penguin.com'),
    ('Bloomsbury',       '50 Bedford Square, London, UK',            '020-555-0500', 'info@bloomsbury.com');
GO

-- ===========================
-- Titles (6 rânduri)
-- ===========================
INSERT INTO Titles (Title, AuthorID, Genre, PublishedYear, ISBN)
VALUES
    ('Clean Code',                   1, 'Technology', 2008, '978-0132350884'),
    ('The Pragmatic Programmer',     2, 'Technology', 2019, '978-0135957059'),
    ('Design Patterns',              3, 'Technology', 1994, '978-0201633610'),
    ('1984',                         4, 'Fiction',    1949, '978-0141036144'),
    ('Harry Potter and the Sorcerer''s Stone', 5, 'Fiction', 1997, '978-0439708180'),
    ('Murder on the Orient Express', 6, 'Mystery',    1934, '978-0062693662');
GO

-- ===========================
-- Books (9 exemplare fizice)
-- ===========================
INSERT INTO Books (TitleID, PublisherID, AcquisitionDate, Condition, IsAvailable)
VALUES
    (1, 1, '2022-03-10', 'Good',  1),   -- Clean Code exemplarul 1 — Prentice Hall
    (1, 3, '2023-06-15', 'New',   1),   -- Clean Code exemplarul 2 — O'Reilly
    (2, 2, '2022-01-20', 'Good',  1),   -- Pragmatic Programmer — Addison-Wesley
    (3, 2, '2021-09-05', 'Fair',  1),   -- Design Patterns — Addison-Wesley
    (4, 4, '2020-11-12', 'Good',  1),   -- 1984 — Penguin
    (4, 4, '2023-02-28', 'New',   1),   -- 1984 exemplarul 2 — Penguin
    (5, 5, '2022-08-01', 'Good',  1),   -- Harry Potter — Bloomsbury
    (6, 4, '2021-05-17', 'Fair',  1),   -- Orient Express — Penguin
    (2, 1, '2024-01-03', 'New',   1);   -- Pragmatic Programmer exemplarul 2 — Prentice Hall
GO

-- ===========================
-- Clients (6 rânduri)
-- ===========================
INSERT INTO Clients (FirstName, LastName, Email, Phone, Address, MembershipDate)
VALUES
    ('Maria',   'Popescu',   'maria.pop@mail.com',     '555-0101', 'Str. Florilor 12, Bucharest',  '2023-01-15'),
    ('Ion',     'Ionescu',   'ion.ionescu@mail.com',   '555-0202', 'Bd. Unirii 34, Bucharest',     '2023-03-22'),
    ('Ana',     'Dumitrescu','ana.d@mail.com',          '555-0303', 'Calea Victoriei 5, Bucharest', '2022-11-08'),
    ('Mihai',   'Constantin','mihai.c@mail.com',        '555-0404', 'Str. Rosetti 7, Bucharest',   '2023-07-30'),
    ('Elena',   'Radu',      'elena.radu@mail.com',     '555-0505', 'Aleea Trandafirilor 2, Cluj', '2024-01-05'),
    ('Andrei',  'Stan',      'andrei.stan@mail.com',    '555-0606', 'Str. Mihai Viteazu 9, Iasi',  '2023-09-14');
GO

-- ===========================
-- Rentals (8 rânduri)
-- ===========================
INSERT INTO Rentals (ClientID, BookID, RentalDate, DueDate, ReturnDate, RentalDays)
VALUES
    (1, 1, '2024-01-10', '2024-01-24', '2024-01-20', 14),  -- Maria a împrumutat Clean Code (exemplarul 1) — returnată
    (2, 3, '2024-01-11', '2024-01-25', NULL,           14),  -- Ion a împrumutat Pragmatic Programmer — încă împrumutată
    (1, 4, '2024-01-12', '2024-01-19', '2024-01-17',  7),   -- Maria a împrumutat Design Patterns — returnată
    (3, 5, '2024-01-14', '2024-01-28', NULL,           14),  -- Ana a împrumutat 1984 — încă împrumutată
    (4, 7, '2024-01-15', '2024-01-22', '2024-01-21',  7),   -- Mihai a împrumutat Harry Potter — returnată
    (1, 8, '2024-01-17', '2024-01-31', NULL,           14),  -- Maria a împrumutat Orient Express — încă împrumutată
    (2, 2, '2024-01-18', '2024-01-25', '2024-01-24',  7),   -- Ion a împrumutat Clean Code (exemplarul 2) — returnată
    (5, 6, '2024-01-20', '2024-02-03', NULL,           14);  -- Elena a împrumutat 1984 (exemplarul 2) — încă împrumutată
GO
```

---

## Exerciții practice

**Exercițiul 1**
Inserează un autor nou: `'Leo Tolstoy'`, rus (Russian), născut pe `'1828-09-09'`. Obține imediat valoarea `AuthorID` generată.

**Exercițiul 2**
Într-o singură instrucțiune `INSERT`, adaugă două titluri noi ale aceluiași autor (folosește autorul din Exercițiul 1): „War and Peace” (Fiction, 1869, ISBN: `978-1400079988`) și „Anna Karenina” (Fiction, 1878, ISBN: `978-0143035008`).

**Exercițiul 3**
Adaugă trei exemplare fizice din „War and Peace” (din Exercițiul 2) — unul de la Penguin Books (Condition: New), unul de la Penguin Books (Condition: Good) și unul de la O'Reilly Media (Condition: Fair). Folosește un singur INSERT cu mai multe rânduri.

**Exercițiul 4**
Folosind `INSERT ... SELECT`, inserează într-un tabel `LongRentals` (cu aceeași structură ca `Rentals`) toate împrumuturile la care `RentalDays >= 14` și cartea nu a fost încă returnată.

**Exercițiul 5**
Folosind `INSERT` cu `OUTPUT`, adaugă un împrumut nou pentru `ClientID = 3`, `BookID = 9`, cu data de azi și termen de returnare peste 7 zile. Capturează și afișează valoarea `RentalID` nou generată.
