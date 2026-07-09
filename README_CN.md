[English](README.md) | [中文](README_CN.md)

---

# xiaosu-draw-ai

> 通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。

**从自然语言描述生成生产级架构图、时序图、ER 图、流程图、部署图、类图、C4、状态机、网络拓扑、数据流图。**

**版本：** 1.0.0 &nbsp;|&nbsp; **阶段：** Phase 4（3 条管道全部实现）&nbsp;|&nbsp; **协议：** MIT

---

## 关于

xiaosu-draw-ai 是一个 AI 驱动的制图 Skill，将自然语言转化为可编辑的 `.drawio` 文件。基于 draw.io 桌面版 CLI，支持 10 种图类型、3 条渲染管道——AI 手写 XML（管道 C）、Mermaid 转换（管道 B）、数据驱动导入（管道 A，支持 SQL 和 OpenAPI）。每张图经过强制质量门禁：结构校验（P0-P2）、启发式视觉审计（P3）、AI 视觉自检。

Skill 以单个目录 `skills/xiaosu-draw-ai/` 分发，包含 Agent 工作流入口（`SKILL.md`）、14 份参考文档、20 个中英文提示词模板、7 套结构化 JSON 风格预设、13 个校验/导出/路由/安装脚本。通过复制或符号链接安装到任意 Agent 的 skills 目录。无需 API Key、无平台锁定，除 draw.io CLI、Python 3、Node.js 外无运行时依赖。

面向开发者、架构师和任何想要"结构正确、视觉可读、始终可编辑"的图的人——不需要学 draw.io XML 或 Mermaid 语法。

---

## 功能一览

| 功能 | 说明 |
|------|------|
| **10 种图类型** | 架构图、时序图、ER 图、流程图、部署图、类图、C4、状态机、网络拓扑、数据流图 |
| **3 条渲染管道** | A：数据驱动（SQL/OpenAPI → 图）、B：Mermaid 转换（.mmd → .drawio）、C：AI 手写 XML |
| **7 套视觉风格** | Flat Icon（默认）、Dark Terminal、Blueprint、Notion Clean、Glassmorphism、Claude Official、OpenAI |
| **P0-P3 质量门禁** | 结构 lint（Python）、启发式审计（Node.js）、AI 视觉自检 |
| **20 个提示词模板** | 中文（zh/）+ 英文（en/），每种图类型各一个，含引导式追问问题 |
| **箭头语义系统** | 7 种语义边种类：主链路、异步、缓存读、缓存写、控制流、反馈、弱依赖 |
| **跨平台** | Windows、macOS、Linux——统一通过 draw.io CLI 导出 |
| **无平台锁定** | 输出为标准 `.drawio` XML——可在 draw.io 桌面版、VS Code 或任何 MXGraph 编辑器中继续编辑 |

---

## 支持的图类型

| 图类型 | 触发词 | 布局方向 |
|--------|--------|---------|
| **系统架构图** | "架构图"、"系统设计"、"微服务" | 自上而下分层 |
| **时序图** | "时序图"、"交互流程"、"消息流" | 左→右，时间↓ |
| **ER 图** | "ER图"、"数据库设计"、"实体关系" | 散布布局，最小交叉 |
| **流程图** | "流程图"、"业务流程"、"工作流" | 上→下，分支展开 |
| **部署图** | "部署图"、"基础设施"、"网络架构" | 穿越安全域 |
| **UML 类图** | "类图"、"UML"、"对象模型" | 继承↓，关联→ |
| **C4 模型** | "C4"、"容器图"、"上下文图" | Person→System→External |
| **状态机** | "状态机"、"状态图"、"状态迁移" | 左→右状态迁移 |
| **网络拓扑** | "网络拓扑"、"网络图"、"拓扑图" | 穿越网络区域 |
| **数据流图** | "数据流"、"DFD"、"数据管道" | 上→下管道 |

---

## 安装

### 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| [draw.io 桌面版](https://www.drawio.com/) | ≥ 24.0.0 | CLI 导出引擎（PNG/SVG/PDF） |
| Python 3 | ≥ 3.8 | 结构校验（`validate.py`） |
| Node.js | ≥ 14.0 | 导出、构建、审计、安装脚本 |

### 方式一：符号链接（推荐开发期使用）

修改源码立即生效，无需重复构建。

**macOS / Linux：**
```bash
ln -s "$(pwd)/skills/xiaosu-draw-ai" ~/.claude/skills/xiaosu-draw-ai
```

**Windows（需管理员权限或开发者模式）：**
```cmd
mklink /D "%USERPROFILE%\.claude\skills\xiaosu-draw-ai" "<repo>\skills\xiaosu-draw-ai"
```

### 方式二：发布包安装

```bash
# 1. 构建发布包
node skills/xiaosu-draw-ai/scripts/build.js

# 2. 复制到 Agent 的 skills 目录
# macOS / Linux
cp -r ./.claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai

# Windows (PowerShell)
Copy-Item -Recurse .\.claude\skills\xiaosu-draw-ai $env:USERPROFILE\.claude\skills\xiaosu-draw-ai
```

### 方式三：通用 Agent 平台

将整个 `skills/xiaosu-draw-ai/` 目录复制到 Agent 的 skills 目录。**不要只复制 `SKILL.md`**——`references/`、`scripts/`、`styles/`、`templates/` 必须与 `SKILL.md` 同级保留。

---

## 如何新增模板

模板是 Markdown 文件，用于引导 AI 完成需求澄清。现有 20 个模板——10 种图类型 × 2 种语言（`zh/` + `en/`）。

### 新增图类型

**1. 创建模板** 放在 `skills/xiaosu-draw-ai/templates/{zh|en}/<类型名>.md`：

```markdown
# <图名>

## 这是什么图
一句话说明用途。

## 适用场景
- 场景 A
- 场景 B

## 你怎么描述
1. 系统/流程叫什么？
2. 有哪些核心部分？
3. 它们之间怎么连接？

## 示例
> 画一个……

## 约束（AI 生成时必须遵守）
- 布局：方向、层间距、节点间距（填写具体 px 值）
- 形状：每种角色用什么形状（填写具体 shape 名称）
- 边：箭头样式、路由规则
- 颜色：按 style 预设查表，不凭感觉配色
```

**2. 添加类型预设** 到 `skills/xiaosu-draw-ai/references/diagram-types.md`——定义形状、颜色、布局默认值、边样式和间距规则。

**3. 在 `SKILL.md` 中注册**——将新类型加入模板对话表，AI 才知道何时路由到此类型。

### 修改已有模板

编辑模板文件的 `## 约束` 段——AI 生成前会读取这段内容。必须填写具体 px 阈值和形状名称，不允许出现占位符（如 `<该图类型的形状>`）。

---

## 如何修改样式

样式是结构化 JSON 预设文件，位于 `skills/xiaosu-draw-ai/styles/built-in/`。每个文件定义了 AI 生成图时使用的完整视觉参数。Schema 定义见 `styles/schema.json`。

### 样式文件结构

```json
{
  "name": "my-style",
  "palette": {
    "primary":   { "fillColor": "#dae8fc", "strokeColor": "#6c8ebf" },
    "success":   { "fillColor": "#d5e8d4", "strokeColor": "#82b366" },
    "warning":   { "fillColor": "#fff2cc", "strokeColor": "#d6b656" },
    "accent":    { "fillColor": "#ffe6cc", "strokeColor": "#d79b00" },
    "danger":    { "fillColor": "#f8cecc", "strokeColor": "#b85450" },
    "neutral":   { "fillColor": "#f5f5f5", "strokeColor": "#666666" },
    "secondary": { "fillColor": "#e1d5e7", "strokeColor": "#9673a6" }
  },
  "roles": {
    "service":   "primary",
    "database":  "success",
    "queue":     "warning",
    "gateway":   "accent",
    "error":     "danger",
    "external":  "neutral",
    "security":  "secondary",
    "container": "primary"
  },
  "shapes": {
    "service":   "rounded=1;whiteSpace=wrap;html=1",
    "database":  "shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15"
  },
  "font": { "fontFamily": "Helvetica", "fontSize": 12 },
  "edges": {
    "style": "edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1",
    "arrow": "endArrow=classic;endFill=1"
  }
}
```

### 创建新样式

1. **复制已有预设** 从 `styles/built-in/` 作为起点。
2. **编辑 JSON**——修改 `palette` 颜色、`roles` 映射、`font` 设置、`shapes` 形状定义和 `edges` 边样式。
3. **Schema 校验**：
   ```bash
   node -e "const s=require('./skills/xiaosu-draw-ai/styles/schema.json'); console.log(JSON.parse(require('fs').readFileSync('./skills/xiaosu-draw-ai/styles/built-in/my-style.json','utf8')))"
   ```
4. **注册** 到 `skills/xiaosu-draw-ai/references/style-presets.md`——将新样式加入查表，附触发关键词（如 "深色"、"现代"、"极简"）。
5. **加入 `SKILL.md`** 样式选择表，AI 才知道何时选用此样式。

### 覆盖特定颜色

每种语义角色通过 `roles` 字段映射到调色板槽位。AI 生成时按 `roles.<角色> → palette.<槽位>` 查表。例如，要把所有数据库改成紫色：

```json
"palette": { "success": { "fillColor": "#f3e5f5", "strokeColor": "#7b1fa2" } }
```

所有 `role: "database"` 的节点会自动使用新颜色。无需改脚本——查表协议自动处理。

### 内置风格一览

| 风格 | 文件 | 适用场景 | 触发词 |
|------|------|---------|--------|
| Flat Icon | `flat-icon.json` | 架构图、ER 图、流程图（默认） | *(默认)* |
| Dark Terminal | `dark-terminal.json` | 数据流图、网络、AI 架构 | "深色"、"暗色"、"终端" |
| Blueprint | `blueprint.json` | 架构图、类图、时序图 | "蓝图"、"工程图" |
| Notion Clean | `notion-clean.json` | 所有类型——通用百搭 | "简洁"、"极简"、"清爽" |
| Glassmorphism | `glassmorphism.json` | AI/Agent 演示、产品发布 | "玻璃"、"毛玻璃"、"现代" |
| Claude Official | `claude-official.json` | 架构图、系统文档 | "暖色"、"专业"、"友善" |
| OpenAI | `openai.json` | 技术文档、API 图 | "简朴"、"极致简约" |

---

## 质量体系

每张图交付前通过强制质量门禁：

| 层级 | 检查方式 | 是否阻断 | 检测内容 |
|------|---------|---------|---------|
| **P0** | `validate.py` 自动 | 是（exit 2） | 悬空边、重复 ID、XML 语法错误 |
| **P1** | `validate.py` 自动 | 是（exit 1） | 节点重叠、边穿越节点、边交叉 |
| **P2** | `validate.py` 自动 | 否（exit 0） | 坐标未对齐网格、连接点偏位、箭头末段过短 |
| **P3** | `audit.js` 启发式 + AI 视觉审计 | 建议修复 | 标签截断、边重叠、Z 序违规、图例遮挡 |

最多 **3 轮自动修复**。超限后 AI 报告剩余问题并询问是否继续。

---

## 开发命令

```bash
# 结构 lint
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --score

# 导出预览 PNG
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio>

# 构建发布包
node skills/xiaosu-draw-ai/scripts/build.js
node skills/xiaosu-draw-ai/scripts/build.js --dry-run          # 预览不写入

# 运行测试
python3 -m pytest tests/unit/
node tests/unit/test_ir_schema.js
node tests/integration/test_golden_regression.js
```

---

## 项目结构

```
xiaosu-draw-ai/
├── README.md / README_CN.md          # 项目概览（英文 + 中文）
├── doc/DESIGN.md                     # 权威设计文档
├── CHANGELOG.md                      # 变更历史
├── CLAUDE.md                         # 开发者修改路由表（中文）
├── LICENSE
│
├── skills/xiaosu-draw-ai/            # Skill 包
│   ├── SKILL.md                      # Agent 行为入口
│   ├── references/                   # 14 份按需加载规则文档
│   ├── templates/                    # 20 个中英文提示词模板
│   ├── styles/                       # JSON Schema + 7 套内置预设
│   ├── scripts/                      # 13 个脚本（校验、导出、构建、安装等）
│   └── data/                         # 结构化数据索引（预留）
│
├── tests/                            # L0-L2 测试套件（单元、集成、E2E、黄金集）
├── .drawio/                          # 开发验证用图
├── .github/workflows/                # CI（4 个 Job）
└── .claude/skills/                   # 构建产物（勿手改）
```

---

## License

MIT
