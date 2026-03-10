import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, Check, X } from "lucide-react";
import { sanitizeError, validation } from "@/lib/errorHandler";
import { SEOHead } from "@/components/SEOHead";
import { useAuth } from "@/hooks/useAuth";
import nawbaharLogo from "@/assets/nawbahar-logo.png";

type AuthView = "welcome" | "login" | "register";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialView = (searchParams.get("view") as AuthView) || "welcome";
  const [view, setView] = useState<AuthView>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  // Password strength
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-zA-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (password.length >= 12) score++;

    if (score <= 1) return { score: 1, label: "ضعیف", color: "bg-destructive" };
    if (score <= 2) return { score: 2, label: "متوسط", color: "bg-warning" };
    if (score <= 3) return { score: 3, label: "خوب", color: "bg-primary" };
    return { score: 4, label: "قوی", color: "bg-success" };
  }, [password]);

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 8,
    hasLetter: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  }), [password]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: "خوش آمدید! 👋" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const nameError = validation.displayName.validate(displayName);
    if (nameError) {
      toast({ title: "خطا", description: nameError, variant: "destructive" });
      return;
    }

    if (!passwordChecks.minLength || !passwordChecks.hasLetter || !passwordChecks.hasNumber) {
      toast({ title: "خطا", description: "رمز عبور باید حداقل ۸ کاراکتر و شامل حرف و عدد باشد", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "خطا", description: "رمز عبور و تکرار آن مطابقت ندارند", variant: "destructive" });
      return;
    }

    if (!agreedToTerms) {
      toast({ title: "خطا", description: "لطفاً قوانین و مقررات را بپذیرید", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/profile-setup`,
          data: { display_name: displayName.trim() },
        },
      });
      if (error) throw error;
      toast({
        title: "ثبت‌نام موفق ✅",
        description: "لینک تأیید به ایمیل شما ارسال شد. لطفاً ایمیل خود را بررسی کنید.",
      });
    } catch (error: any) {
      toast({ title: "خطا", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGuestBrowse = () => {
    navigate("/");
  };

  // ─── WELCOME VIEW ───
  if (view === "welcome") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead title="خوش آمدید به نوبهار" description="نوبهار فضایی برای نوشتن، اندیشیدن و گفت‌وگو" ogUrl="/auth" noIndex />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm animate-fade-in text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src={nawbaharLogo} alt="نوبهار" className="w-20 h-20" />
            </div>

            <h1 className="text-[28px] font-extrabold text-foreground leading-tight mb-2">
              نوبهار
            </h1>
            <p className="text-[14px] text-primary font-medium mb-4 leading-relaxed" style={{ fontStyle: "italic" }}>
              نوبهار است در آن کوش که خوشدل باشی
            </p>
            <p className="text-[13px] text-muted-foreground/70 leading-[2] mb-10 max-w-[280px] mx-auto">
              نوبهار فضایی برای نوشتن، اندیشیدن و گفت‌وگو است؛
              جایی برای آنان که می‌خواهند بنویسند، بخوانند و در فضای فکری سالم مشارکت کنند.
            </p>

            <div className="space-y-3 mb-6">
              <Button
                onClick={() => setView("login")}
                className="w-full h-12 text-[14px] font-semibold rounded-xl"
              >
                ورود به حساب
              </Button>
              <Button
                onClick={() => setView("register")}
                variant="outline"
                className="w-full h-12 text-[14px] font-semibold rounded-xl"
              >
                ایجاد حساب کاربری
              </Button>
            </div>

            {/* Guest */}
            <button
              onClick={handleGuestBrowse}
              className="text-[12px] text-muted-foreground/50 hover:text-foreground transition-colors"
            >
              استفاده بدون ثبت نام →
            </button>

            <p className="mt-8 text-[10px] text-muted-foreground/30 leading-relaxed">
              با ورود یا ایجاد حساب، شما با قوانین و مقررات نوبهار موافقت می‌کنید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOGIN VIEW ───
  if (view === "login") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead title="ورود" description="ورود به حساب نوبهار" ogUrl="/auth" noIndex />
        <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
        <div className="flex-1 flex items-center justify-center p-5">
          <div className="w-full max-w-sm animate-fade-in">
            <button
              onClick={() => setView("welcome")}
              className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-10 transition-colors"
            >
              <ArrowRight size={18} strokeWidth={1.5} />
              <span className="text-[13px]">بازگشت</span>
            </button>

            <div className="flex items-center gap-3 mb-8">
              <img src={nawbaharLogo} alt="" className="w-10 h-10" />
              <div>
                <h1 className="text-[22px] font-extrabold text-foreground">ورود به نوبهار</h1>
                <p className="text-[12px] text-muted-foreground/50 mt-0.5">به جامعه نوبهار خوش آمدید</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[12px] text-muted-foreground">ایمیل</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[12px] text-muted-foreground">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-9 pl-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                    dir="ltr"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-[14px] font-semibold rounded-lg mt-2" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    صبر کنید...
                  </span>
                ) : "ورود"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setView("register")}
                className="text-[13px] text-muted-foreground hover:text-primary transition-colors"
              >
                حساب ندارید؟ <span className="text-primary font-medium">ثبت‌نام کنید</span>
              </button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/30">
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                رمزگذاری شده
              </span>
              <span>·</span>
              <span>حریم خصوصی محفوظ</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── REGISTER VIEW ───
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="ثبت‌نام" description="ایجاد حساب کاربری در نوبهار" ogUrl="/auth" noIndex />
      <div className="h-1 bg-gradient-to-l from-primary via-accent to-primary/40" />
      <div className="flex-1 flex items-center justify-center p-5">
        <div className="w-full max-w-sm animate-fade-in">
          <button
            onClick={() => setView("welcome")}
            className="flex items-center gap-1.5 text-muted-foreground/45 hover:text-foreground mb-8 transition-colors"
          >
            <ArrowRight size={18} strokeWidth={1.5} />
            <span className="text-[13px]">بازگشت</span>
          </button>

          <div className="flex items-center gap-3 mb-8">
            <img src={nawbaharLogo} alt="" className="w-10 h-10" />
            <div>
              <h1 className="text-[22px] font-extrabold text-foreground">عضویت در نوبهار</h1>
              <p className="text-[12px] text-muted-foreground/50 mt-0.5">حساب جدید بسازید و بپیوندید</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4" noValidate>
            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-[12px] text-muted-foreground">نام نمایشی</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="displayName"
                  type="text"
                  placeholder="نام شما"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="regEmail" className="text-[12px] text-muted-foreground">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="regEmail"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="regPassword" className="text-[12px] text-muted-foreground">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="regPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="حداقل ۸ کاراکتر"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-9 pl-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="space-y-2 pt-1 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 rounded-full transition-colors duration-300 ${
                            i <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground min-w-[30px]">{passwordStrength.label}</span>
                  </div>
                  <div className="space-y-1">
                    {[
                      { check: passwordChecks.minLength, label: "حداقل ۸ کاراکتر" },
                      { check: passwordChecks.hasLetter, label: "شامل حرف" },
                      { check: passwordChecks.hasNumber, label: "شامل عدد" },
                    ].map(({ check, label }) => (
                      <div key={label} className="flex items-center gap-1.5 text-[10px]">
                        {check ? (
                          <Check size={10} className="text-primary" />
                        ) : (
                          <X size={10} className="text-muted-foreground/30" />
                        )}
                        <span className={check ? "text-foreground/60" : "text-muted-foreground/40"}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[12px] text-muted-foreground">تکرار رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="رمز عبور را دوباره وارد کنید"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-9 h-11 bg-muted/30 border-0 rounded-lg text-[13px] focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && (
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    {password === confirmPassword ? (
                      <Check size={16} className="text-primary" />
                    ) : (
                      <X size={16} className="text-destructive" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="terms" className="text-[11.5px] text-muted-foreground/70 leading-relaxed cursor-pointer">
                با{" "}
                <button type="button" onClick={() => navigate("/about")} className="text-primary hover:underline">
                  قوانین و مقررات نوبهار
                </button>
                {" "}موافقم
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 text-[14px] font-semibold rounded-lg mt-2" disabled={loading || !agreedToTerms}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  صبر کنید...
                </span>
              ) : "ایجاد حساب کاربری"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView("login")}
              className="text-[13px] text-muted-foreground hover:text-primary transition-colors"
            >
              حساب دارید؟ <span className="text-primary font-medium">وارد شوید</span>
            </button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-muted-foreground/30">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              رمزگذاری شده
            </span>
            <span>·</span>
            <span>حریم خصوصی محفوظ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
