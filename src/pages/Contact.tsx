import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEOHead } from "@/components/SEOHead";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Mail, MessageCircle as WhatsApp, Send } from "lucide-react";

const EMAIL = "hafizsalik881@gmail.com";
const WHATSAPP = "0093785853854";

const Contact = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast({ title: "خطا", description: "نام و پیام الزامی است", variant: "destructive" });
      return;
    }
    if (name.trim().length > 100 || message.trim().length > 2000) {
      toast({ title: "خطا", description: "متن بیش از حد طولانی است", variant: "destructive" });
      return;
    }

    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      email: email.trim() || null,
      message: message.trim(),
      user_id: user?.id || null,
    } as any);

    setSending(false);
    if (error) {
      toast({ title: "خطا", description: "مشکلی پیش آمد، دوباره تلاش کنید", variant: "destructive" });
    } else {
      toast({ title: "ارسال شد!", description: "پیام شما با موفقیت ارسال شد" });
      setName(""); setEmail(""); setMessage("");
    }
  };

  return (
    <AppLayout>
      <SEOHead title="ارتباط با ما" description="تماس با تیم نوبهار" ogUrl="/contact" />
      <div className="max-w-lg mx-auto px-5 py-6 animate-fade-in">
        <h1 className="text-[16px] font-extrabold text-foreground mb-1">ارتباط با ما</h1>
        <p className="text-[11.5px] text-muted-foreground/60 mb-5">
          سوال، پیشنهاد یا انتقادی دارید؟ از طریق فرم زیر یا راه‌های ارتباطی با ما در تماس باشید.
        </p>

        {/* Quick links */}
        <div className="flex gap-2 mb-5">
          <a
            href={`mailto:${EMAIL}`}
            className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground/60 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full px-3 py-1.5 transition-all"
          >
            <Mail size={12} strokeWidth={1.5} />
            ایمیل
          </a>
          <a
            href={`https://wa.me/${WHATSAPP.replace(/^00/, "+")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground/60 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full px-3 py-1.5 transition-all"
          >
            <WhatsApp size={12} strokeWidth={1.5} />
            واتساپ
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="نام شما"
            className="h-9 text-[12.5px]"
            maxLength={100}
          />
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ایمیل (اختیاری)"
            type="email"
            className="h-9 text-[12.5px]"
            maxLength={255}
          />
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="پیام شما..."
            className="text-[12.5px] min-h-[100px] resize-none"
            maxLength={2000}
          />
          <Button type="submit" disabled={sending} className="w-full h-9 text-[12px] gap-1.5">
            <Send size={13} />
            {sending ? "در حال ارسال..." : "ارسال پیام"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default Contact;
