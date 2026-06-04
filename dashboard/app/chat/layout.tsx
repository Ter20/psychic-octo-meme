// Sidebar is now in the root layout — this layout just passes children through.
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
