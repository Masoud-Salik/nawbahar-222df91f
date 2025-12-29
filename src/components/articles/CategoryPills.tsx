import { useState } from "react";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", label: "All" },
  { id: "politics", label: "Politics" },
  { id: "culture", label: "Culture" },
  { id: "science", label: "Science" },
  { id: "health", label: "Health" },
  { id: "economics", label: "Economics" },
  { id: "art", label: "Art" },
  { id: "history", label: "History" },
];

interface CategoryPillsProps {
  onCategoryChange?: (category: string) => void;
}

export function CategoryPills({ onCategoryChange }: CategoryPillsProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  return (
    <div className="sticky top-14 z-30 bg-card/98 backdrop-blur-xl border-b border-border">
      <div className="flex overflow-x-auto hide-scrollbar px-4 py-3 gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={cn(
              "px-4 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all duration-200 border",
              activeCategory === category.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-transparent text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}
