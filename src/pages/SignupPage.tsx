import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["donor", "ngo", "volunteer"]),
});

type SignupForm = z.infer<typeof signupSchema>;

const ROLE_OPTIONS = [
  { value: "donor", label: "Food Donor", desc: "I have surplus food to donate" },
  { value: "ngo", label: "NGO", desc: "We accept and distribute food" },
  { value: "volunteer", label: "Volunteer", desc: "I deliver food to those in need" },
] as const;

export default function SignupPage() {
  const [, navigate] = useLocation();
  const { seedUserDoc } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: "donor" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: SignupForm) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = cred.user.uid;

      const newUserDoc = {
        uid,
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: null,
      };

      // Seed AuthContext instantly — dashboards will see real userDoc right away
      seedUserDoc(newUserDoc);

      // Write to Firestore in background — no await, no delay
      setDoc(doc(db, "users", uid), {
        ...newUserDoc,
        createdAt: serverTimestamp(),
      }).catch(() => {});

      toast.success(`Welcome to ANNADAAN, ${data.name}!`);
      if (data.role === "ngo") navigate("/ngo-dashboard");
      else if (data.role === "volunteer") navigate("/volunteer-dashboard");
      else navigate("/donor-dashboard");

    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") toast.error("Email already in use");
      else if (code === "auth/weak-password") toast.error("Password too weak");
      else toast.error(code || "Signup failed");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 bg-primary p-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-xl text-primary-foreground">ANNADAAN</span>
        </div>
        <div>
          <p className="text-4xl font-bold text-primary-foreground mb-4">
            Choose your role.<br />Create your impact.
          </p>
          <p className="text-primary-foreground/70 text-lg">
            Whether you donate, distribute, or deliver — you're part of the solution.
          </p>
        </div>
        <div className="text-primary-foreground/50 text-sm">Free to join. Immediate impact.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Create account</h1>
          <p className="text-muted-foreground mb-8">Join the food redistribution network</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Label>Full Name</Label>
              <Input {...register("name")} placeholder="Your full name" className="mt-1" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label>Email</Label>
              <Input type="email" {...register("email")} placeholder="you@example.com" className="mt-1" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label>I am a</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {ROLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setValue("role", opt.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      selectedRole === opt.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-11">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account…
                </div>
              ) : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}