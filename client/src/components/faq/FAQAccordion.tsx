import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import DOMPurify from 'dompurify';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
}

function parseMarkdownFAQ(markdown: string): FAQItem[] {
  const items: FAQItem[] = [];
  const sections = markdown.split(/^## /m).filter(Boolean);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const question = lines[0].trim();
    const answer = lines.slice(1).join('\n').trim();
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}

function markdownToHtml(md: string): string {
  return md
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export default function FAQAccordion({ content }: { content: string }) {
  const items = parseMarkdownFAQ(content);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  if (items.length === 0) {
    return <p>No FAQ content available.</p>;
  }

  return (
    <div className="faq-accordion">
      {items.map((item, i) => (
        <div key={i} className={`faq-item ${openIndex === i ? 'open' : ''}`}>
          <button
            className="faq-question"
            onClick={() => toggle(i)}
            aria-expanded={openIndex === i}
          >
            <span>{item.question}</span>
            <ChevronDown size={20} className="faq-chevron" />
          </button>
          {openIndex === i && (
            <div
              className="faq-answer"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(markdownToHtml(item.answer)),
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export { parseMarkdownFAQ };
