# Baza de date eCommerce — Fișa de lucru 2: DDL — Crearea bazei de date

## Obiective de învățare
- Folosirea `CREATE DATABASE` și `CREATE TABLE` pentru a construi o bază de date de la zero
- Definirea cheilor primare (simple și compuse), a cheilor străine și a altor constrângeri în T-SQL
- Folosirea `ALTER TABLE` pentru a adăuga sau modifica coloane și constrângeri după crearea unui tabel
- Ștergerea în siguranță a tabelelor și a bazelor de date, în ordinea corectă

---

## Prezentare generală DDL

Instrucțiunile DDL (Data Definition Language — limbajul de definire a datelor) definesc și modifică **structura** obiectelor bazei de date.

| Instrucțiune | Scop |
|---|---|
| `CREATE` | Creează o bază de date nouă, un tabel, o vedere, un index etc. |
| `ALTER` | Modifică o structură existentă (adaugă/elimină/schimbă coloane sau constrângeri) |
| `DROP` | Elimină definitiv un obiect al bazei de date |
| `TRUNCATE` | Elimină toate rândurile dintr-un tabel, dar păstrează structura |

---

## Structura bazei de date

| Tabel | Coloană | Tip | Null? | Implicit | Constrângeri |
|---|---|---|---|---|---|
| **Categorii** | Id | `INT IDENTITY(1,1)` | NOT NULL | | PK |
| | Nume | `VARCHAR(50)` | NOT NULL | | UNIQUE |
| **Clienti** | Id | `INT IDENTITY(1,1)` | NOT NULL | | PK |
| | Nume | `VARCHAR(50)` | NOT NULL | | |
| | Prenume | `VARCHAR(50)` | NOT NULL | | |
| | Oras | `VARCHAR(50)` | NOT NULL | | |
| | Adresa | `VARCHAR(200)` | NULL | | |
| | DataNasterii | `DATETIME` | NOT NULL | `GETDATE()` | |
| | Telefon | `VARCHAR(10)` | NULL | | |
| **Comenzi** | Id | `INT IDENTITY(1,1)` | NOT NULL | | PK |
| | Data | `DATETIME` | NOT NULL | `GETDATE()` | |
| | IdClient | `INT` | NOT NULL | | FK → Clienti.Id |
| **Produse** | Id | `INT IDENTITY(1,1)` | NOT NULL | | PK |
| | IdCategorie | `INT` | NOT NULL | | FK → Categorii.Id |
| | Denumire | `VARCHAR(100)` | NOT NULL | | |
| | Pret | `DECIMAL(10,2)` | NOT NULL | | `Pret >= 0` |
| | Stoc | `INT` | NOT NULL | `0` | `Stoc >= 0` |
| **Detalii** | IdComanda | `INT` | NOT NULL | | PK, FK → Comenzi.Id |
| | IdProdus | `INT` | NOT NULL | | PK, FK → Produse.Id |
| | Cantitate | `INT` | NOT NULL | | `Cantitate > 0` |
| | Pret | `DECIMAL(10,2)` | NOT NULL | | `Pret >= 0` |

> **De ce `DECIMAL` pentru prețuri?** Tipurile `FLOAT`/`REAL` sunt aproximative (0.1 + 0.2 nu dă exact 0.3). `DECIMAL(10,2)` stochează exact până la 10 cifre, dintre care 2 după virgulă — potrivit pentru sume de bani.

> **`VARCHAR` și diacriticele:** `VARCHAR` stochează textul folosind pagina de cod a colației bazei de date. Cu colația implicită `SQL_Latin1_General_CP1_CI_AS`, literele `ș`, `ț` și `ă` nu există și sunt salvate ca `?`. De aceea datele de exemplu din aceste fișe sunt scrise fără diacritice („Bucuresti”, „Carti”). Dacă ai nevoie de diacritice, folosește `NVARCHAR` (Unicode) și scrie literalii cu prefixul `N`: `N'București'`.

---

## Pasul 1: Crearea bazei de date

```sql
-- Creăm baza de date
CREATE DATABASE eCommerceDB;
GO

-- Trecem la ea
USE eCommerceDB;
GO
```

> **Notă:** Cuvântul-cheie `GO` nu este SQL — este un separator de loturi (batch) folosit de SQL Server Management Studio (SSMS) și de sqlcmd pentru a trimite serverului comenzile precedente ca un singur lot.

---

## Pasul 2: Crearea tabelelor

Tabelele trebuie create **începând cu tabelele părinte**. Un tabel copil care referă un părinte printr-o cheie străină nu poate fi creat înainte ca părintele să existe.

**Ordinea de creare:** Categorii → Clienti → Produse → Comenzi → Detalii

---

### Tabelul 1: Categorii

Stochează categoriile de produse. Este un tabel părinte, fără chei străine.

```sql
CREATE TABLE Categorii (
    Id    INT          IDENTITY(1,1)  NOT NULL,
    Nume  VARCHAR(50)                 NOT NULL,

    CONSTRAINT PK_Categorii PRIMARY KEY (Id),
    CONSTRAINT UQ_Categorii_Nume UNIQUE (Nume)
);
GO
```

Constrângerea `UNIQUE` împiedică existența a două categorii cu același nume.

---

### Tabelul 2: Clienti

Stochează clienții înregistrați.

```sql
CREATE TABLE Clienti (
    Id            INT           IDENTITY(1,1)       NOT NULL,
    Nume          VARCHAR(50)                       NOT NULL,
    Prenume       VARCHAR(50)                       NOT NULL,
    Oras          VARCHAR(50)                       NOT NULL,
    Adresa        VARCHAR(200)                      NULL,
    DataNasterii  DATETIME      DEFAULT GETDATE()   NOT NULL,
    Telefon       VARCHAR(10)                       NULL,

    CONSTRAINT PK_Clienti PRIMARY KEY (Id)
);
GO
```

- `Nume` este numele de familie, `Prenume` este prenumele.
- `Telefon` are exact 10 caractere pentru un număr românesc (`0721123456`), fără spații sau prefixul `+40`.
- `DEFAULT GETDATE()` completează `DataNasterii` cu data curentă dacă `INSERT`-ul nu o specifică.

---

### Tabelul 3: Produse

Stochează articolele de vânzare. Referă `Categorii`.

```sql
CREATE TABLE Produse (
    Id           INT             IDENTITY(1,1)  NOT NULL,
    IdCategorie  INT                            NOT NULL,
    Denumire     VARCHAR(100)                   NOT NULL,
    Pret         DECIMAL(10, 2)                 NOT NULL,
    Stoc         INT             DEFAULT 0      NOT NULL,

    CONSTRAINT PK_Produse PRIMARY KEY (Id),
    CONSTRAINT FK_Produse_Categorii
        FOREIGN KEY (IdCategorie) REFERENCES Categorii(Id),
    CONSTRAINT CHK_Produse_Pret
        CHECK (Pret >= 0),
    CONSTRAINT CHK_Produse_Stoc
        CHECK (Stoc >= 0)
);
GO
```

---

### Tabelul 4: Comenzi

Stochează antetele comenzilor (cine a comandat și când). Referă `Clienti`.

```sql
CREATE TABLE Comenzi (
    Id        INT       IDENTITY(1,1)      NOT NULL,
    Data      DATETIME  DEFAULT GETDATE()  NOT NULL,
    IdClient  INT                          NOT NULL,

    CONSTRAINT PK_Comenzi PRIMARY KEY (Id),
    CONSTRAINT FK_Comenzi_Clienti
        FOREIGN KEY (IdClient) REFERENCES Clienti(Id)
);
GO
```

> **Notă:** `Data` este un nume de coloană valid, dar seamănă cu tipul `DATE`. Dacă editorul îl colorează ca pe un cuvânt-cheie, îl poți scrie între paranteze drepte: `[Data]`.

---

### Tabelul 5: Detalii

Stochează liniile individuale (produsele) dintr-o comandă. Referă atât `Comenzi`, cât și `Produse`.

```sql
CREATE TABLE Detalii (
    IdComanda  INT             NOT NULL,
    IdProdus   INT             NOT NULL,
    Cantitate  INT             NOT NULL,
    Pret       DECIMAL(10, 2)  NOT NULL,

    CONSTRAINT PK_Detalii PRIMARY KEY (IdComanda, IdProdus),
    CONSTRAINT FK_Detalii_Comenzi
        FOREIGN KEY (IdComanda) REFERENCES Comenzi(Id),
    CONSTRAINT FK_Detalii_Produse
        FOREIGN KEY (IdProdus) REFERENCES Produse(Id),
    CONSTRAINT CHK_Detalii_Cantitate
        CHECK (Cantitate > 0),
    CONSTRAINT CHK_Detalii_Pret
        CHECK (Pret >= 0)
);
GO
```

- **Cheia primară compusă** `(IdComanda, IdProdus)`: un produs apare cel mult o dată într-o comandă. Dacă clientul cumpără 3 bucăți, avem un singur rând cu `Cantitate = 3`, nu trei rânduri.
- `Detalii.Pret` este prețul unitar **de la momentul comenzii**. Este diferit de `Produse.Pret` (prețul curent): dacă produsul se scumpește, comenzile vechi își păstrează prețul plătit.
- Totalul unei linii este `Cantitate * Pret`; totalul unei comenzi este suma liniilor ei.

---

## Pasul 3: Adăugarea cheilor străine cu ALTER TABLE (metodă alternativă)

În loc să definești cheile străine în interiorul `CREATE TABLE`, le poți adăuga ulterior:

```sql
-- Adăugăm FK în Produse după ce ambele tabele există
ALTER TABLE Produse
ADD CONSTRAINT FK_Produse_Categorii
    FOREIGN KEY (IdCategorie) REFERENCES Categorii(Id);
GO

-- Adăugăm FK în Comenzi după ce ambele tabele există
ALTER TABLE Comenzi
ADD CONSTRAINT FK_Comenzi_Clienti
    FOREIGN KEY (IdClient) REFERENCES Clienti(Id);
GO

-- Adăugăm FK-urile în Detalii
ALTER TABLE Detalii
ADD CONSTRAINT FK_Detalii_Comenzi
    FOREIGN KEY (IdComanda) REFERENCES Comenzi(Id);
GO

ALTER TABLE Detalii
ADD CONSTRAINT FK_Detalii_Produse
    FOREIGN KEY (IdProdus) REFERENCES Produse(Id);
GO
```

> **Când folosim această abordare:** Când trebuie să creăm tabele ale căror referințe FK formează un ciclu sau când adăugăm constrângeri unei baze de date existente fără a reconstrui tabelele.

---

## Pasul 4: Verificarea schemei

```sql
-- Vizualizăm toate coloanele unui tabel
EXEC sp_help 'Produse';
GO

-- Listăm toate coloanele cu tipurile lor de date
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Produse';
GO

-- Listăm toate constrângerile
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
GO

-- Listăm relațiile de cheie străină
SELECT
    fk.name                       AS NumeFK,
    tp.name                       AS TabelCopil,
    cp.name                       AS ColoanaCopil,
    tr.name                       AS TabelParinte,
    cr.name                       AS ColoanaParinte
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.tables tp  ON fkc.parent_object_id     = tp.object_id
JOIN sys.columns cp ON fkc.parent_object_id     = cp.object_id
                    AND fkc.parent_column_id     = cp.column_id
JOIN sys.tables tr  ON fkc.referenced_object_id = tr.object_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id
                    AND fkc.referenced_column_id = cr.column_id;
GO
```

---

## Pasul 5: Modificarea tabelelor cu ALTER TABLE

```sql
-- Adăugăm o coloană nouă
ALTER TABLE Clienti
ADD Email VARCHAR(100) NULL;
GO

-- Schimbăm tipul de date al unei coloane (permitem și prefixul +40)
ALTER TABLE Clienti
ALTER COLUMN Telefon VARCHAR(15) NULL;
GO

-- Ștergem o coloană
ALTER TABLE Clienti
DROP COLUMN Email;
GO

-- Adăugăm o constrângere CHECK unui tabel existent
ALTER TABLE Produse
ADD CONSTRAINT CHK_Produse_Denumire CHECK (LEN(Denumire) >= 2);
GO

-- Ștergem o constrângere
ALTER TABLE Produse
DROP CONSTRAINT CHK_Produse_Denumire;
GO
```

> **Atenție la valorile implicite:** `DEFAULT GETDATE()` din `CREATE TABLE` creează o constrângere cu un nume generat automat (de ex. `DF__Clienti__DataNa__3B75D760`). O coloană care are o constrângere `DEFAULT` nu poate fi ștearsă sau modificată până nu ștergi constrângerea. Ca să ai un nume previzibil, numește-o explicit: `DataNasterii DATETIME CONSTRAINT DF_Clienti_DataNasterii DEFAULT GETDATE() NOT NULL`.

---

## Pasul 6: Ștergerea tabelelor și a bazei de date

Tabelele trebuie șterse **începând cu tabelele copil** (în ordinea inversă creării).

```sql
-- Ștergem în ordinea inversă a dependențelor
DROP TABLE IF EXISTS Detalii;
DROP TABLE IF EXISTS Comenzi;
DROP TABLE IF EXISTS Produse;
DROP TABLE IF EXISTS Clienti;
DROP TABLE IF EXISTS Categorii;
GO

-- Ștergem baza de date (mai întâi trebuie să trecem pe altă bază de date)
USE master;
GO
DROP DATABASE IF EXISTS eCommerceDB;
GO
```

---

## Script complet, gata de rulat

```sql
-- ============================================================
-- eCommerceDB — Script complet de creare
-- Rulează acest script în SSMS pentru a construi baza de date de la zero
-- ============================================================

USE master;
GO

-- Ștergem baza de date existentă, dacă există
IF EXISTS (SELECT name FROM sys.databases WHERE name = 'eCommerceDB')
BEGIN
    ALTER DATABASE eCommerceDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE eCommerceDB;
END
GO

CREATE DATABASE eCommerceDB;
GO
USE eCommerceDB;
GO

-- Categorii
CREATE TABLE Categorii (
    Id    INT          IDENTITY(1,1)  NOT NULL,
    Nume  VARCHAR(50)                 NOT NULL,
    CONSTRAINT PK_Categorii      PRIMARY KEY (Id),
    CONSTRAINT UQ_Categorii_Nume UNIQUE (Nume)
);
GO

-- Clienti
CREATE TABLE Clienti (
    Id            INT           IDENTITY(1,1)      NOT NULL,
    Nume          VARCHAR(50)                      NOT NULL,
    Prenume       VARCHAR(50)                      NOT NULL,
    Oras          VARCHAR(50)                      NOT NULL,
    Adresa        VARCHAR(200)                     NULL,
    DataNasterii  DATETIME      DEFAULT GETDATE()  NOT NULL,
    Telefon       VARCHAR(10)                      NULL,
    CONSTRAINT PK_Clienti PRIMARY KEY (Id)
);
GO

-- Produse
CREATE TABLE Produse (
    Id           INT             IDENTITY(1,1)  NOT NULL,
    IdCategorie  INT                            NOT NULL,
    Denumire     VARCHAR(100)                   NOT NULL,
    Pret         DECIMAL(10, 2)                 NOT NULL,
    Stoc         INT             DEFAULT 0      NOT NULL,
    CONSTRAINT PK_Produse PRIMARY KEY (Id),
    CONSTRAINT FK_Produse_Categorii FOREIGN KEY (IdCategorie) REFERENCES Categorii(Id),
    CONSTRAINT CHK_Produse_Pret CHECK (Pret >= 0),
    CONSTRAINT CHK_Produse_Stoc CHECK (Stoc >= 0)
);
GO

-- Comenzi
CREATE TABLE Comenzi (
    Id        INT       IDENTITY(1,1)      NOT NULL,
    Data      DATETIME  DEFAULT GETDATE()  NOT NULL,
    IdClient  INT                          NOT NULL,
    CONSTRAINT PK_Comenzi PRIMARY KEY (Id),
    CONSTRAINT FK_Comenzi_Clienti FOREIGN KEY (IdClient) REFERENCES Clienti(Id)
);
GO

-- Detalii
CREATE TABLE Detalii (
    IdComanda  INT             NOT NULL,
    IdProdus   INT             NOT NULL,
    Cantitate  INT             NOT NULL,
    Pret       DECIMAL(10, 2)  NOT NULL,
    CONSTRAINT PK_Detalii           PRIMARY KEY (IdComanda, IdProdus),
    CONSTRAINT FK_Detalii_Comenzi   FOREIGN KEY (IdComanda) REFERENCES Comenzi(Id),
    CONSTRAINT FK_Detalii_Produse   FOREIGN KEY (IdProdus)  REFERENCES Produse(Id),
    CONSTRAINT CHK_Detalii_Cantitate CHECK (Cantitate > 0),
    CONSTRAINT CHK_Detalii_Pret      CHECK (Pret >= 0)
);
GO
```

---

## Exerciții practice

**Exercițiul 1**
Scrie instrucțiunea `CREATE TABLE` pentru un tabel nou numit `Recenzii` cu următoarele coloane: `Id` (PK cu auto-incrementare), `IdProdus` (FK către Produse), `IdClient` (FK către Clienti), `Nota` (număr întreg 1–5, obligatoriu), `Comentariu` (până la 1000 de caractere, opțional), `Data` (dată, implicit ziua curentă).

**Exercițiul 2**
Tabelul `Comenzi` are nevoie de o coloană nouă `Reducere` de tip `DECIMAL(10,2)`, care nu poate fi negativă și are valoarea implicită `0`. Scrie instrucțiunea `ALTER TABLE`.

**Exercițiul 3**
Scrie o interogare care folosește `INFORMATION_SCHEMA` pentru a lista numele fiecărui tabel și numărul de coloane ale fiecăruia.

**Exercițiul 4**
Un programator a creat tabelul `Detalii` înainte de `Comenzi` și a primit o eroare. Explică ce eroare este și de ce a apărut.

**Exercițiul 5**
De ce tabelul `Detalii` nu are o coloană `Id` proprie? Ce s-ar întâmpla dacă am încerca să inserăm de două ori produsul 1 în comanda 1?

**Exercițiul 6**
Scrie instrucțiunile pentru a șterge în siguranță întreaga bază de date `eCommerceDB`, tratând inclusiv cazul în care aceasta nu există.
