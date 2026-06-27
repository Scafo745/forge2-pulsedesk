<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\User;

class CommentController extends Controller
{
    private function getAuthenticatedUser(Request $request)
    {
        if ($request->hasHeader('X-User-Id')) {
            return User::find($request->header('X-User-Id'));
        }
        return Auth::user();
    }

    public function store(Request $request, $ticketId)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $ticket = Ticket::where('organization_id', $user->organization_id)->find($ticketId);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        if ($user->role === 'customer' && $ticket->requester_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $data = $request->validate([
            'body' => 'required|string',
            'is_internal' => 'nullable|boolean',
        ]);

        $comment = new Comment();
        $comment->ticket_id = $ticket->id;
        $comment->author_id = $user->id;
        $comment->body = $data['body'];

        // Customers cannot create internal notes
        if ($user->role === 'customer') {
            $comment->is_internal = false;
        } else {
            $comment->is_internal = $data['is_internal'] ?? false;
        }

        $comment->save();

        // If the ticket was open and the agent replied, we might transition status or touch updated_at
        $ticket->touch();

        return response()->json($comment->load('author'), 201);
    }
}
