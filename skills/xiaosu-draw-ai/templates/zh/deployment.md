# 部署架构图（Deployment Diagram）

## 这是什么图

展示系统的物理部署拓扑、网络区域划分、服务器节点和基础设施组件。适合描述云架构、机房部署、混合云/多云架构。

## 适用场景

- 云基础设施架构设计（AWS/阿里云/腾讯云）
- 机房物理部署拓扑
- 安全区域划分与防火墙策略
- 混合云/多云架构规划
- 灾备与高可用架构

## 你怎么描述

1. **系统部署在哪里？**
   比如："部署在阿里云 ACK（Kubernetes）"、"自建机房 + AWS 混合云"

2. **有哪些网络区域？**
   比如：互联网 → 防火墙 → DMZ（堡垒机/Nginx）→ 内网（应用服务器）→ 数据区（MySQL/Redis）

3. **每个区域有哪些节点/服务？**
   比如："DMZ 区有 Nginx 反向代理和堡垒机"、"内网区有 3 台应用服务器"

4. **节点之间怎么通信？**
   比如："互联网通过防火墙访问 DMZ 的 Nginx"、"应用服务器通过内网访问数据库"

## 示例

### 示例1：简单云部署

> 画一个 Web 应用的阿里云部署架构图。用户通过 CDN 和 SLB 负载均衡访问。应用部署在 ECS 上，数据库用 RDS MySQL，缓存用 Redis，静态文件存在 OSS。

### 示例2：详细混合云

> 画一个金融系统的混合云部署架构图。
> 总部机房：核心数据库（Oracle RAC）、文件服务器
> 阿里云 VPC：Web 层（2 台 ECS + SLB）、应用层（4 台 ECS）、缓存层（Redis Cluster）
> 专线连接机房和云 VPC
> DMZ 区：堡垒机、WAF
> 安全区：日志审计、堡垒机

## 约束（AI 生成时必须遵守）

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
