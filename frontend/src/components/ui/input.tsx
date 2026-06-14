import * as React from "react";
import { cn } from "@/lib/utils";
import { Label, type LabelProps } from "@/components/ui/label";

/* ───────────────── Context ───────────────── */

interface InputContextValue {
  error: boolean;
}

const InputContext = React.createContext<InputContextValue>({ error: false });

function useInputContext() {
  return React.useContext(InputContext);
}

/* ───────────────── Root Wrapper ───────────────── */

type InputWrapperProps = React.HTMLAttributes<HTMLDivElement> & {
  error?: boolean;
};

const InputWrapper = React.forwardRef<HTMLDivElement, InputWrapperProps>(
  ({ className, error = false, ...props }, ref) => {
    return (
      <InputContext.Provider value={{ error }}>
        <div
          ref={ref}
          className={cn("w-full space-y-1.5", className)}
          {...props}
        />
      </InputContext.Provider>
    );
  }
);

InputWrapper.displayName = "InputWrapper";

/* ───────────────── Label ───────────────── */

type InputLabelProps = LabelProps;

const InputLabel = React.forwardRef<
  React.ComponentRef<typeof Label>,
  InputLabelProps
>(({ state, ...props }, ref) => {
  const { error } = useInputContext();
  return (
    <Label
      ref={ref}
      state={state ?? (error ? "error" : "default")}
      {...props}
    />
  );
});

InputLabel.displayName = "InputLabel";

/* ───────────────── Hint / Error ───────────────── */

const InputHint = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("mt-1 text-xs text-muted-foreground", className)} {...props} />
);

const InputError = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn("mt-1 text-xs text-destructive", className)}
    {...props}
  />
);

/* ───────────────── Input Field ───────────────── */

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, ...props }, ref) => {
    const ctx = useInputContext();
    const hasError = error ?? ctx.error;

    return (
      <div
        className={cn(
          "group flex h-[42px] w-full items-center gap-2 rounded-lg border bg-card px-3",
          "transition-[border-color,box-shadow,background-color] duration-150",

          // base border
          "border-input/70",

          // focus within (SaaS pro ring)
          "focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15",

          // NO hover visual shift
          "hover:border-input/70 hover:bg-card",

          // error state
          hasError && "border-destructive/60 focus-within:ring-destructive/20"
        )}
      >
        {leftIcon && (
          <span className="text-muted-foreground flex items-center">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          className={cn(
            "h-full w-full bg-transparent text-sm text-foreground",
            "placeholder:text-muted-foreground",
            "outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <span className="text-muted-foreground flex items-center">
            {rightIcon}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

/* ───────────────── Export ───────────────── */

export {
  Input,
  InputWrapper,
  InputLabel,
  InputHint,
  InputError,
};
