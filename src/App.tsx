import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { lazy, Suspense, forwardRef, useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";
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
const Contact = lazy(() => import("./pages/Contact"));
const ProfileSetup = lazy(() => import("./pages/ProfileSetup"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageFallback() {
  return (
    <div className="min-h-screen bg-background">
      <LoadingScreen />
    </div>
  );
}

const App = forwardRef<HTMLDivElement>(function App(_props, _ref) {
  const { toast } = useToast();

  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        toast({
          title: "نسخه جدید آماده شد",
          description: "برای دریافت آخرین تغییرات صفحه را بازنشانی کنید.",
          action: (
            <button
              className="text-xs text-primary underline"
              onClick={async () => {
                await updateSW?.();
                window.location.reload();
              }}
            >
              بروزرسانی
            </button>
          ),
        });
      },
      onOfflineReady() {
        toast({
          title: "حالت آفلاین فعال شد",
          description: "این برنامه اکنون بدون اینترنت همچنان کار می‌کند.",
        });
      },
    });

    return () => {
      // nothing to clean up in registerSW return value
    };
  }, [toast]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AnalyticsProvider>
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
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/profile-setup" element={<ProfileSetup />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AnalyticsProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
});

export default App;
