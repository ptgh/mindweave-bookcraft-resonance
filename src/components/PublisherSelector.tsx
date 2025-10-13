import { useRef, useEffect } from "react";
import { gsap } from "gsap";

interface PublisherSelectorProps {
  publishers: Array<{ id: 'Penguin' | 'Gollancz'; label: string }>;
  selected: 'Penguin' | 'Gollancz';
  onSelect: (publisher: 'Penguin' | 'Gollancz') => void;
}

const PublisherSelector = ({ publishers, selected, onSelect }: PublisherSelectorProps) => {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    buttonsRef.current.forEach((button, index) => {
      if (!button) return;

      const isSelected = publishers[index].id === selected;

      // Set initial state
      gsap.set(button, {
        borderColor: isSelected ? "hsl(217, 91%, 60%)" : "rgba(255, 255, 255, 0.15)",
        color: isSelected ? "#89b4fa" : "#cdd6f4",
        boxShadow: isSelected ? "0 0 20px rgba(137, 180, 250, 0.4)" : "0 0 0px transparent",
        scale: 1,
      });

      const handleMouseEnter = () => {
        if (publishers[index].id !== selected) {
          gsap.to(button, {
            borderColor: "hsl(217, 91%, 60%)",
            color: "#89b4fa",
            boxShadow: "0 0 15px rgba(137, 180, 250, 0.3)",
            scale: 1.02,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      };

      const handleMouseLeave = () => {
        if (publishers[index].id !== selected) {
          gsap.to(button, {
            borderColor: "rgba(255, 255, 255, 0.15)",
            color: "#cdd6f4",
            boxShadow: "0 0 0px transparent",
            scale: 1,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      };

      button.addEventListener('mouseenter', handleMouseEnter);
      button.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        button.removeEventListener('mouseenter', handleMouseEnter);
        button.removeEventListener('mouseleave', handleMouseLeave);
      };
    });
  }, [selected, publishers]);

  const handleClick = (publisher: 'Penguin' | 'Gollancz', index: number) => {
    const button = buttonsRef.current[index];
    if (!button) return;

    // Animate the click
    gsap.to(button, {
      scale: 0.95,
      duration: 0.1,
      ease: "power2.out",
      onComplete: () => {
        gsap.to(button, {
          scale: 1,
          borderColor: "hsl(217, 91%, 60%)",
          color: "#89b4fa",
          boxShadow: "0 0 20px rgba(137, 180, 250, 0.4)",
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });

    // Animate previous selection out
    buttonsRef.current.forEach((btn, i) => {
      if (btn && publishers[i].id === selected && i !== index) {
        gsap.to(btn, {
          borderColor: "rgba(255, 255, 255, 0.15)",
          color: "#cdd6f4",
          boxShadow: "0 0 0px transparent",
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });

    onSelect(publisher);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      {publishers.map((publisher, index) => (
        <button
          key={publisher.id}
          ref={(el) => (buttonsRef.current[index] = el)}
          onClick={() => handleClick(publisher.id, index)}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 py-1.5 px-3 bg-transparent border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
        >
          <span>{publisher.label}</span>
        </button>
      ))}
    </div>
  );
};

export default PublisherSelector;
