import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import gsap from 'gsap';
import { Transmission } from '@/services/transmissionsService';

interface ReadingNarrativeProps {
  narrative: string;
  transmissions: Transmission[];
}

export const ReadingNarrative = ({ narrative, transmissions }: ReadingNarrativeProps) => {
  const narrativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!narrativeRef.current) return;

    // Find all book titles and author names in the narrative
    const bookTitles = transmissions.map(t => t.title);
    const authorNames = transmissions.map(t => t.author);
    
    // Create a regex pattern to match book titles and authors
    const allNames = [...bookTitles, ...authorNames];
    const textNodes: { node: Node; parent: HTMLElement }[] = [];
    
    const walker = document.createTreeWalker(
      narrativeRef.current,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.textContent) {
        textNodes.push({ node, parent: node.parentElement });
      }
    }
    
    // Wrap matching text in spans with hover effects
    textNodes.forEach(({ node, parent }) => {
      const text = node.textContent || '';
      let replaced = false;
      let newHTML = text;
      
      allNames.forEach(name => {
        if (text.includes(name)) {
          const regex = new RegExp(`(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
          newHTML = newHTML.replace(regex, '<span class="book-author-link">$1</span>');
          replaced = true;
        }
      });
      
      if (replaced) {
        const wrapper = document.createElement('span');
        wrapper.innerHTML = newHTML;
        parent.replaceChild(wrapper, node);
      }
    });
    
    // Apply GSAP hover effects to all book/author links
    const links = narrativeRef.current.querySelectorAll('.book-author-link');
    links.forEach((link) => {
      const tl = gsap.timeline({ paused: true });
      tl.to(link, {
        color: '#60a5fa',
        textDecoration: 'underline',
        textDecorationColor: '#60a5fa',
        duration: 0.2,
        ease: 'power2.out'
      });
      
      link.addEventListener('mouseenter', () => tl.play());
      link.addEventListener('mouseleave', () => tl.reverse());
    });
  }, [narrative, transmissions]);

  return (
    <article 
      ref={narrativeRef}
      className="prose prose-invert max-w-none
        prose-headings:text-slate-100 prose-headings:font-semibold
        prose-h1:text-3xl prose-h1:mb-6 prose-h1:mt-0
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-blue-300
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-blue-200
        prose-p:text-slate-300 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-base
        prose-strong:text-slate-100 prose-strong:font-semibold
        prose-em:text-blue-200 prose-em:italic
        prose-li:text-slate-300 prose-li:mb-2
        prose-ul:my-4 prose-ol:my-4
        prose-blockquote:border-l-blue-400 prose-blockquote:text-slate-300 prose-blockquote:italic"
    >
      <ReactMarkdown>{narrative}</ReactMarkdown>
      
      <style>{`
        .book-author-link {
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline;
        }
      `}</style>
    </article>
  );
};
