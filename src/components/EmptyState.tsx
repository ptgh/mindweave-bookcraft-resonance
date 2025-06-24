
import { memo } from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = memo(({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="text-center py-8 sm:py-12">
      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
        {Icon ? (
          <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
        ) : (
          <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-cyan-400 animate-pulse" />
        )}
      </div>
      <h3 className="text-slate-300 text-lg font-medium mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-4">{description}</p>
      {action}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
