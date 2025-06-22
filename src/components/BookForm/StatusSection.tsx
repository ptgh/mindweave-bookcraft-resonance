
import { Label } from "@/components/ui/label";

interface StatusSectionProps {
  status: string;
  onStatusChange: (status: string) => void;
}

const StatusSection = ({ status, onStatusChange }: StatusSectionProps) => {
  const statusOptions = [
    { value: "want-to-read", label: "Want to Read" },
    { value: "reading", label: "Reading" },
    { value: "read", label: "Read" }
  ];

  return (
    <div>
      <Label className="text-slate-300 text-sm">Status</Label>
      <div className="flex space-x-4 mt-2">
        {statusOptions.map(statusOption => (
          <label key={statusOption.value} className="flex items-center space-x-2">
            <input
              type="radio"
              name="status"
              value={statusOption.value}
              checked={status === statusOption.value}
              onChange={(e) => onStatusChange(e.target.value)}
              className="text-blue-400"
            />
            <span className="text-slate-300 text-sm">{statusOption.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default StatusSection;
