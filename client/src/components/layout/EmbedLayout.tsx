import { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function EmbedLayout() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  // Post height to parent window for auto-resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (ref.current) {
        window.parent.postMessage(
          { type: 'oaklease-resize', height: ref.current.scrollHeight },
          '*'
        );
      }
    });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="embed-layout" ref={ref}>
      <Outlet />
      <div className="embed-footer">
        {t('embed.poweredBy')}{' '}
        <a href="https://oaklease.co.uk" target="_blank" rel="noopener noreferrer">
          Oaklease Ltd
        </a>
      </div>
    </div>
  );
}
