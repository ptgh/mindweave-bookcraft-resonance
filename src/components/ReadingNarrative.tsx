import ReactMarkdown from 'react-markdown';

interface ReadingNarrativeProps {
  narrative: string;
}

export const ReadingNarrative = ({ narrative }: ReadingNarrativeProps) => {
  return (
    <article className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-p:leading-relaxed max-w-none">
      <ReactMarkdown>{narrative}</ReactMarkdown>
    </article>
  );
};
