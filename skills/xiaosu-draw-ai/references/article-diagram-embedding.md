# Template-Driven Document Generation（模板驱动文档生成）

> **When to read:** User provides a template link/article + requirements and asks to generate a new design document.
> Or user provides an article containing `@xiaosu-draw-ai` annotations that need batch diagram generation.
>
> **Core principle:** The template provides structure (outline + diagram type/position hints). The user's requirements provide content. Template images are type hints only — never copy their structure into new diagrams.

---

## @xiaosu-draw-ai Annotation Format

Two usage modes:

### Mode 1: Template annotation（模板标注）

Place alongside example images in a template to tell the Agent what type of diagram belongs at each position. Uses HTML comment syntax — invisible in rendered view, readable by Agent.

```markdown
## 2. 系统架构

<!-- @xiaosu-draw-ai type=系统架构图 layout=TB desc=自上而下分层展示前端→网关→服务→数据 -->

![示例架构图](example-arch.png)

### 2.1 前端层
...
```

```markdown
## 3.1 登录流程

<!-- @xiaosu-draw-ai type=时序图 desc=用户→前端→网关→认证服务→数据库的完整交互 -->

![登录时序示例](example-login-seq.png)

详细流程说明...
```

**Field reference:**

| 字段 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `type=` | ✅ 对于模板 | 图类型，映射到 `diagram-types.md` | `系统架构图`、`时序图`、`ER图`、`流程图`、`部署图`、`类图`、`C4模型`、`状态机`、`网络拓扑`、`数据流图` |
| `layout=` | 否 | 布局方向（当 type 有多种可能时明确指定） | `TB`（上→下）、`LR`（左→右） |
| `desc=` | 否 | 一句话意图说明，帮助 Agent 理解图要表达什么 | `自上而下分层展示前端→网关→服务→数据` |

### Mode 2: Inline diagram request（行内图表请求）

Embed a complete diagram request directly in an article. The `【内容】` block provides explicit spec — Agent generates from this, not from surrounding text.

```markdown
@xiaosu-draw-ai 绘制用户登录时序图
【图类型】时序图
【内容】
1、参与者：用户浏览器、Web 应用（React）、API 网关（Kong）、认证服务、数据库（MySQL）
2、正常流程：用户输入凭证 → POST /login → 网关校验 → 认证服务查库 → 返回 JWT → 登录成功
3、异常分支：密码错误返回 401；账号锁定返回 423；超时 30s 返回 504
【风格】Notion Clean
```

**Field reference:**

| 字段 | 必填 | 说明 |
|------|------|------|
| `@xiaosu-draw-ai 绘制<名>` | ✅ | 调用标记，"绘制"后跟图名，会用作文件名 |
| `【图类型】` | ✅ | 映射到 `diagram-types.md` |
| `【内容】` | ✅ | 结构化描述：1=分层/结构、2=组件列表、3=连接/关系 |
| `【风格】` | 否 | 不填默认 Flat Icon |

Both modes can coexist — a template may use Mode 1 annotations for structure hints, and the generated document may use Mode 2 blocks for the actual diagram specs.

---

## Workflow: Template → New Document

When the user says "用这个模板（link）+ 这些需求，生成一份 XX 设计文档"：

### Step 1: Read the template

1. Fetch template outline: `docs +fetch --scope outline --max-depth 3`
2. Fetch template body: read full document content
3. **Extract all `@xiaosu-draw-ai` annotations**: scan for both HTML comment format (`<!-- @xiaosu-draw-ai ... -->`) and inline request format (`@xiaosu-draw-ai 绘制...`)
4. Build a "template map" — which sections exist, where diagrams should go, what types they are

### Step 2: Show the blueprint

Present to user:

```
我从模板中提取了以下结构（7 个章节，3 个图表位置）：

## 文档大纲
1. 概述
2. 系统架构 ← 这里需要一张「系统架构图」
3. 详细设计
  3.1 登录流程 ← 这里需要一张「时序图」
  3.2 数据模型 ← 这里需要一张「ER图」
4. 部署方案
...

## 图表清单
| # | 位置 | 图类型 | 模板提示 |
|---|------|--------|---------|
| 1 | §2 系统架构 | 系统架构图 | "自上而下分层展示前端→网关→服务→数据" |
| 2 | §3.1 登录流程 | 时序图 | "用户→前端→网关→认证服务→数据库" |
| 3 | §3.2 数据模型 | ER图 | — |

我将使用模板的大纲结构，根据你提供的需求填充正文，并在这 3 个位置生成对应的图。
```

### Step 3: Generate content + diagrams

For each section in order:
1. **Write section text** based on user requirements, following template's heading structure
2. **If section has an `@xiaosu-draw-ai` annotation**: generate the diagram
   - Use `desc=` and surrounding article text to derive diagram content
   - Do NOT copy structure from the template's example image
   - Run validate.py → export → insert
3. **Pipeline selection** per diagram type:
   - sequence/ER/class/state → Pipeline B (Mermaid, insert as ````mermaid` block)
   - architecture/deployment/flowchart/C4/network/data-flow → Pipeline C (hand-write XML, export PNG, upload)

### Step 4: Assemble and deliver

- The new document = template structure + user-driven content + generated diagrams
- Each diagram is inserted at its annotated position
- Deliver the complete new document to the target platform

---

## Workflow: Article text changed, diagrams stale

When the user says "我改了文章内容，帮我更新里面的图"：

### Step 1: Re-read the article

Fetch the current article content (outline + full body).

### Step 2: Find all diagram positions

Scan for:
1. `@xiaosu-draw-ai 绘制...` blocks (Mode 2) — these have explicit `【内容】` specs
2. `<!-- @xiaosu-draw-ai type=... -->` annotations (Mode 1) — these mark diagram positions
3. Existing images/mermaid blocks without annotations — infer type from section heading and context

### Step 3: Detect drift

For each diagram position:

| Annotation type | Drift detection |
|----------------|----------------|
| Mode 2 with `【内容】` | Compare `【内容】` against current article text. If article mentions new components not in `【内容】`, flag: "文章 §3 新增了 Payment Service，但你的图表描述没包含它。要更新吗？" |
| Mode 1 with `type=` | Re-derive diagram content from current article text. `desc=` provides intent but content comes from the article. |
| No annotation (image only) | Read section heading + surrounding text. Extract current system description. Regenerate diagram from current text. |

### Step 4: Regenerate

For each diagram with detected drift (or user confirms update):
1. Derive new content from current article text (or updated `【内容】` block)
2. Regenerate diagram
3. Replace old diagram at same position
4. Report: "已更新 §2 的系统架构图（新增了 Payment Service 节点）"

---

## Batch processing rules

When multiple `@xiaosu-draw-ai` annotations exist in one article:

1. **Scan first, act second** — parse ALL annotations before generating any diagram
2. **Show summary** — list all diagrams to be generated with types and positions
3. **Wait for confirmation** — let user review before generating
4. **Generate sequentially** — one diagram at a time (avoid file conflicts)
5. **Track progress** — "2/3 done — 时序图 ✓，正在生成 ER 图…"
6. **Error per diagram** — if one fails (P0/P1 after 3 fix attempts), mark `⚠️ 失败` and continue
7. **Report results** — summary of all successes and failures

---

## File naming

Deterministic naming derived from the article and diagram position:

| Article | Section | Diagram Type | File |
|---------|---------|-------------|------|
| `design-doc.md` | §2 系统架构 | 架构图 | `.drawio/design-doc-architecture.mmd` |
| `design-doc.md` | §3.1 登录流程 | 时序图 | `.drawio/design-doc-sequence-login.mmd` |

> **Rule:** `<article-basename>-<type-or-section-slug>.ext` — deterministic so re-runs reuse files.
