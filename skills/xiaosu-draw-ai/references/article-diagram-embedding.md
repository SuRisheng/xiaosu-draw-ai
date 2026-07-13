# Template-Driven Document Generation（模板驱动文档生成）

> **When to read:** User provides a template link/article + requirements and asks to generate a new design document.
> Or user provides an article containing `@xiaosu-draw-ai` blocks that need batch diagram generation.
>
> **Core principle:** The document is the specification. Diagrams are generated assets derived from it.
> Template structure provides the outline; template images are context hints — never copy their structure into new diagrams.

---

## How the Agent Reads a Template

When given a template document (Feishu Wiki, Markdown, or Docx), the Agent infers diagram requirements from what's already there. No special annotation syntax is required in most cases.

### Inference priority (from most reliable to least)

| Priority | Template content | What the Agent infers | Reliability |
|----------|-----------------|----------------------|-------------|
| **1** | Mermaid code block (` ```mermaid` ) | Type, structure, nodes, edges — everything. Read the code directly. | ✅ 100% |
| **2** | `.drawio.png` file (with embedded XML) | Run `png-extract.js` → full XML structure. More detail than Mermaid. | ✅ 100% |
| **3** | Section heading text | Infer diagram type from keywords. "系统架构" → architecture, "登录流程" → sequence, "数据模型" → ER, "部署方案" → deployment, etc. | ⚠️ ~90% — works for most cases |
| **4** | Section body text | Infer what the diagram should express. "本系统分为三层：前端、服务、数据" → three-layer architecture with those layers. | ⚠️ ~70% — depends on text clarity |
| **5** | Pure PNG image (no embedded XML) + vision available | Visually identify type ("looks like a layered architecture") and approximate structure. Details will be incomplete. | ⚠️ 60-80% — vision-dependent |
| **6** | Pure PNG image + no vision | Only knows "an image exists here". Cannot determine type or content. | ❌ 0% |

### When the template needs an explicit hint

Only Priority 5 or 6 needs help — when the template has a pure PNG and the section heading/body don't make the diagram type clear. In that case, write a natural-language sentence in the template body (NOT a special syntax):

```markdown
## 3.1 核心设计

> 这里需要一张系统架构图，展示前端、网关、服务、数据四层关系。

![架构图示例](example.png)
```

This sentence serves double duty: it's the template instruction for human authors, AND the Agent reads it to understand what diagram to generate. No new syntax to learn.

**Why not `<!-- HTML comments -->`?** They only work in `.md` files. Feishu Wiki, Docx, and most document formats don't support them.

---

## @xiaosu-draw-ai Inline Diagram Request（行内图表请求）

For articles (not templates) where the user wants to embed an explicit diagram request directly in the text. The `【内容】` block is the primary spec.

```markdown
@xiaosu-draw-ai 绘制用户登录时序图
【图类型】时序图
【内容】
1、参与者：用户浏览器、Web 应用（React）、API 网关（Kong）、认证服务、数据库（MySQL）
2、正常流程：用户输入凭证 → POST /login → 网关校验 → 认证服务查库 → 返回 JWT → 登录成功
3、异常分支：密码错误返回 401；账号锁定返回 423；超时 30s 返回 504
【风格】Notion Clean
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `@xiaosu-draw-ai 绘制<名>` | ✅ | 调用标记，图名用作文件名 |
| `【图类型】` | ✅ | 映射到 `diagram-types.md` 的 10 种类型 |
| `【内容】` | ✅ | 结构化描述：1=分层/结构、2=组件列表、3=连接/关系 |
| `【风格】` | 否 | 不填默认 Flat Icon |

---

## Workflow: Template + Requirements → New Document

```
User says: "用这个模板（link）+ 这些需求，生成一份 XX 设计文档"
  │
  ├─ Step 1: Read template
  │     Fetch outline + full body
  │     For each section:
  │       Priority 1: Mermaid blocks → read type + structure directly
  │       Priority 2: .drawio.png → png-extract.js → XML structure
  │       Priority 3: Section heading → infer diagram type
  │       Priority 4: Section body → infer intent
  │       Priority 5-6: Pure PNG → if type unclear from context, use natural text hint
  │     Build template map: sections, diagram positions, inferred types
  │
  ├─ Step 2: Show blueprint
  │     "模板有 7 个章节，我识别到 3 个图表位置：
  │      §2 系统架构 → 架构图（从标题推断）
  │      §3.1 登录流程 → 时序图（从标题推断）
  │      §3.2 数据模型 → ER 图（模板正文有明确提示）"
  │     Wait for user confirmation
  │
  ├─ Step 3: Generate section by section
  │     Write text from user requirements (follow template structure)
  │     At each diagram position:
  │       Derive content from user requirements + surrounding text
  │       Do NOT copy structure from template's example images
  │       Pipeline B (sequence/ER/class/state) → ```mermaid block
  │       Pipeline C (architecture/deployment/flowchart/C4/network/data-flow) → export PNG, upload
  │       Run validate.py → insert at position
  │
  └─ Step 4: Deliver complete document
        Template structure + user content + generated diagrams
```

---

## Workflow: Article Text Changed → Diagrams Stale

```
User says: "文章内容改了，帮我更新里面的图"
  │
  ├─ Step 1: Re-read current article
  │
  ├─ Step 2: Find all diagram sources
  │     Priority 1: @xiaosu-draw-ai blocks → explicit 【内容】, check for drift vs article text
  │     Priority 2: ```mermaid blocks → read code, compare with current article text
  │     Priority 3: Images (PNG/drawio.png) without source → infer from surrounding text
  │
  ├─ Step 3: Detect drift
  │     Compare diagram content with current article text
  │     Flag mismatches: "§2 文字新增了 Payment Service，但架构图里没有"
  │
  └─ Step 4: Regenerate drifted diagrams
        Report: "已更新 §2 架构图（新增 Payment Service 节点）"
```

---

## Batch Processing Rules

When multiple diagram positions exist in one article:

1. **Scan first, act second** — parse ALL positions before generating
2. **Show summary** — list types, positions, and how each was inferred
3. **Wait for confirmation** — user reviews before generation
4. **Generate sequentially** — one at a time, avoid file conflicts
5. **Track progress** — "2/3 done — 时序图 ✓，正在生成 ER 图…"
6. **Error per diagram** — 3 fix attempts, then mark `⚠️ 失败` and continue
7. **Report results** — summary of successes and failures

---

## File Naming

Deterministic naming from article + position:

| Article | Section | Type | File |
|---------|---------|------|------|
| `design-doc.md` | §2 系统架构 | 架构图 | `.drawio/design-doc-architecture.mmd` |
| `design-doc.md` | §3.1 登录流程 | 时序图 | `.drawio/design-doc-sequence-login.mmd` |

> **Rule:** `<article-basename>-<type-or-section-slug>.ext` — deterministic so re-runs reuse files.
