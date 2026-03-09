import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
    if (typeof (window as any).__reportError === "function") (window as any).__reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-lg p-8 text-center">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">Our team has been notified. Please try again or contact support if the problem persists.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Retry
              </button>
              <a
                href="/contact"
                className={cn(
                  "flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-input hover:bg-accent"
                )}
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
