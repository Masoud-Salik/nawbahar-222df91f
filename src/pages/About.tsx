import { AppLayout } from "@/components/layout/AppLayout";
import { ArrowRight, Heart, Globe, Shield, Users } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";

const About = () => {
  const navigate = useNavigate();

  return (
    <AppLayout hideNav>
      <SEOHead
        title="درباره نوبهار"
        description="نوبهار فضایی برای اندیشمندان و نویسندگان فارسی‌زبان است. پلتفرم نویسندگی فارسی با تمرکز بر امنیت، جامعه‌محوری و دسترسی آزاد."
        ogUrl="/about"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "نوبهار",
          url: "https://nawbahar.lovable.app",
          description: "پلتفرم نویسندگی فارسی برای نخبگان",
        }}
      />
      <div className="p-4 space-y-6 animate-fade-in max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight size={18} />
          <span className="text-sm">بازگشت</span>
        </button>

        {/* Header */}
        <div className="text-center py-8">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl font-black text-primary">ن</span>
          </div>
          <h1 className="text-3xl font-black text-foreground mb-2">نوبهار</h1>
          <p className="text-muted-foreground">پلتفرم نویسندگی فارسی</p>
        </div>

        {/* Mission */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Heart size={18} className="text-primary" />
            مأموریت ما
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm">
            نوبهار فضایی برای اندیشمندان و نویسندگان فارسی‌زبان است. ما باور داریم که هر صدایی حق شنیده شدن دارد و هر ایده‌ای می‌تواند جهان را تغییر دهد.
          </p>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Shield size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">امنیت و حریم خصوصی</h3>
              <p className="text-xs text-muted-foreground">اطلاعات شما با بالاترین استانداردها محافظت می‌شود</p>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">جامعه‌محور</h3>
              <p className="text-xs text-muted-foreground">ساخته شده توسط جامعه، برای جامعه</p>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Globe size={18} className="text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm mb-1">دسترسی آزاد</h3>
              <p className="text-xs text-muted-foreground">دانش باید برای همه در دسترس باشد</p>
            </div>
          </div>
        </div>

        {/* Install CTA */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 rounded-xl p-5 text-center">
          <h3 className="font-semibold mb-2">اپلیکیشن نوبهار</h3>
          <p className="text-sm text-muted-foreground mb-4">برای تجربه بهتر، اپلیکیشن را نصب کنید</p>
          <Link 
            to="/install"
            className="inline-flex items-center justify-center h-10 px-6 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
          >
            نصب اپلیکیشن
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center py-6 space-y-2">
          <p className="text-xs text-muted-foreground">
            نسخه ۱.۰.۰ بتا
          </p>
          <p className="text-xs text-muted-foreground">
            ساخته شده با ❤️ در افغانستان
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default About;
