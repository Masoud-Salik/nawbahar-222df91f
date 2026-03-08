import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Phone, MessageCircle, Facebook, Linkedin } from "lucide-react";
import { compressProfileImage } from "@/lib/imageCompression";

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentDisplayName: string;
  currentSpecialty: string | null;
  currentBio?: string | null;
  currentAvatarUrl: string | null;
  currentWhatsapp?: string | null;
  currentFacebook?: string | null;
  currentLinkedin?: string | null;
  onUpdate: () => void;
}

export function EditProfileModal({
  open,
  onClose,
  userId,
  currentDisplayName,
  currentSpecialty,
  currentBio,
  currentAvatarUrl,
  currentWhatsapp,
  currentFacebook,
  currentLinkedin,
  onUpdate,
}: EditProfileModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [specialty, setSpecialty] = useState(currentSpecialty || "");
  const [bio, setBio] = useState(currentBio || "");
  const [whatsapp, setWhatsapp] = useState(currentWhatsapp || "");
  const [facebook, setFacebook] = useState(currentFacebook || "");
  const [linkedin, setLinkedin] = useState(currentLinkedin || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "در حال فشرده‌سازی...",
        description: "تصویر در حال بهینه‌سازی است",
      });

      const compressedFile = await compressProfileImage(file);
      
      setAvatarFile(compressedFile);
      setAvatarPreview(URL.createObjectURL(compressedFile));
      
      toast({
        title: "موفق",
        description: `تصویر بهینه شد: ${Math.round(compressedFile.size / 1024)} کیلوبایت`,
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "مشکلی در پردازش تصویر پیش آمد",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      toast({
        title: "خطا",
        description: "نام نمایشی الزامی است",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = currentAvatarUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("article-covers")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("article-covers")
          .getPublicUrl(fileName);

        avatarUrl = urlData.publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          specialty: specialty.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          whatsapp_number: whatsapp.trim() || null,
          facebook_url: facebook.trim() || null,
          linkedin_url: linkedin.trim() || null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "موفق!",
        description: "پروفایل شما به‌روز شد",
      });

      onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "خطا",
        description: error.message || "مشکلی پیش آمد",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ویرایش پروفایل</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-2xl">
                    {displayName?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={20} className="text-white" />
              </div>
            </button>
          </div>

          {/* Display Name */}
          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm">نام نمایشی</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="نام شما"
              className="h-9"
            />
          </div>

          {/* Specialty */}
          <div className="space-y-1.5">
            <Label htmlFor="specialty" className="text-sm">تخصص</Label>
            <Input
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="مثال: نویسنده، پژوهشگر"
              className="h-9"
            />
          </div>

          {/* Social Links */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">لینک‌های اجتماعی (اختیاری)</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={16} className="text-muted-foreground shrink-0" />
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="شماره واتساپ (مثال: 93700000000)"
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Facebook size={16} className="text-muted-foreground shrink-0" />
                <Input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="لینک فیسبوک"
                  className="h-9 text-sm"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Linkedin size={16} className="text-muted-foreground shrink-0" />
                <Input
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="لینک لینکدین"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1 h-9">
            انصراف
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 h-9">
            {loading ? "..." : "ذخیره"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}