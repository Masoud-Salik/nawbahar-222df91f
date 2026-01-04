import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, Moon, Sun, Type, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { formatSolarShort } from "@/lib/solarHijri";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { profile, articles, bookmarks, loading, refetch } = useProfile(user?.id);
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');
  const [editModalOpen, setEditModalOpen] = useState(false);

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

  // Not logged in - show sign in card
  if (!user) {
    return (
      <AppLayout>
        <div className="p-4 space-y-8">
          <div className="flex flex-col items-center py-8 px-4 bg-card rounded-2xl border border-border/60">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <span className="text-3xl font-bold text-primary-foreground">ف</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">به فطرت خوش آمدید</h2>
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
          
          {/* Settings for guests */}
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

  return (
    <AppLayout>
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        {profile && (
          <ProfileHeader
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            specialty={profile.specialty}
            reputationScore={profile.reputation_score}
            isOwnProfile={true}
            onEditClick={() => setEditModalOpen(true)}
          />
        )}

        {/* Admin Button */}
        {isAdmin && (
          <Link to="/admin">
            <Button variant="outline" className="w-full gap-2">
              <Shield size={18} />
              پنل مدیریت
            </Button>
          </Link>
        )}

        {/* Tabs: My Articles / Saved */}
        <Tabs defaultValue="articles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="articles">مقالات من</TabsTrigger>
            <TabsTrigger value="saved">ذخیره شده</TabsTrigger>
          </TabsList>

          <TabsContent value="articles" className="mt-4 space-y-3">
            {articles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز مقاله‌ای ننوشته‌اید
              </div>
            ) : (
              articles.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-4 space-y-3">
            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                هنوز مقاله‌ای ذخیره نکرده‌اید
              </div>
            ) : (
              bookmarks.map((article) => (
                <ArticleListItem key={article.id} article={article} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Settings */}
        <SettingsSection
          isDark={isDark}
          setIsDark={setIsDark}
          textSize={textSize}
          setTextSize={setTextSize}
          textSizes={textSizes}
        />

        {/* Sign Out */}
        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
        >
          <LogOut size={18} />
          خروج از حساب
        </Button>
      </div>

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userId={user.id}
          currentDisplayName={profile.display_name}
          currentSpecialty={profile.specialty}
          currentAvatarUrl={profile.avatar_url}
          onUpdate={refetch}
        />
      )}
    </AppLayout>
  );
};

// Article List Item Component
function ArticleListItem({ article }: { article: { id: string; title: string; cover_image_url: string | null; created_at: string } }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/60 hover:border-primary/30 transition-colors"
    >
      {article.cover_image_url ? (
        <img
          src={article.cover_image_url}
          alt={article.title}
          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-primary font-semibold text-lg">ف</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground line-clamp-2">{article.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {formatSolarShort(article.created_at)}
        </p>
      </div>
    </Link>
  );
}

// Settings Section Component
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
      <h3 className="text-lg font-semibold">تنظیمات</h3>

      {/* Dark Mode */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/60">
        <div className="flex items-center gap-3">
          {isDark ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
          <span className="font-medium">حالت تاریک</span>
        </div>
        <button
          onClick={() => setIsDark(!isDark)}
          className={`w-12 h-7 rounded-full transition-colors ${isDark ? 'bg-primary' : 'bg-muted'} relative`}
        >
          <span
            className={`absolute top-1 w-5 h-5 rounded-full bg-card shadow transition-transform ${isDark ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {/* Text Size */}
      <div className="p-4 bg-card rounded-xl border border-border/60">
        <div className="flex items-center gap-3 mb-4">
          <Type size={20} className="text-primary" />
          <span className="font-medium">اندازه متن</span>
        </div>
        <div className="flex items-center justify-between bg-muted rounded-lg p-1">
          {textSizes.map((size, index) => (
            <button
              key={size.key}
              onClick={() => setTextSize(size.key)}
              className={`flex-1 py-2 rounded-md transition-colors ${textSize === size.key ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
              style={{ fontSize: `${12 + index * 4}px` }}
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
