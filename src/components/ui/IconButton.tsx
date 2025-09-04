'use client';

import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  title?: string;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  icon,
  onClick,
  title,
  ariaLabel,
  size = 'md',
  variant = 'default',
  disabled = false,
  className = ''
}: IconButtonProps) {
  const sizeClasses = {
    sm: 'p-1 text-sm',
    md: 'p-2',
    lg: 'p-3 text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600 hover:bg-gray-100',
    primary: 'text-blue-600 hover:bg-blue-100',
    secondary: 'text-purple-600 hover:bg-purple-100',
    danger: 'text-red-600 hover:bg-red-100'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon}
    </button>
  );
}
