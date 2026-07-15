"""
Generate polished xiaosu-draw-ai workflow flowchart.
Replaces the Mermaid block in Doc 3 §2.
"""
import os

PAGE_W, PAGE_H = 960, 1500

# Colors (flat-icon)
FC = {'p': '#dae8fc', 's': '#d5e8d4', 'w': '#fff2cc',
      'a': '#ffe6cc', 'd': '#f8cecc', 'n': '#f5f5f5', 'x': '#e1d5e7'}
SC = {'p': '#6c8ebf', 's': '#82b366', 'w': '#d6b656',
      'a': '#d79b00', 'd': '#b85450', 'n': '#666666', 'x': '#9673a6'}

next_id = [2]
def nid():
    i = next_id[0]; next_id[0] += 1; return str(i)

def v(id_, label, x, y, w, h, style, parent="1"):
    return f'<mxCell id="{id_}" value="{label}" style="{style}" vertex="1" parent="{parent}"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'

def process(id_, label, x, y, w=200, h=44):
    return v(id_, label, x, y, w, h,
             f"rounded=1;whiteSpace=wrap;html=1;fillColor={FC['p']};strokeColor={SC['p']};fontSize=11;")

def decision(id_, label, x, y, w=180, h=64):
    return v(id_, label, x, y, w, h,
             f"rhombus;whiteSpace=wrap;html=1;fillColor={FC['w']};strokeColor={SC['w']};fontSize=11;")

def ellipse(id_, label, x, y, w=130, h=42):
    return v(id_, label, x, y, w, h,
             f"ellipse;whiteSpace=wrap;html=1;fillColor={FC['s']};strokeColor={SC['s']};fontSize=12;fontStyle=1;")

def dashed(id_, label, x, y, w=200, h=40):
    return v(id_, label, x, y, w, h,
             f"rounded=1;whiteSpace=wrap;html=1;fillColor={FC['x']};strokeColor={SC['x']};fontSize=11;dashed=1;dashPattern=8 4;")

def e(id_, src, tgt, label="", wps=None, dash=False, parent="1", exX=0.5, exY=1, enX=0.5, enY=0):
    """R067: All edges MUST specify explicit exit/entry points.
    Default: bottom-exit (0.5,1) → top-entry (0.5,0) for forward flow."""
    ds = ";dashed=1;dashPattern=8 4" if dash else ""
    lb = f' value="{label}"' if label else ''
    ep = f"exitX={exX};exitY={exY};entryX={enX};entryY={enY};"
    wpx = ""
    if wps:
        pts = '\n'.join(f'          <mxPoint x="{px}" y="{py}" />' for px, py in wps)
        wpx = f'\n        <Array as="points">\n{pts}\n        </Array>'
    return f'<mxCell id="{id_}"{lb} style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;fontSize=10;labelBackgroundColor=#ffffff;{ep}{ds}" edge="1" parent="{parent}" source="{src}" target="{tgt}"><mxGeometry relative="1" as="geometry">{wpx}</mxGeometry></mxCell>'

E = []  # elements list
Y = {}  # track node y-coordinates for edge routing

# ---- Title ----
E.append(f'<mxCell id="{nid()}" value="&lt;b&gt;xiaosu-draw-ai 工作流&lt;/b&gt;" style="text;html=1;align=center;fontSize=16;fontColor=#333333;" vertex="1" parent="1"><mxGeometry x="280" y="10" width="400" height="30" as="geometry"/></mxCell>')

# ---- Column centers ----
CX = 480  # main flow center
RX = 800  # right branch (fix loop)
LX = 80   # left branch (follow-up loop)

# ---- y positions (matched to CUSTOM tuned spacing) ----
y = 55

# S1: Start
s1 = nid(); E.append(ellipse(s1, '开始', CX-65, y, 130, 42))
y += 42 + 40  # gap: 40

# P1: User describes
p1 = nid(); E.append(process(p1, '用户自然语言描述需求', CX-115, y, 230, 44))
E.append(e(nid(), s1, p1))
y += 44 + 60

# D1: Info sufficient?
d1 = nid(); E.append(decision(d1, '信息是否充分？', CX-90, y, 180, 64))
E.append(e(nid(), p1, d1))
d1y = y; d1h = 64; d1cy = y + 32
y += 64 + 60

# P2: AI asks (left branch)
p2_id = nid(); p2y = d1cy-22; p2h = 44
E.append(process(p2_id, 'AI 追问缺失信息', LX+10, p2y, 190, p2h))
# D1→P2 (left, "不够")
E.append(e(nid(), d1, p2_id, '不够', [(CX-90, d1cy), (LX+10+190, d1cy)], exX=0, exY=0.5, enX=1, enY=0.5))
# P2→D1: exit TOP, enter D1 TOP CENTER (entryX=0.5 — forward+feedback enter same point, fine because approach direction differs)
E.append(e(nid(), p2_id, d1, '', [(LX+105, p2y-15), (CX, p2y-15)], exX=0.5, exY=0, enX=0.5, enY=0))

# P3: Extract IR (main branch - after D1 yes)
p3 = nid(); E.append(process(p3, '抽取结构化 IR', CX-115, y, 230, 44))
E.append(e(nid(), d1, p3, '充分'))
y += 44 + 48

# P4: Show summary
p4 = nid(); E.append(process(p4, 'IR 摘要展示给用户确认', CX-130, y, 260, 44))
E.append(e(nid(), p3, p4))
y += 44 + 48

# D2: User confirms?
d2 = nid(); E.append(decision(d2, '用户确认？', CX-90, y, 180, 64))
d2y = y; d2h = 64; d2cy = y + 32
E.append(e(nid(), p4, d2))
y += 64 + 48

# FIX 2: D2→D1: exit RIGHT, enter RIGHT per R066, pushed further right (+60px clearance)
E.append(e(nid(), d2, d1, '不通过', [(CX+180, d2cy), (CX+180, d1cy)], dash=True, exX=1, exY=0.5, enX=1, enY=0.5))

# P5: Pipeline routing (after D2 yes)
p5 = nid(); E.append(dashed(p5, '数据来源判断 → 管道路由', CX-130, y, 260, 40))
E.append(e(nid(), d2, p5, '确认'))
y += 40 + 45  # matched to CUSTOM gap

# Three pipeline branches — matched to CUSTOM positions
pw = 180; ph = 36
pax = 190; pbx = CX - pw//2; pcx = 590

pa = nid(); E.append(process(pa, 'A: 数据驱动导入', pax, y, pw, ph))
pb = nid(); E.append(process(pb, 'B: Mermaid 转换', pbx, y, pw, ph))
pc = nid(); E.append(process(pc, 'C: AI 手写 XML', pcx, y, pw, ph))
E.append(e(nid(), p5, pa))
E.append(e(nid(), p5, pb))
E.append(e(nid(), p5, pc))
y += ph + 42  # matched to CUSTOM gap

# P6: Generate — matched to CUSTOM x=365, w=230
p6_id = nid(); p6y = y; p6h = 44; p6w = 230
E.append(process(p6_id, '生成 .drawio 文件', 365, y, p6w, p6h))
E.append(e(nid(), pa, p6_id))
E.append(e(nid(), pb, p6_id))
E.append(e(nid(), pc, p6_id))
y += p6h + 46  # CUSTOM gap

# D3: Quality gate
d3 = nid(); E.append(decision(d3, '质量门禁通过？', CX-90, y, 180, 64))
d3y = y; d3h = 64; d3cy = y + 32
E.append(e(nid(), p6_id, d3))
y += 64 + 48

# P7: Auto-fix (right branch - P0/P1 not pass)
p7_id = nid(); p7y = d3cy-28; p7h = 56
E.append(process(p7_id, '自动修复\n(最多3轮)', RX-70, p7y, 140, p7h))
E.append(e(nid(), d3, p7_id, 'P0/P1', [(CX+90, d3cy), (RX-70+140, d3cy)], exX=1, exY=0.5, enX=0, enY=0.5))
# FIX 4: Loop back fix→generate: exit TOP, enter RIGHT per R066
p6_right_x = 365 + 230; p6_mid_y = p6y + p6h//2
E.append(e(nid(), p7_id, p6_id, '', [(RX, p7y-15), (RX, p6_mid_y), (p6_right_x, p6_mid_y)], dash=True, exX=0.5, exY=0, enX=1, enY=0.5))

# P8: Export preview
p8 = nid(); E.append(process(p8, '导出 PNG 预览', CX-115, y, 230, 44))
E.append(e(nid(), d3, p8, '通过'))
y += 44 + 48

# P9: Visual self-check
p9 = nid(); E.append(process(p9, '视觉自检', CX-115, y, 230, 44))
E.append(e(nid(), p8, p9))
y += 44 + 48

# S2: Final deliver
s2 = nid(); E.append(ellipse(s2, '最终交付', CX-65, y, 130, 42))
E.append(e(nid(), p9, s2))

# ---- Assemble ----
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'workflow-flowchart.drawio')
xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="draw.io" version="26.0.0" type="device">
  <diagram name="xiaosu-draw-ai Workflow" id="page-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" page="1" pageScale="1" pageWidth="{PAGE_W}" pageHeight="{PAGE_H}" math="0" shadow="0" pageBgColor="#ffffff">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        {''.join(E)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(xml)

vcount = sum(1 for e in E if 'vertex=' in e)
ecount = sum(1 for e in E if 'edge=' in e)
print(f"Generated: {output_path}")
print(f"Vertices: {vcount}, Edges: {ecount}, Total: {vcount+ecount}")
