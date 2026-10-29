# Library Database — Worksheet 1: Database Normalization (UNF to 3NF)

## Learning Objectives
- Identify the anomalies that arise from storing library data in a flat, unnormalized table
- Apply 1NF, 2NF, and 3NF transformations step by step
- Understand the distinction between a *title* (intellectual work) and a *book* (physical copy)
- Describe the final Library schema and the relationships between its tables

---

## Why Normalize?

A public library manages books, authors, publishers, clients, and rentals. Without normalization:

**Insertion Anomaly:** To record a new author, you need at least one title to attach them to. You cannot store the fact that "a new author has joined the catalogue" without first having a title they wrote.

**Update Anomaly:** If a publisher changes its address, that address might appear in dozens of rental rows. Updating only some of them leaves the data inconsistent.

**Deletion Anomaly:** If you delete the only rental of a particular book, you might lose information about that book's publisher — even though the book and publisher still exist.

---

## The Three Normal Forms — Quick Reference

| Normal Form | Rule | Key Question |
|---|---|---|
| **1NF** | Atomic values, no repeating groups, every row uniquely identifiable | "Are there multi-valued cells or column groups like Author1, Author2?" |
| **2NF** | 1NF + no partial dependencies on a composite key | "Does every non-key column depend on the *whole* key?" |
| **3NF** | 2NF + no transitive dependencies | "Does any non-key column determine another non-key column?" |

---

## Step 1 — Unnormalized Form (UNF)

A naive design stores all rental information in a single flat table:

**Table: library_flat**

| RentalID | ClientName | ClientEmail | ClientPhone | BookTitle | AuthorFirstName | AuthorLastName | PublisherName | PublisherAddress | Genre | ISBN | RentalDate | DueDate | ReturnDate | RentalDays |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Maria Pop | maria@mail.com | 555-01 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St, Boston | Technology | 978-0135957059 | 2024-01-10 | 2024-01-24 | 2024-01-20 | 14 |
| 2 | Ion Ionescu | ion@mail.com | 555-02 | Clean Code | Robert | Martin | Prentice Hall | 1 Lake St, NJ | Technology | 978-0132350884 | 2024-01-11 | 2024-01-25 | NULL | 14 |
| 3 | Maria Pop | maria@mail.com | 555-01 | Design Patterns | Erich | Gamma | Addison-Wesley | 75 Arlington St, Boston | Technology | 978-0201633610 | 2024-01-12 | 2024-01-19 | 2024-01-17 | 7 |
| 4 | Ana Dumitrescu | ana@mail.com | 555-03 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St, Boston | Technology | 978-0135957059 | 2024-01-14 | 2024-01-28 | NULL | 14 |
| 5 | Ion Ionescu | ion@mail.com | 555-02 | Clean Code | Robert | Martin | O'Reilly | 1005 Gravenstein Hwy, CA | Technology | 978-0132350884 | 2024-01-15 | 2024-01-22 | 2024-01-20 | 7 |
| 6 | Maria Pop | maria@mail.com | 555-01 | 1984 | George | Orwell | Penguin Books | 80 Strand, London | Fiction | 978-0141036144 | 2024-01-17 | 2024-01-31 | NULL | 14 |

**Problems visible here:**
- Client data (name, email, phone) is repeated for every rental they make
- Author data is repeated for every copy of their books that is rented
- Publisher data is repeated on rows 1, 3, 4 — "Addison-Wesley" and its address appear three times
- Row 5 shows the same ISBN rented from a different publisher — is the ISBN the unique identifier of the title or the book?
- The distinction between "title" (the intellectual work) and "book" (a physical copy) is lost

---

## Step 2 — First Normal Form (1NF)

**Rules:** Atomic values, no repeating groups, every row is uniquely identifiable.

The flat table already has atomic values, but it conflates the *title* with the *physical book*. We need to separate them. We also have one row per rental, which is fine.

**Transformation:** Assign a primary key (`RentalID` already exists). Introduce a `BookID` to represent the physical copy.

**Table: rental_1nf** — one row per rental, atomic values

| RentalID | ClientName | ClientEmail | ClientPhone | BookID | BookTitle | AuthorFirstName | AuthorLastName | PublisherName | PublisherAddress | Genre | ISBN | RentalDate | DueDate | ReturnDate | RentalDays |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Maria Pop | maria@mail.com | 555-01 | B1 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St | Technology | 978-0135957059 | 2024-01-10 | 2024-01-24 | 2024-01-20 | 14 |
| 2 | Ion Ionescu | ion@mail.com | 555-02 | B2 | Clean Code | Robert | Martin | Prentice Hall | 1 Lake St, NJ | Technology | 978-0132350884 | 2024-01-11 | 2024-01-25 | NULL | 14 |
| 3 | Maria Pop | maria@mail.com | 555-01 | B3 | Design Patterns | Erich | Gamma | Addison-Wesley | 75 Arlington St | Technology | 978-0201633610 | 2024-01-12 | 2024-01-19 | 2024-01-17 | 7 |
| 4 | Ana Dumitrescu | ana@mail.com | 555-03 | B1 | The Pragmatic Programmer | David | Thomas | Addison-Wesley | 75 Arlington St | Technology | 978-0135957059 | 2024-01-14 | 2024-01-28 | NULL | 14 |
| 5 | Ion Ionescu | ion@mail.com | 555-02 | B4 | Clean Code | Robert | Martin | O'Reilly | 1005 Gravenstein | Technology | 978-0132350884 | 2024-01-15 | 2024-01-22 | 2024-01-20 | 7 |
| 6 | Maria Pop | maria@mail.com | 555-01 | B5 | 1984 | George | Orwell | Penguin Books | 80 Strand, London | Fiction | 978-0141036144 | 2024-01-17 | 2024-01-31 | NULL | 14 |

PK: `RentalID`

**Now in 1NF.** But heavy redundancy remains — client and book data repeat across rows.

---

## Step 3 — Second Normal Form (2NF)

**Rules:** 1NF + no partial dependencies. Because `RentalID` is a single-column PK (not composite), all non-key columns already depend on the whole key.

However, there are clear functional dependencies among non-key columns that should be extracted. Identifying which columns belong to which entity:

| Column | Determines / Belongs to |
|---|---|
| ClientName, ClientEmail, ClientPhone | Client identity |
| BookTitle, AuthorFirstName, AuthorLastName, Genre, ISBN | Title (the intellectual work) |
| PublisherName, PublisherAddress | Publisher identity |
| BookID + PublisherName | Physical book copy |
| RentalDate, DueDate, ReturnDate, RentalDays | The rental event |

After splitting:

**Table: clients_2nf**

| ClientID | ClientName | ClientEmail | ClientPhone |
|---|---|---|---|
| 1 | Maria Pop | maria@mail.com | 555-01 |
| 2 | Ion Ionescu | ion@mail.com | 555-02 |
| 3 | Ana Dumitrescu | ana@mail.com | 555-03 |

**Table: authors_2nf**

| AuthorID | FirstName | LastName |
|---|---|---|
| 1 | David | Thomas |
| 2 | Robert | Martin |
| 3 | Erich | Gamma |
| 4 | George | Orwell |

**Table: publishers_2nf**

| PublisherID | PublisherName | Address |
|---|---|---|
| 1 | Addison-Wesley | 75 Arlington St, Boston |
| 2 | Prentice Hall | 1 Lake St, NJ |
| 3 | O'Reilly | 1005 Gravenstein Hwy, CA |
| 4 | Penguin Books | 80 Strand, London |

**Table: titles_2nf**

| TitleID | Title | AuthorID | Genre | ISBN |
|---|---|---|---|---|
| 1 | The Pragmatic Programmer | 1 | Technology | 978-0135957059 |
| 2 | Clean Code | 2 | Technology | 978-0132350884 |
| 3 | Design Patterns | 3 | Technology | 978-0201633610 |
| 4 | 1984 | 4 | Fiction | 978-0141036144 |

**Table: books_2nf** (physical copies)

| BookID | TitleID | PublisherID | Condition | IsAvailable |
|---|---|---|---|---|
| B1 | 1 | 1 | Good | 0 |
| B2 | 2 | 2 | New | 0 |
| B3 | 3 | 1 | Fair | 1 |
| B4 | 2 | 3 | Good | 0 |
| B5 | 4 | 4 | New | 0 |

**Table: rentals_2nf**

| RentalID | ClientID | BookID | RentalDate | DueDate | ReturnDate | RentalDays |
|---|---|---|---|---|---|---|
| 1 | 1 | B1 | 2024-01-10 | 2024-01-24 | 2024-01-20 | 14 |
| 2 | 2 | B2 | 2024-01-11 | 2024-01-25 | NULL | 14 |
| 3 | 1 | B3 | 2024-01-12 | 2024-01-19 | 2024-01-17 | 7 |
| 4 | 3 | B1 | 2024-01-14 | 2024-01-28 | NULL | 14 |
| 5 | 2 | B4 | 2024-01-15 | 2024-01-22 | 2024-01-20 | 7 |
| 6 | 1 | B5 | 2024-01-17 | 2024-01-31 | NULL | 14 |

---

## Step 4 — Third Normal Form (3NF)

**Rules:** 2NF + no transitive dependencies.

Examining the 2NF tables for transitive dependencies:

**In `rentals_2nf`:**
```
RentalDays → (DueDate - RentalDate) — computed from other columns
```
`DueDate` can be derived as `RentalDate + RentalDays`. Storing both creates a transitive dependency. We keep `RentalDays` as it captures the agreed rental period, and `DueDate` can be calculated. In practice, storing `DueDate` explicitly is acceptable for query convenience, but the data must always be consistent.

**In `titles_2nf`:**
If we had stored `AuthorNationality` alongside `AuthorID`, there would be a transitive dependency: `TitleID → AuthorID → AuthorNationality`. The author's nationality belongs in the `authors` table, not in `titles`.

Similarly, if `PublisherCity` were stored in `books_2nf`, it would be transitive: `BookID → PublisherID → PublisherCity`. Publisher details belong in the `publishers` table.

The 2NF tables are already free of major transitive dependencies (because we separated authors and publishers into their own tables). The final step is to add any missing attributes to the right tables.

---

## Final Schema Summary

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
  ReturnDate    (NULL = not yet returned)
  RentalDays
```

**Relationships:**
- `Titles` → `Authors` (each title has one author)
- `Books` → `Titles` (a title can have many physical copies)
- `Books` → `Publishers` (each physical copy was published by one publisher)
- `Rentals` → `Clients` (a client can have many rentals)
- `Rentals` → `Books` (each rental is for one specific physical copy)

---

## Practice Exercises

**Exercise 1 (Easy)**
In the UNF flat table, why do rows 2 and 5 have the same `ISBN` but a different `PublisherName`? What does this tell you about the distinction between a title and a physical book?

**Exercise 2 (Easy)**
In the 1NF table, what is the primary key? Why is a `BookID` column important even at this stage?

**Exercise 3 (Medium)**
Suppose the library adds a second physical copy of "Clean Code" published by "O'Reilly". How would this be represented in the final 3NF schema? How many rows need to be added to which tables?

**Exercise 4 (Medium)**
A colleague suggests storing `AuthorFullName` as a single column (`"Robert Martin"`) in the `Titles` table instead of a FK to `Authors`. What normalization problem does this create? Name the form it violates and why.

**Exercise 5 (Hard)**
Consider storing `DaysOverdue` (today's date minus `DueDate`) as a column in `Rentals`. Is this a normalization violation? Explain your reasoning and describe how you would handle this requirement instead.

---

## Answers

**Exercise 1:** The same ISBN identifies the same intellectual title ("Clean Code" by Robert Martin), but different publishers printed different physical editions. `BookID` B2 and B4 are two different physical copies of the same title, published by different publishers. This is the distinction between a *title* and a *book* (physical copy).

**Exercise 2:** The PK is `RentalID`. `BookID` is important because multiple physical copies of the same title exist; without it we cannot track *which copy* was rented, nor record that the same title was rented out simultaneously by two different clients.

**Exercise 3:** One new row in `Books` (with the new `BookID`, `TitleID` pointing to the existing Clean Code title, `PublisherID` pointing to O'Reilly). No new rows needed in `Authors`, `Publishers`, or `Titles` — all those entities already exist.

**Exercise 4:** Storing a full name as a single string violates 1NF (the name is not atomic — it combines first and last name). It also makes it impossible to sort by last name or search by first name without string manipulation. The correct design is a FK to an `Authors` table with separate `FirstName` and `LastName` columns.

**Exercise 5:** `DaysOverdue` is a *derived* or *computed* value — it depends entirely on `DueDate` and the current date. Storing it physically would create a transitive dependency (`RentalID → DueDate → DaysOverdue`) and would require recalculation every day to remain accurate. The correct approach is to compute it at query time: `DATEDIFF(DAY, DueDate, GETDATE())` in a SELECT statement, or create a computed column in the table definition.
