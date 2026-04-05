import { useEffect, useState } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';
import DOMPurify from 'dompurify';
import api from '../../services/api';

export default function FAQEditor() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/admin/settings').then(({ data }) => {
      setContent(data.settings.faq_content || '');
      setLoading(false);
    }).catch(() => {
      setError('Failed to load FAQ content');
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.put('/admin/settings', { faq_content: content });
      setSuccess('FAQ saved');
    } catch {
      setError('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = () => {
    const sections = content.split(/^## /m).filter(Boolean);
    return sections.map((section, i) => {
      const lines = section.trim().split('\n');
      const question = lines[0].trim();
      const answer = lines.slice(1).join('\n').trim()
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
      return (
        <div key={i} className="faq-preview-item">
          <h3>{question}</h3>
          <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(answer) }} />
        </div>
      );
    });
  };

  if (loading) return <div className="admin-page"><p>Loading...</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>FAQ Editor</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary"
          >
            {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>
          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}

      <p className="hint-text">
        Use markdown: ## for questions, **bold**, *italic*. Each ## starts a new FAQ item.
      </p>

      {showPreview ? (
        <div className="card faq-preview">
          {renderPreview()}
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="faq-editor-textarea"
          rows={30}
          placeholder="## Question here&#10;&#10;Answer text here with **bold** and *italic*."
        />
      )}
    </div>
  );
}
