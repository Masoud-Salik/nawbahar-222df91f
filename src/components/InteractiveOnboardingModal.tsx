import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, User, Briefcase, FileText, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressProfileImage } from "@/lib/imageCompression";
import nawbaharLogo from "@/assets/nawbahar-logo.png";

type OnboardingStep = "welcome" | "avatar" | "specialty" | "bio" | "completion";

interface InteractiveOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InteractiveOnboardingModal: React.FC<InteractiveOnboardingModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.user_metadata?.display_name || "کاربر";

  const steps: OnboardingStep[] = ["welcome", "avatar", "specialty", "bio", "completion"];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressProfileImage(file);
      setAvatarFile(compressed);
      setAvatarPreview(URL.createObjectURL(compressed));
    } catch {
      toast({ title: "خطا", description: "مشکل در پردازش تصویر", variant: "destructive" });
    }
  };

  const handleNext = async () => {
    if (currentStep === "completion") {
      await handleSaveAndComplete();
      return;
    }

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(steps[nextStepIndex]);
    }
  };

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(steps[prevStepIndex]);
    }
  };

  const handleSaveAndComplete = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let avatarUrl: string | null = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}/avatar.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("article-covers")
          .upload(fileName, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("article-covers").getPublicUrl(fileName);
        avatarUrl = urlData.publicUrl;
      }

      const updates: Record<string, any> = {};
      if (bio.trim()) updates.bio = bio.trim();
      if (specialty.trim()) updates.specialty = specialty.trim();
      if (avatarUrl) updates.avatar_url = avatarUrl;

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
        if (error) throw error;
      }

      toast({ title: "پروفایل شما با موفقیت تکمیل شد! 🎉" });
      onClose();
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({ title: "خطا", description: "مشکلی پیش آمد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setCurrentStep("completion");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img src={nawbaharLogo} alt="نوبهار" className="w-16 h-16" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles size={14} className="text-primary-foreground" />
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                خوش آمدید {displayName}! 🌱
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                بیایید پروفایل شما را در چند قدم ساده تکمیل کنیم
                <br />
                این اطلاعات به دیگران کمک می‌کند شما را بهتر بشناسند
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <User size={14} />
              <span>اختیاری و قابل تغییر در هر زمان</span>
            </div>
          </div>
        );

      case "avatar":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera size={20} className="text-primary" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">تصویر پروفایل</h2>
              <p className="text-sm text-muted-foreground">
                چهره شما به پروفایل شخصیت می‌بخشد
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarSelect} 
                className="hidden" 
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="relative group transition-transform hover:scale-105"
              >
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="" 
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" 
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30">
                    <span className="text-primary font-bold text-3xl">{displayName.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </button>
              
              <p className="text-xs text-muted-foreground">
                {avatarPreview ? "برای تغییر کلیک کنید" : "برای انتخاب تصویر کلیک کنید"}
              </p>
            </div>
          </div>
        );

      case "specialty":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Briefcase size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">تخصص شما</h2>
                <p className="text-sm text-muted-foreground">
                  در چه زمینه‌ای فعالیت می‌کنید؟
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">تخصص یا حوزه فعالیت</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="مثال: نویسنده، پژوهشگر، فعال مدنی، مهندس، هنرمند..."
                className="h-12 bg-muted/30 border-0 rounded-xl text-sm"
                dir="rtl"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {["نویسنده", "پژوهشگر", "فعال مدنی", "هنرمند", "مهندس", "معلم"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setSpecialty(suggestion)}
                  className="px-3 py-1.5 text-xs bg-muted/50 hover:bg-primary/10 hover:text-primary rounded-full transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        );

      case "bio":
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText size={20} className="text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">درباره شما</h2>
                <p className="text-sm text-muted-foreground">
                  خودتان را در چند جمله معرفی کنید
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">معرفی کوتاه</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="مثال: علاقه‌مند به ادبیات و فرهنگ ایرانی، فعال در حوزه محیط زیست..."
                className="text-sm min-h-[120px] resize-none bg-muted/30 border-0 rounded-xl"
                maxLength={500}
                dir="rtl"
              />
              <div className="text-xs text-muted-foreground text-left">
                {bio.length}/500
              </div>
            </div>
          </div>
        );

      case "completion":
        return (
          <div className="text-center space-y-6">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                <Sparkles size={28} className="text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-foreground">
                آماده شروع هستید! 🎉
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                پروفایل شما با موفقیت تکمیل شد
                <br />
                حالا می‌توانید به جامعه نوبهار بپیوندید
              </p>
            </div>

            <div className="bg-muted/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <User size={16} />
                <span>{displayName}</span>
              </div>
              {specialty && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Briefcase size={16} />
                  <span>{specialty}</span>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 space-y-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-bold">
              {currentStep === "welcome" && "به نوبهار خوش آمدید"}
              {currentStep === "avatar" && "تصویر پروفایل"}
              {currentStep === "specialty" && "تخصص شما"}
              {currentStep === "bio" && "درباره شما"}
              {currentStep === "completion" && "تکمیل شد!"}
            </DialogTitle>
          </DialogHeader>

          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-4">
            {currentStepIndex > 0 && currentStep !== "completion" && (
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                className="flex-1 h-11 text-sm font-medium rounded-xl"
              >
                <ArrowLeft size={16} className="ml-2" />
                قبلی
              </Button>
            )}

            {currentStep !== "completion" && (
              <Button 
                onClick={handleNext}
                className="flex-1 h-11 text-sm font-medium rounded-xl"
              >
                {currentStep === "welcome" ? "شروع کنیم" : "بعدی"}
                <ArrowRight size={16} className="ml-2" />
              </Button>
            )}

            {currentStep !== "welcome" && currentStep !== "completion" && (
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="px-4 h-11 text-sm text-muted-foreground rounded-xl"
              >
                رد کردن
              </Button>
            )}

            {currentStep === "completion" && (
              <Button 
                onClick={handleSaveAndComplete}
                disabled={loading}
                className="flex-1 h-11 text-sm font-medium rounded-xl"
              >
                {loading ? "..." : "شروع استفاده از نوبهار"}
                <Sparkles size={16} className="ml-2" />
              </Button>
            )}
          </div>

          {/* Skip for later */}
          {currentStep !== "completion" && (
            <div className="text-center">
              <button 
                onClick={() => {
                  onClose();
                  navigate("/", { replace: true });
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                بعداً انجام می‌دهم
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InteractiveOnboardingModal;
