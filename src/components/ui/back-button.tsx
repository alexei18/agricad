// src/components/ui/back-button.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import React from 'react';

interface BackButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  buttonText?: string; // Text opțional pentru buton
}

export function BackButton({ className, variant = "outline", size = "sm", buttonText = "Înapoi" }: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={className}
    >
      <ArrowLeft className={`mr-2 h-4 w-4 ${!buttonText ? 'mr-0' : ''}`} />
      {buttonText && <span>{buttonText}</span>}
    </Button>
  );
}