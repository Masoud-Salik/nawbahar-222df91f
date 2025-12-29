import { AppLayout } from "@/components/layout/AppLayout";
import { LogIn, Moon, Sun, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const Profile = () => {
  const [isDark, setIsDark] = useState(false);
  const [textSize, setTextSize] = useState<'sm' | 'base' | 'lg' | 'xl'>('base');

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

  return (
    <AppLayout>
      <div className="p-4 space-y-8">
        {/* Sign In Card */}
        <div className="flex flex-col items-center py-8 px-4 bg-card rounded-2xl border border-border/60">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-3xl font-bold text-primary-foreground">ف</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Fetrat</h2>
          <p className="text-muted-foreground text-sm text-center mb-6 max-w-xs">
            Sign in to save articles, follow writers, and share your voice.
          </p>
          <Link to="/auth">
            <Button className="bg-primary text-primary-foreground rounded-full px-8 h-11">
              <LogIn size={18} className="mr-2" />
              Sign In
            </Button>
          </Link>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Settings</h3>

          {/* Dark Mode */}
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/60">
            <div className="flex items-center gap-3">
              {isDark ? <Moon size={20} className="text-primary" /> : <Sun size={20} className="text-primary" />}
              <span className="font-medium">Dark Mode</span>
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
              <span className="font-medium">Text Size</span>
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
      </div>
    </AppLayout>
  );
};

export default Profile;
