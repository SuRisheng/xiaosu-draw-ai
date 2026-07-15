[English](README.md) | [中文](README_CN.md)

---

# xiaosu-draw-ai

> 通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。

**从自然语言描述生成生产级架构图、时序图、ER 图、流程图、部署图、类图、C4、状态机、网络拓扑、数据流图。**

**版本：** 1.0.0 &nbsp;|&nbsp; **协议：** MIT

[:book: 详细使用说明](https://ocnlhn7o8ml8.feishu.cn/wiki/ZBcow9h8YiSvmOkQdjbcKlDgn9f) &nbsp;|&nbsp; [:blue_book: 设计文档](https://ocnlhn7o8ml8.feishu.cn/wiki/AdwMwTV8ci6rJdkisSBccaBbnnf)

---

## 关于

xiaosu-draw-ai 是一个 AI 驱动的制图 Skill，将自然语言转化为可编辑的 `.drawio` 文件。基于 draw.io 桌面版 CLI，支持 **10 种图类型**、**3 条渲染管道**：数据驱动导入（SQL→ER、OpenAPI→架构图）、Mermaid 转换（`.mmd`→`.drawio`）、AI 手写 XML（完整布局控制）。每张图通过**强制质量门禁**：结构校验（P0-P2）、启发式视觉审计（P3）、AI 视觉自检。

Skill 以单个目录打包分发——复制或符号链接到任意 Agent 的 skills 目录即可。无需 API Key、无平台锁定。输出为标准 `.drawio` XML，可在 draw.io 桌面版、VS Code 或任何 MXGraph 编辑器中继续编辑。

---

## 功能一览

| 功能 | 说明 |
|------|------|
| **自然语言制图** | 中/英文描述即可，支持 10 种图类型，含 20 个中英文引导模板 |
| **三管道自动路由** | A：数据驱动导入（SQL→ER / OpenAPI→架构）；B：Mermaid 转换（.mmd→.drawio，源码保留）；C：AI 手写 XML（布局全控） |
| **7 套视觉风格** | Flat Icon（默认）/ Dark Terminal / Blueprint / Notion Clean / Glassmorphism / Claude Official / OpenAI，含 7 种语义箭头 |
| **P0-P3 质量门禁** | 自动结构校验 + 视觉审计 + AI 自检，预览/最终导出分离，最多 3 轮自动修复 |
| **已有图增量修改** | .mmd 源编辑→重新转换；.drawio XML 解析→精确编辑；Agent 按名自动搜索；文档内嵌 Mermaid 代码块编辑 |
| **模板驱动文档生成** | 基于文档模板推断图表位置 → 逐章生成正文 + 对应图 → 交付完整文档 |
| **跨平台交付** | Windows / macOS / Linux 统一 draw.io CLI 导出；CLI 路径自动检测（一般无需手动配置 PATH） |

---

## 支持的图类型

| 图类型 | 中文触发词 | English Trigger | 布局方向 |
|--------|-----------|----------------|---------|
| **系统架构图** | "架构图", "系统设计" | "architecture", "microservices" | 自上而下分层 |
| **时序图** | "时序图", "交互流程" | "sequence diagram" | 左→右，时间↓ |
| **ER 图** | "ER图", "数据库设计" | "ER diagram" | 散布，最小交叉 |
| **流程图** | "流程图", "业务流程" | "flowchart", "workflow" | 上→下，分支展开 |
| **部署图** | "部署图", "基础设施" | "deployment" | 穿越安全域 |
| **UML 类图** | "类图", "对象模型" | "class diagram" | 继承↓，关联→ |
| **C4 模型** | "C4", "容器图" | "C4", "container" | Person→System→External |
| **状态机** | "状态机", "状态迁移" | "state machine" | 左→右状态迁移 |
| **网络拓扑** | "网络拓扑", "拓扑图" | "network", "topology" | 穿越网络区域 |
| **数据流图** | "数据流", "DFD" | "data flow", "pipeline" | 上→下管道 |

---

## 安装

### 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| [draw.io 桌面版](https://www.drawio.com/) | ≥ 24.0 | CLI 导出引擎 |
| Python 3 | ≥ 3.8 | 结构校验 |
| Node.js | ≥ 14.0 | 导出、构建、审计、安装 |

> `export.js` 已实现跨平台 CLI 自动检测——一般无需手动配置 PATH。

### 快速安装（推荐）

```bash
# 符号链接（开发期推荐，修改源码立即生效）
# macOS / Linux
ln -s "$(pwd)/skills/xiaosu-draw-ai" ~/.claude/skills/xiaosu-draw-ai

# Windows（需管理员权限或开发者模式）
mklink /D "%USERPROFILE%\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

### 发布包安装

```bash
node skills/xiaosu-draw-ai/scripts/build.js
cp -r .claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai
```

> **不要只复制 `SKILL.md`**——`references/`、`scripts/`、`styles/`、`templates/` 必须与 `SKILL.md` 同级保留。

---

## 快速上手：修改已有图

### Mermaid 源格式 (.mmd) — 编辑源文件，重新生成

```bash
# 1. 编辑 .mmd 文件（或 Markdown 文档中的 Mermaid 代码块）
# 2. 重新转换
node skills/xiaosu-draw-ai/scripts/mermaid-convert.js diagram.mmd --output diagram.drawio
# 3. 校验 + 导出
python3 skills/xiaosu-draw-ai/scripts/validate.py diagram.drawio
node skills/xiaosu-draw-ai/scripts/export.js diagram.drawio --final
```

**.mmd 文件才是可编辑源文件。** 不要直接改生成的 `.drawio`——重新转换时会丢失修改。

### draw.io 手写格式 (.drawio) — 解析，精确编辑

```bash
# AI 解析结构 → 展示节点/边摘要 → 精确编辑 XML → 校验 → 导出
node skills/xiaosu-draw-ai/scripts/xml-parser.js diagram.drawio --json
```

### 从 PNG 提取 (.drawio.png, --final 导出)

```bash
node skills/xiaosu-draw-ai/scripts/png-extract.js diagram.drawio.png --output temp.drawio
```

---

## 选择视觉风格

在描述中加入关键词即可切换：

| 风格 | 中文触发词 | English Trigger |
|------|-----------|----------------|
| **Flat Icon**（默认） | （不指定） | *(none)* |
| **Dark Terminal** | "深色", "暗色" | "dark", "terminal" |
| **Blueprint** | "蓝图", "工程图" | "blueprint" |
| **Notion Clean** | "简洁", "极简" | "clean", "minimal" |
| **Glassmorphism** | "玻璃", "毛玻璃" | "glass", "frosted" |
| **Claude Official** | "暖色", "专业" | "claude style", "warm" |
| **OpenAI** | "极简", "简朴" | "openai style", "spartan" |

详见 `references/style-presets.md` 了解完整的查表协议和自定义样式方法。

---

## 模板驱动文档生成

给 AI 一个模板（飞书 Wiki / Markdown / Docx 都支持）+ 需求：

> "用这个模板（链接）+ 以下需求，生成一份电商系统设计文档。前端 React + iOS，网关 Kong，后端用户服务、订单服务、商品服务，数据库 MySQL + Redis。"

AI 会：读模板 → 从 Mermaid 代码块/`.drawio.png` 嵌入/章节标题推断图表位置 → 展示蓝图 → 逐章生成。

在文档中直接写 `@xiaosu-draw-ai` 标注块：

```markdown
@xiaosu-draw-ai 绘制用户登录时序图
【图类型】时序图
【内容】
1、参与者：浏览器、Web应用、API网关、认证服务、数据库
2、正常流程：输入凭证 → POST /login → 校验 → JWT → 成功
3、异常分支：密码错误 401；账号锁定 423
【风格】Notion Clean
```

然后对 AI 说"帮我把文章里的图都生成出来"即可。

---

## 质量体系

| 层级 | 检查 | 阻断 | 检测内容 |
|------|------|------|---------|
| **P0** | `validate.py` | 是（exit 2） | 悬空边、重复 ID、XML 语法错误 |
| **P1** | `validate.py` | 是（exit 1） | 节点重叠、边穿越节点、边交叉 |
| **P2** | `validate.py` | 否（exit 0） | 坐标未对齐网格、连接点偏位 |
| **P3** | `audit.js` + AI 视觉 | 建议 | 标签截断、边重叠、Z 序违规 |

最多 **3 轮自动修复**。三条管道统一进入同一质量门。

---

## Token 消耗参考

| 指标 | 简单图（16 节点，7 边）| 复杂图（59 节点，30 边）|
|------|----------------------|------------------------|
| 输入 Token | ~26,000 | ~26,000 |
| 输出 Token | ~8,000 | ~8,000 |
| 耗时 | ~2 分钟 | ~5 分 30 秒 |
| 管道 | C | C（Python 脚本） |
| 估算成本（Opus 4.8）| ~$0.20 | ~$0.33 |

> 说"benchmark"或"统计性能"可获取精确 session 数据（`benchmark.md` 流程）。

---

## 开发命令

```bash
# 结构 lint
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --score

# 导出预览 / 最终
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio>
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio> --final

# 构建发布包
node skills/xiaosu-draw-ai/scripts/build.js

# 运行测试
python3 -m pytest tests/unit/ -v
node tests/integration/test_golden_regression.js
```

---

## 项目结构

```
xiaosu-draw-ai/
├── README.md / README_CN.md
├── CLAUDE.md                         # 开发者修改路由表
├── LICENSE
│
├── skills/xiaosu-draw-ai/            # Skill 包
│   ├── SKILL.md                      # Agent 行为入口
│   ├── references/                   # 15 份按需加载规则文档
│   ├── templates/                    # 20 个中英文提示词模板
│   ├── styles/                       # JSON Schema + 7 套内置预设
│   ├── scripts/                      # 13 个脚本（校验、导出、构建等）
│   └── data/                         # 结构化数据索引（预留）
│
├── tests/                            # L0-L2 测试套件
├── .drawio/                          # 开发验证用图
├── .github/workflows/                # CI（4 个 Job）
└── .claude/skills/                   # 构建产物（勿手改）
```

---

## License

MIT
