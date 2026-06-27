import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TicketList from './components/TicketList';
import TicketDetail from './components/TicketDetail';
import { LayoutDashboard, Inbox, LogOut, Shield } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [activeTicketId, setActiveTicketId] = useState(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/me');
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
      }
    } catch (err) {
      console.error('Session check failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setView('dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTicket = (id) => {
    setActiveTicketId(id);
    setView('ticket-detail');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-gray-200 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#16171d] border-r border-gray-800 flex flex-col shrink-0">
        {/* Brand Header */}
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-600/20">
            P
          </div>
          <div>
            <h2 className="font-extrabold text-white text-base tracking-tight margin-0 m-0">PulseDesk</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Workspace</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 flex-1 space-y-1">
          <button
            onClick={() => setView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              view === 'dashboard'
                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1e2028]/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setView('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              view === 'tickets' || view === 'ticket-detail'
                ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20 font-bold'
                : 'text-gray-400 hover:text-white hover:bg-[#1e2028]/50'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Tickets</span>
          </button>
        </nav>

        {/* User Card / Logout */}
        <div className="p-4 border-t border-gray-800 space-y-4">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-xs text-white truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold truncate">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-800 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-500/15 hover:border-red-500/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-[#0d0e12]">
        {view === 'dashboard' && (
          <Dashboard
            user={user}
            onSelectTicket={handleSelectTicket}
            onViewTickets={() => setView('tickets')}
          />
        )}
        {view === 'tickets' && (
          <TicketList
            user={user}
            onSelectTicket={handleSelectTicket}
          />
        )}
        {view === 'ticket-detail' && (
          <TicketDetail
            user={user}
            ticketId={activeTicketId}
            onBack={() => setView('tickets')}
          />
        )}
      </main>
    </div>
  );
}

export default App;
