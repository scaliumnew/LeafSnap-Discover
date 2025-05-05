
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import BottomNavigation from "./components/BottomNavigation";
import HomeScreen from "./components/HomeScreen";
import CameraScreen from "./components/CameraScreen";
import ImageConfirmationScreen from "./components/ImageConfirmationScreen";
import ProcessingScreen from "./components/ProcessingScreen";
import ResultsScreen from "./components/ResultsScreen";
import PlantDetailsScreen from "./components/PlantDetailsScreen";
import SearchScreen from "./components/SearchScreen";
import HistoryScreen from "./components/HistoryScreen";
import HelpScreen from "./components/HelpScreen";
import ArticlesScreen from "./components/ArticlesScreen";
import SpeciesScreen from "./components/SpeciesScreen";
import SpeciesDetailsScreen from "./components/SpeciesDetailsScreen";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";

const queryClient = new QueryClient();

// Wrapper component to determine if bottom nav should be shown
const AppLayout = () => {
  const location = useLocation();
  
  const hideNavOnRoutes = [
    '/camera',
    '/confirm-image',
    '/processing',
  ];
  
  const shouldShowNav = !hideNavOnRoutes.includes(location.pathname);
  
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/confirm-image" element={<ImageConfirmationScreen />} />
        <Route path="/processing" element={<ProcessingScreen />} />
        <Route path="/results" element={<ResultsScreen />} />
        <Route path="/plant/:plantId" element={<PlantDetailsScreen />} />
        <Route path="/articles" element={<ArticlesScreen />} />
        <Route path="/search" element={<SearchScreen />} />
        <Route path="/history" element={<HistoryScreen />} />
        <Route path="/help" element={<HelpScreen />} />
        <Route path="/species" element={<SpeciesScreen />} />
        <Route path="/species/:speciesId" element={<SpeciesDetailsScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {shouldShowNav && <BottomNavigation />}
    </>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  useEffect(() => {
    // For development, you might want to set this to false
    const hasSeenSplash = localStorage.getItem("hasSeenSplash");
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      localStorage.setItem("hasSeenSplash", "true");
    }
  }, []);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <AppLayout />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
