import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, Percent, Building2, MessageSquare, BarChart3, HelpCircle, Users, Settings, LogOut } from 'lucide-react';
import api from '../../services/api';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/countries', icon: Globe, label: 'Countries' },
  { to: '/admin/rates', icon: Percent, label: 'Rates' },
  { to: '/admin/vendors', icon: Building2, label: 'Vendors' },
  { to: '/admin/enquiries', icon: MessageSquare, label: 'Enquiries' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/faq', icon: HelpCircle, label: 'FAQ' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(() => {
      setAuthenticated(true);
      setChecking(false);
    }).catch(() => {
      navigate('/admin/login', { replace: true });
    });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    navigate('/admin/login');
  };

  if (checking || !authenticated) {
    return null;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <img src="/logo.png" alt="Oaklease" className="admin-logo" />
          <span className="admin-title">Admin</span>
        </div>
        <nav className="admin-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `admin-nav-link ${isActive ? 'active' : ''}`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="admin-nav-link admin-logout">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
        <div className="admin-version">v1.0.1</div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
