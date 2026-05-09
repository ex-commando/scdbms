import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, FileUp, Send, LogOut, 
  Plus, Search, Download, Trash2, Edit, X, 
  Loader2, AlertCircle, CheckCircle2, Home, Briefcase, Map,
  Shield, History, Lock, Key, UserPlus, Check, Square, Mail,
  ShieldCheck, Camera, MapPin, UserCheck, Phone, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import './App.css';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;
axios.defaults.withCredentials = true;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'white', background: '#ef4444', borderRadius: '12px', margin: '2rem' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '0.5rem 1rem', marginTop: '1rem', cursor: 'pointer' }}>Reload Page</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const NeonBackground = () => (
  <div className="neon-bg-icons">
    <Shield className="floating-icon icon-1" size={120} />
    <Users className="floating-icon icon-2" size={80} />
    <MapPin className="floating-icon icon-3" size={100} />
    <ShieldCheck className="floating-icon icon-4" size={90} />
    <Lock className="floating-icon icon-5" size={70} />
    <Briefcase className="floating-icon icon-6" size={110} />
  </div>
);

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState(null);
  const [stats, setStats] = useState({ total: 0, owners: 0, tenants: 0, streets: 0, distribution: [], guards: { total: 0, assigned: 0, unassigned: 0 } });
  const [residents, setResidents] = useState([]);
  const [selectedResidents, setSelectedResidents] = useState([]);
  const [streets, setStreets] = useState([]);
  const [search, setSearch] = useState('');
  const [streetFilter, setStreetFilter] = useState('all');
  const [preSelectedIds, setPreSelectedIds] = useState([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      if (currentView === 'dashboard') fetchStats();
      if (currentView === 'residents') fetchResidents();
      if (currentView === 'emailer' || currentView === 'residents') fetchStreets();
    }
  }, [user, currentView, search, streetFilter]);

  const checkAuth = async () => {
    try {
      const { data } = await axios.get('/api/check-auth');
      if (data.authenticated) {
        setUser(data.user);
        const perms = Array.isArray(data.user?.permissions) ? data.user.permissions : [];
        // Set initial view based on permissions
        if (perms.includes('all') || perms.includes('view_residents')) {
          setCurrentView('dashboard');
        } else if (perms.includes('view_guards')) {
          setCurrentView('guards');
        } else if (perms.includes('view_logs')) {
          setCurrentView('logs');
        } else if (perms.includes('manage_users')) {
          setCurrentView('users');
        } else {
          setCurrentView('residents'); // Default fallback
        }
      }
    } catch (err) {
      console.error('Auth check failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await axios.get('/api/stats');
      setStats(data);
    } catch (err) {
      console.error('Fetch stats failed');
    }
  };

  const fetchResidents = async () => {
    try {
      const { data } = await axios.get(`/api/residents?search=${search}&street=${streetFilter}`);
      setResidents(data);
    } catch (err) {
      console.error('Fetch residents failed');
    }
  };

  const fetchStreets = async () => {
    try {
      const { data } = await axios.get('/api/streets');
      setStreets(data);
    } catch (err) {
      console.error('Fetch streets failed');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const credentials = Object.fromEntries(formData);
    try {
      const { data } = await axios.post('/api/login', credentials);
      if (data.success) {
        setUser(data.user);
        const perms = Array.isArray(data.user?.permissions) ? data.user.permissions : [];
        // Set initial view based on permissions
        if (perms.includes('all') || perms.includes('view_residents')) {
          setCurrentView('dashboard');
        } else if (perms.includes('view_guards')) {
          setCurrentView('guards');
        } else if (perms.includes('view_logs')) {
          setCurrentView('logs');
        } else if (perms.includes('manage_users')) {
          setCurrentView('users');
        } else {
          setCurrentView('residents'); // Fallback
        }
      }
    } catch (err) {
      if (!err.response) {
        alert('Cannot connect to server. Make sure the Node.js backend is running on port 5000.');
      } else {
        alert(err.response?.data?.error || 'Login failed');
      }
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await axios.post('/api/logout');
      setUser(null);
      setCurrentView('dashboard');
    }
  };

  const handleSaveResident = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const residentData = Object.fromEntries(formData);
    if (editingResident) residentData.id = editingResident.id;

    try {
      await axios.post('/api/residents/save', residentData);
      setIsModalOpen(false);
      setEditingResident(null);
      fetchResidents();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save resident');
    }
  };

  const handleDeleteResident = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await axios.delete(`/api/residents/${id}`);
        fetchResidents();
        fetchStats();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete record');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Delete ${selectedResidents.length} selected records?`)) {
      try {
        for (const id of selectedResidents) {
          await axios.delete(`/api/residents/${id}`);
        }
        setSelectedResidents([]);
        fetchResidents();
        fetchStats();
      } catch (err) {
        alert('Some deletions failed');
      }
    }
  };

  const toggleResidentSelection = (id) => {
    setSelectedResidents(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedResidents.length === residents.length) {
      setSelectedResidents([]);
    } else {
      setSelectedResidents(residents.map(r => r.id));
    }
  };

  const hasPermission = (perm) => {
    if (!user || !user.permissions) return false;
    const perms = Array.isArray(user.permissions) ? user.permissions : [];
    return perms.includes('all') || perms.includes(perm);
  };

  const exportCSV = () => {
    if (residents.length === 0) return alert('No data to export');
    
    const headers = ['House #', 'Street', 'Occupant Name', 'Type', 'Email', 'Phone'];
    
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = residents.map(r => [
      escapeCSV(r.house_number),
      escapeCSV(r.street_name),
      escapeCSV(r.occupant_name),
      escapeCSV(r.occupant_type),
      escapeCSV(r.email),
      escapeCSV(r.phone)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `sera_residents_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const startTargetedCommunication = () => {
    setPreSelectedIds([...selectedResidents]);
    setCurrentView('emailer');
  };

  if (loading) return <div className="login-overlay"><Loader2 className="animate-spin" size={48} color="var(--primary)" /></div>;

  if (!user) {
    return (
      <div className="login-overlay">
        <div className="login-image-side">
          <div className="login-image-content animate-fade-in">
            <h2>Suncity Estate</h2>
            <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>Building a community that feels like family.</p>
          </div>
        </div>
        <div className="login-form-side">
          <div className="login-card animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div style={{ padding: '0.5rem', marginBottom: '1.5rem', display: 'inline-block' }}>
                <img src="/logo.png" alt="SERA" style={{ height: '65px', display: 'block', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} />
              </div>
              <h2 style={{ color: 'var(--primary)', marginTop: '1rem', fontSize: '1.5rem' }}>System Access</h2>
              <p style={{ color: '#64748b' }}>Secure Resident Management Portal</p>
            </div>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>User Identity</label>
                <input name="username" type="text" required placeholder="Enter username" />
              </div>
              <div className="form-group">
                <label>Security Password</label>
                <input name="password" type="password" required placeholder="••••••••" />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
                Authenticate & Access
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-container">
          <img src="/logo.png" alt="SERA" style={{ height: '45px', objectFit: 'contain' }} />
        </div>
        <nav className="nav-links">
          {(hasPermission('all') || hasPermission('view_residents')) && (
            <button className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => setCurrentView('dashboard')}>
              <LayoutDashboard size={20} /> <span>Dashboard</span>
            </button>
          )}

          {hasPermission('view_residents') && (
            <button className={`nav-item ${currentView === 'residents' ? 'active' : ''}`} onClick={() => { setCurrentView('residents'); setPreSelectedIds([]); }}>
              <Users size={20} /> <span>Residents Registry</span>
            </button>
          )}

          {hasPermission('add_resident') && (
            <button className={`nav-item ${currentView === 'bulk' ? 'active' : ''}`} onClick={() => setCurrentView('bulk')}>
              <FileUp size={20} /> <span>Bulk Import</span>
            </button>
          )}

          {hasPermission('send_emails') && (
            <button className={`nav-item ${currentView === 'emailer' ? 'active' : ''}`} onClick={() => { setCurrentView('emailer'); setPreSelectedIds([]); }}>
              <Send size={20} /> <span>Broadcast Email</span>
            </button>
          )}

          {hasPermission('view_guards') && (
            <button className={`nav-item ${currentView === 'guards' ? 'active' : ''}`} onClick={() => setCurrentView('guards')}>
              <ShieldCheck size={20} /> <span>Security Guards</span>
            </button>
          )}
          
          {hasPermission('manage_users') && (
            <button className={`nav-item ${currentView === 'users' ? 'active' : ''}`} onClick={() => setCurrentView('users')}>
              <Shield size={20} /> <span>User Management</span>
            </button>
          )}
          
          {hasPermission('view_logs') && (
            <button className={`nav-item ${currentView === 'logs' ? 'active' : ''}`} onClick={() => setCurrentView('logs')}>
              <History size={20} /> <span>Audit Log Trail</span>
            </button>
          )}
        </nav>
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
          <button className="nav-item" onClick={handleLogout} style={{ color: 'var(--error)' }}>
            <LogOut size={20} /> <span>Logout System</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header>
          <div className="welcome-text">
            <h1>{(currentView || 'dashboard') === 'logs' ? 'System Audit' : (currentView || 'dashboard') === 'users' ? 'Staff Management' : (currentView || 'dashboard') === 'emailer' ? 'Communication' : (currentView || 'dashboard') === 'guards' ? 'Security Personnel' : (currentView || 'dashboard').charAt(0).toUpperCase() + (currentView || 'dashboard').slice(1)}</h1>
            <p>Suncity Estate Residents Association • Logged in as {user?.full_name || 'User'}</p>
          </div>
          <div className="header-actions">
            {currentView === 'residents' && hasPermission('add_resident') && (
              <button className="btn btn-primary" onClick={() => { setEditingResident(null); setIsModalOpen(true); }}>
                <Plus size={18} /> Add Resident
              </button>
            )}
            {currentView === 'guards' && hasPermission('manage_guards') && (
              <button className="btn btn-primary" onClick={() => { window.dispatchEvent(new CustomEvent('openGuardModal')); }}>
                <Plus size={18} /> Register Guard
              </button>
            )}
          </div>
        </header>

        {currentView === 'dashboard' && (
          <div className="animate-fade-in">
            <div className="stats-grid">
              <div className="stat-card" style={{ animationDelay: '0.1s' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="stat-label">Total Residents</div>
                    <div className="stat-value">{stats.total}</div>
                  </div>
                  <div className="stat-icon" style={{ background: 'rgba(243, 131, 43, 0.1)', color: 'var(--primary)' }}>
                    <Users size={24} />
                  </div>
                </div>
              </div>
              <div className="stat-card" style={{ animationDelay: '0.2s' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="stat-label">Home Owners</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.owners}</div>
                  </div>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                    <Home size={24} />
                  </div>
                </div>
              </div>
              <div className="stat-card" style={{ animationDelay: '0.3s' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="stat-label">Tenants</div>
                    <div className="stat-value" style={{ color: 'var(--accent)' }}>{stats.tenants}</div>
                  </div>
                  <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                    <Briefcase size={24} />
                  </div>
                </div>
              </div>
              <div className="stat-card" style={{ animationDelay: '0.4s' }}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="stat-label">Security Guards</div>
                    <div className="stat-value" style={{ color: 'var(--primary)' }}>{stats.guards?.total || 0}</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>
                      {stats.guards?.assigned || 0} Assigned • {stats.guards?.unassigned || 0} Standby
                    </div>
                  </div>
                  <div className="stat-icon" style={{ background: 'rgba(243, 131, 43, 0.1)', color: 'var(--primary)' }}>
                    <ShieldCheck size={24} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', animationDelay: '0.5s' }}>
              <div className="data-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem' }}>Street Occupancy Metrics</h3>
                <div style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="street_name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-bright)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                        itemStyle={{ color: 'var(--primary)', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                        {(stats.distribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : 'var(--accent)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="data-card" style={{ padding: '2rem' }}>
                <h3 style={{ marginBottom: '2rem' }}>Security Coverage</h3>
                <div style={{ height: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div className="flex flex-col gap-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span style={{ color: 'var(--text-muted)' }}>Assigned Personnel</span>
                        <span style={{ fontWeight: '700' }}>{Math.round(((stats.guards?.assigned || 0) / (stats.guards?.total || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${((stats.guards?.assigned || 0) / (stats.guards?.total || 1)) * 100}%`, height: '100%', background: 'var(--success)' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned / Standby</span>
                        <span style={{ fontWeight: '700' }}>{Math.round(((stats.guards?.unassigned || 0) / (stats.guards?.total || 1)) * 100)}%</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${((stats.guards?.unassigned || 0) / (stats.guards?.total || 1)) * 100}%`, height: '100%', background: 'var(--primary)' }}></div>
                      </div>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-4">
                        <div style={{ padding: '0.75rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
                          <ShieldAlert size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Security Status</div>
                          <div style={{ fontWeight: '700' }}>{(stats.guards?.unassigned || 0) > 0 ? 'Optimal Reserve' : 'Full Deployment'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'residents' && (
          <div className="data-card animate-fade-in">
            <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
              <div className="flex gap-4" style={{ flex: 1, minWidth: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder="Real-time search..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    style={{ paddingLeft: '3rem' }}
                  />
                </div>
                <select value={streetFilter} onChange={(e) => setStreetFilter(e.target.value)} style={{ width: 'auto' }}>
                  <option value="all">All Streets</option>
                  {streets.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                {selectedResidents.length > 0 && (
                  <>
                    <button className="btn btn-primary" onClick={startTargetedCommunication}>
                      <Mail size={18} /> Message ({selectedResidents.length})
                    </button>
                    {hasPermission('delete_resident') && (
                      <button className="btn btn-secondary" style={{ color: 'var(--error)' }} onClick={handleBulkDelete}>
                        <Trash2 size={18} /> Delete
                      </button>
                    )}
                  </>
                )}
                <button className="btn btn-secondary" onClick={exportCSV}>
                  <Download size={18} /> Export CSV
                </button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedResidents.length === residents.length && residents.length > 0} 
                        onChange={toggleSelectAll} 
                      />
                    </th>
                    <th>House #</th>
                    <th>Street Name</th>
                    <th>Occupant Name</th>
                    <th>Type</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {residents.map(r => (
                    <tr key={r.id} className={selectedResidents.includes(r.id) ? 'selected' : ''}>
                      <td>
                        <input 
                          type="checkbox" 
                          checked={selectedResidents.includes(r.id)} 
                          onChange={() => toggleResidentSelection(r.id)} 
                        />
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{r.house_number}</td>
                      <td>{r.street_name}</td>
                      <td style={{ fontWeight: '600' }}>{r.occupant_name}</td>
                      <td><span className={`badge badge-${r.occupant_type.toLowerCase()}`}>{r.occupant_type}</span></td>
                      <td style={{ color: 'var(--text-muted)' }}>{r.email}</td>
                      <td>{r.phone}</td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          {hasPermission('edit_resident') && (
                            <button className="btn btn-secondary" style={{ padding: '0.6rem' }} onClick={() => { setEditingResident(r); setIsModalOpen(true); }}>
                              <Edit size={14} />
                            </button>
                          )}
                          {hasPermission('delete_resident') && (
                            <button className="btn btn-secondary" style={{ padding: '0.6rem', color: 'var(--error)' }} onClick={() => handleDeleteResident(r.id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'bulk' && <BulkUpload onSuccess={() => { setCurrentView('residents'); fetchStats(); }} />}
        {currentView === 'emailer' && <Emailer streets={streets} preSelectedIds={preSelectedIds} onClearSelected={() => setPreSelectedIds([])} />}
        {currentView === 'guards' && <GuardsRegistry residents={residents} />}
        {currentView === 'users' && <UserManagement />}
        {currentView === 'logs' && <AuditLogs />}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="data-card animate-fade-in" style={{ width: '100%', maxWidth: '550px', padding: '2.5rem' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{editingResident ? 'Edit Record' : 'Register Resident'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveResident}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>House Number</label>
                  <input name="houseNumber" defaultValue={editingResident?.house_number} required placeholder="e.g. 12B" />
                </div>
                <div className="form-group">
                  <label>Street Name</label>
                  <input name="streetName" defaultValue={editingResident?.street_name} required placeholder="e.g. Main Ave" />
                </div>
              </div>
              <div className="form-group">
                <label>Occupant Full Name</label>
                <input name="occupantName" defaultValue={editingResident?.occupant_name} required placeholder="John Doe" />
              </div>
              <div className="form-group">
                <label>Occupancy Category</label>
                <select name="occupantType" defaultValue={editingResident?.occupant_type || 'Owner'} required>
                  <option value="Owner">Property Owner</option>
                  <option value="Tenant">Registered Tenant</option>
                </select>
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input name="email" type="email" defaultValue={editingResident?.email} required placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label>Phone Number (Optional)</label>
                <input name="phone" defaultValue={editingResident?.phone} placeholder="+234 ..." />
              </div>
              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '1rem' }}>
                {editingResident ? 'Update Registry' : 'Complete Registration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('/api/users');
      setUsers(data);
    } catch (err) { console.error('Fetch users failed'); }
    finally { setLoading(false); }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = Object.fromEntries(formData);
    
    const permissions = [];
    if (e.target.perm_view_res.checked) permissions.push('view_residents');
    if (e.target.perm_add.checked) permissions.push('add_resident');
    if (e.target.perm_edit.checked) permissions.push('edit_resident');
    if (e.target.perm_delete.checked) permissions.push('delete_resident');
    if (e.target.perm_send_mail.checked) permissions.push('send_emails');
    if (e.target.perm_logs.checked) permissions.push('view_logs');
    if (e.target.perm_guards_view.checked) permissions.push('view_guards');
    if (e.target.perm_guards_manage.checked) permissions.push('manage_guards');
    if (userData.role === 'admin') permissions.push('all');
    
    userData.permissions = permissions;
    if (editingUser) userData.id = editingUser.id;

    try {
      await axios.post('/api/users/save', userData);
      setIsModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) { alert('Failed to save user'); }
  };

  if (loading) return <Loader2 className="animate-spin" />;

  return (
    <div className="data-card animate-fade-in">
      <div className="card-header">
        <h3>Staff Accounts</h3>
        <button className="btn btn-primary" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
          <UserPlus size={18} /> Add Staff Member
        </button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Permissions</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td><div className="flex items-center gap-2"><Lock size={14} color="var(--text-muted)" /> {u.username}</div></td>
                <td>{u.full_name}</td>
                <td><span className={`badge badge-${u.role === 'admin' ? 'owner' : 'tenant'}`}>{u.role.toUpperCase()}</span></td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    {u.permissions.map(p => <span key={p} className="badge" style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)' }}>{p}</span>)}
                  </div>
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button className="btn btn-secondary" style={{ padding: '0.6rem' }} onClick={() => { setEditingUser(u); setIsModalOpen(true); }}>
                      <Edit size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="data-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
            <h3>{editingUser ? 'Update Staff Member' : 'Create Staff Account'}</h3>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label>Full Name</label>
                <input name="fullName" defaultValue={editingUser?.full_name} required />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input name="username" defaultValue={editingUser?.username} required />
              </div>
              <div className="form-group">
                <label>Password {editingUser && '(Leave blank to keep current)'}</label>
                <input name="password" type="password" required={!editingUser} />
              </div>
              <div className="form-group">
                <label>System Role</label>
                <select name="role" defaultValue={editingUser?.role || 'staff'}>
                  <option value="admin">Administrator</option>
                  <option value="staff">Staff Member</option>
                </select>
              </div>
              <div className="form-group">
                <label>Access Rights</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_view_res" defaultChecked={editingUser?.permissions.includes('view_residents')} /> View Residents
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_add" defaultChecked={editingUser?.permissions.includes('add_resident')} /> Add Residents
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_edit" defaultChecked={editingUser?.permissions.includes('edit_resident')} /> Edit Residents
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_delete" defaultChecked={editingUser?.permissions.includes('delete_resident')} /> Delete Residents
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_send_mail" defaultChecked={editingUser?.permissions.includes('send_emails')} /> Send Emails
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_logs" defaultChecked={editingUser?.permissions.includes('view_logs')} /> View Audit Logs
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_guards_view" defaultChecked={editingUser?.permissions.includes('view_guards')} /> View Guards
                  </label>
                  <label className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
                    <input type="checkbox" name="perm_guards_manage" defaultChecked={editingUser?.permissions.includes('manage_guards')} /> Manage Guards
                  </label>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" className="btn btn-secondary w-full" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary w-full">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get('/api/audit-logs');
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error('Fetch logs failed'); 
      setLogs([]);
    }
    finally { setLoading(false); }
  };

  return (
    <div className="data-card animate-fade-in">
      <div className="card-header">
        <h3>System Audit Trail</h3>
        <button className="btn btn-secondary" onClick={fetchLogs}>Refresh Logs</button>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Details</th>
              <th>Status</th>
              <th>Action Hash (Pin)</th>
            </tr>
          </thead>
          <tbody>
            {(logs || []).map(log => (
              <tr key={log.id}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                </td>
                <td style={{ fontWeight: '600' }}>{log.username || 'System'}</td>
                <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{log.action}</span></td>
                <td style={{ fontSize: '0.9rem' }}>{log.details}</td>
                <td>
                  <span className="badge" style={{ 
                    background: log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: log.status === 'SUCCESS' ? '#10B981' : '#EF4444',
                    border: `1px solid ${log.status === 'SUCCESS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                  }}>
                    {log.status || 'SUCCESS'}
                  </span>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.7 }}>
                  {log.action_hash ? log.action_hash.substring(0, 16) + '...' : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BulkUpload = ({ onSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setUploading(true);
    setStatus(null);
    try {
      const { data } = await axios.post('/api/bulk-upload', formData);
      if (data.success) {
        setStatus({ success: true, message: `Successfully synchronized ${data.count} records!` });
        setTimeout(onSuccess, 1500);
      }
    } catch (err) {
      setStatus({ success: false, message: err.response?.data?.error || 'Synchronization failed' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="data-card animate-fade-in" style={{ maxWidth: '650px', margin: '2rem auto', padding: '4rem', textAlign: 'center' }}>
      <div style={{ background: 'rgba(243, 131, 43, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
        <FileUp size={40} color="var(--primary)" />
      </div>
      <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Bulk Registry Synchronization</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '3rem', fontSize: '1.1rem' }}>
        Upload a standard CSV file to batch register residents.<br/>
        Required columns: House #, Street, Name, Type, Email, Phone
      </p>
      <form onSubmit={handleUpload}>
        <div className="form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '2rem', borderRadius: '16px', border: '2px dashed var(--border)' }}>
          <input name="csvFile" type="file" accept=".csv" required style={{ border: 'none', background: 'transparent' }} />
        </div>
        <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '2rem' }} disabled={uploading}>
          {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Execute Synchronization'}
        </button>
      </form>
      {status && (
        <div className={`mt-4 flex items-center gap-2 justify-center`} style={{ color: status.success ? 'var(--success)' : 'var(--error)', fontWeight: '600' }}>
          {status.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {status.message}
        </div>
      )}
    </div>
  );
};

const Emailer = ({ streets, preSelectedIds = [], onClearSelected }) => {
  const [sending, setSending] = useState(false);
  const [targetCount, setTargetCount] = useState(0);
  const [filters, setFilters] = useState({ street: 'all', type: 'all' });
  const isTargeted = preSelectedIds.length > 0;

  useEffect(() => {
    if (isTargeted) {
      setTargetCount(preSelectedIds.length);
    } else {
      const updateTarget = async () => {
        const { data } = await axios.get(`/api/residents?street=${filters.street}`);
        const filtered = filters.type === 'all' ? data : data.filter(r => r.occupant_type === filters.type);
        setTargetCount(filtered.length);
      };
      updateTarget();
    }
  }, [filters, preSelectedIds, isTargeted]);

  const handleSend = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = { 
      ...filters, 
      ...Object.fromEntries(formData),
      selectedIds: isTargeted ? preSelectedIds : null
    };
    setSending(true);
    try {
      const { data } = await axios.post('/api/send-bulk-email', payload);
      alert(`Communication successfully dispatched to ${data.sent} recipients!`);
      e.target.reset();
      if (onClearSelected) onClearSelected();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to execute broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
      <div className="data-card animate-fade-in" style={{ padding: '2rem', height: 'fit-content' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          {isTargeted ? 'Targeted Selection' : 'Target Audience'}
        </h3>
        
        {isTargeted ? (
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              You are sending a message to a specific group of residents selected from the registry.
            </p>
            <button className="btn btn-secondary w-full" onClick={onClearSelected}>
              Reset to Broadcast Mode
            </button>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Filter by Street</label>
              <select value={filters.street} onChange={(e) => setFilters({ ...filters, street: e.target.value })}>
                <option value="all">Entire Estate</option>
                {streets.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Occupant Category</label>
              <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
                <option value="all">All Residents</option>
                <option value="Owner">Owners Only</option>
                <option value="Tenant">Tenants Only</option>
              </select>
            </div>
          </>
        )}

        <div style={{ 
          background: 'rgba(243, 131, 43, 0.1)', 
          padding: '1.5rem', 
          borderRadius: '12px', 
          marginTop: '2rem',
          border: '1px solid rgba(243, 131, 43, 0.2)'
        }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Recipients</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--primary)' }}>{targetCount}</div>
        </div>
      </div>
      <div className="data-card animate-fade-in" style={{ padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem' }}>Compose Communication</h3>
        <form onSubmit={handleSend}>
          <div className="form-group">
            <label>Email Subject</label>
            <input name="subject" required placeholder="Important Estate Update" />
          </div>
          <div className="form-group">
            <label>Message Content</label>
            <textarea name="message" rows="12" required placeholder="Compose your official communication here..."></textarea>
          </div>
          <button type="submit" className="btn btn-primary" disabled={sending} style={{ width: 'auto', padding: '1rem 2.5rem' }}>
            {sending ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Dispatch Message</>}
          </button>
        </form>
      </div>
    </div>
  );
};

const GuardsRegistry = ({ residents }) => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuard, setEditingGuard] = useState(null);
  const [search, setSearch] = useState('');
  const [residentFilter, setResidentFilter] = useState('all');
  const [residentSearch, setResidentSearch] = useState('');
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [guardView, setGuardView] = useState('grid'); // grid, table, bulk

  useEffect(() => {
    if (editingGuard) {
      setSelectedResidentId(editingGuard.resident_id);
      const res = residents.find(r => r.id == editingGuard.resident_id);
      if (res) setResidentSearch(`${res.house_number} ${res.street_name} (${res.occupant_name})`);
    } else {
      setSelectedResidentId('');
      setResidentSearch('');
    }
  }, [editingGuard, residents]);

  useEffect(() => {
    fetchGuards();
    const handleOpenModal = () => {
      setEditingGuard(null);
      setIsModalOpen(true);
      setGuardView('grid');
    };
    window.addEventListener('openGuardModal', handleOpenModal);
    return () => window.removeEventListener('openGuardModal', handleOpenModal);
  }, [search, residentFilter]);

  const fetchGuards = async () => {
    try {
      const { data } = await axios.get(`/api/guards?search=${search}&residentId=${residentFilter}`);
      setGuards(data);
    } catch (err) { console.error('Fetch guards failed'); }
    finally { setLoading(false); }
  };

  const handleSaveGuard = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    if (editingGuard) formData.append('id', editingGuard.id);

    try {
      await axios.post('/api/guards/save', formData);
      setIsModalOpen(false);
      setEditingGuard(null);
      fetchGuards();
    } catch (err) { alert('Failed to save guard record'); }
  };

  const handleDeleteGuard = async (id) => {
    if (!confirm('Are you sure you want to remove this guard?')) return;
    try {
      await axios.delete(`/api/guards/${id}`);
      fetchGuards();
    } catch (err) { alert('Failed to delete guard'); }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" size={32} /></div>;

  return (
    <div className="animate-fade-in">
      <div className="data-card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex gap-2">
            <button className={`btn ${guardView === 'grid' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGuardView('grid')}>
              <LayoutDashboard size={18} /> Grid View
            </button>
            <button className={`btn ${guardView === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGuardView('table')}>
              <Users size={18} /> Table List
            </button>
            <button className={`btn ${guardView === 'bulk' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setGuardView('bulk')}>
              <FileUp size={18} /> Bulk Sync
            </button>
          </div>

          {(guardView === 'grid' || guardView === 'table') && (
            <div className="flex gap-4" style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search personnel..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
              <select value={residentFilter} onChange={(e) => setResidentFilter(e.target.value)} style={{ width: 'auto' }}>
                <option value="all">Entire Estate</option>
                {residents.map(r => (
                  <option key={r.id} value={r.id}>{r.house_number}, {r.street_name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {guardView === 'grid' && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {guards.map(g => (
            <div key={g.id} className="stat-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="guard-photo-container">
                {g.image_url ? (
                  <img src={axios.defaults.baseURL + g.image_url} alt={g.name} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white opacity-20">
                    <UserCheck size={64} />
                    <span>No Photo</span>
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '1.5rem', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{g.name}</h3>
                  <div className="flex items-center gap-1 opacity-80" style={{ fontSize: '0.85rem' }}>
                    <MapPin size={14} /> {g.lga}, {g.state_of_origin} State
                  </div>
                </div>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Age</div>
                    <div style={{ fontWeight: '600' }}>{g.age} Years</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</div>
                    <div style={{ fontWeight: '600' }}>{g.phone}</div>
                  </div>
                </div>
                
                <div className="guarantor-box">
                  <div className="flex items-center gap-2" style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                    <ShieldAlert size={14} /> GUARANTORS
                  </div>
                  <div style={{ fontSize: '0.85rem' }}>
                    <div className="flex justify-between"><span>1. {g.guarantor1_name}</span> <span className="opacity-60">{g.guarantor1_phone}</span></div>
                    <div className="flex justify-between mt-1"><span>2. {g.guarantor2_name}</span> <span className="opacity-60">{g.guarantor2_phone}</span></div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-secondary w-full" style={{ padding: '0.6rem' }} onClick={() => { setEditingGuard(g); setIsModalOpen(true); }}>
                    <Edit size={16} /> Edit
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '0.6rem', color: 'var(--error)' }} onClick={() => handleDeleteGuard(g.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {guardView === 'table' && (
        <div className="data-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Personnel Name</th>
                  <th>Age</th>
                  <th>Contact Phone</th>
                  <th>Origin</th>
                  <th>Assigned To</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {guards.map(g => {
                  const resident = residents.find(r => r.id == g.resident_id);
                  return (
                    <tr key={g.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {g.image_url ? (
                            <img src={axios.defaults.baseURL + g.image_url} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <UserCheck size={20} opacity={0.3} />
                            </div>
                          )}
                          <span style={{ fontWeight: '600' }}>{g.name}</span>
                        </div>
                      </td>
                      <td>{g.age}</td>
                      <td>{g.phone}</td>
                      <td>{g.lga}, {g.state_of_origin}</td>
                      <td>
                        {resident ? (
                          <span className="badge badge-owner" style={{ fontSize: '0.8rem' }}>
                            {resident.house_number}, {resident.street_name}
                          </span>
                        ) : (
                          <span className="opacity-40">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2 justify-end">
                          <button className="btn btn-secondary" style={{ padding: '0.6rem' }} onClick={() => { setEditingGuard(g); setIsModalOpen(true); }}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '0.6rem', color: 'var(--error)' }} onClick={() => handleDeleteGuard(g.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {guardView === 'bulk' && (
        <div className="data-card animate-fade-in" style={{ padding: '4rem', textAlign: 'center' }}>
          <div style={{ background: 'rgba(243, 131, 43, 0.1)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <FileUp size={40} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Bulk Personnel Synchronization</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
            Upload a CSV to batch register security guards.<br/>
            Required: Name, Age, State, LGA, Phone, Guarantor1 Name, Phone, Guarantor2 Name, Phone, House #, Street
          </p>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
              const { data } = await axios.post('/api/guards/bulk-upload', formData);
              alert(`Synchronized ${data.count} guard records!`);
              setGuardView('grid');
              fetchGuards();
            } catch (err) { alert('Sync failed'); }
          }}>
            <div className="form-group" style={{ background: 'rgba(0,0,0,0.05)', padding: '2rem', borderRadius: '16px', border: '2px dashed var(--border)' }}>
              <input name="csvFile" type="file" accept=".csv" required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '2rem' }}>
              Execute Synchronization
            </button>
          </form>
        </div>
      )}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="data-card animate-fade-in" style={{ width: '100%', maxWidth: '650px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{editingGuard ? 'Update Guard Profile' : 'Register New Guard'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveGuard}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input name="name" defaultValue={editingGuard?.name} required placeholder="Guard's full name" />
                </div>
                <div className="form-group">
                  <label>Age</label>
                  <input name="age" type="number" defaultValue={editingGuard?.age} required placeholder="Years" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>State of Origin</label>
                  <input name="state_of_origin" defaultValue={editingGuard?.state_of_origin} required />
                </div>
                <div className="form-group">
                  <label>L.G.A</label>
                  <input name="lga" defaultValue={editingGuard?.lga} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input name="phone" defaultValue={editingGuard?.phone} required />
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <label>Assigned Residence</label>
                  <input 
                    type="text" 
                    placeholder="Search by House, Street or Name..." 
                    value={residentSearch}
                    onChange={(e) => {
                      setResidentSearch(e.target.value);
                      setShowDropdown(true);
                      setSelectedResidentId('');
                    }}
                    onFocus={() => setShowDropdown(true)}
                    required
                  />
                  <input type="hidden" name="resident_id" value={selectedResidentId} />
                  
                  {showDropdown && (
                    <div className="search-dropdown">
                      {residents
                        .filter(r => 
                          !residentSearch || `${r.house_number} ${r.street_name} ${r.occupant_name}`.toLowerCase().includes(residentSearch.toLowerCase())
                        )
                        .slice(0, 5)
                        .map(r => (
                          <div 
                            key={r.id} 
                            className="dropdown-item"
                            onClick={() => {
                              setResidentSearch(`${r.house_number} ${r.street_name} (${r.occupant_name})`);
                              setSelectedResidentId(r.id);
                              setShowDropdown(false);
                            }}
                          >
                            <div style={{ fontWeight: '700' }}>{r.house_number} {r.street_name}</div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{r.occupant_name}</div>
                          </div>
                        ))}
                      {residents.filter(r => !residentSearch || `${r.house_number} ${r.street_name} ${r.occupant_name}`.toLowerCase().includes(residentSearch.toLowerCase())).length === 0 && (
                        <div className="dropdown-item" style={{ opacity: 0.5 }}>No results found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Guard Photograph</label>
                <div style={{ background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                  <input type="file" name="image" accept="image/*" style={{ background: 'transparent', border: 'none' }} />
                </div>
              </div>

              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(243, 131, 43, 0.05)', borderRadius: '16px' }}>
                <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--primary)', fontWeight: '800' }}>GUARANTOR INFORMATION</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <input name="guarantor1_name" defaultValue={editingGuard?.guarantor1_name} placeholder="Guarantor 1 Name" required />
                  <input name="guarantor1_phone" defaultValue={editingGuard?.guarantor1_phone} placeholder="Phone" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input name="guarantor2_name" defaultValue={editingGuard?.guarantor2_name} placeholder="Guarantor 2 Name" required />
                  <input name="guarantor2_phone" defaultValue={editingGuard?.guarantor2_phone} placeholder="Phone" required />
                </div>
              </div>

              <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '2rem' }}>
                {editingGuard ? 'Update Profile' : 'Register Guard'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Root = () => (
  <ErrorBoundary>
    <NeonBackground />
    <App />
  </ErrorBoundary>
);

export default Root;
