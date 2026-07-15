"""
Generate e-commerce microservices architecture diagram (50+ elements).
Pipeline C: AI hand-writes XML via computed layout.
"""
import os

# ── Canvas ──────────────────────────────────────────────────
PAGE_W, PAGE_H = 2000, 1700
MARGIN = 60
SW_W = 1320  # unified swimlane width (R039)

# ── Color Palette (flat-icon) ───────────────────────────────
C = {
    'primary':   ('#dae8fc', '#6c8ebf'),
    'success':   ('#d5e8d4', '#82b366'),
    'warning':   ('#fff2cc', '#d6b656'),
    'accent':    ('#ffe6cc', '#d79b00'),
    'danger':    ('#f8cecc', '#b85450'),
    'neutral':   ('#f5f5f5', '#666666'),
    'secondary': ('#e1d5e7', '#9673a6'),
}

# ── ID counter ──────────────────────────────────────────────
next_id = 2
def new_id():
    global next_id
    i = next_id
    next_id += 1
    return str(i)

# ── XML builders ────────────────────────────────────────────
def vertex(id_, label, x, y, w, h, style, parent="1"):
    return f'''<mxCell id="{id_}" value="{label}" style="{style}" vertex="1" parent="{parent}">
      <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />
    </mxCell>'''

def swimlane(id_, label, x, y, w, h, fill, stroke):
    style = f"swimlane;startSize=30;fillColor={fill};strokeColor={stroke};fontSize=13;fontStyle=1;html=1;"
    return vertex(id_, label, x, y, w, h, style)

def svc(id_, label, x, y, w, h, parent, color_key='primary'):
    fc, sc = C[color_key]
    style = f"rounded=1;whiteSpace=wrap;html=1;fillColor={fc};strokeColor={sc};fontSize=12;"
    return vertex(id_, label, x, y, w, h, style, parent)

def cyl(id_, label, x, y, w, h, parent, color_key='success'):
    fc, sc = C[color_key]
    style = f"shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor={fc};strokeColor={sc};fontSize=11;"
    return vertex(id_, label, x, y, w, h, style, parent)

def external(id_, label, x, y, w, h, parent="1"):
    fc, sc = C['neutral']
    style = f"rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=8 4;fillColor={fc};strokeColor={sc};fontSize=11;"
    return vertex(id_, label, x, y, w, h, style, parent)

def edge(id_, source, target, label, style_extra="", waypoints=None, parent="1"):
    """Create edge with optional waypoints."""
    base = f"edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;{style_extra}"
    label_attr = f' value="{label}"' if label else ''
    wp_xml = ""
    if waypoints:
        pts = '\n'.join(f'          <mxPoint x="{px}" y="{py}" />' for px, py in waypoints)
        wp_xml = f'\n        <Array as="points">\n{pts}\n        </Array>'
    return f'''<mxCell id="{id_}"{label_attr} style="{base}" edge="1" parent="{parent}" source="{source}" target="{target}">
      <mxGeometry relative="1" as="geometry">{wp_xml}
      </mxGeometry>
    </mxCell>'''

def edge_async(id_, source, target, label, waypoints=None, parent="1"):
    return edge(id_, source, target, label,
                "dashed=1;dashPattern=8 4;", waypoints, parent)

# ── Computed routing helper ─────────────────────────────────
def route_btm_top(src, tgt, corridor_y):
    """staircase: bottom-exit → corridor → top-entry"""
    scx = src['x'] + src['w'] // 2
    tcx = tgt['x'] + tgt['w'] // 2
    return [(scx, corridor_y), (tcx, corridor_y)]

# ── Build data model ────────────────────────────────────────
elements = []  # list of XML strings
ids = {}       # name → id mapping

# Title
tid = new_id()
ids['title'] = tid
elements.append(f'''<mxCell id="{tid}" value="&lt;b&gt;电商平台微服务架构 (E-Commerce Microservices Architecture)&lt;/b&gt;" style="text;html=1;align=center;verticalAlign=middle;fontSize=18;fontStyle=0;fontColor=#333333;" vertex="1" parent="1">
      <mxGeometry x="60" y="20" width="1400" height="40" as="geometry" />
    </mxCell>''')

# ── Layer definitions ───────────────────────────────────────
# (name, y, h, children_list)
# children: (keyname, label, col, row, w, h, type, color_key, rows_in_layer)
# col/row are 0-indexed

layers = []

# L1: Client Layer
sw_y1, sw_h1 = 60, 100
sid = new_id()
ids['L1_swimlane'] = sid
elements.append(swimlane(sid, '客户端层 (Client Layer)', MARGIN, sw_y1, SW_W, sw_h1, '#B8CCE8', '#5A7DB0'))
children_l1 = [
    ('WebApp', 'Web App', 0, 0, 240, 50, 'svc', 'primary'),
    ('MobileApp', 'Mobile App', 1, 0, 240, 50, 'svc', 'primary'),
    ('AdminDashboard', 'Admin Dashboard', 2, 0, 240, 50, 'svc', 'primary'),
    ('ThirdParty', '第三方合作伙伴', 3, 0, 240, 50, 'svc', 'neutral'),
]
GAPS_4COL = [80, 80, 80]  # 4 cols → 3 gaps
nodes_l1 = []
for key, label, col, row, w, h, typ, ck in children_l1:
    x = 40 + col * (w + GAPS_4COL[col]) if col < 3 else 40 + sum(w + GAPS_4COL[i] for i in range(col))
    # Simpler: x = 40 + col * (w + gap)
    gap = 80
    x = 40 + col * (w + gap)
    y = 45  # relative to swimlane (header=30, top_margin=15)
    vid = new_id()
    ids[key] = vid
    nodes_l1.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y1 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    if typ == 'svc':
        elements.append(svc(vid, label, x, y, w, h, sid, ck))
layers.append({'nodes': nodes_l1, 'sw_y': sw_y1, 'sw_h': sw_h1, 'sw_id': sid})

# L2: Gateway & Security
sw_y2, sw_h2 = 200, 100
sid = new_id()
ids['L2_swimlane'] = sid
elements.append(swimlane(sid, '网关安全层 (Gateway &amp; Security)', MARGIN, sw_y2, SW_W, sw_h2, '#F5D0A0', '#C08020'))
children_l2 = [
    ('CDN', 'CDN', 0, 0, 240, 50, 'svc', 'accent'),
    ('WAF', 'WAF', 1, 0, 240, 50, 'svc', 'danger'),
    ('APIGateway', 'API Gateway (Kong)', 2, 0, 240, 50, 'svc', 'accent'),
    ('AuthService', 'Auth Service', 3, 0, 240, 50, 'svc', 'danger'),
]
nodes_l2 = []
for key, label, col, row, w, h, typ, ck in children_l2:
    gap = 80
    x = 40 + col * (w + gap)
    y = 45
    vid = new_id()
    ids[key] = vid
    nodes_l2.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y2 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    elements.append(svc(vid, label, x, y, w, h, sid, ck))
layers.append({'nodes': nodes_l2, 'sw_y': sw_y2, 'sw_h': sw_h2, 'sw_id': sid})

# L3: Core Business Services
sw_y3, sw_h3 = 340, 290
sid = new_id()
ids['L3_swimlane'] = sid
elements.append(swimlane(sid, '核心业务服务层 (Core Business Services)', MARGIN, sw_y3, SW_W, sw_h3, '#B8CCE8', '#5A7DB0'))
children_l3 = [
    ('UserService', 'User Service', 0, 0, 240, 50, 'svc', 'primary'),
    ('ProductService', 'Product Service', 1, 0, 240, 50, 'svc', 'primary'),
    ('InventoryService', 'Inventory Service', 2, 0, 240, 50, 'svc', 'primary'),
    ('CartService', 'Cart Service', 3, 0, 240, 50, 'svc', 'primary'),
    ('OrderService', 'Order Service', 0, 1, 240, 50, 'svc', 'primary'),
    ('PaymentService', 'Payment Service', 1, 1, 240, 50, 'svc', 'primary'),
    ('LogisticsService', 'Logistics Service', 2, 1, 240, 50, 'svc', 'primary'),
    ('NotificationService', 'Notification Service', 3, 1, 240, 50, 'svc', 'primary'),
    ('SearchService', 'Search Service', 0, 2, 240, 50, 'svc', 'primary'),
    ('RecommendationService', 'Recommendation Service', 1, 2, 240, 50, 'svc', 'primary'),
    ('CustomerService', 'Customer Service', 2, 2, 240, 50, 'svc', 'primary'),
    ('ReviewService', 'Review Service', 3, 2, 240, 50, 'svc', 'primary'),
]
nodes_l3 = []
for key, label, col, row, w, h, typ, ck in children_l3:
    gap = 80
    x = 40 + col * (w + gap)
    y = 45 + row * 80
    vid = new_id()
    ids[key] = vid
    nodes_l3.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y3 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    elements.append(svc(vid, label, x, y, w, h, sid, ck))
layers.append({'nodes': nodes_l3, 'sw_y': sw_y3, 'sw_h': sw_h3, 'sw_id': sid})

# L4: Message & Integration
sw_y4, sw_h4 = 670, 100
sid = new_id()
ids['L4_swimlane'] = sid
elements.append(swimlane(sid, '消息集成层 (Message &amp; Integration)', MARGIN, sw_y4, SW_W, sw_h4, '#F0E0A0', '#C0A040'))
children_l4 = [
    ('RabbitMQ', 'RabbitMQ', 0, 0, 200, 60, 'cyl', 'warning'),
    ('Kafka', 'Kafka', 1, 0, 200, 60, 'cyl', 'warning'),
    ('SagaOrchestrator', 'Saga Orchestrator', 2, 0, 220, 50, 'svc', 'warning'),
]
nodes_l4 = []
for key, label, col, row, w, h, typ, ck in children_l4:
    gap = 100
    x = 40 + col * (max(w, 200) + gap)
    y = 35 if typ == 'cyl' else 40
    vid = new_id()
    ids[key] = vid
    nodes_l4.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y4 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    if typ == 'cyl':
        elements.append(cyl(vid, label, x, y, w, h, sid, ck))
    else:
        elements.append(svc(vid, label, x, y, w, h, sid, ck))
layers.append({'nodes': nodes_l4, 'sw_y': sw_y4, 'sw_h': sw_h4, 'sw_id': sid})

# L5: Infrastructure
sw_y5, sw_h5 = 810, 110
sid = new_id()
ids['L5_swimlane'] = sid
elements.append(swimlane(sid, '基础设施层 (Infrastructure)', MARGIN, sw_y5, SW_W, sw_h5, '#D0B8D8', '#805890'))
children_l5 = [
    ('ServiceDiscovery', 'Service Discovery', 0, 0, 170, 60, 'svc', 'secondary'),
    ('ConfigCenter', 'Config Center', 1, 0, 170, 60, 'svc', 'secondary'),
    ('Prometheus', 'Prometheus', 2, 0, 170, 60, 'svc', 'secondary'),
    ('ELK', 'ELK Stack', 3, 0, 170, 60, 'svc', 'secondary'),
    ('Jaeger', 'Jaeger', 4, 0, 170, 60, 'svc', 'secondary'),
    ('CICD', 'CI/CD Pipeline', 5, 0, 170, 60, 'svc', 'secondary'),
]
nodes_l5 = []
for key, label, col, row, w, h, typ, ck in children_l5:
    gap = 40
    x = 40 + col * (w + gap)
    y = 40
    vid = new_id()
    ids[key] = vid
    nodes_l5.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y5 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    elements.append(svc(vid, label, x, y, w, h, sid, ck))
layers.append({'nodes': nodes_l5, 'sw_y': sw_y5, 'sw_h': sw_h5, 'sw_id': sid})

# L6: Data Layer
sw_y6, sw_h6 = 960, 250
sid = new_id()
ids['L6_swimlane'] = sid
elements.append(swimlane(sid, '数据层 (Data Layer)', MARGIN, sw_y6, SW_W, sw_h6, '#B8D8B0', '#6A9A50'))
children_l6_row1 = [
    ('MySQL_User', 'MySQL (User DB)', 0, 0, 170, 70, 'cyl', 'success'),
    ('MySQL_Order', 'MySQL (Order DB)', 1, 0, 170, 70, 'cyl', 'success'),
    ('MySQL_Product', 'MySQL (Product DB)', 2, 0, 170, 70, 'cyl', 'success'),
    ('Redis', 'Redis Cluster', 3, 0, 170, 70, 'cyl', 'success'),
    ('Elasticsearch', 'Elasticsearch', 4, 0, 170, 70, 'cyl', 'success'),
]
children_l6_row2 = [
    ('MongoDB', 'MongoDB (Logs)', 0, 1, 200, 50, 'svc', 'success'),
    ('MinIO', 'MinIO Object Storage', 1, 1, 200, 50, 'svc', 'success'),
    ('PostgreSQL', 'PostgreSQL Analytics', 2, 1, 200, 50, 'svc', 'success'),
    ('ReadReplica', 'Read Replicas', 3, 1, 200, 50, 'svc', 'success'),
]
nodes_l6 = []
for key, label, col, row, w, h, typ, ck in children_l6_row1:
    gap = 40
    x = 40 + col * (w + gap)
    y = 45
    vid = new_id()
    ids[key] = vid
    nodes_l6.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y6 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    elements.append(cyl(vid, label, x, y, w, h, sid, ck))
for key, label, col, row, w, h, typ, ck in children_l6_row2:
    gap = 80
    x = 40 + col * (w + gap)
    y = 145
    vid = new_id()
    ids[key] = vid
    nodes_l6.append({'id': vid, 'key': key, 'label': label, 'x': MARGIN + x, 'y': sw_y6 + y,
                     'w': w, 'h': h, 'rel_x': x, 'rel_y': y})
    elements.append(svc(vid, label, x, y, w, h, sid, ck))
layers.append({'nodes': nodes_l6, 'sw_y': sw_y6, 'sw_h': sw_h6, 'sw_id': sid})

# External Systems (bottom area, right-aligned)
ext_y = 1260
ext_x = MARGIN + 40
ext_gap = 40
ext_w, ext_h = 220, 50
ext_systems = [
    ('PaymentGateway', '支付网关 (Alipay/WeChat)', 0, 0),
    ('SMSGateway', 'SMS 网关', 1, 0),
    ('EmailService', 'Email 服务', 2, 0),
]
for key, label, col, row in ext_systems:
    x = ext_x + col * (ext_w + ext_gap)
    y = ext_y + row * 70
    vid = new_id()
    ids[key] = vid
    elements.append(external(vid, label, x, y, ext_w, ext_h))

# ── Legend ──────────────────────────────────────────────────
legend_x = 1480
legend_y = 60
legend_w = 460
legend_h = 370
lid = new_id()
ids['Legend'] = lid
elements.append(f'''<mxCell id="{lid}" value="&lt;b&gt;图例 (Legend)&lt;/b&gt;" style="swimlane;startSize=28;fillColor=#E0E0E0;strokeColor=#888888;fontSize=12;fontStyle=1;html=1;" vertex="1" parent="1">
      <mxGeometry x="{legend_x}" y="{legend_y}" width="{legend_w}" height="{legend_h}" as="geometry" />
    </mxCell>''')

legend_items = [
    ('&lt;font color=&quot;#6c8ebf&quot;&gt;●&lt;/font&gt; 业务服务 (Business Service)', C['primary'], 45),
    ('&lt;font color=&quot;#82b366&quot;&gt;●&lt;/font&gt; 数据存储 (Data Store)', C['success'], 75),
    ('&lt;font color=&quot;#d6b656&quot;&gt;●&lt;/font&gt; 消息队列 (Message Queue)', C['warning'], 105),
    ('&lt;font color=&quot;#d79b00&quot;&gt;●&lt;/font&gt; 网关/负载均衡 (Gateway/LB)', C['accent'], 135),
    ('&lt;font color=&quot;#b85450&quot;&gt;●&lt;/font&gt; 安全/认证 (Security/Auth)', C['danger'], 165),
    ('&lt;font color=&quot;#9673a6&quot;&gt;●&lt;/font&gt; 基础设施 (Infrastructure)', C['secondary'], 195),
    ('&lt;font color=&quot;#666666&quot;&gt;●&lt;/font&gt; 外部系统 (External)', C['neutral'], 225),
    ('──→ 同步调用 (Sync Call)', None, 260),
    ('- - → 异步消息 (Async Message)', None, 290),
    ('-·-·→ 外部系统 (External)', None, 320),
]
for label, color, y in legend_items:
    li_id = new_id()
    fc = color[0] if color else '#FFFFFF'
    sc = color[1] if color else '#333333'
    elements.append(f'''<mxCell id="{li_id}" value="{label}" style="rounded=0;whiteSpace=wrap;html=1;fillColor={fc};strokeColor={sc};fontSize=10;align=left;spacingLeft=8;" vertex="1" parent="{lid}">
      <mxGeometry x="10" y="{y}" width="430" height="20" as="geometry" />
    </mxCell>''')

# ── Edges ───────────────────────────────────────────────────
# Corridor y-centers between layers
C12 = (sw_y1 + sw_h1 + sw_y2) // 2   # L1↔L2
C23 = (sw_y2 + sw_h2 + sw_y3) // 2   # L2↔L3
C34 = (sw_y3 + sw_h3 + sw_y4) // 2   # L3↔L4
C45 = (sw_y4 + sw_h4 + sw_y5) // 2   # L4↔L5
C56 = (sw_y5 + sw_h5 + sw_y6) // 2   # L5↔L6

all_nodes = {}
for layer in layers:
    for n in layer['nodes']:
        all_nodes[n['key']] = n

def n(key):
    return all_nodes[key]

# Edge list: (src_key, tgt_key, label, async_flag, is_external)
edge_list = [
    # L1 → L2
    ('WebApp', 'CDN', 'HTTPS', False),
    ('MobileApp', 'CDN', 'HTTPS', False),
    ('AdminDashboard', 'CDN', 'HTTPS', False),
    ('ThirdParty', 'APIGateway', 'API', False),
    # L2 internal + L2 → L3
    ('CDN', 'WAF', '', False),
    ('WAF', 'APIGateway', '', False),
    ('APIGateway', 'AuthService', '认证', False),
    ('APIGateway', 'UserService', 'REST', False),
    ('APIGateway', 'ProductService', 'REST', False),
    ('APIGateway', 'OrderService', 'REST', False),
    ('APIGateway', 'CartService', 'REST', False),
    # L3 internal (service-to-service)
    ('OrderService', 'PaymentService', '支付请求', False),
    ('OrderService', 'InventoryService', '库存扣减', False),
    ('OrderService', 'LogisticsService', '物流调度', False),
    ('OrderService', 'NotificationService', '通知', True),
    ('PaymentService', 'PaymentGateway', '扣款', False),
    ('NotificationService', 'SMSGateway', '短信', True),
    ('NotificationService', 'EmailService', '邮件', True),
    ('SearchService', 'ProductService', '同步索引', True),
    ('RecommendationService', 'Elasticsearch', '查询', False),
    ('SearchService', 'Elasticsearch', '索引/搜索', False),
    # L3 → L4
    ('OrderService', 'RabbitMQ', '订单事件', True),
    ('NotificationService', 'RabbitMQ', '通知事件', True),
    ('LogisticsService', 'Kafka', '物流事件', True),
    # Saga
    ('SagaOrchestrator', 'OrderService', '补偿', True),
    ('SagaOrchestrator', 'PaymentService', '补偿', True),
    # L3 → L6 (data)
    ('UserService', 'MySQL_User', 'CRUD', False),
    ('OrderService', 'MySQL_Order', 'CRUD', False),
    ('ProductService', 'MySQL_Product', 'CRUD', False),
    ('CartService', 'Redis', 'Cache R/W', False),
    ('InventoryService', 'Redis', '库存缓存', False),
    ('ReviewService', 'MongoDB', 'CRUD', False),
]

# For edges between nodes in same layer that are adjacent (same swimlane),
# use parent = swimlane_id for direct routing
# For cross-layer edges, use parent="1" with stair route

def get_layer_for_node(key):
    for i, layer in enumerate(layers):
        for n in layer['nodes']:
            if n['key'] == key:
                return i, layer
    return None, None

# Also add infrastructure monitoring edges (just a few key ones)
edge_list.append(('CICD', 'Kafka', '部署事件', True))

# Generate edge XML
for src_key, tgt_key, label, is_async in edge_list:
    src_li, src_layer = get_layer_for_node(src_key)
    tgt_li, tgt_layer = get_layer_for_node(tgt_key)

    eid = new_id()
    src_n = all_nodes.get(src_key)
    tgt_n = all_nodes.get(tgt_key)

    if src_li is None or tgt_li is None:
        continue  # external

    if src_li == tgt_li:
        # Same layer: direct connection within swimlane
        parent_id = src_layer['sw_id']
        elements.append(edge(eid, src_n['id'], tgt_n['id'], label,
                            '' if not is_async else 'dashed=1;dashPattern=8 4;',
                            None, parent_id))
    else:
        # Cross-layer: stair route through corridor
        corridor_y = None
        if src_li < tgt_li:
            # Source above target
            cy_idx = src_li  # use corridor between src_li and src_li+1
            corridors = [C12, C23, C34, C45, C56]
            corridor_y = corridors[src_li] if src_li < len(corridors) else C56
        else:
            cy_idx = tgt_li
            corridors = [C12, C23, C34, C45, C56]
            corridor_y = corridors[tgt_li] if tgt_li < len(corridors) else C56

        wps = route_btm_top(src_n, tgt_n, corridor_y)

        # If skipping layers, need intermediate waypoints
        layer_diff = abs(tgt_li - src_li)
        if layer_diff > 1:
            # Add intermediate corridor waypoints
            step = 1 if tgt_li > src_li else -1
            wps = []
            scx = src_n['x'] + src_n['w'] // 2
            tcx = tgt_n['x'] + tgt_n['w'] // 2
            for li in range(src_li, tgt_li, step):
                if step > 0:
                    cy = corridors[li] if li < len(corridors) else C56
                else:
                    cy = corridors[li-1] if (li-1) < len(corridors) else C56
                wps.append((scx, cy))
            # Final corridor → target alignment
            last_cy = corridors[tgt_li - 1] if step > 0 and (tgt_li - 1) < len(corridors) else (corridors[tgt_li] if tgt_li < len(corridors) else C56)
            if step > 0:
                wps.append((tcx, corridors[tgt_li - 1] if (tgt_li - 1) < len(corridors) else C56))
            else:
                wps.append((tcx, corridors[tgt_li] if tgt_li < len(corridors) else C56))

        elements.append(edge(eid, src_n['id'], tgt_n['id'], label,
                            '' if not is_async else 'dashed=1;dashPattern=8 4;',
                            wps, "1"))

# ── Assemble final XML ──────────────────────────────────────
# Count elements
vertex_count = sum(1 for e in elements if 'vertex="1"' in e)
edge_count = sum(1 for e in elements if 'edge="1"' in e)

output_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(output_dir, 'ecommerce-microservices-arch.drawio')

xml = f'''<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="draw.io" version="26.0.0" type="device">
  <diagram name="E-Commerce Microservices Architecture" id="page-1">
    <mxGraphModel dx="1434" dy="810" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="{PAGE_W}" pageHeight="{PAGE_H}" math="0" shadow="0" pageBgColor="#ffffff">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        {''.join(elements)}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>'''

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(xml)

import sys
sys.stdout.reconfigure(encoding='utf-8')
print(f"Generated: {output_path}")
print(f"   Vertices: {vertex_count}")
print(f"   Edges: {edge_count}")
print(f"   Total elements: {vertex_count + edge_count}")
print(f"   Next available ID: {next_id}")
