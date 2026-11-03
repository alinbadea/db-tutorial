# Baza de date eCommerce — Fișa de lucru 8: Instrucțiuni DELETE

## Obiective de învățare
- Scrierea instrucțiunilor `DELETE` pentru a elimina în siguranță anumite rânduri
- Înțelegerea și respectarea ordinii impuse de constrângerile de cheie străină
- Folosirea `DELETE ... FROM ... JOIN` pentru a șterge rânduri pe baza datelor dintr-un tabel asociat
- Cunoașterea diferențelor dintre `DELETE` și `TRUNCATE TABLE`

---

## Sintaxa DELETE

```sql
DELETE FROM nume_tabel
WHERE conditie;
```

> **ATENȚIE — Fără clauza WHERE = toate rândurile sunt șterse**
>
> `DELETE FROM Comenzi` fără clauza `WHERE` elimină **fiecare rând** din tabelul Comenzi. Scrie și verifică întotdeauna mai întâi clauza `WHERE`. Previzualizează cu un SELECT înainte de a executa DELETE.

---

## Bună practică: previzualizează înainte de ștergere

Scrie SELECT-ul echivalent pentru a confirma ce rânduri vor fi eliminate:

```sql
-- Previzualizare: ce linii ale comenzii 3 vor fi șterse?
SELECT * FROM Detalii WHERE IdComanda = 3;

-- Abia apoi ștergem
DELETE FROM Detalii WHERE IdComanda = 3;
```

---

## DELETE de bază — un singur rând

```sql
-- Ștergem o anumită linie de comandă după cheia sa primară compusă
-- (ambele coloane sunt necesare: doar IdComanda = 3 ar șterge toate liniile comenzii)
DELETE FROM Detalii WHERE IdComanda = 3 AND IdProdus = 7;

-- Ștergem o anumită comandă (reușește doar dacă liniile ei din Detalii au fost eliminate înainte)
DELETE FROM Comenzi WHERE Id = 5;

-- Ștergem un produs (reușește doar dacă niciun rând din Detalii nu îl referă)
DELETE FROM Produse WHERE Id = 9;
```

---

## DELETE pe mai multe rânduri cu WHERE

### Clauza IN

```sql
-- Ștergem toate liniile care aparțin comenzilor 4 și 5
DELETE FROM Detalii
WHERE IdComanda IN (4, 5);

-- Apoi putem șterge și comenzile
DELETE FROM Comenzi
WHERE Id IN (4, 5);
```

### BETWEEN

```sql
-- Ștergem liniile unui interval de comenzi
DELETE FROM Detalii
WHERE IdComanda BETWEEN 5 AND 7;
```

### LIKE

```sql
-- Ștergem clienții de test creați în timpul dezvoltării aplicației
DELETE FROM Clienti
WHERE Nume LIKE 'Test%';
```

### Condiții compuse

```sql
-- Ștergem comenzile goale (fără nicio linie) mai vechi de 30 de zile
DELETE FROM Comenzi
WHERE  Data < DATEADD(DAY, -30, GETDATE())
AND    NOT EXISTS (SELECT 1 FROM Detalii AS d WHERE d.IdComanda = Comenzi.Id);
```

---

## DELETE cu subinterogare în WHERE

```sql
-- Ștergem toate liniile comenzilor plasate de clienți din Brașov
DELETE FROM Detalii
WHERE IdComanda IN (
    SELECT co.Id
    FROM   Comenzi AS co
    INNER JOIN Clienti AS cl ON co.IdClient = cl.Id
    WHERE  cl.Oras = 'Brasov'
);

-- Ștergem produsele care nu au fost comandate niciodată
DELETE FROM Produse
WHERE Id NOT IN (
    SELECT IdProdus FROM Detalii
);

-- Ștergem clienții fără comenzi și fără număr de telefon
DELETE FROM Clienti
WHERE Id NOT IN (SELECT IdClient FROM Comenzi)
AND   Telefon IS NULL;
```

---

## DELETE cu JOIN (clauza FROM din T-SQL)

În T-SQL poți uni tabele într-un DELETE pentru a șterge rânduri dintr-un tabel pe baza unor condiții din alt tabel.

**Sintaxă:**
```sql
DELETE alias_tabel_sters
FROM   TabelSters AS alias_tabel_sters
INNER JOIN AltTabel AS alt ON conditie_join
WHERE  filtru_optional;
```

### Exemplul 1 — Ștergerea liniilor tuturor comenzilor unui client (varianta cu JOIN)

```sql
-- Previzualizare
SELECT d.IdComanda, d.IdProdus, co.IdClient
FROM   Detalii AS d
INNER JOIN Comenzi AS co ON d.IdComanda = co.Id
WHERE  co.IdClient = 5;

-- Ștergere
DELETE d
FROM   Detalii AS d
INNER JOIN Comenzi AS co ON d.IdComanda = co.Id
WHERE  co.IdClient = 5;
```

### Exemplul 2 — Ștergerea comenzilor plasate de clienți dintr-un anumit oraș

```sql
-- Mai întâi ștergem rândurile copil (Detalii)
DELETE d
FROM   Detalii AS d
INNER JOIN Comenzi AS co ON d.IdComanda = co.Id
INNER JOIN Clienti AS cl ON co.IdClient = cl.Id
WHERE  cl.Oras = 'Timisoara';

-- Apoi ștergem rândurile părinte (Comenzi)
DELETE co
FROM   Comenzi AS co
INNER JOIN Clienti AS cl ON co.IdClient = cl.Id
WHERE  cl.Oras = 'Timisoara';
```

### Exemplul 3 — Ștergerea produselor din categoriile al căror nume începe cu o anumită literă

```sql
-- Ștergem produsele al căror nume de categorie începe cu 'J'
DELETE p
FROM   Produse AS p
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
WHERE  c.Nume LIKE 'J%';
```

### Exemplul 4 — Ștergerea liniilor de comandă al căror produs nu mai există (curățarea înregistrărilor orfane)

```sql
-- Găsim liniile orfane (pot apărea doar dacă FK-ul a fost dezactivat sau creat ulterior cu NOCHECK)
SELECT d.IdComanda, d.IdProdus
FROM   Detalii AS d
LEFT JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  p.Id IS NULL;

-- Le ștergem
DELETE d
FROM   Detalii AS d
LEFT JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  p.Id IS NULL;
```

---

## Respectarea constrângerilor de cheie străină

Nu poți șterge un rând părinte dacă există rânduri copil care îl referă. Baza de date va genera o eroare de încălcare a constrângerii FK.

**Ordinea corectă de ștergere pentru eCommerceDB (de la tabelele copil la tabelele părinte):**

```
1. Detalii     (referă Comenzi și Produse)
2. Comenzi     (referă Clienti)
3. Produse     (referă Categorii)
4. Clienti     (nu mai este referit de alte tabele — se poate șterge în siguranță)
5. Categorii   (nu mai este referit de alte tabele — se poate șterge în siguranță)
```

### Exemplu complet de eliminare a unui client

```sql
-- Ștergem în siguranță clientul cu Id = 2 și toate datele asociate
-- Pasul 1: ștergem liniile comenzilor acestui client
DELETE d
FROM   Detalii AS d
INNER JOIN Comenzi AS co ON d.IdComanda = co.Id
WHERE  co.IdClient = 2;

-- Pasul 2: ștergem comenzile
DELETE FROM Comenzi WHERE IdClient = 2;

-- Pasul 3: acum putem șterge clientul în siguranță
DELETE FROM Clienti WHERE Id = 2;
```

---

## Alternativa: ON DELETE CASCADE

O cheie străină poate fi definită astfel încât ștergerea părintelui să șteargă automat și rândurile copil. Pentru `Detalii` are sens: liniile unei comenzi nu au nicio valoare fără comandă.

```sql
-- Recreăm FK-ul dintre Detalii și Comenzi cu ștergere în cascadă
ALTER TABLE Detalii DROP CONSTRAINT FK_Detalii_Comenzi;

ALTER TABLE Detalii
ADD CONSTRAINT FK_Detalii_Comenzi
    FOREIGN KEY (IdComanda) REFERENCES Comenzi(Id)
    ON DELETE CASCADE;

-- Acum o singură instrucțiune șterge comanda ȘI liniile ei
DELETE FROM Comenzi WHERE Id = 1;
```

> **Folosește cu grijă:** `ON DELETE CASCADE` între `Produse` și `Detalii` ar fi o idee proastă — ștergerea unui produs din catalog ar șterge în tăcere liniile din comenzile istorice. Pentru acele relații, eroarea FK este o protecție utilă.

---

## TRUNCATE TABLE vs DELETE

| Caracteristică | DELETE | TRUNCATE |
|---|---|---|
| Clauza `WHERE` | Suportată | Nesuportată |
| Viteză | Mai lent (jurnalizare rând cu rând) | Mai rapid (jurnalizare minimă) |
| Resetează contorul IDENTITY | Nu | Da |
| Poate fi anulat (rollback) | Da (într-o tranzacție) | Da (într-o tranzacție) |
| Funcționează cu constrângeri FK | Da (dacă rândurile copil sunt șterse înainte) | Nu (eșuează dacă tabelul este referit de vreo FK, chiar dacă tabelul copil e gol) |
| Declanșează triggerele `DELETE` | Da | Nu |

```sql
-- DELETE: elimină anumite rânduri, păstrează valoarea curentă IDENTITY
DELETE FROM Detalii WHERE IdComanda = 99;

-- TRUNCATE: elimină TOATE rândurile
-- Funcționează pe Detalii, pentru că niciun alt tabel nu referă Detalii
TRUNCATE TABLE Detalii;

-- Eșuează pe Comenzi, pentru că Detalii o referă printr-o FK
TRUNCATE TABLE Comenzi;
```

---

## DELETE cu clauza OUTPUT

Capturează rândurile șterse înainte să dispară:

```sql
-- Ștergem liniile comenzii 6 și păstrăm o copie a ce s-a șters
DECLARE @LiniiSterse TABLE (
    IdComanda  INT,
    IdProdus   INT,
    Cantitate  INT,
    Pret       DECIMAL(10, 2)
);

DELETE FROM Detalii
OUTPUT DELETED.IdComanda, DELETED.IdProdus, DELETED.Cantitate, DELETED.Pret
INTO   @LiniiSterse
WHERE  IdComanda = 6;

SELECT * FROM @LiniiSterse;
```

---

## Modelul „Soft Delete” (alternativă)

În loc să elimini fizic rândurile, marchează-le ca șterse cu o coloană indicator (flag). Astfel se păstrează istoricul și se permite recuperarea.

```sql
-- Adăugăm indicatorul EsteSters în Produse
ALTER TABLE Produse ADD EsteSters BIT NOT NULL DEFAULT 0;

-- „Ștergem” un produs din catalog — comenzile vechi îl referă în continuare
UPDATE Produse SET EsteSters = 1 WHERE Id = 8;

-- Interogare: afișăm doar produsele active
SELECT * FROM Produse WHERE EsteSters = 0;
```

**Compromisuri:** Istoricul este păstrat, înregistrările pot fi recuperate și nu apar erori FK. Totuși, toate interogările trebuie să filtreze după `EsteSters = 0`, iar tabelul crește la nesfârșit.

---

## Tranzacții pentru siguranță

```sql
BEGIN TRANSACTION;

-- Ștergem o comandă completă și liniile ei
DELETE FROM Detalii WHERE IdComanda = 1;
DELETE FROM Comenzi WHERE Id = 1;

-- Verificare: ne asigurăm că ambele au dispărut
SELECT * FROM Comenzi WHERE Id = 1;
SELECT * FROM Detalii WHERE IdComanda = 1;

-- Dacă este corect:
COMMIT TRANSACTION;
-- Dacă ceva a mers prost:
-- ROLLBACK TRANSACTION;
```

---

## Greșeli frecvente

```sql
-- GREȘEALA 1: Lipsește WHERE (șterge TOATE rândurile)
DELETE FROM Comenzi;    -- șterge tot!

-- GREȘEALA 2: Ordine greșită de ștergere (încălcare FK)
DELETE FROM Comenzi WHERE Id = 1;
-- Eroare: The DELETE statement conflicted with the REFERENCE constraint
-- "FK_Detalii_Comenzi". Trebuie să ștergi mai întâi din Detalii.

-- CORECT: mai întâi rândurile copil
DELETE FROM Detalii WHERE IdComanda = 1;
DELETE FROM Comenzi WHERE Id = 1;

-- GREȘEALA 3: Cheie compusă folosită pe jumătate
DELETE FROM Detalii WHERE IdProdus = 1;
-- Voiai să ștergi o linie, dar ai șters produsul 1 din TOATE comenzile.

-- GREȘEALA 4: TRUNCATE când există referințe FK
TRUNCATE TABLE Comenzi;
-- Eroare: Cannot truncate table 'Comenzi' because it is being referenced by a FOREIGN KEY constraint.
```

---

## Exerciții practice

**Exercițiul 1**
Șterge linia comenzii 7 care conține produsul 7.

**Exercițiul 2**
Șterge toate liniile comenzilor plasate de clientul 4. Folosește o subinterogare în clauza `WHERE`.

**Exercițiul 3**
Folosind `DELETE ... FROM ... JOIN`, șterge toate rândurile din `Detalii` pentru comenzile plasate de clienți din `'Cluj-Napoca'`.

**Exercițiul 4**
Șterge o comandă completă: mai întâi elimină toate rândurile ei din `Detalii`, apoi elimină rândul din `Comenzi`. Folosește comanda `6`.

**Exercițiul 5**
Șterge toate produsele care nu au apărut niciodată în vreun rând din `Detalii`. Rezolvă o dată cu `NOT IN` și o dată cu `NOT EXISTS`.

**Exercițiul 6**
Folosind `DELETE ... FROM ... LEFT JOIN`, elimină toți clienții care nu au nicio comandă. (Nu există rânduri copil FK de care să-ți faci griji, deoarece nu au comenzi.)

**Exercițiul 7**
Folosind `DELETE` cu `OUTPUT`, șterge toate comenzile care nu au nicio linie în `Detalii` și capturează `Id`, `IdClient` și `Data` pentru fiecare rând șters într-o variabilă de tip tabel. Afișează rezultatele.

**Exercițiul 8**
Explică diferența dintre `DELETE FROM Detalii` și `TRUNCATE TABLE Detalii`. În ce situații ai alege fiecare variantă? De ce `TRUNCATE TABLE Produse` eșuează chiar și după ce ai golit tabelul `Detalii`?
