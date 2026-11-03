# Baza de date eCommerce — Fișa de lucru 5: SELECT — JOIN-uri

## Obiective de învățare
- Înțelegerea motivului pentru care avem nevoie de JOIN-uri și a modului în care funcționează
- Scrierea interogărilor cu INNER JOIN, LEFT JOIN, RIGHT JOIN și FULL OUTER JOIN
- Unirea a trei sau mai multe tabele într-o singură interogare
- Folosirea aliasurilor de tabel pentru interogări mai curate și mai scurte
- Găsirea înregistrărilor care nu au rânduri corespondente într-un tabel asociat

---

## De ce JOIN-uri?

Normalizarea împarte datele în mai multe tabele pentru a elimina redundanța. JOIN-urile reasamblează aceste date în momentul interogării. Fără JOIN-uri, ar trebui să rulezi interogări separate și să potrivești manual rândurile în codul aplicației.

Exemplu de problemă: un rând din `Detalii` stochează un `IdProdus`, dar nu și denumirea produsului. Pentru a vedea denumirea produsului alături de cantitate, ai nevoie de un JOIN.

---

## Tipuri de JOIN — Prezentare generală

| Tip de JOIN | Returnează |
|---|---|
| `INNER JOIN` | Doar rândurile care au corespondent în **ambele** tabele |
| `LEFT JOIN` | Toate rândurile din tabelul din stânga + rândurile corespondente din dreapta (NULL unde nu există corespondent) |
| `RIGHT JOIN` | Toate rândurile din tabelul din dreapta + rândurile corespondente din stânga (NULL unde nu există corespondent) |
| `FULL OUTER JOIN` | Toate rândurile din ambele tabele, cu NULL pe partea care nu are corespondent |

**Cheile de legătură din eCommerceDB:**

| Tabel copil | Coloană | Tabel părinte | Coloană |
|---|---|---|---|
| Produse | IdCategorie | Categorii | Id |
| Comenzi | IdClient | Clienti | Id |
| Detalii | IdComanda | Comenzi | Id |
| Detalii | IdProdus | Produse | Id |

---

## Aliasuri de tabel

Numele lungi de tabele devin obositoare la scrierea JOIN-urilor. Atribuie un alias scurt după numele tabelului:

```sql
-- Fără aliasuri (greu de citit)
SELECT Produse.Denumire, Categorii.Nume
FROM   Produse
INNER JOIN Categorii ON Produse.IdCategorie = Categorii.Id;

-- Cu aliasuri (mai curat)
SELECT p.Denumire, c.Nume AS Categorie
FROM   Produse   AS p
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id;
```

Când faci JOIN, califică întotdeauna numele coloanelor cu aliasul tabelului. În această bază de date este **obligatoriu**: aproape fiecare tabel are o coloană `Id`, iar `Nume` există atât în `Clienti`, cât și în `Categorii`, iar `Pret` atât în `Produse`, cât și în `Detalii`.

---

## INNER JOIN

Returnează doar rândurile pentru care condiția de JOIN este adevărată în ambele tabele. Rândurile fără corespondent, din oricare parte, sunt excluse.

### Exemplul 1 — Produsele cu numele categoriei lor

```sql
SELECT
    p.Id,
    p.Denumire,
    p.Pret,
    c.Nume AS Categorie
FROM   Produse   AS p
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
ORDER BY c.Nume, p.Denumire;
```

### Exemplul 2 — Comenzile cu numele complet al clientului

```sql
SELECT
    co.Id   AS IdComanda,
    co.Data,
    cl.Prenume + ' ' + cl.Nume AS NumeClient,
    cl.Oras
FROM   Comenzi AS co
INNER JOIN Clienti AS cl ON co.IdClient = cl.Id
ORDER BY co.Data DESC;
```

### Exemplul 3 — Liniile comenzilor cu denumirea produsului și data comenzii (3 tabele)

```sql
SELECT
    co.Id   AS IdComanda,
    co.Data,
    p.Denumire,
    d.Cantitate,
    d.Pret,
    d.Cantitate * d.Pret AS TotalLinie
FROM   Detalii  AS d
INNER JOIN Comenzi  AS co ON d.IdComanda = co.Id
INNER JOIN Produse  AS p  ON d.IdProdus  = p.Id
ORDER BY co.Id, p.Denumire;
```

### Exemplul 4 — Bonul complet al comenzii (toate cele 5 tabele)

```sql
SELECT
    cl.Prenume + ' ' + cl.Nume  AS NumeClient,
    cl.Oras,
    co.Id                       AS IdComanda,
    co.Data,
    c.Nume                      AS Categorie,
    p.Denumire,
    d.Cantitate,
    d.Pret,
    d.Cantitate * d.Pret        AS TotalLinie
FROM   Detalii AS d
INNER JOIN Comenzi    AS co ON d.IdComanda   = co.Id
INNER JOIN Clienti    AS cl ON co.IdClient   = cl.Id
INNER JOIN Produse    AS p  ON d.IdProdus    = p.Id
INNER JOIN Categorii  AS c  ON p.IdCategorie = c.Id
ORDER BY co.Id, p.Denumire;
```

---

## LEFT OUTER JOIN (LEFT JOIN)

Returnează **toate** rândurile din tabelul din stânga. Pentru rândurile din tabelul din stânga care nu au corespondent în tabelul din dreapta, coloanele din dreapta sunt completate cu `NULL`.

### Exemplul 1 — Clienții și comenzile lor (inclusiv clienții care nu au comandat niciodată)

```sql
SELECT
    cl.Id                       AS IdClient,
    cl.Prenume + ' ' + cl.Nume  AS NumeClient,
    co.Id                       AS IdComanda,
    co.Data
FROM   Clienti AS cl
LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
ORDER BY cl.Id;
```

Clientul Marin Radu nu are comenzi, deci apare cu `NULL` în coloanele `IdComanda` și `Data`.

### Exemplul 2 — Produsele și de câte ori au fost comandate

```sql
SELECT
    p.Denumire,
    p.Pret,
    COUNT(d.IdComanda) AS DeCateOriComandat
FROM   Produse AS p
LEFT JOIN Detalii AS d ON p.Id = d.IdProdus
GROUP BY p.Id, p.Denumire, p.Pret
ORDER BY DeCateOriComandat DESC;
```

`COUNT(d.IdComanda)` numără doar valorile non-NULL, deci produsele necomandate („Casti bluetooth”) primesc 0. Cu `COUNT(*)` ar fi primit greșit 1.

### Anti-join — Găsirea clienților care NU au plasat NICIODATĂ o comandă

```sql
SELECT cl.Id, cl.Nume, cl.Prenume, cl.Telefon
FROM   Clienti AS cl
LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
WHERE  co.Id IS NULL;
```

**Cum funcționează:** LEFT JOIN include toți clienții. Condiția `WHERE co.Id IS NULL` îi păstrează doar pe cei care nu au avut corespondent în `Comenzi`.

Aceeași interogare scrisă cu `NOT EXISTS` (adesea mai lizibilă):

```sql
SELECT cl.Id, cl.Nume, cl.Prenume, cl.Telefon
FROM   Clienti AS cl
WHERE  NOT EXISTS (SELECT 1 FROM Comenzi AS co WHERE co.IdClient = cl.Id);
```

### Capcana: filtrul pe tabelul din dreapta pus în WHERE

```sql
-- GREȘIT: vrem toți clienții, cu comenzile lor din februarie 2024
-- Condiția din WHERE elimină rândurile cu NULL, deci LEFT JOIN devine de fapt INNER JOIN
SELECT cl.Prenume + ' ' + cl.Nume AS NumeClient, co.Id AS IdComanda, co.Data
FROM   Clienti AS cl
LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
WHERE  co.Data >= '2024-02-01';

-- CORECT: condiția despre tabelul din dreapta merge în ON
SELECT cl.Prenume + ' ' + cl.Nume AS NumeClient, co.Id AS IdComanda, co.Data
FROM   Clienti AS cl
LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
                       AND co.Data >= '2024-02-01';
```

---

## RIGHT OUTER JOIN (RIGHT JOIN)

Returnează toate rândurile din tabelul din dreapta. Este echivalent cu un LEFT JOIN cu tabelele inversate — majoritatea programatorilor preferă LEFT JOIN pentru consecvență.

```sql
-- Toate categoriile, inclusiv cele care încă nu au produse
SELECT
    c.Nume AS Categorie,
    p.Denumire,
    p.Pret
FROM   Produse   AS p
RIGHT JOIN Categorii AS c ON p.IdCategorie = c.Id
ORDER BY c.Nume;
```

Categoria „Jucarii” nu are produse, deci apare cu `NULL` în `Denumire` și `Pret`.

---

## FULL OUTER JOIN

Returnează toate rândurile din ambele tabele. Rândurile fără corespondent, din oricare parte, primesc NULL în coloanele celuilalt tabel.

```sql
-- Toate produsele și toate categoriile, afișând și rândurile fără corespondent din ambele părți
SELECT
    p.Denumire,
    c.Nume AS Categorie
FROM   Produse   AS p
FULL OUTER JOIN Categorii AS c ON p.IdCategorie = c.Id
ORDER BY c.Nume, p.Denumire;
```

> **Notă:** Pentru că `Produse.IdCategorie` este `NOT NULL` și are FK, fiecare produs are sigur o categorie. Aici FULL OUTER JOIN dă același rezultat ca RIGHT JOIN-ul de mai sus. Ar conta dacă `IdCategorie` ar accepta NULL.

---

## Unirea tuturor tabelelor într-o singură interogare

O singură interogare cuprinzătoare care raportează fiecare linie de comandă cu toate detaliile asociate, inclusiv totalul întregii comenzi (calculat cu o subinterogare):

```sql
SELECT
    cl.Id                                    AS IdClient,
    cl.Prenume + ' ' + cl.Nume               AS NumeClient,
    cl.Oras,
    co.Id                                    AS IdComanda,
    CONVERT(VARCHAR(10), co.Data, 103)       AS DataComenzii,
    c.Nume                                   AS Categorie,
    p.Denumire,
    d.Cantitate,
    d.Pret,
    d.Cantitate * d.Pret                     AS TotalLinie,
    (SELECT SUM(d2.Cantitate * d2.Pret)
     FROM   Detalii AS d2
     WHERE  d2.IdComanda = co.Id)            AS TotalComanda
FROM   Detalii AS d
INNER JOIN Comenzi   AS co ON d.IdComanda   = co.Id
INNER JOIN Clienti   AS cl ON co.IdClient   = cl.Id
INNER JOIN Produse   AS p  ON d.IdProdus    = p.Id
INNER JOIN Categorii AS c  ON p.IdCategorie = c.Id
ORDER BY co.Id, p.Denumire;
```

---

## Greșeli frecvente

```sql
-- GREȘEALA 1: Am uitat clauza ON
SELECT p.Denumire, c.Nume
FROM   Produse AS p
INNER JOIN Categorii AS c;   -- Eroare de sintaxă: clauza ON este obligatorie
-- (Dacă chiar vrei fiecare produs combinat cu fiecare categorie, scrie explicit CROSS JOIN.)

-- GREȘEALA 2: Nume de coloană ambiguu — ambele tabele au 'Id'
SELECT Id, Nume, Data          -- Din ce tabel este Id? SQL Server va genera o eroare
FROM   Clienti
INNER JOIN Comenzi ON Clienti.Id = Comenzi.IdClient;

-- CORECT: calificăm fiecare coloană
SELECT cl.Id AS IdClient, cl.Nume, co.Id AS IdComanda, co.Data
FROM   Clienti AS cl
INNER JOIN Comenzi AS co ON cl.Id = co.IdClient;

-- GREȘEALA 3: Condiția de JOIN pe coloanele greșite
-- Compară Id-ul comenzii cu Id-ul clientului — rulează fără eroare, dar rezultatul este fără sens
SELECT co.Id, cl.Nume
FROM   Comenzi AS co
INNER JOIN Clienti AS cl ON co.Id = cl.Id;    -- trebuia: co.IdClient = cl.Id
```

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
Listează fiecare produs împreună cu numele categoriei sale. Afișează `Denumire`, `Pret` și `Categorie`. Sortează după categorie.

**Exercițiul 2 (Ușor)**
Afișează `IdComanda`, `Data` și numele complet al clientului care a plasat fiecare comandă.

**Exercițiul 3 (Mediu)**
Pentru fiecare linie de comandă, afișează `IdComanda`, `NumeClient` (complet), `Denumire`, `Cantitate` și `TotalLinie` (Cantitate × Pret). Sortează după `IdComanda`.

**Exercițiul 4 (Mediu)**
Găsește toți clienții care **nu au plasat niciodată** o comandă. Afișează `Id`, numele complet și `Oras`.

**Exercițiul 5 (Mediu)**
Listează toate categoriile împreună cu numărul de produse din fiecare. Include și categoriile care nu au niciun produs. Afișează `Categorie` și o coloană numită `NumarProduse`.

**Exercițiul 6 (Mediu)**
Afișează toate produsele împreună cu cantitatea totală vândută vreodată (suma `Cantitate` din `Detalii`). Include produsele care nu au fost vândute niciodată (afișează 0). Sortează descrescător după totalul vândut.

**Exercițiul 7 (Dificil)**
Scrie o interogare care afișează, pentru fiecare client, `NumeComplet`, `Oras`, numărul de comenzi plasate (`NumarComenzi`) și suma cheltuită în total (`TotalCheltuit`). Include doar clienții care au cel puțin o comandă. Sortează descrescător după `TotalCheltuit`.

**Exercițiul 8 (Dificil)**
Listează toate liniile de comandă la care prețul facturat (`Detalii.Pret`) diferă de prețul curent din tabelul `Produse`. Afișează `IdComanda`, `Denumire`, `PretFacturat` și `PretCurent`.

**Exercițiul 9 (Dificil)**
Listează produsele care au fost cumpărate de clienți din **cel puțin două orașe diferite**. Afișează denumirea produsului și numărul de orașe.

---

## Răspunsuri

**Exercițiul 1**
```sql
SELECT p.Denumire, p.Pret, c.Nume AS Categorie
FROM   Produse AS p
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
ORDER BY c.Nume;
```

**Exercițiul 2**
```sql
SELECT co.Id AS IdComanda, co.Data,
       cl.Prenume + ' ' + cl.Nume AS NumeClient
FROM   Comenzi AS co
INNER JOIN Clienti AS cl ON co.IdClient = cl.Id;
```

**Exercițiul 3**
```sql
SELECT co.Id AS IdComanda, cl.Prenume + ' ' + cl.Nume AS NumeClient,
       p.Denumire, d.Cantitate,
       d.Cantitate * d.Pret AS TotalLinie
FROM   Detalii AS d
INNER JOIN Comenzi AS co ON d.IdComanda = co.Id
INNER JOIN Clienti AS cl ON co.IdClient = cl.Id
INNER JOIN Produse AS p  ON d.IdProdus  = p.Id
ORDER BY co.Id;
```

**Exercițiul 4**
```sql
SELECT cl.Id, cl.Prenume + ' ' + cl.Nume AS NumeComplet, cl.Oras
FROM   Clienti AS cl
LEFT JOIN Comenzi AS co ON cl.Id = co.IdClient
WHERE  co.Id IS NULL;
```
Rezultat: Marin Radu (Constanta).

**Exercițiul 5**
```sql
SELECT c.Nume AS Categorie, COUNT(p.Id) AS NumarProduse
FROM   Categorii AS c
LEFT JOIN Produse AS p ON c.Id = p.IdCategorie
GROUP BY c.Id, c.Nume
ORDER BY NumarProduse DESC;
```

**Exercițiul 6**
```sql
SELECT p.Denumire, COALESCE(SUM(d.Cantitate), 0) AS TotalVandut
FROM   Produse AS p
LEFT JOIN Detalii AS d ON p.Id = d.IdProdus
GROUP BY p.Id, p.Denumire
ORDER BY TotalVandut DESC;
```

**Exercițiul 7**
```sql
SELECT cl.Prenume + ' ' + cl.Nume       AS NumeComplet,
       cl.Oras,
       COUNT(DISTINCT co.Id)            AS NumarComenzi,
       SUM(d.Cantitate * d.Pret)        AS TotalCheltuit
FROM   Clienti AS cl
INNER JOIN Comenzi AS co ON cl.Id = co.IdClient
INNER JOIN Detalii AS d  ON co.Id = d.IdComanda
GROUP BY cl.Id, cl.Prenume, cl.Nume, cl.Oras
ORDER BY TotalCheltuit DESC;
```
Atenție la `COUNT(DISTINCT co.Id)`: după JOIN-ul cu `Detalii`, fiecare comandă apare de atâtea ori câte linii are, deci `COUNT(co.Id)` ar număra liniile, nu comenzile.

**Exercițiul 8**
```sql
SELECT d.IdComanda, p.Denumire,
       d.Pret AS PretFacturat,
       p.Pret AS PretCurent
FROM   Detalii AS d
INNER JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  d.Pret <> p.Pret;
```
Rezultat (cu datele din Fișa 3): comanda 7, „Pantofi de alergare”, facturat 379.99, curent 399.99.

**Exercițiul 9**
```sql
SELECT p.Denumire, COUNT(DISTINCT cl.Oras) AS NumarOrase
FROM   Detalii AS d
INNER JOIN Produse AS p  ON d.IdProdus  = p.Id
INNER JOIN Comenzi AS co ON d.IdComanda = co.Id
INNER JOIN Clienti AS cl ON co.IdClient = cl.Id
GROUP BY p.Id, p.Denumire
HAVING COUNT(DISTINCT cl.Oras) >= 2;
```
Rezultat: Mouse wireless (Bucuresti, Iasi), Tastatura mecanica (Bucuresti, Timisoara), Pantofi de alergare (Bucuresti, Cluj-Napoca), Tricou din bumbac (Bucuresti, Cluj-Napoca).
