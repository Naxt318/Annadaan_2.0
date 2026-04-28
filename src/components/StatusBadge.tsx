import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  switch (status.toLowerCase()) {
    case "pending":
    case "unassigned":
      return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 capitalize">{status}</Badge>;
    case "accepted":
    case "delivered":
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 capitalize">{status}</Badge>;
    case "rejected":
      return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 capitalize">{status}</Badge>;
    case "picked":
      return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 capitalize">{status}</Badge>;
    default:
      return <Badge variant="outline" className="capitalize">{status}</Badge>;
  }
}
