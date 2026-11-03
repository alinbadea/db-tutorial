# Baza de date eCommerce — Fișa de lucru 4: SELECT — Interogări de bază

## Obiective de învățare
- Scrierea instrucțiunilor `SELECT` pentru a extrage anumite coloane și a filtra rândurile
- Folosirea `WHERE` cu operatori de comparație, interval, listă, model (pattern) și NULL
- Sortarea rezultatelor cu `ORDER BY` și limitarea lor cu `TOP`
- Aplicarea `DISTINCT` și calcularea coloanelor derivate în lista SELECT

---

## Sintaxa SELECT

```sql
SELECT  [TOP n] [DISTINCT] lista_coloane
FROM    nume_tabel
WHERE   conditie
ORDER BY coloana [ASC | DESC];
```

---

## 1. Selectarea tuturor coloanelor (SELECT *)

```sql
-- Toate coloanele din Categorii
SELECT * FROM Categorii;

-- Toate coloanele din Comenzi
SELECT * FROM Comenzi;
```

> **Notă:** `SELECT *` este comod pentru explorare, dar evită-l în interogările de producție. Dacă o coloană este adăugată sau reordonată, interogările care depind de poziția coloanelor nu vor mai funcționa sau vor returna date neașteptate.

---

## 2. Selectarea anumitor coloane

```sql
-- Catalogul de produse
SELECT Denumire, Pret, Stoc
FROM   Produse;

-- Lista de contacte a clienților
SELECT Nume, Prenume, Oras, Telefon
FROM   Clienti;

-- Lista comenzilor
SELECT Id, Data, IdClient
FROM   Comenzi;
```

---

## 3. Aliasuri de coloane (AS)

Redenumește o coloană în setul de rezultate fără a modifica tabelul.

```sql
-- Redenumim coloanele pentru lizibilitate
SELECT
    Prenume + ' ' + Nume  AS NumeComplet,
    Telefon               AS NumarTelefon,
    Oras                  AS [Oras de resedinta]   -- parantezele drepte permit spații
FROM Clienti;

-- Coloană calculată, cu alias
SELECT
    Denumire,
    Pret          AS PretLista,
    Pret * 0.9    AS PretRedus
FROM Produse;

-- Alias fără cuvântul-cheie AS (doar un spațiu — funcționează, dar e mai puțin lizibil)
SELECT Id NumarComanda, Data PlasataPe
FROM   Comenzi;
```

> **Concatenare și NULL:** `Prenume + ' ' + Nume` funcționează pentru că ambele coloane sunt `NOT NULL`. Dacă oricare operand al lui `+` este `NULL`, întregul rezultat devine `NULL` — de exemplu `Adresa + ', ' + Oras` dă `NULL` pentru clienții fără adresă. Folosește `CONCAT(Adresa, ', ', Oras)`, care tratează `NULL` ca text gol.

---

## 4. Operații aritmetice în SELECT

```sql
-- Totalul fiecărei linii de comandă și TVA-ul inclus în el (21%)
SELECT
    IdComanda,
    IdProdus,
    Cantitate,
    Pret,
    Cantitate * Pret                  AS TotalLinie,
    Cantitate * Pret * 21 / 121       AS TVAInclus
FROM Detalii;

-- Zilele trecute de la plasarea unei comenzi
SELECT
    Id,
    Data,
    DATEDIFF(DAY, Data, GETDATE()) AS ZileDeLaComanda
FROM Comenzi;

-- Valoarea stocului pentru fiecare produs
SELECT
    Denumire,
    Stoc,
    Pret,
    Stoc * Pret AS ValoareStoc
FROM Produse;
```

> **Atenție la `DATEDIFF(YEAR, ...)`:** funcția numără câte **schimbări de an** au loc între cele două date, nu câți ani întregi au trecut. `DATEDIFF(YEAR, '2000-12-31', '2001-01-01')` returnează `1`, deși a trecut o singură zi. Pentru vârsta exactă a unui client vezi Exercițiul 10.

---

## 5. Filtrarea cu WHERE

### Egalitate și inegalitate

```sql
-- Clienții din București
SELECT Nume, Prenume FROM Clienti WHERE Oras = 'Bucuresti';

-- Produsele care NU sunt în Electronice (IdCategorie 1)
SELECT Denumire, Pret FROM Produse WHERE IdCategorie <> 1;

-- Clienții care nu sunt din Iași (!= este echivalent cu <>)
SELECT Nume, Prenume, Oras FROM Clienti WHERE Oras != 'Iasi';
```

### Operatori de comparație

```sql
-- Produsele care costă mai mult de 200 lei
SELECT Denumire, Pret FROM Produse WHERE Pret > 200.00;

-- Produsele cu prețul de 100 lei sau mai puțin
SELECT Denumire, Pret FROM Produse WHERE Pret <= 100.00;

-- Produsele care nu mai sunt în stoc
SELECT Denumire, Stoc FROM Produse WHERE Stoc = 0;

-- Comenzile plasate înainte de 12 ianuarie 2024
SELECT Id, Data FROM Comenzi WHERE Data < '2024-01-12';

-- Comenzile plasate pe 15 ianuarie 2024 sau după
SELECT Id, Data, IdClient FROM Comenzi WHERE Data >= '2024-01-15';
```

### BETWEEN … AND

```sql
-- Produsele cu prețul între 50 și 400 lei (inclusiv)
SELECT Denumire, Pret
FROM   Produse
WHERE  Pret BETWEEN 50.00 AND 400.00;

-- Clienții născuți în anii '90
SELECT Nume, Prenume, DataNasterii
FROM   Clienti
WHERE  DataNasterii BETWEEN '1990-01-01' AND '1999-12-31';
```

> **Capcana `DATETIME`:** coloana `Comenzi.Data` conține și **ora**. Literalul `'2024-01-14'` înseamnă `2024-01-14 00:00:00`, deci:
>
> ```sql
> -- GREȘIT: pierde comanda 3, plasată pe 14 ianuarie la 09:05
> SELECT Id, Data FROM Comenzi WHERE Data BETWEEN '2024-01-01' AND '2024-01-14';
>
> -- GREȘIT: nu returnează nimic, nicio comandă nu are ora exact 00:00
> SELECT Id, Data FROM Comenzi WHERE Data = '2024-01-14';
>
> -- CORECT: interval închis la stânga, deschis la dreapta
> SELECT Id, Data FROM Comenzi WHERE Data >= '2024-01-01' AND Data < '2024-01-15';
>
> -- CORECT: comparăm doar partea de dată
> SELECT Id, Data FROM Comenzi WHERE CAST(Data AS DATE) = '2024-01-14';
> ```

### IN (listă de valori)

```sql
-- Clienții din anumite orașe
SELECT Nume, Prenume, Oras
FROM   Clienti
WHERE  Oras IN ('Bucuresti', 'Cluj-Napoca', 'Iasi');

-- Comenzile anumitor clienți
SELECT Id, Data, IdClient
FROM   Comenzi
WHERE  IdClient IN (1, 2);
```

### LIKE — Potrivirea după model

`%` se potrivește cu orice secvență de zero sau mai multe caractere.  
`_` se potrivește cu exact un caracter.

```sql
-- Produsele al căror nume începe cu 'Mouse'
SELECT Denumire, Pret FROM Produse WHERE Denumire LIKE 'Mouse%';

-- Produsele al căror nume se termină cu 'a'
SELECT Denumire FROM Produse WHERE Denumire LIKE '%a';

-- Produsele al căror nume conține 'tricou' (implicit nu se face distincție între majuscule și minuscule)
SELECT Denumire FROM Produse WHERE Denumire LIKE '%tricou%';

-- Clienții al căror nume de familie are exact patru litere
SELECT Nume, Prenume FROM Clienti WHERE Nume LIKE '____';

-- Clienții cu un număr de telefon care începe cu 072
SELECT Nume, Prenume, Telefon FROM Clienti WHERE Telefon LIKE '072%';
```

### IS NULL / IS NOT NULL

```sql
-- Clienții fără adresă înregistrată
SELECT Nume, Prenume, Oras FROM Clienti WHERE Adresa IS NULL;

-- Clienții care au număr de telefon
SELECT Nume, Prenume, Telefon FROM Clienti WHERE Telefon IS NOT NULL;
```

> **Notă:** `WHERE Telefon = NULL` nu returnează niciodată rânduri — orice comparație cu `NULL` dă rezultatul „necunoscut”. Folosește întotdeauna `IS NULL` / `IS NOT NULL`.

---

## 6. Combinarea condițiilor: AND, OR, NOT

```sql
-- Produsele Electronice cu prețul sub 500 lei
SELECT Denumire, Pret
FROM   Produse
WHERE  IdCategorie = 1
AND    Pret < 500.00;

-- Clienții din București SAU din Iași
SELECT Nume, Prenume, Oras FROM Clienti
WHERE  Oras = 'Bucuresti' OR Oras = 'Iasi';

-- Clienții care NU sunt din București sau Brașov
SELECT Nume, Prenume, Oras
FROM   Clienti
WHERE  Oras NOT IN ('Bucuresti', 'Brasov');

-- Folosim paranteze pentru a controla precedența
-- Produse: (Electronice ȘI > 300 lei) SAU (Sport ȘI > 100 lei)
SELECT Denumire, IdCategorie, Pret
FROM   Produse
WHERE  (IdCategorie = 1 AND Pret > 300)
OR     (IdCategorie = 3 AND Pret > 100);
```

> **Precedență:** `AND` se evaluează înaintea lui `OR`. Fără paranteze, `WHERE A OR B AND C` înseamnă `WHERE A OR (B AND C)`.

---

## 7. Sortarea cu ORDER BY

```sql
-- Produsele sortate de la cel mai ieftin
SELECT Denumire, Pret FROM Produse ORDER BY Pret ASC;

-- Produsele sortate de la cel mai scump
SELECT Denumire, Pret FROM Produse ORDER BY Pret DESC;

-- Clienții sortați după oraș, apoi după numele de familie în cadrul fiecărui oraș
SELECT Nume, Prenume, Oras
FROM   Clienti
ORDER BY Oras ASC, Nume ASC;

-- Comenzile sortate de la cea mai recentă
SELECT Id, Data, IdClient FROM Comenzi ORDER BY Data DESC;

-- Sortăm după un alias
SELECT Denumire, Pret, Stoc, Pret * Stoc AS ValoareStoc
FROM   Produse
ORDER BY ValoareStoc DESC;

-- ...sau după poziția coloanei în lista SELECT (funcționează, dar e fragil)
SELECT Denumire, Pret, Stoc, Pret * Stoc AS ValoareStoc
FROM   Produse
ORDER BY 4 DESC;     -- coloana 4 din lista SELECT = ValoareStoc
```

---

## 8. Limitarea rezultatelor cu TOP

```sql
-- Cele mai scumpe 3 produse
SELECT TOP 3 Denumire, Pret
FROM   Produse
ORDER BY Pret DESC;

-- Primele 20% dintre produse după preț
SELECT TOP 20 PERCENT Denumire, Pret
FROM   Produse
ORDER BY Pret DESC;

-- Liniile de comandă cu cele mai mari 2 cantități — inclusiv egalitățile
-- Fără WITH TIES am primi 2 rânduri; cu WITH TIES primim linia cu 3 bucăți
-- și TOATE liniile cu 2 bucăți
SELECT TOP 2 WITH TIES IdComanda, IdProdus, Cantitate
FROM   Detalii
ORDER BY Cantitate DESC;
```

> **Notă:** `TOP` fără `ORDER BY` returnează rânduri într-o ordine nedefinită — rezultatul poate diferi de la o rulare la alta.

---

## 9. DISTINCT

Elimină valorile duplicate din setul de rezultate.

```sql
-- Din ce orașe provin clienții noștri?
SELECT DISTINCT Oras FROM Clienti ORDER BY Oras;

-- Ce categorii conțin produse?
SELECT DISTINCT IdCategorie FROM Produse;

-- Ce clienți au plasat cel puțin o comandă?
SELECT DISTINCT IdClient FROM Comenzi;

-- În câte orașe distincte se află clienții noștri?
SELECT COUNT(DISTINCT Oras) AS OraseUnice FROM Clienti;
```

---

## 10. Funcții predefinite utile

```sql
-- Funcții pentru șiruri de caractere
SELECT
    UPPER(Nume)                       AS NumeMajuscule,
    LOWER(Prenume)                    AS PrenumeMinuscule,
    LEN(Adresa)                       AS LungimeAdresa,
    LEFT(Telefon, 3)                  AS PrefixTelefon,
    ISNULL(Telefon, 'necunoscut')     AS TelefonAfisat
FROM Clienti;

-- Funcții pentru date calendaristice
SELECT
    Id,
    Data,
    YEAR(Data)                        AS An,
    MONTH(Data)                       AS Luna,
    DAY(Data)                         AS Zi,
    DATEPART(HOUR, Data)              AS Ora,
    DATEADD(DAY, 3, Data)             AS LivrareEstimata,
    DATEDIFF(DAY, Data, GETDATE())    AS ZileDeLaComanda
FROM Comenzi;

-- Conversie de tip
SELECT
    Denumire,
    CAST(Pret AS VARCHAR(20)) + ' lei'      AS PretText,
    CONVERT(VARCHAR(10), GETDATE(), 103)    AS AziZZLLAAAA
FROM Produse;

SELECT
    Id,
    CONVERT(VARCHAR(10), Data, 103)  AS DataZZLLAAAA,   -- 10/01/2024
    CONVERT(VARCHAR(5),  Data, 108)  AS OraHHMM         -- 10:15
FROM Comenzi;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Extrage `Denumire` și `Pret` pentru toate produsele din categoria Carti (`IdCategorie = 2`).

**Exercițiul 2 (Ușor)**
Listează toți clienții care locuiesc fie în `'Bucuresti'`, fie în `'Brasov'`, afișând numele complet și orașul.

**Exercițiul 3 (Ușor)**
Afișează `IdComanda`, `IdProdus`, `Cantitate`, `Pret` și totalul liniei (`TotalLinie`) pentru liniile de comandă cu totalul între 100 și 500 lei, sortate descrescător după total.

**Exercițiul 4 (Mediu)**
Găsește toate produsele al căror nume conține textul `'gradina'` (fără a ține cont de majuscule). Afișează numele, prețul și stocul.

**Exercițiul 5 (Mediu)**
Listează comenzile clienților 1 și 2 plasate după `2024-01-12`. Afișează `Id`, `IdClient` și `Data`.

**Exercițiul 6 (Mediu)**
Extrage primele 3 produse cu cea mai mare valoare a stocului (Stoc × Pret). Afișează `Denumire`, `Stoc`, `Pret` și valoarea calculată `ValoareStoc`, sortate descrescător.

**Exercițiul 7 (Mediu)**
Afișează toate comenzile plasate în ianuarie 2024, inclusiv cele din 31 ianuarie după-amiaza. Nu folosi `BETWEEN`.

**Exercițiul 8 (Mediu)**
Listează clienții care nu au fie telefon, fie adresă înregistrată. Afișează numele complet, telefonul și adresa; pentru valorile lipsă afișează textul `'-'`.

**Exercițiul 9 (Dificil)**
Afișează `IdComanda`, `IdProdus`, `Cantitate`, `Pret`, totalul liniei și o coloană numită `CategoriePret` care folosește o expresie `CASE` pentru a eticheta liniile: `'Ieftin'` dacă Pret < 100, `'Mediu'` dacă este între 100 și 500, `'Scump'` dacă este > 500.

**Exercițiul 10 (Dificil)**
Afișează numele complet, data nașterii și **vârsta exactă** (în ani împliniți) a fiecărui client, sortați de la cel mai în vârstă. (Indiciu: pornește de la `DATEDIFF(YEAR, ...)` și scade 1 dacă clientul nu și-a sărbătorit încă ziua de naștere în acest an.)

---

## Răspunsuri

1. `SELECT Denumire, Pret FROM Produse WHERE IdCategorie = 2;`
2. `SELECT Prenume + ' ' + Nume AS NumeComplet, Oras FROM Clienti WHERE Oras IN ('Bucuresti', 'Brasov');`
3. `SELECT IdComanda, IdProdus, Cantitate, Pret, Cantitate * Pret AS TotalLinie FROM Detalii WHERE Cantitate * Pret BETWEEN 100 AND 500 ORDER BY TotalLinie DESC;`
4. `SELECT Denumire, Pret, Stoc FROM Produse WHERE Denumire LIKE '%gradina%';`
5. `SELECT Id, IdClient, Data FROM Comenzi WHERE IdClient IN (1, 2) AND Data > '2024-01-12';`
6. `SELECT TOP 3 Denumire, Stoc, Pret, Stoc * Pret AS ValoareStoc FROM Produse ORDER BY ValoareStoc DESC;`
7. `SELECT Id, Data, IdClient FROM Comenzi WHERE Data >= '2024-01-01' AND Data < '2024-02-01';`
8. `SELECT Prenume + ' ' + Nume AS NumeComplet, ISNULL(Telefon, '-') AS Telefon, ISNULL(Adresa, '-') AS Adresa FROM Clienti WHERE Telefon IS NULL OR Adresa IS NULL;`
9. `SELECT IdComanda, IdProdus, Cantitate, Pret, Cantitate * Pret AS TotalLinie, CASE WHEN Pret < 100 THEN 'Ieftin' WHEN Pret <= 500 THEN 'Mediu' ELSE 'Scump' END AS CategoriePret FROM Detalii;`
10.
```sql
SELECT Prenume + ' ' + Nume AS NumeComplet,
       DataNasterii,
       DATEDIFF(YEAR, DataNasterii, GETDATE())
         - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, DataNasterii, GETDATE()), DataNasterii) > GETDATE()
                THEN 1 ELSE 0 END AS Varsta
FROM   Clienti
ORDER BY DataNasterii ASC;
```
