import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/firebase/config";

export type UserRole = "donor" | "ngo" | "volunteer";

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  userDoc: UserDoc | null;
  loading: boolean;
  /** Call this right after signup to seed userDoc instantly — no Firestore wait needed */
  seedUserDoc: (doc: UserDoc) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userDoc: null,
  loading: true,
  seedUserDoc: () => {},
});

// Cache userDoc in memory so navigating between pages is instant
let cachedUserDoc: UserDoc | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(cachedUserDoc);
  // If we have a cached doc already, don't show loading at all
  const [loading, setLoading] = useState(cachedUserDoc === null);
  const unsubDocRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (unsubDocRef.current) {
        unsubDocRef.current();
        unsubDocRef.current = null;
      }

      if (!firebaseUser) {
        cachedUserDoc = null;
        setUserDoc(null);
        setLoading(false);
        return;
      }

      // onSnapshot serves from IndexedDB cache instantly on second visit
      unsubDocRef.current = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        { includeMetadataChanges: false },
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserDoc;
            cachedUserDoc = data;
            setUserDoc(data);
          } else {
            cachedUserDoc = null;
            setUserDoc(null);
          }
          setLoading(false);
        },
        () => {
          setLoading(false);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubDocRef.current) unsubDocRef.current();
    };
  }, []);

  const seedUserDoc = (doc: UserDoc) => {
    cachedUserDoc = doc;
    setUserDoc(doc);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, userDoc, loading, seedUserDoc }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}