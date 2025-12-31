import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <PenTool size={36} className="text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">صدای خود را به اشتراک بگذارید</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-8">
          مقالاتی بنویسید که مهم هستند. به جامعه ما بپیوندید و دیدگاه‌های خود را با مردم افغانستان به اشتراک بگذارید.
        </p>
        <Link to="/auth">
          <Button className="bg-primary text-primary-foreground rounded-full px-8 h-12">
            ورود برای نوشتن
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Write;
