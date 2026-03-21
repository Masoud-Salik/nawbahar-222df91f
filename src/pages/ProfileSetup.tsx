import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import InteractiveOnboardingModal from "@/components/InteractiveOnboardingModal";
import { SEOHead } from "@/components/SEOHead";
import nawbaharLogo from "@/assets/nawbahar-logo.png";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  // Show onboarding modal when component mounts
  useEffect(() => {
    setShowOnboardingModal(true);
  }, []);

  const displayName = user.user_metadata?.display_name || "کاربر";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="تکمیل پروفایل" description="تکمیل پروفایل نوبهار" ogUrl="/profile-setup" noIndex />
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src={nawbaharLogo} alt="" className="w-8 h-8" />
            <h1 className="text-[20px] font-extrabold text-foreground">در حال آماده سازی...</h1>
          </div>
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
      
      {/* Interactive Onboarding Modal */}
      <InteractiveOnboardingModal 
        isOpen={showOnboardingModal} 
        onClose={() => {
          setShowOnboardingModal(false);
          navigate("/");
        }} 
      />
    </div>
  );
};

export default ProfileSetup;
