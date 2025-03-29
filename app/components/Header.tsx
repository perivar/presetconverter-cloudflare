import React from "react";

interface HeaderProps {
  title?: string;
  description?: string;
  leftButtons?: React.ReactNode[];
  rightButtons?: React.ReactNode[];
}

const Header: React.FC<HeaderProps> = ({
  title,
  description,
  leftButtons = [],
  rightButtons = [],
}) => {
  return (
    <div className="mb-4">
      <div className="mb-2 flex w-full flex-col items-center justify-between sm:flex-row">
        {leftButtons.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:mb-0 sm:mr-2 sm:justify-start">
            {leftButtons}
          </div>
        )}

        {/* Title and description */}
        <div
          className={`${leftButtons.length > 0 ? "text-center" : "text-center sm:text-left"} mb-2`}>
          <div className="text-2xl font-semibold">{title}</div>
          {description && (
            <div
              className={`${leftButtons.length > 0 ? "text-center" : "text-center sm:text-left"} text-base text-muted-foreground`}>
              {description}
            </div>
          )}
        </div>

        {rightButtons.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:mb-0 sm:ml-2 sm:justify-end">
            {rightButtons}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
