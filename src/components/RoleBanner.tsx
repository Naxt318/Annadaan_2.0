import { Info } from "lucide-react";
import { UserRole } from "@/context/AuthContext";

interface RoleBannerProps {
  viewing: string;
  actual: UserRole;
}

export function RoleBanner({ viewing, actual }: RoleBannerProps) {
  if (viewing === actual) return null;

  const viewingLabel = viewing.charAt(0).toUpperCase() + viewing.slice(1);

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-amber-800 text-sm mb-6">
      <Info className="w-4 h-4 flex-shrink-0" />
      <span>
        Viewing <strong>{viewingLabel} Dashboard</strong> — some actions are restricted to {viewingLabel}s only.
      </span>
    </div>
  );
}
