import { Loader2 } from "lucide-react";

export function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading ANNADAAN...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
    </div>
  );
}
