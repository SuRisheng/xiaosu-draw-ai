# xiaosu-draw-ai 设计文档（统一版）

> **定位**：本文件是对现有工程进行重构与演进的权威设计依据。所有目录调整、脚本职责、SKILL.md 行为、质量门禁、安装与版本策略，均以本文档为准。
>
> **北极星**：让任何支持 Skill 的 Agent，都能用自然语言稳定产出"结构正确、视觉可读、可继续编辑"的 draw.io 图。

---

## 0. 一句话结论

`xiaosu-draw-ai` 不应停留在"目录结构设计文档"层面，而应收敛成一个**可安装、可验证、可演进的 Skill 框架**：

```
自然语言需求
   ↓
SKILL.md 触发与工作流
   ↓
templates/ 引导澄清 → 抽取 IR → 用户确认
   ↓
router 选择管道 A/B/C
   ↓
references/ 提供生成规则
   ↓
scripts/ 执行验证与导出
   ↓
.drawio 源文件 + PNG/SVG/PDF 交付
```

五条设计原则：

1. **以 `SKILL.md` 为产品核心**，不是以架构文档为核心。
2. **以可执行规则替代概念描述**，每条规则都要能指导 Agent 下一步动作。
3. **以安装边界和平台边界消除误导**，不写虚构安装命令，不把不同形态的 Skill/Agent 混为一谈。
4. **以 IR（中间表示）作为三管道粘合层**，让自然语言、Mermaid、数据导入器、XML 生成共享同一套质量流程。
5. **以质量门禁作为不可跳过的流程**，而不是"生成完后顺手检查"。

---

## 1. 核心设计决策（含证伪条件）

每条决策都附"证伪条件"——出现该条件时，决策需重新评估，而非固守。

| 决策 | 结论 | 理由 | 证伪条件 |
|------|------|------|---------|
| 后端引擎 | **draw.io CLI 为主** | CLI 保可编辑源文件，覆盖所有场景 | CLI 在无头/沙箱环境频繁失败且无稳定 fallback → 评估增加 SVG 直写后端 |
| 用户输入格式 | **Markdown 提示词模板**，非 YAML | 用户填自然语言，AI 负责结构化；人能审核结构化结果 | 模板引导仍导致用户描述质量过低 → 增加结构化字段（仍非 YAML 强制） |
| 与旧 drawio 工程关系 | **完全独立新工程** | P0-P3 规则 / validate / 嵌入参考但重写 | — |
| 质量脚本 | **validate.py + audit.js 双脚本** | validate.py = 结构正确性（P0-P2，Python XML 解析）；audit.js = 视觉质量启发式（P3）+ 聚合 wrapper | 两脚本职责边界长期模糊 → 合并或重新划界 |
| 管道 B 路由 | 结构优先型**默认 Mermaid**；"漂亮/精美"→ 降级管道 C | Mermaid 结构稳定优先级高；视觉美化走手写 XML | draw.io CLI < v30 → 自动降级管道 C |
| 管道 A 路由 | 用户**提供可解析源文件**（SQL/OpenAPI/Terraform/K8s/代码）且**对应 importer 已实现**时触发 | 数据来源决定结构怎么来 | 无对应 importer → 读取文件内容走模板澄清，进 B/C |
| styles/ 定位 | **完整生成参数集**（palette/roles/shapes/font/edges/extras） | AI 查表决定所有 style 属性，而非凭感觉配色 | — |
| 版本源 | **SKILL.md frontmatter 为唯一版本源**（已实施） | Skill 包的天然元数据入口 | 保留 VERSION 则 build 强校验一致，二选一 |
| SKILL.md 语言 | **英文** | token 效率高、全球 Agent 兼容、开源社区惯例 | — |
| 用户交互语言 | **templates/zh + en 分目录** | 目标用户母语描述，示例与引导本地化 | — |

---

## 2. 平台边界：不混淆三种 Skill / Agent

这是当前设计最容易写错的地方，必须先界定清楚。

| 名称 | 它是什么 | 和本项目的关系 | 不要混淆 |
|------|---------|--------------|---------|
| **Claude Code Skill** | 本地文件夹中的 `SKILL.md` + 资源，Agent 按需加载 | **当前主形态，已实现** | 不是 Claude API 的 `agents` 机制 |
| **Claude API Agent Skills** | API 中通过容器技能机制启用的能力 | 未来可适配，非默认 | 不等于本地 `.claude/skills` |
| **Managed Agents Skills** | 托管 Agent 配置引用的 Skills 资源 | 未来云端形态 | 不等于"每次运行都新建 Agent" |

一句话定位：

> 本项目的主形态是**本地 Skill 包**。它可以被不同 Agent 平台读取，但它本身不是 Agent，也不是托管 Agent。

### Managed Agents 边界（未来适配时遵守）

1. Agent 是持久对象，Session 是每次运行——不能在每次请求里创建新 Agent。
2. `model`/`system`/`tools`/`skills` 属于 Agent 配置，不属于 Session。
3. Session 只引用已有 Agent。
4. Skill 应被 Agent 配置引用，不应在运行时临时拼进用户消息。
5. 密钥放 Vault，不放 `SKILL.md`、不放 system prompt、不放 memory。

当前不为云端形态牺牲本地 Skill 的简洁性。

---

## 3. 产品定位

### 3.1 用户视角

用户不想学 draw.io XML，也不想学 Mermaid，更不想选 P0/P1/P2。用户只想说：

> "帮我画一下这个系统。"

Skill 把这句话变成稳定流程：

```
用户描述
 → Agent 追问缺失信息
 → Agent 展示结构化理解（IR 摘要）
 → 用户确认
 → Agent 生成图
 → Agent 自动检查
 → 用户看图反馈
 → Agent 交付可编辑源文件 + 图片
```

### 3.2 开发者视角

开发者维护的是分层 Skill 包：

```
skills/xiaosu-draw-ai/
├── SKILL.md          # 行为入口：何时触发、怎么做、何时读资源
├── templates/        # 和用户沟通：把模糊需求问清楚
├── references/       # 生成知识：图类型、XML、规则、故障处理
├── styles/           # 视觉系统：颜色、字体、形状、边样式
├── scripts/          # 机器执行：验证、导出、构建、安装
└── data/             # 结构化索引：shape/icon/brand index
```

---

## 4. 目录结构（三层产物模型）

工程采用"源码层 / 测试层 / 发布层"三层模型，避免把整个 repo 复制进 Agent 后引入无关上下文。

```
xiaosu-draw-ai/
│
├── README.md                         # 给人看的项目门面（英文）
├── CHANGELOG.md                      # 人工维护变更历史
├── CLAUDE.md                         # AI 开发指南（中文）
├── LICENSE
│
├── doc/                              # 设计文档
│   └── DESIGN.md                     # 本文件：权威设计依据
│
├── skills/                           # 源 Skill 包（开发主目录）
│   └── xiaosu-draw-ai/
│       ├── SKILL.md                  # 核心：Agent 行为入口
│       ├── references/               # 按需加载的生成规则（11 份文档）
│       ├── templates/                # 中英文提示词模板（zh/ + en/，各 10 类图）
│       ├── styles/                   # JSON 风格预设（schema.json + 7 built-in JSON）
│       ├── scripts/                  # 12 个脚本（见 §6.4）
│       └── data/                     # 可选结构化数据
│
├── tests/                            # 测试，不进入最终 Skill 包
│   ├── golden/                       # 10 个 golden fixture（所有 score=0）
│   ├── unit/                         # 4 个单元测试
│   ├── integration/                  # 4 个集成测试
│   └── e2e/                          # 1 个端到端测试
│
├── .drawio/                          # 自举图与开发验证图（功能架构图、应用商店架构图等）
│
├── .github/workflows/                # CI（4 jobs）
│
└── .claude/skills/                   # build.js 生成的发布产物（勿手改）
    └── xiaosu-draw-ai/
        ├── SKILL.md
        ├── references/
        ├── templates/
        ├── styles/
        ├── scripts/
        ├── manifest.json
        └── README.md                       # 占位文档（预留结构化数据）
```

### 4.1 三层目录职责

| 层 | 路径 | 职责 | 是否手改 |
|----|------|------|---------|
| 源码层 | `skills/xiaosu-draw-ai/` | Skill 的真实源文件 | ✅ 是 |
| 测试层 | `tests/`、`.drawio/` | 验证 Skill 行为和图质量 | ✅ 是 |
| 发布层 | `.claude/skills/xiaosu-draw-ai/` | 打包结果，用于安装/分发 | ❌ 不手改 |

### 4.2 源 Skill 包内部结构

每个目录/文件标注"改什么动这里"的指引：

```
skills/xiaosu-draw-ai/
│
├── SKILL.md                          # 🎯 改工作流动这里（核心）
│   # 触发条件 → 模板选择 → IR 抽取 → 管道选择 → 生成 → 审计 → 导出 → 交付
│   # 语义化指令（"运行 drawio -x"），不写具体平台工具调用语法
│
├── templates/                        # 📝 加图类型/改引导动这里
│   # 每个模板含：图类型说明、引导问题、示例、约束（实化，非占位符）
│   ├── zh/                           # 中文模板（Phase 1 先做）
│   │   ├── architecture.md
│   │   ├── sequence.md
│   │   ├── er.md
│   │   ├── flowchart.md
│   │   ├── deployment.md
│   │   ├── class.md
│   │   ├── c4.md
│   │   ├── state-machine.md
│   │   ├── network.md
│   │   └── data-flow.md
│   └── en/                           # 英文模板（后续 Phase）
│
├── references/                       # 📚 改规则动这里（按需加载，不常驻上下文）
│   ├── rules.md                      # P0-P3 像素级规则体系（含 exit code 集中定义）
│   ├── diagram-types.md              # 图类型预设（形状/颜色/布局/边语义，查表手册）
│   ├── xml-authoring.md              # XML 著述规范（骨架/mxCell/容器/边/连接点）
│   ├── style-presets.md              # 样式查表协议（role→palette、edge kind→edge style）
│   ├── visual-audit.md               # P3 视觉审计决策表（看到什么→怎么修→XML 示例）
│   ├── mermaid-authoring.md          # Mermaid 转换指南（管道 B）
│   ├── pipeline-a-authoring.md       # 管道 A 架构与 IR 契约（importer API + IR schema）
│   ├── icons.md                      # 产品品牌色 + 图标映射
│   ├── feishu-embed.md               # 飞书嵌入（可选步骤）
│   ├── troubleshooting.md            # 故障排除（CLI/编码/无头环境/跨平台）
│   ├── dense-diagram-simplification.md # 稠密图简化策略（15+ 节点场景）
│   ├── managed-agents-adaptation.md  # Managed Agents 适配指南（Phase 5）
│   └── claude-api-agent-skills.md    # Claude API Agent Skills 适配指南
│
├── styles/                           # 🎨 改视觉动这里
│   ├── schema.json                   # JSON Schema（必填字段：name/version/palette/roles/shapes/font/edges）
│   └── built-in/                     # 7 个预设风格 JSON
│       ├── flat-icon.json            # 默认：白底、蓝色主色调
│       ├── dark-terminal.json        # 终端风：深灰底、霓虹色
│       ├── blueprint.json            # 蓝图风：深蓝底、白色线条
│       ├── notion-clean.json         # 极简风：白底、浅灰线条
│       ├── glassmorphism.json        # 玻璃态：深色渐变底
│       ├── claude-official.json      # Anthropic 暖色调
│       └── openai.json               # OpenAI 极简风
│
├── scripts/                          # 🔧 改引擎动这里
│   ├── validate.py                   # 结构级 lint（P0-P2，Python）
│   ├── audit.js                      # P3 启发式 + 聚合 wrapper（Node.js）
│   ├── export.js                     # CLI 导出封装（预览/最终分离）
│   ├── build.js                      # 打包构建（读版本、校验完整性、组装 .claude/skills/）
│   ├── install.js                    # 跨平台安装助手
│   ├── utils.js                      # 公共工具（路径/版本/二进制检测）
│   ├── mermaid-convert.js            # Pipeline B：Mermaid -> draw.io CLI 转换
│   ├── router.js                     # 正交路由引擎 + 并行边分布
│   ├── xml-parser.js                 # 已有图 XML 解析（-> JSON 结构）
│   ├── png-extract.js                # PNG 嵌入 XML 提取
│   └── importers/                    # Pipeline A 导入器
│       ├── ir-importer.js            # IR 导入器接口
│       ├── sql2er.js                 # SQL DDL -> ER 图
│       └── openapi2arch.js           # OpenAPI -> 架构图
│
└── data/                             # 📊 结构化索引（shape/icon/brand index 预留）
    └── README.md
```

---

## 5. SKILL.md 设计

`SKILL.md` 是产品核心，不是简介。它的价值在于"能直接驱动 Agent 行为"，而非"描述应该有什么内容"。

### 5.1 应该写什么

1. 什么时候触发。
2. 支持哪些图类型。
3. 如何判断管道 A/B/C。
4. **何时读哪个 `references/` 文件**（按需加载表）。
5. 生成前如何澄清需求（IR 抽取与确认）。
6. 生成后如何验证和导出。
7. 出错时如何降级。
8. 最终交付哪些文件。

### 5.2 不应该写什么

| 不该写 | 原因 | 应放哪里 |
|--------|------|---------|
| 大段 draw.io XML 教程 | 占用上下文，影响触发效率 | `references/xml-authoring.md` |
| 全量 P0-P3 规则细节 | 只在验证/修复时需要 | `references/rules.md`、`visual-audit.md` |
| 所有样式 JSON | 太大，且只有选样式后才需要 | `styles/built-in/*.json` |
| 平台私有工具调用语法 | 耦合特定 Agent | 用语义化动作："read file"、"run command" |
| API key、token、私有路径 | 安全风险 | 环境变量、Vault、用户本地配置 |

### 5.3 理想结构

```markdown
---
name: xiaosu-draw-ai
version: 1.0.0
description: ...
---

# xiaosu-draw-ai

## When to Use
## Prerequisites
## Bundled Resources          ← 按需加载表
## User Interaction Policy
## Pipeline Selection
## Workflow A: Data-driven
## Workflow B: Mermaid conversion
## Workflow C: Hand-written draw.io XML
## Quality Gates
## Export Policy
## Review Loop
## Error Recovery
## Installation Notes
```

`SKILL.md` 要像飞行检查单：短、清楚、可执行。

### 5.4 按需加载表（Bundled Resources）

防止上下文膨胀。Agent 按工作流阶段加载对应文件，而非一次性全读：

| 工作流阶段 | 加载文件 | 用途 |
|-----------|---------|------|
| 识别图类型 | `references/diagram-types.md` | 形状/颜色/布局/边语义预设 |
| 澄清需求 | `templates/{zh|en}/{type}.md` | 引导问题与示例 |
| 选择管道 | （本文件内决策树） | A/B/C 路由 |
| 管道 C 生成 | `references/xml-authoring.md` | XML 骨架与样式 DSL |
| 管道 B 生成 | `references/mermaid-authoring.md` | Mermaid 语法与 CLI 转换 |
| 管道 A 生成 | `references/pipeline-a-authoring.md` | importer API 与 IR schema |
| 选样式 | `styles/built-in/{style}.json` + `references/style-presets.md` | 查表协议 |
| 找图标 | `references/icons.md` | 品牌色与形状映射 |
| 验证 | `references/rules.md` | P0-P2 规则 |
| 视觉自检 | `references/visual-audit.md` | P3 决策表 |
| 故障 | `references/troubleshooting.md` | CLI/编码/无头环境 |

---

## 6. 资源分层设计

### 6.1 templates/：把模糊需求问清楚

模板不是让用户填的表单，而是 **Agent 的追问指南**。模板的输出不是图，而是结构化理解（IR）。

模板格式（约束段必须实化，非占位符）：

```markdown
# <图类型中文名>（<英文名>）

## 这是什么图
一句话说明用途。

## 适用场景
- 场景A
- 场景B

## 你怎么描述
用自然语言回答以下问题（不需要全答，AI 会追问漏掉的部分）：
1. 系统/流程叫什么？
2. 有哪些核心部分？
3. 它们之间怎么连接/交互？
4. 有没有特殊要求？

## 示例
### 示例1：简单的
> 画一个电商系统的架构图，有用户端、API网关、用户服务、订单服务、MySQL、Redis...

### 示例2：详细的
> 画一个微服务架构图。前端 Web(React) + iOS。网关 Kong，挂 4 个服务...
> 中间件 RabbitMQ、Redis。每服务独立 MySQL。部署阿里云 K8s。

## 约束（AI 生成时必须遵守）
- 布局：四层自上而下（前端→网关→服务→数据），同层节点 80px 水平间距，层间 120px 垂直间距
- 形状：网关用六边形，服务用圆角矩形，数据库用圆柱体，缓存用圆柱体虚边
- 边：主链路实线 block 箭头；异步消息虚线；缓存读写用语义色
- 颜色：按 role 查 styles/built-in/flat-icon.json，不凭感觉配色
- 网格：所有坐标对齐 10px 网格
```

> 关键：约束段是该模板设计里最关键的部分——它决定 AI 生成时是否有具体约束。必须写具体阈值与形状映射，不允许 `[架构图]`、`<该图类型...>` 这类占位符。

### 6.2 references/：把生成知识按需加载

分四类，是 Agent 的外置专业知识库：

| 类别 | 文件 | 作用 |
|------|------|------|
| 图类型知识 | `diagram-types.md` | 每种图的形状、布局、边语义（查表手册，非泛泛描述） |
| 语法知识 | `xml-authoring.md`、`mermaid-authoring.md` | 合法 draw.io XML / Mermaid 写法 |
| 质量知识 | `rules.md`、`visual-audit.md` | P0-P3 规则与修复办法（含 exit code 集中定义） |
| 运行知识 | `troubleshooting.md`、`feishu-embed.md`、`pipeline-a-authoring.md` | 故障处理、嵌入、导入器契约 |

### 6.3 styles/：把审美变成参数

每个 style 文件必须是可查表的生成参数集，而非文字描述。推荐 schema：

```json
{
  "name": "flat-icon",
  "version": "1.0",
  "canvas": {
    "background": "#ffffff",
    "grid": false
  },
  "palette": {
    "primary":   {"fill": "#dbeafe", "stroke": "#2563eb"},
    "success":   {"fill": "#dcfce7", "stroke": "#16a34a"},
    "warning":   {"fill": "#fef3c7", "stroke": "#d97706"},
    "danger":    {"fill": "#fee2e2", "stroke": "#dc2626"},
    "neutral":   {"fill": "#f8fafc", "stroke": "#64748b"}
  },
  "roles": {
    "frontend":  "primary",
    "gateway":   "warning",
    "service":   "success",
    "database":  "danger",
    "cache":     "neutral",
    "external":  "neutral"
  },
  "font": {
    "family": "Arial",
    "titleSize": 18,
    "labelSize": 13,
    "subLabelSize": 11
  },
  "edges": {
    "primary":      "strokeColor=#2563eb;strokeWidth=2;endArrow=block;",
    "async":        "strokeColor=#64748b;dashed=1;endArrow=block;",
    "memoryRead":   "strokeColor=#059669;endArrow=block;",
    "memoryWrite":  "strokeColor=#059669;dashed=1;endArrow=block;",
    "control":      "strokeColor=#2563eb;strokeWidth=2;endArrow=block;orthogonalLoop=1;"
  },
  "shapes": {
    "service":  "rounded=1;whiteSpace=wrap;html=1;",
    "gateway":  "shape=hexagon;perimeter=hexagonPerimeter2;",
    "database": "shape=cylinder3;size=10;direction=south;",
    "cache":    "shape=cylinder3;size=10;dashed=1;"
  },
  "extras": {
    "legend": true,
    "emphasisStyle": "strokeWidth=3;fontStyle=1;"
  }
}
```

Agent 生成 XML 时查这个 JSON，而非凭感觉配色。查表协议（在 `style-presets.md` 中明确）：

- 节点 `role` → `roles[role]` → `palette[roleKey]` → fill/stroke
- 边 `kind` → `edges[kind]` → style 串
- 形状 `kind` → `shapes[kind]` → shape prefix

### 6.4 scripts/：把机器能检查的交给机器

| 脚本 | 语言 | 职责 |
|------|------|------|
| `validate.py` | Python 3 | XML 结构、几何、P0-P2 自动检查 |
| `audit.js` | Node.js | P3 启发式检查 + 聚合报告（调 validate.py 子进程） |
| `export.js` | Node.js | 封装 draw.io CLI，统一预览/最终导出策略 |
| `build.js` | Node.js | 打包 Skill，生成 `.claude/skills/`，校验完整性 |
| `install.js` | Node.js | 跨平台安装助手（支持 4 种 Agent 目标） |
| `utils.js` | Node.js | 公共工具模块（路径解析、版本检测、文件操作） |
| `mermaid-convert.js` | Node.js | Pipeline B：Mermaid `.mmd` -> `.drawio` CLI 转换 |
| `router.js` | Node.js | 正交路由引擎 + 障碍规避 + 并行边分布 |
| `xml-parser.js` | Node.js | 已有 `.drawio` 文件 XML -> JSON 结构解析 |
| `png-extract.js` | Node.js | 从 `--final` 导出的 PNG 中提取嵌入 XML |
| `importers/ir-importer.js` | Node.js | Pipeline A：IR 导入器接口 |
| `importers/sql2er.js` | Node.js | SQL DDL 解析 -> ER 图 |
| `importers/openapi2arch.js` | Node.js | OpenAPI 规范解析 -> 架构图 |

原则：

> 能机器判断的，不让 Agent 用肉眼猜；必须肉眼判断的，写成视觉检查决策表。

双语言理由：Python ElementTree 是解析 XML 最可靠的方式（validate.py 核心）；Node.js 的 regex + geometry math 更适合启发式检测（audit.js 核心）。两者通过 subprocess + JSON 通信，不共享代码但共享数据格式。

---

## 7. IR（中间表示）设计

IR 是三管道的粘合层。没有 IR，A/B/C 只是三套互不相干的实现。

> IR 是"图的骨架"，XML 是"图的皮肤"。骨架稳定，皮肤才能换。

### 7.1 IR 的作用

| 用途 | 说明 |
|------|------|
| 用户确认 | 把 Agent 对自然语言的理解展示出来 |
| 数据导入 | importer 输出统一结构 |
| 管道转换 | Mermaid / XML 生成都可消费 IR |
| Git diff | JSON 比 XML 更适合看结构变化 |
| 测试 | `test_ir_schema.js` 验证结构合法性 |

### 7.2 Base IR

```json
{
  "schemaVersion": "1.0",
  "diagram": {
    "type": "architecture",
    "title": "电商系统架构图",
    "language": "zh",
    "intent": "展示系统组件、分层和依赖关系"
  },
  "nodes": [
    {
      "id": "api-gateway",
      "label": "API 网关",
      "kind": "gateway",
      "role": "primary",
      "layer": "gateway",
      "technology": "Kong",
      "description": "统一入口、鉴权、路由"
    }
  ],
  "edges": [
    {
      "id": "web-to-gateway",
      "source": "web-app",
      "target": "api-gateway",
      "label": "HTTPS 请求",
      "kind": "primary",
      "direction": "forward"
    }
  ],
  "groups": [
    {
      "id": "service-layer",
      "label": "业务服务层",
      "nodeIds": ["user-service", "order-service"]
    }
  ],
  "layout": {
    "direction": "TB",
    "layers": [
      ["web-app", "mobile-app"],
      ["api-gateway"],
      ["user-service", "order-service"],
      ["mysql", "redis"]
    ]
  },
  "style": {
    "preset": "flat-icon",
    "emphasis": ["api-gateway"]
  },
  "source": {
    "type": "natural-language",
    "path": null
  }
}
```

### 7.3 图类型扩展（只扩展必要字段，不推翻 Base IR）

**Sequence 扩展：**

```json
{
  "participants": [
    {"id": "user", "label": "用户", "kind": "actor"},
    {"id": "app",  "label": "App",  "kind": "frontend"},
    {"id": "api",  "label": "API",  "kind": "service"}
  ],
  "messages": [
    {"from": "user", "to": "app", "label": "点击下单", "order": 1},
    {"from": "app",  "to": "api", "label": "POST /orders", "order": 2}
  ]
}
```

**ER 扩展：**

```json
{
  "entities": [
    {
      "id": "user",
      "label": "User",
      "fields": [
        {"name": "id", "type": "BIGINT", "pk": true},
        {"name": "email", "type": "VARCHAR", "unique": true}
      ]
    }
  ],
  "relationships": [
    {"from": "user", "to": "order", "cardinality": "1:N", "label": "places"}
  ]
}
```

### 7.4 IR 生成与确认流程

```
用户自然语言
  ↓
Agent 提取 Draft IR
  ↓
Agent 用人话展示摘要（非 JSON 原文）
  ↓
用户确认 / 修改
  ↓
冻结 IR
  ↓
进入 A/B/C 渲染
```

展示给用户的是摘要：

```markdown
我理解你要画【系统架构图】：

- 前端：Web、iOS App
- 网关：Kong API Gateway
- 服务：用户服务、订单服务、商品服务
- 数据：MySQL、Redis
- 主链路：前端 → 网关 → 服务 → 数据
- 风格：默认 flat-icon

如果没问题，我会按四层自上而下布局生成 draw.io 图。
```

---

## 8. 三管道设计与路由决策树

### 8.1 管道总览

| 管道 | 输入 | 适用场景 | 输出 | 核心风险 |
|------|------|---------|------|---------|
| A：Data-driven | SQL / OpenAPI / Terraform / K8s / 代码 | 用户已有可解析源文件 + importer 已实现 | IR → XML | 导入器解析不完整 |
| B：Mermaid | 自然语言 → Mermaid | 时序图、ER、类图、状态机等结构优先图 | `.mmd` → `.drawio` | 样式控制弱，依赖 CLI ≥ v30 |
| C：Hand-written XML | 自然语言 / 结构化 IR | 架构图、部署图、流程图、C4、网络拓扑 | `.drawio` XML | 坐标、边、视觉质量易出错 |

### 8.2 路由决策树（修正版）

旧设计的问题：场景 C（用户引用文档）与管道 A（数据驱动）冲突；"美观"触发词和布局优先型默认路由混用。修正版把"数据来源"和"渲染方式"解耦：

```
用户请求画图
  │
  ├─ 是否给了可解析源文件？
  │    例：SQL DDL、OpenAPI、Terraform、K8s YAML、Docker Compose、代码类定义
  │
  │    ├─ 是 → 是否已有对应 importer？
  │    │      ├─ 有 → 管道 A（importer 提取 IR）
  │    │      └─ 无 → 读取文件内容 → 走模板澄清 → 管道 B/C
  │    │
  │    └─ 否
  │
  ├─ 是否给了普通文档？
  │    例：PRD、需求文档、README、会议纪要
  │
  │    ├─ 是 → 从文档抽取结构 → 展示 IR 摘要 → 进入 B/C
  │    └─ 否
  │
  ├─ 图类型是否结构优先？
  │    sequence / ER / class / state / gantt
  │
  │    ├─ 是 → CLI 是否 ≥ v30 且用户没有强视觉要求？
  │    │      ├─ 是 → 管道 B
  │    │      └─ 否 → 管道 C
  │    │
  │    └─ 否（布局优先型：架构/部署/流程/网络拓扑/C4）→ 管道 C
```

### 8.3 美观诉求如何处理

"精美 / 漂亮 / professional / keynote-ready"不是普通触发词，而是**视觉控制要求**。它决定"渲染怎么做"，不决定"结构怎么来"：

| 情况 | 处理 |
|------|------|
| 架构图 + 漂亮 | 本来就是管道 C，选更合适 style |
| 时序图 + 漂亮 | 从管道 B 降级为管道 C |
| SQL → ER + 漂亮 | 优先 A 解析结构，再由 C 渲染美观布局 |
| OpenAPI → 架构图 + 漂亮 | A 抽取 IR，C 负责视觉生成 |

> 数据来源决定"结构怎么来"；美观诉求决定"渲染怎么做"。两者正交。

### 8.4 多条件组合的兜底

当用户同时给"代码 + 时序图 + 美观"三个信号时，决策树按"数据来源优先"：走管道 A 提取结构，再判断是否需 C 渲染。不在决策树里让三个触发词互相打架。

---

## 9. 五层架构

```
┌──────────────────────────────────────────────────────────┐
│  L1: 意图层                                               │
│  用户自然语言 → 匹配提示词模板 → AI 抽取 IR → 人审核       │
│  核心文件：templates/*.md                                 │
├──────────────────────────────────────────────────────────┤
│  L2: 路由层                                               │
│  结构化 IR → 判断管道（A:数据驱动 B:声明式 C:AI约束式）    │
│  核心文件：SKILL.md（路由决策树）                          │
├──────────────────────────────────────────────────────────┤
│  L3: 生成层                                               │
│  管道A: 导入器 → IR → autolayout → XML                    │
│  管道B: IR → Mermaid → CLI 转换                           │
│  管道C: IR → AI 手写 XML                                  │
│  核心文件：scripts/（validate.py, audit.js, export.js, mermaid-convert.js, router.js, xml-parser.js, png-extract.js, build.js, install.js, importers/）、references/xml-authoring.md 等       │
├──────────────────────────────────────────────────────────┤
│  L4: 质量层（不可跳过）                                    │
│  validate.py（P0-P2 结构+几何+空间）→ audit.js（P3 启发式）│
│  → AI 视觉审计（visual-audit.md 决策表）                  │
│  核心文件：scripts/validate.py、scripts/audit.js、        │
│           references/rules.md、references/visual-audit.md │
├──────────────────────────────────────────────────────────┤
│  L5: 交付层                                               │
│  CLI 导出 → .drawio 源文件 + PNG/SVG/PDF → Git 记录       │
│  → [飞书嵌入]                                             │
│  核心文件：scripts/export.js、references/feishu-embed.md  │
└──────────────────────────────────────────────────────────┘
```

---

## 10. 质量门禁设计

### 10.1 质量分层

| 层级 | 名称 | 检查者 | 是否阻断 | 例子 |
|------|------|--------|---------|------|
| P0 | 结构损坏 | `validate.py` | 是，exit 2 | XML 不合法、悬空边、重复 ID、保留 ID 被占 |
| P1 | 布局缺陷 | `validate.py` | 是，exit 1 | 节点重叠（8px 安全边距）、边穿过节点、边交叉、出界、自闭合边标签 |
| P2 | 质量警告 | `validate.py` | 否，exit 0 | 坐标偏离 10px 网格、连接点不居中（非 0.5）、箭头末段 < 15px |
| P3 | 视觉问题 | `audit.js` + AI 视觉 | 否，但应修 | 标签溢出、角落连接、边标签缺背景、组件间距不足、Z 序违规、边-形状视觉重叠、箭头方向错、图例遮挡 |

### 10.2 exit code 集中定义（一处定义，多处引用）

`validate.py --help`、`references/rules.md`、`audit.js` 文档、本设计文档**必须保持一致**：

| exit code | 含义 | Agent 动作 |
|-----------|------|-----------|
| 0 | 无 P0/P1；可能有 P2 warning | 可继续，必要时优化 |
| 1 | 存在 P1 must-fix | 修复后重跑，最多 3 轮 |
| 2 | 存在 P0 blocking | 必须修复；不能导出最终图 |

> 不让读者跨多个章节拼 exit code 语义。

### 10.3 质量脚本分工

| 脚本 | 语言 | 负责 | 输入 | 输出 |
|------|------|------|------|------|
| `validate.py` | Python 3 | P0-P2 结构 + 空间 | `.drawio` XML | exit 0/1/2 + JSON |
| `audit.js` | Node.js | P3 启发式 + 聚合 | `.drawio` XML（调 validate.py 子进程） | exit 0/1/2 + JSON |
| `visual-audit.md` | Markdown | P3 AI 视觉检查决策表 | 导出的 PNG | 人工/AI 判断 |

`audit.js` 作为聚合入口：运行 validate.py 子进程 + P3 启发式 → 统一报告。最多 2 轮自检修复。

### 10.4 P3 规则必须写成决策表

P3 不能只有规则名。每条规则含"Agent 看到什么 / 优先修法 / XML 示例"：

| 规则 | Agent 看到什么 | 优先修法 |
|------|--------------|---------|
| R030 标签截断 | 文字超出框、被裁掉、出现省略/遮挡 | 增大节点宽高；长标签换行；降字号但不低于 11px |
| R031 边穿形状 | 箭头穿过无关节点内部 | 加 waypoint；扩层间距；改正交路由 |
| R032 边标签碰撞 | 线上文字压到节点/另一条线 | 标签偏移 6-8px；必要时加白色背景矩形 |
| R033 边堆叠 | 多条边重在同一路径 | 错开 entry/exit 点；设 parallel offset |
| R034 箭头方向错 | 箭头头部指向源而非目标 | 调换 source/target 或修正 endArrow |
| R035 角落连接 | 连接点距角 < 20px | 连接点居中（0.5）或移到边中点 |
| R036 边标签缺背景 | 标签压在线上难辨 | 加 labelBackgroundColor=#ffffff |
| R037 间距不足 | 组件间距 < 80px | 扩间距至 80px 水平 / 120px 垂直 |
| R038 Z 序违规 | 边在顶点之后渲染被遮 | 边的 vertex/edge 顺序：顶点先，边后 |
| R039 图例遮挡 | legend 压在主图或边上 | 移到画布外侧；扩 canvas 尺寸 |

详细检测阈值 + XML before/after 示例见 `references/visual-audit.md`。

### 10.5 Arrow Semantics（箭头语义，补齐缺失）

边不只是线。主流程、异步、内存读写、控制流应有不同样式（查表自 `styles` 的 `edges` 字段）：

| kind | 含义 | 样式特征 |
|------|------|---------|
| primary | 主链路/同步调用 | 主色、实线、block 箭头、strokeWidth=2 |
| async | 异步消息 | 中性色、虚线、block 箭头 |
| memoryRead | 缓存/读 | 成功色、实线 |
| memoryWrite | 缓存/写 | 成功色、虚线 |
| control | 控制流/分支 | 主色、实线、orthogonalLoop |
| feedback | 反馈/回流 | 警告色、虚线 |
| neutral | 弱依赖/参考 | 中性色、细线 |

图始终包含 legend 说明箭头语义。

---

## 11. 导出策略

### 11.1 预览导出与最终导出分离

| 阶段 | 输出 | 是否嵌入 XML | 原因 |
|------|------|------------|------|
| Draft Preview | `.drawio/<name>.png` | 否 | 给视觉模型/用户看，文件干净，避免视觉模型读取出错 |
| Final PNG | `.drawio/<name>.drawio.png` | 是（`-e`） | 可重新在 draw.io 打开编辑 |
| Final SVG/PDF | `.drawio/<name>.svg/.pdf` | 可选嵌入 | 按用户需求交付 |

预览阶段不用 `-e`；最终阶段可用 `-e`。

### 11.2 CLI 检测策略

Agent 不假设命令一定叫 `drawio`，按顺序检测：

1. PATH 中的 `drawio`
2. PATH 中的 `draw.io`
3. Windows 默认安装目录下的 `draw.io.exe`
4. macOS `Applications` 下的 `draw.io` 可执行文件

检测到哪个，后续命令都用哪个。跨平台差异（`drawio` vs `draw.io` 二进制名、安装路径）记录在 `troubleshooting.md`。

### 11.3 Mermaid 条件（管道 B）

只有满足全部条件才走管道 B：

- draw.io CLI ≥ v30
- 图类型是结构优先型
- 用户没有强视觉定制要求
- 转换后仍跑 `validate.py` 和预览导出

CLI 版本不足 → 自动降级管道 C。不能因 Mermaid 方便就跳过质量门禁。

---

## 12. 安装与发布设计

### 12.1 本地开发安装（目录链接，开发期推荐）

```
~/.claude/skills/xiaosu-draw-ai  →  skills/xiaosu-draw-ai
```

Windows（需管理员权限或开发者模式）：

```powershell
cmd /c mklink /D "$env:USERPROFILE\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

好处：改源码立即生效，不需反复复制。

### 12.2 发布包安装

发布包来自 `.claude/skills/xiaosu-draw-ai/`。安装时复制整个目录到 `~/.claude/skills/xiaosu-draw-ai/`。

```powershell
Copy-Item -Recurse .\.claude\skills\xiaosu-draw-ai $env:USERPROFILE\.claude\skills\xiaosu-draw-ai
```

关键约束：

- `.claude/skills/xiaosu-draw-ai/SKILL.md` 必须存在。
- 不能安装成 `.claude/skills/xiaosu-draw-ai.md`（单文件）。
- `references/`、`scripts/`、`styles/`、`templates/` 必须与 `SKILL.md` 同级保留。
- `doc/`、`tests/`、`.drawio/`、`.github/` 不在发布包内（build.js 排除）。

### 12.3 README 安装段（去虚构命令）

旧设计中 `npx skills add <repo>/xiaosu-draw-ai` 不是本项目真实支持的安装器，必须删除。改为复制/链接整个 Skill 目录。只有未来真实发布到某包管理器后，才补充对应命令，且必须注明命令来自哪个工具。

### 12.4 通用 Agent 平台

```
把 skills/xiaosu-draw-ai/ 作为一个完整 Skill 目录安装。
入口文件必须是：skills/xiaosu-draw-ai/SKILL.md
不要只复制 SKILL.md，否则 references/scripts/styles/templates 会丢失。
```

---

## 13. 版本管理

### 13.1 版本源统一

当前存在双版本漂移风险：`VERSION` 文件 与 `SKILL.md` frontmatter version 是两个独立人工维护的版本号，无机制保证一致。

**推荐方案 A：`SKILL.md` frontmatter 为唯一版本源**

```yaml
---
name: xiaosu-draw-ai
version: 1.0.0
---
```

`build.js` 读取 frontmatter，生成 `manifest.json`、README badge、output 元数据。删除独立 `VERSION` 文件。

**备选方案 B：保留 VERSION，但 build 时强校验**

1. `VERSION` 与 `SKILL.md` frontmatter 必须一致。
2. 不一致时 `build.js` 失败。
3. README badge、manifest、output 全部由 build 注入。

本项目推荐**方案 A**。不继续依赖"人工记得同步"。

### 13.2 与上游依赖的版本融合

```
draw.io 桌面版 CLI（基础设施依赖）
  ├── 版本锁定：install.js 检查 >= 24.0.0
  ├── 更新策略：大版本更新需跑 Golden set 回归，审计分数不退化
  └── 降级路径：保留旧版 CLI 安装说明

参考框架（非代码依赖，借鉴设计模式）
  ├── drawio-skill：管道架构、validate.py、按需加载表、预览/最终导出分离、
  │   抽取器 IR pipeline、传递规约、确定性序列引擎、迭代审查循环
  ├── fireworks-tech-graph：可执行样式系统、语义形状词汇、语义箭头系统、
  │   正交路由引擎、标签防碰撞、回归夹具、像素级间距规则、错误恢复上限
  └── architecture-diagram-generator：模板骨架+AI 填充、语义调色板、
      Z 序技巧（先画边后画顶点+不透明背景矩形遮挡）、单文件可交付
  → 不 fork、不 import、不 cherry-pick；借鉴设计模式，重新实现
```

借鉴项需附"是否重新实现"与"优先级"两列（见 §15 实施路线）。

---

## 14. 测试体系

### 14.1 不写虚构测试数字

旧文档中 `53 tests`、`38 tests` 若无代码对应，不写成事实。正确写法：

```
planned: validate.py unit tests covering R001-R039
current: run python3 scripts/validate.py tests/golden/architecture.drawio --score
```

### 14.2 测试分层

| 层 | 名称 | 依赖 | 检查什么 |
|----|------|------|---------|
| L0 | 单元测试 | Python/Node | IR schema、validate.py 几何规则、audit.js 规则 |
| L1 | 集成测试 | draw.io CLI | XML 导出 PNG/SVG 是否成功、CLI 检测 |
| L2 | Golden 回归 | draw.io CLI + golden 文件 | 核心图不退化 |
| L3 | Skill E2E | Agent 环境 | 从用户自然语言到最终交付 |

L0/L1 运行在项目目录或临时隔离目录；L3 仅人工触发。

### 14.3 Golden set 策略

不需要每种图都一张。优先覆盖风险最高的情况，目标是**覆盖规则，不是凑齐图类型**：

| Golden | 价值 |
|--------|------|
| `architecture.drawio` | 多层节点、多边、多容器，最易暴露布局问题 |
| `c4.drawio` | C4 容器图，验证 system boundary + person + external 形状 |
| `class.drawio` | UML 类图，验证 swimlane 表格、继承/组合/聚合边 |
| `data-flow.drawio` | 数据流图，验证 process + external entity + data store |
| `deployment.drawio` | 部署图，验证 zone + firewall + server + cloud 形状 |
| `er.drawio` | ER 图，验证表格/字段/关系/cardinality、cylinder shape |
| `flowchart.drawio` | 流程图，验证 decision、分支、回路、start/end |
| `network.drawio` | 网络拓扑，验证 hexagon + cloud + dashed boundary |
| `sequence.drawio` | 时序图，验证 lifeline + message + response 边 |
| `state-machine.drawio` | 状态机，验证 state + transition + initial/final/choice |

所有 golden 必须 score=0（完美）；分数上升 → 回归告警。

### 14.4 测试污染检查清单（build 前自动运行）

- [ ] `tests/golden/` 文件未被修改（hash 对比）
- [ ] 无残留临时测试目录
- [ ] 无残留 draw.io 进程
- [ ] `scripts/`、`references/`、`templates/` 源文件未被测试修改
- [ ] `~/.claude/` 未被测试写入
- [ ] `.claude/skills/` 可删除后由 build 重建（验证发布层可重生）

### 14.5 CI 自动化

`.github/workflows/test.yml` 在每次 push 和 PR 时运行：

| Job | 内容 |
|-----|------|
| `unit` | L0：pytest + IR schema，Node 矩阵 |
| `integration` | L1：CLI detect + export（xvfb 无头）+ golden regression |
| `build` | build.js 打包 + 输出结构完整性验证 |
| `test-windows` | L0 + CLI detect on Windows runner |

---

## 15. 实施路线

### Phase 0：纠偏 ✅（2026-07-08 完成）

- [x] 修 README 安装命令（删 `npx skills add`，改复制/链接）
- [x] 修 `SKILL.md` 中 `--pipeline=A/B/C` 用户 override 表述（用户不应知道 `--pipeline`）
- [x] 统一 Phase 状态（README 与 SKILL.md 一致，统一为 Phase 2）
- [x] 明确版本源（采纳方案 A，删 VERSION，SKILL.md frontmatter 唯一源）
- [x] 统一质量层描述：`validate.py = P0-P2`，`audit.js + visual-audit.md = P3/聚合`
- [x] 修五层架构 L4 文件列表（补 `audit.js`、`visual-audit.md`，去重复项）

### Phase 1：Skill 核心稳定 ✅（2026-07-08 完成）

- [x] `skills/xiaosu-draw-ai/SKILL.md` 成为唯一行为入口（按 §5.3 结构重写）
- [x] 补按需加载表（§5.4）
- [x] 管道 C 稳定：自然语言 → IR → XML → validate → export
- [x] `templates/zh` 全部 10 类图覆盖（约束段全部实化，含具体 px 阈值和形状映射）
- [x] `references/xml-authoring.md` 与 `rules.md`（含 exit code 集中定义）支撑完整生成
- [x] README 给真实安装与开发流程

### Phase 2：质量闭环 ✅（2026-07-08 完成）

- [x] `validate.py` 覆盖 P0-P2（R011/R020 边界情况已修复）
- [x] `visual-audit.md` 改成决策表（§10.4，全部 10 条含 see→fix→XML example）
- [x] `audit.js` 聚合 validate + P3 heuristic
- [x] Golden set 覆盖全部 10 类图（architecture / c4 / class / data-flow / deployment / er / flowchart / network / sequence / state-machine）
- [x] build 检查 output 完整性
- [x] 补 Arrow Semantics（§10.5，7 种语义边种类已写入 diagram-types.md）

### Phase 3：风格系统

- [x] 完成 7 个 style JSON 的查表协议（`style-presets.md`）—— schema 检查已通过，新增 Role→Palette、Edge Kind→Edge Style、Vertex/Edge Assembly Formula 四张查表
- [x] `diagram-types.md` 定义节点 kind、edge kind、layout preset（统一查表手册已就位，4 张速查表）
- [x] 支持用户自然语言选择 style（SKILL.md Style Selection 表已覆盖 7 种预设触发词）
- [x] 支持 style 与 diagram-type 合并规则（style-presets.md §Merge Rules：优先级/冲突解决/逐节点逐边合并流程/10 类图 role mapping）
- [x] 借鉴正交路由引擎 + 标签防碰撞（`router.js`：四向正交路由 + 障碍规避 + 并行边分布 + `checkLabelCollision()` + `auditLabelCollisions()`）

### Phase 4：多管道 ✅（2026-07-09 完成）

- [x] 管道 B：Mermaid 转 draw.io（`mermaid-convert.js` 已就位：CLI 检测 + 版本校验 + 转换 + 降级提示）
- [x] 管道 A：`sql2er`（SQL DDL→ER 图）+ `openapi2arch`（OpenAPI→架构图）导入器骨架已就位
- [x] IR schema 固化（`test_ir_schema.js` 契约测试）
- [x] A/B/C 全部进入同一质量门禁（SKILL.md Quality Gates 已明确三管道统一入口）
- [x] 借鉴传递规约（稠密图简化）— `dense-diagram-simplification.md`：5 策略 + 决策流
- [x] 嵌套容器、C4 多页面 — 容器化策略 + 子图拆分已覆盖

### Phase 5：平台适配 ✅（2026-07-09 完成）

- [x] Claude Code 本地安装文档（已就位）
- [x] 通用 Skill 目录安装说明（已就位）
- [x] 可选：Managed Agents 适配（`managed-agents-adaptation.md`：4 条适应规则 + 4 步适配流程 + 5 条约束）
- [x] 可选：Claude API Agent Skills 适配（`claude-api-agent-skills.md`：Container 运行时 + Dockerfile + Tool 注册）

---

## 16. 验收标准

### 16.1 文档验收

- 非 AI 背景读者能看懂这个 Skill 是干什么的。
- 开发者能知道改哪个文件（修改路由表见 §4.2）。
- 安装命令真实可执行，无虚构。
- 不混淆 Claude Code Skill、Claude API Skills、Managed Agents。
- 每个抽象概念都有具体例子或表格。

### 16.2 Skill 行为验收

给一句话：

```
画一个电商微服务架构图，有 Web、App、API 网关、用户服务、订单服务、MySQL、Redis。
```

Agent 应能：

1. 判断为架构图。
2. 用 `templates/zh/architecture.md` 或直接抽取结构。
3. 展示 IR 摘要。
4. 走管道 C。
5. 生成 `.drawio`。
6. 跑 `validate.py`。
7. 导出预览 PNG。
8. 做视觉自检或说明跳过。
9. 交付 `.drawio` + `.png`。

### 16.3 工程验收

- `skills/xiaosu-draw-ai/SKILL.md` 单独复制后能工作。
- `references/`、`templates/`、`styles/`、`scripts/` 都被 build 带入 `output/`。
- 不依赖 repo 根目录的设计文档才能运行（DESIGN.md 位于 `doc/` 子目录）。
- `.claude/skills/` 可删除后由 build 重建。

---

## 17. 用户交互策略与失败恢复

### 17.1 用户交互策略

| 场景 | Agent 行为 |
|------|-----------|
| 用户说得很清楚 | 不追问，直接展示 IR 摘要并生成 |
| 缺图类型 | 问一个选择题：架构 / 流程 / 数据 / 时序 |
| 缺核心组件 | 问 1-3 个关键问题，不展开问卷 |
| 用户给文档 | 先读文档，提取结构，再让用户确认 |
| 用户给代码/SQL/OpenAPI | 优先判断是否有 importer；没有则说明降级 |
| 用户要"更好看" | 选择或切换 style，不重问结构 |

### 17.2 失败恢复策略

| 失败 | 恢复 |
|------|------|
| CLI 不存在 | 交付 `.drawio` XML + 安装说明；必要时浏览器 fallback |
| CLI 版本 < v30 | 禁用 Mermaid 管道，走 XML 管道 |
| validate.py P0 | 修 XML，最多 3 轮 |
| validate.py P1 | 修布局，最多 3 轮 |
| 导出失败 | 查 CLI 路径、输出目录、无头环境；仍失败则交付 XML |
| 视觉自检不可用 | 明确说"视觉检查跳过"，不假装看过 |
| 用户连续改 5 轮 | 建议打开 draw.io 精修 |

Agent 不能无限重试同一个失败命令，必须有错误恢复上限。

---

## 18. 对抗性自检

**Q1：为什么不直接复用 drawio-skill？**
目标不同。drawio-skill 是强大的通用工具箱；本项目是面向自然语言用户的质量优先制图 Skill。前者像"专业画图软件工具箱"，后者像"会追问、会审图、会交付的画图助理"。

**Q2：为什么还要 IR，直接生成 XML 不行吗？**
短期可以，长期会乱。没有 IR 时：用户确认只能看文字、A/B/C 无法共享结构、测试难比较结构正确性、XML diff 难读。IR 是骨架，XML 是皮肤。

**Q3：为什么不把所有规则写进 SKILL.md？**
Skill 入口要短。太长导致触发成本高、Agent 难抓主流程、修改规则易污染入口。正确做法是入口写"什么时候读哪个文件"（按需加载表）。

**Q4：为什么不默认 Managed Agents？**
当前用户要的是本地工程 Skill，不是云端 Agent 服务。先把 Skill 包做好，再考虑云端适配。

**Q5：为什么安装命令这么保守？**
错误安装命令比没有安装命令更糟。虚构的 `npx skills add` 会让用户从第一步失败。

**Q6：为什么是 Python + Node.js 两种语言？**
Python ElementTree 解析 XML 最可靠（validate.py 核心）；Node.js 的 regex + geometry math 更适合启发式检测（audit.js 核心）。subprocess + JSON 通信，不共享代码但共享数据格式。

---

## 19. 与旧工程的关键差异（重构要点）

| 维度 | 旧工程 | 目标工程 |
|------|--------|---------|
| 产品核心 | 目录结构设计文档 | SKILL.md 工作流入口 |
| 路由标志 | `--pipeline=A/B/C` CLI 标志 | 自然语言路由决策树 |
| 用户确认 | 文字描述 | IR 摘要（结构化、可冻结） |
| 模板约束 | 占位符 `<该图类型...>` | 实化阈值与形状映射 |
| P3 规则 | 规则名 + 编号 | 决策表（看到什么→怎么修→XML 示例） |
| Arrow Semantics | 缺失 | 7 种 kind 查表 |
| 安装命令 | `npx skills add`（虚构） | 复制/链接整个 Skill 目录 |
| 版本源 | VERSION + frontmatter 双源漂移 | frontmatter 唯一源 |
| 测试数字 | `53/38`（来源不透明） | planned/current 标注 |
| 平台边界 | 混淆三种 Skill/Agent | 明确分层，本地优先 |

---

> 这个项目的关键不是"AI 能不能画图"，而是"AI 每次画图时有没有一套稳定的 Skill 框架约束它别乱画"。
