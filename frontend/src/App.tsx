import React from "react";
import { Routes, Route } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { LandingPage } from "./pages/LandingPage";
import { JourneyPlannerPage } from "./pages/JourneyPlannerPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { StationDetailPage } from "./pages/StationDetailPage";
import { NetworkStatusPage } from "./pages/NetworkStatusPage";

export const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-brandText selection:bg-primary-light selection:text-primary">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/planner" element={<JourneyPlannerPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/stations/:id" element={<StationDetailPage />} />
          <Route path="/network" element={<NetworkStatusPage />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
