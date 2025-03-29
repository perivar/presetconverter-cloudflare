// ClearableInput.tsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface ClearableInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  className?: string;
  type?: string;
  id?: string;
  placeholder?: string;
}

const ClearableInput: React.FC<ClearableInputProps> = ({
  value,
  onChange,
  onClear,
  className = "",
  ...props
}) => {
  return (
    <div className="relative w-full">
      <Input
        value={value}
        onChange={onChange}
        className={`pr-10 ${className}`}
        onKeyDown={e => {
          if (e.key === "Escape") {
            return onClear();
          }
        }}
        {...props}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 size-6 -translate-y-1/2 p-0"
          onClick={onClear}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
};

export default ClearableInput;
