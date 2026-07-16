# Deployment Diagram

## What This Is

A diagram showing your system's physical deployment topology — network zones, server nodes, and infrastructure components. Best for cloud architecture, on-premise deployments, and hybrid/multi-cloud architectures.

## When to Use

- Cloud infrastructure design (AWS, Azure, GCP, Alibaba Cloud)
- On-premise data center topology
- Security zone design and firewall policies
- Hybrid/multi-cloud architecture planning
- Disaster recovery and high-availability architecture

## How to Describe Your System

1. **Where is your system deployed?**
   e.g., "Alibaba Cloud ACK (Kubernetes)", "Self-managed data center + AWS hybrid"

2. **What network zones exist?**
   e.g., Internet → Firewall → DMZ (Bastion/Nginx) → Internal (App Servers) → Data (MySQL/Redis)

3. **What nodes/services are in each zone?**
   e.g., "DMZ has Nginx reverse proxy and bastion host", "Internal zone has 3 application servers"

4. **How do nodes communicate?**
   e.g., "Internet accesses DMZ Nginx through firewall", "App servers access databases over internal network"

## Examples

### Example 1: Simple Cloud Deployment

> Draw an Alibaba Cloud deployment architecture for a web app. Users access via CDN and SLB load balancer. App runs on ECS instances. Database is RDS MySQL, cache is Redis, static files stored in OSS.

### Example 2: Detailed Hybrid Cloud

> Draw a hybrid cloud deployment for a financial system.
> Headquarters data center: Core database (Oracle RAC), file server
> Alibaba Cloud VPC: Web tier (2 ECS + SLB), App tier (4 ECS), Cache tier (Redis Cluster)
> Direct Connect between data center and cloud VPC
> DMZ: Bastion host, WAF
> Security zone: Log audit, bastion host

## Constraints (AI must follow)

- **布局方向**：从上到下或从左到右经过安全区域。区域之间间距 ≥ 140px，区域内节点间距 ≥ 60px。页面边距 ≥ 40px。
- **形状规范**：
  - 服务器/计算节点：圆角矩形（rounded=1;whiteSpace=wrap;html=1;）
  - 数据库/存储：圆柱体（shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;）
  - 防火墙：六边形（shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;）
  - 负载均衡/API 网关：圆角矩形（rounded=1;whiteSpace=wrap;html=1;fontStyle=1;）
  - 云/互联网：云形状（ellipse;shape=cloud;whiteSpace=wrap;html=1;）
  - 区域边界：虚线框（rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;strokeColor=#999999;）
- **颜色语义**：按组件类型→语义角色→风格预设查表，不硬编码色值——
  - 内部服务/应用 → role: service
  - 数据库/存储 → role: database
  - 消息队列/缓存 → role: queue
  - 防火墙/安全 → role: error
  - 负载均衡/网关 → role: gateway
  - 网络设备 → role: external
  - **查表方式**：读所选风格 JSON → 查 `roles` 字段找 palette 槽位 → 查 `palette` 字段取 fillColor/strokeColor
- **区域标注**：每个区域容器上方标注区域名（如 "DMZ — Edge Layer"、"Application Layer"、"Data Layer"），使用 fontStyle=1 加粗。
- **边规范**：边使用正交路由（edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;），箭头用 block（endArrow=block;endFill=1;strokeWidth=2;）。跨区域链路用实线，VPN/专线用虚线（dashed=1;dashPattern=8 4;）。至少一个防火墙节点位于外部和内部区域之间。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。
- **Z 序**：边在组件下面渲染（边的 id 编号小于顶点）。区域边界容器为透明（fillColor=none;pointerEvents=0;）。