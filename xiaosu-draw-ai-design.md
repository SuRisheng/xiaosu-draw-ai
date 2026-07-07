# xiaosu-draw-ai 架构设计

> 最终设计版本。融合三轮讨论 + drawio-skill / fireworks-tech-graph / architecture-diagram-generator 三案例源码研读 + xiaosu-drawio 实战经验。
>
> **核心定位**：通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。

---

## 0. 核心决策（已确认）

| 决策 | 结论 | 理由 |
|------|------|------|
| 后端引擎 | **draw.io CLI** 为主（默认），**SVG 直写**为辅（用户要求时） | 默认 CLI 保可编辑源文件；SVG 模式复用 styles/ 视觉规范 |
| 用户输入格式 | **Markdown 提示词模板**，非 YAML | 用户填自然语言，AI 负责结构化；人能审核结构化结果 |
| 与 xiaosu-drawio 关系 | **完全独立新工程** `xiaosu-draw-ai` | P0-P3 规则 / validate.py / feishu-embed 参考但重写 |
| 测试隔离 | **Windows `/tmp` 目录隔离** | Mac 备机可用于额外验证 |
| 质量脚本 | **validate.py 统一负责**结构 lint + P0-P3 审计 | 一个脚本，不拆两个；重叠检测归 validate.py |
| 管道 B 路由规则 | 结构优先型**默认用 Mermaid**；用户说"漂亮/精美"→ 降级管道C | Mermaid 结构稳定优先级高；视觉美化诉求走手写 XML |
| styles/ 定位 | **颜色/样式字典**—AI 查表决定 fillColor/strokeColor | fireworks 的 style 文件是 SVG 模板直接粘贴；CLI 路线下 AI 查字典写 XML |

---

## 三方参考框架（本地路径，后续开发直接引用）

| 框架 | 本地绝对路径 | GitHub | Stars | 主要参考点 |
|------|------------|--------|-------|-----------|
| **drawio-skill** | `D:\ClaudeCode\project\OpenArchitect\drawio-skill` | Agents365-ai/drawio-skill | 5,352 | 管道架构、validate.py、XML 规范、样式预设、视觉自检 |
| **fireworks-tech-graph** | `D:\ClaudeCode\project\OpenArchitect\fireworks-tech-graph` | yizhiyanhua-ai/fireworks-tech-graph | 6,800+ | 8种风格、布局间距标准、箭头路由、Z序、SVG自检 |
| **architecture-diagram-generator** | `D:\ClaudeCode\project\OpenArchitect\architecture-diagram-generator` | — | — | 暗色主题 HTML+SVG 架构图模板 |

> 开发时直接读本地文件，不需要触发 GitHub API 搜索。

## 1. 完整目录结构

> 每个目录/文件标注了 **"改什么动这里"** 的指引，AI 和人都能准确识别。

```
xiaosu-draw-ai/
│
├── CLAUDE.md                          # 📍 修改路由表（不是规则！）
│   # 内容：
│   # - 项目一句话定位
│   # - 修改路由：加图类型 → templates/，加规则 → references/rules.md，
│   #   改导出 → scripts/export.js，改审计 → scripts/validate.py
│   # - 开发命令速查
│   # - 测试流程速查
│
├── VERSION                            # 🔒 人工管控。内容："0.1.0"
│   # 规则：只有人能编辑，AI 只读。build.js 读取此文件注入版本信息。
│
├── CHANGELOG.md                       # 🔒 人工维护
│
├── SKILL.md                           # 🎯 Agent 工作流指令（核心）
│   # 不与任何 Agent 平台耦合。
│   # 写语义化指令（"运行 drawio -x"），不写具体工具调用语法。
│   # 内容：触发条件 → 模板选择 → 生成 → 审计 → 导出 → 交付
│
├── README.md                          # 📖 给人看的项目说明
│
│
├── templates/                         # 📝 提示词模板（Markdown 格式）
│   # 每个模板含：图类型说明、示例自然语言描述、填写指南、约束说明
│   # 用户填自然语言，AI 负责从填写内容中抽取结构化信息
│   #
│   # 国际化：按语言分目录，同结构不同示例
│   #   zh/ → 中文模板（Phase 1 先做）
│   #   en/ → 英文模板（后续加）
│   # AI 根据用户输入语言自动选目录
│   #
│   # 分支策略：
│   # - 结构优先型（时序图/ER/类图/状态机/甘特图）
│   #   → 管道B：AI 将用户描述转 Mermaid → draw.io CLI 转换
│   # - 布局优先型（架构图/部署图/流程图/网络拓扑）
│   #   → 管道C：AI 将用户描述转手写 XML → draw.io CLI 渲染
│   # - 数据驱动型（代码→图 / IaC→图 / SQL→ER / OpenAPI→图）
│   #   → 管道A：导入器脚本 extract → autolayout → CLI 渲染
│   #
│   ├── zh/                            # 中文模板（Phase 1）
│   │   ├── architecture.md            # 系统/微服务/云架构图
│   │   ├── sequence.md                # 时序图
│   │   ├── er.md                      # ER 图
│   │   ├── flowchart.md               # 流程图
│   │   ├── deployment.md              # 部署架构图
│   │   ├── class.md                   # UML 类图
│   │   ├── c4.md                      # C4 模型
│   │   ├── state-machine.md           # 状态机图
│   │   ├── network.md                 # 网络拓扑图
│   │   └── data-flow.md               # 数据流图
│   │
│   └── en/                            # 英文模板（后续 Phase）
│       ├── architecture.md
│       ├── sequence.md
│       └── ...
│
│
├── references/                        # 📚 规则与参考（按需加载，不常驻上下文）
│   │
│   ├── rules.md                       # P0-P3 像素级规则体系
│   │   # 每条规则含：优先级、触发条件、检测方式（[validate.py] / [AI 视觉] / [混合]）
│   │   # 格式完全参考 xiaosu-drawio 但重写——因为是全新工程
│   │
│   ├── diagram-types.md               # 图类型预设（形状/颜色/布局/边样式）
│   │   # 借鉴 drawio-skill references/diagram-types.md 的结构
│   │   # 内容针对我们支持的 10 种图类型重写
│   │
│   ├── xml-authoring.md               # XML 著述规范
│   │   # 借鉴 drawio-skill references/xml-authoring.md
│   │   # 文件骨架、mxCell 规则、容器、边、连接点分布
│   │
│   ├── style-presets.md               # 样式预设系统（JSON schema + 应用规则）
│   │   # 借鉴 drawio-skill references/style-presets.md
│   │
│   ├── mermaid-authoring.md           # Mermaid 转换指南（管道B参考）
│   │   # 哪些图适合 Mermaid、draw.io CLI v30+ 转换命令
│   │
│   ├── icons.md                       # 产品品牌色 + 图标映射
│   │   # 借鉴 fireworks-tech-graph references/icons.md
│   │
│   ├── feishu-embed.md               # 飞书嵌入（可选步骤）
│   │   # 参考 xiaosu-drawio 但重写
│   │
│   └── troubleshooting.md            # 故障排除
│       # CLI 找不到、导出失败、中文乱码、Windows/Linux/macOS 差异
│
│
├── styles/                            # 🎨 视觉风格参考文件
│   # 借鉴 fireworks-tech-graph 的 8 种风格
│   # 每种风格一个 .md，含精确颜色 Token、SVG 模板、容器结构
│   # 如果走 CLI 路线（非 SVG 直写），这些文件是"颜色/样式字典"，
│   # AI 在生成 XML 时查字典决定 fillColor / strokeColor / fontFamily
│   │
│   ├── style-1-flat-icon.md           # 默认：白底、蓝色主色调
│   ├── style-2-dark-terminal.md       # 终端风：深灰底、霓虹色
│   ├── style-3-blueprint.md           # 蓝图风：深蓝底、白色线条
│   ├── style-4-notion-clean.md        # 极简风：白底、浅灰线条
│   ├── style-5-glassmorphism.md       # 玻璃态：深色渐变底
│   ├── style-6-claude-official.md     # Anthropic 暖色调
│   └── style-7-openai.md              # OpenAI 极简风
│
│
├── scripts/                           # 🔧 工具脚本（核心引擎）
│   │
│   ├── lib/                           # 公共模块
│   │   └── utils.js                   # 通用工具函数
│   │
│   ├── audit.js                       # P0-P3 自动化审计
│   │   # 输入：.drawio 文件路径
│   │   # 输出：exit 0（通过）/ 1（P1/P2违规）/ 2（P0阻断）
│   │   # --json 输出违规详情
│   │   # --score 输出可读性评分
│   │   # 参考 xiaosu-drawio scripts/audit.js 重写
│   │
│   ├── export.js                       # CLI 导出封装
│   │   # 封装 drawio -x -f png -e -s 2 -o <out> <in>
│   │   # 自动选择二进制名称（drawio / draw.io / 全路径）
│   │   # 参考 xiaosu-drawio scripts/export.js 重写
│   │
│   ├── validate.py                     # 结构级 lint（借鉴 drawio-skill）
│   │   # 悬空边检测、重复 ID、重叠检测
│   │   # 与 audit.js 的关系：
│   │   #   validate.py = 结构正确性（dangling edges, dup ids）
│   │   #   audit.js    = 视觉质量（P0-P3 规则）
│   │
│   ├── build.js                        # 打包构建
│   │   # 流程：
│   │   # 1. 读取 VERSION → 注入 manifest.json
│   │   # 2. 校验 SKILL.md frontmatter
│   │   # 3. 校验 references/ 章节完整性
│   │   # 4. 复制源文件 → output/xiaosu-draw-ai/
│   │   # 5. 生成 README.md（含主流 Agent 安装说明）
│   │   # 6. 生成 manifest.json
│   │   # 7. 输出测试污染检查清单
│   │
│   └── install.js                      # 跨平台安装脚本（可选）
│       # 输出到 output/xiaosu-draw-ai/
│       # 检查 draw.io CLI 是否可用
│       # 写入 Agent skill 配置（不耦合特定 Agent）
│
│
├── tests/                              # 🧪 测试（不污染开发环境）
│   │
│   ├── README.md                       # 测试流程说明
│   │
│   ├── golden/                         # 🔒 回归测试集（只读！）
│   │   ├── architecture.drawio         # 架构图 golden
│   │   ├── sequence.drawio             # 时序图 golden
│   │   ├── er.drawio                   # ER 图 golden
│   │   ├── flowchart.drawio            # 流程图 golden
│   │   └── ...                         # 每种图类型至少一张
│   │
│   ├── unit/                           # L0: 单元测试
│   │   ├── test_audit.js               # audit.js 规则逻辑
│   │   ├── test_validate.py            # validate.py 结构 lint
│   │   └── test_ir_schema.js           # IR schema 校验
│   │
│   ├── integration/                    # L1: 集成测试（需要 draw.io CLI）
│   │   ├── test_export.js              # CLI 导出流程
│   │   ├── test_cli_detect.js          # CLI 二进制检测
│   │   └── test_golden_regression.js   # Golden set 回归
│   │       # cp tests/golden/* → /tmp/test-{ts}/
│   │       # drawio -x 导出 → audit.js 审计
│   │       # 对比历史审计分数，不退化
│   │
│   └── e2e/                            # L2: 端到端测试（仅人工触发）
│       └── test_full_workflow.js       # 完整流程：模板→生成→审计→导出
│
│
├── output/                             # 📦 打包产物（build.js 生成，勿手动编辑）
│   └── xiaosu-draw-ai/
│       ├── SKILL.md                    # Agent 工作流指令
│       ├── README.md                   # 安装说明（多 Agent）
│       ├── manifest.json               # 版本 + 元数据 + 文件清单
│       ├── install.js                  # 安装脚本
│       ├── references/                 # 规则文件（复制）
│       ├── styles/                     # 风格文件（复制）
│       ├── templates/                  # 模板文件（复制，含 zh/ + en/）
│       └── scripts/                    # 脚本（复制，不含 tests/）
│
│
└── .drawio/                            # 🖼️ 开发过程中验证用的 .drawio 文件
    # Git 管理。这张图是本工程的"自举验证"——
    # 用 xiaosu-draw-ai 画它自己的架构图。
    └── xiaosu-draw-ai-arch.drawio
```

---

## 2. 五层架构

```
┌──────────────────────────────────────────────────────────┐
│  L1: 意图层                                              │
│  用户自然语言 → 匹配提示词模板 → AI 结构化 → 人审核       │
│  核心文件：templates/*.md                                │
├──────────────────────────────────────────────────────────┤
│  L2: 路由层                                              │
│  结构化描述 → 判断管道（A:数据驱动 B:声明式 C:AI约束式）  │
│  核心文件：SKILL.md（路由规则）                           │
├──────────────────────────────────────────────────────────┤
│  L3: 生成层                                              │
│  管道A: 导入器→autolayout→XML                             │
│  管道B: 自然语言→Mermaid→CLI转换                          │
│  管道C: 自然语言→AI手写XML                                │
│  核心文件：scripts/、references/xml-authoring.md          │
├──────────────────────────────────────────────────────────┤
│  L4: 质量层（不可跳过）                                   │
│  validate.py（结构lint + P0-P3审计）→ AI视觉审计│
│  核心文件：scripts/validate.py、references/rules.md、        │
│           references/rules.md                             │
├──────────────────────────────────────────────────────────┤
│  L5: 交付层                                              │
│  CLI 导出 → .drawio.png → Git 记录 → [飞书嵌入]          │
│  核心文件：scripts/export.js、references/feishu-embed.md  │
└──────────────────────────────────────────────────────────┘
```

---

## 3. 提示词模板系统设计

### 3.1 模板格式

每个模板是 Markdown 文件，包含以下结构：

```markdown
# <图类型中文名>（<英文名>）

## 这是什么图
一句话说明这种图的用途。

## 适用场景
- 场景A
- 场景B

## 你怎么描述
用自然语言回答以下问题（不需要全答，AI 会追问你漏掉的部分）：

1. **系统/流程叫什么？**
2. **有哪些核心部分？** 比如...
3. **它们之间怎么连接/交互？** 比如...
4. **有没有特殊要求？** 比如高亮某个模块、用特定颜色、标注技术栈...

## 示例

### 示例1：简单的
> 画一个电商系统的架构图，有用户端（Web/iOS）、API网关、用户服务、订单服务、商品服务、
> MySQL数据库和Redis缓存。用户请求经过API网关分发到各个微服务。

### 示例2：详细的
> 画一个微服务架构图。
> 系统叫"电商平台"。
> 前端有Web端（React）和iOS App。
> API网关用Kong，后面挂了4个服务：
> - 用户服务（Go）：注册登录、JWT鉴权
> - 订单服务（Java）：下单、查订单、对接支付宝
> - 商品服务（Python）：商品CRUD、搜索用Elasticsearch
> - 库存服务（Go）：扣库存、预占库存
> 中间件：RabbitMQ做异步消息、Redis做缓存
> 数据库：每个服务独立MySQL
> 部署在阿里云K8s上。

## 约束（AI 生成时必须遵守）
- 使用 [架构图 / 时序图 / ...] 的布局规则
- <该图类型的特定质量要求>
```

### 3.2 模板引导流程

```
场景A：用户明确说出图类型 + 需求
  用户："画一个微服务架构图，包含..."
  → AI 匹配 templates/architecture.md
  → AI 将用户自然语言结构化（生成内部 IR）
  → AI 展示结构化结果给用户确认：
    "我理解你想画：【微服务架构图】
     组件：API网关(Kong)、用户服务、订单服务、商品服务、库存服务
     中间件：RabbitMQ、Redis
     数据：MySQL（每服务独立）
     部署：阿里云K8s
     关系：客户端→API网关→各服务；订单服务→RabbitMQ→库存服务
     确认？或者想调整什么？"
  → 用户确认或修改
  → 进入生成管道

场景B：用户只有模糊需求
  用户："帮我画一下这个系统的图"
  → AI 追问收敛：
    第1轮："你想展示什么？A.系统有哪些服务 B.用户操作的流程 C.数据怎么存的"
    第2轮：根据回答定位模板 → 追问模板中的关键字段
    第3轮：展示结构化结果 → 确认
  → 进入生成管道

场景C：用户引用了文档
  用户："根据这个 PRD 画架构图"
  → AI 读取文档内容
  → AI 根据文档内容推断图类型 + 填充模板
  → AI 展示推断结果：
    "根据PRD内容，我建议画【系统架构图】，以下是提取的结构：
     组件：...
     关系：...
     你觉得对吗？要改什么？"
  → 用户确认
  → 进入生成管道
```

### 3.3 关键设计决策

**用户不写 YAML，用户写自然语言。AI 负责把自然语言转成结构化 IR 并展示给用户审核。**

这样做的好处：
- 用户端的认知负担为零——"我描述我的系统，你画出来"
- 结构化 IR 是审核界面——人看一眼就知道 AI 有没有理解错
- Git diff 友好——IR 可以有 JSON 表示，版本间改了什么一目了然
- 模板文件人可以维护——模板是 Markdown + 示例，不是代码

---

## 4. 管道选择逻辑（L2: 路由层）

```
用户确认的结构化 IR
        │
        ▼
┌─────────────────────────────────────┐
│ 管道选择的决策树（按优先级判断）      │
│                                     │
│ 1. 用户提供了代码/配置文件？         │
│    → 管道A（数据驱动）               │
│    → 导入器提取 → autolayout → CLI   │
│                                     │
│ 2. 图类型是结构优先型？              │
│    （时序图/ER/类图/状态机/甘特图/思维导图）│
│    → 管道B（声明式 Mermaid）          │
│    → AI 写 .mmd → draw.io CLI v30+  │
│                                     │
│ 3. 图类型是布局优先型？              │
│    （架构图/部署图/流程图/网络拓扑/C4）│
│    → 管道C（AI 约束式生成 XML）       │
│    → AI 手写 XML → draw.io CLI 渲染  │
│                                     │
│ 用户可以用 --pipeline=A/B/C 覆盖     │
└─────────────────────────────────────┘
```

管道B 的 Mermaid 使用条件：
- 需要 draw.io CLI ≥ v30
- 结构优先型图（时序图/ER/类图/状态机/甘特图）默认走管道B
- 用户说"漂亮""精美""好看"→ 降级到管道C（手写 XML，视觉完全可控）
- CLI 转换后的图仍有完整 XML 源文件，可以进一步手动编辑
- 如果 CLI 版本不足 → 自动降级到管道C

---

## 5. 质量关卡设计（L4）

```
生成 XML 后，必须通过以下三道关卡（顺序执行，不可跳过）：

关卡1: validate.py（结构级 lint）
  ├── 悬空边（source/target 引用了不存在的 id）
  ├── 重复/保留 ID（id=0, id=1 不能被用户节点占用）
  ├── 重叠检测（两个节点的 bounding box 重叠）
  ├── 容器父子关系完整性
  └── exit 0 → 继续；exit 1 → 修复后重跑

关卡2: validate.py 空间质量检查（同脚本第二层）
  # 来源：drawio-skill validate.py（结构检测引擎）
  #      + fireworks-tech-graph layout best practices（间距/路由/连接点规则）
  ├── 阻断级（exit 2，必须修复）
  │   ├── 悬空边：source/target 引用不存在的 id
  │   ├── 重复/保留 ID：id=0, id=1 被用户节点占用
  │   ├── 父子断裂：子节点引用的 parent 不存在
  │   └── XML 语法：非法注释（--）、未转义特殊字符
  ├── 强制修复（exit 1，修复后重跑）
  │   ├── 重叠检测：任何两个节点 bounding box 重叠（8px 安全边距）
  │   ├── 边穿过节点：有 waypoints 的边，线段穿过非端点的节点
  │   ├── 边交叉：两条有 waypoints 的边路径交叉
  │   ├── 间距不足：连线节点间距 < 30px；无连线相邻节点 < 5px
  │   ├── 出界检测：节点坐标 x < 0 或 y < 0
  │   └── 自闭合边：edge mxCell 用了自闭合标签（缺少 mxGeometry 子元素）
  └── 警告（exit 0，记录但不阻断）
      ├── 连接点不居中：exitX/exitY/entryX/entryY 非 0.5 且无多线理由
      ├── 箭头末段过短：最后一段线段 < 15px
      └── 可读性评分：--score < 阈值

关卡3: AI 视觉审计（validate.py 无法自动化的规则，借鉴 drawio-skill Step 5 + fireworks-tech-graph checklist）
  ├── 读导出 PNG（不加 -e，--width 2000 防超限）
  ├── 检查清单（借鉴 drawio-skill 的 6+1 项）：
  │   ├── 标签截断：文字超出形状边界
  │   ├── 边-形状重叠：边视觉上穿过无关形状（无 waypoints 的边）
  │   ├── 边-标签重叠：边标签与其他元素碰撞
  │   ├── 多条边堆叠：多条边走同一路径
  │   ├── 箭头方向错误：箭头指向与连接边框不匹配
  │   ├── 连接点靠角：箭头连接在元素角上（距角 < 20px）
  │   └── 图例可读/不重叠内容
  ├── 借鉴 fireworks-tech-graph 的检查项：
  │   ├── 箭头标签无背景矩形
  │   ├── 组件间距不足（视觉确认 < 80px 的情况）
  │   └── Z 序正确（箭头在组件后面）
  ├── 最多 2 轮自检修复
  └── 通过 → 最终导出；不通过 → 标记风险继续
```

---

## 6. 版本管理

```
VERSION 文件（纯文本）
  │
  │  内容："0.1.0"
  │  规则：只人类编辑，AI 只读
  │
  ▼
build.js 打包时读取 VERSION
  │
  ├──→ output/xiaosu-draw-ai/manifest.json
  │    { "name": "xiaosu-draw-ai", "version": "0.1.0", ... }
  │
  ├──→ output/xiaosu-draw-ai/SKILL.md frontmatter
  │    ---
  │    version: 0.1.0
  │    ---
  │
  ├──→ output/xiaosu-draw-ai/README.md 
  │    ![](https://img.shields.io/badge/version-0.1.0-blue)
  │
  └──→ 检查：git tag v0.1.0 是否存在
       不存在 → 警告（开发中，正常）
       存在   → 校验 VERSION 与 tag 一致
```

---

## 7. 输出目录与多 Agent README

`output/xiaosu-draw-ai/README.md` 的结构：

````markdown
# xiaosu-draw-ai v0.1.0

用自然语言描述系统，自动生成高质量软件设计图。
支持架构图、时序图、ER 图、流程图、部署图等 10 种图类型。

## 快速开始

### Claude Code
```bash
npx skills add <your-repo>/xiaosu-draw-ai
```

### Codex
```bash
codex skill install <your-repo>/xiaosu-draw-ai
```

### Cursor
将 `SKILL.md` 复制到 `.cursor/skills/` 目录

### Copilot
```bash
# 通过 GitHub Skills Marketplace 安装
```

### 通用安装
```bash
git clone <your-repo>/xiaosu-draw-ai ~/.agents/skills/xiaosu-draw-ai
```

## 依赖

- draw.io 桌面版（CLI ≥ v24）
- Python 3（可选，部分脚本需要）
- Graphviz（可选，大图自动布局需要）

## 触发方式

用自然语言描述你想画的图即可：
- "画一个电商系统的微服务架构图"
- "画用户下单的时序图"
- "根据这个 SQL 画 ER 图"

## 图类型支持

| 图类型 | 触发词示例 |
|--------|-----------|
| 系统架构图 | "架构图""系统设计" |
| 时序图 | "时序图""交互流程" |
| ER 图 | "ER图""数据库设计" |
| 流程图 | "流程图""业务流程" |
| ... | ... |
````

---

## 8. 测试体系

### 8.1 测试分层

```
L0: 单元测试（无外部依赖，运行在项目目录）
  ├── test_validate_unit.py → 纯逻辑测试（Mock XML 输入）
  ├── test_validate_unit.py → 纯逻辑测试
  └── test_ir_schema.js     → IR JSON schema 校验
  运行环境：项目目录
  外部影响：零

L1: 集成测试（需要 draw.io CLI，运行在临时目录）
  ├── test_cli_detect.js    → 检测 CLI 二进制
  ├── test_export.js        → 导出 PNG，验证产物完整性
  └── test_golden_regression.js → 核心回归测试
  运行环境：/tmp/xiaosu-draw-ai-test-{timestamp}/
  外部影响：产生临时文件，测试后清理

L2: 打包测试（验证 build.js 产物）
  ├── test_build.js         → 打包 → 检查 output/ 完整性
  └── test_install.js       # 安装到临时 Agent 配置目录 → 卸载 → 清理
  运行环境：临时目录
  外部影响：可能写入临时 Agent 配置目录，测试后清理

L3: 端到端测试（仅人工触发）
  └── test_full_workflow.js → 真实 Agent 环境：描述→模板→生成→审计→导出→交付
  运行环境：真实 Agent 环境
  外部影响：产生 .drawio/ 文件（正常产物）
```

### 8.2 Golden Set 回归测试

```
tests/golden/ 目录（只读！）
  每种图类型至少一张 .drawio 文件
  这些文件是"正确答案"——经过人工验证的高质量图

test_golden_regression.js 流程：
  1. cp tests/golden/* → /tmp/test-{ts}/input/
  2. 对每张 golden 图：
     a. drawio -x -f png -o /tmp/test-{ts}/output/{name}.png
     b. python3 scripts/validate.py --json /tmp/test-{ts}/input/{name}.drawio
     c. 对比历史审计分数（存储在 tests/golden/scores.json）
     d. 分数下降 → 回归告警
  3. 清理 /tmp/test-{ts}/
```

### 8.3 测试污染检查清单

`build.js` 打包前自动运行：

```
[ ] tests/golden/ 文件未被修改（hash 对比）
[ ] 无 /tmp/xiaosu-draw-ai-test-* 残留目录
[ ] 无残留 draw.io 进程（tasklist | grep draw.io）
[ ] scripts/、references/、templates/ 源文件未被测试修改
[ ] ~/.claude/ 未被测试写入
[ ] ~/.openarchitect/ 未被测试写入
```

### 8.4 Mac 备机测试策略

```
Windows（主力开发机）：
  - L0 单元测试（日常）
  - L1 集成测试（draw.io CLI Windows 版）
  - L2 打包测试（日常）

Mac（备机）：
  - L1 集成测试（draw.io CLI macOS 版——Homebrew cask 路径不同）
  - L3 端到端测试（macOS Agent 环境）
  - 跨平台 CLI 行为差异验证（`drawio` vs `draw.io` 二进制名、路径差异）

CI（未来）：
  - GitHub Actions：L0 + L1（Linux xvfb-run 无头模式）
  - Windows/Mac 矩阵测试按需触发
```

---

## 9. 与上游开源项目的版本融合策略

```
依赖关系图：

xiaosu-draw-ai
    │
    ├── draw.io 桌面版 CLI（基础设施依赖）
    │   ├── 版本锁定：install.js 检查 >= 24.0.0
    │   ├── 更新策略：大版本更新需跑 Golden set 回归，审计分数不退化
    │   └── 降级路径：保留旧版 CLI 安装说明
    │
    ├── drawio-skill（参考依赖，非代码依赖）
    │   ├── 借鉴其设计模式（管道架构、validate.py、style-presets）
    │   ├── 不 fork、不 import、不 cherry-pick
    │   └── 为什么？两个项目的设计哲学不同（drawio-skill 是通用工具箱，
    │       xiaosu-draw-ai 是质量优先的制图 Skill），直接依赖反而绑死
    │
    └── fireworks-tech-graph（参考依赖，非代码依赖）
        ├── 借鉴：8种视觉风格系统 + 风格-图类型适配矩阵
        ├── 借鉴：布局最佳实践（80/120/60间距、正交路由、连接点规则、Z序）
        ├── 借鉴：SVG 自检规则（标签平衡/引号/marker/Quick Fix）
        ├── 借鉴：AI 视觉审计清单（箭头标签背景/Z序/角连接/箭头错开）
        └── 不直接复用代码（它走 SVG 直写，我们在默认 CLI 路线下用 XML，
            但 SVG 后端模式直接复用其全套质量规则）
```

---

## 10. 语言策略

| 层面 | 语言 | 理由 |
|------|------|------|
| **SKILL.md**（AI 指令） | 英文 | 英文 prompt token 效率更高、全球 Agent 兼容、开源社区惯例 |
| **templates/zh/**（用户模板） | 中文 | 目标用户用中文描述系统，示例+引导用中文 |
| **templates/en/**（用户模板） | 英文 | 后续国际化，同结构翻译即可 |
| **references/**（技术规范） | 英文 | 和开源社区惯例一致（diagram-types.md、xml-authoring.md） |
| **CLAUDE.md**（修改路由表） | 中文 | 你自己看的，所有修改指引 |
| **README.md**（GitHub 门面） | 英文 | 搜索可见性 + 国际用户第一印象 |
| **README_CN.md** | 中文 | 中国用户完整版 |

> 核心原则：**中文为主 + 英文门面**。指令语言 ≠ 用户交互语言。drawio-skill 的 SKILL.md 全英文，不影响中文用户用中文画图。

## 11. 用户手册策略（Phase 间渐进）

**Phase 1 不需要单独手册。** 三个内置帮助点足够：

1. **模板自带引导** — 每个  的你怎么描述段落就是使用说明
2. **SKILL.md 模板速查表** — AI 根据用户需求查表推荐模板
3. **README.md 快速开始** — 3 个示例让用户 5 分钟上手

**模板可发现性**（需要在 SKILL.md 中加入）：

| 用户想说 | 推荐模板 | 一句话 |
|---------|---------|-------|
| 系统有哪些服务 |  | 架构图：组件、分层、依赖 |
| 请求怎么流转 |  | 时序图：参与者、消息序列 |
| 数据怎么存的 |  | ER 图：实体、字段、关系 |
| 业务流程怎么走 |  | 流程图：步骤、判断分支 |
| 系统怎么部署 |  | 部署图：节点、网络区 |
| 类之间什么关系 |  | UML 类图：继承、组合、依赖 |

**Phase 3+ 再考虑的事情**：独立  目录、视频教程、自定义样式教程。现在做会过度设计。

## 12. 实施路线建议

```
### Phase 1: 骨架搭建
  - 目录结构 + CLAUDE.md（修改路由表）
  - VERSION + build.js（打包流程）
  - SKILL.md（最小可用版本：仅管道C——手写XML）
  - references/xml-authoring.md + references/rules.md（借鉴 drawio-skill + fireworks-tech-graph）
  - scripts/validate.py + scripts/export.js
  - tests/golden/（2-3张 golden 图）
  - output/ + README.md（多 Agent 安装说明）

### Phase 2: 核心能力
  - templates/（3-4 种核心图类型模板）
  - references/diagram-types.md
  - AI 视觉审计流程

### Phase 3: 多管道
  - 管道B（Mermaid 转换）
  - styles/（2-3 种风格）
  - 更多图类型模板

### Phase 4: 完善
  - 管道A（数据驱动）
  - 剩余图类型 + 所有风格
  - CI 测试
  - 飞书嵌入
```

---

## 附录：与 xiaosu-drawio 的关键差异

| | xiaosu-drawio（旧） | xiaosu-draw-ai（新） |
|---|---|---|
| 后端 | MCP → draw.io 编辑器 | draw.io CLI |
| Agent 兼容 | 仅 Claude Code | 通用 |
| 用户输入 | 自然语言直接描述 | 自然语言 + 提示词模板引导 |
| 质量保障 | P0-P3 + audit.js | validate.py（结构+几何+空间）+ AI 视觉（借鉴 drawio-skill + fireworks） |
| 管道 | 单一（MCP 作图） | 三管道（数据驱动/声明式/AI手写） |
| 风格系统 | 无 | 7 种视觉风格 |
| 工程结构 | Skill 开发工作区 | 标准开源项目结构 |
| 测试 | 无 | L0-L3 分层测试 |
| 版本管理 | CHANGELOG.md | VERSION + build.js + manifest.json |
