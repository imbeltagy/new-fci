import { Toaster } from "@repo/common/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      {children}
      <Toaster richColors />
    </div>
  );
}
