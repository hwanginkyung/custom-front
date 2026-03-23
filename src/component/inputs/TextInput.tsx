import type { LucideIcon } from "lucide-react";

interface TextInputProps {
  label: string;
  icon?: LucideIcon;
  value?: string | number;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  className?: string;
}

export default function TextInput({
  label,
  icon: Icon,
  value,
  readOnly,
  onChange,
  className,
}: TextInputProps) {
  return (
    <div className="h-24 flex-1 inline-flex flex-col justify-start items-start gap-2">
      <div className="self-stretch inline-flex justify-start items-center gap-2">
        {Icon && <Icon size={20} color="#5B6064" />}
        <div className="text-Neutral-600 font-medium leading-7">{label}</div>
      </div>
      <input
        className={`self-stretch h-12 py-2 px-3.5 rounded-md outline outline-1 outline-offset-[-1px] outline-Neutral-400 inline-flex justify-start items-center gap-2.5 overflow-hidden transition-all ${
          className || "bg-Neutral-100"
        }`}
        value={value !== undefined && value !== null ? value.toString() : ""}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}
