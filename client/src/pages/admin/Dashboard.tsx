import { useEffect, useState } from 'react';
import { Globe, Users, Building2, MessageSquare } from 'lucide-react';
import api from '../../services/api';

interface Stats {
  countries: number;
  vendors: number;
  users: number;
  enquiries: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ countries: 0, vendors: 0, users: 0, enquiries: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [countriesRes, vendorsRes, usersRes, enquiriesRes] = await Promise.all([
          api.get('/admin/countries'),
          api.get('/admin/vendors'),
          api.get('/admin/users'),
          api.get('/admin/enquiries?limit=1'),
        ]);
        setStats({
          countries: countriesRes.data.countries?.length || 0,
          vendors: vendorsRes.data.vendors?.length || 0,
          users: usersRes.data.users?.length || 0,
          enquiries: enquiriesRes.data.total || 0,
        });
      } catch {
        // ignore — will show 0s
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const cards = [
    { label: 'Countries', value: stats.countries, icon: Globe, color: '#4a8c3f' },
    { label: 'Vendors', value: stats.vendors, icon: Building2, color: '#3c5a77' },
    { label: 'Admin Users', value: stats.users, icon: Users, color: '#2c3e50' },
    { label: 'Enquiries', value: stats.enquiries, icon: MessageSquare, color: '#f39c12' },
  ];

  return (
    <div className="admin-page">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        {cards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="stat-icon" style={{ color: card.color }}>
              <card.icon size={28} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? '...' : card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
