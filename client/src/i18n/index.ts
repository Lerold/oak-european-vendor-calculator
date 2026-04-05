import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import nl from './locales/nl.json';
import sv from './locales/sv.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import no from './locales/no.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import el from './locales/el.json';
import hu from './locales/hu.json';
import cs from './locales/cs.json';
import ro from './locales/ro.json';
import hr from './locales/hr.json';
import sk from './locales/sk.json';
import sl from './locales/sl.json';

const resources = {
  en: { translation: en },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  nl: { translation: nl },
  sv: { translation: sv },
  da: { translation: da },
  fi: { translation: fi },
  no: { translation: no },
  pl: { translation: pl },
  pt: { translation: pt },
  el: { translation: el },
  hu: { translation: hu },
  cs: { translation: cs },
  ro: { translation: ro },
  hr: { translation: hr },
  sk: { translation: sk },
  sl: { translation: sl },
};

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'sv', name: 'Svenska' },
  { code: 'da', name: 'Dansk' },
  { code: 'fi', name: 'Suomi' },
  { code: 'no', name: 'Norsk' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt', name: 'Português' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'hu', name: 'Magyar' },
  { code: 'cs', name: 'Čeština' },
  { code: 'ro', name: 'Română' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React handles escaping
    },
    detection: {
      order: ['querystring', 'navigator', 'htmlTag'],
      lookupQuerystring: 'lang',
    },
  });

export default i18n;
