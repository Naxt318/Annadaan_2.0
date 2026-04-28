import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection, doc, query, where, onSnapshot,
  getDocs, serverTimestamp, setDoc
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { RoleBanner } from "@/components/RoleBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AIFoodInput } from "@/components/AIFoodInput";
import { AIExpiryPredictor } from "@/components/AIExpiryPredictor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PlusCircle, PackageOpen, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sendNotification } from "@/hooks/useNotifications";
import { mergeById, subscribeLocalDonations, upsertLocalDonation } from "@/lib/localSync";

const donationSchema = z.object({
  foodType: z.string().min(2, "Describe the food"),
  quantity: z.string().min(1, "Enter quantity"),
  unit: z.enum(["kg", "portions", "packets"]),
  expiryDate: z.string().min(1, "Enter expiry date"),
  location: z.string().min(3, "Enter pickup location"),
  notes: z.string().optional(),
});

type DonationForm = z.infer<typeof donationSchema>;

interface Donation {
  id: string;
  donorId?: string;
  donorName?: string;
  foodType: string;
  quantity: string;
  unit: string;
  expiryDate: string;
  location: string;
  status: string;
  notes?: string;
  createdAt: any;
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

function getUrgency(expiryDate: string): { label: string; color: string } | null {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return { label: "Expired", color: "text-red-600 bg-red-50 border-red-200" };
  if (diffDays === 1) return { label: "Expires today", color: "text-orange-600 bg-orange-50 border-orange-200" };
  if (diffDays <= 2) return { label: `${diffDays}d left`, color: "text-amber-600 bg-amber-50 border-amber-200" };
  return null;
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function DonorDashboard() {
  const { userDoc } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [localDonations, setLocalDonations] = useState<Donation[]>([]);
  const [loadingDonations, setLoadingDonations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<DonationForm>({
    resolver: zodResolver(donationSchema),
    defaultValues: { foodType: "", quantity: "", unit: "kg", expiryDate: "", location: "", notes: "" },
  });

  const unit = watch("unit");
  const foodType = watch("foodType");
  const expiryDate = watch("expiryDate");
  const notes = watch("notes");

  useEffect(() => {
    return subscribeLocalDonations((items) => {
      setLocalDonations(items as Donation[]);
    });
  }, []);

  useEffect(() => {
    if (!userDoc?.uid) return;
    // Single-field query — no composite index needed; sort client-side
    const q = query(
      collection(db, "donations"),
      where("donorId", "==", userDoc.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Donation))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setDonations(all);
      setLoadingDonations(false);
    }, (err) => {
      console.error("Donations query error:", err);
      setLoadingDonations(false);
    });
    return () => unsub();
  }, [userDoc?.uid]);

  const displayDonations = mergeById(
    localDonations.filter((donation) => donation.donorId === userDoc?.uid),
    donations
  ).sort((a, b) => {
    const aTime = a.createdAt?.toMillis?.() ?? a.createdAtMillis ?? 0;
    const bTime = b.createdAt?.toMillis?.() ?? b.createdAtMillis ?? 0;
    return bTime - aTime;
  });

  // Fill form from AI Natural Language parser
  const handleAIParsed = (data: {
    foodType: string; quantity: string; unit: "kg" | "portions" | "packets";
    expiryDate: string; location: string; notes: string;
  }) => {
    setValue("foodType", data.foodType);
    setValue("quantity", data.quantity);
    setValue("unit", data.unit);
    setValue("expiryDate", data.expiryDate);
    setValue("location", data.location);
    setValue("notes", data.notes);
    setShowForm(true);
  };

  const onSubmit = (data: DonationForm) => {
    if (!userDoc) return;
    if (userDoc.role !== "donor") { toast.error("Only donors can submit donations"); return; }
    setSubmitting(true);

    const donationRef = doc(collection(db, "donations"));
    const now = Date.now();
    const localDonation = {
      id: donationRef.id,
      donorId: userDoc.uid,
      donorName: userDoc.name,
      foodType: data.foodType,
      quantity: data.quantity,
      unit: data.unit,
      expiryDate: data.expiryDate,
      location: data.location,
      notes: data.notes || "",
      status: "pending",
      createdAt: null,
      createdAtMillis: now,
      updatedAtMillis: now,
    };

    upsertLocalDonation(localDonation);
    toast.success("Donation listed. NGOs can see it now.");
    reset();
    setShowForm(true);
    setSubmitting(false);

    void (async () => {
      try {
        await setDoc(donationRef, {
          donorId: userDoc.uid,
          donorName: userDoc.name,
          foodType: data.foodType,
          quantity: data.quantity,
          unit: data.unit,
          expiryDate: data.expiryDate,
          location: data.location,
          notes: data.notes || "",
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        const ngoSnap = await getDocs(query(collection(db, "users"), where("role", "==", "ngo")));
        await Promise.allSettled(ngoSnap.docs.map((ngoDoc) =>
          sendNotification({
            recipientId: ngoDoc.id,
            recipientRole: "ngo",
            type: "new_donation",
            title: "New Food Donation Available",
            message: `${userDoc.name} listed ${data.quantity} ${data.unit} of ${data.foodType} at ${data.location}`,
            donationId: donationRef.id,
          })
        ));
      } catch (error) {
        console.error("Failed to sync donation:", error);
        toast.error("Donation is saved on this device, but Firebase sync failed. Check Firestore rules/network.");
      }
    })();
  };

  const pending = displayDonations.filter((d) => d.status === "pending").length;
  const accepted = displayDonations.filter((d) => d.status === "accepted").length;
  const isDonor = userDoc?.role === "donor";

  const stats = [
    { label: "Total Listed", value: displayDonations.length, icon: PackageOpen, bg: "bg-primary/10", iconColor: "text-primary", border: "border-l-primary" },
    { label: "Pending", value: pending, icon: Clock, bg: "bg-amber-50", iconColor: "text-amber-600", border: "border-l-amber-400" },
    { label: "Accepted", value: accepted, icon: CheckCircle2, bg: "bg-green-50", iconColor: "text-green-600", border: "border-l-green-500" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {userDoc && userDoc.role !== "donor" && (
          <RoleBanner viewing="donor" actual={userDoc.role} />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold text-foreground">Donor Dashboard</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {userDoc ? `Welcome back, ${userDoc.name}` : "Your food donations"}
            </p>
          </div>
          {isDonor ? (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2 shadow-sm">
              <PlusCircle className="w-4 h-4" />
              {showForm ? "Cancel" : "Add Donation"}
            </Button>
          ) : (
            <div className="relative group">
              <Button disabled className="gap-2 opacity-50">
                <PlusCircle className="w-4 h-4" /> Add Donation
              </Button>
              <div className="absolute right-0 top-full mt-2 px-3 py-1.5 bg-foreground text-background text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                Only available for Donors
              </div>
            </div>
          )}
        </motion.div>

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

        {/* Donation Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-2">List a Donation</h2>

                {/* AI Natural Language Input */}
                {isDonor && (
                  <AIFoodInput onParsed={handleAIParsed} />
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="foodType">Food Type</Label>
                      <Input id="foodType" placeholder="e.g., Rice, Dal, Bread" {...register("foodType")} className="h-10" />
                      {errors.foodType && <p className="text-destructive text-xs">{errors.foodType.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="quantity">Quantity</Label>
                      <div className="flex gap-2">
                        <Input id="quantity" type="number" min="1" placeholder="10" {...register("quantity")} className="h-10 flex-1" />
                        <Select value={unit} onValueChange={(v) => setValue("unit", v as "kg" | "portions" | "packets")}>
                          <SelectTrigger className="w-28 h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="portions">portions</SelectItem>
                            <SelectItem value="packets">packets</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {errors.quantity && <p className="text-destructive text-xs">{errors.quantity.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input id="expiryDate" type="date" {...register("expiryDate")} className="h-10" />
                      {errors.expiryDate && <p className="text-destructive text-xs">{errors.expiryDate.message}</p>}
                      {/* AI Expiry Predictor */}
                      <AIExpiryPredictor
                        foodType={foodType}
                        expiryDate={expiryDate}
                        notes={notes}
                        onSuggestExpiry={(date) => setValue("expiryDate", date)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="location">Pickup Location</Label>
                      <Input id="location" placeholder="e.g., Andheri West, Mumbai" {...register("location")} className="h-10" />
                      {errors.location && <p className="text-destructive text-xs">{errors.location.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" placeholder="Any special handling instructions..." {...register("notes")} className="resize-none" rows={2} />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => { reset(); setShowForm(false); }}>Cancel</Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting…" : "Submit Donation"}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Donation History */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">My Donations</h2>
          </div>
          {loadingDonations ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {displayDonations.length === 0 ? (
                <div className="bg-card border border-border rounded-2xl p-12 text-center">
                  <PackageOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="font-medium text-foreground mb-1">No donations yet</h3>
                  <p className="text-sm text-muted-foreground">
                    {isDonor ? "Click 'Add Donation' to list your first food donation." : "No donations from this account."}
                  </p>
                </div>
              ) : (
                displayDonations.map((d, i) => {
                  const urgency = getUrgency(d.expiryDate);
                  return (
                    <motion.div
                      key={d.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", transition: { duration: 0.15 } }}
                      className="bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4 cursor-default"
                    >
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-background border border-border flex items-center justify-center text-xl flex-shrink-0">
                          {getFoodEmoji(d.foodType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-semibold text-foreground">{d.foodType}</p>
                            <span className="text-muted-foreground text-sm">{d.quantity} {d.unit}</span>
                            <StatusBadge status={d.status} />
                            {urgency && (
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${urgency.color}`}>
                                {urgency.label}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{d.location}</p>
                          {d.notes && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5 italic truncate">{d.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {d.createdAt?.toDate
                          ? formatDistanceToNow(d.createdAt.toDate(), { addSuffix: true })
                          : d.createdAtMillis
                            ? formatDistanceToNow(new Date(d.createdAtMillis), { addSuffix: true })
                          : "Just now"}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
