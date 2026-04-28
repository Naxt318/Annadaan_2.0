import { Suspense, lazy } from "react";
import { Navbar } from "@/components/Navbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { MapPin, Leaf } from "lucide-react";

const MapView = lazy(() => import("@/components/MapView").then((m) => ({ default: m.MapView })));

export default function MapPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Mumbai Food Network</h1>
          <p className="text-muted-foreground text-sm">NGO partners and donation pickup points across Mumbai</p>
        </div>

        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">NGO Partners</span>
          </div>
          <div className="flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1.5 text-sm">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span className="text-muted-foreground">Pickup Points</span>
          </div>
        </div>

        <div style={{ height: "calc(100vh - 280px)", minHeight: "400px" }}>
          <Suspense fallback={<LoadingSpinner />}>
            <MapView />
          </Suspense>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { name: "Roti Bank Mumbai", area: "Bandra" },
            { name: "Akshaya Patra Foundation", area: "Andheri" },
            { name: "Robin Hood Army", area: "Kurla" },
            { name: "Feeding India", area: "Vile Parle" },
            { name: "Food for Life Global", area: "Dadar" },
          ].map((ngo) => (
            <div key={ngo.name} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{ngo.name}</p>
                <p className="text-xs text-muted-foreground">{ngo.area}, Mumbai</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
