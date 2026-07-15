# xiaosu-draw-ai 开发指南

> 通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。
>
> 技能文件位于 `skills/xiaosu-draw-ai/`，项目级文件位于根目录。

## 技能路由规则（最高优先级，先于所有其他操作）

> **硬门：当用户消息包含以下任一模式，必须立即调用 `Skill("xiaosu-draw-ai")`，
> 不得先做其他操作（包括读取文档、编辑文件、分析内容）。**

| 触发模式 | 匹配条件 | 示例 |
|----------|---------|------|
| `.drawio` 文件 | 消息中出现 `.drawio` 路径或文件名 | "修改 .drawio/xxx.drawio"、"mediax-arch.drawio" |
| `.mmd` 文件 | 消息中出现 `.mmd` 路径或文件名 | "编辑 sequence.mmd" |
| 制图动词 | 绘制、画、重绘、重新绘制、重画、创建、生成、修改、编辑 + 图相关上下文 | "画一张架构图"、"重绘时序图" |
| 图类型名词 | 架构图、流程图、时序图、ER图、部署图、类图、C4图、状态机、网络拓扑、数据流图 | "帮我做一张系统架构图" |
| 导出图 | 导出 + PNG/SVG/PDF + 图上下文 | "导出为 PNG" |

**违反此规则 = 流程错误**：跳过技能意味着跳过 quality gates（validate.py → export → visual audit），产出未经校验的 XML。

## 记忆写入规则（最高优先级，与技能路由同级）

> **硬门：当用户消息包含以下任一模式，必须在回复末尾执行记忆写入操作，
> 不得"下次再说"或"疏忽了"。**

| 触发模式 | 匹配条件 | 动作 |
|----------|---------|------|
| 阶段性总结 | "阶段性总结""总结一下""做个总结""阶段性" | 扫描本次会话内容 → 提取新规则/新发现/关键决策 → 写入 `memory/` 目录 |
| 记住/记忆 | "记住这个""记下来""保存到 memory""写入记忆" | 立即将用户指定的事实写入 `memory/` 目录 |
| 会话结束 | "下次继续""下次再说""先到这""结束" | 检查本会话是否有未写入 memory 的新发现，如有则提示用户是否需要保存 |

**记忆文件规范：**
- 路径：`memory/<kebab-case-slug>.md`
- 格式：frontmatter（name/description/metadata）+ markdown body
- 必须包含 **Why** 和 **How to apply** 段（feedback/project 类型）
- 写入后必须更新 `memory/MEMORY.md` 索引
- 不要保存 repo 已有信息（代码结构、git 历史、CLAUDE.md 内容）

**自我检查（每次回复末尾执行）：**
- 本回复是否涉及新规则创建、规则修改、关键设计决策、对抗性审查发现？
- 如果是 → 这些内容是否已存在于 `memory/` 目录？
- 如果否 → 写入。

**违反此规则 = 知识流失**：下次会话无法从 memory 恢复上下文，重复踩坑。

## 修改路由表

改什么动哪里，AI 和人都能准确识别：

| 你要做什么 | 改这里 | 说明 |
|-----------|--------|------|
| 改技能路由触发 | `CLAUDE.md` → 技能路由规则 | 加触发模式、匹配条件（防模型跳过 Skill 调用） |
| 改技能 description / 关键词 | `skills/xiaosu-draw-ai/SKILL.md` frontmatter | 意图匹配面（软信号），改后需 `node scripts/build.js` |
| 加图类型 | `skills/xiaosu-draw-ai/templates/` + `skills/xiaosu-draw-ai/references/diagram-types.md` | 模板 + 类型预设 |
| 加规则 / 改规则 | `skills/xiaosu-draw-ai/references/rules.md` | P0-P3 像素级规则体系 |
| 改导出行为 | `skills/xiaosu-draw-ai/scripts/export.js` | CLI 导出封装（PNG/SVG/PDF 预览+最终） |
| 改 Mermaid 转换 | `skills/xiaosu-draw-ai/scripts/mermaid-convert.js` | Pipeline B：Mermaid → draw.io CLI 转换 + 版本检测 |
| 改边路由算法 | `skills/xiaosu-draw-ai/scripts/router.js` | 正交路由引擎 + 并行边分布（R031/R033 自动修复） |
| 改数据导入 | `skills/xiaosu-draw-ai/scripts/importers/` | Pipeline A：sql2er（SQL→ER）+ openapi2arch（OpenAPI→架构图） |
| 改图解析 | `skills/xiaosu-draw-ai/scripts/xml-parser.js` + `skills/xiaosu-draw-ai/scripts/png-extract.js` | 已有图修改入口：XML→JSON 结构 + PNG 嵌入 XML 提取 |
| 改稠密图策略 | `skills/xiaosu-draw-ai/references/dense-diagram-simplification.md` | 节点≥15 时合并/拆分/容器化/边捆绑 5 策略 |
| 改 Managed Agents | `skills/xiaosu-draw-ai/references/managed-agents-adaptation.md` | Phase 5 云端 Agent 适配指南 |
| 改审计 / 加规则检测 | `skills/xiaosu-draw-ai/scripts/validate.py` | 结构 lint + P0-P2 审计 |
| 改视觉审计 | `skills/xiaosu-draw-ai/scripts/audit.js` + `skills/xiaosu-draw-ai/references/visual-audit.md` | P3 启发式检查 + AI 视觉审计决策表 |
| 改视觉风格/样式预设 | `skills/xiaosu-draw-ai/styles/schema.json` + `skills/xiaosu-draw-ai/styles/built-in/*.json` + `skills/xiaosu-draw-ai/references/style-presets.md` | 颜色/样式预设 + 样式注册表 + 兼容矩阵 |
| 改安装流程 | `skills/xiaosu-draw-ai/scripts/install.js` | 跨平台安装器 |
| 改 AI 工作流 | `skills/xiaosu-draw-ai/SKILL.md` | Agent 工作流指令 |
| 改打包流程 | `skills/xiaosu-draw-ai/scripts/build.js` | 打包构建 |
| 加测试 | `tests/` | 测试用例 |
| 改安装说明 | `README.md` + `README_CN.md` | 给人看的项目说明（英文 + 中文） |

## 开发命令速查

```bash
# 结构 lint
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio>           # 基础检查
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --strict  # 严格模式
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --score   # 可读性评分
python3 skills/xiaosu-draw-ai/scripts/validate.py <file.drawio> --json    # JSON 输出

# 视觉审计
node skills/xiaosu-draw-ai/scripts/audit.js <file.drawio>                  # 全部检查（含 validate.py + P3 启发式）
node skills/xiaosu-draw-ai/scripts/audit.js <file.drawio> --json           # JSON 输出
node skills/xiaosu-draw-ai/scripts/audit.js <file.drawio> --score          # 可读性评分

# CLI 导出
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio>                  # 预览导出
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio> --final          # 最终导出（嵌入源文件）
node skills/xiaosu-draw-ai/scripts/export.js <file.drawio> --format svg     # SVG 格式

# 安装
node skills/xiaosu-draw-ai/scripts/install.js                               # 交互式安装
node skills/xiaosu-draw-ai/scripts/install.js --agent claude-code           # 指定 Agent 安装
node skills/xiaosu-draw-ai/scripts/install.js --check                       # 仅检查先决条件

# 打包
node skills/xiaosu-draw-ai/scripts/build.js                                 # 打包到 .claude/skills/xiaosu-draw-ai/
```

## 测试流程

```
L0: 单元测试（无外部依赖）
  python3 -m pytest tests/unit/

L1: 集成测试（需要 draw.io CLI）
  node tests/integration/test_export.js
  node tests/integration/test_golden_regression.js
  node tests/integration/test_mermaid_convert.js

L2: 端到端测试（仅人工触发）
  node tests/e2e/test_full_workflow.js
```

## 测试触发规则

> **改了代码必须先跑测试，再提交。** 对照下表确定要跑哪些。

| 你改了什么文件 | 必须运行的测试 | 原因 |
|---------------|---------------|------|
| `scripts/validate.py` | `pytest tests/unit/test_validate.py -v` + `node tests/integration/test_golden_regression.js` | 核心解析逻辑变更 + 回归保护 |
| `scripts/mermaid-convert.js` | `node tests/integration/test_mermaid_convert.js` | Pipeline B 入口，4/10 图类型依赖 |
| `scripts/export.js` | `node tests/integration/test_export.js` | 导出管道，影响所有图 |
| `scripts/router.js` | `node tests/unit/test_router.js` | 边路由引擎 |
| `scripts/audit.js` | `node tests/unit/test_audit.js` | P3 视觉审计 |
| `scripts/importers/*.js` | `node tests/integration/test_pipeline_a.js` | Pipeline A 导入器 |
| `scripts/xml-parser.js` | `pytest tests/unit/test_validate.py -v`（UserObject 测试） | XML 解析变更影响验证 |
| `scripts/png-extract.js` | 暂无自动化测试（需手动验证） | — |
| `scripts/build.js` | 手动跑 `node scripts/build.js --dry-run` | 暂无自动化测试 |
| `references/rules.md`（新增/修改规则）| `pytest tests/unit/test_validate.py -v` | 规则定义应与检测实现同步 |
| `styles/built-in/*.json` | `node tests/integration/test_golden_regression.js` | 视觉效果回归 |
| `.drawio/type/*.drawio`（新增/修改示例图）| `node tests/integration/test_golden_regression.js --update` | 更新 golden 基线 |
| `templates/` | 无需测试（纯提示模板） | — |

**一次性全量验证（提交前推荐）：**
```bash
python3 -m pytest tests/unit/ -v && \
  node tests/integration/test_cli_detect.js && \
  node tests/integration/test_mermaid_convert.js && \
  node tests/integration/test_export.js && \
  node tests/integration/test_golden_regression.js
```

## 语言策略

| 层面 | 语言 | 理由 |
|------|------|------|
| SKILL.md | 英文 | token 效率高、全球 Agent 兼容 |
| references/ | 英文 | 开源社区惯例 |
| templates/zh/ | 中文 | 目标用户中文描述 |
| CLAUDE.md | 中文 | 开发者自己看 |
| README.md | 英文 | 搜索可见性 |
| README_CN.md | 中文 | 中文用户阅读 |

## 目录结构

```
xiaosu-draw-ai/
  skills/
    xiaosu-draw-ai/          # 技能文件（与 drawio-skill 参考格式一致）
      SKILL.md               # Agent 工作流指令
      data/                  # 结构化 JSON 数据文件
      references/            # 规则手册 & 编写指南
      scripts/               # validate.py, audit.js, export.js, build.js, install.js, mermaid-convert.js, router.js, utils.js
        importers/            # ir-importer.js, sql2er.js, openapi2arch.js（管道 A）
      styles/                # schema.json + built-in/（7 个预设 JSON）
      templates/             # 提示模板（zh/ + en/）
  tests/                     # 测试套件（L0-L3）
  .drawio/                   # 自举图与开发验证图
  .github/workflows/         # CI
  .claude/skills/             # 构建产物（勿手改）
  doc/DESIGN.md               # 权威设计依据（本文件）
  CLAUDE.md                  # 开发指南（本文件）
  README.md                  # 项目门面
  README_CN.md               # 项目门面（中文）
  CHANGELOG.md               # 变更历史
  LICENSE
```
> 版本号以 `skills/xiaosu-draw-ai/SKILL.md` frontmatter 为唯一源。

## Phase 4 范围

当前实现**全部 3 条管道**：
- **管道 C**（AI 手写 XML）：完整质量门禁（validate.py P0-P2 + audit.js P3 启发式 + visual-audit.md 决策表）、10 类图模板（zh/en）、7 套风格预设、Arrow Semantics
- **管道 B**（Mermaid 转换）：mermaid-convert.js + CLI v30 版本检测，支持 sequence/ER/class/state machine 等结构优先型图
- **管道 A**（数据驱动）：sql2er（SQL→ER）、openapi2arch（OpenAPI→架构图），含 ir-importer 接口
