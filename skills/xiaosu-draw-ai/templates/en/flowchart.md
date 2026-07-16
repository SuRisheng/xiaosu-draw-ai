# Flowchart

## What This Is

A diagram showing business processes, decision paths, and operational steps. Each step uses a specific shape (start/end, process, decision, input/output), connected by arrows. Best for workflows, algorithms, approval processes, and user journeys.

## When to Use

- Business process design and approval workflows
- User journey and interaction path analysis
- Algorithm logic visualization
- Error handling and retry flows
- Order status state machines
- Customer support ticket workflows

## How to Describe Your Process

Answer these questions in natural language (not all required — the AI will ask follow-ups):

1. **Where does the process start and end?**
   e.g., "Starts when user submits an order" and "ends with order confirmed or cancelled".
   Every flowchart needs a clear start and end point.

2. **What are the steps? Describe them in order.**
   Example:
   1. User submits order
   2. System checks login status
   3. System validates inventory
   4. If inventory is sufficient → deduct stock → create order → return success
   5. If inventory is insufficient → show "Out of stock" → end
   Use short verb phrases for each step.

3. **What are the decision points? What are the branches?**
   Describe like this:
   - **Decision: Is inventory sufficient?**
     - Yes → continue to order creation
     - No → show "Out of stock" message → end
   - **Decision: Is user logged in?**
     - Yes → proceed to checkout
     - No → redirect to login
   Every decision must have both "Yes" and "No" branches.

4. **Any special requirements?**
   - "Normal path in blue, error path in red"
   - "Label who is responsible for each step (system auto vs. manual review)"
   - "Bold the critical path steps"
   - "Timeout scenarios in dashed lines"

## Examples

### Example 1: Login Flow

> Draw a user login flowchart.
>
> Start → User enters credentials → System validates format →
> Decision: Format valid?
> - Yes → Call login API → Decision: Credentials match?
>   - Yes → Generate JWT → Redirect to home → End
>   - No → Show "Invalid credentials" → Back to input
> - No → Show "Invalid email format" → Back to input
>
> Error paths use red dashed lines.

### Example 2: E-Commerce Order Processing

> Draw an e-commerce order processing flowchart.
>
> Start (User submits order) →
> Decision: Is user logged in?
> - No → Redirect to login → User logs in → Decision: Login successful?
>   - No → Show "Login failed" → End
>   - Yes → Continue
> - Yes → Continue
>
> Validate inventory →
> Decision: Sufficient stock?
> - No → Show "Insufficient stock" → End
> - Yes → Reserve inventory → Create order (status=pending) →
>
> Decision: Payment within 30 minutes?
> - Yes → Update order (status=paid) → Confirm inventory deduction → Notify warehouse →
>   Update order (status=shipped) → Decision: Delivery confirmed within 7 days?
>   - Yes → Update order (status=completed) → End
>   - No → Auto-confirm → Update order (status=completed) → End
> - No → Cancel order → Release reserved stock → Update order (status=cancelled) → End
>
> Normal path in blue, timeout/cancellation in red. Payment timeout lines in dashed.

## Constraints (AI Must Follow When Generating)

- **Layout direction**: Main flow top-to-bottom; branches expand left/right at decision nodes.
- **Shape conventions**:
  - Start/End: ellipse, role: database
  - Process step: rounded rectangle (rounded=1), role: service
  - Decision: diamond (rhombus), role: queue
  - Input/Output: parallelogram (shape=parallelogram), role: gateway
  - Error/Exception: role: error
  - **Lookup**: Read selected style JSON → `roles` field → find palette slot → `palette` field → fillColor/strokeColor
- **Step spacing**: Vertical gap ≥ 80px; decision branch horizontal gap 100–120px.
- **Decision branches**: Each diamond node must have exactly 2 outgoing edges labeled "Yes"/"No" via the edge `value` attribute.
- **Edge label background**: Always add labelBackgroundColor=#FFFFFF to edges with text labels.
- **Path differentiation**: Main/normal path uses solid lines; error/fallback/timeout paths use dashed lines (dashed=1;dashPattern=8 4;).
- **Start/End**: Exactly one Start node (top center). At least one End node (bottom).
- **Edge crossings**: Avoid by reordering branches or adding intermediate junction nodes.
- **Grid alignment**: All coordinates must be multiples of 10px.
