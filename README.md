**中文** | [English](README_EN.md)

---

# xiaosu-draw-ai

> 通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。

**从自然语言描述生成生产级架构图、时序图、ER 图、流程图、部署图、类图、C4、状态机、网络拓扑、数据流图。**

**版本：** 1.0.0 &nbsp;|&nbsp; **协议：** MIT &nbsp;|&nbsp; [:blue_book: 设计文档](doc/DESIGN.md)

---

## 关于

xiaosu-draw-ai 是一个 AI 驱动的制图 Skill，将自然语言转化为可编辑的 `.drawio` 文件。基于 draw.io 桌面版 CLI，支持 **10 种图类型**、**3 条渲染管道**：数据驱动导入（SQL→ER、OpenAPI→架构图）、Mermaid 转换（`.mmd`→`.drawio`）、AI 手写 XML（完整布局控制）。每张图通过**强制质量门禁**：结构校验（P0-P2）、启发式视觉审计（P3）、AI 视觉自检。

Skill 以单个目录打包分发——复制或符号链接到任意 Agent 的 skills 目录即可。无需 API Key、无平台锁定。输出为标准 `.drawio` XML，可在 draw.io 桌面版、VS Code 或任何 MXGraph 编辑器中继续编辑。

---

## 功能一览

| 功能 | 说明 |
|------|------|
| **自然语言制图** | 中/英文描述即可，支持 10 种图类型，含 20 个中英文引导模板 |
| **双管道自动路由** | B：Mermaid 转换（.mmd→.drawio，源码保留）；C：AI 手写 XML（布局全控）。SQL/OpenAPI 源文件走 importer 辅助解析 → 管道 C |
| **7 套视觉风格** | Flat Icon（默认）/ Dark Terminal / Blueprint / Notion Clean / Glassmorphism / Claude Official / OpenAI，含 7 种语义箭头 |
| **P0-P3 质量门禁** | 自动结构校验 + 视觉审计 + AI 自检，预览/最终导出分离，最多 3 轮自动修复 |
| **已有图增量修改** | .mmd 源编辑→重新转换；.drawio XML 解析→精确编辑；.drawio.png 提取嵌入 XML；Agent 按名自动搜索；文档内嵌 Mermaid 代码块编辑 |
| **模板驱动文档生成** | 基于文档模板推断图表位置 → 逐章生成正文 + 对应图 → 交付完整文档 |
| **跨平台交付** | Windows / macOS / Linux 统一 draw.io CLI 导出；CLI 路径自动检测（一般无需手动配置 PATH） |

---

## 支持的图类型

| 图类型 | 中文触发词 | English Trigger | 默认管道 | 布局方向 |
|--------|-----------|----------------|---------|---------|
| **系统架构图** | "架构图", "系统设计" | "architecture", "microservices" | C | 自上而下分层 |
| **时序图** | "时序图", "交互流程" | "sequence diagram" | B（Mermaid 优先） | 左→右，时间↓ |
| **ER 图** | "ER图", "数据库设计" | "ER diagram" | B（Mermaid 优先） | 散布，最小交叉 |
| **流程图** | "流程图", "业务流程" | "flowchart", "workflow" | C | 上→下，分支展开 |
| **部署图** | "部署图", "基础设施" | "deployment" | C | 穿越安全域 |
| **UML 类图** | "类图", "对象模型" | "class diagram" | B（Mermaid 优先） | 继承↓，关联→ |
| **C4 模型** | "C4", "容器图" | "C4", "container" | C | Person→System→External |
| **状态机** | "状态机", "状态迁移" | "state machine" | B（Mermaid 优先） | 左→右状态迁移 |
| **网络拓扑** | "网络拓扑", "拓扑图" | "network", "topology" | C | 穿越网络区域 |
| **数据流图** | "数据流", "DFD" | "data flow", "pipeline" | C | 上→下管道 |

> **管道说明：** 结构优先型图（时序/ER/类图/状态机）默认走 Mermaid 转换（需 draw.io CLI ≥ v30），布局优先型图走 AI 手写 XML。用户说"精美/好看/beautiful"时自动切换为管道 C（完整视觉控制）。

**描述建议（结构化模板）：**

```
【图类型】系统架构图
【内容】
1、3 个分层：前端层、服务层、数据层。
2、前端层：React Web + Flutter App；服务层：用户、订单、商品、支付服务；数据层：MySQL + Redis。
3、前端→API 网关（Kong，HTTPS）、网关→各服务（REST）、服务→数据库（读写）、支付→Stripe（外部）。
【风格】Flat Icon 或 Notion Clean
```

<details>
<summary><b>📷 10 类图效果示例（点击展开）</b></summary>

<table>
<tr>
<td width="50%" align="center"><b>系统架构图</b><br><img src="doc/img/architecture-ecommerce.png" alt="电商微服务架构图示例"></td>
<td width="50%" align="center"><b>时序图</b><br><img src="doc/img/sequence-login.png" alt="用户登录时序图示例"></td>
</tr>
<tr>
<td align="center"><b>ER 图</b><br><img src="doc/img/er-blog.png" alt="博客系统 ER 图示例"></td>
<td align="center"><b>流程图</b><br><img src="doc/img/flowchart-order.png" alt="订单处理流程图示例"></td>
</tr>
<tr>
<td align="center"><b>部署图</b><br><img src="doc/img/deployment-aws.png" alt="AWS 基础设施部署图示例"></td>
<td align="center"><b>UML 类图</b><br><img src="doc/img/class-vehicle-rental.png" alt="车辆租赁 UML 类图示例"></td>
</tr>
<tr>
<td align="center"><b>C4 模型</b><br><img src="doc/img/c4-internet-banking.png" alt="网银系统 C4 上下文图示例"></td>
<td align="center"><b>状态机</b><br><img src="doc/img/statemachine-order.png" alt="订单状态机示例"></td>
</tr>
<tr>
<td align="center"><b>网络拓扑</b><br><img src="doc/img/network-corporate.png" alt="企业网络拓扑图示例"></td>
<td align="center"><b>数据流图</b><br><img src="doc/img/dataflow-etl.png" alt="ETL 管道数据流图示例"></td>
</tr>
</table>

</details>

---

## 视觉风格

不需要你懂配色。在描述里加一两个关键词即可，AI 根据关键词查表匹配风格预设，生成 XML 时逐节点查表填充——**不是凭感觉配色**。

| 风格 | 中文触发词 | English Trigger | 视觉效果 |
|------|-----------|----------------|---------|
| **Flat Icon**（默认） | （不指定） | *(none)* | 白底、蓝色主色调、圆角矩形 |
| **Dark Terminal** | "深色", "暗色", "终端" | "dark", "terminal" | 深黑蓝底、霓虹色、等宽字体 |
| **Blueprint** | "蓝图", "工程图" | "blueprint" | 深蓝底、白/青色线条、直角矩形 |
| **Notion Clean** | "简洁", "极简", "清爽" | "clean", "minimal" | 白底、低饱和灰、大量留白 |
| **Glassmorphism** | "玻璃", "毛玻璃", "现代" | "glass", "frosted" | 深色渐变底、磨砂填充、层次感 |
| **Claude Official** | "暖色", "专业", "友善" | "claude style", "warm" | 暖白底、柔阴影、Anthropic 色系 |
| **OpenAI** | "极简", "简朴" | "openai style", "spartan" | 白底极致简约、细线框、品牌绿 |

<details>
<summary><b>📷 风格效果示例（点击展开）</b></summary>

<table>
<tr>
<td width="50%" align="center"><b>Flat Icon</b>（默认）<br><img src="doc/img/style-flat-icon.png" alt="Flat Icon 风格示例"></td>
<td width="50%" align="center"><b>Blueprint</b><br><img src="doc/img/style-blueprint.png" alt="Blueprint 风格示例"></td>
</tr>
<tr>
<td align="center"><b>Notion Clean</b><br><img src="doc/img/style-notion-clean.png" alt="Notion Clean 风格示例"></td>
<td align="center"><b>Glassmorphism</b><br><img src="doc/img/style-glassmorphism.png" alt="Glassmorphism 风格示例"></td>
</tr>
<tr>
<td align="center"><b>Claude Official</b><br><img src="doc/img/style-claude-official.png" alt="Claude Official 风格示例"></td>
<td align="center"><b>OpenAI</b><br><img src="doc/img/style-openai.png" alt="OpenAI 风格示例"></td>
</tr>
</table>

*Dark Terminal 为深色变体，布局参考 Blueprint。*

</details>

### 自定义样式

每个样式 JSON 包含 7 个字段：

| 字段 | 作用 | 示例 |
|------|------|------|
| `palette` | 7 色调色板（primary/success/warning/accent/danger/neutral/secondary） | `"primary": {"fillColor": "#dae8fc", "strokeColor": "#6c8ebf"}` |
| `roles` | 语义角色 → 调色板槽位映射 | `"database": "success"` |
| `shapes` | 形状种类 → draw.io style 字符串 | `"database": "shape=cylinder3;..."` |
| `font` | 字体、字号、标题加粗 | `"fontFamily": "Helvetica", "fontSize": 12` |
| `edges` | 边默认样式 + 箭头类型 | `"style": "edgeStyle=orthogonalEdgeStyle;..."` |
| `extras` | 全局设置（背景色、线宽、圆角） | `"background": "#FFFFFF", "globalStrokeWidth": 1` |
| `bestFor` | 推荐使用的图类型 | `["architecture", "er", "flowchart"]` |

**创建新样式（5 步）：** ① 复制 `styles/built-in/flat-icon.json` → ② 修改 `palette` 各槽位颜色 → ③ 调整 `roles` 映射 → ④ Schema 校验 → ⑤ 在 `references/style-presets.md` 与 `SKILL.md` 样式选择表中注册。

**快速改色：** 只需修改一个槽位即可全局生效。例如把所有数据库节点改为紫色：

```json
"palette": { "success": { "fillColor": "#f3e5f5", "strokeColor": "#7b1fa2" } }
```

AI 查表路径：`roles.database → "success" → palette.success`，无需改脚本。完整查表协议见 `skills/xiaosu-draw-ai/references/style-presets.md`。

---

## 安装

### 环境要求

| 工具 | 最低版本 | 用途 | 安装方式 |
|------|---------|------|---------|
| [draw.io 桌面版](https://www.drawio.com/) | ≥ 24.0.0 | CLI 导出引擎（PNG/SVG/PDF） | 官网下载；macOS 可 `brew install --cask drawio` |
| [Python 3](https://www.python.org/downloads/) | ≥ 3.8 | 结构校验（validate.py） | 官网下载 |
| [Node.js](https://nodejs.org/) | ≥ 14.0 | 导出、构建、审计、安装脚本 | 官网下载 |

**验证环境：**

```bash
drawio --version    # 或 draw.io --version
python3 --version
node --version
```

> `export.js` 已实现跨平台 CLI 自动检测（含 Windows 默认安装目录）——一般无需手动配置 PATH。

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
# 1. 构建发布包
node skills/xiaosu-draw-ai/scripts/build.js

# 2. 复制到 Agent 的 skills 目录
# macOS / Linux
cp -r .claude/skills/xiaosu-draw-ai ~/.claude/skills/xiaosu-draw-ai

# Windows (PowerShell)
Copy-Item -Recurse .\.claude\skills\xiaosu-draw-ai $env:USERPROFILE\.claude\skills\xiaosu-draw-ai
```

> **不要只复制 `SKILL.md`**——`references/`、`scripts/`、`styles/`、`templates/` 必须与 `SKILL.md` 同级保留。通用 Agent 平台同理：把整个 `skills/xiaosu-draw-ai/` 目录作为 Skill 目录安装。

### 一键安装

如果已有 AI 工具（如 Claude Code），可直接对话安装：

```
请安装 xiaosu-draw-ai 技能
```

AI 会自动运行 `install.js`，引导完成环境检查和技能安装：

```bash
node skills/xiaosu-draw-ai/scripts/install.js                      # 交互式安装
node skills/xiaosu-draw-ai/scripts/install.js --check              # 仅检查先决条件
node skills/xiaosu-draw-ai/scripts/install.js --agent claude-code  # 指定 Agent 类型
```

---

## 修改已有图

Agent 会自动判断图的**源格式**并选择编辑策略——不同格式修改方式完全不同。

### 一、Mermaid 源格式 —— 编辑源文件，重新生成

Mermaid 图的**可编辑源**是 `.mmd` 文件或文档中的 mermaid 代码块，**不是**生成的 `.drawio`。

| 场景 | 操作 | 说明 |
|------|------|------|
| 给了 `.mmd` 文件 + 修改要求 | 编辑 `.mmd` → 重新转换 → validate → export | ⭐ **最推荐**：源码修改，结构清晰，可 diff |
| 图嵌在 Wiki / Markdown 的 mermaid 代码块里 | 在文档中直接编辑代码块 → 重新转换生成图 | ⭐ 文档即单一事实来源，无需单独 `.mmd` |
| 只说"修改 XX 图"没给文件 | Agent 自动搜索同名 `.mmd` → 编辑源文件 | Agent 按名搜索 |
| `.drawio` 含 `<UserObject>`（Mermaid 生成） | ⚠️ 直接改 XML **脆弱且下次转换会覆盖**，建议先重建 `.mmd` 源 | 不推荐直接改 XML |

```bash
# 1. 编辑 .mmd 文件（或文档中的 Mermaid 代码块）
# 2. 重新转换
node skills/xiaosu-draw-ai/scripts/mermaid-convert.js diagram.mmd --output diagram.drawio
# 3. 校验 + 导出
python3 skills/xiaosu-draw-ai/scripts/validate.py diagram.drawio
node skills/xiaosu-draw-ai/scripts/export.js diagram.drawio --final
```

### 二、draw.io 手写格式 —— 直接编辑 XML

手写 `.drawio` 的 XML 本身就是源文件：

```bash
# AI 解析结构 → 展示节点/边摘要 → 精确编辑 XML → 校验 → 导出
node skills/xiaosu-draw-ai/scripts/xml-parser.js diagram.drawio --json
```

### 三、从 PNG 提取（`--final` 导出的 `.drawio.png`）

```bash
node skills/xiaosu-draw-ai/scripts/png-extract.js diagram.drawio.png --output temp.drawio
```

> 普通 PNG（无嵌入 XML）无法提取源数据：① 找到原始 `.drawio` / `.mmd`，或 ② 让 Agent 看图重新绘制。

### 修改后的质量保证

无论哪种修改方式，Agent 都会自动执行完整质量门禁：结构校验（validate.py P0-P2）→ 视觉审计（audit.js P3）→ 导出预览确认 → 最终交付 `.drawio` + `.drawio.png`（嵌入可编辑源）+ `.mmd`（Mermaid 格式时保留）。

---

## 模板驱动文档生成

两种方式把图和文档结合起来。

### 方式一：模板 + 需求 → 一键生成文档

给 AI 一个设计文档模板（飞书 Wiki / Markdown / Docx 都支持）+ 需求，**AI 会自己从模板已有内容推断需要什么图**：

| 模板里有什么 | AI 怎么推断 | 准确度 |
|-------------|------------|--------|
| mermaid 代码块 | 直接读代码，类型、结构全知道 | ✅ 最可靠 |
| `.drawio.png` 文件 | 提取嵌入的 XML 源文件 | ✅ 最可靠 |
| 章节标题"系统架构" | 推断这里需要架构图 | ⚠️ 通常够用 |
| 章节标题"登录流程" | 推断这里需要时序图 | ⚠️ 通常够用 |
| 正文"分为三层：前端、服务、数据" | 推断分层结构和组件 | ⚠️ 取决于文字清晰度 |

只有在标题和正文都无法判断时，才需要在模板里写一句提示（本来就是写给人看的）：

```markdown
## 3.1 核心设计

> 这里需要一张系统架构图，展示前端、网关、服务、数据四层关系。
```

**使用示例：**

> "用这个模板（链接）+ 以下需求，生成一份电商系统设计文档。前端 React + iOS，网关 Kong，后端用户服务、订单服务、商品服务，数据库 MySQL + Redis。"

AI 会：读模板 → 展示蓝图（"模板 7 个章节，3 个图表位置…"）→ 逐章生成 → 交付完整文档。

### 方式二：在文章中写图表请求

在需要插图的位置插入 `@xiaosu-draw-ai` 标注块：

```markdown
@xiaosu-draw-ai 绘制用户登录时序图
【图类型】时序图
【内容】
1、参与者：浏览器、Web 应用、API 网关、认证服务、数据库
2、正常流程：输入凭证 → POST /login → 校验 → 查库 → 返回 JWT → 成功
3、异常分支：密码错误返回 401；账号锁定返回 423
【风格】Notion Clean
```

然后对 AI 说"帮我把文章里的图都生成出来"。一篇文章里可以有多个图表请求，AI 会先全部扫描列清单 → 你确认 → 逐个生成：

```
我在文章中找到了 3 个图表请求：

| # | 图名 | 图类型 | 位置 |
|---|------|--------|------|
| 1 | 电商系统架构图 | 系统架构图 | §2 系统架构 |
| 2 | 用户登录时序图 | 时序图 | §3.1 登录流程 |
| 3 | 订单状态机 | 状态机 | §3.2 订单流转 |

确认后我将逐一生成并插入对应位置。
```

### 文章内容改了怎么更新图？

不需要手动改图，对 AI 说：

> "文章内容改了，帮我更新里面的图。"

AI 会重读当前文章，对比原来的图，提示哪里不匹配并重新生成。比如"§2 的文字里多了 Payment Service，但架构图里没有，要更新吗？"

---

## 新增图类型与模板

模板是 Markdown 文件，位于 `skills/xiaosu-draw-ai/templates/{zh|en}/`，用于引导 AI 完成需求澄清。

**新增图类型（3 步）：**

1. **创建模板文件**——在 `templates/{zh|en}/` 下创建 `<类型名>.md`，包含：这是什么图 / 适用场景 / 你怎么描述 / 示例 / **约束段**（布局间距、形状、边、颜色的具体值）
2. **添加类型预设**——在 `references/diagram-types.md` 新增章节：形状推荐（node kind → shape style）、颜色分配（role → palette slot）、布局方向与间距、边样式与箭头语义
3. **注册到 SKILL.md**——在模板对话表中加入新类型的触发词、模板路径和管道

**修改已有模板：** 直接编辑对应模板的 `## 约束` 段。关键原则：

- 写具体 px 值，不写"合适的间距"
- 写具体 shape 名称（如 `shape=cylinder3`），不写"数据库形状"
- 写具体颜色引用（如 `fillColor=#dae8fc`），不写"蓝色"

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

## 与 drawio-skill 对比

**相同指令：** 根据以下信息绘制一张架构图

> 1、一个简单的音乐 app，有 3 个部分：app + 用户 + 云端服务
> 2、app 包含登录、首页展示、曲库、分类、搜索、播放器、收藏、设置模块
> 3、云端服务包含推荐管理、曲库管理、搜索服务、用户信息管理

| 维度 | xiaosu-draw-ai | drawio-skill |
|------|----------------|--------------|
| **定位** | 面向自然语言用户，会追问、会审图、会交付 | 面向 AI Agent 的通用制图工具箱 |
| **用户交互** | 模板引导澄清 → IR 摘要确认 → 生成 → 自动验证 → 交付 | 直接生成，Agent 自行判断质量 |
| **质量门禁** | P0-P3 强制门禁（结构+布局+视觉），最多 3 轮修复 | 基础验证，无分层审计 |
| **风格系统** | 7 套 JSON 预设，查表驱动 | 颜色主题，采样匹配 |
| **管道** | A（数据驱动）+ B（Mermaid）+ C（AI 手写 XML），自动路由 | 单一 AI 手写管道 |
| **视觉审计** | visual-audit.md 决策表（10 条 P3 规则，see→fix→XML 示例） | 无 |
| **模板** | 20 个中英文模板，含引导问题和实化约束 | 无模板体系 |
| **输出** | `.drawio` + 预览 PNG + 最终 `.drawio.png`（嵌入可编辑源） | `.drawio` + PNG |

**效果对比（音乐 App 架构图）：**

<table>
<tr>
<td width="50%" align="center"><b>xiaosu-draw-ai</b><br><img src="doc/img/compare-music-xiaosu.png" alt="xiaosu-draw-ai 音乐 App 架构图"></td>
<td width="50%" align="center"><b>drawio-skill</b><br><img src="doc/img/compare-music-drawio-skill.png" alt="drawio-skill 音乐 App 架构图"></td>
</tr>
</table>

**效果对比（应用商店功能架构图）：**

<table>
<tr>
<td width="50%" align="center"><b>xiaosu-draw-ai</b><br><img src="doc/img/compare-appstore-xiaosu.png" alt="xiaosu-draw-ai 应用商店功能架构图"></td>
<td width="50%" align="center"><b>drawio-skill</b><br><img src="doc/img/compare-appstore-drawio-skill.png" alt="drawio-skill 应用商店功能架构图"></td>
</tr>
</table>

**核心差异：** xiaosu-draw-ai 在通用工具箱的基础上增加了"用户交互层"（模板 + IR 摘要确认）和"质量闭环"（P0-P3 + 视觉审计决策表），更像一个"会追问、会审图、会交付"的制图助理。

---

## Token 消耗参考

| 指标 | 简单图（16 节点，7 边）| 复杂图（59 节点，30 边）|
|------|----------------------|------------------------|
| 输入 Token | ~26,000 | ~26,000 |
| 输出 Token | ~8,000 | ~8,000 |
| 耗时 | ~2 分钟 | ~5 分 30 秒 |
| 管道 | C | C（Python 脚本） |
| 估算成本（Opus 4.8）| ~$0.20 | ~$0.33 |

> 输入 Token 主要来自按需加载的规则文件（SKILL.md + xml-authoring.md + rules.md + 风格 JSON），已按工作流阶段分批读取。说"benchmark"或"统计性能"可获取精确 session 数据（`benchmark.md` 流程）。实际消耗因图复杂度、缓存命中率和对话上下文而异。

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
├── README.md / README_EN.md
├── CLAUDE.md                         # 开发者修改路由表
├── LICENSE
│
├── doc/                              # 设计文档 + README 配图
│   ├── DESIGN.md
│   └── img/
│
├── skills/xiaosu-draw-ai/            # Skill 包
│   ├── SKILL.md                      # Agent 行为入口
│   ├── references/                   # 12 份按需加载规则文档
│   ├── templates/                    # 20 个中英文提示词模板
│   ├── styles/                       # JSON Schema + 7 套内置预设
│   ├── scripts/                      # 12 个脚本（校验、导出、构建等）
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
