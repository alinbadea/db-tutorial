# Baza de date eCommerce — Fișa de lucru 7: Instrucțiuni UPDATE

## Obiective de învățare
- Scrierea instrucțiunilor `UPDATE` pentru a modifica una sau mai multe coloane
- Aplicarea întotdeauna a unei clauze `WHERE`, pentru a evita actualizarea tuturor rândurilor
- Folosirea subinterogărilor și a JOIN-urilor în `UPDATE` pentru a selecta rândurile pe baza datelor asociate
- Capturarea valorilor dinainte/de după cu clauza `OUTPUT`

---

## Sintaxa UPDATE

```sql
UPDATE nume_tabel
SET    coloana1 = valoare1,
       coloana2 = valoare2
WHERE  conditie;
```

> **ATENȚIE — Fără clauza WHERE = toate rândurile sunt actualizate**
>
> Rularea `UPDATE Produse SET Pret = 0` fără clauza `WHERE` setează la zero prețul **absolut fiecărui produs**. Scrie întotdeauna clauza WHERE înainte de clauza SET. Când ai dubii, rulează mai întâi SELECT-ul echivalent.

---

## Bună practică: previzualizează înainte de actualizare

Înainte de a executa un UPDATE, scrie SELECT-ul echivalent pentru a verifica ce rânduri vor fi afectate:

```sql
-- Previzualizare: ce produse nu mai sunt în stoc?
SELECT Id, Denumire, Stoc FROM Produse WHERE Stoc = 0;

-- Apoi rulăm UPDATE-ul (a sosit o livrare de 25 de bucăți)
UPDATE Produse
SET    Stoc = 25
WHERE  Stoc = 0;
```

După execuție, SSMS afișează mesajul `(n rows affected)`. Verifică dacă `n` este numărul de rânduri pe care l-ai văzut în previzualizare.

---

## UPDATE de bază — o singură coloană

```sql
-- Schimbăm prețul unui produs
UPDATE Produse
SET    Pret = 94.99
WHERE  Id = 1;

-- Adăugăm numărul de telefon al unui client care nu avea unul
UPDATE Clienti
SET    Telefon = '0740111222'
WHERE  Id = 3;

-- Actualizăm orașul unui client
UPDATE Clienti
SET    Oras = 'Ploiesti'
WHERE  Id = 1;

-- Ștergem valoarea unei coloane care acceptă NULL
UPDATE Clienti
SET    Adresa = NULL
WHERE  Id = 5;
```

> **Notă:** `SET Oras = NULL` ar eșua — `Oras` este `NOT NULL`. Constrângerile (`NOT NULL`, `CHECK`, `FOREIGN KEY`, `UNIQUE`) sunt verificate și la `UPDATE`, nu doar la `INSERT`.

---

## UPDATE pe mai multe coloane deodată

Separă atribuirile multiple din SET prin virgule:

```sql
-- Actualizăm atât prețul, cât și stocul unui produs
UPDATE Produse
SET    Pret = 84.99,
       Stoc = 200
WHERE  Id = 1;

-- Clientul s-a mutat: actualizăm adresa și orașul într-o singură instrucțiune
UPDATE Clienti
SET    Adresa = 'Str. Lunga 45',
       Oras   = 'Brasov'
WHERE  Id = 4;
```

Poți folosi și valoarea curentă a coloanei în expresie:

```sql
-- Adăugăm 10 bucăți la stocul fiecărui produs Electronice
UPDATE Produse
SET    Stoc = Stoc + 10
WHERE  IdCategorie = 1;
```

---

## UPDATE cu condiții WHERE complexe

### Clauza IN

```sql
-- Aplicăm o reducere de 10% tuturor produselor din Carti și Sport
UPDATE Produse
SET    Pret = Pret * 0.90
WHERE  IdCategorie IN (
    SELECT Id FROM Categorii
    WHERE  Nume IN ('Carti', 'Sport')
);
```

> **Rotunjire:** `Pret * 0.90` poate produce mai mult de 2 zecimale (de ex. `89.991`). Coloana `DECIMAL(10,2)` rotunjește automat la stocare, dar dacă vrei control explicit folosește `ROUND(Pret * 0.90, 2)`.

### BETWEEN

```sql
-- Ieftinim cu 5 lei produsele cu prețul între 50 și 100 lei
UPDATE Produse
SET    Pret = Pret - 5
WHERE  Pret BETWEEN 50 AND 100;
```

### LIKE

```sql
-- Scriem complet prescurtarea „Bd.” în adresele clienților
UPDATE Clienti
SET    Adresa = REPLACE(Adresa, 'Bd.', 'Bulevardul')
WHERE  Adresa LIKE 'Bd.%';
```

---

## UPDATE cu subinterogare în WHERE

```sql
-- Clientul Ana Popescu a fost înregistrat de două ori din greșeală.
-- Mutăm toate comenzile de pe contul duplicat pe contul original (Id = 1).
UPDATE Comenzi
SET    IdClient = 1
WHERE  IdClient IN (
    SELECT Id FROM Clienti
    WHERE  Nume = 'Popescu' AND Prenume = 'Ana' AND Id <> 1
);

-- Mărim stocul produselor care nu au fost comandate niciodată
UPDATE Produse
SET    Stoc = Stoc + 50
WHERE  Id NOT IN (
    SELECT IdProdus FROM Detalii
);
```

> **Atenție la `NOT IN` cu NULL:** dacă subinterogarea ar returna măcar un `NULL`, `NOT IN` nu ar mai potrivi niciun rând. Aici e sigur, pentru că `Detalii.IdProdus` este `NOT NULL`. În general, `NOT EXISTS` este varianta mai robustă.

---

## UPDATE cu subinterogare în SET

Obținem noua valoare dintr-o subinterogare corelată:

```sql
-- Comanda 7 nu a fost încă facturată: îi aducem liniile la prețurile curente din catalog
UPDATE Detalii
SET    Pret = (
    SELECT p.Pret
    FROM   Produse AS p
    WHERE  p.Id = Detalii.IdProdus
)
WHERE  IdComanda = 7;
```

> **De ce doar o comandă?** `Detalii.Pret` reține prețul **de la momentul vânzării**. Dacă am actualiza toate liniile, am rescrie istoricul: comenzile vechi ar arăta că clienții au plătit alte sume decât în realitate.

---

## UPDATE cu JOIN (clauza FROM din T-SQL)

T-SQL îți permite să unești tabele într-un UPDATE pentru a obține valorile sau condițiile de actualizare dintr-un tabel asociat. Aceasta este o facilitate puternică a T-SQL.

**Sintaxă:**
```sql
UPDATE  alias_tabel_actualizat
SET     alias_tabel_actualizat.coloana = expresie
FROM    TabelActualizat AS alias_tabel_actualizat
INNER JOIN AltTabel AS alias ON conditie_join
WHERE   filtru_optional;
```

### Exemplul 1 — Scumpirea produselor dintr-o categorie, după numele categoriei

```sql
-- Previzualizare
SELECT p.Id, p.Denumire, p.Pret AS PretVechi, p.Pret * 1.10 AS PretNou
FROM   Produse AS p
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
WHERE  c.Nume = 'Electronice';

-- Actualizare
UPDATE p
SET    p.Pret = p.Pret * 1.10
FROM   Produse AS p
INNER JOIN Categorii AS c ON p.IdCategorie = c.Id
WHERE  c.Nume = 'Electronice';
```

### Exemplul 2 — Sincronizarea prețurilor unei comenzi cu prețurile curente (varianta cu JOIN)

```sql
-- Previzualizare
SELECT d.IdComanda, d.IdProdus, d.Pret AS PretVechi, p.Pret AS PretNou
FROM   Detalii AS d
INNER JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  d.IdComanda = 7
AND    d.Pret <> p.Pret;

-- Actualizare
UPDATE d
SET    d.Pret = p.Pret
FROM   Detalii AS d
INNER JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  d.IdComanda = 7
AND    d.Pret <> p.Pret;
```

### Exemplul 3 — Reducere de 15% pentru produsele din categoriile cu vânzări mari

```sql
-- Previzualizare: ce produse aparțin categoriilor cu vânzări totale > 500 lei?
SELECT p.Id, p.Denumire, p.Pret, v.TotalVandut
FROM   Produse AS p
INNER JOIN (
    SELECT p2.IdCategorie, SUM(d.Cantitate * d.Pret) AS TotalVandut
    FROM   Detalii AS d
    INNER JOIN Produse AS p2 ON d.IdProdus = p2.Id
    GROUP BY p2.IdCategorie
    HAVING SUM(d.Cantitate * d.Pret) > 500
) AS v ON p.IdCategorie = v.IdCategorie;

-- Actualizare
UPDATE p
SET    p.Pret = p.Pret * 0.85
FROM   Produse AS p
INNER JOIN (
    SELECT p2.IdCategorie
    FROM   Detalii AS d
    INNER JOIN Produse AS p2 ON d.IdProdus = p2.Id
    GROUP BY p2.IdCategorie
    HAVING SUM(d.Cantitate * d.Pret) > 500
) AS categorii_populare ON p.IdCategorie = categorii_populare.IdCategorie;
```

### Exemplul 4 — Scăderea stocului după livrarea unei comenzi

```sql
-- Comanda 5 a fost livrată: scădem din stoc cantitățile de pe fiecare linie
UPDATE p
SET    p.Stoc = p.Stoc - d.Cantitate
FROM   Produse AS p
INNER JOIN Detalii AS d ON p.Id = d.IdProdus
WHERE  d.IdComanda = 5;
```

Dacă pentru vreun produs stocul ar deveni negativ, constrângerea `CHK_Produse_Stoc` (`Stoc >= 0`) respinge **întreaga** instrucțiune — niciun rând nu este modificat.

---

## UPDATE cu clauza OUTPUT

`OUTPUT` capturează starea rândurilor înainte (`DELETED`) și după (`INSERTED`) actualizare.

```sql
-- Scumpim produsele cu stoc mic și vedem prețurile vechi și noi
UPDATE Produse
SET    Pret = Pret * 1.05
OUTPUT INSERTED.Id,
       INSERTED.Denumire,
       DELETED.Pret  AS PretVechi,
       INSERTED.Pret AS PretNou
WHERE  Stoc < 50;
```

Salvăm modificările capturate într-un tabel de audit:

```sql
DECLARE @IstoricPreturi TABLE (
    IdProdus    INT,
    PretVechi   DECIMAL(10, 2),
    PretNou     DECIMAL(10, 2),
    ModificatLa DATETIME DEFAULT GETDATE()
);

UPDATE Produse
SET    Pret = Pret * 1.05
OUTPUT DELETED.Id, DELETED.Pret, INSERTED.Pret
INTO   @IstoricPreturi (IdProdus, PretVechi, PretNou)
WHERE  Stoc < 50;

SELECT * FROM @IstoricPreturi;
```

---

## Tranzacții pentru siguranță

Include un UPDATE riscant într-o tranzacție, ca să-l poți anula (rollback) dacă ceva pare greșit:

```sql
BEGIN TRANSACTION;

UPDATE Produse
SET    Pret = Pret * 1.10
WHERE  IdCategorie = 1;

-- Verificăm rezultatul înainte de confirmare (commit)
SELECT Id, Denumire, Pret FROM Produse WHERE IdCategorie = 1;

-- Dacă arată corect:
COMMIT TRANSACTION;

-- Dacă ceva este greșit:
-- ROLLBACK TRANSACTION;
```

> **Notă:** Cât timp tranzacția este deschisă, rândurile modificate sunt blocate pentru alte sesiuni. Nu lăsa tranzacția deschisă — încheie-o cu `COMMIT` sau `ROLLBACK`.

---

## Greșeli frecvente

```sql
-- GREȘEALA 1: Fără clauza WHERE (actualizează TOATE produsele)
UPDATE Produse SET Pret = 9.99;   -- PERICOL

-- GREȘEALA 2: Actualizarea aliasului greșit într-un UPDATE cu FROM/JOIN
UPDATE d                           -- alias corect — acesta este tabelul actualizat
SET    d.Pret = p.Pret
FROM   Detalii AS d
INNER JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  d.IdComanda = 7;

-- Dacă ai scris din greșeală:
UPDATE p                           -- GREȘIT — aceasta ar actualiza Produse, nu Detalii
SET    p.Pret = d.Pret
FROM   Detalii AS d
INNER JOIN Produse AS p ON d.IdProdus = p.Id
WHERE  d.IdComanda = 7;

-- GREȘEALA 3: Confuzia între cele două coloane Pret
UPDATE Produse SET Pret = 0 WHERE Id = 1;   -- schimbă prețul din catalog
UPDATE Detalii SET Pret = 0 WHERE IdProdus = 1;   -- rescrie prețul plătit în TOATE comenzile vechi!
```

---

## Exerciții practice

**Exercițiul 1**
Actualizează `Stoc` pentru produsul cu `Id = 3` la valoarea `25`.

**Exercițiul 2**
Mărește cu 5% prețul tuturor produselor din categoria `Imbracaminte`. Identifică categoria după nume, nu după `Id`.

**Exercițiul 3**
Într-o singură instrucțiune, setează telefonul clientului 3 la `'0740111222'` și adresa lui la `'Str. Palat 1'`.

**Exercițiul 4**
Folosind o subinterogare în `WHERE`, aplică o reducere de 10% la prețul tuturor liniilor din `Detalii` care aparțin comenzilor plasate în februarie 2024.

**Exercițiul 5**
Folosind `UPDATE ... FROM ... JOIN`, scade din stocul produselor cantitățile comandate în comanda 4. Ce s-ar întâmpla dacă stocul unuia dintre produse ar fi mai mic decât cantitatea comandată?

**Exercițiul 6**
Folosind `UPDATE ... FROM ... JOIN`, mută toate produsele din categoria `'Casa si gradina'` în categoria `'Sport'`, identificând ambele categorii după nume.

**Exercițiul 7**
Folosind `UPDATE` cu `OUTPUT`, scumpește cu 10% toate produsele cu stocul sub 50 de bucăți și capturează `Id`, prețul vechi și prețul nou într-o variabilă de tip tabel. La final, afișează conținutul variabilei.

**Exercițiul 8**
Folosind o tranzacție, aplică o creștere de preț de 20% tuturor produselor din Electronice, apoi execută imediat un `SELECT` pe acele produse pentru a verifica modificarea. Fă fie `COMMIT`, fie `ROLLBACK`, cu o explicație.
