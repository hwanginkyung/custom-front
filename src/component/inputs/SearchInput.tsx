import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (val: string) => void;
}

export default function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className="flex-1 px-3.5 py-2 bg-white rounded-md outline outline-1 outline-offset-[-1px] outline-[#71717A] inline-flex justify-start items-start gap-2.5 overflow-hidden">
      <div className="flex-1 flex justify-between items-center">
        <input
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          className="flex-1 text-sm font-normal leading-6 tracking-tight outline-none placeholder:text-[#71717A]"
        />
        <div className="w-4 h-4 relative overflow-hidden flex items-center justify-center">
          <Search size={16} />
        </div>
      </div>
    </div>
  );
}
