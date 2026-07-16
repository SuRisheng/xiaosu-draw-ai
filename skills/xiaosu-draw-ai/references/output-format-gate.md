# Output Format Decision Gate（输出格式决策门）

> **CRITICAL: Read this BEFORE every diagram delivery, regardless of pipeline.**
> 
> Determines the correct output format based on where the diagram will be consumed:
> Mermaid code block (for platforms with native Mermaid rendering) vs PNG/SVG (for
> platforms that don't). Covers Feishu (Lark), GitHub, Notion, Confluence, Slack,
> and other platforms.
>
> **Not Feishu-specific** — the name is historical. This is the universal delivery
> format decision matrix for ALL platforms.

---

## Platform Format Matrix

| Target Platform | Mermaid Support? | Deliver This | Notes |
|----------------|---------|-------------|-------|
| **Feishu Wiki** | ✅ Native | ````mermaid` code block | Wiki Markdown renders Mermaid directly. Do NOT export to PNG — it loses editability. |
| **Feishu Docx** | ❌ | PNG (`--final`) | Docx does not support code blocks. Use draw.io CLI export. |
| **GitHub/GitLab** | ✅ Native | ````mermaid` code block | Both render Mermaid in `.md` files natively. |
| **Notion** | ✅ via plugin | ````mermaid` code block | Notion supports Mermaid syntax. |
| **Obsidian** | ✅ Native | ````mermaid` code block | Native Mermaid plugin. |
| **Confluence** | ⚠️ Plugin | ````mermaid` + PNG fallback | Depends on Mermaid plugin being installed. |
| **Slack / IM** | ❌ | PNG preview | Messages don't render code blocks. |
| **Word / PPT / Email** | ❌ | PNG (`--final`) | Universal image format. |
| **PDF** | ❌ | PNG or SVG | Embed as image. |

## Decision Rule

```
If target supports Mermaid AND you have .mmd source:
  → PRIMARY: ```mermaid code block
  → BACKUP: .drawio + PNG
  → NEVER: PNG-only (unless user explicitly requests)

If target does NOT support Mermaid:
  → PRIMARY: PNG (--final)
  → Keep .mmd source file for future edits
```

---

## Embedding in Feishu

1. Generate the final PNG: `node scripts/export.js .drawio/<name>.drawio --final`
2. The output is `.drawio/<name>.drawio.png` (PNG with embedded editable XML).
3. In Feishu Docx / Wiki: drag-and-drop the `.drawio.png` file, or use **Insert → Image**.
4. The embedded XML allows re-editing: open the PNG in draw.io desktop to edit.

> **Tip:** The double extension (`.drawio.png`) is intentional — draw.io recognizes it as an
> editable diagram file. When opened in draw.io desktop, the embedded XML loads automatically.

---

## Embed in Feishu Wiki

Feishu Wiki supports both image embedding AND Mermaid code rendering:

### Option A: Mermaid Code Block (Pipeline B — preferred for editability)

Feishu Wiki Markdown renders Mermaid natively — no image upload needed.

1. Navigate to the target Wiki page, click **Edit**.
2. Insert a Mermaid code block with the `.mmd` source content:
   ````markdown
   ```mermaid
   sequenceDiagram
       participant A as Alice
       participant B as Bob
       A->>B: Hello
       B-->>A: Hi
   ```
   ````
3. Wiki will render this as a live diagram. **No PNG export needed.**
4. **Re-editing**: edit the Mermaid code block text directly in the Wiki editor — or edit the `.mmd` source file, regenerate, and paste the updated code.

> **Advantage over PNG**: Mermaid code is text — diff-friendly, easy to modify, and re-renders automatically. This is the recommended delivery for Pipeline B diagrams when the target is Feishu Wiki.

### Option B: PNG Image (Pipeline C — for hand-drawn diagrams)

For Pipeline C diagrams (architecture, deployment, flowchart, etc.) that don't have a Mermaid source:

1. Click **Edit** → **Insert Image** → upload the `.drawio.png` file.
2. Add a caption with a link to the source file in your git repo:
   ```
   [Edit this diagram](https://github.com/your-org/your-repo/blob/main/.drawio/type/architecture.drawio)
   ```

> **Feishu Docx limitation**: Feishu Docx (普通文档) does **NOT** support Mermaid code blocks. Use Option B (PNG) for Docx. Feishu Wiki (知识库) supports both.

---

## Share via Feishu Message

### Bot Message (Image Attachment)

```json
{
  "msg_type": "image",
  "content": {
    "image_key": "img_v2_xxxxx"
  }
}
```

1. Upload the `.drawio.png` to Feishu using the [Image Upload API](https://open.feishu.cn/document/server-docs/im-v1/image/create).
2. Send the image in a bot message via the [Send Message API](https://open.feishu.cn/document/server-docs/im-v1/message/create).

### Bot Message (File Attachment)

For sharing the editable `.drawio` source:

```json
{
  "msg_type": "file",
  "content": {
    "file_key": "file_v2_xxxxx"
  }
}
```

1. Upload the `.drawio` file using the [File Upload API](https://open.feishu.cn/document/server-docs/im-v1/file/create).
2. Send as a file attachment — recipients can download and open in draw.io desktop.

---

## Approval Workflow Integration

For architecture review / design approval workflows in Feishu:

### Scenario: Diagram Review Approval

1. **Generate diagram**: AI creates the `.drawio` and exports final PNG.
2. **Create Feishu Approval**: Use the [Approval API](https://open.feishu.cn/document/server-docs/approval-v4/approval/create) to create an approval instance.
3. **Attach diagram**: Include the `.drawio.png` as an attachment in the approval form.
4. **Approvers**: Receive the approval with the diagram inline — they can view, comment, approve/reject.
5. **Post-approval**: The diagram source (`.drawio`) is committed to git with the approval ID in the commit message.

### Feishu Approval Form Template

```json
{
  "approval_code": "ARCH-REVIEW",
  "form": [
    {
      "id": "diagram_name",
      "name": "Diagram Name",
      "type": "input"
    },
    {
      "id": "diagram_description",
      "name": "Description",
      "type": "textarea"
    },
    {
      "id": "diagram_image",
      "name": "Diagram Preview",
      "type": "image"
    },
    {
      "id": "diagram_source",
      "name": "Source File (.drawio)",
      "type": "attachment"
    }
  ]
}
```

---

## Feishu Docx: Inline Diagram with Caption

For embedding in long-form documents:

1. Export the diagram at appropriate resolution:
   ```bash
   node scripts/export.js .drawio/<name>.drawio --final --width 1200
   ```
2. Insert in Feishu Docx: **Insert → Image → Upload**.
3. Add caption and source link:
   ```
   Figure 1: System Architecture Diagram
   Source: .drawio/<name>.drawio (editable in draw.io desktop)
   ```

---

## Automated Diagram Updates

For CI/CD pipelines that auto-update diagrams in Feishu:

```bash
# 1. Generate diagram (AI or script)
# 2. Export final PNG
node scripts/export.js .drawio/architecture.drawio --final

# 3. Upload to Feishu (via Feishu API or CLI)
# 4. Update embedded image in Wiki/Docx
# 5. Post update notification to chat
```

> See the [Feishu Open API docs](https://open.feishu.cn/document) for API authentication and rate limits.
