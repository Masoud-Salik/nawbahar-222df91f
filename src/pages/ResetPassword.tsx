import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react";
import { sanitizeError } from "@/lib/errorHandler";
import { SEOHead } from "@/components/SEOHead";
import appIcon from "@/assets/app-icon.png";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase sets session from URL hash automatically on recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setValidSession(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "خطا", description: "رمز عبور و تکرار آن یکسان نیستند.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "خطا", description: "رمز عبور باید حداقل ۶ کاراکتر باشد.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => navigate("/"), 2500);
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">رمز عبور تغییر یافت ✅</h1>
              <p className="text-sm text-muted-foreground mt-2">در حال انتقال به صفحه اصلی...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
        <div className="flex-1 flex items-center justify-center p-5">
          <SEOHead title="بازیابی رمز عبور" description="تغییر رمز عبور نوبهار" ogUrl="/reset-password" noIndex />
          <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
            <p className="text-sm text-muted-foreground">در حال بررسی لینک بازیابی...</p>
            <Button variant="outline" onClick={() => navigate("/forgot-password")} className="gap-2">
              <ArrowRight size={16} />
              درخواست لینک جدید
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <SEOHead title="تغییر رمز عبور" description="تغییر رمز عبور نوبهار" ogUrl="/reset-password" noIndex />
      
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
      
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Logo */}
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 overflow-hidden border border-primary/10">
            <img src={appIcon} alt="نوبهار" className="w-full h-full object-cover" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-foreground">تغییر رمز عبور</h1>
            <p className="text-[13.5px] text-muted-foreground/70 mt-2 leading-relaxed">
              رمز عبور جدید خود را وارد کنید.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[12px] font-medium text-muted-foreground">رمز عبور جدید</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 pl-10 h-12 bg-muted/40 border border-border/60 rounded-xl text-[14px] placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  dir="ltr"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors focus:outline-none p-1"
                  aria-label={showPassword ? "مخفی کردن رمز" : "نمایش رمز"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirm" className="text-[12px] font-medium text-muted-foreground">تکرار رمز عبور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                <Input
                  id="confirm"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="pr-9 h-12 bg-muted/40 border border-border/60 rounded-xl text-[14px] placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  dir="ltr"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              {confirm && password !== confirm && (
                <p className="text-[11.5px] text-destructive">رمز عبور و تکرار آن یکسان نیستند.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-[15px] font-bold rounded-xl mt-2 transition-all duration-200 active:scale-[0.98] shadow-md"
              disabled={loading || !password || !confirm}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  در حال ذخیره...
                </span>
              ) : "ذخیره رمز عبور جدید"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
