import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { LoadingSpinner } from "@/components/LoadingSpinner";

import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DonorDashboard from "@/pages/DonorDashboard";
import NGODashboard from "@/pages/NGODashboard";
import VolunteerDashboard from "@/pages/VolunteerDashboard";
import MapPage from "@/pages/MapPage";
import NotFound from "@/pages/not-found";

function AuthRedirect() {
  const { user, userDoc, loading } = useAuth();
  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <LandingPage />;
  if (!userDoc) return <LandingPage />;
  if (userDoc.role === "ngo") return <Redirect to="/ngo-dashboard" />;
  if (userDoc.role === "volunteer") return <Redirect to="/volunteer-dashboard" />;
  return <Redirect to="/donor-dashboard" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthRedirect} />
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/donor-dashboard">
        <ProtectedRoute>
          <DonorDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/ngo-dashboard">
        <ProtectedRoute>
          <NGODashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/volunteer-dashboard">
        <ProtectedRoute>
          <VolunteerDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/map">
        <ProtectedRoute>
          <MapPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(40 71% 89%)",
                border: "1px solid hsl(40 30% 82%)",
                color: "hsl(0 0% 24%)",
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </div>
  );
}

export default App;