import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, User } from 'lucide-react';

export default function TicketList({ user, onSelectTicket }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [agents, setAgents] = useState([]);

  // Create Ticket Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
    fetchAgents();
  }, [fetchTickets, fetchAgents]);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (priority) params.append('priority', priority);
      if (assigneeId) params.append('assignee_id', assigneeId);

      const response = await fetch(`/api/tickets?${params.toString()}`, {
        headers: {
          'X-User-Id': user.id,
        },
      });
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, priority, assigneeId, user.id]);

  const fetchAgents = useCallback(async () => {
    try {
      // In a real app we'd load agents endpoint, for now we can infer them or load dashboard stats
      const response = await fetch('/api/dashboard', {
        headers: {
          'X-User-Id': user.id,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAgents(data.agent_performance);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user.id]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
        body: JSON.stringify({
          subject: newSubject,
          description: newDescription,
          priority: newPriority,
        }),
      });

      if (response.ok) {
        setIsModalOpen(false);
        setNewSubject('');
        setNewDescription('');
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreateLoading(false);
    }
  };

  // Group tickets by status
  const statuses = ['open', 'pending', 'resolved', 'closed'];
  
  const getTicketsByStatus = (status) => {
    return tickets.filter(ticket => ticket.status === status);
  };

  const getPriorityBadgeClass = (prio) => {
    switch (prio) {
      case 'urgent': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 p-6 text-gray-200">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight margin-0 m-0">Tickets Workspace</h2>
          <p className="text-gray-400 text-sm">Manage, search, and assign incoming support requests</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 active:scale-95 text-sm"
        >
          <Plus className="w-4 h-4" /> Create Ticket
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#16171d] border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            placeholder="Search tickets by subject or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-500 shrink-0" />
          <select
            className="bg-[#1e2028] border border-gray-800 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-full"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        {/* Assignee Filter */}
        {user.role !== 'customer' && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <User className="w-4 h-4 text-gray-500 shrink-0" />
            <select
              className="bg-[#1e2028] border border-gray-800 rounded-lg py-2 px-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500 w-full"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statuses.map(status => {
            const list = getTicketsByStatus(status);
            return (
              <div key={status} className="bg-[#16171d] border border-gray-800 rounded-xl p-4 flex flex-col min-h-[500px]">
                {/* Column Header */}
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                  <h3 className="font-bold text-white capitalize text-sm">{status}</h3>
                  <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full font-bold">
                    {list.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {list.length === 0 ? (
                    <div className="border border-dashed border-gray-800 rounded-lg p-6 text-center text-xs text-gray-500">
                      No tickets
                    </div>
                  ) : (
                    list.map(ticket => (
                      <div
                        key={ticket.id}
                        onClick={() => onSelectTicket(ticket.id)}
                        className="bg-[#1e2028] border border-gray-800 hover:border-purple-500/30 p-4 rounded-xl cursor-pointer hover:-translate-y-[2px] transition-all duration-200"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${getPriorityBadgeClass(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-sm line-clamp-2 text-left">{ticket.subject}</h4>
                        <p className="text-gray-400 text-xs mt-2 line-clamp-2 text-left">{ticket.description}</p>
                        
                        <div className="mt-4 pt-3 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
                          <span>Req: {ticket.requester?.name.split(' ')[0]}</span>
                          <span>{ticket.assignee ? `Agent: ${ticket.assignee.name.split(' ')[0]}` : 'Unassigned'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#16171d] border border-gray-800 rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-xl font-bold text-white mb-4">Create New Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Summarize the support request..."
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Description</label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2.5 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  placeholder="Provide detailed information regarding the issue..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Priority</label>
                <select
                  className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2.5 px-3 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent (SLA 1h / 4h)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#1e2028] border border-gray-850 rounded-lg text-sm text-gray-300 hover:bg-[#272932] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
