# Architecture -- PulseDesk

## Multi-tenancy approach
PulseDesk implements a shared-database, shared-schema multi-tenant architecture. 
- **Tenant Scope Enforcement**: Every database table (except `organizations`) has an `organization_id` foreign key.
- **Tenant Derivation**: The tenant context is derived strictly from the authenticated user (`$user->organization_id`). It is never supplied by the client in POST/PUT request bodies, which prevents cross-tenant parameter injection or spoofing.
- **Controller Queries Scope**: In controllers (`TicketController`, `CommentController`, `DashboardController`), queries are scoped implicitly:
  `Ticket::where('organization_id', $user->organization_id)`
- **Access Control**: On top of tenant isolation, role boundaries are enforced:
  - Customers can only see their own tickets (`where('requester_id', $user->id)`).
  - Customers are blocked from seeing internal comments (`is_internal: true` is filtered out of comments).
  - Customers cannot assign tickets or modify priorities.

## Data model
- **Organization**: Holds the tenant name and domain details.
- **User**: Scoped to an organization. Features a `role` attribute: `admin`, `agent`, or `customer`.
- **Ticket**: Contains the ticket details (`subject`, `description`, `status`, `priority`), and links to `organization_id`, `requester_id` (customer), and `assignee_id` (agent).
- **Comment**: Holds message logs for a ticket thread. Includes `is_internal` flag to mark notes private to agents/admins.
- **SlaPolicy**: Custom response and resolution time limits (in minutes) for the tenant per priority.
- **ActivityLog**: Logs ticket modifications (created, status changed, assigned) detailing actor and timestamp.

## API routes (routes/api.php)
All routes are prefixed by `/api/` and resolve user sessions.

| Method | Path | Auth / Role | Notes |
| --- | --- | --- | --- |
| POST | `/api/login` | Guest | Authenticaties credentials and logs user in |
| POST | `/api/logout` | Auth | Terminates session |
| GET | `/api/me` | Auth | Returns authenticated user details and organization |
| GET | `/api/tickets` | Auth | Lists tickets (customers see only theirs; agents see all in org) |
| POST | `/api/tickets` | Auth | Creates a new ticket |
| GET | `/api/tickets/{id}` | Auth | Fetches detailed ticket page (comments and logs) |
| PUT | `/api/tickets/{id}` | Auth | Updates status, priority, or assignee |
| DELETE | `/api/tickets/{id}` | Admin | Deletes ticket from database |
| POST | `/api/tickets/{ticketId}/comments` | Auth | Appends a comment to the thread (public or internal) |
| GET | `/api/dashboard` | Auth | Calculates tenant statistics, SLA breach rates, and agent metrics |

## Key decisions
- **Fallback Authentication Header**: Supported a custom `X-User-Id` header during development and test execution. This allows curl commands and PHPUnit feature tests to execute API calls without maintaining full stateful session cookies.
- **Reactive Countdown Timers**: Handled countdown calculation dynamically on the frontend via React Hooks. The page ticks every second based on `created_at` and `SlaPolicy` configurations, which keeps the UI alive without triggering constant database polls.
- **Strict Comment Sanitization**: Configured `CommentController` to ignore/override `is_internal: true` to `false` when the comment author role is `customer`, preventing customer-facing accounts from posting private notes.

