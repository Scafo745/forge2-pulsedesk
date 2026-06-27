<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
<<<<<<< HEAD
=======
use Illuminate\Validation\Rule;
>>>>>>> 9f4eeb8 (Fix lint warnings, backend errors, and improve multi‑tenant validation)
use App\Models\Ticket;
use App\Models\User;
use App\Models\ActivityLog;

class TicketController extends Controller
{
    private function getAuthenticatedUser(Request $request)
    {
        if ($request->hasHeader('X-User-Id')) {
            return User::find($request->header('X-User-Id'));
        }
        return Auth::user();
    }

    public function index(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Scope by organization
        $query = Ticket::where('organization_id', $user->organization_id)
            ->with(['requester', 'assignee']);

        // Scope by customer role
        if ($user->role === 'customer') {
            $query->where('requester_id', $user->id);
        }

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('assignee_id')) {
            $query->where('assignee_id', $request->assignee_id === 'unassigned' ? null : $request->assignee_id);
        }

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tickets = $query->orderBy('created_at', 'desc')->get();

        return response()->json($tickets);
    }

    public function store(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $data = $request->validate([
            'subject' => 'required|string|max:255',
            'description' => 'required|string',
            'priority' => 'nullable|in:low,medium,high,urgent',
<<<<<<< HEAD
            'requester_id' => 'nullable|exists:users,id',
            'assignee_id' => 'nullable|exists:users,id',
=======
            'requester_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('organization_id', $user->organization_id),
            ],
            'assignee_id' => [
                'nullable',
                Rule::exists('users', 'id')->where('organization_id', $user->organization_id),
            ],
>>>>>>> 9f4eeb8 (Fix lint warnings, backend errors, and improve multi‑tenant validation)
        ]);

        $ticket = new Ticket();
        $ticket->organization_id = $user->organization_id;
        $ticket->subject = $data['subject'];
        $ticket->description = $data['description'];
        $ticket->priority = $data['priority'] ?? 'medium';

        if ($user->role === 'customer') {
            $ticket->requester_id = $user->id;
            $ticket->assignee_id = null;
        } else {
            $ticket->requester_id = $data['requester_id'] ?? $user->id;
            $ticket->assignee_id = $data['assignee_id'] ?? null;
        }

        $ticket->status = 'open';
        $ticket->save();

        ActivityLog::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'action' => 'created',
        ]);

        return response()->json($ticket->load(['requester', 'assignee']), 201);
    }

    public function show(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $ticket = Ticket::where('organization_id', $user->organization_id)
            ->with(['requester', 'assignee', 'comments.author', 'activityLogs.user'])
            ->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        if ($user->role === 'customer' && $ticket->requester_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        // Filter comments for customer (no internal notes)
        if ($user->role === 'customer') {
            $ticket->setRelation('comments', $ticket->comments->where('is_internal', false)->values());
        }

        return response()->json($ticket);
    }

    public function update(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $ticket = Ticket::where('organization_id', $user->organization_id)->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        if ($user->role === 'customer') {
            // Customers can only close/resolve their own tickets, or update subject/description if open
            if ($ticket->requester_id !== $user->id) {
                return response()->json(['message' => 'Unauthorized.'], 403);
            }

            $data = $request->validate([
                'status' => 'nullable|in:resolved,closed',
                'subject' => 'nullable|string|max:255',
                'description' => 'nullable|string',
            ]);
        } else {
            // Admins/Agents can update everything
            $data = $request->validate([
                'subject' => 'nullable|string|max:255',
                'description' => 'nullable|string',
                'status' => 'nullable|in:open,pending,resolved,closed',
                'priority' => 'nullable|in:low,medium,high,urgent',
<<<<<<< HEAD
                'assignee_id' => 'nullable|exists:users,id',
=======
                'assignee_id' => [
                    'nullable',
                    Rule::exists('users', 'id')->where('organization_id', $user->organization_id),
                ],
>>>>>>> 9f4eeb8 (Fix lint warnings, backend errors, and improve multi‑tenant validation)
            ]);
        }

        $oldStatus = $ticket->status;
        $oldAssignee = $ticket->assignee_id;
        $oldPriority = $ticket->priority;

        if (isset($data['subject'])) $ticket->subject = $data['subject'];
        if (isset($data['description'])) $ticket->description = $data['description'];
        if (isset($data['status'])) $ticket->status = $data['status'];
        if (isset($data['priority'])) $ticket->priority = $data['priority'];
        if (array_key_exists('assignee_id', $data)) $ticket->assignee_id = $data['assignee_id'];

        $ticket->save();

        // Log actions
        if (isset($data['status']) && $oldStatus !== $data['status']) {
            ActivityLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'action' => 'status_changed',
                'metadata' => ['old_status' => $oldStatus, 'new_status' => $data['status']],
            ]);
        }

        if (array_key_exists('assignee_id', $data) && $oldAssignee !== $data['assignee_id']) {
            ActivityLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'action' => $data['assignee_id'] ? 'assigned' : 'unassigned',
                'metadata' => ['old_assignee_id' => $oldAssignee, 'new_assignee_id' => $data['assignee_id']],
            ]);
        }

        if (isset($data['priority']) && $oldPriority !== $data['priority']) {
            ActivityLog::create([
                'ticket_id' => $ticket->id,
                'user_id' => $user->id,
                'action' => 'priority_changed',
                'metadata' => ['old_priority' => $oldPriority, 'new_priority' => $data['priority']],
            ]);
        }

        return response()->json($ticket->load(['requester', 'assignee']));
    }

    public function destroy(Request $request, $id)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Only admins can delete tickets.'], 403);
        }

        $ticket = Ticket::where('organization_id', $user->organization_id)->find($id);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        $ticket->delete();

        return response()->json(['message' => 'Ticket deleted successfully.']);
    }
}
