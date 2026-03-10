import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, ArrowRight, Sparkles } from "lucide-react";
import { sanitizeError } from "@/lib/errorHandler";
import { SEOHead } from "@/components/SEOHead";
import appIcon from "@/assets/app-icon.png";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setDone(true);
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <SEOHead title="بازیابی رمز عبور" description="ارسال ایمیل بازیابی رمز" ogUrl="/forgot-password" noIndex />
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ایمیل ارسال شد ✅</h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                لینک بازیابی رمز عبور به <span className="font-medium text-foreground">{email}</span> ارسال شد.<br />
                ایمیل خود را بررسی کنید.
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate("/auth")} className="gap-2">
              <ArrowRight size={16} />
              بازگشت به ورود
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <SEOHead title="فراموشی رمز عبور" description="بازیابی رمز عبور نوبهار" ogUrl="/forgot-password" noIndex />
      
      {/* Top accent line */}
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
      
      <div className="flex-1 flex items-center justify-center p-5">

      <div className="w-full max-w-[380px] animate-fade-in">
        {/* Back */}
        <button
          onClick={() => navigate("/auth")}
          className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground mb-8 transition-colors focus:outline-none rounded-md py-1"
        >
          <ArrowRight size={18} strokeWidth={1.5} />
          <span className="text-[13px] font-medium">بازگشت به ورود</span>
        </button>

        {/* Logo */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 overflow-hidden border border-primary/10">
          <img src={appIcon} alt="نوبهار" className="w-full h-full object-cover" />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-foreground">فراموشی رمز عبور</h1>
          <p className="text-[13.5px] text-muted-foreground/70 mt-2 leading-relaxed">
            ایمیل حساب خود را وارد کنید تا لینک بازیابی برایتان ارسال شود.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-[12px] font-medium text-muted-foreground">ایمیل</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pr-9 h-12 bg-muted/40 border border-border/60 rounded-xl text-[14px] placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                dir="ltr"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-[15px] font-bold rounded-xl mt-2 transition-all duration-200 active:scale-[0.98] shadow-md"
            disabled={loading || !email}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                در حال ارسال...
              </span>
            ) : "ارسال لینک بازیابی"}
          </Button>
        </form>
      </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
