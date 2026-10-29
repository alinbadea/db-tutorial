# Attendance Database — Worksheet 1: Database Normalization (UNF to 3NF)

## Learning Objectives
- Understand the data anomalies that arise in an unnormalized school attendance system
- Transform a flat table through 1NF, 2NF, and 3NF step by step
- Distinguish between a student's *enrollment* in a subject (Classes) and a *daily attendance record* (Attendance)
- Describe the final Attendance schema and the relationships between all five tables

---

## Why Normalize?

A school tracks which students attend which subjects taught by which teachers. Without normalization:

**Insertion Anomaly:** You cannot add a new teacher to the system unless that teacher is already assigned to teach a class on some date. There is no way to record "Teacher X is available" without an attendance entry.

**Update Anomaly:** If a teacher's name is misspelled, it must be corrected in every attendance row that teacher appears in — potentially hundreds of rows.

**Deletion Anomaly:** If you delete the only attendance record for a specific subject, you might lose all information about that subject (name, credits) even though the subject is still taught.

---

## The Three Normal Forms — Quick Reference

| Normal Form | Rule | Key Question |
|---|---|---|
| **1NF** | Atomic values, no repeating groups, every row uniquely identifiable | "Are there multi-valued cells or column groups?" |
| **2NF** | 1NF + no partial dependencies on a composite key | "Does every non-key column depend on the *whole* key?" |
| **3NF** | 2NF + no transitive dependencies | "Does any non-key column determine another non-key column?" |

---

## Step 1 — Unnormalized Form (UNF)

A naive design stores all attendance information in a single flat table:

**Table: attendance_flat**

| AttendanceID | AttendanceDate | StudentFirstName | StudentLastName | StudentEmail | StudentGrade | SubjectName | SubjectCredits | TeacherFirstName | TeacherLastName | TeacherEmail | TeacherSpecialization | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-09-03 | Maria | Popescu | maria@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| 2 | 2024-09-03 | Ion | Ionescu | ion@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| 3 | 2024-09-03 | Ana | Dumitrescu | ana@school.ro | 10B | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Absent |
| 4 | 2024-09-04 | Maria | Popescu | maria@school.ro | 10A | Physics | 3 | Elena | Radu | radu@school.ro | Physics | Present |
| 5 | 2024-09-04 | Ion | Ionescu | ion@school.ro | 10A | Physics | 3 | Elena | Radu | radu@school.ro | Physics | Late |
| 6 | 2024-09-05 | Maria | Popescu | maria@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| 7 | 2024-09-05 | Ana | Dumitrescu | ana@school.ro | 10B | Literature | 3 | Mihai | Pop | pop@school.ro | Literature | Present |

**Problems visible here:**
- Student data (name, email, grade) is repeated for every attendance record
- Subject data (name, credits) is repeated for every class session
- Teacher data (name, email, specialization) repeats across many rows
- The relationship between a student and a subject (enrollment) is mixed with daily attendance
- If "Mathematics" changes its credit count, every row containing Mathematics must be updated

---

## Step 2 — First Normal Form (1NF)

**Rules:** Atomic values, no repeating groups, every row uniquely identifiable.

The flat table already has atomic values and no repeating column groups. Every row can be uniquely identified by `AttendanceID`.

**Table: attendance_1nf** (same structure, cleaner key assignment)

| AttendanceID (PK) | AttendanceDate | StudentFirstName | StudentLastName | StudentEmail | StudentGrade | SubjectName | SubjectCredits | TeacherFirstName | TeacherLastName | TeacherEmail | TeacherSpec | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-09-03 | Maria | Popescu | maria@school.ro | 10A | Mathematics | 4 | Ion | Munteanu | munteanu@school.ro | Mathematics | Present |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

PK: `AttendanceID`

**Now in 1NF.** Every row is unique and all values are atomic. But massive redundancy remains.

---

## Step 3 — Second Normal Form (2NF)

**Rules:** 1NF + every non-key column depends on the **whole** primary key.

Since `AttendanceID` is a single-column PK, there are no partial dependencies by definition. However, examining functional dependencies reveals separate entities that should live in their own tables:

| Column Group | Belongs to Entity | Should be in |
|---|---|---|
| StudentFirstName, StudentLastName, StudentEmail, StudentGrade | Student | Students table |
| SubjectName, SubjectCredits | Subject | Subjects table |
| TeacherFirstName, TeacherLastName, TeacherEmail, TeacherSpec | Teacher | Teachers table |
| StudentID + SubjectID + AcademicYear + Semester | Enrollment (Class) | Classes table |
| ClassID + TeacherID + AttendanceDate + Status | Daily attendance | Attendance table |

**After splitting into separate entity tables:**

**Table: students_2nf**

| StudentID | FirstName | LastName | Email | Grade |
|---|---|---|---|---|
| 1 | Maria | Popescu | maria@school.ro | 10A |
| 2 | Ion | Ionescu | ion@school.ro | 10A |
| 3 | Ana | Dumitrescu | ana@school.ro | 10B |

**Table: teachers_2nf**

| TeacherID | FirstName | LastName | Email | Specialization |
|---|---|---|---|---|
| 1 | Ion | Munteanu | munteanu@school.ro | Mathematics |
| 2 | Elena | Radu | radu@school.ro | Physics |
| 3 | Mihai | Pop | pop@school.ro | Literature |

**Table: subjects_2nf**

| SubjectID | SubjectName | Credits |
|---|---|---|
| 1 | Mathematics | 4 |
| 2 | Physics | 3 |
| 3 | Literature | 3 |

**Table: classes_2nf** (enrollment: student + subject + academic context)

| ClassID | StudentID | SubjectID | AcademicYear | Semester |
|---|---|---|---|---|
| 1 | 1 | 1 | 2024 | Fall |
| 2 | 2 | 1 | 2024 | Fall |
| 3 | 3 | 1 | 2024 | Fall |
| 4 | 1 | 2 | 2024 | Fall |
| 5 | 2 | 2 | 2024 | Fall |
| 6 | 3 | 3 | 2024 | Fall |

**Table: attendance_2nf**

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

## Step 4 — Third Normal Form (3NF)

**Rules:** 2NF + no transitive dependencies.

Examining the 2NF tables:

**In `teachers_2nf`:** Is there a transitive dependency?
```
TeacherID → Specialization
```
`Specialization` is an attribute of the teacher, not derived from another non-key column. This is a direct dependency — no violation.

**In `subjects_2nf`:** Could `Credits` depend on `SubjectName`?
```
SubjectID → SubjectName → Credits (?)
```
If Credits were determined by the subject name across all tables (a business rule), then `Credits` would transitively depend on `SubjectID` through `SubjectName`. In practice, `SubjectName` is just a descriptive label — different subjects with the same name could have different credits — so we treat `Credits` as depending directly on `SubjectID`. No violation.

**In `classes_2nf`:** Is there a dependency between non-key columns?
```
ClassID → SubjectID → (SubjectName, SubjectCredits) — but those are in Subjects table ✓
ClassID → StudentID → (StudentName, ...) — but those are in Students table ✓
```
No transitive dependencies — the 2NF design is already clean.

The 2NF tables are already in 3NF. The key normalization insight here was recognizing the **two levels of structure**: the enrollment (Classes) and the daily event (Attendance).

---

## Final Schema Summary

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

**Relationships:**
- `Classes.StudentID` → `Students.StudentID` (a student can enroll in many subjects)
- `Classes.SubjectID` → `Subjects.SubjectID` (a subject can be taken by many students)
- `Attendance.ClassID` → `Classes.ClassID` (each attendance record is for one enrollment)
- `Attendance.TeacherID` → `Teachers.TeacherID` (which teacher ran the class on that date)

---

## Practice Exercises

**Exercise 1 (Easy)**
In the UNF table, why does "Mathematics" with 4 credits appear multiple times? What anomaly would occur if the credits changed to 5?

**Exercise 2 (Easy)**
In the 2NF design, explain what a row in the `Classes` table represents. Why is it called an "enrollment" table rather than a "classes" table?

**Exercise 3 (Medium)**
Why is `TeacherID` stored in `Attendance` rather than in `Classes`? What real-world scenario does this design support?

**Exercise 4 (Medium)**
A colleague proposes adding a `TeacherName` column directly to the `Attendance` table (alongside `TeacherID`) to avoid a JOIN when displaying attendance. What normalization form does this violate and why?

**Exercise 5 (Hard)**
Suppose the school requires tracking that a specific teacher is the *primary teacher* for a subject (a subject has one main teacher). How would you add this to the normalized schema? Show which table to modify and what column(s) to add, without violating 3NF.

---

## Answers

**Exercise 1:** "Mathematics" appears because it has been attended by multiple students on multiple days. This is the update anomaly: changing credits from 4 to 5 requires updating every row where Mathematics appears — and if even one row is missed, the data becomes inconsistent.

**Exercise 2:** A row in `Classes` represents one student's enrollment in one subject for a given academic year and semester. It is called "Classes" in this schema (meaning "a student's class/course enrollment") but it functions as the junction/bridge table between Students and Subjects in a many-to-many relationship.

**Exercise 3:** `TeacherID` is in `Attendance` because different teachers can teach the same subject on different days (substitute teachers, shared courses). If `TeacherID` were in `Classes`, it would imply one fixed teacher per enrollment — which doesn't support substitutes. By putting it in `Attendance`, we record which specific teacher ran each individual session.

**Exercise 4:** Storing `TeacherName` alongside `TeacherID` in `Attendance` creates a transitive dependency: `AttendanceID → TeacherID → TeacherName`. The teacher's name is determined by `TeacherID`, not by the attendance record itself. This violates 3NF. The correct approach is to retrieve the name via a JOIN to the `Teachers` table.

**Exercise 5:** Add a `PrimaryTeacherID` column (FK → Teachers.TeacherID, nullable) to the `Subjects` table. This represents "the primary teacher responsible for this subject." It does not violate 3NF because `PrimaryTeacherID` is a direct attribute of the subject. Example: `ALTER TABLE Subjects ADD PrimaryTeacherID INT NULL REFERENCES Teachers(TeacherID);`
