import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import GoogleAnalytics from './GoogleAnalytics';

export default function Layout() {
  return (
    <div className="app-layout">
      <GoogleAnalytics />
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
