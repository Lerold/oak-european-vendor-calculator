import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { LANGUAGES } from '../../i18n';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div className="language-switcher">
      <Globe size={16} />
      <select
        value={i18n.language?.substring(0, 2) || 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        aria-label="Language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
