import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'start' | 'end';
  isLoading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/25 focus-visible:ring-primary',
  secondary:
    'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark hover:shadow-md focus-visible:ring-primary',
  ghost:
    'bg-transparent text-text-main-light dark:text-text-main-dark hover:bg-background-light dark:hover:bg-background-dark focus-visible:ring-primary',
  danger:
    'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/25 focus-visible:ring-red-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'text-[14px]',
  md: 'text-[18px]',
  lg: 'text-[20px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'start',
      isLoading = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          group inline-flex items-center justify-center font-bold rounded-lg
          transition-all duration-200 ease-smooth
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:transform-none
          active:scale-[0.98]
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `.trim()}
        {...props}
      >
        {isLoading && (
          <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        )}
        {!isLoading && icon && iconPosition === 'start' && (
          <span
            className={`material-symbols-outlined ${iconSizeClasses[size]} transition-transform duration-200 group-hover:scale-110`}
          >
            {icon}
          </span>
        )}
        {children}
        {!isLoading && icon && iconPosition === 'end' && (
          <span
            className={`material-symbols-outlined ${iconSizeClasses[size]} transition-transform duration-200 group-hover:scale-110`}
          >
            {icon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
