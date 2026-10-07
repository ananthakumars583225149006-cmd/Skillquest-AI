import React from 'react';
import katex from 'katex';

interface ErrorBoundaryProps {
  mathText?: string;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class KaTeXErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('KaTeX render error caught gracefully:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded bg-amber-950/20 text-amber-200 font-mono text-xs border border-amber-500/30">
          {this.props.mathText || 'Equation Preview'}
        </span>
      );
    }
    return this.props.children;
  }
}

interface KaTeXRendererProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ math, block = false, className = '' }) => {
  return (
    <KaTeXErrorBoundary mathText={math}>
      <KaTeXRendererInner math={math} block={block} className={className} />
    </KaTeXErrorBoundary>
  );
};

const KaTeXRendererInner: React.FC<KaTeXRendererProps> = ({ math, block = false, className = '' }) => {
  try {
    const html = katex.renderToString(math || '', {
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
    return (
      <code className={`font-mono text-xs bg-amber-950/20 text-amber-200 px-1 py-0.5 rounded ${className}`}>
        {math}
      </code>
    );
  }
};

/**
 * Parses markdown text containing $inline$ and $$block$$ math formulas.
 */
export const FormattedMathText: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  if (!text) return null;

  return (
    <KaTeXErrorBoundary mathText={text}>
      <FormattedMathTextInner text={text} className={className} />
    </KaTeXErrorBoundary>
  );
};

const FormattedMathTextInner: React.FC<{ text: string; className?: string }> = ({ text, className = '' }) => {
  try {
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
  } catch (e) {
    return <span className={className}>{text}</span>;
  }
};
