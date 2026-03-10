import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { compressProfileImage } from "@/lib/imageCompression";
import { SEOHead } from "@/components/SEOHead";
import nawbaharLogo from "@/assets/nawbahar-logo.png";

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = async () => {
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

      toast({ title: "پروفایل ذخیره شد ✅" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "خطا", description: "مشکلی پیش آمد", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.user_metadata?.display_name || "کاربر";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="تکمیل پروفایل" description="تکمیل پروفایل نوبهار" ogUrl="/profile-setup" noIndex />
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <img src={nawbaharLogo} alt="" className="w-8 h-8" />
            <h1 className="text-[20px] font-extrabold text-foreground">پروفایل خود را تکمیل کنید</h1>
          </div>
          <p className="text-[12px] text-muted-foreground/50 mb-8">
            خوش آمدید {displayName}! اطلاعات زیر اختیاری است و هر زمان قابل تغییر است.
          </p>

          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="relative group">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-2xl">{displayName.charAt(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
              </button>
              <p className="text-[11px] text-muted-foreground/40 mt-2">تصویر پروفایل</p>
            </div>

            {/* Specialty */}
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">تخصص</Label>
              <Input
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="مثال: نویسنده، پژوهشگر، فعال مدنی"
                className="h-10 bg-muted/30 border-0 rounded-lg text-[13px]"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label className="text-[12px] text-muted-foreground">درباره من</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="معرفی کوتاه از خودتان..."
                className="text-[13px] min-h-[80px] resize-none bg-muted/30 border-0 rounded-lg"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={loading} className="flex-1 h-11 text-[14px] font-semibold rounded-lg">
                {loading ? "..." : "ذخیره"}
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="flex-1 h-11 text-[13px] text-muted-foreground">
                بعداً انجام می‌دهم
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
