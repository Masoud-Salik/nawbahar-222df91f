import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, PenLine, Users, TrendingUp, Shield, Sparkles } from "lucide-react";
import { sanitizeError, validation } from "@/lib/errorHandler";
import { SEOHead } from "@/components/SEOHead";
import appIcon from "@/assets/app-icon.png";

const features = [
  { icon: PenLine, label: "بنویسید", desc: "مقالات تخصصی منتشر کنید" },
  { icon: Users, label: "بحث کنید", desc: "با نخبگان گفتگو کنید" },
  { icon: TrendingUp, label: "رشد کنید", desc: "اعتبار علمی بسازید" },
];

const Auth = () => {
  const [step, setStep] = useState<'intro' | 'form'>('intro');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLogin) {
      const nameError = validation.displayName.validate(displayName);
      if (nameError) {
        toast({ title: "خطا", description: nameError, variant: "destructive" });
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "خوش آمدید! 👋" });
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: displayName.trim() },
          },
        });
        if (error) throw error;
        setDone(true);
      }
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Success state after signup
  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-5">
        <SEOHead title="ثبت‌نام موفق" description="ثبت‌نام در نوبهار" ogUrl="/auth" noIndex />
        <div className="w-full max-w-sm text-center animate-fade-in space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ثبت‌نام موفق ✅</h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              یک ایمیل تأیید برای شما ارسال شد.<br />
              لطفاً ایمیل خود را بررسی و تأیید کنید.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <ArrowRight size={16} />
            بازگشت به صفحه اصلی
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      <SEOHead title={isLogin ? "ورود" : "ثبت‌نام"} description="ورود یا ثبت‌نام در نوبهار" ogUrl="/auth" noIndex />

      {/* Top accent line - only on desktop or form view */}
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left/Top: Hero Section */}
        <div
          className={`relative lg:w-[45%] flex-col justify-center px-6 py-10 lg:py-0 lg:px-14 overflow-hidden ${step === 'intro' ? 'flex min-h-[calc(100dvh-4px)] lg:min-h-0' : 'hidden lg:flex'}`}
          style={{
            background: "linear-gradient(160deg, hsl(var(--primary)) 0%, hsl(var(--persian-green-dark)) 100%)",
          }}
        >
          {/* Background decorative shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, hsl(var(--accent)), transparent 70%)" }} />
            <div className="absolute bottom-10 -left-10 w-40 h-40 rounded-full opacity-8"
              style={{ background: "radial-gradient(circle, hsl(var(--primary-foreground)), transparent 70%)" }} />
          </div>

          <div className="relative z-10 max-w-md mx-auto lg:mx-0 w-full flex-1 flex flex-col justify-center">
            {/* Top Close Button for Mobile (optional, but good for UX to go back to home) */}
            <div className="absolute -top-4 right-0 lg:hidden">
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1.5 text-primary-foreground/60 hover:text-primary-foreground transition-colors focus:outline-none p-2"
                aria-label="بازگشت به صفحه اصلی"
              >
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>

            {/* Logo Mark */}
            <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-8 border border-primary-foreground/10 shadow-xl overflow-hidden mt-8 lg:mt-0">
              <img src={appIcon} alt="نوبهار" className="w-full h-full object-cover" />
            </div>

            <h1 className="text-[32px] lg:text-[36px] font-extrabold text-primary-foreground leading-tight">
              جایی برای<br />اندیشه‌های ناب
            </h1>
            <p className="text-primary-foreground/70 text-[15px] mt-4 leading-relaxed max-w-[280px]">
              نوبهار، جامعه‌ای از نخبگان برای تبادل دانش و ایده‌های نو.
            </p>

            {/* Feature pills */}
            <div className="flex flex-col gap-3 mt-10">
              {features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-primary-foreground/8 backdrop-blur-sm rounded-xl px-4 py-3.5 border border-primary-foreground/6 animate-fade-in"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-foreground/12 flex items-center justify-center flex-shrink-0">
                    <f.icon size={18} className="text-primary-foreground/90" />
                  </div>
                  <div>
                    <span className="text-[13.5px] font-semibold text-primary-foreground">{f.label}</span>
                    <span className="text-[11.5px] text-primary-foreground/60 mr-2">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile Actions (Only visible on mobile intro step) */}
            <div className="mt-auto lg:hidden pt-12 pb-4 flex flex-col gap-3 animate-slide-up" style={{ animationDelay: '450ms' }}>
              <Button 
                onClick={() => { setIsLogin(true); setStep('form'); }} 
                className="w-full bg-white text-primary hover:bg-white/90 h-12 sm:h-14 text-[15px] font-bold rounded-xl shadow-lg"
              >
                ورود به حساب
              </Button>
              <Button 
                onClick={() => { setIsLogin(false); setStep('form'); }} 
                variant="outline"
                className="w-full border-primary-foreground/30 text-white hover:bg-primary-foreground/10 h-12 sm:h-14 text-[15px] font-bold rounded-xl bg-transparent"
              >
                ساخت حساب جدید
              </Button>
            </div>
          </div>
        </div>

        {/* Right/Bottom: Auth Form */}
        <div className={`flex-1 items-center justify-center px-5 py-8 lg:py-0 ${step === 'form' ? 'flex min-h-[calc(100dvh-4px)] lg:min-h-0' : 'hidden lg:flex'}`}>
          <div className="w-full max-w-[380px] animate-fade-in">
            {/* Desktop Back button */}
            <button
              onClick={() => navigate("/")}
              className="hidden lg:flex items-center gap-1.5 text-muted-foreground/40 hover:text-foreground mb-10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1"
              aria-label="بازگشت به صفحه اصلی"
            >
              <ArrowRight size={16} strokeWidth={1.5} />
              <span className="text-[13px]">بازگشت</span>
            </button>

            {/* Mobile Back button to Intro */}
            <button
              onClick={() => setStep('intro')}
              className="flex lg:hidden items-center gap-1.5 text-muted-foreground/60 hover:text-foreground mb-8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md py-1"
              aria-label="بازگشت به منو"
            >
              <ArrowRight size={18} strokeWidth={1.5} />
              <span className="text-[13px] font-medium">بازگشت</span>
            </button>

            {/* Form Header */}
            <div className="mb-8">
              <h2 className="text-[24px] font-bold text-foreground">
                {isLogin ? "ورود به حساب" : "ساخت حساب جدید"}
              </h2>
              <p className="text-[13.5px] text-muted-foreground/70 mt-2 leading-relaxed">
                {isLogin
                  ? "خوش آمدید. ایمیل و رمز عبور خود را وارد کنید."
                  : "در چند ثانیه عضو شوید و شروع به نوشتن کنید."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4" noValidate>
              {!isLogin && (
                <div className="space-y-1.5 animate-slide-down">
                  <label htmlFor="displayName" className="text-[12px] font-medium text-muted-foreground">نام نمایشی</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="نام شما"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pr-9 h-12 bg-muted/40 border border-border/60 rounded-xl text-[14px] placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                      required={!isLogin}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

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
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-[12px] font-medium text-muted-foreground">رمز عبور</label>
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
                    autoComplete={isLogin ? "current-password" : "new-password"}
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

              <Button
                type="submit"
                className="w-full h-12 sm:h-14 text-[15px] font-bold rounded-xl mt-4 transition-all duration-200 active:scale-[0.98] shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    صبر کنید...
                  </span>
                ) : isLogin ? "ورود" : "ثبت‌نام"}
              </Button>
            </form>

            {/* Forgot password */}
            {isLogin && (
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-[13px] text-muted-foreground/60 hover:text-primary transition-colors focus:outline-none"
                >
                  رمز عبور را فراموش کردید؟
                </button>
              </div>
            )}

            {/* Toggle */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-[14px] text-muted-foreground hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-3 py-2"
              >
                {isLogin ? (
                  <>حساب ندارید؟ <span className="text-primary font-bold">ثبت‌نام کنید</span></>
                ) : (
                  <>حساب دارید؟ <span className="text-primary font-bold">وارد شوید</span></>
                )}
              </button>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex items-center justify-center gap-5 text-[11px] text-muted-foreground/40">
              <span className="flex items-center gap-1.5">
                <Shield size={13} />
                رمزگذاری شده
              </span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20"></span>
              <span>بدون تبلیغات</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/20"></span>
              <span>حریم خصوصی</span>
            </div>

            <p className="mt-4 text-center text-[11px] text-muted-foreground/30 leading-relaxed">
              با ورود، با شرایط استفاده و حریم خصوصی موافقت می‌کنید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
