export interface Profile {
  id: string;
  display_name: string;
  real_name?: string;
  avatar_url?: string;
  specialty?: string;
  reputation_score: number;
  interests: string[];
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'user' | 'verified_writer' | 'admin';
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  cover_image_url?: string;
  author_id: string;
  tags: string[];
  status: 'pending' | 'published' | 'rejected';
  
  // Editorial scores
  editorial_score_science: number;
  editorial_score_ethics: number;
  editorial_score_writing: number;
  editorial_score_timing: number;
  editorial_score_innovation: number;
  total_feed_rank: number;
  
  // Performance metrics
  read_count: number;
  save_count: number;
  share_count: number;
  
  created_at: string;
  updated_at: string;
  
  // Joined fields
  author?: Profile;
  is_bookmarked?: boolean;
  is_liked?: boolean;
  like_count?: number;
}

export interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  article?: Article;
}

export interface Like {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  article_id: string;
  parent_id?: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
  replies?: Comment[];
}

// Mock data with Persian content
export const mockArticles: Article[] = [
  {
    id: "1",
    title: "آینده هوش مصنوعی در افغانستان",
    content: `چگونه می‌توانیم از تکنولوژی برای بهبود آموزش در مناطق دوردست استفاده کنیم؟ این پرسشی است که ذهن بسیاری از پژوهشگران و متخصصان فناوری را به خود مشغول کرده است.

در سال‌های اخیر، هوش مصنوعی پیشرفت‌های چشمگیری داشته است. از ترجمه خودکار زبان‌ها گرفته تا تشخیص تصاویر و پردازش متن، این فناوری در حال تغییر چهره جهان است.

## فرصت‌ها و چالش‌ها

افغانستان با جمعیت جوان و علاقه‌مند به یادگیری، پتانسیل بالایی برای بهره‌گیری از این فناوری دارد. اما چالش‌هایی مانند زیرساخت‌های ناکافی و کمبود متخصصان، مسیر را دشوار می‌سازد.

> "آینده متعلق به کسانی است که امروز برای آن آماده می‌شوند." — ضرب‌المثل

با سرمایه‌گذاری درست در آموزش و فناوری، می‌توانیم آینده‌ای روشن‌تر برای نسل‌های آینده بسازیم.`,
    cover_image_url: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    author_id: "author1",
    tags: ["تکنولوژی", "هوش مصنوعی", "آموزش"],
    status: "published",
    editorial_score_science: 14,
    editorial_score_ethics: 9,
    editorial_score_writing: 9,
    editorial_score_timing: 8,
    editorial_score_innovation: 5,
    total_feed_rank: 45,
    read_count: 1847,
    save_count: 234,
    share_count: 89,
    created_at: "2024-12-28T10:00:00Z",
    updated_at: "2024-12-28T10:00:00Z",
    author: {
      id: "author1",
      display_name: "دکتر احمدی",
      specialty: "پژوهشگر فناوری",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      reputation_score: 92,
      interests: ["فناوری", "هوش مصنوعی", "آموزش"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "2",
    title: "نگاهی به معماری هرات باستان",
    content: `هرات، شهری با تاریخ چند هزار ساله، گنجینه‌ای از معماری اسلامی و ایرانی است. مسجد جامع هرات، مناره‌ها و قلعه اختیارالدین از شاهکارهای معماری این شهر هستند.

معماری هرات ترکیبی منحصر به فرد از هنر تیموری، صفوی و محلی است. استفاده از کاشی‌های فیروزه‌ای، خط نستعلیق و نقوش هندسی از ویژگی‌های بارز این سبک است.

## میراث فرهنگی

حفاظت از این میراث گران‌بها وظیفه همه ماست. با شناخت بهتر این آثار، می‌توانیم ارزش آن‌ها را به نسل‌های آینده منتقل کنیم.`,
    cover_image_url: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=800",
    author_id: "author2",
    tags: ["معماری", "تاریخ", "هرات"],
    status: "published",
    editorial_score_science: 12,
    editorial_score_ethics: 10,
    editorial_score_writing: 10,
    editorial_score_timing: 7,
    editorial_score_innovation: 4,
    total_feed_rank: 43,
    read_count: 1256,
    save_count: 312,
    share_count: 145,
    created_at: "2024-12-27T15:30:00Z",
    updated_at: "2024-12-27T15:30:00Z",
    author: {
      id: "author2",
      display_name: "استاد کمال",
      specialty: "معمار و تاریخ‌نگار",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      reputation_score: 88,
      interests: ["معماری", "تاریخ", "هنر"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "3",
    title: "طب سنتی و دانش بومی افغانستان",
    content: `قرن‌هاست که حکیمان افغان از گیاهان کوهستان‌های هندوکش برای درمان بیماری‌ها استفاده می‌کنند. امروز، پژوهشگران در حال بررسی علمی این داروها هستند.

ادغام دانش سنتی با روش‌های علمی مدرن، مرز جدیدی در داروسازی ایجاد کرده است. این رویکرد هم میراث فرهنگی را حفظ می‌کند و هم علم پزشکی را پیش می‌برد.`,
    cover_image_url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800",
    author_id: "author3",
    tags: ["سلامت", "طب سنتی", "علم"],
    status: "published",
    editorial_score_science: 15,
    editorial_score_ethics: 10,
    editorial_score_writing: 8,
    editorial_score_timing: 8,
    editorial_score_innovation: 5,
    total_feed_rank: 46,
    read_count: 923,
    save_count: 278,
    share_count: 67,
    created_at: "2024-12-26T09:15:00Z",
    updated_at: "2024-12-26T09:15:00Z",
    author: {
      id: "author3",
      display_name: "دکتر فاطمه نظری",
      specialty: "پژوهشگر پزشکی",
      avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
      reputation_score: 95,
      interests: ["پزشکی", "تحقیقات", "گیاه‌شناسی"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "4",
    title: "هنر خوشنویسی: سنتی زنده",
    content: `در کارگاه‌های آرام کابل و هرات، استادان خوشنویس سنتی هزار ساله را ادامه می‌دهند. کار آن‌ها فراتر از تزیین است—مراقبه، دعا و حفظ فرهنگ در هر ضربه قلم جریان دارد.

هر خط معنا دارد. ضخامت خط، زاویه قلم، فاصله بین حروف—همه در شعر بصری‌ای که فراتر از زبان است نقش دارند.`,
    cover_image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800",
    author_id: "author4",
    tags: ["هنر", "خوشنویسی", "فرهنگ"],
    status: "published",
    editorial_score_science: 8,
    editorial_score_ethics: 9,
    editorial_score_writing: 10,
    editorial_score_timing: 7,
    editorial_score_innovation: 4,
    total_feed_rank: 38,
    read_count: 634,
    save_count: 198,
    share_count: 112,
    created_at: "2024-12-25T14:00:00Z",
    updated_at: "2024-12-25T14:00:00Z",
    author: {
      id: "author4",
      display_name: "استاد رحیمی",
      specialty: "خوشنویس",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      reputation_score: 78,
      interests: ["هنر", "خوشنویسی", "تاریخ"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "5",
    title: "زنان کارآفرین افغان در عصر دیجیتال",
    content: `داستان‌های موفقیت زنان افغان که با استفاده از فناوری، کسب‌وکارهای نوآورانه ایجاد کرده‌اند. از تجارت الکترونیک تا آموزش آنلاین، این زنان الگوی نسل جدید هستند.

با وجود چالش‌های فراوان، این کارآفرینان با پشتکار و خلاقیت، مسیر خود را به سوی موفقیت هموار کرده‌اند.`,
    cover_image_url: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800",
    author_id: "author5",
    tags: ["کارآفرینی", "زنان", "فناوری"],
    status: "published",
    editorial_score_science: 11,
    editorial_score_ethics: 10,
    editorial_score_writing: 9,
    editorial_score_timing: 9,
    editorial_score_innovation: 5,
    total_feed_rank: 44,
    read_count: 1567,
    save_count: 421,
    share_count: 234,
    created_at: "2024-12-24T11:00:00Z",
    updated_at: "2024-12-24T11:00:00Z",
    author: {
      id: "author5",
      display_name: "مریم حسینی",
      specialty: "نویسنده و روزنامه‌نگار",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      reputation_score: 45,
      interests: ["کارآفرینی", "جامعه", "زنان"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
];
