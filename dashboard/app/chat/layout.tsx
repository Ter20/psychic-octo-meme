import Sidebar from "@/components/Sidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <Sidebar />
      <div className="flex-1 overflow-hidden min-w-0">{children}</div>
    </div>
  );
}
