# 网络拓扑图（Network Topology Diagram）

## 这是什么图

展示网络设备、连接关系和网络区域划分。适合网络架构设计、机房规划、安全审计。

## 适用场景

- 企业网络架构设计
- 数据中心网络规划
- 安全区域划分与防火墙策略
- 分支机构 VPN 互联
- 网络设备上架规划

## 你怎么描述

1. **网络规模多大？覆盖哪些区域？**
   比如："公司总部 + 两个分支办公室"、"阿里云 VPC + 自建机房"

2. **有哪些网络设备和区域？**
   比如：互联网 → 防火墙 → 核心交换机 → 接入层交换机 → 服务器/办公区
   - 安全设备：防火墙、WAF、IDS/IPS
   - 网络设备：核心交换机、路由器、负载均衡
   - 计算设备：物理服务器、虚拟机
   - 存储设备：NAS、SAN

3. **设备之间怎么连接？**
   比如："防火墙连接互联网和核心交换机"、"核心交换机通过千兆光纤连接各接入层"

4. **有没有特殊标注？**
   比如："标注 IP 地址段/VLAN ID"、"用不同颜色区分生产网/办公网/管理网"

## 示例

### 示例1：中小企业网络

> 画一个中小企业办公网络拓扑图。互联网 → 防火墙 → 核心交换机。核心交换机连接：办公区（50 台 PC）、服务器区（Web 服务器 + 数据库服务器 + 文件服务器）、无线 AP 区。

### 示例2：数据中心网络

> 画一个数据中心网络拓扑图。
> 外部：互联网、专线到分支机构
> 边界：双防火墙（HA）、负载均衡（F5）
> 核心：两台核心交换机（堆叠）
> 接入：Web 区、应用区、数据库区、存储区（SAN）
> 管理：带外管理网、日志审计

## 约束（AI 生成时必须遵守）

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
