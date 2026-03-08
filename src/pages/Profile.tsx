import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, Moon, Sun, Type, LogOut, Shield, Settings, CalendarDays, FileText, Award } from "lucide-react";
import { MessageCircle as WhatsApp, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useFollowStats } from "@/hooks/useFollowStats";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { getRelativeTime } from "@/lib/relativeTime";
import { FollowersList } from "@/components/profile/FollowersList";
import { FollowButton } from "@/components/FollowButton";
import { cn, toPersianNumber } from "@/lib/utils";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const { user, signOut } = useAuth();
  const viewingUserId = paramUserId || user?.id;
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  
  const { profile, articles, bookmarks, loading, refetch } = useProfile(viewingUserId);
  const { isAdmin } = useUserRole();
  const { followerCount, followingCount } = useFollowStats(viewingUserId);
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return document.documentElement.classList.contains('dark');
  });
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>(() => {
    return (localStorage.getItem('textSize') as any) || 'base';
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(`text-${textSize}`);
    localStorage.setItem('textSize', textSize);
  }, [textSize]);

  const textSizes = [
    { key: 'sm' as const, label: 'ک', size: 'text-xs' },
    { key: 'base' as const, label: 'م', size: 'text-sm' },
    { key: 'lg' as const, label: 'ب', size: 'text-base' },
    { key: 'xl' as const, label: 'خ', size: 'text-lg' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Not logged in
  if (!user && isOwnProfile) {
    return (
      <AppLayout>
        <div className="p-5 space-y-8 animate-fade-in">
          <div className="flex flex-col items-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
              <span className="text-2xl font-black text-primary-foreground">ن</span>
            </div>
            <h2 className="text-xl font-bold mb-2">به نوبهار خوش آمدید</h2>
            <p className="text-muted-foreground text-sm text-center mb-8 max-w-[260px] leading-relaxed">
              برای ذخیره مقالات، دنبال کردن نویسندگان و نوشتن وارد شوید.
            </p>
            <Link to="/auth">
              <Button className="rounded-full px-8 h-11 btn-press">
                <LogIn size={18} className="ml-2" />
                ورود / ثبت‌نام
              </Button>
            </Link>
          </div>
          
          <SettingsSection
            isDark={isDark}
            setIsDark={setIsDark}
            textSize={textSize}
            setTextSize={setTextSize}
            textSizes={textSizes}
          />
        </div>
      </AppLayout>
    );
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* === Profile Header === */}
        {profile && (
          <div className="px-5 pt-8 pb-2">
            {/* Top row: Avatar + Name + Admin */}
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-[76px] h-[76px] rounded-full object-cover ring-[3px] ring-border"
                  />
                ) : (
                  <div className="w-[76px] h-[76px] rounded-full bg-muted flex items-center justify-center ring-[3px] ring-border">
                    <span className="text-primary font-bold text-[28px]">
                      {profile.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name & Bio */}
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-[19px] font-extrabold text-foreground leading-tight truncate">
                    {profile.display_name}
                  </h1>
                  {isOwnProfile && isAdmin && (
                    <Link 
                      to="/admin" 
                      className="text-muted-foreground hover:text-primary transition-colors"
                      aria-label="پنل مدیریت"
                    >
                      <Shield size={16} strokeWidth={1.5} />
                    </Link>
                  )}
                </div>
                {profile.specialty && (
                  <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {profile.specialty}
                  </p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6 mt-5">
              <div className="text-center">
                <span className="block text-[17px] font-bold text-foreground">{toPersianNumber(articles.length)}</span>
                <span className="text-[11px] text-muted-foreground">مقاله</span>
              </div>
              <button 
                onClick={() => setShowFollowers(true)}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <span className="block text-[17px] font-bold text-foreground">{toPersianNumber(followerCount)}</span>
                <span className="text-[11px] text-muted-foreground">دنبال‌کننده</span>
              </button>
              <button 
                onClick={() => setShowFollowing(true)}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <span className="block text-[17px] font-bold text-foreground">{toPersianNumber(followingCount)}</span>
                <span className="text-[11px] text-muted-foreground">دنبال‌شده</span>
              </button>
            </div>

            {/* Action row */}
            <div className="flex items-center gap-2 mt-5">
              {isOwnProfile ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditModalOpen(true)}
                  className="rounded-full px-6 h-9 text-[13px] font-medium border-border"
                >
                  ویرایش پروفایل
                </Button>
              ) : (
                viewingUserId && <FollowButton userId={viewingUserId} />
              )}

              {/* Social Links inline */}
              {(profile.whatsapp_number || profile.facebook_url || profile.linkedin_url) && (
                <div className="flex items-center gap-0.5 mr-auto">
                  {profile.whatsapp_number && (
                    <a 
                      href={`https://wa.me/${encodeURIComponent(profile.whatsapp_number)}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      aria-label="واتساپ"
                    >
                      <WhatsApp size={17} strokeWidth={1.5} />
                    </a>
                  )}
                  {profile.facebook_url && (
                    <a 
                      href={profile.facebook_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      aria-label="فیسبوک"
                    >
                      <Facebook size={17} strokeWidth={1.5} />
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a 
                      href={profile.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      aria-label="لینکدین"
                    >
                      <Linkedin size={17} strokeWidth={1.5} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* === Tabs === */}
        <Tabs defaultValue="articles" className="w-full mt-2">
          <TabsList className={cn(
            "w-full bg-transparent border-b border-border rounded-none h-auto p-0 sticky top-12 z-20 bg-background grid",
            isOwnProfile ? "grid-cols-3" : "grid-cols-2"
          )}>
            <TabsTrigger 
              value="articles" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground"
            >
              مقالات
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground"
              >
                ذخیره‌شده‌ها
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="about" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 text-[13px] font-semibold text-muted-foreground data-[state=active]:text-foreground"
            >
              درباره
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="mt-0">
            {articles.length === 0 ? (
              <EmptyState 
                emoji="📝" 
                text={isOwnProfile ? "هنوز مقاله‌ای ننوشته‌اید" : "هنوز مقاله‌ای ندارد"} 
              />
            ) : (
              <div>
                {articles.map((article, index) => (
                  <ProfileArticleItem 
                    key={article.id} 
                    article={article}
                    style={{ animationDelay: `${index * 40}ms` }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Saved Tab */}
          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              {bookmarks.length === 0 ? (
                <EmptyState emoji="🔖" text="هنوز مقاله‌ای ذخیره نکرده‌اید" />
              ) : (
                <div>
                  {bookmarks.map((article, index) => (
                    <ProfileArticleItem 
                      key={article.id} 
                      article={article}
                      style={{ animationDelay: `${index * 40}ms` }}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* About Tab */}
          <TabsContent value="about" className="mt-0 px-5 py-6">
            <div className="space-y-5">
              {profile?.specialty && (
                <AboutItem 
                  icon={<FileText size={15} strokeWidth={1.5} />}
                  label="تخصص" 
                  value={profile.specialty} 
                />
              )}
              <AboutItem 
                icon={<CalendarDays size={15} strokeWidth={1.5} />}
                label="عضویت" 
                value={profile?.created_at ? getRelativeTime(profile.created_at) : "نامشخص"} 
              />
              <AboutItem 
                icon={<FileText size={15} strokeWidth={1.5} />}
                label="مقالات منتشرشده" 
                value={`${toPersianNumber(articles.length)} مقاله`} 
              />
              {profile?.reputation_score != null && profile.reputation_score > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">امتیاز اعتبار</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, profile.reputation_score)}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-primary">{toPersianNumber(Math.round(profile.reputation_score))}</span>
                  </div>
                </div>
              )}
              {profile?.trust_score != null && profile.trust_score > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={15} strokeWidth={1.5} className="text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">امتیاز اعتماد</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${profile.trust_score}%` }}
                      />
                    </div>
                    <span className="text-[13px] font-semibold text-primary">{toPersianNumber(profile.trust_score)}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* === Settings & Sign Out === */}
        {isOwnProfile && user && (
          <div className="px-5 py-6 mt-4">
            <Separator className="mb-6" />
            <SettingsSection
              isDark={isDark}
              setIsDark={setIsDark}
              textSize={textSize}
              setTextSize={setTextSize}
              textSizes={textSizes}
            />

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 mt-6 py-3 text-[13px] font-medium text-destructive hover:bg-destructive/5 rounded-xl transition-colors"
            >
              <LogOut size={16} strokeWidth={1.5} />
              خروج از حساب
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {profile && isOwnProfile && user && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userId={user.id}
          currentDisplayName={profile.display_name}
          currentSpecialty={profile.specialty}
          currentAvatarUrl={profile.avatar_url}
          currentWhatsapp={profile.whatsapp_number}
          currentFacebook={profile.facebook_url}
          currentLinkedin={profile.linkedin_url}
          onUpdate={refetch}
        />
      )}

      {viewingUserId && (
        <>
          <FollowersList
            isOpen={showFollowers}
            onClose={() => setShowFollowers(false)}
            userId={viewingUserId}
            type="followers"
          />
          <FollowersList
            isOpen={showFollowing}
            onClose={() => setShowFollowing(false)}
            userId={viewingUserId}
            type="following"
          />
        </>
      )}
    </AppLayout>
  );
};

// --- Sub Components ---

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="text-center py-20 text-muted-foreground text-[13px]">
      <div className="text-2xl mb-3">{emoji}</div>
      {text}
    </div>
  );
}

function AboutItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <span className="text-[12px] text-muted-foreground block">{label}</span>
        <span className="text-[14px] text-foreground font-medium">{value}</span>
      </div>
    </div>
  );
}

function ProfileArticleItem({ 
  article, 
  style 
}: { 
  article: { id: string; title: string; cover_image_url: string | null; created_at: string };
  style?: React.CSSProperties;
}) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="flex gap-3.5 px-5 py-4 hover:bg-muted/20 transition-colors animate-slide-up border-b border-border/40"
      style={style}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground text-[14px] line-clamp-2 leading-[1.7]">{article.title}</h3>
        <p className="text-[11px] text-muted-foreground/50 mt-1.5">
          {getRelativeTime(article.created_at)}
        </p>
      </div>
      {article.cover_image_url && (
        <img 
          src={article.cover_image_url} 
          alt="" 
          className="w-[72px] h-[48px] rounded object-cover shrink-0 bg-muted self-center"
          loading="lazy"
        />
      )}
    </Link>
  );
}

function SettingsSection({
  isDark,
  setIsDark,
  textSize,
  setTextSize,
  textSizes,
}: {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  textSize: 'sm' | 'base' | 'lg' | 'xl';
  setTextSize: (v: 'sm' | 'base' | 'lg' | 'xl') => void;
  textSizes: { key: 'sm' | 'base' | 'lg' | 'xl'; label: string; size: string }[];
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-[13px] font-semibold text-muted-foreground flex items-center gap-2">
        <Settings size={14} strokeWidth={1.5} />
        تنظیمات
      </h3>

      {/* Dark Mode */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark ? <Moon size={16} className="text-muted-foreground" /> : <Sun size={16} className="text-muted-foreground" />}
          <span className="text-[13px] text-foreground">حالت تاریک</span>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative",
            isDark ? 'bg-primary' : 'bg-muted'
          )}
          aria-label={isDark ? "غیرفعال کردن حالت تاریک" : "فعال کردن حالت تاریک"}
        >
          <span
            className={cn(
              "absolute top-0.5 w-5 h-5 rounded-full bg-background shadow-sm transition-all",
              isDark ? 'left-0.5' : 'right-0.5'
            )}
          />
        </button>
      </div>

      {/* Text Size */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <Type size={16} className="text-muted-foreground" />
          <span className="text-[13px] text-foreground">اندازه متن</span>
        </div>
        <div className="flex gap-1.5">
          {textSizes.map((ts) => (
            <button
              key={ts.key}
              onClick={() => setTextSize(ts.key)}
              className={cn(
                "flex-1 py-2 rounded-lg font-medium transition-all duration-200",
                ts.size,
                textSize === ts.key
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {ts.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
