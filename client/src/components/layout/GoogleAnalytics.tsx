import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function GoogleAnalytics() {
  const [gaId, setGaId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/settings/public').then(({ data }) => {
      const id = data.settings?.google_analytics_id;
      if (id && id.startsWith('G-')) {
        setGaId(id);
      }
    }).catch(() => { /* GA is optional */ });
  }, []);

  useEffect(() => {
    if (!gaId) return;

    // Load gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`;
    document.head.appendChild(script);

    // Initialize gtag
    const inline = document.createElement('script');
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}', { anonymize_ip: true });
    `;
    document.head.appendChild(inline);

    return () => {
      document.head.removeChild(script);
      document.head.removeChild(inline);
    };
  }, [gaId]);

  return null;
}
