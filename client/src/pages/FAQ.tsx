import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import FAQAccordion from '../components/faq/FAQAccordion';

export default function FAQ() {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/faq').then(({ data }) => {
      setContent(data.content);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="faq-page">
      <h1>{t('faq.title')}</h1>
      <p className="faq-intro">{t('faq.intro')}</p>
      {loading ? (
        <p>{t('common.loading')}</p>
      ) : (
        <FAQAccordion content={content} />
      )}
    </div>
  );
}
