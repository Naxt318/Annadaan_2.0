import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { RoleBanner } from "@/components/RoleBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, MapPin, Package, CheckCircle2, Map, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sendNotification } from "@/hooks/useNotifications";
import {
  mergeById,
  subscribeLocalDeliveries,
  updateLocalDelivery,
  type LocalDelivery,
} from "@/lib/localSync";

const MapView = lazy(() => import("@/components/MapView").then((m) => ({ default: m.MapView })));

interface Delivery {
  id: string;
  donationId: string;
  pickupLocation: string;
  dropLocation: string;
  status: string;
  volunteerId?: string | null;
  volunteerName?: string | null;
  foodType?: string;
  quantity?: string;
  createdAt: any;
  createdAtMillis?: number;
  updatedAtMillis?: number;
  donorId?: string;
}

const STATUS_STEPS = [
  { key: "pending", label: "Assigned" },
  { key: "picked", label: "Picked Up" },
  { key: "delivered", label: "Delivered" },
];

function StepProgress({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.findIndex((s) => s.key === status);
  return (
    <div className="flex items-center gap-0 mt-4">
      {STATUS_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: i <= currentIdx ? "hsl(167 24% 45%)" : "hsl(0 0% 90%)",
                scale: i === currentIdx ? 1.15 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            >
              {i < currentIdx ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </motion.div>
            <span className={`text-xs whitespace-nowrap ${i <= currentIdx ? "text-primary font-medium" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <motion.div
              className="h-0.5 flex-1 mx-2 mb-4 rounded-full"
              initial={false}
              animate={{ backgroundColor: i < currentIdx ? "hsl(167 24% 45%)" : "hsl(0 0% 88%)" }}
              transition={{ duration: 0.4 }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

const FOOD_EMOJIS: Record<string, string> = {
  rice: "🍚", dal: "🍲", biryani: "🍛", bread: "🍞", chapati: "🫓",
  roti: "🫓", sabzi: "🥘", mithai: "🍮", poha: "🥣", curry: "🍛",
  default: "🛵",
};

function getFoodEmoji(foodType?: string): string {
  if (!foodType) return "🛵";
  const lower = foodType.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return FOOD_EMOJIS.default;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function VolunteerDashboard() {
  const { userDoc } = useAuth();
  const [availableDeliveries, setAvailableDeliveries] = useState<Delivery[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Delivery[]>([]);
  const [localDeliveries, setLocalDeliveries] = useState<Delivery[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [loadingMine, setLoadingMine] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const isVolunteer = userDoc?.role === "volunteer";

  useEffect(() => {
    return subscribeLocalDeliveries((items: LocalDelivery[]) => {
      setLocalDeliveries(items as Delivery[]);
    });
  }, []);

  useEffect(() => {
    // Listen to the collection and filter client-side so Firestore query/index rules cannot hide real deliveries.
    const q = collection(db, "deliveries");
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Delivery))
        // Sort newest first client-side
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setAvailableDeliveries(all.filter((d) => d.status === "pending" && !d.volunteerId));
      setMyDeliveries(all.filter((d) => d.volunteerId === userDoc?.uid));
      setSyncError(null);
      setLoadingAvailable(false);
      setLoadingMine(false);
    }, (err) => {
      console.error("Deliveries sync error:", err);
      setSyncError("Firebase is blocking this volunteer from reading deliveries. Update Firestore rules so volunteers can read accepted deliveries.");
      setLoadingAvailable(false);
      setLoadingMine(false);
    });
    return () => unsub();
  }, [userDoc?.uid]);

  useEffect(() => {
    if (!userDoc?.uid) return;
    // Single-field query — no composite index needed
    const q = query(
      collection(db, "deliveries"),
      where("volunteerId", "==", userDoc.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Delivery))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setMyDeliveries(all);
      setLoadingMine(false);
    }, (err) => {
      console.error("My deliveries error:", err);
      setLoadingMine(false);
    });
    return () => unsub();
  }, [userDoc?.uid]);

  const sortDeliveries = (items: Delivery[]) => [...items].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? a.createdAtMillis ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? b.createdAtMillis ?? 0;
    return bTime - aTime;
  });

  const mergedDeliveries = mergeById(localDeliveries, mergeById(availableDeliveries, myDeliveries));
  const displayAvailable = sortDeliveries(
    mergedDeliveries.filter((delivery) => delivery.status === "pending" && !delivery.volunteerId)
  );
  const displayMine = sortDeliveries(
    mergedDeliveries.filter((delivery) => delivery.volunteerId === userDoc?.uid)
  );

  const handleClaim = async (delivery: Delivery) => {
    if (!userDoc || !isVolunteer) { toast.error("Only volunteers can claim deliveries"); return; }
    setProcessing(delivery.id);
    updateLocalDelivery(delivery.id, {
      volunteerId: userDoc.uid,
      volunteerName: userDoc.name,
      status: "pending",
      updatedAtMillis: Date.now(),
    });
    setProcessing(null);
    try {
      await updateDoc(doc(db, "deliveries", delivery.id), {
        volunteerId: userDoc.uid,
        volunteerName: userDoc.name,
        status: "pending",
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Notify donor that a volunteer claimed their delivery
      if (delivery.donorId) {
        void sendNotification({
          recipientId: delivery.donorId,
          recipientRole: "donor",
          type: "delivery_assigned",
          title: "Volunteer assigned to your donation",
          message: `${userDoc.name} is on their way to pick up ${delivery.foodType || "your food"} from ${delivery.pickupLocation}.`,
          donationId: delivery.donationId,
        });
      }
      toast.success("Delivery claimed! Donor notified. Check 'My Deliveries' tab.");
    } catch {
      toast.error("Failed to claim delivery");
    } finally {
      setProcessing(null);
    }
  };

  const handleStatusUpdate = async (delivery: Delivery, nextStatus: string) => {
    if (!userDoc || !isVolunteer) return;
    setProcessing(delivery.id);
    updateLocalDelivery(delivery.id, {
      status: nextStatus,
      updatedAtMillis: Date.now(),
    });
    try {
      await updateDoc(doc(db, "deliveries", delivery.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        ...(nextStatus === "delivered" ? { deliveredAt: serverTimestamp() } : {}),
      });
      // Notify donor on picked up and delivered
      if (delivery.donorId) {
        if (nextStatus === "picked") {
          void sendNotification({
            recipientId: delivery.donorId,
            recipientRole: "donor",
            type: "delivery_picked",
            title: "Your food has been picked up!",
            message: `${userDoc.name} picked up ${delivery.foodType || "your donation"} and is heading to the drop location.`,
            donationId: delivery.donationId,
          });
        } else if (nextStatus === "delivered") {
          void sendNotification({
            recipientId: delivery.donorId,
            recipientRole: "donor",
            type: "delivery_completed",
            title: "Delivery completed! 🎉",
            message: `${delivery.foodType || "Your food"} was successfully delivered by ${userDoc.name}. Thank you for your generosity!`,
            donationId: delivery.donationId,
          });
        }
      }
      const labels: Record<string, string> = { picked: "Marked as picked up! Donor notified.", delivered: "Delivery completed! Great work 🎉" };
      toast.success(labels[nextStatus] || "Status updated!");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setProcessing(null);
    }
  };

  const active = displayMine.filter((d) => d.status !== "delivered");
  const completed = displayMine.filter((d) => d.status === "delivered");

  const DeliveryCard = ({ delivery, mine = false, index = 0 }: { delivery: Delivery; mine?: boolean; index?: number }) => (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: { duration: 0.15 } }}
      className={`bg-card border rounded-2xl p-5 cursor-default ${
        delivery.status === "delivered" ? "border-green-200 bg-green-50/20" : "border-border"
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center text-xl flex-shrink-0">
          {getFoodEmoji(delivery.foodType)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              {delivery.foodType && (
                <p className="font-semibold text-foreground">
                  {delivery.foodType} {delivery.quantity && <span className="font-normal text-muted-foreground text-sm">({delivery.quantity})</span>}
                </p>
              )}
              <StatusBadge status={delivery.status} />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {delivery.createdAt?.toDate
                ? formatDistanceToNow(delivery.createdAt.toDate(), { addSuffix: true })
                : delivery.createdAtMillis
                  ? formatDistanceToNow(new Date(delivery.createdAtMillis), { addSuffix: true })
                : "Just now"}
            </span>
          </div>

          <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="font-medium text-foreground">Pickup:</span> {delivery.pickupLocation || "TBD"}
            </span>
            {delivery.dropLocation && (
              <span className="flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground">Drop:</span> {delivery.dropLocation}
              </span>
            )}
          </div>
        </div>
      </div>

      {mine && delivery.status !== "unassigned" && <StepProgress status={delivery.status} />}

      <div className="mt-4 flex gap-2">
        {!mine && (
          isVolunteer ? (
            <Button size="sm" onClick={() => handleClaim(delivery)} disabled={processing === delivery.id} className="gap-1.5">
              <Truck className="w-3.5 h-3.5" />
              {processing === delivery.id ? "Claiming..." : "Claim Delivery"}
            </Button>
          ) : (
            <div className="relative group inline-block">
              <Button size="sm" disabled className="gap-1.5 opacity-50">
                <Truck className="w-3.5 h-3.5" /> Claim Delivery
              </Button>
              <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Only available for Volunteers
              </div>
            </div>
          )
        )}

        {mine && delivery.status === "pending" && isVolunteer && (
          <Button size="sm" onClick={() => handleStatusUpdate(delivery, "picked")} disabled={processing === delivery.id} className="gap-1.5">
            <Package className="w-3.5 h-3.5" />
            {processing === delivery.id ? "..." : "Mark as Picked Up"}
          </Button>
        )}

        {mine && delivery.status === "picked" && isVolunteer && (
          <Button size="sm" onClick={() => handleStatusUpdate(delivery, "delivered")} disabled={processing === delivery.id} className="gap-1.5 bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {processing === delivery.id ? "..." : "Mark as Delivered"}
          </Button>
        )}

        {mine && delivery.status === "delivered" && (
          <span className="text-xs text-green-600 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Completed — thank you!
          </span>
        )}
      </div>
    </motion.div>
  );

  const stats = [
    { label: "Available", value: displayAvailable.length, icon: Truck, bg: "bg-amber-50", iconColor: "text-amber-600", border: "border-l-amber-400" },
    { label: "Active", value: active.length, icon: MapPin, bg: "bg-primary/10", iconColor: "text-primary", border: "border-l-primary" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, bg: "bg-green-50", iconColor: "text-green-600", border: "border-l-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {userDoc && userDoc.role !== "volunteer" && <RoleBanner viewing="volunteer" actual={userDoc.role} />}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-foreground">Volunteer Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {userDoc ? `Welcome back, ${userDoc.name}` : "Manage your deliveries"}
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowMap(!showMap)} className="gap-2">
            <Map className="w-4 h-4" />
            {showMap ? "Hide Map" : "Show Map"}
          </Button>
        </motion.div>

        {syncError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {syncError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className={`bg-card border border-border border-l-4 ${stat.border} rounded-2xl p-5 cursor-default`}
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
              <p className="text-3xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Map */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              key="map"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-8 overflow-hidden"
            >
              <div className="h-72 rounded-2xl overflow-hidden border border-border">
                <Suspense fallback={<LoadingSpinner />}>
                  <MapView />
                </Suspense>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <Tabs defaultValue="available">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="available">
                Available ({displayAvailable.length})
              </TabsTrigger>
              <TabsTrigger value="mine">
                My Deliveries ({displayMine.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="available">
            {loadingAvailable ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {displayAvailable.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-foreground mb-1">No available deliveries</h3>
                    <p className="text-sm text-muted-foreground">New deliveries will appear here when NGOs accept donations.</p>
                  </div>
                ) : (
                  displayAvailable.map((d, i) => <DeliveryCard key={d.id} delivery={d} index={i} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mine">
            {loadingMine ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {displayMine.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-foreground mb-1">No deliveries yet</h3>
                    <p className="text-sm text-muted-foreground">Claim a delivery from the Available tab to get started.</p>
                  </div>
                ) : (
                  displayMine.map((d, i) => <DeliveryCard key={d.id} delivery={d} mine index={i} />)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
