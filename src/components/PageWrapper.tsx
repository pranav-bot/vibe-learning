import React from "react";
import ThemeToggle from "~/components/ThemeToggle";

interface PageWrapperProps {
  children: React.ReactNode;
  showThemeToggle?: boolean;
  className?: string;
}

export function PageWrapper({ children, showThemeToggle = true, className = "min-h-screen bg-background" }: PageWrapperProps) {
  return (
    <div className={className}>
      {showThemeToggle && (
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}
      {children}
    </div>
  );
}
