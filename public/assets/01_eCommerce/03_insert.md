# Baza de date eCommerce — Fișa de lucru 3: Instrucțiuni INSERT

## Obiective de învățare
- Scrierea instrucțiunilor `INSERT` folosind toate formele principale din T-SQL
- Înțelegerea motivului pentru care o listă de coloane este o bună practică
- Inserarea mai multor rânduri într-o singură instrucțiune
- Folosirea `INSERT...SELECT` și a clauzei `OUTPUT`
- Lucrul corect cu coloanele `IDENTITY` și cu valorile implicite (`DEFAULT`)

---

## Sintaxa INSERT

```sql
INSERT INTO nume_tabel (coloana1, coloana2, ...)
VALUES (valoare1, valoare2, ...);
```

Explicarea tuturor părților:
- `INSERT INTO` — cuvântul-cheie care introduce tabelul țintă
- `(coloana1, coloana2, ...)` — lista de coloane, opțională, dar recomandată
- `VALUES (...)` — datele de inserat

---

## Metoda 1: INSERT fără listă de coloane

Omiți numele coloanelor și furnizezi valorile exact în ordinea în care au fost definite coloanele în tabel (fără coloana `IDENTITY`).

```sql
-- Ordinea coloanelor din Produse: IdCategorie, Denumire, Pret, Stoc
INSERT INTO Produse
VALUES (1, 'Mouse wireless', 89.99, 150);
```

> **Atenție:** Această formă nu mai funcționează din momentul în care cineva adaugă, reordonează sau elimină o coloană din tabel. De asemenea, te obligă să furnizezi valori pentru fiecare coloană care nu este IDENTITY — inclusiv pentru cele care au valoare implicită. Evit-o în codul de producție.

---

## Metoda 2: INSERT cu listă de coloane (bună practică)

Numește întotdeauna coloanele în care inserezi:

```sql
INSERT INTO Produse (Denumire, Pret, IdCategorie)
VALUES ('Mouse wireless', 89.99, 1);
```

**De ce este mai bine:**
- Ordinea coloanelor nu contează
- Coloanele IDENTITY sunt omise automat
- Coloanele care acceptă NULL pot fi omise (primesc NULL)
- Coloanele cu `DEFAULT` pot fi omise (primesc valoarea implicită — aici `Stoc = 0`)
- Dacă schema tabelului se schimbă, INSERT-ul funcționează în continuare, atât timp cât sunt furnizate coloanele obligatorii

---

## Valori implicite (DEFAULT)

Coloanele `Comenzi.Data`, `Clienti.DataNasterii` și `Produse.Stoc` au valori implicite. Dacă le omiți din `INSERT`, SQL Server le completează singur:

```sql
-- Data comenzii devine data și ora curentă (GETDATE())
INSERT INTO Comenzi (IdClient)
VALUES (3);

-- Poți cere explicit valoarea implicită cu cuvântul-cheie DEFAULT
INSERT INTO Comenzi (Data, IdClient)
VALUES (DEFAULT, 3);

-- O valoare explicită înlocuiește valoarea implicită
INSERT INTO Comenzi (Data, IdClient)
VALUES ('2024-03-01 14:30', 3);
```

> **Atenție:** Valoarea implicită se aplică doar când coloana **lipsește** din `INSERT`. Dacă scrii explicit `NULL` într-o coloană `NOT NULL`, primești o eroare — valoarea implicită nu este folosită.

---

## Metoda 3: Inserarea mai multor rânduri într-o singură instrucțiune

T-SQL îți permite să furnizezi mai multe seturi de valori în `VALUES`, separate prin virgule:

```sql
INSERT INTO Categorii (Nume)
VALUES
    ('Electronice'),
    ('Carti'),
    ('Sport'),
    ('Imbracaminte'),
    ('Casa si gradina');
```

**Avantaj de performanță:** O singură comunicare prin rețea și o singură tranzacție pentru toate rândurile, ceea ce este mai rapid decât cinci instrucțiuni `INSERT` separate.

---

## Metoda 4: INSERT … SELECT

Inserează rezultatele unei interogări într-un tabel. Util pentru copierea datelor, popularea dintr-un tabel intermediar (staging) sau derivarea de rânduri din date existente.

```sql
-- Copiem toate produsele din categoria Electronice în tabelul ProduseArhiva
INSERT INTO ProduseArhiva (Denumire, Pret, Stoc)
SELECT Denumire, Pret, Stoc
FROM   Produse
WHERE  IdCategorie = (SELECT Id FROM Categorii WHERE Nume = 'Electronice');
```

Un exemplu practic — clientul vrea să **repete o comandă veche**. Creăm o comandă nouă, apoi copiem liniile comenzii vechi, dar cu prețurile curente din catalog:

```sql
DECLARE @IdComandaNoua INT;

-- 1. Antetul comenzii noi (Data primește valoarea implicită)
INSERT INTO Comenzi (IdClient)
VALUES (1);

SET @IdComandaNoua = SCOPE_IDENTITY();

-- 2. Liniile: aceleași produse și cantități ca în comanda 1, la prețul de azi
INSERT INTO Detalii (IdComanda, IdProdus, Cantitate, Pret)
SELECT @IdComandaNoua, d.IdProdus, d.Cantitate, p.Pret
FROM   Detalii AS d
INNER JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  d.IdComanda = 1;
```

---

## Coloane IDENTITY

`IDENTITY(seed, increment)` îi spune lui SQL Server să genereze automat valoarea cheii primare.

- `seed` — valoarea pentru primul rând (de obicei 1)
- `increment` — cât se adaugă pentru fiecare rând nou (de obicei 1)

**Nu incluzi niciodată o coloană IDENTITY într-un INSERT.** SQL Server o completează automat.

```sql
-- Corect: Id este omis; SQL Server îl atribuie
INSERT INTO Categorii (Nume)
VALUES ('Jucarii');

-- Obținem ID-ul tocmai generat
SELECT SCOPE_IDENTITY();            -- recomandat: ID-ul din această sesiune și acest domeniu
SELECT @@IDENTITY;                  -- ID-ul din această sesiune (orice domeniu — evită dacă există triggere)
SELECT IDENT_CURRENT('Categorii');  -- cel mai recent ID inserat în acel tabel, de oricine
```

> **Notă:** `Detalii` nu are coloană IDENTITY — cheia ei primară este `(IdComanda, IdProdus)`, iar ambele valori le furnizezi tu.

---

## SET IDENTITY_INSERT

Ocazional trebuie să furnizezi o anumită valoare pentru cheia primară (de ex., la restaurarea dintr-o copie de siguranță sau pentru a umple un gol). Activează temporar această opțiune:

```sql
SET IDENTITY_INSERT Categorii ON;

INSERT INTO Categorii (Id, Nume)
VALUES (99, 'Diverse');

SET IDENTITY_INSERT Categorii OFF;
```

> **Important:** Într-o sesiune, doar un singur tabel o dată poate avea `IDENTITY_INSERT ON`. Dezactivează-l întotdeauna (OFF) după ce ai terminat.

---

## INSERT cu clauza OUTPUT

`OUTPUT` îți permite să capturezi rândurile tocmai inserate, inclusiv valorile IDENTITY generate automat.

```sql
-- Capturăm noul Id imediat după inserare
INSERT INTO Categorii (Nume)
OUTPUT INSERTED.Id, INSERTED.Nume
VALUES ('Auto');
```

Salvăm rezultatul într-o variabilă de tip tabel:

```sql
DECLARE @IduriNoi TABLE (Id INT, Nume VARCHAR(50));

INSERT INTO Categorii (Nume)
OUTPUT INSERTED.Id, INSERTED.Nume
INTO   @IduriNoi
VALUES ('Birou'), ('Animale de companie');

SELECT * FROM @IduriNoi;
```

---

## Script complet cu date de exemplu

Rulează acest script după ce ai creat baza de date cu Fișa de lucru 2. Inserează în ordinea corectă impusă de cheile străine: Categorii → Clienti → Produse → Comenzi → Detalii.

Toate exemplele din fișele următoare folosesc aceste date.

```sql
USE eCommerceDB;
GO

-- ===========================
-- Categorii (6 rânduri)
-- ===========================
INSERT INTO Categorii (Nume)
VALUES
    ('Electronice'),      -- Id 1
    ('Carti'),            -- Id 2
    ('Sport'),            -- Id 3
    ('Imbracaminte'),     -- Id 4
    ('Casa si gradina'),  -- Id 5
    ('Jucarii');          -- Id 6 (încă nu are produse)
GO

-- ===========================
-- Clienti (6 rânduri)
-- ===========================
INSERT INTO Clienti (Nume, Prenume, Oras, Adresa, DataNasterii, Telefon)
VALUES
    ('Popescu',   'Ana',    'Bucuresti',   'Str. Unirii 7',             '1995-03-14', '0721123456'),
    ('Ionescu',   'Mihai',  'Cluj-Napoca', 'Str. Memorandumului 12',    '1988-07-02', '0745987654'),
    ('Georgescu', 'Elena',  'Iasi',        'Bd. Stefan cel Mare 20',    '2001-11-23', NULL),
    ('Dumitru',   'Andrei', 'Timisoara',   NULL,                        '1979-01-30', '0733555111'),
    ('Stan',      'Ioana',  'Brasov',      'Str. Republicii 3',         '1999-05-09', '0766444222'),
    ('Marin',     'Radu',   'Constanta',   'Bd. Tomis 45',              '1992-09-17', '0755123123');  -- nu a comandat nimic
GO

-- ===========================
-- Produse (9 rânduri)
-- ===========================
INSERT INTO Produse (IdCategorie, Denumire, Pret, Stoc)
VALUES
    (1, 'Mouse wireless',        89.99, 150),   -- Id 1
    (1, 'Tastatura mecanica',   349.99,  80),   -- Id 2
    (1, 'Monitor 27 inch',     1499.99,  30),   -- Id 3
    (2, 'Ghid SQL Server',      129.99,  45),   -- Id 4
    (2, 'Clean Code',            99.99,  60),   -- Id 5
    (3, 'Pantofi de alergare',  399.99,  55),   -- Id 6
    (4, 'Tricou din bumbac',     49.99, 200),   -- Id 7
    (5, 'Sapa de gradina',       79.99,  70),   -- Id 8
    (1, 'Casti bluetooth',      199.99,   0);   -- Id 9 (nu a fost comandat niciodată)
GO

-- ===========================
-- Comenzi (7 rânduri)
-- ===========================
INSERT INTO Comenzi (Data, IdClient)
VALUES
    ('2024-01-10 10:15', 1),   -- Id 1
    ('2024-01-11 18:40', 2),   -- Id 2
    ('2024-01-14 09:05', 1),   -- Id 3
    ('2024-01-15 21:30', 3),   -- Id 4
    ('2024-01-17 12:00', 4),   -- Id 5
    ('2024-01-18 16:20', 5),   -- Id 6
    ('2024-02-05 11:45', 2);   -- Id 7
GO

-- ===========================
-- Detalii (12 rânduri)
-- ===========================
INSERT INTO Detalii (IdComanda, IdProdus, Cantitate, Pret)
VALUES
    (1, 1, 2,   89.99),   -- Comanda 1: 2x Mouse wireless
    (1, 2, 1,  349.99),   -- Comanda 1: 1x Tastatura mecanica
    (2, 4, 1,  129.99),   -- Comanda 2: 1x Ghid SQL Server
    (2, 5, 2,   99.99),   -- Comanda 2: 2x Clean Code
    (3, 6, 1,  399.99),   -- Comanda 3: 1x Pantofi de alergare
    (3, 7, 3,   49.99),   -- Comanda 3: 3x Tricou din bumbac
    (4, 1, 1,   89.99),   -- Comanda 4: 1x Mouse wireless
    (4, 3, 1, 1499.99),   -- Comanda 4: 1x Monitor 27 inch
    (5, 2, 2,  349.99),   -- Comanda 5: 2x Tastatura mecanica
    (6, 8, 1,   79.99),   -- Comanda 6: 1x Sapa de gradina
    (7, 6, 1,  379.99),   -- Comanda 7: 1x Pantofi de alergare (preț promoțional!)
    (7, 7, 2,   49.99);   -- Comanda 7: 2x Tricou din bumbac
GO
```

**Totalurile comenzilor** (suma `Cantitate * Pret` pe fiecare comandă), utile pentru a-ți verifica rezultatele în fișele următoare:

| Comanda | Client | Data | Total (lei) |
|---|---|---|---|
| 1 | Popescu Ana | 2024-01-10 | 529.97 |
| 2 | Ionescu Mihai | 2024-01-11 | 329.97 |
| 3 | Popescu Ana | 2024-01-14 | 549.96 |
| 4 | Georgescu Elena | 2024-01-15 | 1589.98 |
| 5 | Dumitru Andrei | 2024-01-17 | 699.98 |
| 6 | Stan Ioana | 2024-01-18 | 79.99 |
| 7 | Ionescu Mihai | 2024-02-05 | 479.97 |

---

## Exerciții practice

**Exercițiul 1**
Scrie o instrucțiune `INSERT` care adaugă o categorie nouă numită `'Auto'`. Obține imediat după aceea valoarea `Id` generată automat.

**Exercițiul 2**
Scrie o singură instrucțiune `INSERT` care adaugă trei clienți noi deodată: unul din Sibiu, unul din Oradea și unul din Craiova. Include doar coloanele care **trebuie** furnizate. Ce valoare primește `DataNasterii` pentru acești clienți?

**Exercițiul 3**
Folosind `INSERT...SELECT`, scrie o interogare care inserează într-un tabel `ComenziArhiva` (presupune că are coloanele `Id`, `Data`, `IdClient`, fără IDENTITY) toate comenzile plasate înainte de `2024-01-15`.

**Exercițiul 4**
O comandă a fost plasată telefonic și a primit în sistemul extern numărul `1000`. Scrie instrucțiunile pentru a o insera în tabelul `Comenzi` cu `Id = 1000` pentru clientul 6, apoi inserează două rânduri `Detalii` pentru ea (prețul fiecărei linii = prețul curent al produsului).

**Exercițiul 5**
Scrie un `INSERT` cu clauza `OUTPUT` care inserează un produs nou în categoria Jucarii și returnează în setul de rezultate valorile `Id` (generată automat), `Denumire`, `Pret` și `Stoc`. Nu specifica stocul — ce valoare apare?

**Exercițiul 6**
Ce se întâmplă dacă rulezi următoarele instrucțiuni? Explică fiecare eroare.
```sql
INSERT INTO Detalii (IdComanda, IdProdus, Cantitate, Pret) VALUES (1, 99, 1, 10.00);
INSERT INTO Detalii (IdComanda, IdProdus, Cantitate, Pret) VALUES (1, 1, 1, 89.99);
INSERT INTO Detalii (IdComanda, IdProdus, Cantitate, Pret) VALUES (2, 1, 0, 89.99);
```
