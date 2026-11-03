# Baza de date eCommerce — Fișa de lucru 1: Normalizarea bazei de date (UNF până la 3NF)

## Obiective de învățare
- Înțelegerea motivelor pentru care normalizarea este necesară și a problemelor pe care le rezolvă
- Identificarea grupurilor repetitive, a dependențelor parțiale și a dependențelor tranzitive
- Transformarea unui tabel plat, nenormalizat, prin 1NF, 2NF și 3NF
- Descrierea schemei finale eCommerce și a relațiilor dintre tabelele sale

---

## De ce normalizăm? Anomaliile de date

Fără normalizare, toate datele se află într-un singur tabel mare și plat. Acest lucru provoacă trei probleme serioase:

**Anomalia de inserare** — Nu poți înregistra o nouă categorie de produse decât dacă ai și un produs care să-i aparțină. Vrei să adaugi categoria „Jucării” înainte de a avea vreo jucărie în stoc? Nu poți.

**Anomalia de actualizare** — Dacă numele de categorie „Electronice” apare în 500 de rânduri de produse și îl redenumești în „Electronice și IT”, trebuie să actualizezi 500 de rânduri. Dacă ratezi unul, datele devin inconsecvente.

**Anomalia de ștergere** — Dacă ștergi singurul produs din categoria „Cărți”, pierzi complet toate informațiile despre acea categorie, chiar dacă însăși categoria este încă validă.

Normalizarea elimină redundanța și face ca fiecare informație să existe într-un singur loc.

---

## Cele trei forme normale — Referință rapidă

| Forma normală | Regulă | Întrebare-cheie |
|---|---|---|
| **1NF** | Valori atomice, fără grupuri repetitive, fiecare rând identificabil în mod unic | „Conține fiecare celulă o singură valoare? Există grupuri de coloane precum Produs1, Produs2?” |
| **2NF** | 1NF + fără dependențe parțiale față de o cheie compusă | „Depinde fiecare coloană non-cheie de *întreaga* cheie primară sau doar de o parte a ei?” |
| **3NF** | 2NF + fără dependențe tranzitive | „Există vreo coloană non-cheie care determină o altă coloană non-cheie?” |

---

## Pasul 1 — Forma nenormalizată (UNF)

Imaginează-ți un proiectant de baze de date naiv care stochează fiecare comandă într-un singur rând de foaie de calcul, repetând coloanele de produs pentru fiecare articol din comandă:

**Tabel: comenzi_plat**

| IdComanda | Data | Client | Telefon | Oras | Produs1 | Categorie1 | Pret1 | Cant1 | Produs2 | Categorie2 | Pret2 | Cant2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-10 | Popescu Ana | 0721123456 | Bucuresti | Mouse wireless | Electronice | 89.99 | 2 | Tastatura mecanica | Electronice | 349.99 | 1 |
| 2 | 2024-01-11 | Ionescu Mihai | 0745987654 | Cluj-Napoca | Ghid SQL Server | Carti | 129.99 | 1 | Clean Code | Carti | 99.99 | 2 |
| 3 | 2024-01-14 | Popescu Ana | 0721123456 | Bucuresti | Pantofi de alergare | Sport | 399.99 | 1 | Tricou din bumbac | Imbracaminte | 49.99 | 3 |
| 4 | 2024-01-15 | Georgescu Elena | NULL | Iasi | Mouse wireless | Electronice | 89.99 | 1 | Monitor 27 inch | Electronice | 1499.99 | 1 |
| 5 | 2024-01-17 | Dumitru Andrei | 0733555111 | Timisoara | Tastatura mecanica | Electronice | 349.99 | 2 | NULL | NULL | NULL | NULL |
| 6 | 2024-01-18 | Stan Ioana | 0766444222 | Brasov | Sapa de gradina | Casa si gradina | 79.99 | 1 | NULL | NULL | NULL | NULL |

**Probleme vizibile aici:**
- Grupuri de coloane repetitive (Produs1/2, Categorie1/2 etc.) — ce se întâmplă dacă o comandă are 10 articole?
- Coloana `Client` conține două informații (numele de familie și prenumele) — nu este atomică
- Datele clientului (nume, telefon, oraș) sunt duplicate pentru fiecare comandă pe care o plasează
- „Electronice” apare în mai multe rânduri — o singură redenumire necesită modificarea multor rânduri
- Multe valori NULL pentru comenzile cu mai puține produse decât numărul maxim

---

## Pasul 2 — Prima formă normală (1NF)

**Reguli:**
- Fiecare celulă conține o singură valoare atomică (fără liste sau mulțimi)
- Fără grupuri de coloane repetitive
- Fiecare rând trebuie să fie identificabil în mod unic

**Transformare:** Împărțim `Client` în `Nume` și `Prenume`, apoi eliminăm grupurile de coloane Produs1/Produs2 creând câte un rând pentru fiecare produs din fiecare comandă.

**Tabel: comenzi_1nf**

| IdComanda | Data | Nume | Prenume | Telefon | Oras | Produs | Categorie | Pret | Cantitate |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-10 | Popescu | Ana | 0721123456 | Bucuresti | Mouse wireless | Electronice | 89.99 | 2 |
| 1 | 2024-01-10 | Popescu | Ana | 0721123456 | Bucuresti | Tastatura mecanica | Electronice | 349.99 | 1 |
| 2 | 2024-01-11 | Ionescu | Mihai | 0745987654 | Cluj-Napoca | Ghid SQL Server | Carti | 129.99 | 1 |
| 2 | 2024-01-11 | Ionescu | Mihai | 0745987654 | Cluj-Napoca | Clean Code | Carti | 99.99 | 2 |
| 3 | 2024-01-14 | Popescu | Ana | 0721123456 | Bucuresti | Pantofi de alergare | Sport | 399.99 | 1 |
| 3 | 2024-01-14 | Popescu | Ana | 0721123456 | Bucuresti | Tricou din bumbac | Imbracaminte | 49.99 | 3 |
| 4 | 2024-01-15 | Georgescu | Elena | NULL | Iasi | Mouse wireless | Electronice | 89.99 | 1 |

**Cheie primară (compusă):** `(IdComanda, Produs)`

**Acum în 1NF:** Fără grupuri repetitive, toate valorile sunt atomice, fiecare rând este unic.

**Probleme rămase:** Datele clientului se repetă încă pe rândurile aceleiași comenzi. Categoria și prețul produselor se repetă pentru fiecare comandă în care apar. Acestea sunt dependențe parțiale — următorul pas le rezolvă.

---

## Pasul 3 — A doua formă normală (2NF)

**Reguli:** Trebuie să fie în 1NF + fiecare atribut non-cheie trebuie să depindă de **întreaga** cheie primară compusă, nu doar de o parte a ei.

**Identificarea dependențelor parțiale** în `comenzi_1nf` cu PK = `(IdComanda, Produs)`:

| Coloană | Depinde doar de IdComanda? | Depinde doar de Produs? | Depinde de AMBELE (complet)? |
|---|---|---|---|
| Data | DA — dep. parțială | | |
| Nume | DA — dep. parțială | | |
| Prenume | DA — dep. parțială | | |
| Telefon | DA — dep. parțială | | |
| Oras | DA — dep. parțială | | |
| Categorie | | DA — dep. parțială | |
| **Cantitate** | | | DA — dependență completă |
| **Pret** | | | DA — vezi nota de mai jos |

> **Nota despre preț:** Prețul *curent* al unui produs depinde doar de produs. Dar prețul *plătit* într-o comandă este prețul de la momentul vânzării — dacă produsul se scumpește mâine, comenzile vechi trebuie să-și păstreze prețul inițial. De aceea vom păstra **două** coloane de preț: `Produse.Pret` (prețul curent, din catalog) și `Detalii.Pret` (prețul facturat pe acea linie de comandă).

**Transformare:** Mutăm dependențele parțiale în tabele proprii. Introducem chei numerice (`Id`) pentru clienți și produse.

**Tabel: clienti_2nf** (depinde doar de identitatea clientului)

| Id | Nume | Prenume | Telefon | Oras |
|---|---|---|---|---|
| 1 | Popescu | Ana | 0721123456 | Bucuresti |
| 2 | Ionescu | Mihai | 0745987654 | Cluj-Napoca |
| 3 | Georgescu | Elena | NULL | Iasi |

**Tabel: comenzi_2nf** (depinde doar de IdComanda)

| Id | Data | IdClient |
|---|---|---|
| 1 | 2024-01-10 | 1 |
| 2 | 2024-01-11 | 2 |
| 3 | 2024-01-14 | 1 |
| 4 | 2024-01-15 | 3 |

**Tabel: produse_2nf** (depinde doar de produs)

| Id | Denumire | Categorie | Pret |
|---|---|---|---|
| 1 | Mouse wireless | Electronice | 89.99 |
| 2 | Tastatura mecanica | Electronice | 349.99 |
| 3 | Monitor 27 inch | Electronice | 1499.99 |
| 4 | Ghid SQL Server | Carti | 129.99 |
| 5 | Clean Code | Carti | 99.99 |
| 6 | Pantofi de alergare | Sport | 399.99 |
| 7 | Tricou din bumbac | Imbracaminte | 49.99 |

**Tabel: detalii_2nf** (depinde de întreaga cheie compusă)

| IdComanda | IdProdus | Cantitate | Pret |
|---|---|---|---|
| 1 | 1 | 2 | 89.99 |
| 1 | 2 | 1 | 349.99 |
| 2 | 4 | 1 | 129.99 |
| 2 | 5 | 2 | 99.99 |
| 3 | 6 | 1 | 399.99 |
| 3 | 7 | 3 | 49.99 |
| 4 | 1 | 1 | 89.99 |
| 4 | 3 | 1 | 1499.99 |

Nu mai avem date de client repetate. Nu mai avem categorii de produs repetate pe fiecare linie de comandă.

---

## Pasul 4 — A treia formă normală (3NF)

**Reguli:** Trebuie să fie în 2NF + fără dependențe tranzitive. O dependență tranzitivă există atunci când o coloană non-cheie determină o altă coloană non-cheie.

**Identificarea dependențelor tranzitive** în `produse_2nf`:

Coloana `Categorie` stochează *numele* categoriei direct în tabelul de produse. Dar numele este un atribut al *categoriei*, nu al produsului în sine. Dacă redenumim „Electronice” în „Electronice și IT”, tot trebuie să actualizăm fiecare rând din tabelul de produse care o conține.

Dacă dăm fiecărei categorii un identificator, lanțul de dependențe devine vizibil:
```
Id (produs) → IdCategorie → Nume (categorie)
```

Numele categoriei depinde de `IdCategorie`, care este un atribut non-cheie al produsului — aceasta este o dependență tranzitivă.

**Transformare:** Extragem categoriile într-un tabel propriu.

**Tabel: Categorii**

| Id | Nume |
|---|---|
| 1 | Electronice |
| 2 | Carti |
| 3 | Sport |
| 4 | Imbracaminte |
| 5 | Casa si gradina |

**Tabel: Produse** (actualizat — numele categoriei înlocuit cu FK-ul `IdCategorie`; am adăugat și stocul)

| Id | IdCategorie | Denumire | Pret | Stoc |
|---|---|---|---|---|
| 1 | 1 | Mouse wireless | 89.99 | 150 |
| 2 | 1 | Tastatura mecanica | 349.99 | 80 |
| 3 | 1 | Monitor 27 inch | 1499.99 | 30 |
| 4 | 2 | Ghid SQL Server | 129.99 | 45 |
| 5 | 2 | Clean Code | 99.99 | 60 |
| 6 | 3 | Pantofi de alergare | 399.99 | 55 |
| 7 | 4 | Tricou din bumbac | 49.99 | 200 |

Acum numele categoriei există într-un singur loc. Redenumirea unei categorii necesită actualizarea unui singur rând în `Categorii`, nu a fiecărui rând de produs.

**Verificăm și celelalte tabele:** În `Clienti`, `Comenzi` și `Detalii` nu există nicio coloană non-cheie care să determine o altă coloană non-cheie, deci sunt deja în 3NF.

---

## Rezumatul schemei finale

După normalizarea completă, baza de date eCommerce are **5 tabele**:

```
Categorii
  Id            (PK)
  Nume          (UNIQUE)

Produse
  Id            (PK)
  IdCategorie   (FK → Categorii.Id)
  Denumire
  Pret          -- prețul curent din catalog
  Stoc

Clienti
  Id            (PK)
  Nume          -- numele de familie
  Prenume
  Oras
  Adresa
  DataNasterii
  Telefon

Comenzi
  Id            (PK)
  Data
  IdClient      (FK → Clienti.Id)

Detalii
  IdComanda     (PK, FK → Comenzi.Id)
  IdProdus      (PK, FK → Produse.Id)
  Cantitate
  Pret          -- prețul plătit la momentul comenzii
```

**Rezumatul relațiilor:**
- `Produse` → `Categorii` (mulți-la-unu: fiecare produs are o singură categorie)
- `Comenzi` → `Clienti` (mulți-la-unu: fiecare comandă aparține unui singur client)
- `Detalii` → `Comenzi` (mulți-la-unu: fiecare linie aparține unei singure comenzi)
- `Detalii` → `Produse` (mulți-la-unu: fiecare linie referă un singur produs)
- Prin `Detalii`, între `Comenzi` și `Produse` există o relație **mulți-la-mulți**: o comandă conține mai multe produse, iar un produs apare în mai multe comenzi.

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
În tabelul UNF, ce anomalie apare dacă încerci să adaugi o nouă categorie „Unelte de grădină” înainte de a avea vreun produs în acea categorie?

**Exercițiul 2 (Ușor)**
În tabelul 1NF `comenzi_1nf`, care este cheia primară compusă? De ce `IdComanda` singur nu este suficient?

**Exercițiul 3 (Mediu)**
De ce a fost împărțită coloana `Client` în `Nume` și `Prenume` la trecerea în 1NF? Dă un exemplu de interogare care ar fi dificilă dacă numele ar rămâne într-o singură coloană.

**Exercițiul 4 (Mediu)**
După atingerea 3NF, dacă o categorie este redenumită, câte rânduri trebuie actualizate? Câte rânduri ar trebui actualizate în versiunea 2NF?

**Exercițiul 5 (Dificil)**
Un coleg sugerează adăugarea unei coloane `Oras` direct în tabelul `Comenzi`, completată automat cu orașul clientului, „ca să nu mai facem JOIN cu `Clienti`”. Este aceasta o încălcare a normalizării? Ce s-ar schimba dacă orașul ar fi, de fapt, *orașul de livrare* al comenzii?

---

## Răspunsuri

**Exercițiul 1:** Anomalie de inserare. În tabelul UNF fiecare rând trebuie să aibă o comandă și un produs, deci o categorie care încă nu are produse nu poate fi stocată.

**Exercițiul 2:** Cheia primară compusă este `(IdComanda, Produs)`. `IdComanda` singur nu este unic, deoarece o comandă poate conține mai multe produse, fiecare apărând pe propriul rând.

**Exercițiul 3:** O valoare precum „Popescu Ana” conține două informații, deci nu este atomică. Dacă vrem, de exemplu, toți clienții cu numele de familie „Popescu” sau o listă sortată după prenume, ar trebui să despărțim textul la fiecare interogare (`SUBSTRING`, `CHARINDEX`), ceea ce este fragil (ce facem cu „Popa-Ionescu Ana Maria”?).

**Exercițiul 4:** În 3NF, redenumirea unei categorii înseamnă modificarea unui singur rând din tabelul `Categorii`. În versiunea 2NF, numele categoriei era stocat în fiecare rând de produs, deci trebuia actualizat fiecare produs din acea categorie (de ex. 3 rânduri pentru „Electronice”).

**Exercițiul 5:** Dacă `Oras` este doar o copie a orașului clientului, da — este o dependență tranzitivă: `Comenzi.Id → IdClient → Oras`. Orașul ar fi stocat de două ori și ar putea deveni inconsecvent când clientul se mută. Valoarea se obține corect printr-un JOIN cu `Clienti`. Dacă însă coloana reprezintă *orașul de livrare* al acelei comenzi (care poate diferi de cel al clientului), atunci depinde doar de comandă și locul ei este corect în `Comenzi` — este o informație diferită, nu o duplicare.
