import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { lazy, Suspense, forwardRef } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import Index from "./pages/Index";

// Lazy load non-critical pages
const Explore = lazy(() => import("./pages/Explore"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Profile = lazy(() => import("./pages/Profile"));
const Write = lazy(() => import("./pages/Write"));
const Auth = lazy(() => import("./pages/Auth"));
const ArticleEditor = lazy(() => import("./pages/ArticleEditor"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Article = lazy(() => import("./pages/Article"));
const Notifications = lazy(() => import("./pages/Notifications"));
const VIP = lazy(() => import("./pages/VIP"));
const About = lazy(() => import("./pages/About"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-background">
      <LoadingScreen />
    </div>
  );
}

const App = forwardRef<HTMLDivElement>(function App(_props, _ref) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineIndicator />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/bookmarks" element={<Bookmarks />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/write" element={<Write />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/editor" element={<ArticleEditor />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/article/:id" element={<Article />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/vip" element={<VIP />} />
              <Route path="/about" element={<About />} />
              <Route path="/install" element={<Install />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
});

export default App;
