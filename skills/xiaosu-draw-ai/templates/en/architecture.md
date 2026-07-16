# Architecture Diagram

## What This Is

A diagram showing your system's overall structure — service tiers, component dependencies, and data flow. Best for microservices, cloud-native systems, and distributed architectures.

## When to Use

- Microservices architecture design and review
- Cloud infrastructure topology
- System design documentation
- Onboarding new team members
- Pre-refactor system landscape mapping

## How to Describe Your System

Answer these questions in natural language (not all required — the AI will ask follow-ups for what you miss):

1. **What's your system called?**
   e.g., "E-Commerce Platform", "Payment Gateway", "IoT Data Platform"

2. **What layers does it have? What's in each layer?**
   Describe your architecture in terms of layers (flexible — 1 to 6 layers):
   - **Frontend**: Web (React/Vue), Mobile (iOS/Android), Mini-programs
   - **Gateway**: API Gateway (Kong/Nginx), Load Balancer
   - **Services**: User Service, Order Service, Product Service...
   - **Middleware**: Message Queue (RabbitMQ/Kafka), Cache (Redis)
   - **Data**: MySQL, PostgreSQL, Elasticsearch, MongoDB

3. **How do components connect and interact?**
   Be specific about direction and type:
   - "The API Gateway routes incoming requests to individual microservices"
   - "Order Service publishes events to RabbitMQ, consumed by Inventory Service"
   - "Each microservice has its own dedicated MySQL database"
   - Synchronous (REST/gRPC) vs asynchronous (message queue/event bus)?

4. **Any special requirements?**
   - "Highlight core services in blue, security components in red"
   - "Mark deprecated modules with dashed borders"
   - "Label technology stacks (Go, Java, Python) on each service"
   - "Emphasize the User Service — it's the system's entry point"

## Examples

### Example 1: Simple Three-Tier

> Draw an e-commerce system architecture. Frontend has a Web app and iOS app, proxied through an Nginx gateway. Backend has two microservices: User Service and Order Service. Each service has its own MySQL database. There's also a Redis cache.

### Example 2: Detailed Microservices

> Draw a microservices architecture diagram for our e-commerce platform.
>
> System name: E-Commerce Platform
>
> Frontend:
> - Web (React, served via CDN)
> - iOS App (Swift)
>
> Gateway:
> - Kong API Gateway — routing, rate limiting, JWT validation
>
> Services:
> - User Service (Go): Registration, login, JWT auth, profile management
> - Order Service (Java / Spring Boot): Order creation, query, Alipay integration
> - Product Service (Python / FastAPI): Product CRUD, search via Elasticsearch
> - Inventory Service (Go): Stock deduction, reservation, sync
>
> Middleware:
> - RabbitMQ: Async messaging (Order created → Inventory deducted)
> - Redis: Session cache, hot product data cache
>
> Data:
> - Each microservice has its own MySQL database
> - Product search uses Elasticsearch
>
> Deployment:
> - All services deployed on Alibaba Cloud ACK (Kubernetes)
> - 3-node production cluster, 2 replicas per service

## Constraints (AI Must Follow When Generating)

- **Layout direction**: Top-to-bottom layers. Layer gap ≥ 120px.
- **Same-row spacing**: 100–120px horizontal, ≥ 80px edge-to-edge between components.
- **Color semantics**: Map component type → semantic role → style preset table. Do NOT hardcode hex values —
  - Services/applications → role: service (color from `roles.service → palette` lookup)
  - Databases/storage → role: database
  - Queues/async → role: queue
  - Gateways/proxies → role: gateway
  - Security/auth → role: error (or security)
  - External/third-party → role: external
  - Config/infrastructure → role: security
  - **Lookup**: Read selected style JSON → `roles` field → find palette slot → `palette` field → fillColor/strokeColor
- **Gateway position**: Centered at the top layer. Databases at the bottom.
- **Service groups**: Use swimlane containers for services with sub-components.
- **Routing corridors**: Reserve ≥ 80px between layers for clean edge routing.
- **Z-order**: Edges rendered below components (edge IDs lower than vertex IDs).
- **Grid alignment**: All coordinates (x, y, width, height) must be multiples of 10px.
- **Edge geometry**: Every edge must have expanded `<mxGeometry>` (never self-closing).
- **Title**: Add a title at the top with fontSize=14, fontStyle=1 (bold).
