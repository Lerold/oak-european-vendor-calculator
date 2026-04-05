import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import EmbedLayout from './components/layout/EmbedLayout';
import AdminLayout from './components/admin/AdminLayout';
import Home from './pages/Home';
import VendorCalculator from './pages/VendorCalculator';
import EmbedCalculator from './pages/EmbedCalculator';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import Login from './pages/admin/Login';
import Setup from './pages/admin/Setup';
import Dashboard from './pages/admin/Dashboard';
import Countries from './pages/admin/Countries';
import Rates from './pages/admin/Rates';
import Vendors from './pages/admin/Vendors';
import Enquiries from './pages/admin/Enquiries';
import Analytics from './pages/admin/Analytics';
import FAQEditor from './pages/admin/FAQEditor';
import Users from './pages/admin/Users';
import Invite from './pages/admin/Invite';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <Routes>
      {/* Embed routes (vendor-only, no header/footer, iframe-friendly) */}
      <Route path="/embed" element={<EmbedLayout />}>
        <Route path=":slug" element={<EmbedCalculator />} />
      </Route>

      {/* Public routes */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/:slug" element={<VendorCalculator />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin auth (no sidebar) */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/setup" element={<Setup />} />
      <Route path="/admin/invite/:token" element={<Invite />} />

      {/* Admin panel (with sidebar) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="countries" element={<Countries />} />
        <Route path="rates" element={<Rates />} />
        <Route path="vendors" element={<Vendors />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="faq" element={<FAQEditor />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
