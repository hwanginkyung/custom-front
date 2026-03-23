import { ChevronLeft, ChevronRight } from "lucide-react";

type TablePagerProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export default function TablePager({
  currentPage,
  totalPages,
  onPageChange,
}: TablePagerProps) {
  return (
    <div className="flex flex-row gap-2 justify-center items-center mt-4">
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="transition-all hover:scale-110 active:scale-90 disabled:opacity-50 disabled:hover:scale-100"
      >
        <ChevronLeft
          size={18}
          color={currentPage === 1 ? "#B7C0CA" : "#1B242C"}
        />
      </button>

      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          className={`flex w-8 h-8 px-1.5 rounded-md outline outline-1 outline-offset-[-1px] justify-center items-center transition-all hover:scale-110 active:scale-90 ${
            currentPage === i + 1
              ? "outline-Brand-2 text-Brand-2 font-bold shadow-sm"
              : "outline-white text-zinc-800 hover:bg-neutral-50"
          }`}
          onClick={() => onPageChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="transition-all hover:scale-110 active:scale-90 disabled:opacity-50 disabled:hover:scale-100"
      >
        <ChevronRight
          size={18}
          color={currentPage === totalPages ? "#B7C0CA" : "#1B242C"}
        />
      </button>
    </div>
  );
}
