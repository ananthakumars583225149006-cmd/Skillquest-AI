import React from 'react';
import katex from 'katex';

interface KaTeXRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ math, block = false, className = '' }) => {
  try {
    const html = katex.renderToString(math, {
      displayMode: block,
      throwOnError: false,
    });
    return (
      <span
        className={`katex-wrapper inline-block ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (err) {
    return <code className={`font-mono text-sm ${className}`}>{math}</code>;
  }
};

/**
 * Parses markdown text containing $inline$ and $$block$$ math formulas.
 */
export const FormattedMathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split by $$ for block math or $ for inline math
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const rawMath = part.slice(2, -2);
          return <KaTeXRenderer key={index} math={rawMath} block={true} className="my-2 block text-center" />;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const rawMath = part.slice(1, -1);
          return <KaTeXRenderer key={index} math={rawMath} block={false} />;
        }
        return <span key={index}>{part}</span>;
      })}
    </span>
  );
};
