<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\User;
use App\Models\Ticket;
use App\Models\Comment;
use App\Models\SlaPolicy;
use App\Models\ActivityLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Organization (Tenant)
        $org = Organization::create([
            'name' => 'Acme Corp',
            'domain' => 'acme.com',
        ]);

        // 2. Create Users
        $password = Hash::make('password');

        $admin = User::create([
            'organization_id' => $org->id,
            'name' => 'Alice Admin',
            'email' => 'admin@acme.com',
            'password' => $password,
            'role' => 'admin',
        ]);

        $agent1 = User::create([
            'organization_id' => $org->id,
            'name' => 'Bob Agent',
            'email' => 'agent1@acme.com',
            'password' => $password,
            'role' => 'agent',
        ]);

        $agent2 = User::create([
            'organization_id' => $org->id,
            'name' => 'Charlie Agent',
            'email' => 'agent2@acme.com',
            'password' => $password,
            'role' => 'agent',
        ]);

        $customer1 = User::create([
            'organization_id' => $org->id,
            'name' => 'Dave Customer',
            'email' => 'customer1@acme.com',
            'password' => $password,
            'role' => 'customer',
        ]);

        $customer2 = User::create([
            'organization_id' => $org->id,
            'name' => 'Eve Customer',
            'email' => 'customer2@acme.com',
            'password' => $password,
            'role' => 'customer',
        ]);

        // 3. Create SLA Policies
        $policies = [
            ['priority' => 'urgent', 'response_time_limit_minutes' => 60, 'resolution_time_limit_minutes' => 240],
            ['priority' => 'high', 'response_time_limit_minutes' => 240, 'resolution_time_limit_minutes' => 720],
            ['priority' => 'medium', 'response_time_limit_minutes' => 720, 'resolution_time_limit_minutes' => 1440],
            ['priority' => 'low', 'response_time_limit_minutes' => 1440, 'resolution_time_limit_minutes' => 4320],
        ];

        foreach ($policies as $policy) {
            SlaPolicy::create([
                'organization_id' => $org->id,
                'priority' => $policy['priority'],
                'response_time_limit_minutes' => $policy['response_time_limit_minutes'],
                'resolution_time_limit_minutes' => $policy['resolution_time_limit_minutes'],
            ]);
        }

        // 4. Create sample tickets with SLA metrics and conversations
        $now = Carbon::now();

        // Ticket 1: Urgent priority, resolved, within SLA
        $t1 = Ticket::create([
            'organization_id' => $org->id,
            'subject' => 'Production site down',
            'description' => 'We are getting a 500 error on the checkout page. Urgent help needed.',
            'status' => 'resolved',
            'priority' => 'urgent',
            'requester_id' => $customer1->id,
            'assignee_id' => $agent1->id,
            'created_at' => $now->copy()->subHours(3),
            'updated_at' => $now->copy()->subHours(1),
        ]);

        Comment::create([
            'ticket_id' => $t1->id,
            'author_id' => $agent1->id,
            'body' => 'I have checked the logs and restarted the web server. It seems a bad deployment caused the config failure. It is now up.',
            'is_internal' => false,
            'created_at' => $now->copy()->subHours(2.5),
        ]);

        Comment::create([
            'ticket_id' => $t1->id,
            'author_id' => $agent1->id,
            'body' => 'Note: The checkout failure was due to environment variable discrepancy. Remind deployment team to check ENV vars.',
            'is_internal' => true,
            'created_at' => $now->copy()->subHours(2.4),
        ]);

        Comment::create([
            'ticket_id' => $t1->id,
            'author_id' => $customer1->id,
            'body' => 'Works perfectly now. Thanks for the quick response!',
            'is_internal' => false,
            'created_at' => $now->copy()->subHours(1),
        ]);

        ActivityLog::create([
            'ticket_id' => $t1->id,
            'user_id' => $customer1->id,
            'action' => 'created',
            'created_at' => $now->copy()->subHours(3),
        ]);

        ActivityLog::create([
            'ticket_id' => $t1->id,
            'user_id' => $agent1->id,
            'action' => 'status_changed',
            'metadata' => ['old_status' => 'open', 'new_status' => 'resolved'],
            'created_at' => $now->copy()->subHours(1),
        ]);

        // Ticket 2: High priority, open, SLA breached (created 10 hours ago, no assignee)
        $t2 = Ticket::create([
            'organization_id' => $org->id,
            'subject' => 'Cannot export report to CSV',
            'description' => 'When clicking the export button, the page hangs and eventually errors out.',
            'status' => 'open',
            'priority' => 'high',
            'requester_id' => $customer2->id,
            'assignee_id' => null,
            'created_at' => $now->copy()->subHours(10),
            'updated_at' => $now->copy()->subHours(10),
        ]);

        ActivityLog::create([
            'ticket_id' => $t2->id,
            'user_id' => $customer2->id,
            'action' => 'created',
            'created_at' => $now->copy()->subHours(10),
        ]);

        // Ticket 3: Urgent priority, open, within SLA (created 30 mins ago)
        $t3 = Ticket::create([
            'organization_id' => $org->id,
            'subject' => 'Billing charge error',
            'description' => 'I was charged twice for the monthly subscription. Please refund.',
            'status' => 'open',
            'priority' => 'urgent',
            'requester_id' => $customer1->id,
            'assignee_id' => null,
            'created_at' => $now->copy()->subMinutes(30),
            'updated_at' => $now->copy()->subMinutes(30),
        ]);

        ActivityLog::create([
            'ticket_id' => $t3->id,
            'user_id' => $customer1->id,
            'action' => 'created',
            'created_at' => $now->copy()->subMinutes(30),
        ]);

        // Ticket 4: Medium priority, pending, within SLA (created 5 hours ago, replied by agent 4 hours ago)
        $t4 = Ticket::create([
            'organization_id' => $org->id,
            'subject' => 'Custom domain setup failing',
            'description' => 'I added the CNAME record but the SSL certificate is not generating.',
            'status' => 'pending',
            'priority' => 'medium',
            'requester_id' => $customer2->id,
            'assignee_id' => $agent2->id,
            'created_at' => $now->copy()->subHours(5),
            'updated_at' => $now->copy()->subHours(4),
        ]);

        Comment::create([
            'ticket_id' => $t4->id,
            'author_id' => $agent2->id,
            'body' => 'Can you please confirm if you configured the CNAME pointing to proxy.pulsedesk.com? It might take up to 24 hours to propagate.',
            'is_internal' => false,
            'created_at' => $now->copy()->subHours(4),
        ]);

        ActivityLog::create([
            'ticket_id' => $t4->id,
            'user_id' => $customer2->id,
            'action' => 'created',
            'created_at' => $now->copy()->subHours(5),
        ]);

        ActivityLog::create([
            'ticket_id' => $t4->id,
            'user_id' => $agent2->id,
            'action' => 'assigned',
            'created_at' => $now->copy()->subHours(4),
        ]);

        // Seed 8 more tickets to get to ~12 tickets in various states
        $statuses = ['open', 'pending', 'resolved', 'closed'];
        $priorities = ['low', 'medium', 'high', 'urgent'];
        $subjects = [
            'API integration docs request',
            'Change account owner details',
            'SLA timers visual bug',
            'Request to delete account data',
            'Bulk export timeout',
            'Add custom fields to tickets',
            'Dark mode requests',
            'Team invite links expired'
        ];

        for ($i = 0; $i < 8; $i++) {
            $createdTime = $now->copy()->subDays(rand(1, 5))->subHours(rand(1, 23));
            $priority = $priorities[$i % 4];
            $status = $statuses[$i % 4];
            $assignee = ($status !== 'open') ? ($i % 2 === 0 ? $agent1 : $agent2) : null;
            $updatedTime = ($status !== 'open') ? $createdTime->copy()->addHours(2) : $createdTime;

            $t = Ticket::create([
                'organization_id' => $org->id,
                'subject' => $subjects[$i],
                'description' => "Detailed issue description for: " . $subjects[$i],
                'status' => $status,
                'priority' => $priority,
                'requester_id' => $i % 2 === 0 ? $customer1->id : $customer2->id,
                'assignee_id' => $assignee?->id,
                'created_at' => $createdTime,
                'updated_at' => $updatedTime,
            ]);

            ActivityLog::create([
                'ticket_id' => $t->id,
                'user_id' => $i % 2 === 0 ? $customer1->id : $customer2->id,
                'action' => 'created',
                'created_at' => $createdTime,
            ]);

            if ($assignee) {
                ActivityLog::create([
                    'ticket_id' => $t->id,
                    'user_id' => $admin->id,
                    'action' => 'assigned',
                    'created_at' => $createdTime->copy()->addMinutes(30),
                ]);

                if ($status === 'resolved' || $status === 'closed') {
                    ActivityLog::create([
                        'ticket_id' => $t->id,
                        'user_id' => $assignee->id,
                        'action' => 'status_changed',
                        'metadata' => ['old_status' => 'open', 'new_status' => $status],
                        'created_at' => $updatedTime,
                    ]);

                    Comment::create([
                        'ticket_id' => $t->id,
                        'author_id' => $assignee->id,
                        'body' => "This issue has been successfully handled and set to " . $status,
                        'is_internal' => false,
                        'created_at' => $updatedTime,
                    ]);
                }
            }
        }
    }
}

