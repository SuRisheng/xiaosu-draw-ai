# xiaosu-draw-ai 开发指南

> 通用 AI 制图 Skill —— 纯 SKILL.md + draw.io CLI 驱动，不与任何 Agent 平台耦合。

## 修改路由表

改什么动哪里，AI 和人都能准确识别：

| 你要做什么 | 改这里 | 说明 |
|-----------|--------|------|
| 加图类型 | `templates/` + `references/diagram-types.md` | 模板 + 类型预设 |
| 加规则 / 改规则 | `references/rules.md` | P0-P3 像素级规则体系 |
| 改导出行为 | `scripts/export.js` | CLI 导出封装 |
| 改审计 / 加规则检测 | `scripts/validate.py` | 结构 lint + P0-P2 审计 |
| 改视觉风格 | `styles/` | 颜色/样式字典 |
| 改 AI 工作流 | `SKILL.md` | Agent 工作流指令 |
| 改打包流程 | `scripts/build.js` | 打包构建 |
| 加测试 | `tests/` | 测试用例 |
| 改安装说明 | `README.md` | 给人看的项目说明 |

## 开发命令速查

```bash
# 结构 lint
python3 scripts/validate.py <file.drawio>           # 基础检查
python3 scripts/validate.py <file.drawio> --strict  # 严格模式
python3 scripts/validate.py <file.drawio> --score   # 可读性评分
python3 scripts/validate.py <file.drawio> --json    # JSON 输出

# CLI 导出
node scripts/export.js <file.drawio>                  # 预览导出
node scripts/export.js <file.drawio> --final          # 最终导出（嵌入源文件）
node scripts/export.js <file.drawio> --format svg     # SVG 格式

# 打包
node scripts/build.js                                 # 打包到 output/
```

## 测试流程

```
L0: 单元测试（无外部依赖）
  python3 -m pytest tests/unit/

L1: 集成测试（需要 draw.io CLI）
  node tests/integration/test_export.js
  node tests/integration/test_golden_regression.js

L2: 端到端测试（仅人工触发）
  node tests/e2e/test_full_workflow.js
```

## 语言策略

| 层面 | 语言 | 理由 |
|------|------|------|
| SKILL.md | 英文 | token 效率高、全球 Agent 兼容 |
| references/ | 英文 | 开源社区惯例 |
| templates/zh/ | 中文 | 目标用户中文描述 |
| CLAUDE.md | 中文 | 开发者自己看 |
| README.md | 英文 | 搜索可见性 |

## Phase 1 范围

当前仅实现**管道C**（AI 手写 XML）。管道A（数据驱动）和管道B（Mermaid 转换）在后续 Phase 中实现。
