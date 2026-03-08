import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

const Write = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/editor");
      }
    });
  }, [navigate]);

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 px-5 text-center animate-fade-in">
        <div className="w-14 h-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-5">
          <PenLine size={24} className="text-muted-foreground/40" />
        </div>
        
        <h2 className="text-lg font-bold mb-2">بنویسید</h2>
        <p className="text-[13px] text-muted-foreground/50 max-w-[240px] mb-6 leading-relaxed">
          دیدگاه‌های خود را با جامعه نوبهار به اشتراک بگذارید
        </p>
        
        <Link to="/auth">
          <Button variant="outline" className="rounded-full px-6 h-9 text-[13px]">
            ورود برای شروع نوشتن
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Write;