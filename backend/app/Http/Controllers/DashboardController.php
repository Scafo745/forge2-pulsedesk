<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Ticket;
use App\Models\SlaPolicy;
use App\Models\User;
use App\Models\Comment;
use App\Models\ActivityLog;
use Carbon\Carbon;

class DashboardController extends Controller
{
    private function getAuthenticatedUser(Request $request)
    {
        if ($request->hasHeader('X-User-Id')) {
            return User::find($request->header('X-User-Id'));
        }
        return Auth::user();
    }

    public function stats(Request $request)
    {
        $user = $this->getAuthenticatedUser($request);
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Scope by organization
        $orgId = $user->organization_id;

        // 1. Status Counts
        $statusCounts = [
            'open' => Ticket::where('organization_id', $orgId)->where('status', 'open')->count(),
            'pending' => Ticket::where('organization_id', $orgId)->where('status', 'pending')->count(),
            'resolved' => Ticket::where('organization_id', $orgId)->where('status', 'resolved')->count(),
            'closed' => Ticket::where('organization_id', $orgId)->where('status', 'closed')->count(),
        ];

        // 2. Priority Counts
        $priorityCounts = [
            'low' => Ticket::where('organization_id', $orgId)->where('priority', 'low')->count(),
            'medium' => Ticket::where('organization_id', $orgId)->where('priority', 'medium')->count(),
            'high' => Ticket::where('organization_id', $orgId)->where('priority', 'high')->count(),
            'urgent' => Ticket::where('organization_id', $orgId)->where('priority', 'urgent')->count(),
        ];

        // Load SLA policies
        $policies = SlaPolicy::where('organization_id', $orgId)->get()->keyBy('priority');

        // Fetch all tickets with comments and logs to calculate response times and SLA breaches
        $tickets = Ticket::where('organization_id', $orgId)
            ->with(['comments.author', 'activityLogs'])
            ->get();

        $totalTickets = $tickets->count();
        $breachedResponseCount = 0;
        $breachedResolutionCount = 0;
        $firstResponseTimes = [];
        $totalResolvedCount = 0;

        foreach ($tickets as $ticket) {
            $priority = $ticket->priority;
            $policy = $policies[$priority] ?? null;

            // Find first public response by an agent/admin
            $firstAgentComment = $ticket->comments
                ->filter(fn($comment) => !$comment->is_internal && in_array($comment->author->role, ['agent', 'admin']))
                ->sortBy('created_at')
                ->first();

            $firstResponseMinutes = null;
            if ($firstAgentComment) {
                $firstResponseMinutes = Carbon::parse($ticket->created_at)->diffInMinutes(Carbon::parse($firstAgentComment->created_at));
                $firstResponseTimes[] = $firstResponseMinutes;
            }

            // Check First Response SLA Breach
            if ($policy) {
                $responseLimit = $policy->response_time_limit_minutes;
                if ($firstResponseMinutes !== null) {
                    if ($firstResponseMinutes > $responseLimit) {
                        $breachedResponseCount++;
                    }
                } else {
                    // Still waiting for response
                    if (in_array($ticket->status, ['open', 'pending'])) {
                        $elapsed = Carbon::parse($ticket->created_at)->diffInMinutes(Carbon::now());
                        if ($elapsed > $responseLimit) {
                            $breachedResponseCount++;
                        }
                    }
                }
            }

            // Check Resolution SLA Breach
            $isResolved = in_array($ticket->status, ['resolved', 'closed']);
            $resolutionMinutes = null;

            if ($isResolved) {
                $totalResolvedCount++;
                // Find first log changing status to resolved or closed
                $resolveLog = $ticket->activityLogs
                    ->filter(fn($log) => $log->action === 'status_changed' && isset($log->metadata['new_status']) && in_array($log->metadata['new_status'], ['resolved', 'closed']))
                    ->sortBy('created_at')
                    ->first();

                if ($resolveLog) {
                    $resolutionMinutes = Carbon::parse($ticket->created_at)->diffInMinutes(Carbon::parse($resolveLog->created_at));
                } else {
                    // Fallback to ticket updated_at
                    $resolutionMinutes = Carbon::parse($ticket->created_at)->diffInMinutes(Carbon::parse($ticket->updated_at));
                }
            }

            if ($policy) {
                $resolutionLimit = $policy->resolution_time_limit_minutes;
                if ($resolutionMinutes !== null) {
                    if ($resolutionMinutes > $resolutionLimit) {
                        $breachedResolutionCount++;
                    }
                } else {
                    // Still not resolved
                    if (!in_array($ticket->status, ['resolved', 'closed'])) {
                        $elapsed = Carbon::parse($ticket->created_at)->diffInMinutes(Carbon::now());
                        if ($elapsed > $resolutionLimit) {
                            $breachedResolutionCount++;
                        }
                    }
                }
            }
        }

        // Calculate Averages
        $avgFirstResponseTime = count($firstResponseTimes) > 0 ? round(array_sum($firstResponseTimes) / count($firstResponseTimes), 1) : 0;
        $slaBreachRate = $totalTickets > 0 ? round((($breachedResponseCount + $breachedResolutionCount) / ($totalTickets * 2)) * 100, 1) : 0;

        // 3. Team performance (tickets resolved per agent)
        $agentPerformance = [];
        $agents = User::where('organization_id', $orgId)->whereIn('role', ['agent', 'admin'])->get();

        foreach ($agents as $agent) {
            $resolvedCount = Ticket::where('organization_id', $orgId)
                ->where('assignee_id', $agent->id)
                ->whereIn('status', ['resolved', 'closed'])
                ->count();

            $agentPerformance[] = [
                'id' => $agent->id,
                'name' => $agent->name,
                'role' => $agent->role,
                'resolved_count' => $resolvedCount,
            ];
        }

        // 4. Activity Logs (last 10 events)
        $recentLogs = ActivityLog::join('tickets', 'activity_logs.ticket_id', '=', 'tickets.id')
            ->join('users', 'activity_logs.user_id', '=', 'users.id')
            ->where('tickets.organization_id', $orgId)
            ->select('activity_logs.*', 'users.name as user_name', 'tickets.subject as ticket_subject')
            ->orderBy('activity_logs.created_at', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'status_counts' => $statusCounts,
            'priority_counts' => $priorityCounts,
            'avg_first_response_time' => $avgFirstResponseTime,
            'sla_breach_rate' => $slaBreachRate,
            'breached_response_count' => $breachedResponseCount,
            'breached_resolution_count' => $breachedResolutionCount,
            'total_resolved_count' => $totalResolvedCount,
            'agent_performance' => $agentPerformance,
            'recent_logs' => $recentLogs,
        ]);
    }
}
