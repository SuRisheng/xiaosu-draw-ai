# Network Topology Diagram

## What This Is

A diagram showing network devices, connections, and network zone partitioning. Best for network architecture design, data center planning, and security audits.

## When to Use

- Enterprise network architecture design
- Data center network planning
- Security zone design and firewall policies
- Branch office VPN interconnection
- Network equipment deployment planning

## How to Describe Your System

1. **How large is the network? What zones exist?**
   e.g., "HQ + two branch offices", "AWS VPC + on-premise data center"

2. **What network devices and zones are involved?**
   e.g., Internet → Firewall → Core Switch → Access Switches → Servers/Offices
   - Security: Firewall, WAF, IDS/IPS
   - Network: Core switch, Router, Load Balancer
   - Compute: Physical servers, VMs
   - Storage: NAS, SAN

3. **How are devices connected?**
   e.g., "Firewall connects Internet and core switch", "Core switch connects access switches via fiber"

4. **Any special annotations?**
   e.g., "Label IP ranges/VLAN IDs", "Use different colors for production/office/management networks"

## Examples

### Example 1: Small Business Network

> Draw a small business office network topology. Internet → Firewall → Core Switch. Core switch connects: Office area (50 PCs), Server area (Web + DB + File server), Wireless AP area.

### Example 2: Data Center Network

> Draw a data center network topology.
> External: Internet, Direct Connect to branch offices
> Perimeter: Dual firewalls (HA), Load balancer (F5)
> Core: Two core switches (stacked)
> Access: Web tier, App tier, DB tier, Storage tier (SAN)
> Management: Out-of-band management network, Log audit

## Constraints (AI must follow)

- **布局方向**：从左到右或从上到下经过安全区域。区域之间间距 ≥ 120px，区域内设备间距 ≥ 40px。页面边距 ≥ 40px。
- **形状规范**：
  - 路由器/交换机/防火墙：六边形（shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;）
  - 服务器/计算节点：圆角矩形（rounded=1;whiteSpace=wrap;html=1;）
  - 存储/NAS：圆柱体（shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;）
  - 互联网/云/WAN：云形状（ellipse;shape=cloud;whiteSpace=wrap;html=1;）
  - 网络区域/子网：虚线框（rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor=none;strokeColor=#999999;）
- **颜色语义**：按设备类型→语义角色→风格预设查表，不硬编码色值——
  - 路由器/交换机/网络设备 → role: external
  - 防火墙/安全设备 → role: error
  - 服务器/计算 → role: service
  - 存储 → role: database
  - **查表方式**：读所选风格 JSON → 查 `roles` 字段找 palette 槽位 → 查 `palette` 字段取 fillColor/strokeColor
- **边规范**：网络链路用直线（edgeStyle=none;rounded=0;），加粗（strokeWidth=2;），无箭头或 block 箭头。VPN/专线用虚线（dashed=1;dashPattern=8 4;）。至少一个防火墙节点位于外部（互联网）和内部区域之间。
- **标注**：节点标注设备名或 IP 地址（fontSize=11），区域容器标注子网/VLAN ID（如 "192.168.1.0/24"、"VLAN 10"）。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。
- **图例**：右上角添加连接类型图例（千兆光纤/百兆以太网/VPN 隧道）。