import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, query, where, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, getDocs
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { RoleBanner } from "@/components/RoleBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Inbox, Map, Clock, Leaf, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sendNotification } from "@/hooks/useNotifications";
import {
  mergeById,
  subscribeLocalDonations,
  updateLocalDonation,
  upsertLocalDelivery,
  type LocalDonation,
} from "@/lib/localSync";

const MapView = lazy(() => import("@/components/MapView").then((m) => ({ default: m.MapView })));

interface Donation {
  id: string;
  foodType: string;
  quantity: string;
  unit: string;
  location: string;
  donorName: string;
  donorId?: string;
  expiryDate: string;
  status: string;
  notes?: string;
  createdAt: any;
  acceptedByNgoId?: string;
  acceptedByNgoName?: string;
  createdAtMillis?: number;
  updatedAtMillis?: number;
}

const FOOD_EMOJIS: Record<string, string> = {
  rice: "🍚", dal: "🍲", biryani: "🍛", bread: "🍞", chapati: "🫓",
  roti: "🫓", sabzi: "🥘", mithai: "🍮", poha: "🥣", curry: "🍛",
  default: "🥡",
};

function getFoodEmoji(foodType: string): string {
  const lower = foodType.toLowerCase();
  for (const [key, emoji] of Object.entries(FOOD_EMOJIS)) {
    if (lower.includes(key)) return emoji;
  }
  return FOOD_EMOJIS.default;
}

function getUrgencyLevel(expiryDate: string): "high" | "medium" | null {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) return "high";
  if (diffDays <= 3) return "medium";
  return null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function NGODashboard() {
  const { userDoc } = useAuth();
  const [pendingDonations, setPendingDonations] = useState<Donation[]>([]);
  const [acceptedDonations, setAcceptedDonations] = useState<Donation[]>([]);
  const [localDonations, setLocalDonations] = useState<Donation[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const isNgo = userDoc?.role === "ngo";

  useEffect(() => {
    return subscribeLocalDonations((items: LocalDonation[]) => {
      setLocalDonations(items as Donation[]);
    });
  }, []);

  useEffect(() => {
    // Listen to the collection and filter client-side so Firestore query/index rules cannot hide real donations.
    const qPending = collection(db, "donations");
    const unsubPending = onSnapshot(qPending, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Donation))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setPendingDonations(all.filter((donation) => donation.status === "pending"));
      setAcceptedDonations(
        all.filter((donation) =>
          donation.status === "accepted" && donation.acceptedByNgoId === userDoc?.uid
        )
      );
      setSyncError(null);
      setLoadingPending(false);
      setLoadingAccepted(false);
    }, (err) => {
      console.error("Donations sync error:", err);
      setSyncError("Firebase is blocking this NGO from reading donations. Update Firestore rules so NGOs can read pending donations.");
      setLoadingPending(false);
      setLoadingAccepted(false);
    });
    return () => unsubPending();
  }, [userDoc?.uid]);

  useEffect(() => {
    if (!userDoc?.uid) return;
    // Query accepted donations by this NGO — needs Firestore composite index
    // Fallback: query all accepted and filter client-side if index not ready
    const qAccepted = query(
      collection(db, "donations"),
      where("acceptedByNgoId", "==", userDoc.uid),
    );
    const unsubAccepted = onSnapshot(qAccepted, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Donation));
      // Sort client-side — avoids needing composite index
      all.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      setAcceptedDonations(all);
      setLoadingAccepted(false);
    }, (err) => {
      console.error("Accepted query error:", err);
      setLoadingAccepted(false);
    });
    return () => unsubAccepted();
  }, [userDoc?.uid]);

  const sortDonations = (items: Donation[]) => [...items].sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? a.createdAtMillis ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? b.createdAtMillis ?? 0;
    return bTime - aTime;
  });

  const mergedDonations = mergeById(localDonations, mergeById(pendingDonations, acceptedDonations));
  const displayPending = sortDonations(
    mergedDonations.filter((donation) => donation.status === "pending")
  );
  const displayAccepted = sortDonations(
    mergedDonations.filter((donation) =>
      donation.status === "accepted" && donation.acceptedByNgoId === userDoc?.uid
    )
  );

  const handleAccept = async (donation: Donation) => {
    if (!userDoc || !isNgo) { toast.error("Only NGOs can accept donations"); return; }
    setProcessing(donation.id);
    const now = Date.now();
    updateLocalDonation(donation.id, {
      status: "accepted",
      acceptedByNgoId: userDoc.uid,
      acceptedByNgoName: userDoc.name,
      updatedAtMillis: now,
    });
    upsertLocalDelivery({
      id: donation.id,
      donationId: donation.id,
      donorId: donation.donorId || "",
      donorName: donation.donorName || "",
      ngoId: userDoc.uid,
      ngoName: userDoc.name,
      pickupLocation: donation.location,
      dropLocation: `${userDoc.name} NGO Center`,
      status: "pending",
      volunteerId: null,
      volunteerName: null,
      foodType: donation.foodType,
      quantity: `${donation.quantity} ${donation.unit}`,
      createdAtMillis: now,
      updatedAtMillis: now,
    });
    toast.success("Donation accepted. Volunteers can see the delivery now.");
    setProcessing(null);
    try {
      await updateDoc(doc(db, "donations", donation.id), {
        status: "accepted",
        acceptedByNgoId: userDoc.uid,
        acceptedByNgoName: userDoc.name,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await setDoc(doc(db, "deliveries", donation.id), {
        donationId: donation.id,
        donorId: donation.donorId || "",
        donorName: donation.donorName || "",
        ngoId: userDoc.uid,
        ngoName: userDoc.name,
        pickupLocation: donation.location,
        dropLocation: `${userDoc.name} NGO Center`,
        status: "pending",
        volunteerId: null,
        volunteerName: null,
        foodType: donation.foodType,
        quantity: `${donation.quantity} ${donation.unit}`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Notify the donor
      if (donation.donorId) {
        void sendNotification({
          recipientId: donation.donorId,
          recipientRole: "donor",
          type: "donation_accepted",
          title: "Your donation was accepted! 🎉",
          message: `${userDoc.name} accepted your ${donation.foodType} (${donation.quantity} ${donation.unit}). Volunteers will pick it up shortly.`,
          donationId: donation.id,
        });
      }

      void (async () => {
        try {
          const volSnap = await getDocs(query(collection(db, "users"), where("role", "==", "volunteer")));
          await Promise.allSettled(volSnap.docs.map((vDoc) =>
            sendNotification({
              recipientId: vDoc.id,
              recipientRole: "volunteer",
              type: "delivery_assigned",
              title: "New Delivery Task",
              message: `Pick up ${donation.foodType} from ${donation.location} to ${userDoc.name} NGO Center`,
              donationId: donation.id,
            })
          ));
        } catch (error) {
          console.error("Failed to notify volunteers:", error);
        }
      })();

      console.info("Accepted donation synced to Firebase");
    } catch {
      toast.error("Accepted on this device, but Firebase sync failed. Check Firestore rules/network.");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (donation: Donation) => {
    if (!userDoc || !isNgo) { toast.error("Only NGOs can reject donations"); return; }
    setProcessing(donation.id);
    try {
      await updateDoc(doc(db, "donations", donation.id), { status: "rejected", rejectedAt: serverTimestamp() });

      // Notify the donor
      if (donation.donorId) {
        await sendNotification({
          recipientId: donation.donorId,
          recipientRole: "donor",
          type: "donation_rejected",
          title: "Donation update",
          message: `${userDoc.name} was unable to accept your ${donation.foodType}. It may still be picked up by another NGO.`,
          donationId: donation.id,
        });
      }

      toast.success("Donation marked as rejected");
    } catch {
      toast.error("Failed to reject donation");
    } finally {
      setProcessing(null);
    }
  };

  const DonationCard = ({ donation, index }: { donation: Donation; index: number }) => {
    const urgency = getUrgencyLevel(donation.expiryDate);
    return (
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: { duration: 0.15 } }}
        className={`bg-card border rounded-2xl p-5 cursor-default ${
          urgency === "high" ? "border-orange-200 bg-orange-50/30" : "border-border"
        }`}
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center text-xl flex-shrink-0">
            {getFoodEmoji(donation.foodType)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground">{donation.foodType}</p>
                <span className="text-muted-foreground text-sm">{donation.quantity} {donation.unit}</span>
                {urgency === "high" && (
                  <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 font-medium">
                    <AlertTriangle className="w-3 h-3" /> Urgent
                  </span>
                )}
                <StatusBadge status={donation.status} />
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                {donation.createdAt?.toDate
                  ? formatDistanceToNow(donation.createdAt.toDate(), { addSuffix: true })
                  : donation.createdAtMillis
                    ? formatDistanceToNow(new Date(donation.createdAtMillis), { addSuffix: true })
                  : "Just now"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">by <span className="font-medium text-foreground">{donation.donorName}</span></p>
            <p className="text-sm text-muted-foreground">{donation.location}</p>
            {donation.expiryDate && (
              <p className="text-xs text-amber-700 mt-1 font-medium">Expires: {donation.expiryDate}</p>
            )}
            {donation.notes && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic">{donation.notes}</p>
            )}
          </div>
        </div>

        {donation.status === "pending" && (
          <div className="flex gap-2 mt-4 pl-15">
            {isNgo ? (
              <>
                <Button size="sm" onClick={() => handleAccept(donation)} disabled={processing === donation.id} className="gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {processing === donation.id ? "…" : "Accept"}
                </Button>
                <Button
                  size="sm" variant="outline" onClick={() => handleReject(donation)} disabled={processing === donation.id}
                  className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {processing === donation.id ? "…" : "Reject"}
                </Button>
              </>
            ) : (
              <div className="relative group inline-block">
                <Button size="sm" disabled className="gap-1.5 opacity-50">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept
                </Button>
                <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  Only available for NGOs
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  };

  const stats = [
    { label: "Pending Requests", value: displayPending.length, icon: Clock, bg: "bg-amber-50", iconColor: "text-amber-600", border: "border-l-amber-400" },
    { label: "Accepted", value: displayAccepted.length, icon: CheckCircle2, bg: "bg-green-50", iconColor: "text-green-600", border: "border-l-green-500" },
    { label: "Total Handled", value: displayPending.length + displayAccepted.length, icon: Leaf, bg: "bg-primary/10", iconColor: "text-primary", border: "border-l-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {userDoc && userDoc.role !== "ngo" && <RoleBanner viewing="ngo" actual={userDoc.role} />}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-foreground">NGO Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {userDoc ? `Welcome back, ${userDoc.name}` : "Manage food requests"}
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

        <Tabs defaultValue="pending">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="pending">Pending ({displayPending.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({displayAccepted.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending">
            {loadingPending ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {displayPending.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-foreground mb-1">No pending requests</h3>
                    <p className="text-sm text-muted-foreground">New donations will appear here in real time.</p>
                  </div>
                ) : (
                  displayPending.map((d, i) => <DonationCard key={d.id} donation={d} index={i} />)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accepted">
            {loadingAccepted ? <LoadingSpinner /> : (
              <div className="space-y-3">
                {displayAccepted.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <h3 className="font-medium text-foreground mb-1">No accepted donations yet</h3>
                    <p className="text-sm text-muted-foreground">Donations you accept will appear here.</p>
                  </div>
                ) : (
                  displayAccepted.map((d, i) => <DonationCard key={d.id} donation={d} index={i} />)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
