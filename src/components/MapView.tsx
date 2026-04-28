import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const orangeIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface DonationMarker {
  id: string;
  location: string;
  foodType: string;
  donorName: string;
  lat?: number;
  lng?: number;
}

const MUMBAI_FALLBACK_COORDS: [number, number][] = [
  [19.0825, 72.8888],
  [19.0512, 72.9122],
  [19.1200, 72.8500],
  [19.0300, 72.8700],
  [19.0900, 72.9100],
];

function fallbackCoords(id: string, index: number): [number, number] {
  const base = MUMBAI_FALLBACK_COORDS[index % MUMBAI_FALLBACK_COORDS.length];
  const hash = id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const latOffset = ((hash % 9) - 4) * 0.002;
  const lngOffset = (((hash / 9) % 9) - 4) * 0.002;
  return [base[0] + latOffset, base[1] + lngOffset];
}

export function MapView() {
  const [donations, setDonations] = useState<DonationMarker[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "donations"),
      where("status", "in", ["pending", "accepted"])
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d, i) => {
        const data = d.data();
        const coords = data.lat && data.lng
          ? [data.lat, data.lng]
          : fallbackCoords(d.id, i);

        return {
          id: d.id,
          location: data.location || "Mumbai",
          foodType: data.foodType || "Food",
          donorName: data.donorName || "Donor",
          lat: coords[0],
          lng: coords[1],
        };
      });
      setDonations(items);
    }, (e) => {
      console.error("Error loading donation markers", e);
    });

    return () => unsub();
  }, []);

  return (
    <div className="rounded-xl overflow-hidden border border-border shadow-sm h-full">
      <MapContainer
        center={[19.076, 72.8777]}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {donations.map((d) => (
          <Marker key={d.id} position={[d.lat!, d.lng!]} icon={orangeIcon}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-orange-800">{d.foodType}</p>
                <p className="text-gray-600">{d.location}</p>
                <p className="text-gray-500 text-xs">by {d.donorName}</p>
                <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Pickup Point</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
