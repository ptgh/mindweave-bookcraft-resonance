
interface StatusIndicatorProps {
  status: 'active' | 'idle' | 'error';
  label: string;
}

const StatusIndicator = ({ status, label }: StatusIndicatorProps) => {
  const colors = {
    active: 'bg-cyan-400 animate-pulse',
    idle: 'bg-slate-600',
    error: 'bg-red-400'
  };

  return (
    <div className="inline-flex items-center space-x-2 text-slate-500 text-xs">
      <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
      <span>{label}</span>
    </div>
  );
};

export default StatusIndicator;
