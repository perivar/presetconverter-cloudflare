import React, { MouseEventHandler } from "react";

import { cn } from "~/lib/utils";

import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export interface ListItemOption<T> {
  key?: string;
  label: string;
  description?: string;
  value: T;
}

interface ListItemProps<T> {
  title: string;
  subtitle?: string;
  onClick?: MouseEventHandler | undefined;
  children?: React.ReactNode;
  className?: string;
  // for select options
  options?: ListItemOption<T>[];
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  placeholder?: string;
}

function ListItem<T>({
  title,
  subtitle,
  onClick,
  children,
  className,
  options,
  onValueChange,
  defaultValue,
  placeholder,
}: ListItemProps<T>) {
  return (
    <div
      className={cn(
        "p-4 border-b border-secondary-foreground transition-colors hover:bg-primary-foreground",
        className
      )}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-secondary-foreground">{subtitle}</p>
          )}
        </div>
        {children}

        {options && onValueChange && (
          <Select onValueChange={onValueChange} defaultValue={defaultValue}>
            <SelectTrigger className="w-fit">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {options.map(o => {
                  return (
                    <SelectItem key={`${o.key}`} value={`${o.value}`}>
                      {`${o.label}`}
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>
        )}

        {!options && onClick && (
          <Button variant="outline" onClick={onClick}>
            {title}
          </Button>
        )}
      </div>
    </div>
  );
}

export default ListItem;
