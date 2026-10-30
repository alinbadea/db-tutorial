# Baza de date Attendance — Fișa de lucru 1: Normalizarea bazei de date (UNF până la 3NF)

## Obiective de învățare
- Înțelegerea anomaliilor de date care apar într-un sistem școlar de prezență nenormalizat
- Transformarea pas cu pas a unui tabel plat prin 1NF, 2NF și 3NF
- Diferențierea între *înscrierea* unui elev la o materie (Classes) și o *înregistrare zilnică de prezență* (Attendance)
- Descrierea schemei finale Attendance și a relațiilor dintre toate cele cinci tabele

---

## De ce normalizăm?

O școală urmărește ce elevi participă la ce materii, predate de ce profesori. Fără normalizare:

**Anomalia de inserare:** Nu poți adăuga un profesor nou în sistem decât dacă acesta este deja repartizat să predea o oră la o anumită dată. Nu există nicio modalitate de a înregistra „Profesorul X este disponibil” fără o înregistrare de prezență.

**Anomalia de actualizare:** Dacă numele unui profesor este scris greșit, trebuie corectat în fiecare rând de prezență în care apare acel profesor — posibil sute de rânduri.

**Anomalia de ștergere:** Dacă ștergi singura înregistrare de prezență pentru o anumită materie, poți pierde toate informațiile despre acea materie (nume, credite), chiar dacă materia se predă în continuare.

---

## Cele trei forme normale — Referință rapidă

| Forma normală | Regulă | Întrebare-cheie |
|---|---|---|
| **1NF** | Valori atomice, fără grupuri repetitive, fiecare rând identificabil în mod unic | „Există celule cu mai multe valori sau grupuri de coloane?” |
| **2NF** | 1NF + fără dependențe parțiale față de o cheie compusă | „Depinde fiecare coloană non-cheie de *întreaga* cheie?” |
| **3NF** | 2NF + fără dependențe tranzitive | „Există vreo coloană non-cheie care determină o altă coloană non-cheie?” |

---

## Pasul 1 — Forma nenormalizată (UNF)

Un proiect naiv stochează toate informațiile despre prezență într-un singur tabel plat:

**Tabel: attendance_flat**

| AttendanceID | AttendanceDate | StudentFirstName | StudentLastName | StudentEmail | StudentGrade | SubjectName | SubjectCredits | TeacherFirstName | TeacherLastName | TeacherEmail | TeacherSpecialization | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-09-03 | Maria | Popescu | maria@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| 2 | 2024-09-03 | Ion | Ionescu | ion@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| 3 | 2024-09-03 | Ana | Dumitrescu | ana@school.ro | 10B | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Absent |
| 4 | 2024-09-04 | Maria | Popescu | maria@school.ro | 10A | Physics | 3 | Elena | Radu | radu@school.ro | Physics | Present |
| 5 | 2024-09-04 | Ion | Ionescu | ion@school.ro | 10A | Physics | 3 | Elena | Radu | radu@school.ro | Physics | Late |
| 6 | 2024-09-05 | Maria | Popescu | maria@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| 7 | 2024-09-05 | Ana | Dumitrescu | ana@school.ro | 10B | Literature | 3 | Mihai | Pop | pop@school.ro | Literature | Present |

**Probleme vizibile aici:**
- Datele elevului (nume, email, clasă) se repetă pentru fiecare înregistrare de prezență
- Datele materiei (nume, credite) se repetă pentru fiecare oră
- Datele profesorului (nume, email, specializare) se repetă în multe rânduri
- Relația dintre un elev și o materie (înscrierea) este amestecată cu prezența zilnică
- Dacă „Mathematics” își schimbă numărul de credite, fiecare rând care conține Mathematics trebuie actualizat

---

## Pasul 2 — Prima formă normală (1NF)

**Reguli:** Valori atomice, fără grupuri repetitive, fiecare rând identificabil în mod unic.

Tabelul plat are deja valori atomice și nu are grupuri de coloane repetitive. Fiecare rând poate fi identificat în mod unic prin `AttendanceID`.

**Tabel: attendance_1nf** (aceeași structură, cu o cheie atribuită mai clar)

| AttendanceID (PK) | AttendanceDate | StudentFirstName | StudentLastName | StudentEmail | StudentGrade | SubjectName | SubjectCredits | TeacherFirstName | TeacherLastName | TeacherEmail | TeacherSpec | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-09-03 | Maria | Popescu | maria@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

PK: `AttendanceID`

**Acum în 1NF.** Fiecare rând este unic și toate valorile sunt atomice. Dar rămâne o redundanță masivă.

---

## Pasul 3 — A doua formă normală (2NF)

**Reguli:** 1NF + fiecare coloană non-cheie depinde de **întreaga** cheie primară.

Deoarece `AttendanceID` este o cheie primară formată dintr-o singură coloană, prin definiție nu există dependențe parțiale. Totuși, analiza dependențelor funcționale scoate la iveală entități separate, care ar trebui să aibă propriile tabele:

| Grup de coloane | Aparține entității | Ar trebui să fie în |
|---|---|---|
| StudentFirstName, StudentLastName, StudentEmail, StudentGrade | Elev | Tabelul Students |
| SubjectName, SubjectCredits | Materie | Tabelul Subjects |
| TeacherFirstName, TeacherLastName, TeacherEmail, TeacherSpec | Profesor | Tabelul Teachers |
| StudentID + SubjectID + AcademicYear + Semester | Înscriere (Class) | Tabelul Classes |
| ClassID + TeacherID + AttendanceDate + Status | Prezența zilnică | Tabelul Attendance |

**După separarea în tabele distincte pentru fiecare entitate:**

**Tabel: students_2nf**

| StudentID | FirstName | LastName | Email | Grade |
|---|---|---|---|---|
| 1 | Maria | Popescu | maria@school.ro | 10A |
| 2 | Ion | Ionescu | ion@school.ro | 10A |
| 3 | Ana | Dumitrescu | ana@school.ro | 10B |

**Tabel: teachers_2nf**

| TeacherID | FirstName | LastName | Email | Specialization |
|---|---|---|---|---|
| 1 | Ion | Munteanu | munteanu@school.ro | Mathematics |
| 2 | Elena | Radu | radu@school.ro | Physics |
| 3 | Mihai | Pop | pop@school.ro | Literature |

**Tabel: subjects_2nf**

| SubjectID | SubjectName | Credits |
|---|---|---|
| 1 | Mathematics | 4 |
| 2 | Physics | 3 |
| 3 | Literature | 3 |

**Tabel: classes_2nf** (înscriere: elev + materie + context academic)

| ClassID | StudentID | SubjectID | AcademicYear | Semester |
|---|---|---|---|---|
| 1 | 1 | 1 | 2024 | Fall |
| 2 | 2 | 1 | 2024 | Fall |
| 3 | 3 | 1 | 2024 | Fall |
| 4 | 1 | 2 | 2024 | Fall |
| 5 | 2 | 2 | 2024 | Fall |
| 6 | 3 | 3 | 2024 | Fall |

**Tabel: attendance_2nf**

| AttendanceID | ClassID | TeacherID | AttendanceDate | Status |
|---|---|---|---|---|
| 1 | 1 | 1 | 2024-09-03 | Present |
| 2 | 2 | 1 | 2024-09-03 | Present |
| 3 | 3 | 1 | 2024-09-03 | Absent |
| 4 | 4 | 2 | 2024-09-04 | Present |
| 5 | 5 | 2 | 2024-09-04 | Late |
| 6 | 1 | 1 | 2024-09-05 | Present |
| 7 | 6 | 3 | 2024-09-05 | Present |

---

## Pasul 4 — A treia formă normală (3NF)

**Reguli:** 2NF + fără dependențe tranzitive.

Examinăm tabelele 2NF:

**În `teachers_2nf`:** Există o dependență tranzitivă?
```
TeacherID → Specialization
```
`Specialization` este un atribut al profesorului, nu este derivat dintr-o altă coloană non-cheie. Aceasta este o dependență directă — nu există nicio încălcare.

**În `subjects_2nf`:** Ar putea `Credits` să depindă de `SubjectName`?
```
SubjectID → SubjectName → Credits (?)
```
Dacă numărul de credite ar fi determinat de numele materiei în toate tabelele (o regulă de business), atunci `Credits` ar depinde tranzitiv de `SubjectID` prin intermediul `SubjectName`. În practică, `SubjectName` este doar o etichetă descriptivă — materii diferite cu același nume ar putea avea credite diferite — așa că tratăm `Credits` ca depinzând direct de `SubjectID`. Nu există nicio încălcare.

**În `classes_2nf`:** Există o dependență între coloanele non-cheie?
```
ClassID → SubjectID → (SubjectName, SubjectCredits) — dar acestea sunt în tabelul Subjects ✓
ClassID → StudentID → (StudentName, ...) — dar acestea sunt în tabelul Students ✓
```
Nu există dependențe tranzitive — proiectul 2NF este deja curat.

Tabelele 2NF sunt deja în 3NF. Ideea-cheie a normalizării aici a fost recunoașterea celor **două niveluri de structură**: înscrierea (Classes) și evenimentul zilnic (Attendance).

---

## Rezumatul schemei finale

```
Students
  StudentID      (PK)
  FirstName
  LastName
  Email          (UNIQUE)
  EnrollmentDate
  Grade

Teachers
  TeacherID      (PK)
  FirstName
  LastName
  Email          (UNIQUE)
  Specialization

Subjects
  SubjectID      (PK)
  SubjectName
  Description
  Credits

Classes
  ClassID        (PK)
  SubjectID      (FK → Subjects.SubjectID)
  StudentID      (FK → Students.StudentID)
  AcademicYear
  Semester

Attendance
  AttendanceID   (PK)
  ClassID        (FK → Classes.ClassID)
  TeacherID      (FK → Teachers.TeacherID)
  AttendanceDate
  Status
```

**Relații:**
- `Classes.StudentID` → `Students.StudentID` (un elev se poate înscrie la mai multe materii)
- `Classes.SubjectID` → `Subjects.SubjectID` (o materie poate fi urmată de mai mulți elevi)
- `Attendance.ClassID` → `Classes.ClassID` (fiecare înregistrare de prezență corespunde unei singure înscrieri)
- `Attendance.TeacherID` → `Teachers.TeacherID` (ce profesor a ținut ora la acea dată)

---

## Exerciții practice

**Exercițiul 1 (Ușor)**
În tabelul UNF, de ce „Mathematics” cu 4 credite apare de mai multe ori? Ce anomalie ar apărea dacă numărul de credite s-ar schimba la 5?

**Exercițiul 2 (Ușor)**
În proiectul 2NF, explică ce reprezintă un rând din tabelul `Classes`. De ce este numit un tabel de „înscrieri” și nu un tabel de „ore”?

**Exercițiul 3 (Mediu)**
De ce este stocat `TeacherID` în `Attendance` și nu în `Classes`? Ce scenariu din lumea reală permite acest proiect?

**Exercițiul 4 (Mediu)**
Un coleg propune adăugarea unei coloane `TeacherName` direct în tabelul `Attendance` (alături de `TeacherID`), pentru a evita un JOIN la afișarea prezenței. Ce formă normală încalcă acest lucru și de ce?

**Exercițiul 5 (Dificil)**
Să presupunem că școala cere să se înregistreze faptul că un anumit profesor este *profesorul principal* al unei materii (o materie are un singur profesor principal). Cum ai adăuga acest lucru în schema normalizată? Arată ce tabel trebuie modificat și ce coloană (coloane) trebuie adăugată, fără a încălca 3NF.

---

## Răspunsuri

**Exercițiul 1:** „Mathematics” apare de mai multe ori pentru că a fost urmată de mai mulți elevi, în mai multe zile. Aceasta este anomalia de actualizare: schimbarea creditelor de la 4 la 5 necesită actualizarea fiecărui rând în care apare Mathematics — iar dacă se ratează chiar și un singur rând, datele devin inconsecvente.

**Exercițiul 2:** Un rând din `Classes` reprezintă înscrierea unui elev la o materie, pentru un anumit an școlar și semestru. În această schemă se numește „Classes” (în sensul de „înscrierea unui elev la o oră/un curs”), dar funcționează ca tabel de legătură între Students și Subjects într-o relație mulți-la-mulți.

**Exercițiul 3:** `TeacherID` se află în `Attendance` deoarece profesori diferiți pot preda aceeași materie în zile diferite (profesori suplinitori, cursuri comune). Dacă `TeacherID` ar fi în `Classes`, ar însemna un profesor fix pentru fiecare înscriere — ceea ce nu permite suplinirile. Punându-l în `Attendance`, înregistrăm ce profesor anume a ținut fiecare oră în parte.

**Exercițiul 4:** Stocarea `TeacherName` alături de `TeacherID` în `Attendance` creează o dependență tranzitivă: `AttendanceID → TeacherID → TeacherName`. Numele profesorului este determinat de `TeacherID`, nu de înregistrarea de prezență în sine. Acest lucru încalcă 3NF. Abordarea corectă este obținerea numelui printr-un JOIN cu tabelul `Teachers`.

**Exercițiul 5:** Adaugă o coloană `PrimaryTeacherID` (FK → Teachers.TeacherID, poate fi NULL) în tabelul `Subjects`. Aceasta reprezintă „profesorul principal responsabil de această materie”. Nu încalcă 3NF, deoarece `PrimaryTeacherID` este un atribut direct al materiei. Exemplu: `ALTER TABLE Subjects ADD PrimaryTeacherID INT NULL REFERENCES Teachers(TeacherID);`
