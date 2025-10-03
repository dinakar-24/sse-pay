import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PhoneInputProps extends Omit<React.ComponentProps<"input">, "type"> {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        <div className="absolute left-3 flex items-center gap-2 pointer-events-none">
          <span className="text-lg">🇮🇳</span>
          <span className="text-sm text-muted-foreground">+91</span>
          <span className="text-muted-foreground">|</span>
        </div>
        <Input
          type="tel"
          className={cn("pl-24", className)}
          value={value}
          onChange={onChange}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);

PhoneInput.displayName = "PhoneInput";

export { PhoneInput };
