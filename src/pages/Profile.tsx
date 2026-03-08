import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, CalendarDays, FileText, Award, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useFollowStats } from "@/hooks/useFollowStats";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { getRelativeTime } from "@/lib/relativeTime";
import { formatSolarShort } from "@/lib/solarHijri";
import { FollowersList } from "@/components/profile/FollowersList";
import { FollowButton } from "@/components/FollowButton";
import { cn, toPersianNumber } from "@/lib/utils";
import defaultCover from "@/assets/default-cover.jpg";
import type { ProfileArticle } from "@/hooks/useProfile";
import { SEOHead } from "@/components/SEOHead";
import { SuggestedWriters } from "@/components/profile/SuggestedWriters";
import { ProfileReviews } from "@/components/profile/ProfileReviews";
import { MessageCircle as WhatsApp, Facebook, Linkedin } from "lucide-react";

const Profile = () => {
  const { userId: paramUserId } = useParams();
  const { user } = useAuth();
  const viewingUserId = paramUserId || user?.id;
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  
  const { profile, articles, bookmarks, loading, refetch } = useProfile(viewingUserId);
  const { followerCount } = useFollowStats(viewingUserId);
  const navigate = useNavigate();
  
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  

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

          {/* Suggested Writers even for logged-out users */}
          <SuggestedWriters />
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
      <SEOHead
        title={profile?.display_name || "پروفایل"}
        description={profile?.specialty ? `${profile.display_name} - ${profile.specialty}` : `پروفایل ${profile?.display_name || "کاربر"} در نوبهار`}
        ogUrl={`/profile/${viewingUserId}`}
        ogImage={profile?.avatar_url || undefined}
        noIndex={isOwnProfile}
        jsonLd={profile ? {
          "@context": "https://schema.org",
          "@type": "Person",
          name: profile.display_name,
          description: profile.specialty || undefined,
          image: profile.avatar_url || undefined,
          url: `https://nawbahar.lovable.app/profile/${viewingUserId}`,
        } : undefined}
      />
      <div className="max-w-lg mx-auto animate-fade-in">
        {/* === Compact Profile Header === */}
        {profile && (
          <div className="px-5 pt-6 pb-3">
            {/* Row 1: Avatar + Name · Specialty */}
            <div className="flex gap-3.5">
              {/* Avatar + Edit below */}
              <div className="flex flex-col items-center shrink-0">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    className="w-[52px] h-[52px] rounded-full object-cover ring-2 ring-border/50"
                  />
                ) : (
                  <div className="w-[52px] h-[52px] rounded-full bg-muted flex items-center justify-center ring-2 ring-border/50">
                    <span className="text-primary font-bold text-[18px]">
                      {profile.display_name?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name + Stats */}
              <div className="flex-1 min-w-0 pt-0.5">
                <h1 className="text-[15px] font-extrabold text-foreground leading-tight truncate">
                  {profile.display_name}
                  {profile.specialty && (
                    <>
                      <span className="text-muted-foreground/25 mx-1.5 font-normal">·</span>
                      <span className="text-[11.5px] font-normal text-muted-foreground/55">
                        {profile.specialty}
                      </span>
                    </>
                  )}
                </h1>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={() => setShowFollowers(true)}
                    className="text-[11.5px] text-muted-foreground/55 hover:text-foreground transition-colors"
                  >
                    <span className="font-semibold text-foreground/80">{toPersianNumber(followerCount)}</span> دنبال‌کننده
                  </button>
                  <span className="text-[11.5px] text-muted-foreground/55">
                    <span className="font-semibold text-foreground/80">{toPersianNumber(articles.length)}</span> مقاله
                  </span>
                  {!isOwnProfile && viewingUserId && (
                    <div className="mr-auto">
                      <FollowButton userId={viewingUserId} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Third row: Edit + Social — all pills aligned */}
            {(isOwnProfile || profile.whatsapp_number || profile.facebook_url || profile.linkedin_url) && (
              <div className="flex items-center gap-1.5 mt-3">
                {isOwnProfile && (
                  <button
                    onClick={() => setEditModalOpen(true)}
                    className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary bg-primary/5 hover:bg-primary/10 rounded-full px-2.5 py-1 transition-all"
                  >
                    ویرایش پروفایل
                  </button>
                )}
                {profile.whatsapp_number && (
                  <a href={`https://wa.me/${encodeURIComponent(profile.whatsapp_number)}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full px-2.5 py-1 transition-all">
                    <WhatsApp size={11} strokeWidth={1.5} /><span>واتساپ</span>
                  </a>
                )}
                {profile.facebook_url && (
                  <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full px-2.5 py-1 transition-all">
                    <Facebook size={11} strokeWidth={1.5} /><span>فیسبوک</span>
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-muted-foreground/60 hover:text-foreground bg-muted/40 hover:bg-muted/70 rounded-full px-2.5 py-1 transition-all">
                    <Linkedin size={11} strokeWidth={1.5} /><span>لینکدین</span>
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* === Tabs === */}
        <Tabs defaultValue="articles" className="w-full mt-1" dir="rtl">
          <TabsList className="w-full bg-transparent border-b border-border rounded-none h-auto p-0 sticky top-12 z-20 bg-background">
            <div className="flex gap-5 px-5 justify-end">
              <TabsTrigger 
                value="articles" 
                className="rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-[12px] font-semibold text-foreground data-[state=active]:text-foreground px-0"
              >
                مقالات
              </TabsTrigger>
              {isOwnProfile && (
                <TabsTrigger 
                  value="saved" 
                  className="rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-[12px] font-semibold text-foreground data-[state=active]:text-foreground px-0"
                >
                  ذخیره‌شده‌ها
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="about" 
                className="rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-2.5 text-[12px] font-semibold text-foreground data-[state=active]:text-foreground px-0"
              >
                درباره
              </TabsTrigger>
            </div>
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
          <TabsContent value="about" className="mt-0 px-5 py-5">
            <div className="space-y-4">
              {/* Bio */}
              {profile?.bio && (
                <p className="text-[13px] text-foreground/80 leading-[1.9] whitespace-pre-line">
                  {profile.bio}
                </p>
              )}
              {profile?.specialty && (
                <AboutItem 
                  icon={<FileText size={14} strokeWidth={1.5} />}
                  label="تخصص" 
                  value={profile.specialty} 
                />
              )}
              <AboutItem 
                icon={<CalendarDays size={14} strokeWidth={1.5} />}
                label="عضویت" 
                value={profile?.created_at ? getRelativeTime(profile.created_at) : "نامشخص"} 
              />
              <AboutItem 
                icon={<FileText size={14} strokeWidth={1.5} />}
                label="مقالات منتشرشده" 
                value={`${toPersianNumber(articles.length)} مقاله`} 
              />
              {profile?.reputation_score != null && profile.reputation_score > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Award size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    <span className="text-[11.5px] text-muted-foreground">امتیاز اعتبار</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${Math.min(100, profile.reputation_score)}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-primary">{toPersianNumber(Math.round(profile.reputation_score))}</span>
                  </div>
                </div>
              )}
              {profile?.trust_score != null && profile.trust_score > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield size={14} strokeWidth={1.5} className="text-muted-foreground" />
                    <span className="text-[11.5px] text-muted-foreground">امتیاز اعتماد</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${profile.trust_score}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-primary">{toPersianNumber(profile.trust_score)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Reviews */}
            {viewingUserId && (
              <ProfileReviews profileId={viewingUserId} isOwnProfile={isOwnProfile} />
            )}
          </TabsContent>
        </Tabs>

        {/* Suggested Writers */}
        {isOwnProfile && <SuggestedWriters />}
      </div>

      {/* Modals */}
      {profile && isOwnProfile && user && (
        <EditProfileModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          userId={user.id}
          currentDisplayName={profile.display_name}
          currentSpecialty={profile.specialty}
          currentBio={profile.bio}
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
        </>
      )}
    </AppLayout>
  );
};

// --- Sub Components ---

function EmptyState({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground text-[12px]">
      <div className="text-xl mb-2">{emoji}</div>
      {text}
    </div>
  );
}

function AboutItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <span className="text-[11.5px] text-muted-foreground block">{label}</span>
        <span className="text-[13px] text-foreground font-medium">{value}</span>
      </div>
    </div>
  );
}

function ProfileArticleItem({ 
  article, 
  style 
}: { 
  article: ProfileArticle;
  style?: React.CSSProperties;
}) {
  const coverImage = article.cover_image_url || defaultCover;
  const excerpt = article.content.length > 80 
    ? article.content.replace(/<[^>]*>/g, '').slice(0, 80).trim() + "…" 
    : article.content.replace(/<[^>]*>/g, '');

  return (
    <Link
      to={`/article/${article.id}`}
      className="block px-5 pt-3.5 pb-3 hover:bg-muted/20 transition-colors animate-slide-up border-b border-border/30"
      style={style}
    >
      <div className="flex gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-extrabold text-foreground text-[14px] line-clamp-2 leading-[1.75]">
            {article.title}
          </h3>
          <p className="text-[12px] text-muted-foreground/40 leading-[1.7] line-clamp-2 mt-0.5">
            {excerpt}
          </p>
        </div>
        <div className="w-[80px] h-[54px] flex-shrink-0 rounded overflow-hidden bg-muted/15 self-start mt-0.5">
          <img 
            src={coverImage} 
            alt="" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-1.5 text-[10.5px] text-muted-foreground/45">
        <span>{formatSolarShort(article.created_at)}</span>
        {(article.view_count ?? 0) > 0 && (
          <>
            <span className="text-muted-foreground/20">·</span>
            <span>{toPersianNumber(article.view_count ?? 0)} بازدید</span>
          </>
        )}
      </div>
    </Link>
  );
}

export default Profile;
