# Product Icons & Brand Colors

> Brand colors and badge text for 60+ technology products. Use when annotating diagrams
> with technology-specific labels (e.g., "PostgreSQL" in green, "Redis" in red).
>
> **When to read:** During SKILL.md Step 2 (Generate XML) when the user mentions
> specific technologies and you want to color-code them with brand-accurate colors.

---

## AI / ML Products

| Product | Brand Color | Usage |
|---------|------------|-------|
| OpenAI / ChatGPT | `#10A37F` | `fillColor=#10A37F` with white text |
| Anthropic / Claude | `#D97757` | `fillColor=#D97757` with white text |
| Google Gemini | `#4285F4` | `fillColor=#4285F4` with white text |
| Meta LLaMA | `#0467DF` | `fillColor=#0467DF` with white text |
| Mistral | `#FF7000` | `fillColor=#FF7000` with white text |
| Cohere | `#39594D` | `fillColor=#39594D` with white text |
| Groq | `#F55036` | `fillColor=#F55036` with white text |
| Together AI | `#6366F1` | `fillColor=#6366F1` with white text |
| Replicate | `#191919` | `fillColor=#191919` with white text |
| Hugging Face | `#FFD21E` | `fillColor=#FFD21E` with dark text |

## AI Memory & RAG

| Product | Brand Color | Usage |
|---------|------------|-------|
| LangChain | `#1C3C3C` | `fillColor=#1C3C3C` with white text |
| LlamaIndex | `#8B5CF6` | `fillColor=#8B5CF6` with white text |
| LangGraph | `#1C3C3C` | `fillColor=#1C3C3C` with white text |
| CrewAI | `#EF4444` | `fillColor=#EF4444` with white text |
| AutoGen | `#0078D4` | `fillColor=#0078D4` with white text |
| Haystack | `#FF6D00` | `fillColor=#FF6D00` with white text |
| DSPy | `#7C3AED` | `fillColor=#7C3AED` with white text |
| Mem0 | `#6366F1` | `fillColor=#6366F1` with white text |

## Vector Databases

| Product | Brand Color | Usage |
|---------|------------|-------|
| Pinecone | `#1C1C2E` | `fillColor=#1C1C2E` with white text |
| Weaviate | `#FA0050` | `fillColor=#FA0050` with white text |
| Qdrant | `#DC244C` | `fillColor=#DC244C` with white text |
| Chroma | `#FF6B35` | `fillColor=#FF6B35` with white text |
| Milvus | `#00A1EA` | `fillColor=#00A1EA` with white text |
| pgvector | `#336791` | `fillColor=#336791` with white text |
| Faiss | `#0467DF` | `fillColor=#0467DF` with white text |

## Classic Databases

| Product | Brand Color | Usage |
|---------|------------|-------|
| PostgreSQL | `#336791` | `fillColor=#336791` with white text |
| MySQL | `#4479A1` | `fillColor=#4479A1` with white text |
| MongoDB | `#47A248` | `fillColor=#47A248` with white text |
| Redis | `#DC382D` | `fillColor=#DC382D` with white text |
| Elasticsearch | `#005571` | `fillColor=#005571` with white text |
| Cassandra | `#1287B1` | `fillColor=#1287B1` with white text |
| Neo4j | `#008CC1` | `fillColor=#008CC1` with white text |
| SQLite | `#003B57` | `fillColor=#003B57` with white text |

## Message Queues & Streaming

| Product | Brand Color | Usage |
|---------|------------|-------|
| Apache Kafka | `#231F20` | `fillColor=#231F20` with white text |
| RabbitMQ | `#FF6600` | `fillColor=#FF6600` with white text |
| AWS SQS | `#FF9900` | `fillColor=#FF9900` with dark text |
| NATS | `#27AAE1` | `fillColor=#27AAE1` with white text |
| Apache Pulsar | `#188FFF` | `fillColor=#188FFF` with white text |

## Cloud & Infrastructure

| Product | Brand Color | Usage |
|---------|------------|-------|
| AWS | `#FF9900` | `fillColor=#FF9900` with dark text |
| Google Cloud (GCP) | `#4285F4` | `fillColor=#4285F4` with white text |
| Microsoft Azure | `#0089D6` | `fillColor=#0089D6` with white text |
| Cloudflare | `#F38020` | `fillColor=#F38020` with white text |
| Vercel | `#000000` | `fillColor=#000000` with white text |
| Docker | `#2496ED` | `fillColor=#2496ED` with white text |
| Kubernetes | `#326CE5` | `fillColor=#326CE5` with white text |
| Terraform | `#7B42BC` | `fillColor=#7B42BC` with white text |
| Nginx | `#009639` | `fillColor=#009639` with white text |
| FastAPI | `#009688` | `fillColor=#009688` with white text |

## Observability

| Product | Brand Color | Usage |
|---------|------------|-------|
| Grafana | `#F46800` | `fillColor=#F46800` with white text |
| Prometheus | `#E6522C` | `fillColor=#E6522C` with white text |
| Datadog | `#632CA6` | `fillColor=#632CA6` with white text |
| LangSmith | `#1C3C3C` | `fillColor=#1C3C3C` with white text |
| Langfuse | `#6366F1` | `fillColor=#6366F1` with white text |
| Arize | `#6B48FF` | `fillColor=#6B48FF` with white text |

---

## Usage in draw.io XML

### Technology Badge (Small Label)

For annotating a component with its technology, add a small badge cell near the component:

```xml
<!-- Technology badge: PostgreSQL -->
<mxCell id="20" value="PostgreSQL"
  style="rounded=1;whiteSpace=wrap;html=1;fillColor=#336791;strokeColor=none;fontColor=#ffffff;fontFamily=Helvetica;fontSize=9;fontStyle=1;"
  vertex="1" parent="1">
  <mxGeometry x="50" y="110" width="100" height="20" as="geometry" />
</mxCell>
```

### Technology-Styled Service Node

For coloring an entire service node with a brand color:

```xml
<!-- Redis cache node styled with Redis brand color -->
<mxCell id="15" value="Redis Cache"
  style="shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#DC382D;strokeColor=#b02a20;fontColor=#ffffff;fontFamily=Helvetica;fontSize=12;fontStyle=1;"
  vertex="1" parent="1">
  <mxGeometry x="560" y="390" width="120" height="80" as="geometry" />
</mxCell>
```

> Use brand-color fills sparingly — they are visually strong. The default 7-color semantic palette
> (`references/xml-authoring.md`) should be used for general diagramming. Brand colors are for
> technology-specific annotations and badges.

---

## Color Contrast Notes

| Background | Text Color |
|-----------|-----------|
| Dark fills (e.g., `#1C1C2E`, `#231F20`, `#191919`, `#000000`) | `#ffffff` (white) |
| Bright fills (e.g., `#FFD21E`, `#FF9900`, `#FF6600`) | `#000000` or `#333333` (dark) |
| Medium fills (all others) | `#ffffff` (white) — most brand colors are medium-to-dark |

> When in doubt, use white text on brand-colored fills. Only Hugging Face (`#FFD21E`), AWS (`#FF9900`), and RabbitMQ (`#FF6600`) need dark text for contrast.
