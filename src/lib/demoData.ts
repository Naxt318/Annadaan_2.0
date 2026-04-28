export interface DemoDonation {
  id: string;
  foodType: string;
  quantity: string;
  unit: string;
  location: string;
  donorName: string;
  expiryDate: string;
  status: "pending" | "accepted" | "rejected";
  notes?: string;
  createdAt: null;
  _demoAge: string;
}

export interface DemoDelivery {
  id: string;
  donationId: string;
  foodType: string;
  quantity: string;
  pickupLocation: string;
  dropLocation: string;
  status: "pending" | "picked" | "delivered";
  volunteerId: null;
  volunteerName: null;
  createdAt: null;
  _demoAge: string;
}

export const DEMO_DONATIONS: DemoDonation[] = [
  {
    id: "demo-1",
    foodType: "Dal Makhani & Steamed Rice",
    quantity: "25",
    unit: "portions",
    location: "Andheri West, Mumbai",
    donorName: "Café Mumbaikar",
    expiryDate: "2026-04-15",
    status: "pending",
    notes: "Freshly cooked, available for pickup before 8 PM",
    createdAt: null,
    _demoAge: "8 min ago",
  },
  {
    id: "demo-2",
    foodType: "Bread & Butter Packets",
    quantity: "40",
    unit: "packets",
    location: "Bandra East, Mumbai",
    donorName: "Sunrise Bakery",
    expiryDate: "2026-04-14",
    status: "accepted",
    notes: "Sealed packets, best by today evening",
    createdAt: null,
    _demoAge: "23 min ago",
  },
  {
    id: "demo-3",
    foodType: "Chicken Biryani",
    quantity: "15",
    unit: "portions",
    location: "Kurla West, Mumbai",
    donorName: "Hotel Saffron",
    expiryDate: "2026-04-14",
    status: "pending",
    notes: "Wedding leftover — pick up ASAP",
    createdAt: null,
    _demoAge: "1 hr ago",
  },
  {
    id: "demo-4",
    foodType: "Mix Sabzi, Dal & Chapati",
    quantity: "30",
    unit: "portions",
    location: "Dadar TT Circle, Mumbai",
    donorName: "Tiffin Uncle (Santosh Kamat)",
    expiryDate: "2026-04-15",
    status: "accepted",
    createdAt: null,
    _demoAge: "2 hr ago",
  },
  {
    id: "demo-5",
    foodType: "Assorted Mithai",
    quantity: "8",
    unit: "kg",
    location: "Chembur Colony, Mumbai",
    donorName: "Sweet Corner Sweets",
    expiryDate: "2026-04-18",
    status: "rejected",
    notes: "Diwali excess — sealed boxes",
    createdAt: null,
    _demoAge: "3 hr ago",
  },
];

export const DEMO_DELIVERIES: DemoDelivery[] = [
  {
    id: "ddel-1",
    donationId: "demo-2",
    foodType: "Bread & Butter Packets",
    quantity: "40 packets",
    pickupLocation: "Bandra East, Mumbai",
    dropLocation: "Roti Bank Mumbai — Dharavi Center",
    status: "pending",
    volunteerId: null,
    volunteerName: null,
    createdAt: null,
    _demoAge: "20 min ago",
  },
  {
    id: "ddel-2",
    donationId: "demo-4",
    foodType: "Mix Sabzi, Dal & Chapati",
    quantity: "30 portions",
    pickupLocation: "Dadar TT Circle, Mumbai",
    dropLocation: "Akanksha Foundation, Bandra",
    status: "picked",
    volunteerId: null,
    volunteerName: null,
    createdAt: null,
    _demoAge: "1 hr ago",
  },
  {
    id: "ddel-3",
    donationId: "demo-old-1",
    foodType: "Poha & Chai",
    quantity: "20 portions",
    pickupLocation: "Kandivali East, Mumbai",
    dropLocation: "Annapoorna Seva Trust",
    status: "delivered",
    volunteerId: null,
    volunteerName: null,
    createdAt: null,
    _demoAge: "Yesterday",
  },
];

export const TICKER_EVENTS = [
  { text: "Dal Makhani (25 portions) listed in Andheri West", time: "8m", color: "bg-amber-400" },
  { text: "Bread delivery completed — Roti Bank Mumbai", time: "15m", color: "bg-green-400" },
  { text: "Biryani (15 portions) accepted by Akanksha Foundation", time: "28m", color: "bg-green-400" },
  { text: "New volunteer Aisha joined in Bandra", time: "34m", color: "bg-blue-400" },
  { text: "Mix Sabzi & Chapati picked up from Dadar", time: "42m", color: "bg-primary" },
  { text: "Mithai (8 kg) listed in Chembur Colony", time: "1h", color: "bg-amber-400" },
  { text: "Poha delivery completed — Annapoorna Seva Trust", time: "2h", color: "bg-green-400" },
  { text: "Robin Hood Army accepted 3 donations today", time: "2h", color: "bg-blue-400" },
  { text: "Hotel Saffron donated 15 portions of Biryani", time: "3h", color: "bg-amber-400" },
];
