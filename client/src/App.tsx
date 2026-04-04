import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import EmbedLayout from './components/layout/EmbedLayout';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import VendorCalculator from './pages/VendorCalculator';
import EmbedCalculator from './pages/EmbedCalculator';
import NotFound from './pages/NotFound';
import Login from './pages/admin/Login';
import Setup from './pages/admin/Setup';
import Dashboard from './pages/admin/Dashboard';
import Countries from './pages/admin/Countries';
import Rates from './pages/admin/Rates';
import Vendors from './pages/admin/Vendors';
import Enquiries from './pages/admin/Enquiries';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <Routes>
      {/* Embed routes (no header/footer, iframe-friendly) */}
      <Route path="/embed" element={<EmbedLayout />}>
        <Route index element={<EmbedCalculator />} />
        <Route path=":slug" element={<EmbedCalculator />} />
      </Route>

      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:slug" element={<VendorCalculator />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin auth (no sidebar) */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/setup" element={<Setup />} />

      {/* Admin panel (with sidebar) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="countries" element={<Countries />} />
        <Route path="rates" element={<Rates />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
