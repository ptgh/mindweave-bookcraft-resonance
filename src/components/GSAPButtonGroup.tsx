import { useRef, useEffect } from "react";
import { gsap } from "gsap";

export interface GSAPButton {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface GSAPButtonGroupProps {
  buttons: GSAPButton[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
  className?: string;
}

const GSAPButtonGroup = ({ buttons, selected, onSelect, disabled = false, className = "" }: GSAPButtonGroupProps) => {
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    buttonsRef.current.forEach((button, index) => {
      if (!button) return;

      const isSelected = buttons[index].id === selected;

      // Set initial state
      gsap.set(button, {
        borderColor: isSelected ? "hsl(217, 91%, 60%)" : "rgba(255, 255, 255, 0.15)",
        color: isSelected ? "#89b4fa" : "#cdd6f4",
        boxShadow: isSelected ? "0 0 20px rgba(137, 180, 250, 0.4)" : "0 0 0px transparent",
        scale: 1,
      });

      const handleMouseEnter = () => {
        if (buttons[index].id !== selected && !disabled) {
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
        if (buttons[index].id !== selected && !disabled) {
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
  }, [selected, buttons, disabled]);

  const handleClick = (buttonId: string, index: number) => {
    if (disabled) return;
    
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
      if (btn && buttons[i].id === selected && i !== index) {
        gsap.to(btn, {
          borderColor: "rgba(255, 255, 255, 0.15)",
          color: "#cdd6f4",
          boxShadow: "0 0 0px transparent",
          duration: 0.3,
          ease: "power2.out"
        });
      }
    });

    onSelect(buttonId);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {buttons.map((button, index) => (
        <button
          key={button.id}
          ref={(el) => (buttonsRef.current[index] = el)}
          onClick={() => handleClick(button.id, index)}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-medium transition-all duration-200 py-1.5 px-3 bg-transparent border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation disabled:opacity-50 disabled:pointer-events-none"
        >
          {button.icon && <span className="flex-shrink-0">{button.icon}</span>}
          <span>{button.label}</span>
        </button>
      ))}
    </div>
  );
};

export default GSAPButtonGroup;
