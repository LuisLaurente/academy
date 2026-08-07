'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { useTheme } from 'next-themes';
import { AlertCircle } from 'lucide-react';

interface MermaidProps {
  chart: string;
}

export function Mermaid({ chart }: MermaidProps) {
  const { resolvedTheme } = useTheme();
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const elementId = useId().replace(/:/g, ''); // Remove colons to make it a valid HTML ID
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);

    setSvg('');

    const renderChart = async () => {
      try {
        const themeValue = resolvedTheme === 'dark' ? 'dark' : 'neutral';

        mermaid.initialize({
          startOnLoad: false,
          theme: themeValue,
          securityLevel: 'loose',
          fontFamily: 'var(--font-plus-jakarta), sans-serif',
          themeVariables: {
            primaryColor: '#ff5a5f',
            primaryTextColor: resolvedTheme === 'dark' ? '#fdfbf7' : '#1a1a1a',
            lineColor: resolvedTheme === 'dark' ? '#fdfbf7' : '#1a1a1a',
            mainBkg: resolvedTheme === 'dark' ? '#1d2523' : '#ffffff',
            nodeBorder: resolvedTheme === 'dark' ? '#fdfbf7' : '#1a1a1a',
            borderWidth: '2px',
          },
        });

        const cleanChart = chart.trim();

        // Render diagram
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${elementId}`, cleanChart);

        if (isMounted) {
          setSvg(renderedSvg);
        }
      } catch (err) {
        console.error('Mermaid parsing error:', err);
        if (isMounted) {
          setError('No se pudo generar el diagrama visual.');
        }
      }
    };

    void renderChart();

    return () => {
      isMounted = false;
      // Clean up global mermaid cache for this ID if needed
      const badElement = document.getElementById(`mermaid-${elementId}`);
      if (badElement) {
        badElement.remove();
      }
    };
  }, [chart, resolvedTheme, elementId]);

  if (error) {
    return (
      <div className="border-border bg-card shadow-neobrutalism-sm my-4 rounded-xl border-2 p-4 font-sans text-xs">
        <div className="mb-2 flex items-center gap-2 font-bold text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
        <p className="text-muted-foreground mb-2">Código del diagrama:</p>
        <pre className="bg-muted border-border overflow-x-auto rounded border p-2 font-mono text-[10px]">
          <code>{chart}</code>
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="bg-muted/30 border-border shadow-neobrutalism-sm text-muted-foreground my-4 flex h-32 animate-pulse items-center justify-center rounded-xl border-2 font-sans text-xs">
        Dibujando diagrama...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="border-border bg-card shadow-neobrutalism my-6 flex justify-center overflow-x-auto rounded-xl border-2 p-6"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
