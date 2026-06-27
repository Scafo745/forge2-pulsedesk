import React, { useState, useEffect } from 'react';
import { ChevronLeft, Send, Lock, User, Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export default function TicketDetail({ user, ticketId, onBack }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  // SLA countdown timer state
  const [now, setNow] = useState(new Date());
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetchTicket();
    fetchAgents();
  }, [ticketId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tickets/${ticketId}`, {
        headers: {
          'X-User-Id': user.id,
        },
      });
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
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
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSendLoading(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
        body: JSON.stringify({
          body: newComment,
          is_internal: isInternal,
        }),
      });

      if (response.ok) {
        setNewComment('');
        setIsInternal(false);
        fetchTicket(); // Reload ticket to show the comment and updated SLA metrics
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendLoading(false);
    }
  };

  const handleUpdateMeta = async (fields) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
        },
        body: JSON.stringify(fields),
      });

      if (response.ok) {
        fetchTicket();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Pre-configured SLA Targets (Urgent: 1h/4h; High: 4h/12h; Medium: 12h/24h; Low: 24h/72h)
  const slaTargets = {
    urgent: { response: 60, resolution: 240 },
    high: { response: 240, resolution: 720 },
    medium: { response: 720, resolution: 1440 },
    low: { response: 1440, resolution: 4320 },
  };

  const getSlaTimes = () => {
    const createdTime = new Date(ticket.created_at);
    const target = slaTargets[ticket.priority] || { response: 720, resolution: 1440 };

    const responseDeadline = new Date(createdTime.getTime() + target.response * 60000);
    const resolutionDeadline = new Date(createdTime.getTime() + target.resolution * 60000);

    return { responseDeadline, resolutionDeadline };
  };

  const formatCountdown = (deadline) => {
    const diff = deadline.getTime() - now.getTime();
    if (diff <= 0) return { text: 'BREACHED', isBreached: true };

    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);

    return {
      text: `${hrs > 0 ? `${hrs}h ` : ''}${mins}m ${secs}s`,
      isBreached: false
    };
  };

  const { responseDeadline, resolutionDeadline } = getSlaTimes();
  
  // Check if first agent response has occurred
  const firstAgentResponse = ticket.comments
    ?.filter(c => !c.is_internal && ['agent', 'admin'].includes(c.author?.role))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];

  const firstResponseTimeStatus = () => {
    if (firstAgentResponse) {
      const respTime = new Date(firstAgentResponse.created_at);
      const diffMins = Math.round((respTime - new Date(ticket.created_at)) / 60000);
      const target = slaTargets[ticket.priority]?.response || 720;
      const breached = diffMins > target;

      return {
        label: `Responded in ${diffMins}m`,
        color: breached ? 'text-red-400 border border-red-500/20 bg-red-500/10' : 'text-green-400 border border-green-500/20 bg-green-500/10',
        icon: breached ? ShieldAlert : CheckCircle
      };
    } else {
      const { text, isBreached } = formatCountdown(responseDeadline);
      return {
        label: isBreached ? 'Response BREACHED' : `Response SLA: ${text}`,
        color: isBreached ? 'text-red-400 border border-red-500/20 bg-red-500/10 animate-pulse' : 'text-yellow-400 border border-yellow-500/20 bg-yellow-500/10',
        icon: isBreached ? ShieldAlert : Clock
      };
    }
  };

  const resolutionTimeStatus = () => {
    const isResolved = ['resolved', 'closed'].includes(ticket.status);
    if (isResolved) {
      // Find resolution log or use ticket updated_at
      const resolveLog = ticket.activity_logs
        ?.filter(l => l.action === 'status_changed' && ['resolved', 'closed'].includes(l.metadata?.new_status))[0];
      const resTime = resolveLog ? new Date(resolveLog.created_at) : new Date(ticket.updated_at);
      const diffHrs = Math.round(((resTime - new Date(ticket.created_at)) / 3600000) * 10) / 10;
      const target = (slaTargets[ticket.priority]?.resolution || 1440) / 60;
      const breached = diffHrs > target;

      return {
        label: `Resolved in ${diffHrs}h`,
        color: breached ? 'text-red-400 border border-red-500/20 bg-red-500/10' : 'text-green-400 border border-green-500/20 bg-green-500/10',
        icon: breached ? ShieldAlert : CheckCircle
      };
    } else {
      const { text, isBreached } = formatCountdown(resolutionDeadline);
      return {
        label: isBreached ? 'Resolution BREACHED' : `Resolution SLA: ${text}`,
        color: isBreached ? 'text-red-400 border border-red-500/20 bg-red-500/10 animate-pulse' : 'text-yellow-400 border border-yellow-500/20 bg-yellow-500/10',
        icon: isBreached ? ShieldAlert : Clock
      };
    }
  };

  const respStatus = firstResponseTimeStatus();
  const resStatus = resolutionTimeStatus();

  return (
    <div className="space-y-6 p-6 text-gray-200">
      {/* Back Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-all font-semibold uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" /> Back to workspace
        </button>

        <div className="flex items-center gap-3">
          {/* SLA Badges */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${respStatus.color}`}>
            <respStatus.icon className="w-3.5 h-3.5" />
            <span>{respStatus.label}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${resStatus.color}`}>
            <resStatus.icon className="w-3.5 h-3.5" />
            <span>{resStatus.label}</span>
          </div>
        </div>
      </div>

      {/* Ticket Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left/Middle Column: Subject, Description, Message Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#16171d] border border-gray-800 rounded-xl p-6 space-y-4">
            <h1 className="text-2xl font-bold text-white tracking-tight margin-0 m-0 text-left">
              {ticket.subject}
            </h1>
            <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed text-left">
              {ticket.description}
            </p>
          </div>

          {/* Conversation History */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white text-left">Conversation History</h3>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {ticket.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    comment.is_internal
                      ? 'bg-amber-500/5 border-amber-500/20 shadow-inner'
                      : 'bg-[#16171d] border-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{comment.author.name}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider bg-gray-800 px-1.5 py-0.5 rounded font-semibold">
                        {comment.author.role}
                      </span>
                      {comment.is_internal && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          <Lock className="w-3 h-3" /> INTERNAL NOTE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500">
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Reply Editor */}
          <form onSubmit={handlePostComment} className="bg-[#16171d] border border-gray-800 rounded-xl p-4 space-y-4">
            <textarea
              required
              rows={3}
              placeholder="Write your response here..."
              className="w-full bg-[#1e2028] border border-gray-800 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />

            <div className="flex justify-between items-center">
              {/* Internal Notes toggle (Agent/Admin only) */}
              {user.role !== 'customer' ? (
                <button
                  type="button"
                  onClick={() => setIsInternal(!isInternal)}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    isInternal
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-[#1e2028] text-gray-400 border-gray-850 hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Internal Note</span>
                </button>
              ) : <div />}

              <button
                type="submit"
                disabled={sendLoading}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 active:scale-95 transition-all"
              >
                {sendLoading ? 'Sending...' : 'Send Reply'} <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Sidebar Metadata controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#16171d] border border-gray-800 rounded-xl p-6 space-y-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider pb-2 border-b border-gray-800 text-left">
              Ticket Metadata
            </h3>

            {/* Requester details */}
            <div className="space-y-1 text-left">
              <label className="block text-[11px] font-bold text-gray-500 uppercase">Requester</label>
              <p className="font-semibold text-sm text-white">{ticket.requester.name}</p>
              <p className="text-xs text-gray-400">{ticket.requester.email}</p>
            </div>

            {/* Priority Select */}
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-bold text-gray-500 uppercase">Priority</label>
              {user.role === 'customer' ? (
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${
                  ticket.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                  ticket.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                  ticket.priority === 'medium' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                  {ticket.priority}
                </span>
              ) : (
                <select
                  className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={ticket.priority}
                  onChange={(e) => handleUpdateMeta({ priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              )}
            </div>

            {/* Status Select */}
            <div className="space-y-2 text-left">
              <label className="block text-[11px] font-bold text-gray-500 uppercase">Status</label>
              <select
                className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                value={ticket.status}
                onChange={(e) => handleUpdateMeta({ status: e.target.value })}
              >
                {user.role === 'customer' ? (
                  <>
                    <option value={ticket.status} disabled>{ticket.status.toUpperCase()}</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="closed">CLOSED</option>
                  </>
                ) : (
                  <>
                    <option value="open">OPEN</option>
                    <option value="pending">PENDING</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="closed">CLOSED</option>
                  </>
                )}
              </select>
            </div>

            {/* Assignee Select */}
            {user.role !== 'customer' && (
              <div className="space-y-2 text-left">
                <label className="block text-[11px] font-bold text-gray-500 uppercase">Assignee</label>
                <select
                  className="w-full bg-[#1e2028] border border-gray-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-purple-500"
                  value={ticket.assignee_id || ''}
                  onChange={(e) => handleUpdateMeta({ assignee_id: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
