# 数据流图（Data Flow Diagram）

## 这是什么图

展示数据从外部实体流入系统、经过处理过程、最终流向数据存储或外部实体的全过程。适合描述数据管道、ETL 流程、系统集成数据流。

## 适用场景

- 数据管道/ETL 流程设计
- 系统间数据集成分析
- 数据仓库建模
- 报表系统数据流向
- API 数据交换流程

## 你怎么描述

1. **数据从哪里来？到哪里去？**
   比如："从业务数据库 MySQL 抽取，经过清洗转换，加载到数据仓库 ClickHouse"

2. **有哪些处理过程？**
   比如：
   1. 数据抽取：从 MySQL 读取昨天的订单数据
   2. 数据清洗：去除重复、填充空值、格式转换
   3. 数据聚合：按小时/天计算订单金额、商品销量
   4. 数据加载：写入 ClickHouse 数据仓库

3. **涉及哪些外部实体和数据存储？**
   外部实体：业务系统、第三方 API、用户上传
   数据存储：MySQL、Redis、Elasticsearch、ClickHouse、OSS

4. **数据流的格式是什么？**
   比如："JSON 格式通过 REST API"、"CSV 文件通过 SFTP"、"binlog 实时同步"

## 示例

### 示例1：简单报表数据流

> 画一个电商报表系统的数据流图。外部实体是"业务数据库 MySQL"。数据经过 ETL 过程（抽取→清洗→聚合），加载到"数据仓库 ClickHouse"。BI 工具（外部实体）从 ClickHouse 查询数据展示报表。

### 示例2：实时数据管道

> 画一个用户行为分析的实时数据管道。
> 外部实体：Web 前端（埋点 SDK）、移动 App（埋点）
> 数据流入：Kafka 消息队列（原始事件）
> 处理过程：Flink 实时计算（清洗→去重→会话窗口聚合→用户画像更新）
> 数据存储：Redis（实时指标）、ClickHouse（历史数据）、HDFS（原始日志）
> 数据流出：Grafana（实时大盘）、推荐系统（用户画像）

## 约束（AI 生成时必须遵守）

- **布局方向**：从上到下或从左到右排列数据流。外部实体放在图边缘（上/左），处理过程放中央，数据存储放底部（或右侧）。实体到过程间距 ≥ 120px，过程到过程间距 ≥ 100px，过程到存储间距 ≥ 120px。
- **形状规范**：
  - 外部实体：椭圆（ellipse;whiteSpace=wrap;html=1;）
  - 处理过程：圆角矩形（rounded=1;whiteSpace=wrap;html=1;）
  - 数据存储：文档形状（shape=document;whiteSpace=wrap;html=1;boundedLbl=1;）或圆柱体（shape=cylinder3;...）
- **颜色语义**：按实体类型→语义角色→风格预设查表，不硬编码色值——
  - 外部实体 → role: queue
  - 处理过程 → role: service
  - 数据存储 → role: database
  - 异常/错误流 → role: error
  - **查表方式**：读所选风格 JSON → 查 `roles` 字段找 palette 槽位 → 查 `palette` 字段取 fillColor/strokeColor
- **边规范**：边使用正交路由（edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;），箭头用 block（endArrow=block;endFill=1;）。每条边必须有 label（标注数据内容），边标签添加 labelBackgroundColor=#FFFFFF。
- **完整性约束**：每个处理过程至少有一条输入边和一条输出边。数据存储至少有一条读边和一条写边。避免数据流线交叉，使用 waypoints 做清晰路由（层间保留 80px 宽走线通道）。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。
