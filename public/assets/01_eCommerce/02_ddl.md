# eCommerce Database — Worksheet 2: DDL — Creating the Database

## Learning Objectives
- Use `CREATE DATABASE` and `CREATE TABLE` to build a database from scratch
- Define primary keys, foreign keys, and other constraints in T-SQL
- Use `ALTER TABLE` to add or modify constraints after a table is created
- Drop tables and databases safely in the correct order

---

## DDL Overview

DDL (Data Definition Language) statements define and modify the **structure** of database objects.

| Statement | Purpose |
|---|---|
| `CREATE` | Creates a new database, table, view, index, etc. |
| `ALTER` | Modifies an existing structure (add/remove/change columns or constraints) |
| `DROP` | Permanently removes a database object |
| `TRUNCATE` | Removes all rows from a table but keeps the structure |

---

## Step 1: Creating the Database

```sql
-- Create the database
CREATE DATABASE eCommerceDB;
GO

-- Switch to it
USE eCommerceDB;
GO
```

> **Note:** The `GO` keyword is not SQL — it is a batch separator used by SQL Server Management Studio (SSMS) and sqlcmd to send the preceding commands as one batch to the server.

---

## Step 2: Creating the Tables

Tables must be created **parent tables first**. A child table that references a parent via a foreign key cannot be created before the parent exists.

**Creation order:** Categories → Clients → Products → Orders → OrderDetails

---

### Table 1: Categories

Stores product categories. This is a parent table with no foreign keys.

```sql
CREATE TABLE Categories (
    CategoryID   INT            IDENTITY(1,1)  NOT NULL,
    CategoryName NVARCHAR(100)                 NOT NULL,
    Description  NVARCHAR(500)                 NULL,

    CONSTRAINT PK_Categories PRIMARY KEY (CategoryID),
    CONSTRAINT UQ_Categories_Name UNIQUE (CategoryName)
);
GO
```

---

### Table 2: Clients

Stores registered customers.

```sql
CREATE TABLE Clients (
    ClientID    INT           IDENTITY(1,1)   NOT NULL,
    FirstName   NVARCHAR(100)                 NOT NULL,
    LastName    NVARCHAR(100)                 NOT NULL,
    Email       NVARCHAR(200)                 NOT NULL,
    Phone       NVARCHAR(20)                  NULL,
    Address     NVARCHAR(300)                 NULL,
    City        NVARCHAR(100)                 NULL,
    Country     NVARCHAR(100)                 NULL,
    CreatedDate DATE          DEFAULT GETDATE() NOT NULL,

    CONSTRAINT PK_Clients PRIMARY KEY (ClientID),
    CONSTRAINT UQ_Clients_Email UNIQUE (Email)
);
GO
```

---

### Table 3: Products

Stores items for sale. References `Categories`.

```sql
CREATE TABLE Products (
    ProductID   INT              IDENTITY(1,1)  NOT NULL,
    ProductName NVARCHAR(200)                   NOT NULL,
    Description NVARCHAR(500)                   NULL,
    Price       DECIMAL(10, 2)                  NOT NULL,
    Stock       INT              DEFAULT 0       NOT NULL,
    CategoryID  INT                              NOT NULL,

    CONSTRAINT PK_Products    PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Categories
        FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT CHK_Products_Price
        CHECK (Price >= 0),
    CONSTRAINT CHK_Products_Stock
        CHECK (Stock >= 0)
);
GO
```

---

### Table 4: Orders

Stores order headers. References `Clients`.

```sql
CREATE TABLE Orders (
    OrderID         INT              IDENTITY(1,1)    NOT NULL,
    ClientID        INT                               NOT NULL,
    OrderDate       DATETIME         DEFAULT GETDATE() NOT NULL,
    ShippingAddress NVARCHAR(300)                     NULL,
    Status          NVARCHAR(50)     DEFAULT 'Pending' NOT NULL,
    TotalAmount     DECIMAL(10, 2)                    NULL,

    CONSTRAINT PK_Orders PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Clients
        FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    CONSTRAINT CHK_Orders_Status
        CHECK (Status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    CONSTRAINT CHK_Orders_TotalAmount
        CHECK (TotalAmount IS NULL OR TotalAmount >= 0)
);
GO
```

---

### Table 5: OrderDetails

Stores individual line items within an order. References both `Orders` and `Products`.

```sql
CREATE TABLE OrderDetails (
    OrderDetailID INT            IDENTITY(1,1) NOT NULL,
    OrderID       INT                          NOT NULL,
    ProductID     INT                          NOT NULL,
    Quantity      INT                          NOT NULL,
    UnitPrice     DECIMAL(10, 2)               NOT NULL,

    CONSTRAINT PK_OrderDetails PRIMARY KEY (OrderDetailID),
    CONSTRAINT FK_OrderDetails_Orders
        FOREIGN KEY (OrderID) REFERENCES Orders(OrderID),
    CONSTRAINT FK_OrderDetails_Products
        FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT CHK_OrderDetails_Quantity
        CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderDetails_UnitPrice
        CHECK (UnitPrice >= 0)
);
GO
```

---

## Step 3: Adding Foreign Keys with ALTER TABLE (Alternative Method)

Instead of defining foreign keys inside `CREATE TABLE`, you can add them afterwards:

```sql
-- Add FK to Products after both tables exist
ALTER TABLE Products
ADD CONSTRAINT FK_Products_Categories
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID);
GO

-- Add FK to Orders after both tables exist
ALTER TABLE Orders
ADD CONSTRAINT FK_Orders_Clients
    FOREIGN KEY (ClientID) REFERENCES Clients(ClientID);
GO

-- Add FKs to OrderDetails
ALTER TABLE OrderDetails
ADD CONSTRAINT FK_OrderDetails_Orders
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID);
GO

ALTER TABLE OrderDetails
ADD CONSTRAINT FK_OrderDetails_Products
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID);
GO
```

> **When to use this approach:** When you need to create tables whose FK references form a cycle, or when adding constraints to an existing database without rebuilding tables.

---

## Step 4: Verifying the Schema

```sql
-- View all columns of a table
EXEC sp_help 'Products';
GO

-- List all columns with data types
SELECT
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Products';
GO

-- List all constraints
SELECT
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
ORDER BY TABLE_NAME, CONSTRAINT_TYPE;
GO

-- List foreign key relationships
SELECT
    fk.name                       AS FK_Name,
    tp.name                       AS Parent_Table,
    cp.name                       AS Parent_Column,
    tr.name                       AS Referenced_Table,
    cr.name                       AS Referenced_Column
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

## Step 5: Modifying Tables with ALTER TABLE

```sql
-- Add a new column
ALTER TABLE Clients
ADD DateOfBirth DATE NULL;
GO

-- Change a column's data type
ALTER TABLE Clients
ALTER COLUMN Phone NVARCHAR(30) NULL;
GO

-- Drop a column
ALTER TABLE Clients
DROP COLUMN DateOfBirth;
GO

-- Add a CHECK constraint to an existing table
ALTER TABLE Products
ADD CONSTRAINT CHK_Products_Name CHECK (LEN(ProductName) >= 2);
GO

-- Drop a constraint
ALTER TABLE Products
DROP CONSTRAINT CHK_Products_Name;
GO
```

---

## Step 6: Dropping Tables and the Database

Tables must be dropped **child tables first** (reverse of creation order).

```sql
-- Drop in reverse dependency order
DROP TABLE IF EXISTS OrderDetails;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Clients;
DROP TABLE IF EXISTS Categories;
GO

-- Drop the database (must switch away from it first)
USE master;
GO
DROP DATABASE IF EXISTS eCommerceDB;
GO
```

---

## Complete Ready-to-Run Script

```sql
-- ============================================================
-- eCommerceDB — Full Creation Script
-- Run this script in SSMS to build the database from scratch
-- ============================================================

USE master;
GO

-- Drop existing database if present
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

-- Categories
CREATE TABLE Categories (
    CategoryID   INT            IDENTITY(1,1)  NOT NULL,
    CategoryName NVARCHAR(100)                 NOT NULL,
    Description  NVARCHAR(500)                 NULL,
    CONSTRAINT PK_Categories PRIMARY KEY (CategoryID),
    CONSTRAINT UQ_Categories_Name UNIQUE (CategoryName)
);
GO

-- Clients
CREATE TABLE Clients (
    ClientID    INT           IDENTITY(1,1)    NOT NULL,
    FirstName   NVARCHAR(100)                  NOT NULL,
    LastName    NVARCHAR(100)                  NOT NULL,
    Email       NVARCHAR(200)                  NOT NULL,
    Phone       NVARCHAR(20)                   NULL,
    Address     NVARCHAR(300)                  NULL,
    City        NVARCHAR(100)                  NULL,
    Country     NVARCHAR(100)                  NULL,
    CreatedDate DATE          DEFAULT GETDATE() NOT NULL,
    CONSTRAINT PK_Clients      PRIMARY KEY (ClientID),
    CONSTRAINT UQ_Clients_Email UNIQUE (Email)
);
GO

-- Products
CREATE TABLE Products (
    ProductID   INT              IDENTITY(1,1) NOT NULL,
    ProductName NVARCHAR(200)                  NOT NULL,
    Description NVARCHAR(500)                  NULL,
    Price       DECIMAL(10, 2)                 NOT NULL,
    Stock       INT              DEFAULT 0      NOT NULL,
    CategoryID  INT                             NOT NULL,
    CONSTRAINT PK_Products PRIMARY KEY (ProductID),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    CONSTRAINT CHK_Products_Price CHECK (Price >= 0),
    CONSTRAINT CHK_Products_Stock CHECK (Stock >= 0)
);
GO

-- Orders
CREATE TABLE Orders (
    OrderID         INT              IDENTITY(1,1)     NOT NULL,
    ClientID        INT                                NOT NULL,
    OrderDate       DATETIME         DEFAULT GETDATE()  NOT NULL,
    ShippingAddress NVARCHAR(300)                      NULL,
    Status          NVARCHAR(50)     DEFAULT 'Pending'  NOT NULL,
    TotalAmount     DECIMAL(10, 2)                     NULL,
    CONSTRAINT PK_Orders PRIMARY KEY (OrderID),
    CONSTRAINT FK_Orders_Clients FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    CONSTRAINT CHK_Orders_Status CHECK (Status IN ('Pending','Processing','Shipped','Delivered','Cancelled'))
);
GO

-- OrderDetails
CREATE TABLE OrderDetails (
    OrderDetailID INT            IDENTITY(1,1) NOT NULL,
    OrderID       INT                          NOT NULL,
    ProductID     INT                          NOT NULL,
    Quantity      INT                          NOT NULL,
    UnitPrice     DECIMAL(10, 2)               NOT NULL,
    CONSTRAINT PK_OrderDetails      PRIMARY KEY (OrderDetailID),
    CONSTRAINT FK_OrderDetails_Orders   FOREIGN KEY (OrderID)    REFERENCES Orders(OrderID),
    CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (ProductID)  REFERENCES Products(ProductID),
    CONSTRAINT CHK_OrderDetails_Qty   CHECK (Quantity > 0),
    CONSTRAINT CHK_OrderDetails_Price CHECK (UnitPrice >= 0)
);
GO
```

---

## Practice Exercises

**Exercise 1**
Write the `CREATE TABLE` statement for a new table called `ProductReviews` with the following columns: `ReviewID` (auto-increment PK), `ProductID` (FK to Products), `ClientID` (FK to Clients), `Rating` (integer 1–5, required), `Comment` (up to 1000 characters, optional), `ReviewDate` (date, defaults to today).

**Exercise 2**
The `Orders` table needs a new column `DiscountAmount` of type `DECIMAL(10,2)` that cannot be negative and defaults to `0`. Write the `ALTER TABLE` statement.

**Exercise 3**
Write a query using `INFORMATION_SCHEMA` to list every table name and the number of columns each table has.

**Exercise 4**
A developer created the `OrderDetails` table before `Orders` and got an error. Explain what the error is and why it happened.

**Exercise 5**
Write the statements to safely drop the entire `eCommerceDB` database, including handling the case where it may not exist.
