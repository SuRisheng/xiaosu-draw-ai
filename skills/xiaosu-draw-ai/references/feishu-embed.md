# Feishu / Lark Embedding Guide

> How to embed xiaosu-draw-ai diagrams in Feishu (Lark) documents, wikis, and messages.
>
> **When to read:** When the user wants to share a diagram in Feishu — embed in a doc,
> attach to a message, or integrate with an approval workflow.

---

## Quick Embed: Upload to Feishu Doc

1. Generate the final PNG: `node scripts/export.js .drawio/<name>.drawio --final`
2. The output is `.drawio/<name>.drawio.png` (PNG with embedded editable XML).
3. In Feishu Docx / Wiki: drag-and-drop the `.drawio.png` file, or use **Insert → Image**.
4. The embedded XML allows re-editing: open the PNG in draw.io desktop to edit.

> **Tip:** The double extension (`.drawio.png`) is intentional — draw.io recognizes it as an
> editable diagram file. When opened in draw.io desktop, the embedded XML loads automatically.

---

## Embed in Feishu Wiki

Feishu Wiki supports image embedding in knowledge base pages:

1. Navigate to the target Wiki page.
2. Click **Edit** → **Insert Image** → upload the `.drawio.png` file.
3. Add a caption below the image with a link to the source `.drawio` file in your git repo:
   ```
   [Edit this diagram](https://github.com/your-org/your-repo/blob/main/diagrams/architecture.drawio)
   ```

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
