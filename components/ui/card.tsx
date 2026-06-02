'use client';
import * as React from 'react';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { darkMode?: boolean }>(
  ({ className, darkMode, ...props }, ref) => (
    <div
      ref={ref}
      className={`rounded-lg border transition-colors duration-200 shadow-sm ${
        darkMode 
          ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
          : "bg-white border-brand-border text-brand-text"
      } ${className || ""}`}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 p-5 ${className || ""}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={`text-sm font-semibold leading-none tracking-tight ${className || ""}`} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement> & { darkMode?: boolean }>(
  ({ className, darkMode, ...props }, ref) => (
    <p
      ref={ref}
      className={`text-xs ${darkMode ? "text-zinc-500" : "text-brand-text-muted"} ${className || ""}`}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`p-5 pt-0 ${className || ""}`} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { darkMode?: boolean }>(
  ({ className, darkMode, ...props }, ref) => (
    <div
      ref={ref}
      className={`flex items-center p-5 pt-0 border-t mt-4 text-xs ${
        darkMode ? "border-zinc-800 text-zinc-500" : "border-gray-100 text-brand-text-muted"
      } ${className || ""}`}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";
