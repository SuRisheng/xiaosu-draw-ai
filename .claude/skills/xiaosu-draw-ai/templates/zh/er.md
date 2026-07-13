# ER 图（Entity-Relationship Diagram）

## 这是什么图

展示系统中的数据实体（表）、实体属性（字段）、以及实体之间的关系（一对一、一对多、多对多）。适合数据库设计、数据建模、系统数据结构梳理。

## 适用场景

- 数据库表结构设计（新项目）
- 业务数据建模与评审
- 系统重构时的数据关系梳理
- 新功能的数据模型设计
- 与团队沟通数据结构

## 你怎么描述

用自然语言回答以下问题（不需要全答，AI 会追问你漏掉的部分）：

1. **系统有哪些核心实体（数据库表）？**
   比如：用户（User）、订单（Order）、商品（Product）、分类（Category）、购物车（Cart）
   每个实体就是一个数据库表。3–6 个核心实体最合适，太多会显得拥挤。

2. **每个实体有哪些字段？**
   列出关键字段、类型和约束：
   - 用户：id (INT, 主键)、name (VARCHAR(100))、email (VARCHAR(255), 唯一)、created_at (DATETIME)
   - 订单：id (INT, 主键)、order_no (VARCHAR(32), 唯一)、user_id (INT, 外键→用户)、total_amount (DECIMAL(10,2))、status (VARCHAR(20))
   - 商品：id (INT, 主键)、name (VARCHAR(200))、price (DECIMAL(10,2))、stock (INT)、category_id (INT, 外键→分类)
   主键用 **PK** 标注，外键用 **FK** 标注，唯一约束用 **UQ** 标注。

3. **实体之间什么关系？**
   三种关系：
   - **一对一（1:1）**：如 用户 ↔ 用户详情
   - **一对多（1:N）**：如 用户 → 订单（一个用户有多个订单）
   - **多对多（N:M）**：如 订单 ↔ 商品（通过订单商品中间表）
   说明关系的方向和基数。

4. **有没有特殊标注？**
   比如：
   - "某些字段需要标注索引（INDEX）"
   - "用不同颜色区分：核心实体蓝色、配置实体紫色"
   - "标注软删除字段（deleted_at）"
   - "枚举字段标注可选值"

## 示例

### 示例1：简单图书管理系统

> 画一个图书管理系统的 ER 图。三个实体：
>
> - 读者（Reader）：id (PK)、name、email (UQ)、phone、registered_at
> - 图书（Book）：id (PK)、isbn (UQ)、title、author、publisher、published_year、total_copies
> - 借阅记录（BorrowRecord）：id (PK)、reader_id (FK→Reader)、book_id (FK→Book)、borrowed_at、due_date、returned_at
>
> 关系：读者 1:N 借阅记录，图书 1:N 借阅记录。

### 示例2：电商数据模型

> 画一个电商平台的完整数据模型 ER 图。
>
> 实体：
> 1. **用户（User）**：id (INT PK)、username (VARCHAR(50) UQ)、email (VARCHAR(255) UQ)、password_hash (VARCHAR(255))、phone (VARCHAR(20))、role (ENUM: user/admin)、status (ENUM: active/disabled)、created_at (DATETIME)、updated_at (DATETIME)
>
> 2. **订单（Order）**：id (INT PK)、order_no (VARCHAR(32) UQ)、user_id (INT FK→User)、address_id (INT FK→Address)、total_amount (DECIMAL(10,2))、discount_amount (DECIMAL(10,2))、actual_amount (DECIMAL(10,2))、status (ENUM: pending/paid/shipped/completed/cancelled)、paid_at (DATETIME)、created_at (DATETIME)
>
> 3. **订单商品（OrderItem）**：id (INT PK)、order_id (INT FK→Order)、product_id (INT FK→Product)、sku_id (INT FK→Sku)、quantity (INT)、unit_price (DECIMAL(10,2))、subtotal (DECIMAL(10,2))
>
> 4. **商品（Product）**：id (INT PK)、name (VARCHAR(200))、description (TEXT)、category_id (INT FK→Category)、brand_id (INT FK→Brand)、status (ENUM: draft/online/offline)、created_at (DATETIME)
>
> 5. **SKU（Sku）**：id (INT PK)、product_id (INT FK→Product)、sku_code (VARCHAR(64) UQ)、spec (VARCHAR(200))、price (DECIMAL(10,2))、stock (INT)、sold_count (INT DEFAULT 0)
>
> 6. **分类（Category）**：id (INT PK)、name (VARCHAR(100))、parent_id (INT FK→Category 自引用)、sort_order (INT)、icon (VARCHAR(255))
>
> 7. **收货地址（Address）**：id (INT PK)、user_id (INT FK→User)、receiver_name (VARCHAR(50))、phone (VARCHAR(20))、province/city/district (VARCHAR(50))、detail (VARCHAR(255))、is_default (BOOLEAN)
>
> 关系：
> - 用户 1:N 订单、用户 1:N 收货地址
> - 订单 1:N 订单商品、SKU 1:N 订单商品
> - 商品 1:N SKU
> - 商品 N:1 分类（多个商品属于一个分类）
> - 分类 1:N 分类（自引用，实现多级分类树）
>
> 用不同的 swimlane 颜色区分核心实体（用户/订单/商品）、关联实体（订单商品/SKU）、配置实体（分类/品牌）。

## 约束（AI 生成时必须遵守）

- **实体表示**：每个实体用 swimlane 表示，标题行（startSize=30）显示实体名（加粗，fontStyle=1）。
- **字段表示**：字段用无边框的文本单元格（fillColor=none;strokeColor=none;），左对齐（align=left），fontSize=11。
- **主键标注**：主键字段用 `<u>字段名: 类型 (PK)</u>` 下划线标注。
- **外键标注**：外键字段标注引用目标：`字段名: 类型 (FK → 目标实体)`。
- **颜色分配**：不同实体使用不同颜色（从 7 色调色板中交替选取，至少 3 种不同颜色）。
- **实体尺寸**：实体宽度 200–240px；字段行 y 高度 20px，字段间距约 40px。
- **关系边**：使用正交连线（edgeStyle=orthogonalEdgeStyle），标注基数标签（"1", "N", "M"）。
- **基数标签**：用独立的 text 顶点放在边附近，fontSize=10, fontStyle=1。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。
