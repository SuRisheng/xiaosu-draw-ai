# UML 类图（Class Diagram）

## 这是什么图

展示系统中类、接口、抽象类的属性、方法以及它们之间的继承、实现、组合、聚合、关联关系。适合面向对象设计、代码文档化、架构建模。

## 适用场景

- 面向对象系统设计
- 代码架构文档
- 设计模式说明
- 领域模型设计
- 接口与实现分离设计

## 你怎么描述

1. **有哪些核心类/接口？**
   比如：User、Order、Product、PaymentService（接口）、BaseEntity（抽象类）

2. **每个类有哪些属性和方法？**
   - User：+id: int, +name: String, +email: String, +login(), +logout()
   - Order：-id: int, -total: BigDecimal, +place(), +cancel()
   用 + 表示 public，- 表示 private，# 表示 protected

3. **类之间什么关系？**
   - 继承（extends）：子类 → 父类，空心三角箭头
   - 实现（implements）：实现类 → 接口，虚线空心三角
   - 组合（强拥有）：整体 → 部分，实心菱形
   - 聚合（弱拥有）：整体 → 部分，空心菱形
   - 关联：普通使用关系

4. **有没有特殊标注？**
   比如："标注设计模式（如 Observer、Factory）"、"抽象类和接口用不同颜色区分"

## 示例

### 示例1：简单电商模型

> 画一个电商系统的类图。User 类有 id、name、email 属性和 login()、logout() 方法。Order 类有 id、total、status 属性和 place()、cancel() 方法。User 和 Order 是一对多关联关系。

### 示例2：支付系统

> 画一个支付系统的类图。
> PaymentService 是接口，定义了 pay()、refund()、query() 方法。
> AlipayService 和 WechatPayService 实现 PaymentService。
> AbstractPayment 是抽象类，包含公共的 validate() 和 log() 方法。
> Order 类组合 OrderItem（强拥有关系，订单删除时订单项也删除）。

## 约束（AI 生成时必须遵守）

- **布局方向**：继承关系自上而下（父类在上），关联关系左右排布。类之间水平间距 250px，垂直（继承）间距 150px。
- **形状规范**：
  - 所有类用 swimlane 表示（3 栏：类名/属性/方法），startSize=30，类名居中加粗（fontStyle=1）。
  - 抽象类名用斜体（fontStyle=2），接口标注 `«interface»`，抽象类标注 `«abstract»`。
  - 属性行和和方法行用无边框文本（fillColor=none;strokeColor=none;），左对齐（align=left），fontSize=11。
  - 属性格式：`visibility name: Type`（+ public, - private, # protected）。
  - 类宽度 200–240px，行高 20px，类高度 = 26 + 属性数×20 + 方法数×20。
- **颜色语义**：
  - 具体类：蓝色（fillColor=#dae8fc, strokeColor=#6c8ebf）
  - 抽象类：绿色（fillColor=#d5e8d4, strokeColor=#82b366）
  - 接口：黄色（fillColor=#fff2cc, strokeColor=#d6b656）
  - 枚举：紫色（fillColor=#e1d5e7, strokeColor=#9673a6）
  - 至少使用 3 种不同颜色交替。
- **边规范**：边使用正交路由（edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;）——
  - 继承（extends）：endArrow=block;endFill=0;（空心三角）
  - 实现（implements）：endArrow=block;endFill=0;dashed=1;dashPattern=8 4;（虚线空心三角）
  - 组合（强拥有）：endArrow=diamond;endFill=1;（实心菱形，源端）
  - 聚合（弱拥有）：endArrow=diamondThin;endFill=0;（空心菱形，源端）
  - 关联：endArrow=none; 或无箭头
- **坐标对齐**：所有坐标必须是 10px 的整数倍。
- **图例**：右上角添加关系图例（继承/实现/组合/聚合/关联）。
