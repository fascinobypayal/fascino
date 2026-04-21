import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, PackageSearch } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <PackageSearch className="h-16 w-16 text-muted-foreground/50 mb-6" aria-hidden="true" />
      <h1 className="font-serif text-4xl text-foreground mb-2">404</h1>
      <h2 className="font-serif text-xl text-foreground mb-3">Page not found</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 py-3 rounded-lg text-sm uppercase tracking-wider hover:bg-accent/90 transition-colors shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
};

export default NotFound;
