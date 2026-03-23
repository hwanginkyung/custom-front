import { useState } from "react";
import { ChevronDown } from "lucide-react";

type DropdownInputProps = {
  options: string[];
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  className?: string;
};

export default function DropdownInput({
  options,
  value,
  onChange,
  placeholder,
  className,
}: DropdownInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue =
    value || placeholder || (options.length > 0 ? options[0] : "");

  const handleSelect = (option: string) => {
    setIsOpen(false);
    if (onChange) onChange(option);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={`relative flex w-full flex-col gap-2 ${className || ""}`}>
      <div className="relative w-full cursor-pointer" onClick={toggleDropdown}>
        <input
          type="text"
          value={displayValue}
          readOnly
          placeholder={placeholder}
          className={`
            w-full px-3.5 py-2 bg-white text-sm
            leading-6 rounded-md
            outline outline-1 outline-offset-[-1px]
            outline-[#D5D5D5] cursor-pointer
            ${!value && placeholder ? "text-Neutral-600" : "text-Neutral-800"}
          `}
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <ChevronDown
            size={20}
            className={`text-Neutral-800 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div
          className="
            absolute top-full mt-2 w-full bg-white z-10
            rounded-md overflow-hidden
            shadow-[0px_4px_24px_0px_rgba(0,0,0,0.06)]
            outline outline-1 outline-offset-[-1px] outline-[#D5D5D5]
          "
        >
          <ul className="flex flex-col max-h-60 overflow-y-auto">
            {options.map((option, index) => {
              const isSelected = value === option;
              return (
                <li
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option);
                  }}
                  className={`
                    px-3.5 py-2 text-sm leading-6 cursor-pointer
                    ${
                      isSelected
                        ? "bg-gray-100 text-[#18181B] font-medium"
                        : "bg-white text-[#18181B] hover:bg-gray-100"
                    }
                  `}
                >
                  {option}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
