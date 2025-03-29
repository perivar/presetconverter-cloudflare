import { cn } from "~/lib/utils";

import { LoadingSpinner } from "./LoadingSpinner";

type LoadingIndicatorProps = {
  title?: string;
  size?: "small" | "medium" | "large";
  className?: string;
};

const LoadingIndicator = ({
  title = "Loading ...",
  size = "medium",
  className,
}: LoadingIndicatorProps) => {
  // Map size to heading tags and classes for reuse
  const sizeMapping = {
    small: { tag: "h3" as const, spinner: "size-4", text: "text-sm" },
    medium: { tag: "h2" as const, spinner: "size-6", text: "text-base" },
    large: { tag: "h1" as const, spinner: "size-8", text: "text-lg" },
  };

  const { tag: HeadingTag, spinner, text } = sizeMapping[size];

  return (
    <div className={cn("flex items-center justify-center py-2", className)}>
      <LoadingSpinner className={cn("mr-2", spinner)} />
      <HeadingTag className={cn(text)}>{title}</HeadingTag>
    </div>
  );
};

export default LoadingIndicator;
