# Baza de date Library — Fișa de lucru 1: Normalizarea bazei de date (UNF până la 3NF)

## Obiective de învățare
- Identificarea anomaliilor care apar atunci când datele bibliotecii sunt stocate într-un tabel plat, nenormalizat
- Aplicarea pas cu pas a transformărilor 1NF, 2NF și 3NF
- Înțelegerea diferenței dintre un *titlu* (opera intelectuală) și o *carte* (exemplarul fizic)
- Descrierea schemei finale Library și a relațiilor dintre tabelele sale

---

## De ce normalizăm?

O bibliotecă publică gestionează cărți, autori, edituri, clienți și împrumuturi. Fără normalizare:

**Anomalia de inserare:** Pentru a înregistra un autor nou, ai nevoie de cel puțin un titlu de care să-l legi. Nu poți stoca faptul că „un autor nou a intrat în catalog” fără a avea mai întâi un titlu scris de el.

**Anomalia de actualizare:** Dacă o editură își schimbă adresa, acea adresă poate apărea în zeci de rânduri de împrumut. Actualizarea doar a unora dintre ele lasă datele inconsecvente.

**Anomalia de ștergere:** Dacă ștergi singurul împrumut al unei anumite cărți, poți pierde informațiile despre editura acelei cărți — chiar dacă atât cartea, cât și editura încă există.

---

## Cele trei forme normale — Referință rapidă

| Forma normală | Regulă | Întrebare-cheie |
|---|---|---|
| **1NF** | Valori atomice, fără grupuri repetitive, fiecare rând identificabil în mod unic | „Există celule cu mai multe valori sau grupuri de coloane precum Author1, Author2?” |
| **2NF** | 1NF + fără dependențe parțiale față de o cheie compusă | „Depinde fiecare coloană non-cheie de *întreaga* cheie?” |
| **3NF** | 2NF + fără dependențe tranzitive | „Există vreo coloană non-cheie care determină o altă coloană non-cheie?” |

---

## Pasul 1 — Forma nenormalizată (UNF)

Un proiect naiv stochează toate informațiile despre împrumuturi într-un singur tabel plat:

**Tabel: library_flat**

| RentalID | ClientName | ClientEmail | ClientPhone | BookTitle | AuthorFirstName | AuthorLastName | PublisherName | PublisherAddress | Genre | ISBN | RentalDate | DueDate | ReturnDate | RentalDays |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Maria Pop | maria@mail.com | 555-01 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St, Boston | Technology | 978-0135957059 | 2024-01-10 | 2024-01-24 | 2024-01-20 | 14 |
| 2 | Ion Ionescu | ion@mail.com | 555-02 | Clean Code | Robert | Martin | Prentice Hall | 1 Lake St, NJ | Technology | 978-0132350884 | 2024-01-11 | 2024-01-25 | NULL | 14 |
| 3 | Maria Pop | maria@mail.com | 555-01 | Design Patterns | Erich | Gamma | Addison-Wesley | 75 Arlington St, Boston | Technology | 978-0201633610 | 2024-01-12 | 2024-01-19 | 2024-01-17 | 7 |
| 4 | Ana Dumitrescu | ana@mail.com | 555-03 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St, Boston | Technology | 978-0135957059 | 2024-01-14 | 2024-01-28 | NULL | 14 |
| 5 | Ion Ionescu | ion@mail.com | 555-02 | Clean Code | Robert | Martin | O'Reilly | 1005 Gravenstein Hwy, CA | Technology | 978-0132350884 | 2024-01-15 | 2024-01-22 | 2024-01-20 | 7 |
| 6 | Maria Pop | maria@mail.com | 555-01 | 1984 | George | Orwell | Penguin Books | 80 Strand, London | Fiction | 978-0141036144 | 2024-01-17 | 2024-01-31 | NULL | 14 |

**Probleme vizibile aici:**
- Datele clientului (nume, email, telefon) se repetă pentru fiecare împrumut pe care îl face
- Datele autorului se repetă pentru fiecare exemplar împrumutat din cărțile sale
- Datele editurii se repetă pe rândurile 1, 3, 4 — „Addison-Wesley” și adresa sa apar de trei ori
- Rândul 5 arată același ISBN împrumutat de la o editură diferită — este ISBN-ul identificatorul unic al titlului sau al cărții?
- Se pierde diferența dintre „titlu” (opera intelectuală) și „carte” (un exemplar fizic)

---

## Pasul 2 — Prima formă normală (1NF)

**Reguli:** Valori atomice, fără grupuri repetitive, fiecare rând este identificabil în mod unic.

Tabelul plat are deja valori atomice, dar confundă *titlul* cu *cartea fizică*. Trebuie să le separăm. Avem, de asemenea, câte un rând pentru fiecare împrumut, ceea ce este în regulă.

**Transformare:** Atribuim o cheie primară (`RentalID` există deja). Introducem un `BookID` care să reprezinte exemplarul fizic.

**Tabel: rental_1nf** — câte un rând pentru fiecare împrumut, valori atomice

| RentalID | ClientName | ClientEmail | ClientPhone | BookID | BookTitle | AuthorFirstName | AuthorLastName | PublisherName | PublisherAddress | Genre | ISBN | RentalDate | DueDate | ReturnDate | RentalDays |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Maria Pop | maria@mail.com | 555-01 | B1 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St | Technology | 978-0135957059 | 2024-01-10 | 2024-01-24 | 2024-01-20 | 14 |
| 2 | Ion Ionescu | ion@mail.com | 555-02 | B2 | Clean Code | Robert | Martin | Prentice Hall | 1 Lake St, NJ | Technology | 978-0132350884 | 2024-01-11 | 2024-01-25 | NULL | 14 |
| 3 | Maria Pop | maria@mail.com | 555-01 | B3 | Design Patterns | Erich | Gamma | Addison-Wesley | 75 Arlington St | Technology | 978-0201633610 | 2024-01-12 | 2024-01-19 | 2024-01-17 | 7 |
| 4 | Ana Dumitrescu | ana@mail.com | 555-03 | B1 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St | Technology | 978-0135957059 | 2024-01-14 | 2024-01-28 | NULL | 14 |
| 5 | Ion Ionescu | ion@mail.com | 555-02 | B4 | Clean Code | Robert | Martin | O'Reilly | 1005 Gravenstein | Technology | 978-0132350884 | 2024-01-15 | 2024-01-22 | 2024-01-20 | 7 |
| 6 | Maria Pop | maria@mail.com | 555-01 | B5 | 1984 | George | Orwell | Penguin Books | 80 Strand, London | Fiction | 978-0141036144 | 2024-01-17 | 2024-01-31 | NULL | 14 |

PK: `RentalID`

**Acum în 1NF.** Dar rămâne multă redundanță — datele clienților și ale cărților se repetă de la un rând la altul.

---

## Pasul 3 — A doua formă normală (2NF)

**Reguli:** 1NF + fără dependențe parțiale. Deoarece `RentalID` este o cheie primară formată dintr-o singură coloană (nu compusă), toate coloanele non-cheie depind deja de întreaga cheie.

Totuși, există dependențe funcționale clare între coloanele non-cheie, care ar trebui extrase. Identificăm ce coloane aparțin fiecărei entități:

| Coloană | Determină / Aparține de |
|---|---|
| ClientName, ClientEmail, ClientPhone | Identitatea clientului |
| BookTitle, AuthorFirstName, AuthorLastName, Genre, ISBN | Titlul (opera intelectuală) |
| PublisherName, PublisherAddress | Identitatea editurii |
| BookID + PublisherName | Exemplarul fizic al cărții |
| RentalDate, DueDate, ReturnDate, RentalDays | Evenimentul de împrumut |

După separare:

**Tabel: clients_2nf**

| ClientID | ClientName | ClientEmail | ClientPhone |
|---|---|---|---|
| 1 | Maria Pop | maria@mail.com | 555-01 |
| 2 | Ion Ionescu | ion@mail.com | 555-02 |
| 3 | Ana Dumitrescu | ana@mail.com | 555-03 |

**Tabel: authors_2nf**

| AuthorID | FirstName | LastName |
|---|---|---|
| 1 | David | Thomas |
| 2 | Robert | Martin |
| 3 | Erich | Gamma |
| 4 | George | Orwell |

**Tabel: publishers_2nf**

| PublisherID | PublisherName | Address |
|---|---|---|
| 1 | Addison-Wesley | 75 Arlington St, Boston |
| 2 | Prentice Hall | 1 Lake St, NJ |
| 3 | O'Reilly | 1005 Gravenstein Hwy, CA |
| 4 | Penguin Books | 80 Strand, London |

**Tabel: titles_2nf**

| TitleID | Title | AuthorID | Genre | ISBN |
|---|---|---|---|---|
| 1 | The Pragmatic Programmer | 1 | Technology | 978-0135957059 |
| 2 | Clean Code | 2 | Technology | 978-0132350884 |
| 3 | Design Patterns | 3 | Technology | 978-0201633610 |
| 4 | 1984 | 4 | Fiction | 978-0141036144 |

**Tabel: books_2nf** (exemplare fizice)

| BookID | TitleID | PublisherID | Condition | IsAvailable |
|---|---|---|---|---|
| B1 | 1 | 1 | Good | 0 |
| B2 | 2 | 2 | New | 0 |
| B3 | 3 | 1 | Fair | 1 |
| B4 | 2 | 3 | Good | 0 |
| B5 | 4 | 4 | New | 0 |

**Tabel: rentals_2nf**

| RentalID | ClientID | BookID | RentalDate | DueDate | ReturnDate | RentalDays |
|---|---|---|---|---|---|---|
| 1 | 1 | B1 | 2024-01-10 | 2024-01-24 | 2024-01-20 | 14 |
| 2 | 2 | B2 | 2024-01-11 | 2024-01-25 | NULL | 14 |
| 3 | 1 | B3 | 2024-01-12 | 2024-01-19 | 2024-01-17 | 7 |
| 4 | 3 | B1 | 2024-01-14 | 2024-01-28 | NULL | 14 |
| 5 | 2 | B4 | 2024-01-15 | 2024-01-22 | 2024-01-20 | 7 |
| 6 | 1 | B5 | 2024-01-17 | 2024-01-31 | NULL | 14 |

---

## Pasul 4 — A treia formă normală (3NF)

**Reguli:** 2NF + fără dependențe tranzitive.

Examinăm tabelele 2NF pentru a găsi dependențe tranzitive:

**În `rentals_2nf`:**
```
RentalDays → (DueDate - RentalDate) — calculat din alte coloane
```
`DueDate` poate fi obținut ca `RentalDate + RentalDays`. Stocarea ambelor creează o dependență tranzitivă. Păstrăm `RentalDays`, deoarece reprezintă perioada de împrumut convenită, iar `DueDate` poate fi calculat. În practică, stocarea explicită a `DueDate` este acceptabilă pentru comoditatea interogărilor, dar datele trebuie să fie întotdeauna consecvente.

**În `titles_2nf`:**
Dacă am fi stocat `AuthorNationality` alături de `AuthorID`, ar fi existat o dependență tranzitivă: `TitleID → AuthorID → AuthorNationality`. Naționalitatea autorului își are locul în tabelul `authors`, nu în `titles`.

În mod similar, dacă `PublisherCity` ar fi stocat în `books_2nf`, dependența ar fi tranzitivă: `BookID → PublisherID → PublisherCity`. Detaliile editurii își au locul în tabelul `publishers`.

Tabelele 2NF nu mai au dependențe tranzitive importante (pentru că am separat autorii și editurile în tabele proprii). Pasul final este adăugarea atributelor lipsă în tabelele potrivite.

---

## Rezumatul schemei finale

```
Authors
  AuthorID      (PK)
  FirstName
  LastName
  Nationality
  BirthDate

Publishers
  PublisherID   (PK)
  PublisherName
  Address
  Phone
  Email

Titles
  TitleID       (PK)
  Title
  AuthorID      (FK → Authors.AuthorID)
  Genre
  PublishedYear
  ISBN          (UNIQUE)

Books
  BookID        (PK)
  TitleID       (FK → Titles.TitleID)
  PublisherID   (FK → Publishers.PublisherID)
  AcquisitionDate
  Condition
  IsAvailable

Clients
  ClientID      (PK)
  FirstName
  LastName
  Email         (UNIQUE)
  Phone
  Address
  MembershipDate

Rentals
  RentalID      (PK)
  ClientID      (FK → Clients.ClientID)
  BookID        (FK → Books.BookID)
  RentalDate
  DueDate
  ReturnDate    (NULL = încă nereturnată)
  RentalDays
```

**Relații:**
- `Titles` → `Authors` (fiecare titlu are un singur autor)
- `Books` → `Titles` (un titlu poate avea multe exemplare fizice)
- `Books` → `Publishers` (fiecare exemplar fizic a fost publicat de o singură editură)
- `Rentals` → `Clients` (un client poate avea multe împrumuturi)
- `Rentals` → `Books` (fiecare împrumut se referă la un anumit exemplar fizic)

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
În tabelul plat UNF, de ce rândurile 2 și 5 au același `ISBN`, dar un `PublisherName` diferit? Ce îți spune acest lucru despre diferența dintre un titlu și o carte fizică?

**Exercițiul 2 (Ușor)**
În tabelul 1NF, care este cheia primară? De ce este importantă o coloană `BookID` chiar și în această etapă?

**Exercițiul 3 (Mediu)**
Să presupunem că biblioteca adaugă un al doilea exemplar fizic din „Clean Code”, publicat de „O'Reilly”. Cum ar fi reprezentat acest lucru în schema finală 3NF? Câte rânduri trebuie adăugate și în ce tabele?

**Exercițiul 4 (Mediu)**
Un coleg sugerează stocarea `AuthorFullName` ca o singură coloană (`"Robert Martin"`) în tabelul `Titles`, în loc de o FK către `Authors`. Ce problemă de normalizare creează acest lucru? Numește forma normală încălcată și explică de ce.

**Exercițiul 5 (Dificil)**
Gândește-te la stocarea `DaysOverdue` (data de azi minus `DueDate`) ca o coloană în `Rentals`. Este aceasta o încălcare a normalizării? Explică-ți raționamentul și descrie cum ai trata în schimb această cerință.

---

## Răspunsuri

**Exercițiul 1:** Același ISBN identifică același titlu intelectual („Clean Code” de Robert Martin), dar edituri diferite au tipărit ediții fizice diferite. `BookID` B2 și B4 sunt două exemplare fizice diferite ale aceluiași titlu, publicate de edituri diferite. Aceasta este diferența dintre un *titlu* și o *carte* (exemplar fizic).

**Exercițiul 2:** Cheia primară este `RentalID`. `BookID` este important deoarece există mai multe exemplare fizice ale aceluiași titlu; fără el nu putem urmări *ce exemplar* a fost împrumutat și nici nu putem înregistra faptul că același titlu a fost împrumutat simultan de doi clienți diferiți.

**Exercițiul 3:** Un singur rând nou în `Books` (cu noul `BookID`, cu `TitleID` care indică titlul existent Clean Code și cu `PublisherID` care indică O'Reilly). Nu sunt necesare rânduri noi în `Authors`, `Publishers` sau `Titles` — toate aceste entități există deja.

**Exercițiul 4:** Stocarea numelui complet ca un singur șir de caractere încalcă 1NF (numele nu este atomic — combină prenumele și numele de familie). De asemenea, face imposibilă sortarea după numele de familie sau căutarea după prenume fără manipularea șirurilor. Proiectarea corectă este o FK către un tabel `Authors`, cu coloane separate `FirstName` și `LastName`.

**Exercițiul 5:** `DaysOverdue` este o valoare *derivată* sau *calculată* — depinde în întregime de `DueDate` și de data curentă. Stocarea ei fizică ar crea o dependență tranzitivă (`RentalID → DueDate → DaysOverdue`) și ar necesita recalcularea zilnică pentru a rămâne corectă. Abordarea corectă este calcularea ei în momentul interogării: `DATEDIFF(DAY, DueDate, GETDATE())` într-o instrucțiune SELECT, sau crearea unei coloane calculate în definiția tabelului.
