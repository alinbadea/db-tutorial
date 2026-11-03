# Baza de date eCommerce — Fișa de lucru 6: SELECT — Grupare și funcții de agregare

## Obiective de învățare
- Folosirea `COUNT`, `SUM`, `AVG`, `MIN` și `MAX` pentru a sintetiza datele
- Gruparea rândurilor cu `GROUP BY` după una sau mai multe coloane
- Filtrarea grupurilor cu `HAVING`
- Combinarea JOIN-urilor cu agregarea pentru rapoarte de business relevante

---

## Funcții de agregare

Funcțiile de agregare comprimă mai multe rânduri într-o singură valoare de sinteză.

### COUNT

```sql
-- Numărul total de produse
SELECT COUNT(*) AS TotalProduse FROM Produse;

-- Numărul de clienți care au un număr de telefon (ignoră valorile NULL)
SELECT COUNT(Telefon) AS ClientiCuTelefon FROM Clienti;

-- Numărul de orașe distincte
SELECT COUNT(DISTINCT Oras) AS NumarOrase FROM Clienti;

-- Numărare pe categorii (folosit cu GROUP BY — vezi mai jos)
SELECT IdCategorie, COUNT(*) AS NumarProduse
FROM   Produse
GROUP BY IdCategorie;
```

> **COUNT(\*) vs COUNT(coloană):** `COUNT(*)` numără fiecare rând, inclusiv cele cu NULL. `COUNT(coloană)` numără doar rândurile în care acea coloană nu este NULL. `COUNT(DISTINCT coloană)` numără valorile diferite, non-NULL.

### SUM

```sql
-- Stocul total al tuturor produselor
SELECT SUM(Stoc) AS StocTotal FROM Produse;

-- Venitul total din toate liniile de comandă
SELECT SUM(Cantitate * Pret) AS VenitTotal FROM Detalii;
```

### AVG

```sql
-- Prețul mediu al produselor
SELECT AVG(Pret) AS PretMediu FROM Produse;

-- Cantitatea medie pe linie de comandă
-- Atenție: AVG pe o coloană INT returnează un INT (trunchiat)!
SELECT AVG(Cantitate)                       AS MedieTrunchiata,   -- 1
       AVG(CAST(Cantitate AS DECIMAL(10,2))) AS MedieCorecta       -- 1.50
FROM   Detalii;
```

### MIN și MAX

```sql
-- Cel mai ieftin și cel mai scump produs
SELECT MIN(Pret) AS PretMinim, MAX(Pret) AS PretMaxim
FROM Produse;

-- Cea mai veche și cea mai recentă comandă
SELECT MIN(Data) AS PrimaComanda, MAX(Data) AS UltimaComanda
FROM Comenzi;

-- Cel mai în vârstă și cel mai tânăr client (MIN/MAX funcționează și pe date calendaristice)
SELECT MIN(DataNasterii) AS CelMaiVarstnic, MAX(DataNasterii) AS CelMaiTanar
FROM Clienti;
```

---

## GROUP BY

`GROUP BY` împarte rândurile în grupuri și aplică funcția de agregare fiecărui grup în parte.

**Regulă:** Fiecare coloană din lista `SELECT` care **nu** se află într-o funcție de agregare **trebuie** să apară în clauza `GROUP BY`.

### O singură coloană

```sql
-- Numărul de produse pe categorie
SELECT IdCategorie, COUNT(*) AS NumarProduse
FROM   Produse
GROUP BY IdCategorie;

-- Cantitatea totală vândută pe produs
SELECT IdProdus, SUM(Cantitate) AS TotalVandut
FROM   Detalii
GROUP BY IdProdus;

-- Numărul de comenzi pe client
SELECT IdClient, COUNT(*) AS NumarComenzi
FROM   Comenzi
GROUP BY IdClient;

-- Numărul de clienți pe oraș
SELECT Oras, COUNT(*) AS NumarClienti
FROM   Clienti
GROUP BY Oras;

-- Totalul fiecărei comenzi
SELECT IdComanda, SUM(Cantitate * Pret) AS TotalComanda
FROM   Detalii
GROUP BY IdComanda
ORDER BY TotalComanda DESC;
```

### Mai multe coloane

```sql
-- Numărul de comenzi pe client și pe lună
SELECT IdClient, YEAR(Data) AS An, MONTH(Data) AS Luna, COUNT(*) AS NumarComenzi
FROM   Comenzi
GROUP BY IdClient, YEAR(Data), MONTH(Data)
ORDER BY IdClient, An, Luna;

-- Numărul de comenzi pe zi (folosim doar partea de dată, fără oră)
SELECT CAST(Data AS DATE) AS Zi, COUNT(*) AS NumarComenzi
FROM   Comenzi
GROUP BY CAST(Data AS DATE)
ORDER BY Zi;
```

> **Notă:** Dacă grupezi după o expresie (`YEAR(Data)`), aceeași expresie trebuie să apară în `GROUP BY` — aliasul `An` din `SELECT` nu poate fi folosit acolo, pentru că `GROUP BY` se evaluează înaintea lui `SELECT`.

---

## HAVING

`HAVING` filtrează grupurile după agregare, la fel cum `WHERE` filtrează rândurile înainte de agregare.

```sql
-- WHERE filtrează rânduri (înainte de grupare)
SELECT IdCategorie, COUNT(*) AS NumarProduse
FROM   Produse
WHERE  Pret > 80             -- mai întâi filtrează produsele individuale
GROUP BY IdCategorie;

-- HAVING filtrează grupuri (după grupare)
SELECT IdCategorie, COUNT(*) AS NumarProduse
FROM   Produse
GROUP BY IdCategorie
HAVING COUNT(*) >= 2;        -- păstrează doar categoriile cu 2 sau mai multe produse
```

**Ordinea logică de execuție a unei interogări:**

```
FROM / JOIN  →  WHERE  →  GROUP BY  →  HAVING  →  SELECT  →  ORDER BY  →  TOP
```

De aceea `WHERE` nu poate conține funcții de agregare (grupurile încă nu există), iar `ORDER BY` poate folosi aliasurile din `SELECT`.

### Exemple HAVING

```sql
-- Categoriile al căror stoc total depășește 100 de unități
SELECT IdCategorie, SUM(Stoc) AS StocTotal
FROM   Produse
GROUP BY IdCategorie
HAVING SUM(Stoc) > 100;

-- Clienții care au plasat mai mult de o comandă
SELECT IdClient, COUNT(*) AS NumarComenzi
FROM   Comenzi
GROUP BY IdClient
HAVING COUNT(*) > 1;

-- Produsele a căror cantitate medie pe linie de comandă este peste 1,5
SELECT IdProdus, AVG(CAST(Cantitate AS DECIMAL(10,2))) AS CantitateMedie
FROM   Detalii
GROUP BY IdProdus
HAVING AVG(CAST(Cantitate AS DECIMAL(10,2))) > 1.5;
```

---

## GROUP BY cu ORDER BY

```sql
-- Categoriile sortate începând cu cea cu cele mai multe produse
SELECT IdCategorie, COUNT(*) AS NumarProduse
FROM   Produse
GROUP BY IdCategorie
ORDER BY NumarProduse DESC;

-- Clienții sortați după suma cheltuită
SELECT co.IdClient,
       COUNT(DISTINCT co.Id)       AS NumarComenzi,
       SUM(d.Cantitate * d.Pret)   AS TotalCheltuit
FROM   Comenzi AS co
INNER JOIN Detalii AS d ON co.Id = d.IdComanda
GROUP BY co.IdClient
ORDER BY TotalCheltuit DESC;
```

---

## GROUP BY cu JOIN-uri

Mai întâi unește tabelele pentru a aduce coloanele descriptive, apoi agregă.

### Exemplul 1 — Statistici de preț pe categorie

```sql
SELECT
    c.Nume              AS Categorie,
    COUNT(p.Id)         AS NumarProduse,
    AVG(p.Pret)         AS PretMediu,
    MIN(p.Pret)         AS PretMinim,
    MAX(p.Pret)         AS PretMaxim
FROM   Categorii AS c
LEFT JOIN Produse AS p ON c.Id = p.IdCategorie
GROUP BY c.Id, c.Nume
ORDER BY NumarProduse DESC;
```

### Exemplul 2 — Venitul total pe client

```sql
SELECT
    cl.Prenume + ' ' + cl.Nume   AS NumeClient,
    cl.Oras,
    COUNT(DISTINCT co.Id)        AS NumarComenzi,
    SUM(d.Cantitate * d.Pret)    AS VenitTotal
FROM   Clienti AS cl
INNER JOIN Comenzi AS co ON cl.Id = co.IdClient
INNER JOIN Detalii AS d  ON co.Id = d.IdComanda
GROUP BY cl.Id, cl.Prenume, cl.Nume, cl.Oras
ORDER BY VenitTotal DESC;
```

### Exemplul 3 — Topul produselor după venit, cu numele categoriei

```sql
SELECT
    c.Nume                      AS Categorie,
    p.Denumire,
    SUM(d.Cantitate)            AS BucatiVandute,
    SUM(d.Cantitate * d.Pret)   AS Venit
FROM   Detalii AS d
INNER JOIN Produse   AS p ON d.IdProdus    = p.Id
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
GROUP BY c.Id, c.Nume, p.Id, p.Denumire
ORDER BY Venit DESC;
```

### Exemplul 4 — Venitul lunar, cu filtru HAVING

```sql
SELECT
    YEAR(co.Data)               AS An,
    MONTH(co.Data)              AS Luna,
    COUNT(DISTINCT co.Id)       AS NumarComenzi,
    SUM(d.Cantitate * d.Pret)   AS VenitLunar
FROM   Comenzi AS co
INNER JOIN Detalii AS d ON co.Id = d.IdComanda
GROUP BY YEAR(co.Data), MONTH(co.Data)
HAVING SUM(d.Cantitate * d.Pret) > 1000
ORDER BY An, Luna;
```

Cu datele din Fișa 3, ianuarie 2024 are un venit de 3779.85 lei, iar februarie doar 479.97 lei, deci `HAVING` păstrează doar ianuarie.

---

## Agregarea unei agregări — valoarea medie a unei comenzi

Nu putem scrie `AVG(SUM(...))`. Calculăm mai întâi totalul fiecărei comenzi într-o subinterogare (sau CTE), apoi facem media totalurilor:

```sql
-- Cu subinterogare în FROM (tabel derivat)
SELECT AVG(t.TotalComanda) AS ValoareMedieComanda
FROM (
    SELECT IdComanda, SUM(Cantitate * Pret) AS TotalComanda
    FROM   Detalii
    GROUP BY IdComanda
) AS t;

-- Același lucru cu un CTE (Common Table Expression)
WITH TotaluriComenzi AS (
    SELECT IdComanda, SUM(Cantitate * Pret) AS TotalComanda
    FROM   Detalii
    GROUP BY IdComanda
)
SELECT AVG(TotalComanda) AS ValoareMedieComanda,
       MIN(TotalComanda) AS CeaMaiMicaComanda,
       MAX(TotalComanda) AS CeaMaiMareComanda
FROM   TotaluriComenzi;
```

> **De ce nu `AVG(Cantitate * Pret)` direct din `Detalii`?** Acela ar fi totalul mediu al unei **linii**, nu al unei **comenzi**. O comandă cu 2 linii ar conta de două ori.

---

## Valori NULL în agregări

Funcțiile de agregare **ignoră valorile NULL** (cu excepția `COUNT(*)`).

```sql
-- Suma cheltuită de fiecare client, inclusiv clienții fără comenzi
-- Pentru Marin Radu (fără comenzi), SUM nu are nimic de adunat și returnează NULL
SELECT cl.Prenume + ' ' + cl.Nume       AS NumeClient,
       SUM(d.Cantitate * d.Pret)        AS TotalCheltuit,
       ISNULL(SUM(d.Cantitate * d.Pret), 0) AS TotalCheltuitSauZero
FROM   Clienti AS cl
LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
LEFT JOIN Detalii AS d  ON co.Id = d.IdComanda
GROUP BY cl.Id, cl.Prenume, cl.Nume;

-- AVG ignoră NULL-urile: media doar a clienților care au cumpărat ceva
-- vs. media tuturor clienților (cei fără comenzi contează cu 0)
WITH CheltuieliClienti AS (
    SELECT cl.Id, SUM(d.Cantitate * d.Pret) AS Total
    FROM   Clienti AS cl
    LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
    LEFT JOIN Detalii AS d  ON co.Id = d.IdComanda
    GROUP BY cl.Id
)
SELECT AVG(Total)            AS MediaCumparatori,
       AVG(ISNULL(Total, 0)) AS MediaTuturorClientilor
FROM   CheltuieliClienti;

-- COALESCE este echivalentul din standardul SQL al funcției ISNULL
SELECT COALESCE(SUM(Stoc), 0) AS StocJucarii FROM Produse WHERE IdCategorie = 6;

-- COUNT(*) - COUNT(coloană) = numărul de valori NULL din coloană
SELECT COUNT(*) AS TotalClienti, COUNT(Adresa) AS CuAdresa,
       COUNT(*) - COUNT(Adresa) AS FaraAdresa
FROM   Clienti;
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Numără totalul comenzilor din tabelul `Comenzi`.

**Exercițiul 2 (Ușor)**
Găsește prețul mediu, minim și maxim din tabelul `Produse`.

**Exercițiul 3 (Ușor)**
Afișează fiecare oraș și câți clienți locuiesc în el.

**Exercițiul 4 (Mediu)**
Afișează fiecare `IdCategorie` cu numărul total de produse și prețul mediu al produselor din acea categorie. Sortează descrescător după prețul mediu.

**Exercițiul 5 (Mediu)**
Listează toate produsele care au fost vândute în mai mult de o bucată în total (cantitatea totală vândută > 1). Afișează `IdProdus` și cantitatea totală vândută.

**Exercițiul 6 (Mediu)**
Afișează fiecare client (`IdClient`) cu numărul total de comenzi și suma totală cheltuită. Include doar clienții care au cheltuit în total mai mult de 1000 lei.

**Exercițiul 7 (Mediu)**
Folosind un JOIN, afișează numele fiecărei categorii alături de numărul de produse din ea și suma întregului stoc din acea categorie. Include categoriile fără produse (cu stoc 0).

**Exercițiul 8 (Dificil)**
Pentru fiecare client, afișează numele complet, numărul total de comenzi distincte, numărul total de linii de produs comandate (rânduri în `Detalii`) și suma totală cheltuită (suma Cantitate × Pret). Sortează descrescător după suma cheltuită.

**Exercițiul 9 (Dificil)**
Afișează primele 3 produse după venitul total (Cantitate × Pret), împreună cu denumirea produsului și numele categoriei.

**Exercițiul 10 (Dificil)**
Găsește toți clienții care au plasat comenzi în cel puțin 2 luni diferite. Afișează numele complet și numărul de luni distincte în care au comandat.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT COUNT(*) AS TotalComenzi FROM Comenzi;
```

**Exercițiul 2**
```sql
SELECT AVG(Pret) AS PretMediu, MIN(Pret) AS PretMinim, MAX(Pret) AS PretMaxim
FROM Produse;
```

**Exercițiul 3**
```sql
SELECT Oras, COUNT(*) AS NumarClienti FROM Clienti GROUP BY Oras;
```

**Exercițiul 4**
```sql
SELECT IdCategorie, COUNT(*) AS NumarProduse, AVG(Pret) AS PretMediu
FROM   Produse
GROUP BY IdCategorie
ORDER BY PretMediu DESC;
```

**Exercițiul 5**
```sql
SELECT IdProdus, SUM(Cantitate) AS TotalVandut
FROM   Detalii
GROUP BY IdProdus
HAVING SUM(Cantitate) > 1;
```

**Exercițiul 6**
```sql
SELECT co.IdClient,
       COUNT(DISTINCT co.Id)      AS NumarComenzi,
       SUM(d.Cantitate * d.Pret)  AS TotalCheltuit
FROM   Comenzi AS co
INNER JOIN Detalii AS d ON co.Id = d.IdComanda
GROUP BY co.IdClient
HAVING SUM(d.Cantitate * d.Pret) > 1000;
```
Rezultat: clientul 1 (1079.93 lei) și clientul 3 (1589.98 lei).

**Exercițiul 7**
```sql
SELECT c.Nume AS Categorie, COUNT(p.Id) AS NumarProduse, ISNULL(SUM(p.Stoc), 0) AS StocTotal
FROM   Categorii AS c
LEFT JOIN Produse AS p ON c.Id = p.IdCategorie
GROUP BY c.Id, c.Nume;
```

**Exercițiul 8**
```sql
SELECT cl.Prenume + ' ' + cl.Nume   AS NumeComplet,
       COUNT(DISTINCT co.Id)        AS NumarComenzi,
       COUNT(*)                     AS NumarLinii,
       SUM(d.Cantitate * d.Pret)    AS TotalCheltuit
FROM   Clienti AS cl
INNER JOIN Comenzi AS co ON cl.Id = co.IdClient
INNER JOIN Detalii AS d  ON co.Id = d.IdComanda
GROUP BY cl.Id, cl.Prenume, cl.Nume
ORDER BY TotalCheltuit DESC;
```

**Exercițiul 9**
```sql
SELECT TOP 3
    p.Denumire,
    c.Nume                      AS Categorie,
    SUM(d.Cantitate * d.Pret)   AS Venit
FROM   Detalii AS d
INNER JOIN Produse   AS p ON d.IdProdus    = p.Id
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
GROUP BY p.Id, p.Denumire, c.Nume
ORDER BY Venit DESC;
```

**Exercițiul 10**
```sql
SELECT cl.Prenume + ' ' + cl.Nume AS NumeComplet,
       COUNT(DISTINCT YEAR(co.Data) * 100 + MONTH(co.Data)) AS LuniDistincte
FROM   Clienti AS cl
INNER JOIN Comenzi AS co ON cl.Id = co.IdClient
GROUP BY cl.Id, cl.Prenume, cl.Nume
HAVING COUNT(DISTINCT YEAR(co.Data) * 100 + MONTH(co.Data)) >= 2;
```
Rezultat: Mihai Ionescu (ianuarie și februarie 2024).
