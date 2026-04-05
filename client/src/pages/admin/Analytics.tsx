import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../../services/api';

interface AnalyticsData {
  total: number;
  byCountry: { country_code: string; count: string }[];
  byVendor: { vendor: string; count: string }[];
  byDay: { date: string; count: string }[];
  days: number;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const { data: d } = await api.get(`/admin/analytics?days=${days}`);
      setData(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Calculator Analytics</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 'auto' }}>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#4a8c3f' }}>
            <BarChart3 size={28} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data?.total || 0}</span>
            <span className="stat-label">Calculations ({days}d)</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3>By Country</h3>
          {data?.byCountry.length === 0 ? (
            <p className="hint-text">No data yet</p>
          ) : (
            <table className="admin-table" style={{ marginTop: '0.75rem' }}>
              <thead>
                <tr><th>Country</th><th>Count</th></tr>
              </thead>
              <tbody>
                {data?.byCountry.map((row) => (
                  <tr key={row.country_code}>
                    <td>{row.country_code}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3>By Source</h3>
          {data?.byVendor.length === 0 ? (
            <p className="hint-text">No data yet</p>
          ) : (
            <table className="admin-table" style={{ marginTop: '0.75rem' }}>
              <thead>
                <tr><th>Source</th><th>Count</th></tr>
              </thead>
              <tbody>
                {data?.byVendor.map((row) => (
                  <tr key={row.vendor}>
                    <td>{row.vendor === 'direct' ? 'Direct (Oaklease)' : row.vendor}</td>
                    <td>{row.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {data && data.byDay.length > 0 && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h3>Daily Usage</h3>
          <div className="daily-chart">
            {data.byDay.map((row) => {
              const max = Math.max(...data.byDay.map((r) => parseInt(r.count, 10)));
              const pct = max > 0 ? (parseInt(row.count, 10) / max) * 100 : 0;
              return (
                <div key={row.date} className="chart-bar-row">
                  <span className="chart-label">{new Date(row.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  <div className="chart-bar-bg">
                    <div className="chart-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="chart-count">{row.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
