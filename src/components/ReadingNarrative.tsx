import ReactMarkdown from 'react-markdown';

interface ReadingNarrativeProps {
  narrative: string;
}

export const ReadingNarrative = ({ narrative }: ReadingNarrativeProps) => {
  return (
    <article className="prose prose-invert prose-headings:text-foreground prose-p:text-muted-foreground prose-strong:text-foreground prose-li:text-muted-foreground prose-h1:text-3xl prose-h1:mb-6 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-4 prose-p:leading-relaxed prose-p:mb-6 prose-ul:my-6 prose-li:mb-2 max-w-none">
      <ReactMarkdown>{narrative}</ReactMarkdown>
    </article>
  );
};
