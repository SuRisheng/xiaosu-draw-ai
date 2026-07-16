# UML Class Diagram

## What This Is

A diagram showing classes, interfaces, and abstract classes with their attributes, methods, and relationships (inheritance, implementation, composition, aggregation, association). Best for object-oriented design, code documentation, and architecture modeling.

## When to Use

- Object-oriented system design
- Code architecture documentation
- Design pattern illustration
- Domain model design
- Interface/implementation separation design

## How to Describe Your System

1. **What are the core classes/interfaces?**
   e.g., User, Order, Product, PaymentService (interface), BaseEntity (abstract class)

2. **What attributes and methods does each class have?**
   - User: +id: int, +name: String, +email: String, +login(), +logout()
   - Order: -id: int, -total: BigDecimal, +place(), +cancel()
   Use + for public, - for private, # for protected

3. **How are classes related?**
   - Inheritance (extends): subclass → superclass, hollow triangle arrow
   - Implementation (implements): class → interface, dashed hollow triangle
   - Composition (strong ownership): whole → part, filled diamond
   - Aggregation (weak ownership): whole → part, hollow diamond
   - Association: basic usage relationship

4. **Any special annotations?**
   e.g., "Mark design patterns (Observer, Factory)", "Use different colors for abstract classes and interfaces"

## Examples

### Example 1: Simple E-Commerce Model

> Draw a class diagram for an e-commerce system. User has id, name, email attributes and login(), logout() methods. Order has id, total, status attributes and place(), cancel() methods. User and Order have a one-to-many association.

### Example 2: Payment System

> Draw a payment system class diagram.
> PaymentService is an interface defining pay(), refund(), query().
> AlipayService and WechatPayService implement PaymentService.
> AbstractPayment is an abstract class with shared validate() and log() methods.
> Order composes OrderItem (strong ownership — order items deleted when order deleted).

## Constraints (AI must follow)

- **布局方向**：继承关系自上而下（父类在上），关联关系左右排布。类之间水平间距 250px，垂直（继承）间距 150px。
- **形状规范**：
  - 所有类用 swimlane 表示（3 栏：类名/属性/方法），startSize=30，类名居中加粗（fontStyle=1）。
  - 抽象类名用斜体（fontStyle=2），接口标注 `«interface»`，抽象类标注 `«abstract»`。
  - 属性行和和方法行用无边框文本（fillColor=none;strokeColor=none;），左对齐（align=left），fontSize=11。
  - 属性格式：`visibility name: Type`（+ public, - private, # protected）。
  - 类宽度 200–240px，行高 20px，类高度 = 26 + 属性数×20 + 方法数×20。
- **颜色语义**：不同类用不同语义角色，色值由所选风格 JSON 查表确定——
  - 具体类 → role: service
  - 抽象类 → role: database
  - 接口 → role: queue
  - 枚举 → role: security
  - 至少使用 3 种不同角色交替。
  - **查表方式**：读所选风格 JSON → 查 `roles` 字段找 palette 槽位 → 查 `palette` 字段取 fillColor/strokeColor
- **边规范**：边使用正交路由（edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;）——
  - 继承（extends）：endArrow=block;endFill=0;（空心三角）
  - 实现（implements）：endArrow=block;endFill=0;dashed=1;dashPattern=8 4;（虚线空心三角）
  - 组合（强拥有）：endArrow=diamond;endFill=1;（实心菱形，源端）
  - 聚合（弱拥有）：endArrow=diamondThin;endFill=0;（空心菱形，源端）
  - 关联：endArrow=none; 或无箭头
- **坐标对齐**：所有坐标必须是 10px 的整数倍。
- **图例**：右上角添加关系图例（继承/实现/组合/聚合/关联）。