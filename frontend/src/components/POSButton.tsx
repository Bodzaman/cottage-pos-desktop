import React, { useCallback, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from 'utils/cn';

// ─── Color Schemes ───────────────────────────────────────────────────────────

export type POSButtonColorScheme = 'purple' | 'green' | 'amber' | 'teal' | 'red';

const colorSchemes: Record<POSButtonColorScheme, {
  gradient: string;
  borderColor: string;
  glowColor: string;
  hoverGlow: string;
}> = {
  purple: {
    gradient: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
    borderColor: 'rgba(124, 93, 250, 0.3)',
    glowColor: 'rgba(124, 58, 237, 0.3)',
    hoverGlow: 'rgba(124, 58, 237, 0.5)',
  },
  green: {
    gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    hoverGlow: 'rgba(16, 185, 129, 0.5)',
  },
  amber: {
    gradient: 'linear-gradient(135deg, #B45309 0%, #7C3AED 100%)',
    borderColor: 'rgba(180, 83, 9, 0.4)',
    glowColor: 'rgba(180, 83, 9, 0.3)',
    hoverGlow: 'rgba(180, 83, 9, 0.5)',
  },
  teal: {
    gradient: 'linear-gradient(135deg, #0D9488 0%, #7C3AED 100%)',
    borderColor: 'rgba(13, 148, 136, 0.4)',
    glowColor: 'rgba(13, 148, 136, 0.3)',
    hoverGlow: 'rgba(13, 148, 136, 0.5)',
  },
  red: {
    gradient: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    glowColor: 'rgba(239, 68, 68, 0.3)',
    hoverGlow: 'rgba(239, 68, 68, 0.5)',
  },
};

// ─── Props ───────────────────────────────────────────────────────────────────

export type POSButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface POSButtonBaseProps {
  variant: POSButtonVariant;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

interface POSButtonPrimaryProps extends POSButtonBaseProps {
  variant: 'primary';
  colorScheme?: POSButtonColorScheme;
  subtitle?: string;
  hint?: string;
  showChevron?: boolean;
  fullWidth?: boolean;
}

interface POSButtonSecondaryProps extends POSButtonBaseProps {
  variant: 'secondary';
  destructive?: boolean;
}

interface POSButtonTertiaryProps extends POSButtonBaseProps {
  variant: 'tertiary';
  destructive?: boolean;
  iconOnly?: boolean;
}

export type POSButtonProps = POSButtonPrimaryProps | POSButtonSecondaryProps | POSButtonTertiaryProps;

// ─── Component ───────────────────────────────────────────────────────────────

export function POSButton(props: POSButtonProps) {
  const { variant, children, onClick, disabled, className, icon, type = 'button' } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Extract primary variant props (with defaults for when not primary)
  const primaryProps = variant === 'primary' ? props as POSButtonPrimaryProps : null;
  const colorScheme = primaryProps?.colorScheme ?? 'purple';
  const scheme = colorSchemes[colorScheme];

  // IMPORTANT: All hooks must be called unconditionally at the top level
  // These are used by the primary variant but must always be called
  const handlePrimaryMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = `0 8px 32px ${scheme.hoverGlow}, 0 4px 8px rgba(0,0,0,0.2)`;
  }, [disabled, scheme.hoverGlow]);

  const handlePrimaryMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.opacity = '1';
    e.currentTarget.style.boxShadow = `0 6px 20px ${scheme.glowColor}, 0 2px 4px rgba(0,0,0,0.1)`;
  }, [disabled, scheme.glowColor]);

  const handlePrimaryMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(0.97)';
    e.currentTarget.style.opacity = '0.9';
  }, [disabled]);

  const handlePrimaryMouseUp = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.opacity = '1';
  }, [disabled]);

  // ── Primary Variant ──
  if (variant === 'primary') {
    const { subtitle, hint, showChevron = true, fullWidth = false } = props as POSButtonPrimaryProps;

    return (
      <button
        ref={buttonRef}
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          'group relative overflow-hidden transition-all duration-200',
          fullWidth && 'w-full',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
          disabled && 'cursor-not-allowed',
          className
        )}
        style={{
          background: disabled ? 'rgba(40, 40, 40, 0.8)' : scheme.gradient,
          borderRadius: '8px',
          padding: '14px 16px',
          border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : scheme.borderColor}`,
          boxShadow: disabled ? 'none' : `0 6px 20px ${scheme.glowColor}, 0 2px 4px rgba(0,0,0,0.1)`,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={handlePrimaryMouseEnter}
        onMouseLeave={handlePrimaryMouseLeave}
        onMouseDown={handlePrimaryMouseDown}
        onMouseUp={handlePrimaryMouseUp}
      >
        {/* Shimmer overlay */}
        {!disabled && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
              animation: 'pos-button-shimmer 2s infinite',
            }}
          />
        )}

        {/* Button content */}
        <div className="relative z-10 flex items-center gap-3">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <div className={cn('flex flex-col text-left', !icon && !showChevron && 'text-center w-full')}>
            <span className="text-sm font-bold text-white" style={{ textShadow: disabled ? 'none' : '0 1px 2px rgba(0,0,0,0.2)' }}>
              {children}
            </span>
            {subtitle && (
              <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {subtitle}
              </span>
            )}
            {hint && (
              <span className="text-[10px] mt-0.5" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                {hint}
              </span>
            )}
          </div>
          {showChevron && (
            <ChevronRight
              className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ml-auto"
              style={{ color: disabled ? 'rgba(255,255,255,0.3)' : 'rgba(255, 255, 255, 0.6)' }}
            />
          )}
        </div>
      </button>
    );
  }

  // ── Secondary Variant ──
  if (variant === 'secondary') {
    const { destructive } = props as POSButtonSecondaryProps;

    return (
      <button
        ref={buttonRef}
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={cn(
          'relative transition-all duration-150 flex items-center justify-center gap-2',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
          disabled && 'cursor-not-allowed',
          className
        )}
        style={{
          background: destructive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.08)',
          border: `1px solid ${destructive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.15)'}`,
          borderRadius: '8px',
          padding: '10px 16px',
          color: destructive ? '#F87171' : '#FFFFFF',
          fontSize: '14px',
          fontWeight: 500,
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        onMouseEnter={(e) => {
          if (disabled) return;
          if (destructive) {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
          } else {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (disabled) return;
          if (destructive) {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          } else {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
          }
        }}
        onMouseDown={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          if (disabled) return;
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span>{children}</span>
      </button>
    );
  }

  // ── Tertiary Variant ──
  const { destructive, iconOnly } = props as POSButtonTertiaryProps;

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'relative transition-all duration-100 flex items-center justify-center',
        iconOnly ? 'rounded-full' : 'rounded-md gap-1.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-500',
        disabled && 'cursor-not-allowed',
        className
      )}
      style={{
        background: 'transparent',
        border: 'none',
        padding: iconOnly ? '6px' : '6px 12px',
        color: destructive ? 'rgba(248, 113, 113, 0.8)' : 'rgba(255, 255, 255, 0.6)',
        fontSize: '13px',
        fontWeight: 400,
        opacity: disabled ? 0.3 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        minWidth: iconOnly ? '28px' : undefined,
        minHeight: iconOnly ? '28px' : undefined,
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = destructive
          ? 'rgba(239, 68, 68, 0.1)'
          : 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.color = destructive ? '#F87171' : '#FFFFFF';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = destructive
          ? 'rgba(248, 113, 113, 0.8)'
          : 'rgba(255, 255, 255, 0.6)';
      }}
      onMouseDown={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        if (disabled) return;
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {!iconOnly && <span>{children}</span>}
    </button>
  );
}

// ─── Shimmer Animation (injected once) ──────────────────────────────────────

if (typeof document !== 'undefined' && !document.querySelector('style[data-pos-button-shimmer]')) {
  const style = document.createElement('style');
  style.setAttribute('data-pos-button-shimmer', 'true');
  style.textContent = `
    @keyframes pos-button-shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
  `;
  document.head.appendChild(style);
}

export default POSButton;
