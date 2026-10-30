# Baza de date Library — Fișa de lucru 7: Instrucțiuni UPDATE

## Obiective de învățare
- Scrierea instrucțiunilor UPDATE pentru a modifica în siguranță datele bibliotecii
- Folosirea subinterogărilor și a JOIN-urilor în UPDATE pentru a modifica rânduri pe baza datelor din tabele asociate
- Capturarea istoricului modificărilor (audit) cu clauza OUTPUT
- Aplicarea tranzacțiilor pentru actualizări în lot sigure

---

## Sintaxa UPDATE

```sql
UPDATE table_name
SET    column1 = value1,
       column2 = value2
WHERE  condition;
```

> **ATENȚIE:** Fără clauza WHERE, fiecare rând din tabel este actualizat. Previzualizează întotdeauna mai întâi cu un SELECT.

---

## Bună practică: previzualizează înainte de actualizare

```sql
-- Previzualizăm ce cărți vor fi marcate ca indisponibile
SELECT BookID, IsAvailable FROM Books WHERE TitleID = 1;

-- Apoi actualizăm
UPDATE Books SET IsAvailable = 0 WHERE TitleID = 1;
```

---

## UPDATE de bază — o singură coloană

```sql
-- Corectăm numărul de telefon al unui client
UPDATE Clients
SET    Phone = '555-9999'
WHERE  ClientID = 3;

-- Actualizăm starea unei cărți după verificare
UPDATE Books
SET    Condition = 'Fair'
WHERE  BookID = 4;

-- Marcăm un împrumut ca returnat
UPDATE Rentals
SET    ReturnDate = GETDATE()
WHERE  RentalID = 2;
```

---

## UPDATE pe mai multe coloane

```sql
-- Actualizăm datele de contact ale unei edituri
UPDATE Publishers
SET    Phone   = '020-1234-5678',
       Email   = 'contact@penguin.co.uk',
       Address = '80 Strand, London, WC2R 0RL'
WHERE  PublisherName = 'Penguin Books';

-- Actualizăm adresa și telefonul unui client
UPDATE Clients
SET    Address = 'Calea Florilor 10, Bucharest',
       Phone   = '555-1234'
WHERE  ClientID = 1;
```

---

## UPDATE cu WHERE complex

### Clauza IN

```sql
-- Marcăm cărțile Technology în stare Fair ca fiind în stare Good (cu verificarea stării)
UPDATE Books
SET    Condition = 'Good'
WHERE  TitleID IN (
    SELECT TitleID FROM Titles WHERE Genre = 'Technology'
)
AND    Condition = 'Fair';
```

### BETWEEN

```sql
-- Prelungim termenul pentru toate împrumuturile făcute într-o anumită perioadă
UPDATE Rentals
SET    DueDate = DATEADD(DAY, 7, DueDate)
WHERE  RentalDate BETWEEN '2024-01-10' AND '2024-01-15'
AND    ReturnDate IS NULL;
```

### LIKE

```sql
-- Actualizăm domeniul de email în cadrul unei migrări a clienților
UPDATE Clients
SET    Email = REPLACE(Email, '@mail.com', '@library.org')
WHERE  Email LIKE '%@mail.com';
```

---

## UPDATE cu subinterogare în WHERE

```sql
-- Marcăm ca returnate toate împrumuturile cărților pierdute (condition = 'Poor')
UPDATE Rentals
SET    ReturnDate = GETDATE()
WHERE  ReturnDate IS NULL
AND    BookID IN (
    SELECT BookID FROM Books WHERE Condition = 'Poor'
);

-- Resetăm disponibilitatea pentru toate cărțile care nu au împrumuturi active
UPDATE Books
SET    IsAvailable = 1
WHERE  BookID NOT IN (
    SELECT BookID FROM Rentals WHERE ReturnDate IS NULL
);
```

---

## UPDATE cu subinterogare în SET

```sql
-- Calculăm DueDate din RentalDate + RentalDays pentru rândurile la care DueDate nu a fost setat
UPDATE Rentals
SET    DueDate = DATEADD(DAY, RentalDays, RentalDate)
WHERE  DueDate IS NULL;
```

---

## UPDATE cu JOIN (clauza FROM din T-SQL)

### Exemplul 1 — Marcarea unei cărți ca indisponibilă atunci când este împrumutată

Când se creează un împrumut, cartea corespunzătoare ar trebui marcată ca indisponibilă. Acest JOIN sincronizează cele două tabele.

```sql
-- Previzualizare
SELECT b.BookID, b.IsAvailable, r.RentalID
FROM   Books AS b
INNER JOIN Rentals AS r ON b.BookID = r.BookID
WHERE  r.ReturnDate IS NULL
AND    b.IsAvailable = 1;

-- Actualizare
UPDATE b
SET    b.IsAvailable = 0
FROM   Books   AS b
INNER JOIN Rentals AS r ON b.BookID = r.BookID
WHERE  r.ReturnDate IS NULL;
```

### Exemplul 2 — Marcarea cărților ca disponibile atunci când sunt returnate

```sql
-- Actualizăm disponibilitatea în funcție de existența unui împrumut activ (nereturnat)
UPDATE b
SET    b.IsAvailable = CASE
    WHEN active.BookID IS NULL THEN 1   -- niciun împrumut activ → disponibilă
    ELSE 0                               -- încă împrumutată → indisponibilă
END
FROM   Books AS b
LEFT JOIN (
    SELECT DISTINCT BookID
    FROM   Rentals
    WHERE  ReturnDate IS NULL
) AS active ON b.BookID = active.BookID;
```

### Exemplul 3 — Prelungirea termenelor pentru clienții cu abonament premium

```sql
-- Să presupunem că un tabel PremiumClients sau o coloană indicator identifică clienții VIP
-- Aici prelungim termenele pentru clienții înscriși înainte de 2023
UPDATE r
SET    r.DueDate = DATEADD(DAY, 7, r.DueDate)
FROM   Rentals  AS r
INNER JOIN Clients AS cl ON r.ClientID = cl.ClientID
WHERE  cl.MembershipDate < '2023-01-01'
AND    r.ReturnDate IS NULL;
```

### Exemplul 4 — Actualizarea stării cărții în funcție de numărul de împrumuturi

```sql
-- Cărțile împrumutate de mai mult de 3 ori → starea coboară cu un nivel
UPDATE b
SET    b.Condition = CASE b.Condition
    WHEN 'New'  THEN 'Good'
    WHEN 'Good' THEN 'Fair'
    WHEN 'Fair' THEN 'Poor'
    ELSE b.Condition   -- 'Poor' rămâne 'Poor'
END
FROM   Books AS b
INNER JOIN (
    SELECT BookID, COUNT(*) AS RentalCount
    FROM   Rentals
    GROUP BY BookID
    HAVING COUNT(*) > 3
) AS frequent ON b.BookID = frequent.BookID;
```

---

## UPDATE cu clauza OUTPUT

```sql
-- Returnarea unei cărți: actualizăm și capturăm evenimentul
DECLARE @ReturnLog TABLE (
    RentalID   INT,
    BookID     INT,
    OldReturn  DATE,
    NewReturn  DATE
);

UPDATE Rentals
SET    ReturnDate = CAST(GETDATE() AS DATE)
OUTPUT DELETED.RentalID, DELETED.BookID,
       DELETED.ReturnDate AS OldReturn,
       INSERTED.ReturnDate AS NewReturn
INTO   @ReturnLog
WHERE  RentalID = 2;

SELECT * FROM @ReturnLog;
```

---

## Tranzacții pentru siguranță

```sql
BEGIN TRANSACTION;

-- Prelungim cu 3 zile toate împrumuturile active, din cauza închiderii bibliotecii
UPDATE Rentals
SET    DueDate = DATEADD(DAY, 3, DueDate)
WHERE  ReturnDate IS NULL;

-- Verificăm rezultatele
SELECT RentalID, DueDate FROM Rentals WHERE ReturnDate IS NULL;

-- Dacă este corect:
COMMIT TRANSACTION;
-- Dacă este greșit:
-- ROLLBACK TRANSACTION;
```

---

## Exerciții practice

**Exercițiul 1**
Actualizează `Condition` pentru cartea cu `BookID = 5` la `'Poor'`.

**Exercițiul 2**
Actualizează `MembershipDate` la `'2024-01-01'` pentru toți clienții al căror email se termină cu `'@mail.com'`.

**Exercițiul 3**
Folosind o subinterogare în WHERE, marchează ca returnate (`ReturnDate = GETDATE()`) toate împrumuturile cărților a căror stare este `'Poor'` și care sunt încă nereturnate.

**Exercițiul 4**
Folosind `UPDATE ... FROM ... JOIN`, setează `IsAvailable = 1` pentru toate cărțile care nu au în prezent niciun împrumut nereturnat. Unește `Books` cu `Rentals` folosind modelul anti-join cu LEFT JOIN.

**Exercițiul 5**
Folosind `UPDATE ... FROM ... JOIN`, actualizează `DueDate` din `Rentals` la `RentalDate + 21` de zile pentru toate împrumuturile cărților din genul `'Fiction'`. Unește tabelele pe traseul `Rentals → Books → Titles`.

**Exercițiul 6**
Folosind `UPDATE` cu `OUTPUT`, înregistrează toate împrumuturile cu termenul depășit — schimbă-le `RentalDays` la numărul real de zile în care cartea a fost ținută (folosind `DATEDIFF(DAY, RentalDate, GETDATE())`) și capturează valorile vechi și noi ale `RentalDays` într-o variabilă de tip tabel.

**Exercițiul 7**
Scrie o tranzacție care marchează toate împrumuturile nereturnate ca returnate (`ReturnDate = GETDATE()`) și, în același timp, marchează toate cărțile afectate ca disponibile (`IsAvailable = 1`). Folosește două instrucțiuni UPDATE în cadrul aceleiași tranzacții.

**Exercițiul 8**
Folosind un UPDATE cu JOIN, copiază emailul editurii într-o coloană `ContactEmail` din `Books` (presupune că ai adăugat mai întâi această coloană). Unește `Books` cu `Publishers` și setează `Books.ContactEmail = Publishers.Email`.
