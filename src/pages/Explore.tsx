import { AppLayout } from "@/components/layout/AppLayout";
import { Search, TrendingUp, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

const Explore = () => {
  const trendingTopics = [
    "Afghan Literature",
    "Economic Policy",
    "Health Sciences",
    "Traditional Arts",
    "Modern History",
    "Technology",
  ];

  const featuredWriters = [
    { name: "Dr. Mariam Karimi", specialty: "Literary Scholar", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" },
    { name: "Ahmad Rahimi", specialty: "Economist", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" },
    { name: "Dr. Fatima Nazari", specialty: "Medical Researcher", avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100" },
  ];

  return (
    <AppLayout>
      <div className="p-4 space-y-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search articles, topics, writers..."
            className="pl-12 bg-muted border-0 rounded-xl h-12 text-base"
          />
        </div>

        {/* Trending Topics */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Trending Topics</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <button
                key={topic}
                className="tag-pill"
              >
                {topic}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Writers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" />
            <h2 className="text-lg font-semibold">Featured Writers</h2>
          </div>
          <div className="space-y-3">
            {featuredWriters.map((writer) => (
              <div
                key={writer.name}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border/60"
              >
                <img
                  src={writer.avatar}
                  alt={writer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{writer.name}</p>
                  <p className="text-sm text-muted-foreground">{writer.specialty}</p>
                </div>
                <button className="px-4 py-1.5 text-sm font-medium text-primary border border-primary rounded-full hover:bg-primary/10 transition-colors">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Explore;
