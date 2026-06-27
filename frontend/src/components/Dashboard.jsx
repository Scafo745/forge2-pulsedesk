import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle2, Inbox, Users, ArrowUpRight, BarChart2 } from 'lucide-react';

export default function Dashboard({ user, onSelectTicket, onViewTickets }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
<<<<<<< HEAD
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard', {
        headers: {
          'X-User-Id': user.id,
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to load dashboard.');
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
=======
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard', {
          headers: {
            'X-User-Id': user.id,
          },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to load dashboard.');
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user.id]);
>>>>>>> 9f4eeb8 (Fix lint warnings, backend errors, and improve multi‑tenant validation)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 text-gray-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-900/40 to-indigo-950/40 border border-purple-500/20 rounded-2xl p-8 backdrop-blur-md">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight margin-0 m-0 text-left">
            Welcome back, {user.name}!
          </h1>
          <p className="text-purple-300 text-sm mt-2 text-left">
            Workspace scoped to <span className="font-bold">{user.organization?.name}</span> ({user.role.toUpperCase()})
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#16171d] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Open Tickets</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.status_counts.open}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Inbox className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#16171d] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Agent</p>
              <h3 className="text-3xl font-bold text-white mt-2">{stats.status_counts.pending}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#16171d] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-red-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SLA Breach Rate</p>
              <h3 className="text-3xl font-bold text-red-400 mt-2">{stats.sla_breach_rate}%</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-500 h-full rounded-full" style={{ width: `${stats.sla_breach_rate}%` }} />
          </div>
        </div>

        <div className="bg-[#16171d] border border-gray-800 rounded-xl p-6 relative overflow-hidden group hover:border-green-500/40 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg First Response</p>
              <h3 className="text-3xl font-bold text-green-400 mt-2">
                {stats.avg_first_response_time > 60 
                  ? `${Math.round(stats.avg_first_response_time / 60 * 10) / 10}h`
                  : `${stats.avg_first_response_time}m`}
              </h3>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Agent Performance & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Agent Leaderboard */}
        <div className="lg:col-span-1 bg-[#16171d] border border-gray-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">Agent Performance</h3>
          </div>
          <div className="space-y-4 flex-1">
            {stats.agent_performance.map((agent) => (
              <div key={agent.id} className="flex justify-between items-center p-3 rounded-lg bg-[#1e2028] border border-gray-800">
                <div>
                  <p className="font-semibold text-sm text-white">{agent.name}</p>
                  <p className="text-xs text-gray-400 uppercase">{agent.role}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-purple-400">{agent.resolved_count}</span>
                  <p className="text-[10px] text-gray-400">resolved</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Log Feed */}
        <div className="lg:col-span-2 bg-[#16171d] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Recent Activity Log</h3>
            </div>
            <button 
              onClick={onViewTickets}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              View Tickets <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {stats.recent_logs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No recent activity detected.</p>
            ) : (
              stats.recent_logs.map((log) => (
                <div 
                  key={log.id} 
                  onClick={() => onSelectTicket(log.ticket_id)}
                  className="flex items-start gap-4 p-3 rounded-lg bg-[#1e2028]/50 hover:bg-[#1e2028] border border-gray-800/60 hover:border-purple-500/20 cursor-pointer transition-all"
                >
                  <div className={`p-2 rounded-lg text-xs font-bold shrink-0 ${
                    log.action === 'created' ? 'bg-green-500/10 text-green-400' :
                    log.action === 'status_changed' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-purple-500/10 text-purple-400'
                  }`}>
                    {log.action.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      <span className="font-semibold text-white">{log.user_name}</span> on <span className="italic text-purple-300">"{log.ticket_subject}"</span>
                    </p>
                    {log.metadata && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        {log.metadata.old_status && `Changed status from ${log.metadata.old_status} to ${log.metadata.new_status}`}
                        {log.metadata.new_assignee_id && `Assigned ticket`}
                      </p>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
