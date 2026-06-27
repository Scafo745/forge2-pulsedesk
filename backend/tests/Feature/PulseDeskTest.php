<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use App\Models\Ticket;
use App\Models\Comment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class PulseDeskTest extends TestCase
{
    use RefreshDatabase;

    private $orgA;
    private $orgB;
    private $adminA;
    private $agentA;
    private $customerA;
    private $customerB;
    private $ticketA;
    private $ticketB;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Org A
        $this->orgA = Organization::create([
            'name' => 'Org A',
            'domain' => 'orga.com',
        ]);

        $password = Hash::make('password');

        $this->adminA = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Admin A',
            'email' => 'admina@orga.com',
            'password' => $password,
            'role' => 'admin',
        ]);

        $this->agentA = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Agent A',
            'email' => 'agenta@orga.com',
            'password' => $password,
            'role' => 'agent',
        ]);

        $this->customerA = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Customer A',
            'email' => 'customera@orga.com',
            'password' => $password,
            'role' => 'customer',
        ]);

        // Create Ticket A in Org A
        $this->ticketA = Ticket::create([
            'organization_id' => $this->orgA->id,
            'subject' => 'Ticket from Org A',
            'description' => 'Help needed in Org A',
            'status' => 'open',
            'priority' => 'medium',
            'requester_id' => $this->customerA->id,
        ]);

        // Create Org B
        $this->orgB = Organization::create([
            'name' => 'Org B',
            'domain' => 'orgb.com',
        ]);

        $this->customerB = User::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Customer B',
            'email' => 'customerb@orgb.com',
            'password' => $password,
            'role' => 'customer',
        ]);

        // Create Ticket B in Org B
        $this->ticketB = Ticket::create([
            'organization_id' => $this->orgB->id,
            'subject' => 'Ticket from Org B',
            'description' => 'Help needed in Org B',
            'status' => 'open',
            'priority' => 'medium',
            'requester_id' => $this->customerB->id,
        ]);
    }

    /** @test */
    public function test_cross_tenant_access_is_forbidden()
    {
        // Try to access Ticket B (Org B) as Admin A (Org A)
        $response = $this->withHeader('X-User-Id', $this->adminA->id)
            ->getJson("/api/tickets/{$this->ticketB->id}");

        $response->assertStatus(404); // Scoped queries return 404 for missing or cross-tenant records
    }

    /** @test */
    public function test_customer_can_only_see_their_own_tickets()
    {
        // Create another customer in Org A
        $customerA2 = User::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Customer A2',
            'email' => 'customera2@orga.com',
            'password' => Hash::make('password'),
            'role' => 'customer',
        ]);

        // Customer A2 tries to access Customer A's ticket
        $response = $this->withHeader('X-User-Id', $customerA2->id)
            ->getJson("/api/tickets/{$this->ticketA->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_customer_cannot_view_internal_comments()
    {
        // Add a public and an internal comment to Ticket A
        Comment::create([
            'ticket_id' => $this->ticketA->id,
            'author_id' => $this->agentA->id,
            'body' => 'This is a public comment',
            'is_internal' => false,
        ]);

        Comment::create([
            'ticket_id' => $this->ticketA->id,
            'author_id' => $this->agentA->id,
            'body' => 'This is an internal note',
            'is_internal' => true,
        ]);

        // Customer A views Ticket A
        $response = $this->withHeader('X-User-Id', $this->customerA->id)
            ->getJson("/api/tickets/{$this->ticketA->id}");

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'comments');
        $response->assertJsonPath('comments.0.body', 'This is a public comment');
    }

    /** @test */
    public function test_agent_can_view_internal_comments()
    {
        Comment::create([
            'ticket_id' => $this->ticketA->id,
            'author_id' => $this->agentA->id,
            'body' => 'This is a public comment',
            'is_internal' => false,
        ]);

        Comment::create([
            'ticket_id' => $this->ticketA->id,
            'author_id' => $this->agentA->id,
            'body' => 'This is an internal note',
            'is_internal' => true,
        ]);

        // Agent A views Ticket A
        $response = $this->withHeader('X-User-Id', $this->agentA->id)
            ->getJson("/api/tickets/{$this->ticketA->id}");

        $response->assertStatus(200);
        $response->assertJsonCount(2, 'comments');
    }

    /** @test */
    public function test_customer_cannot_create_internal_comments()
    {
        // Customer A tries to create an internal comment
        $response = $this->withHeader('X-User-Id', $this->customerA->id)
            ->postJson("/api/tickets/{$this->ticketA->id}/comments", [
                'body' => 'Trying to create internal comment',
                'is_internal' => true,
            ]);

        $response->assertStatus(201);
        $response->assertJsonPath('is_internal', false); // Middleware/Controller overrides to false
    }

    /** @test */
    public function test_customer_cannot_modify_restricted_fields_on_tickets()
    {
        // Customer A tries to update assignee or priority
        $response = $this->withHeader('X-User-Id', $this->customerA->id)
            ->putJson("/api/tickets/{$this->ticketA->id}", [
                'assignee_id' => $this->agentA->id,
                'priority' => 'urgent',
            ]);

        // Validation or controller should ignore or reject restricted fields
        $response->assertStatus(200);
        $this->assertNull($this->ticketA->fresh()->assignee_id);
        $this->assertEquals('medium', $this->ticketA->fresh()->priority);
    }
}
