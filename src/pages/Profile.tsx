import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, Moon, Sun, Type, LogOut, Shield } from "lucide-react";
import { MessageCircle as WhatsApp, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { useFollowStats } from "@/hooks/useFollowStats";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { getRelativeTime } from "@/lib/relativeTime";
import { FollowersList } from "@/components/profile/FollowersList";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const { user, signOut } = useAuth();
  const viewingUserId = paramUserId || user?.id;
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  
  const { profile, articles, bookmarks, loading, refetch } = useProfile(viewingUserId);
  const { isAdmin } = useUserRole();
  const { followerCount, followingCount } = useFollowStats(viewingUserId);
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl');
    root.classList.add(`text-${textSize}`);
  }, [textSize]);

  const textSizes = [
    { key: 'sm' as const, label: 'A', size: 'text-sm' },
    { key: 'base' as const, label: 'A', size: 'text-base' },
    { key: 'lg' as const, label: 'A', size: 'text-lg' },
    { key: 'xl' as const, label: 'A', size: 'text-xl' },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Not logged in and viewing own profile
  if (!user && isOwnProfile) {
    return (
      <AppLayout>
        <div className="p-4 space-y-8">
          <div className="flex flex-col items-center py-8 px-4 bg-card rounded-2xl border border-border/60">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-foreground">ن</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">به نوبهار خوش آمدید</h2>
            <p className="text-muted-foreground text-sm text-center mb-6 max-w-xs">
              برای ذخیره مقالات، دنبال کردن نویسندگان و اشتراک‌گذاری صدای خود وارد شوید.
            </p>
            <Link to="/auth">
              <Button className="bg-primary text-primary-foreground rounded-full px-8 h-11">
                <LogIn size={18} className="ml-2" />
                ورود
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const hasSocialLinks = profile?.whatsapp_number || profile?.facebook_url || (profile as any)?.linkedin_url;

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto">
        {/* Medium-inspired Profile Header - Continuous layout */}
        {profile && (
          <div className="px-4 pt-8 pb-4">
            {/* Avatar */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-2xl">
                      {profile.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-foreground">{profile.display_name}</h1>
                  {profile.specialty && (
                    <p className="text-sm text-muted-foreground">{profile.specialty}</p>
                  )}
                </div>
              </div>
              
              {/* Admin icon - only visible to profile owner */}
              {isOwnProfile && isAdmin && (
                <Link to="/admin" className="p-2 text-muted-foreground hover:text-foreground">
                  <Shield size={18} strokeWidth={1.5} />
                </Link>
              )}
            </div>

            {/* Bio - max 2 lines */}
            {profile.specialty && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {profile.specialty}
              </p>
            )}

            {/* Follow Stats */}
            <div className="flex items-center gap-4 mt-4 text-sm">
              <button 
                onClick={() => setShowFollowers(true)}
                className="hover:underline"
              >
                <span className="font-semibold text-foreground">{followerCount}</span>
                <span className="text-muted-foreground mr-1">دنبال‌کننده</span>
              </button>
              <span className="text-muted-foreground">·</span>
              <button 
                onClick={() => setShowFollowing(true)}
                className="hover:underline"
              >
                <span className="font-semibold text-foreground">{followingCount}</span>
                <span className="text-muted-foreground mr-1">دنبال‌شده</span>
              </button>
            </div>

            {/* Social Links - minimal icons */}
            {hasSocialLinks && (
              <div className="flex items-center gap-2 mt-4">
                {profile.whatsapp_number && (
                  <a 
                    href={`https://wa.me/${profile.whatsapp_number}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <WhatsApp size={16} strokeWidth={1.5} />
                  </a>
                )}
                {profile.facebook_url && (
                  <a 
                    href={profile.facebook_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Facebook size={16} strokeWidth={1.5} />
                  </a>
                )}
                {(profile as any)?.linkedin_url && (
                  <a 
                    href={(profile as any).linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Linkedin size={16} strokeWidth={1.5} />
                  </a>
                )}
              </div>
            )}

            {/* Edit Profile Button */}
            {isOwnProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="mt-4 text-sm"
              >
                ویرایش پروفایل
              </Button>
            )}
          </div>
        )}

        {/* Tabs - subtle underline style */}
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className={cn(
            "w-full bg-transparent border-b border-border rounded-none h-auto p-0",
            isOwnProfile ? "grid-cols-3" : "grid-cols-2"
          )}>
            <TabsTrigger 
              value="articles" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              مقالات
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger 
                value="saved" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
              >
                ذخیره‌شده‌ها
              </TabsTrigger>
            )}
            <TabsTrigger 
              value="about" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 text-sm"
            >
              درباره ما
            </TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-0">
            {articles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                هنوز مقاله‌ای ننوشته‌اید
              </div>
            ) : (
              <div className="divide-y divide-border">
                {articles.map((article) => (
                  <ProfileArticleItem key={article.id} article={article} />
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="saved" className="mt-0">
              {bookmarks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  هنوز مقاله‌ای ذخیره نکرده‌اید
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {bookmarks.map((article) => (
                    <ProfileArticleItem key={article.id} article={article} />
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="about" className="mt-0 p-4">
            <div className="space-y-4">
              {profile?.specialty && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">تخصص</h4>
                  <p className="text-sm text-muted-foreground">{profile.specialty}</p>
                </div>
              )}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">تاریخ عضویت</h4>
                <p className="text-sm text-muted-foreground">
                  {profile?.created_at ? getRelativeTime(profile.created_at) : "نامشخص"}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Settings & Sign Out */}
        {isOwnProfile && (
          <div className="p-4 space-y-4 border-t border-border mt-4">
            <SettingsSection
              isDark={isDark}
              setIsDark={setIsDark}
              textSize={textSize}
              setTextSize={setTextSize}
              textSizes={textSizes}
            />

            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground h-10 text-sm"
            >
              <LogOut size={16} />
              خروج از حساب
            </Button>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
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
          currentLinkedin={(profile as any).linkedin_url}
          onUpdate={refetch}
        />
      )}

      {/* Followers List Modal */}
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

// Profile Article Item - Clean, no large images
function ProfileArticleItem({ article }: { article: { id: string; title: string; cover_image_url: string | null; created_at: string } }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="block px-4 py-4 hover:bg-muted/30 transition-colors"
    >
      <h3 className="font-medium text-foreground text-sm line-clamp-2">{article.title}</h3>
      <p className="text-xs text-muted-foreground mt-1">
        {getRelativeTime(article.created_at)}
      </p>
    </Link>
  );
}

// Settings Section
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
    <div className="space-y-3">
      <h3 className="text-base font-semibold">تنظیمات</h3>

      {/* Dark Mode */}
      <div className="flex items-center justify-between p-3 bg-card rounded-xl border border-border/60">
        <div className="flex items-center gap-2">
          {isDark ? <Moon size={18} className="text-primary" /> : <Sun size={18} className="text-primary" />}
          <span className="font-medium text-sm">حالت تاریک</span>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className={`w-11 h-6 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-muted'} relative`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-card shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0.5'}`}
          />
        </button>
      </div>

      {/* Text Size */}
      <div className="p-3 bg-card rounded-xl border border-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Type size={18} className="text-primary" />
          <span className="font-medium text-sm">اندازه متن</span>
        </div>
        <div className="flex items-center justify-between bg-muted rounded-lg p-1">
          {textSizes.map((size, index) => (
            <button
              key={size.key}
              onClick={() => setTextSize(size.key)}
              className={`flex-1 py-1.5 rounded-md transition-colors text-sm ${textSize === size.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              style={{ fontSize: `${11 + index * 3}px` }}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
