import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { queryClient } from "@/lib/queryClient";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Bookmarks from "./pages/Bookmarks";
import Profile from "./pages/Profile";
import Write from "./pages/Write";
import Auth from "./pages/Auth";
import ArticleEditor from "./pages/ArticleEditor";
import AdminDashboard from "./pages/AdminDashboard";
import Article from "./pages/Article";
import Notifications from "./pages/Notifications";
import VIP from "./pages/VIP";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <OfflineIndicator />
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
