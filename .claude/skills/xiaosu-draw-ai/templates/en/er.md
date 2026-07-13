# ER Diagram (Entity-Relationship)

## What This Is

A diagram showing data entities (tables), their attributes (columns), and relationships (1:1, 1:N, N:M). Best for database design, data modeling, and schema documentation.

## When to Use

- New database schema design
- Business data modeling and review
- Data relationship mapping during refactoring
- Feature data model design
- Communicating data structure to the team

## How to Describe Your Data

Answer these questions in natural language (not all required — the AI will ask follow-ups):

1. **What are the core entities (tables)?**
   e.g., User, Order, Product, Category, ShoppingCart
   Each entity is a database table. 3–6 core entities is ideal.

2. **What fields does each entity have?**
   List key fields with types and constraints:
   - User: id (INT, PK), name (VARCHAR(100)), email (VARCHAR(255), UNIQUE), created_at (DATETIME)
   - Order: id (INT, PK), order_no (VARCHAR(32), UNIQUE), user_id (INT, FK→User), total (DECIMAL(10,2)), status (VARCHAR(20))
   - Product: id (INT, PK), name (VARCHAR(200)), price (DECIMAL(10,2)), stock (INT), category_id (INT, FK→Category)
   Mark primary keys with **PK**, foreign keys with **FK**, unique constraints with **UQ**.

3. **How are the entities related?**
   Three relationship types:
   - **One-to-One (1:1)**: User ↔ UserProfile
   - **One-to-Many (1:N)**: User → Orders (a user has many orders)
   - **Many-to-Many (N:M)**: Order ↔ Product (via OrderItem join table)
   Describe direction and cardinality.

4. **Any special annotations?**
   - "Mark indexed fields with INDEX"
   - "Color-code: core entities blue, config entities purple"
   - "Mark soft-delete columns (deleted_at)"
   - "Note enum values for status fields"

## Examples

### Example 1: Simple Library System

> Draw an ER diagram for a library management system. Three entities:
>
> - Reader: id (PK), name, email (UQ), phone, registered_at
> - Book: id (PK), isbn (UQ), title, author, publisher, published_year, total_copies
> - BorrowRecord: id (PK), reader_id (FK→Reader), book_id (FK→Book), borrowed_at, due_date, returned_at
>
> Relationships: Reader 1:N BorrowRecord, Book 1:N BorrowRecord.

### Example 2: E-Commerce Data Model

> Draw a complete e-commerce data model ER diagram.
>
> Entities:
> 1. **User**: id (INT PK), username (VARCHAR(50) UQ), email (VARCHAR(255) UQ), password_hash (VARCHAR(255)), phone (VARCHAR(20)), role (ENUM: user/admin), status (ENUM: active/disabled), created_at (DATETIME), updated_at (DATETIME)
>
> 2. **Order**: id (INT PK), order_no (VARCHAR(32) UQ), user_id (INT FK→User), address_id (INT FK→Address), total_amount (DECIMAL(10,2)), discount (DECIMAL(10,2)), actual_amount (DECIMAL(10,2)), status (ENUM: pending/paid/shipped/completed/cancelled), paid_at (DATETIME), created_at (DATETIME)
>
> 3. **OrderItem**: id (INT PK), order_id (INT FK→Order), product_id (INT FK→Product), sku_id (INT FK→Sku), quantity (INT), unit_price (DECIMAL(10,2)), subtotal (DECIMAL(10,2))
>
> 4. **Product**: id (INT PK), name (VARCHAR(200)), description (TEXT), category_id (INT FK→Category), brand_id (INT FK→Brand), status (ENUM: draft/online/offline), created_at (DATETIME)
>
> 5. **Sku**: id (INT PK), product_id (INT FK→Product), sku_code (VARCHAR(64) UQ), spec (VARCHAR(200)), price (DECIMAL(10,2)), stock (INT), sold_count (INT DEFAULT 0)
>
> 6. **Category**: id (INT PK), name (VARCHAR(100)), parent_id (INT FK→Category self-ref), sort_order (INT), icon (VARCHAR(255))
>
> 7. **Address**: id (INT PK), user_id (INT FK→User), receiver_name (VARCHAR(50)), phone (VARCHAR(20)), province, city, district, detail (VARCHAR(255)), is_default (BOOLEAN)
>
> Relationships:
> - User 1:N Order, User 1:N Address
> - Order 1:N OrderItem, Sku 1:N OrderItem
> - Product 1:N Sku
> - Product N:1 Category
> - Category 1:N Category (self-referencing, multi-level tree)

## Constraints (AI must follow)

- **实体表示**：每个实体用 swimlane 表示，标题行（startSize=30）显示实体名（加粗，fontStyle=1）。
- **字段表示**：字段用无边框的文本单元格（fillColor=none;strokeColor=none;），左对齐（align=left），fontSize=11。
- **主键标注**：主键字段用 `<u>字段名: 类型 (PK)</u>` 下划线标注。
- **外键标注**：外键字段标注引用目标：`字段名: 类型 (FK → 目标实体)`。
- **颜色分配**：不同实体使用不同颜色（从 7 色调色板中交替选取，至少 3 种不同颜色）。
- **实体尺寸**：实体宽度 200–240px；字段行 y 高度 20px，字段间距约 40px。
- **关系边**：使用正交连线（edgeStyle=orthogonalEdgeStyle），标注基数标签（"1", "N", "M"）。
- **基数标签**：用独立的 text 顶点放在边附近，fontSize=10, fontStyle=1。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。