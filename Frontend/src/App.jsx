import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { UserProfileProvider } from "@/context/UserProfileContext";
import { ScanHistoryProvider } from "@/context/ScanHistoryContext";

// Pages
import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HealthProfile from "./pages/HealthProfile";
import Home from "./pages/Home";
import Scanner from "./pages/Scanner";
import ManualEntry from "./pages/ManualEntry";
import History from "./pages/History";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import EmailVerify from "./pages/EmailVerify";
import TestOCR from "./pages/TestOcr";
import ResultsPage from "./pages/ResultsPage";
import Contribute from "./pages/Contribute";

// React Query client (JSX-safe)
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProfileProvider>
        <ScanHistoryProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Splash />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify/:token" element={<EmailVerify />} />
                <Route path="/health-profile" element={<HealthProfile />} />
                <Route path="/home" element={<Home />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/manual-entry" element={<ManualEntry />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/contribute" element={<Contribute />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/test-ocr" element={<TestOCR />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>

          </TooltipProvider>
        </ScanHistoryProvider>
      </UserProfileProvider>
    </QueryClientProvider>
  );
}

export default App;
