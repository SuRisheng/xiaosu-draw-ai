# State Machine Diagram

## What This Is

A diagram showing the states of an object or system, the transitions between states, and the events that trigger those transitions. Best for lifecycle modeling, protocol design, and workflow state management.

## When to Use

- Order lifecycle (pending → paid → shipped → completed → cancelled)
- User account status (active → frozen → closed)
- Ticket workflow (new → in progress → resolved → closed)
- Protocol state machines (TCP connection, OAuth flow)
- Approval process states

## How to Describe Your System

1. **What object/system does this state machine describe?**
   e.g., "Order lifecycle", "User authentication flow", "TCP connection states"

2. **What are the states?**
   e.g., Draft, In Review, Published, Archived, Deleted
   Each state as a short phrase (2-6 states recommended)

3. **How do states transition? What triggers each transition?**
   e.g.:
   - Draft → In Review: User clicks "Submit for review"
   - In Review → Published: Admin clicks "Approve"
   - In Review → Draft: Admin clicks "Reject"
   - Published → Archived: System auto (90 days after publish)

4. **Any special annotations?**
   e.g., "Mark error states in red", "Annotate guard conditions like [balance > 0]"

## Examples

### Example 1: Order State Machine

> Draw an e-commerce order state machine.
> States: Pending Payment → Paid → Shipped → Completed → Cancelled
> Pending → Paid: Payment succeeds
> Pending → Cancelled: User cancels OR 30-minute timeout
> Paid → Shipped: Warehouse dispatches
> Shipped → Completed: User confirms delivery OR 7-day auto-confirm

### Example 2: User Authentication

> Draw a user authentication state machine.
> Initial → Logged Out
> Logged Out → Logging In: User enters credentials
> Logging In → Logged In (Home): Authentication succeeds
> Logging In → Logged Out: Authentication fails [retryCount < 3]
> Logging In → Locked: Authentication fails [retryCount >= 3]
> Logged In → Logged Out: User logs out OR token expires
> Locked → Logged Out: Admin unlocks OR 30-minute auto-unlock

## Constraints (AI must follow)

- **布局方向**：初始状态在最左（或最上），终态在最右（或最下）。简单状态链从左到右排列，复杂图以平衡布局展开。状态之间水平间距 100px，垂直间距 120px。页面边距 ≥ 40px。
- **形状规范**：
  - 初始状态：实心小圆（ellipse;whiteSpace=wrap;html=1;fillColor=#6c8ebf;strokeColor=#6c8ebf;），直径 20–30px
  - 终态：双层圆（ellipse;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#000000;strokeWidth=2;）
  - 普通状态：圆角矩形（rounded=1;whiteSpace=wrap;html=1;）
  - 选择伪状态（choice）：菱形（rhombus;whiteSpace=wrap;html=1;）
  - 复合状态（含子状态）：swimlane（swimlane;startSize=30;）
- **颜色语义**：按状态类型→语义角色→风格预设查表，不硬编码色值——
  - 普通状态 → role: service
  - 终态 → role: database
  - 错误/异常状态 → role: error
  - 初始状态（实心小圆）→ 固定深色填充（不跟随风格）
  - **查表方式**：读所选风格 JSON → 查 `roles` 字段找 palette 槽位 → 查 `palette` 字段取 fillColor/strokeColor
- **边规范**：边使用正交路由（edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;），箭头用 block（endArrow=block;endFill=1;）。转换标签格式：`事件 [守卫条件] / 动作`。自转换（同一状态到自身）使用弧形边（orthogonalLoop=1;jettySize=auto;），放在状态上方或右侧。
- **数量约束**：有且仅有一个初始状态。可有一个或多个终态。choice 节点的每条出边必须标注条件（如 `[是]`/`[否]` 或具体守卫）。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。