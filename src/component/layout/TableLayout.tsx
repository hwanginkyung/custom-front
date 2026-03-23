interface LayoutProps {
  children: React.ReactNode;
}

export default function TableLayout({ children }: LayoutProps) {
  return (
    <div className="flex flex-1 px-9 py-9 bg-white rounded-xl shadow-[0px_3px_3px_0px_rgba(0,0,0,0.10)] gap-6">
      <main className="flex-1">{children}</main>
    </div>
  );
}
