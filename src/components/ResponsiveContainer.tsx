
import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const ResponsiveContainer = ({ 
  children, 
  className = '', 
  maxWidth = 'xl' 
}: ResponsiveContainerProps) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${maxWidthClasses[maxWidth]} ${className}`}>
      {children}
    </div>
  );
};

export default ResponsiveContainer;
