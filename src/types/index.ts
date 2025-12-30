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

// Mock data for demo purposes
export const mockArticles: Article[] = [
  {
    id: "1",
    title: "The Future of Afghan Literature in the Digital Age",
    content: `The intersection of technology and traditional storytelling presents both challenges and opportunities for Afghan writers. As we navigate this new landscape, we must ask ourselves: how do we preserve our rich oral traditions while embracing digital platforms?

The answer lies not in choosing one over the other, but in finding a harmonious balance. Digital platforms offer unprecedented reach, allowing stories from Kabul to resonate in communities across the globe. Yet, the essence of Afghan storytelling—its intimate connection to community, its oral traditions, its rich imagery—must remain at the heart of our work.

## The Digital Revolution

Consider how our grandparents shared stories around evening fires. The flickering flames, the gathered family, the anticipation of a well-told tale. These elements created an atmosphere that digital screens cannot replicate. However, digital platforms offer something equally valuable: accessibility.

> "In the age of information, our stories become bridges between worlds." — Contemporary Afghan Proverb

Today, a young Afghan in diaspora can read poetry from Herat, essays from Kandahar, and short stories from Mazar-i-Sharif—all within the same hour. This connectivity was unimaginable just decades ago.`,
    cover_image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800",
    author_id: "author1",
    tags: ["Literature", "Technology", "Culture"],
    status: "published",
    editorial_score_science: 12,
    editorial_score_ethics: 9,
    editorial_score_writing: 9,
    editorial_score_timing: 8,
    editorial_score_innovation: 4,
    total_feed_rank: 42,
    read_count: 1247,
    save_count: 89,
    share_count: 34,
    created_at: "2024-12-28T10:00:00Z",
    updated_at: "2024-12-28T10:00:00Z",
    author: {
      id: "author1",
      display_name: "دکتر مریم کریمی",
      specialty: "پژوهشگر ادبیات",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      reputation_score: 87,
      interests: ["ادبیات", "فرهنگ", "آموزش"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "2",
    title: "Understanding Economic Resilience in Post-Conflict Regions",
    content: `Economic recovery in post-conflict regions requires more than international aid—it demands a fundamental understanding of local markets, traditional trade networks, and community-based financial systems.

Afghanistan's bazaars have been centers of commerce for millennia. The hawala system, often misunderstood by Western economists, represents one of the world's oldest and most efficient money transfer mechanisms. Understanding these systems is crucial for sustainable development.`,
    cover_image_url: "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=800",
    author_id: "author2",
    tags: ["Economics", "Development", "Policy"],
    status: "published",
    editorial_score_science: 14,
    editorial_score_ethics: 8,
    editorial_score_writing: 8,
    editorial_score_timing: 9,
    editorial_score_innovation: 3,
    total_feed_rank: 42,
    read_count: 892,
    save_count: 156,
    share_count: 67,
    created_at: "2024-12-27T15:30:00Z",
    updated_at: "2024-12-27T15:30:00Z",
    author: {
      id: "author2",
      display_name: "احمد رحیمی",
      specialty: "اقتصاددان",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      reputation_score: 92,
      interests: ["اقتصاد", "سیاست", "توسعه"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
  {
    id: "3",
    title: "Traditional Medicine Meets Modern Science",
    content: `For centuries, Afghan healers have used plants from the Hindu Kush mountains to treat ailments. Today, researchers are validating many of these traditional remedies through rigorous scientific study.

The integration of traditional knowledge with modern research methods represents a new frontier in pharmacology. This approach respects cultural heritage while advancing medical science.`,
    cover_image_url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800",
    author_id: "author3",
    tags: ["Health", "Science", "Tradition"],
    status: "published",
    editorial_score_science: 15,
    editorial_score_ethics: 10,
    editorial_score_writing: 7,
    editorial_score_timing: 7,
    editorial_score_innovation: 5,
    total_feed_rank: 44,
    read_count: 634,
    save_count: 201,
    share_count: 45,
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
    title: "The Art of Calligraphy: A Living Tradition",
    content: `In the quiet studios of Kabul and Herat, master calligraphers continue a tradition that spans over a thousand years. Their work is more than decoration—it is meditation, prayer, and cultural preservation combined.

Each stroke carries meaning. The thickness of the line, the angle of the pen, the space between letters—all contribute to a visual poetry that transcends language.`,
    cover_image_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800",
    author_id: "author4",
    tags: ["Art", "Culture", "History"],
    status: "published",
    editorial_score_science: 8,
    editorial_score_ethics: 9,
    editorial_score_writing: 10,
    editorial_score_timing: 7,
    editorial_score_innovation: 4,
    total_feed_rank: 38,
    read_count: 423,
    save_count: 178,
    share_count: 89,
    created_at: "2024-12-25T14:00:00Z",
    updated_at: "2024-12-25T14:00:00Z",
    author: {
      id: "author4",
      display_name: "استاد کریم",
      specialty: "خوشنویس",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      reputation_score: 88,
      interests: ["هنر", "خوشنویسی", "تاریخ"],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  },
];
