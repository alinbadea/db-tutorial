# eCommerce Database — Worksheet 1: Database Normalization (UNF to 3NF)

## Learning Objectives
- Understand why normalization is necessary and what problems it solves
- Identify repeating groups, partial dependencies, and transitive dependencies
- Transform a flat unnormalized table through 1NF, 2NF, and 3NF
- Describe the final eCommerce schema and the relationships between its tables

---

## Why Normalize? Data Anomalies

Without normalization, all data lives in one large flat table. This causes three serious problems:

**Insertion Anomaly** — You cannot record a new product category unless you also have a product to go with it. Want to add the "Toys" category before stocking any toys? You can't.

**Update Anomaly** — If the category name "Electronics" appears in 500 product rows and you rename it to "Consumer Electronics", you must update 500 rows. Miss one and your data is inconsistent.

**Deletion Anomaly** — If you delete the only product in the "Books" category, you lose all information about that category entirely, even though the category itself is still valid.

Normalization eliminates redundancy and makes each fact live in exactly one place.

---

## The Three Normal Forms — Quick Reference

| Normal Form | Rule | Key Question |
|---|---|---|
| **1NF** | Atomic values, no repeating groups, every row uniquely identifiable | "Is every cell a single value? Are there column groups like Product1, Product2?" |
| **2NF** | 1NF + no partial dependencies on a composite key | "Does every non-key column depend on the *whole* primary key, or just part of it?" |
| **3NF** | 2NF + no transitive dependencies | "Does any non-key column determine another non-key column?" |

---

## Step 1 — Unnormalized Form (UNF)

Imagine a naive database designer stores every order in a single spreadsheet row, repeating product columns for each item in the order:

**Table: order_flat**

| OrderID | OrderDate | ClientName | ClientEmail | ClientPhone | ClientCity | ProductName1 | Category1 | Price1 | Qty1 | ProductName2 | Category2 | Price2 | Qty2 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-10 | John Smith | john@mail.com | 555-0101 | London | Wireless Mouse | Electronics | 29.99 | 2 | USB Keyboard | Electronics | 49.99 | 1 |
| 2 | 2024-01-11 | Maria Garcia | maria@mail.com | 555-0202 | Madrid | SQL Server 2022 | Books | 59.99 | 1 | NULL | NULL | NULL | NULL |
| 3 | 2024-01-12 | John Smith | john@mail.com | 555-0101 | London | Running Shoes | Sports | 89.99 | 1 | Cotton T-Shirt | Clothing | 19.99 | 3 |
| 4 | 2024-01-14 | Ana Popescu | ana@mail.com | 555-0303 | Bucharest | Wireless Mouse | Electronics | 29.99 | 1 | NULL | NULL | NULL | NULL |
| 5 | 2024-01-15 | Maria Garcia | maria@mail.com | 555-0202 | Madrid | USB Keyboard | Electronics | 49.99 | 2 | Running Shoes | Sports | 89.99 | 1 |
| 6 | 2024-01-16 | John Smith | john@mail.com | 555-0101 | London | Cotton T-Shirt | Clothing | 19.99 | 2 | NULL | NULL | NULL | NULL |

**Problems visible here:**
- Repeating column groups (ProductName1/2, Category1/2, etc.) — what if an order has 10 items?
- Client data (name, email, phone, city) is duplicated for every order they place
- "Electronics" appears in multiple rows — one update requires changing many rows
- Lots of NULL values for orders with fewer than the maximum number of products

---

## Step 2 — First Normal Form (1NF)

**Rules:**
- Every cell contains a single atomic value (no lists or sets)
- No repeating column groups
- Every row must be uniquely identifiable

**Transformation:** Eliminate the Product1/Product2 column groups by creating one row per product per order.

**Table: order_1nf**

| OrderID | OrderDate | ClientName | ClientEmail | ClientPhone | ClientCity | ShippingAddress | Status | ProductName | CategoryName | UnitPrice | Quantity |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-10 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Delivered | Wireless Mouse | Electronics | 29.99 | 2 |
| 1 | 2024-01-10 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Delivered | USB Keyboard | Electronics | 49.99 | 1 |
| 2 | 2024-01-11 | Maria Garcia | maria@mail.com | 555-0202 | Madrid | Calle Mayor 5 | Shipped | SQL Server 2022 | Books | 59.99 | 1 |
| 3 | 2024-01-12 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Pending | Running Shoes | Sports | 89.99 | 1 |
| 3 | 2024-01-12 | John Smith | john@mail.com | 555-0101 | London | 12 Baker St | Pending | Cotton T-Shirt | Clothing | 19.99 | 3 |
| 4 | 2024-01-14 | Ana Popescu | ana@mail.com | 555-0303 | Bucharest | Str. Unirii 7 | Delivered | Wireless Mouse | Electronics | 29.99 | 1 |

**Primary key (composite):** `(OrderID, ProductName)`

**Now in 1NF:** No repeating groups, all values are atomic, every row is unique.

**Remaining problems:** Client data still repeats across rows of the same order. Product prices repeat for every order they appear in. These are partial dependencies — the next step fixes them.

---

## Step 3 — Second Normal Form (2NF)

**Rules:** Must be in 1NF + every non-key attribute must depend on the **entire** composite primary key, not just part of it.

**Identifying partial dependencies** in `order_1nf` with PK = `(OrderID, ProductName)`:

| Column | Depends on OrderID alone? | Depends on ProductName alone? | Depends on BOTH (full)? |
|---|---|---|---|
| OrderDate | YES — partial dep. | | |
| ClientName | YES — partial dep. | | |
| ClientEmail | YES — partial dep. | | |
| ClientPhone | YES — partial dep. | | |
| ClientCity | YES — partial dep. | | |
| ShippingAddress | YES — partial dep. | | |
| Status | YES — partial dep. | | |
| CategoryName | | YES — partial dep. | |
| UnitPrice | | YES — partial dep. | |
| **Quantity** | | | YES — full dependency |

**Transformation:** Move partial dependencies to their own tables.

**Table: clients_2nf** (depends only on client identity)

| ClientID | ClientName | ClientEmail | ClientPhone | ClientCity |
|---|---|---|---|---|
| 1 | John Smith | john@mail.com | 555-0101 | London |
| 2 | Maria Garcia | maria@mail.com | 555-0202 | Madrid |
| 3 | Ana Popescu | ana@mail.com | 555-0303 | Bucharest |

**Table: orders_2nf** (depends only on OrderID)

| OrderID | OrderDate | ShippingAddress | Status | ClientID |
|---|---|---|---|---|
| 1 | 2024-01-10 | 12 Baker St | Delivered | 1 |
| 2 | 2024-01-11 | Calle Mayor 5 | Shipped | 2 |
| 3 | 2024-01-12 | 12 Baker St | Pending | 1 |
| 4 | 2024-01-14 | Str. Unirii 7 | Delivered | 3 |

**Table: products_2nf** (depends only on ProductName)

| ProductID | ProductName | CategoryName | UnitPrice |
|---|---|---|---|
| 1 | Wireless Mouse | Electronics | 29.99 |
| 2 | USB Keyboard | Electronics | 49.99 |
| 3 | SQL Server 2022 | Books | 59.99 |
| 4 | Running Shoes | Sports | 89.99 |
| 5 | Cotton T-Shirt | Clothing | 19.99 |

**Table: order_details_2nf** (depends on the full composite key)

| OrderID | ProductID | Quantity |
|---|---|---|
| 1 | 1 | 2 |
| 1 | 2 | 1 |
| 2 | 3 | 1 |
| 3 | 4 | 1 |
| 3 | 5 | 3 |
| 4 | 1 | 1 |

No more repeating client data. No more redundant product prices.

---

## Step 4 — Third Normal Form (3NF)

**Rules:** Must be in 2NF + no transitive dependencies. A transitive dependency exists when a non-key column determines another non-key column.

**Identifying transitive dependencies** in `products_2nf`:

```
ProductID → CategoryName
```

But `CategoryName` is an attribute of the *category*, not of the product itself. If we rename "Electronics" to "Consumer Electronics", we still have to update every row in the products table that references it.

The dependency chain is:
```
ProductID → CategoryID → CategoryName
```

`CategoryName` depends on `CategoryID`, which is a non-key attribute — that is a transitive dependency.

**Transformation:** Extract `CategoryName` into its own table.

**Table: categories**

| CategoryID | CategoryName | Description |
|---|---|---|
| 1 | Electronics | Electronic devices and accessories |
| 2 | Books | Books and educational materials |
| 3 | Sports | Sports equipment and clothing |
| 4 | Clothing | Fashion and apparel |

**Table: products** (updated — CategoryName replaced by CategoryID FK)

| ProductID | ProductName | Description | Price | Stock | CategoryID |
|---|---|---|---|---|---|
| 1 | Wireless Mouse | Ergonomic wireless mouse | 29.99 | 150 | 1 |
| 2 | USB Keyboard | Mechanical keyboard | 49.99 | 80 | 1 |
| 3 | SQL Server 2022 | Database programming book | 59.99 | 40 | 2 |
| 4 | Running Shoes | Lightweight running shoes | 89.99 | 60 | 3 |
| 5 | Cotton T-Shirt | Classic cotton t-shirt | 19.99 | 200 | 4 |

Now `CategoryName` lives in exactly one place. Renaming a category requires updating one row in `categories`, not every product row.

---

## Final Schema Summary

After full normalization, the eCommerce database has **5 tables**:

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

**Relationship summary:**
- `Products` → `Categories` (many-to-one: each product has one category)
- `Orders` → `Clients` (many-to-one: each order belongs to one client)
- `OrderDetails` → `Orders` (many-to-one: each detail belongs to one order)
- `OrderDetails` → `Products` (many-to-one: each detail references one product)

---

## Practice Exercises

**Exercise 1 (Easy)**
In the UNF table, what anomaly occurs if you try to add a new category "Garden Tools" before you have any products in that category?

**Exercise 2 (Easy)**
In the 1NF table `order_1nf`, what is the composite primary key? Why is OrderID alone not sufficient?

**Exercise 3 (Medium)**
In the 2NF stage, explain why `ShippingAddress` was moved to the `orders_2nf` table rather than `clients_2nf`, even though both tables were split from orders.

**Exercise 4 (Medium)**
After reaching 3NF, if a product changes its category, how many rows must be updated? How many rows would need updating in the 2NF version?

**Exercise 5 (Hard)**
A colleague suggests adding a `ClientCity` column directly to the `Orders` table, arguing "the shipping city might differ from the client's registered city." Is this a normalization violation? Justify your answer and describe how you would handle this requirement properly.

---

## Answers

**Exercise 1:** Insertion anomaly. In the UNF table every row must have a product, so a category with no products yet cannot be stored.

**Exercise 2:** The composite PK is `(OrderID, ProductName)`. OrderID alone is not unique because one order can contain multiple products, each appearing on its own row.

**Exercise 3:** `ShippingAddress` depends only on `OrderID` (it is the address for *that specific order*) and is therefore a partial dependency on `OrderID`. It belongs in the orders table. It was not moved to `clients` because the client might ship to a different address on each order.

**Exercise 4:** In 3NF, updating a product's category means changing `CategoryID` in one row of the `Products` table. In the 2NF version, `CategoryName` was stored in every product row, so only that one row needed updating too — but if the category *name* changed (in 2NF there is no categories table), you would need to update every product row that has that category name.

**Exercise 5:** This is NOT a normalization violation as described. `ShippingAddress` in `Orders` refers to the address *of that order*, which can legitimately differ from the client's registered address. Storing it there is correct. If you need the client's registered city as well, that already exists in the `Clients` table and can be retrieved via a JOIN. No duplication occurs because the two columns represent two different facts.
