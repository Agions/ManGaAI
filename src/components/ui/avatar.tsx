'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { User } from 'lucide-react';
import * as React from 'react';

// Re-export Radix Avatar primitives directly for backward compatibility
export const AvatarImage = AvatarPrimitive.Image;
export const AvatarFallback = AvatarPrimitive.Root;

// ============================================================
// Avatar with size prop (wraps shadcn Avatar)
// ============================================================
interface AntDAvatarProps {
  size?: number | 'small' | 'large' | 'default';
  src?: string;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function AntDAvatar({ size = 'default', src, icon, className, style, children }: AntDAvatarProps) {
  const sizeMap: Record<string, number> = { small: 24, default: 40, large: 64 };
  const pxSize = typeof size === 'number' ? size : sizeMap[size] || 40;

  const rootStyle = { width: pxSize, height: pxSize, ...style };

  if (children) {
    return (
      <AvatarPrimitive.Root style={rootStyle} className={className}>
        <AvatarFallback className="text-sm" style={{ width: pxSize, height: pxSize }}>
          {children}
        </AvatarFallback>
      </AvatarPrimitive.Root>
    );
  }

  if (src) {
    return (
      <AvatarPrimitive.Root style={rootStyle} className={className}>
        <AvatarImage src={src} style={{ width: pxSize, height: pxSize }} />
        <AvatarFallback style={{ width: pxSize, height: pxSize }}>
          {icon || <User />}
        </AvatarFallback>
      </AvatarPrimitive.Root>
    );
  }

  return (
    <AvatarPrimitive.Root style={rootStyle} className={className}>
      <AvatarFallback style={{ width: pxSize, height: pxSize }}>{icon || <User />}</AvatarFallback>
    </AvatarPrimitive.Root>
  );
}

export { AntDAvatar as Avatar, type AntDAvatarProps };
