# Data Flow Diagram (DFD)

## What This Is

A diagram showing how data flows from external entities into a system, through processing steps, and ultimately to data stores or external entities. Best for data pipelines, ETL processes, and system integration data flows.

## When to Use

- Data pipeline / ETL process design
- System integration data flow analysis
- Data warehouse modeling
- Reporting system data flows
- API data exchange flows

## How to Describe Your System

1. **Where does data come from and where does it go?**
   e.g., "Extracted from MySQL business database, cleaned and transformed, loaded into ClickHouse data warehouse"

2. **What are the processing steps?**
   e.g.:
   1. Extract: Read yesterday's order data from MySQL
   2. Clean: Remove duplicates, fill nulls, format conversion
   3. Aggregate: Compute hourly/daily order amounts and product sales
   4. Load: Write to ClickHouse data warehouse

3. **What external entities and data stores are involved?**
   External entities: Business systems, third-party APIs, user uploads
   Data stores: MySQL, Redis, Elasticsearch, ClickHouse, S3/OSS

4. **What format is the data in?**
   e.g., "JSON via REST API", "CSV files via SFTP", "binlog real-time sync"

## Examples

### Example 1: Simple Report Data Flow

> Draw a data flow diagram for an e-commerce reporting system. External entity is "MySQL Business Database". Data flows through ETL process (Extract → Clean → Aggregate), loaded into "ClickHouse Data Warehouse". BI tool (external entity) queries ClickHouse to render reports.

### Example 2: Real-Time Data Pipeline

> Draw a real-time user behavior analytics data pipeline.
> External entities: Web Frontend (tracking SDK), Mobile App (tracking)
> Data inflow: Kafka (raw events)
> Processing: Flink streaming (clean → dedup → session windows → user profile updates)
> Data stores: Redis (real-time metrics), ClickHouse (historical data), HDFS (raw logs)
> Data outflow: Grafana (real-time dashboard), Recommendation System (user profiles)

## Constraints (AI must follow)

- **布局方向**：从上到下或从左到右排列数据流。外部实体放在图边缘（上/左），处理过程放中央，数据存储放底部（或右侧）。实体到过程间距 ≥ 120px，过程到过程间距 ≥ 100px，过程到存储间距 ≥ 120px。
- **形状规范**：
  - 外部实体：椭圆（ellipse;whiteSpace=wrap;html=1;）
  - 处理过程：圆角矩形（rounded=1;whiteSpace=wrap;html=1;）
  - 数据存储：文档形状（shape=document;whiteSpace=wrap;html=1;boundedLbl=1;）或圆柱体（shape=cylinder3;...）
- **颜色语义**：
  - 外部实体：黄色（fillColor=#fff2cc, strokeColor=#d6b656）
  - 处理过程：蓝色（fillColor=#dae8fc, strokeColor=#6c8ebf）
  - 数据存储：绿色（fillColor=#d5e8d4, strokeColor=#82b366）
  - 异常/错误流：红色（fillColor=#f8cecc, strokeColor=#b85450）
- **边规范**：边使用正交路由（edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;），箭头用 block（endArrow=block;endFill=1;）。每条边必须有 label（标注数据内容），边标签添加 labelBackgroundColor=#FFFFFF。
- **完整性约束**：每个处理过程至少有一条输入边和一条输出边。数据存储至少有一条读边和一条写边。避免数据流线交叉，使用 waypoints 做清晰路由（层间保留 80px 宽走线通道）。
- **坐标对齐**：所有坐标必须是 10px 的整数倍。