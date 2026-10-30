# Baza de date eCommerce — Fișa de lucru 8: Instrucțiuni DELETE

## Obiective de învățare
- Scrierea instrucțiunilor `DELETE` pentru a elimina în siguranță anumite rânduri
- Înțelegerea și respectarea ordinii impuse de constrângerile de cheie străină
- Folosirea `DELETE ... FROM ... JOIN` pentru a șterge rânduri pe baza datelor dintr-un tabel asociat
- Cunoașterea diferențelor dintre `DELETE` și `TRUNCATE TABLE`

---

## Sintaxa DELETE

```sql
DELETE FROM table_name
WHERE condition;
```

> **ATENȚIE — Fără clauza WHERE = toate rândurile sunt șterse**
>
> `DELETE FROM Orders` fără clauza `WHERE` elimină **fiecare rând** din tabelul Orders. Scrie și verifică întotdeauna mai întâi clauza `WHERE`. Previzualizează cu un SELECT înainte de a executa DELETE.

---

## Bună practică: previzualizează înainte de ștergere

Scrie SELECT-ul echivalent pentru a confirma ce rânduri vor fi eliminate:

```sql
-- Previzualizare: ce detalii de comandă vor fi șterse?
SELECT * FROM OrderDetails WHERE OrderID = 3;

-- Abia apoi ștergem
DELETE FROM OrderDetails WHERE OrderID = 3;
```

---

## DELETE de bază — un singur rând

```sql
-- Ștergem un anumit detaliu de comandă după cheia sa primară
DELETE FROM OrderDetails WHERE OrderDetailID = 7;

-- Ștergem o anumită comandă (sigur doar dacă rândurile din OrderDetails au fost eliminate înainte)
DELETE FROM Orders WHERE OrderID = 5;

-- Ștergem un produs (sigur doar dacă niciun rând din OrderDetails nu îl referă)
DELETE FROM Products WHERE ProductID = 8;
```

---

## DELETE pe mai multe rânduri cu WHERE

### Clauza IN

```sql
-- Ștergem toate detaliile care aparțin comenzilor 4 și 5
DELETE FROM OrderDetails
WHERE OrderID IN (4, 5);

-- Ștergem toate comenzile Cancelled
DELETE FROM Orders
WHERE Status = 'Cancelled';
```

### BETWEEN

```sql
-- Ștergem detaliile de comandă dintr-un interval de valori OrderDetailID
DELETE FROM OrderDetails
WHERE OrderDetailID BETWEEN 8 AND 10;
```

### LIKE

```sql
-- Ștergem clienții al căror domeniu de email este '@testdomain.com'
DELETE FROM Clients
WHERE Email LIKE '%@testdomain.com';
```

### Condiții compuse

```sql
-- Ștergem comenzile Pending mai vechi de 30 de zile
DELETE FROM Orders
WHERE  Status = 'Pending'
AND    OrderDate < DATEADD(DAY, -30, GETDATE());
```

---

## DELETE cu subinterogare în WHERE

```sql
-- Ștergem toate detaliile comenzilor Cancelled
DELETE FROM OrderDetails
WHERE OrderID IN (
    SELECT OrderID FROM Orders WHERE Status = 'Cancelled'
);

-- Ștergem produsele care nu au fost comandate niciodată
DELETE FROM Products
WHERE ProductID NOT IN (
    SELECT DISTINCT ProductID FROM OrderDetails
);

-- Ștergem clienții înregistrați în urmă cu mai mult de 2 ani care nu au plasat niciodată o comandă
DELETE FROM Clients
WHERE ClientID NOT IN (SELECT DISTINCT ClientID FROM Orders)
AND   CreatedDate < DATEADD(YEAR, -2, GETDATE());
```

---

## DELETE cu JOIN (clauza FROM din T-SQL)

În T-SQL poți uni tabele într-un DELETE pentru a șterge rânduri dintr-un tabel pe baza unor condiții din alt tabel.

**Sintaxă:**
```sql
DELETE alias_of_table_to_delete
FROM   TableToDelete AS alias_of_table_to_delete
INNER JOIN OtherTable AS other ON join_condition
WHERE  optional_filter;
```

### Exemplul 1 — Ștergerea rândurilor OrderDetails pentru toate comenzile Cancelled (varianta cu JOIN)

```sql
-- Previzualizare
SELECT od.OrderDetailID, od.OrderID, o.Status
FROM   OrderDetails AS od
INNER JOIN Orders AS o ON od.OrderID = o.OrderID
WHERE  o.Status = 'Cancelled';

-- Ștergere
DELETE od
FROM   OrderDetails AS od
INNER JOIN Orders AS o ON od.OrderID = o.OrderID
WHERE  o.Status = 'Cancelled';
```

### Exemplul 2 — Ștergerea comenzilor plasate de clienți dintr-o anumită țară

```sql
-- Mai întâi ștergem rândurile copil (OrderDetails)
DELETE od
FROM   OrderDetails AS od
INNER JOIN Orders   AS o  ON od.OrderID  = o.OrderID
INNER JOIN Clients  AS cl ON o.ClientID  = cl.ClientID
WHERE  cl.Country = 'TestCountry';

-- Apoi ștergem rândurile părinte (Orders)
DELETE o
FROM   Orders   AS o
INNER JOIN Clients AS cl ON o.ClientID = cl.ClientID
WHERE  cl.Country = 'TestCountry';
```

### Exemplul 3 — DELETE cu JOIN: ștergerea produselor care aparțin categoriilor al căror nume începe cu o anumită literă

```sql
-- Ștergem produsele al căror nume de categorie începe cu 'Z'
DELETE p
FROM   Products    AS p
INNER JOIN Categories AS c ON p.CategoryID = c.CategoryID
WHERE  c.CategoryName LIKE 'Z%';
```

### Exemplul 4 — Ștergerea detaliilor de comandă al căror produs nu mai există (curățarea înregistrărilor orfane)

```sql
-- Găsim detaliile de comandă orfane (produsul a fost șters ocolind constrângerile FK)
SELECT od.OrderDetailID
FROM   OrderDetails AS od
LEFT JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  p.ProductID IS NULL;

-- Le ștergem
DELETE od
FROM   OrderDetails AS od
LEFT JOIN Products AS p ON od.ProductID = p.ProductID
WHERE  p.ProductID IS NULL;
```

---

## Respectarea constrângerilor de cheie străină

Nu poți șterge un rând părinte dacă există rânduri copil care îl referă. Baza de date va genera o eroare de încălcare a constrângerii FK.

**Ordinea corectă de ștergere pentru eCommerceDB (de la tabelele copil la tabelele părinte):**

```
1. OrderDetails   (referă Orders și Products)
2. Orders         (referă Clients)
3. Products       (referă Categories)
4. Clients        (nu mai este referit de alte tabele — se poate șterge în siguranță)
5. Categories     (nu mai este referit de alte tabele — se poate șterge în siguranță)
```

### Exemplu complet de eliminare a unui client

```sql
-- Ștergem în siguranță clientul cu ClientID = 2 și toate datele asociate
-- Pasul 1: ștergem detaliile comenzilor acestui client
DELETE od
FROM   OrderDetails AS od
INNER JOIN Orders AS o ON od.OrderID = o.OrderID
WHERE  o.ClientID = 2;

-- Pasul 2: ștergem comenzile
DELETE FROM Orders WHERE ClientID = 2;

-- Pasul 3: acum putem șterge clientul în siguranță
DELETE FROM Clients WHERE ClientID = 2;
```

---

## TRUNCATE TABLE vs DELETE

| Caracteristică | DELETE | TRUNCATE |
|---|---|---|
| Clauza `WHERE` | Suportată | Nesuportată |
| Viteză | Mai lent (jurnalizare rând cu rând) | Mai rapid (jurnalizare minimă) |
| Resetează contorul IDENTITY | Nu | Da |
| Poate fi anulat (rollback) | Da (într-o tranzacție) | Da (într-o tranzacție) |
| Funcționează cu constrângeri FK | Da (dacă rândurile copil sunt șterse înainte) | Nu (eșuează dacă există referințe FK) |
| Declanșează triggerele `DELETE` | Da | Nu |

```sql
-- DELETE: elimină anumite rânduri, păstrează valoarea curentă IDENTITY
DELETE FROM OrderDetails WHERE OrderID = 99;

-- TRUNCATE: elimină TOATE rândurile, resetează IDENTITY la valoarea inițială (seed)
TRUNCATE TABLE OrderDetails;
-- Eroare dacă OrderDetails este referit printr-o FK din alt tabel
```

---

## DELETE cu clauza OUTPUT

Capturează rândurile șterse înainte să dispară:

```sql
-- Ștergem comenzile Pending vechi și capturăm ce s-a șters
DECLARE @Deleted TABLE (
    OrderID   INT,
    ClientID  INT,
    OrderDate DATETIME,
    Status    NVARCHAR(50)
);

DELETE FROM Orders
OUTPUT DELETED.OrderID, DELETED.ClientID, DELETED.OrderDate, DELETED.Status
INTO   @Deleted
WHERE  Status = 'Pending'
AND    OrderDate < DATEADD(DAY, -90, GETDATE());

SELECT * FROM @Deleted;
```

---

## Modelul „Soft Delete” (alternativă)

În loc să elimini fizic rândurile, marchează-le ca șterse cu o coloană indicator (flag). Astfel se păstrează istoricul și se permite recuperarea.

```sql
-- Adăugăm indicatorul IsDeleted în Clients
ALTER TABLE Clients ADD IsDeleted BIT NOT NULL DEFAULT 0;

-- „Ștergem” un client
UPDATE Clients SET IsDeleted = 1 WHERE ClientID = 3;

-- Interogare: afișăm doar clienții activi
SELECT * FROM Clients WHERE IsDeleted = 0;
```

**Compromisuri:** Istoricul este păstrat și înregistrările pot fi recuperate. Totuși, toate interogările trebuie să filtreze după `IsDeleted = 0`, iar tabelul crește la nesfârșit.

---

## Tranzacții pentru siguranță

```sql
BEGIN TRANSACTION;

-- Ștergem o comandă completă și detaliile ei
DELETE FROM OrderDetails WHERE OrderID = 1;
DELETE FROM Orders       WHERE OrderID = 1;

-- Verificare: ne asigurăm că ambele au dispărut
SELECT * FROM Orders       WHERE OrderID = 1;
SELECT * FROM OrderDetails WHERE OrderID = 1;

-- Dacă este corect:
COMMIT TRANSACTION;
-- Dacă ceva a mers prost:
-- ROLLBACK TRANSACTION;
```

---

## Greșeli frecvente

```sql
-- GREȘEALA 1: Lipsește WHERE (șterge TOATE rândurile)
DELETE FROM Orders;    -- șterge tot!

-- GREȘEALA 2: Ordine greșită de ștergere (încălcare FK)
DELETE FROM Orders WHERE OrderID = 1;
-- Eroare: The DELETE statement conflicted with the REFERENCE constraint
-- "FK_OrderDetails_Orders". Trebuie să ștergi mai întâi din OrderDetails.

-- CORECT: mai întâi rândurile copil
DELETE FROM OrderDetails WHERE OrderID = 1;
DELETE FROM Orders       WHERE OrderID = 1;

-- GREȘEALA 3: TRUNCATE când există referințe FK active
TRUNCATE TABLE Orders;
-- Eroare: Cannot truncate table 'Orders' because it is being referenced by a FK.
```

---

## Exerciții practice

**Exercițiul 1**
Șterge detaliul de comandă cu `OrderDetailID = 10`.

**Exercițiul 2**
Șterge toate detaliile comenzilor cu `Status = 'Cancelled'`. Folosește o subinterogare în clauza `WHERE`.

**Exercițiul 3**
Folosind `DELETE ... FROM ... JOIN`, șterge toate rândurile din `OrderDetails` pentru comenzile plasate de clienți din `'Germany'`.

**Exercițiul 4**
Șterge o comandă completă: mai întâi elimină toate rândurile ei din `OrderDetails`, apoi elimină rândul din `Orders`. Folosește `OrderID = 6`.

**Exercițiul 5**
Șterge toate produsele care nu au apărut niciodată în vreun rând din `OrderDetails`. Folosește o subinterogare.

**Exercițiul 6**
Folosind `DELETE ... FROM ... JOIN`, elimină toți clienții care nu au comenzi ȘI al căror `CreatedDate` este mai vechi de 1 an. (Șterge-i direct — nu există rânduri copil FK de care să-ți faci griji, deoarece nu au comenzi.)

**Exercițiul 7**
Folosind `DELETE` cu `OUTPUT`, șterge toate comenzile `Pending` și capturează `OrderID`, `ClientID` și `OrderDate` pentru fiecare rând șters într-o variabilă de tip tabel. Afișează rezultatele.

**Exercițiul 8**
Explică diferența dintre `DELETE FROM Products` și `TRUNCATE TABLE Products`. În ce situații ai alege fiecare variantă și ce s-ar întâmpla cu contorul IDENTITY în fiecare caz?
