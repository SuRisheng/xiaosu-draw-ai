# Sequence Diagram

## What This Is

A diagram showing message exchange between participants, ordered top-to-bottom by time. Best for API call chains, login flows, order processing, distributed transactions, and OAuth flows.

## When to Use

- Login / registration flow design
- Order processing and payment flows
- Microservice API call chain analysis
- Distributed transaction (Saga) design
- Third-party API integration sequencing
- OAuth 2.0 / SSO authentication flows

## How to Describe Your Flow

Answer these questions in natural language (not all required — the AI will ask follow-ups):

1. **Who are the participants?**
   e.g., "User, Mobile App, API Gateway, Auth Service, Database"
   Participants are the boxes at the top of the diagram. 3–6 is ideal.

2. **What's the interaction sequence?**
   List messages in time order, formatted as: **Sender → Receiver: Message**
   Example:
   1. User → App: Taps "Login"
   2. App → Gateway: POST /api/login
   3. Gateway → Auth Service: Forward login request
   4. Auth Service → DB: SELECT user WHERE email=?
   5. DB → Auth Service: Return user record
   6. Auth Service → Gateway: Return JWT
   7. Gateway → App: 200 OK + JWT
   8. App → User: Show home screen

3. **Which are requests and which are responses?**
   - Requests (sync calls): solid arrows
   - Responses / returns: dashed open arrows
   - Async messages: dashed arrows, labeled "async"

4. **Any special annotations?**
   - "Include the SQL queries on database calls"
   - "Annotate timeout thresholds on key steps"
   - "Highlight authentication-related messages"

## Examples

### Example 1: Simple Login

> Draw a login sequence diagram. Participants: User, Client App, API Gateway, Auth Service, Database.
>
> Flow:
> 1. User → App: Enter credentials, tap Login
> 2. App → Gateway: POST /api/login
> 3. Gateway → Auth Service: Forward request
> 4. Auth Service → DB: SELECT user
> 5. DB → Auth Service: Return user data
> 6. Auth Service → Gateway: JWT Token
> 7. Gateway → App: 200 OK + JWT
> 8. App → User: Show home screen
>
> Return messages (steps 5, 6, 7) use dashed open arrows.

### Example 2: E-Commerce Order Flow

> Draw an order placement sequence diagram.
>
> Participants: User, Web Frontend, Order Service, Inventory Service, Payment Service (Stripe), Message Queue (RabbitMQ).
>
> Flow:
> 1. User → Web: Click "Buy Now"
> 2. Web → Order Service: POST /orders (product ID, quantity, address)
> 3. Order Service → Inventory: POST /inventory/reserve
> 4. Inventory → Order Service: 200 OK (reservation ID)
> 5. Order Service → Web: Order ID + checkout URL
> 6. Web → User: Redirect to Stripe Checkout
> 7. User → Stripe: Enter payment details
> 8. Stripe → Order Service: POST /orders/{id}/payment-webhook (async)
> 9. Order Service → Inventory: POST /inventory/confirm
> 10. Inventory → Order Service: 200 OK
> 11. Order Service → Queue: Publish "OrderPaid" event
> 12. Order Service → Web: Push "Payment Succeeded"
> 13. Web → User: Show "Order Placed"
>
> Requests use solid arrows. Responses and async messages use dashed open arrows.

## Constraints (AI Must Follow When Generating)

- **Participant layout**: Participant boxes at top (y=40, height=40), left-to-right, 150–200px apart.
- **Lifelines**: Dashed vertical line from each participant bottom (y=80) extending to y=500 or 80px below the last message.
- **Message spacing**: Y-coordinates increment by 50px per message.
- **Message direction**: Requests (solid) go left-to-right; responses (dashed) go right-to-left.
- **Arrow styles**:
  - Request: solid, filled arrow (endArrow=classic;endFill=1;)
  - Response: dashed, open arrow (dashed=1;endArrow=open;endFill=0;)
- **Positioning**: Messages use sourcePoint/targetPoint in mxGeometry (not source/target attributes). X-coordinates must match lifeline positions.
- **Edge label background**: Always add labelBackgroundColor=#FFFFFF to edges with text.
- **Grid alignment**: All coordinates must be multiples of 10px.
- **Max participants**: 6 per page.
