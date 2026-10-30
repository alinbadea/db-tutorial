# Baza de date eCommerce — Fișa de lucru 1: Normalizarea bazei de date (UNF până la 3NF)

## Obiective de învățare
- Înțelegerea motivelor pentru care normalizarea este necesară și a problemelor pe care le rezolvă
- Identificarea grupurilor repetitive, a dependențelor parțiale și a dependențelor tranzitive
- Transformarea unui tabel plat, nenormalizat, prin 1NF, 2NF și 3NF
- Descrierea schemei finale eCommerce și a relațiilor dintre tabelele sale

---

## De ce normalizăm? Anomaliile de date

Fără normalizare, toate datele se află într-un singur tabel mare și plat. Acest lucru provoacă trei probleme serioase:

**Anomalia de inserare** — Nu poți înregistra o nouă categorie de produse decât dacă ai și un produs care să-i aparțină. Vrei să adaugi categoria „Toys” înainte de a avea vreo jucărie în stoc? Nu poți.

**Anomalia de actualizare** — Dacă numele de categorie „Electronics” apare în 500 de rânduri de produse și îl redenumești în „Consumer Electronics”, trebuie să actualizezi 500 de rânduri. Dacă ratezi unul, datele devin inconsecvente.

**Anomalia de ștergere** — Dacă ștergi singurul produs din categoria „Books”, pierzi complet toate informațiile despre acea categorie, chiar dacă însăși categoria este încă validă.

Normalizarea elimină redundanța și face ca fiecare informație să existe într-un singur loc.

---

## Cele trei forme normale — Referință rapidă

| Forma normală | Regulă | Întrebare-cheie |
|---|---|---|
| **1NF** | Valori atomice, fără grupuri repetitive, fiecare rând identificabil în mod unic | „Conține fiecare celulă o singură valoare? Există grupuri de coloane precum Product1, Product2?” |
| **2NF** | 1NF + fără dependențe parțiale față de o cheie compusă | „Depinde fiecare coloană non-cheie de *întreaga* cheie primară sau doar de o parte a ei?” |
| **3NF** | 2NF + fără dependențe tranzitive | „Există vreo coloană non-cheie care determină o altă coloană non-cheie?” |

---

## Pasul 1 — Forma nenormalizată (UNF)

Imaginează-ți un proiectant de baze de date naiv care stochează fiecare comandă într-un singur rând de foaie de calcul, repetând coloanele de produs pentru fiecare articol din comandă:

**Tabel: order_flat**

| OrderID | OrderDate | ClientName | ClientEmail | ClientPhone | ClientCity | ProductName1 | Category1 | Price1 | Qty1 | ProductName2 | Category2 | Price2 | Qty2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-10 | John Smith | john@mail.com | 555-0101 | London | Wireless Mouse | Electronics | 29.99 | 2 | USB Keyboard | Electronics | 49.99 | 1 |
| 2 | 2024-01-11 | Maria Garcia | maria@mail.com | 555-0202 | Madrid | SQL Server 2022 | Books | 59.99 | 1 | NULL | NULL | NULL | NULL |
| 3 | 2024-01-12 | John Smith | john@mail.com | 555-0101 | London | Running Shoes | Sports | 89.99 | 1 | Cotton T-Shirt | Clothing | 19.99 | 3 |
| 4 | 2024-01-14 | Ana Popescu | ana@mail.com | 555-0303 | Bucharest | Wireless Mouse | Electronics | 29.99 | 1 | NULL | NULL | NULL | NULL |
| 5 | 2024-01-15 | Maria Garcia | maria@mail.com | 555-0202 | Madrid | USB Keyboard | Electronics | 49.99 | 2 | Running Shoes | Sports | 89.99 | 1 |
| 6 | 2024-01-16 | John Smith | john@mail.com | 555-0101 | London | Cotton T-Shirt | Clothing | 19.99 | 2 | NULL | NULL | NULL | NULL |

**Probleme vizibile aici:**
- Grupuri de coloane repetitive (ProductName1/2, Category1/2 etc.) — ce se întâmplă dacă o comandă are 10 articole?
- Datele clientului (nume, email, telefon, oraș) sunt duplicate pentru fiecare comandă pe care o plasează
- „Electronics” apare în mai multe rânduri — o singură actualizare necesită modificarea multor rânduri
- Multe valori NULL pentru comenzile cu mai puține produse decât numărul maxim

---

## Pasul 2 — Prima formă normală (1NF)

**Reguli:**
- Fiecare celulă conține o singură valoare atomică (fără liste sau mulțimi)
- Fără grupuri de coloane repetitive
- Fiecare rând trebuie să fie identificabil în mod unic

**Transformare:** Eliminăm grupurile de coloane Product1/Product2 creând câte un rând pentru fiecare produs din fiecare comandă.

**Tabel: order_1nf**

| OrderID | OrderDate | ClientName | ClientEmail | ClientPhone | ClientCity | ShippingAddress | Status | ProductName | CategoryName | UnitPrice | Quantity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-10 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Delivered | Wireless Mouse | Electronics | 29.99 | 2 |
| 1 | 2024-01-10 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Delivered | USB Keyboard | Electronics | 49.99 | 1 |
| 2 | 2024-01-11 | Maria Garcia | maria@mail.com | 555-0202 | Madrid | Calle Mayor 5 | Shipped | SQL Server 2022 | Books | 59.99 | 1 |
| 3 | 2024-01-12 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Pending | Running Shoes | Sports | 89.99 | 1 |
| 3 | 2024-01-12 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Pending | Cotton T-Shirt | Clothing | 19.99 | 3 |
| 4 | 2024-01-14 | Ana Popescu | ana@mail.com | 555-0303 | Bucharest | Str. Unirii 7 | Delivered | Wireless Mouse | Electronics | 29.99 | 1 |

**Cheie primară (compusă):** `(OrderID, ProductName)`

**Acum în 1NF:** Fără grupuri repetitive, toate valorile sunt atomice, fiecare rând este unic.

**Probleme rămase:** Datele clientului se repetă încă pe rândurile aceleiași comenzi. Prețurile produselor se repetă pentru fiecare comandă în care apar. Acestea sunt dependențe parțiale — următorul pas le rezolvă.

---

## Pasul 3 — A doua formă normală (2NF)

**Reguli:** Trebuie să fie în 1NF + fiecare atribut non-cheie trebuie să depindă de **întreaga** cheie primară compusă, nu doar de o parte a ei.

**Identificarea dependențelor parțiale** în `order_1nf` cu PK = `(OrderID, ProductName)`:

| Coloană | Depinde doar de OrderID? | Depinde doar de ProductName? | Depinde de AMBELE (complet)? |
|---|---|---|---|
| OrderDate | DA — dep. parțială | | |
| ClientName | DA — dep. parțială | | |
| ClientEmail | DA — dep. parțială | | |
| ClientPhone | DA — dep. parțială | | |
| ClientCity | DA — dep. parțială | | |
| ShippingAddress | DA — dep. parțială | | |
| Status | DA — dep. parțială | | |
| CategoryName | | DA — dep. parțială | |
| UnitPrice | | DA — dep. parțială | |
| **Quantity** | | | DA — dependență completă |

**Transformare:** Mutăm dependențele parțiale în tabele proprii.

**Tabel: clients_2nf** (depinde doar de identitatea clientului)

| ClientID | ClientName | ClientEmail | ClientPhone | ClientCity |
|---|---|---|---|---|
| 1 | John Smith | john@mail.com | 555-0101 | London |
| 2 | Maria Garcia | maria@mail.com | 555-0202 | Madrid |
| 3 | Ana Popescu | ana@mail.com | 555-0303 | Bucharest |

**Tabel: orders_2nf** (depinde doar de OrderID)

| OrderID | OrderDate | ShippingAddress | Status | ClientID |
|---|---|---|---|---|
| 1 | 2024-01-10 | 12 Baker St | Delivered | 1 |
| 2 | 2024-01-11 | Calle Mayor 5 | Shipped | 2 |
| 3 | 2024-01-12 | 12 Baker St | Pending | 1 |
| 4 | 2024-01-14 | Str. Unirii 7 | Delivered | 3 |

**Tabel: products_2nf** (depinde doar de ProductName)

| ProductID | ProductName | CategoryName | UnitPrice |
|---|---|---|---|
| 1 | Wireless Mouse | Electronics | 29.99 |
| 2 | USB Keyboard | Electronics | 49.99 |
| 3 | SQL Server 2022 | Books | 59.99 |
| 4 | Running Shoes | Sports | 89.99 |
| 5 | Cotton T-Shirt | Clothing | 19.99 |

**Tabel: order_details_2nf** (depinde de întreaga cheie compusă)

| OrderID | ProductID | Quantity |
|---|---|---|
| 1 | 1 | 2 |
| 1 | 2 | 1 |
| 2 | 3 | 1 |
| 3 | 4 | 1 |
| 3 | 5 | 3 |
| 4 | 1 | 1 |

Nu mai avem date de client repetate. Nu mai avem prețuri de produse redundante.

---

## Pasul 4 — A treia formă normală (3NF)

**Reguli:** Trebuie să fie în 2NF + fără dependențe tranzitive. O dependență tranzitivă există atunci când o coloană non-cheie determină o altă coloană non-cheie.

**Identificarea dependențelor tranzitive** în `products_2nf`:

```
ProductID → CategoryName
```

Dar `CategoryName` este un atribut al *categoriei*, nu al produsului în sine. Dacă redenumim „Electronics” în „Consumer Electronics”, tot trebuie să actualizăm fiecare rând din tabelul de produse care o referă.

Lanțul de dependențe este:
```
ProductID → CategoryID → CategoryName
```

`CategoryName` depinde de `CategoryID`, care este un atribut non-cheie — aceasta este o dependență tranzitivă.

**Transformare:** Extragem `CategoryName` într-un tabel propriu.

**Tabel: categories**

| CategoryID | CategoryName | Description |
|---|---|---|
| 1 | Electronics | Electronic devices and accessories |
| 2 | Books | Books and educational materials |
| 3 | Sports | Sports equipment and clothing |
| 4 | Clothing | Fashion and apparel |

**Tabel: products** (actualizat — CategoryName înlocuit cu FK-ul CategoryID)

| ProductID | ProductName | Description | Price | Stock | CategoryID |
|---|---|---|---|---|---|
| 1 | Wireless Mouse | Ergonomic wireless mouse | 29.99 | 150 | 1 |
| 2 | USB Keyboard | Mechanical keyboard | 49.99 | 80 | 1 |
| 3 | SQL Server 2022 | Database programming book | 59.99 | 40 | 2 |
| 4 | Running Shoes | Lightweight running shoes | 89.99 | 60 | 3 |
| 5 | Cotton T-Shirt | Classic cotton t-shirt | 19.99 | 200 | 4 |

Acum `CategoryName` există într-un singur loc. Redenumirea unei categorii necesită actualizarea unui singur rând în `categories`, nu a fiecărui rând de produs.

---

## Rezumatul schemei finale

După normalizarea completă, baza de date eCommerce are **5 tabele**:

```
Categories
  CategoryID  (PK)
  CategoryName
  Description

Products
  ProductID   (PK)
  ProductName
  Description
  Price
  Stock
  CategoryID  (FK → Categories.CategoryID)

Clients
  ClientID    (PK)
  FirstName
  LastName
  Email       (UNIQUE)
  Phone
  Address
  City
  Country
  CreatedDate

Orders
  OrderID     (PK)
  ClientID    (FK → Clients.ClientID)
  OrderDate
  ShippingAddress
  Status
  TotalAmount

OrderDetails
  OrderDetailID  (PK)
  OrderID        (FK → Orders.OrderID)
  ProductID      (FK → Products.ProductID)
  Quantity
  UnitPrice
```

**Rezumatul relațiilor:**
- `Products` → `Categories` (mulți-la-unu: fiecare produs are o singură categorie)
- `Orders` → `Clients` (mulți-la-unu: fiecare comandă aparține unui singur client)
- `OrderDetails` → `Orders` (mulți-la-unu: fiecare detaliu aparține unei singure comenzi)
- `OrderDetails` → `Products` (mulți-la-unu: fiecare detaliu referă un singur produs)

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
În tabelul UNF, ce anomalie apare dacă încerci să adaugi o nouă categorie „Garden Tools” înainte de a avea vreun produs în acea categorie?

**Exercițiul 2 (Ușor)**
În tabelul 1NF `order_1nf`, care este cheia primară compusă? De ce OrderID singur nu este suficient?

**Exercițiul 3 (Mediu)**
În etapa 2NF, explică de ce `ShippingAddress` a fost mutată în tabelul `orders_2nf` și nu în `clients_2nf`, deși ambele tabele au fost separate din comenzi.

**Exercițiul 4 (Mediu)**
După atingerea 3NF, dacă un produs își schimbă categoria, câte rânduri trebuie actualizate? Câte rânduri ar trebui actualizate în versiunea 2NF?

**Exercițiul 5 (Dificil)**
Un coleg sugerează adăugarea unei coloane `ClientCity` direct în tabelul `Orders`, argumentând că „orașul de livrare poate diferi de orașul înregistrat al clientului”. Este aceasta o încălcare a normalizării? Justifică răspunsul și descrie cum ai trata corect această cerință.

---

## Răspunsuri

**Exercițiul 1:** Anomalie de inserare. În tabelul UNF fiecare rând trebuie să aibă un produs, deci o categorie care încă nu are produse nu poate fi stocată.

**Exercițiul 2:** Cheia primară compusă este `(OrderID, ProductName)`. OrderID singur nu este unic deoarece o comandă poate conține mai multe produse, fiecare apărând pe propriul rând.

**Exercițiul 3:** `ShippingAddress` depinde doar de `OrderID` (este adresa pentru *acea comandă anume*) și este, prin urmare, o dependență parțială față de `OrderID`. Locul ei este în tabelul de comenzi. Nu a fost mutată în `clients` deoarece clientul poate livra la o adresă diferită pentru fiecare comandă.

**Exercițiul 4:** În 3NF, actualizarea categoriei unui produs înseamnă modificarea `CategoryID` într-un singur rând din tabelul `Products`. În versiunea 2NF, `CategoryName` era stocat în fiecare rând de produs, deci tot un singur rând trebuia actualizat — dar dacă se schimba *numele* categoriei (în 2NF nu există tabel de categorii), ar fi trebuit să actualizezi fiecare rând de produs care are acel nume de categorie.

**Exercițiul 5:** Aceasta NU este o încălcare a normalizării în forma descrisă. `ShippingAddress` din `Orders` se referă la adresa *acelei comenzi*, care poate diferi în mod legitim de adresa înregistrată a clientului. Stocarea ei acolo este corectă. Dacă ai nevoie și de orașul înregistrat al clientului, acesta există deja în tabelul `Clients` și poate fi obținut printr-un JOIN. Nu apare nicio duplicare, deoarece cele două coloane reprezintă două informații diferite.
