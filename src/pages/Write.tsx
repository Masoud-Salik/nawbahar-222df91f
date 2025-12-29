import { AppLayout } from "@/components/layout/AppLayout";
import { PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Write = () => {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
          <PenTool size={36} className="text-primary" />
        </div>
        <h2 className="text-2xl font-semibold mb-3">Share Your Voice</h2>
        <p className="text-muted-foreground text-sm max-w-xs mb-8">
          Write articles that matter. Join our community of thinkers and share your insights with the Afghan community.
        </p>
        <Link to="/auth">
          <Button className="bg-primary text-primary-foreground rounded-full px-8 h-12">
            Sign In to Write
          </Button>
        </Link>
      </div>
    </AppLayout>
  );
};

export default Write;
