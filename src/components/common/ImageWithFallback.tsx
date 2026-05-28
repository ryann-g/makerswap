import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ImageWithFallback({ src, alt, className, containerClassName }: ImageWithFallbackProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      {!loaded && !error && (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-muted animate-pulse", containerClassName)}>
          <Package className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>
      )}
      {error ? (
        <div className={cn("absolute inset-0 flex items-center justify-center bg-muted", containerClassName)}>
          <Package className="h-12 w-12 text-muted-foreground opacity-20" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            !loaded ? "opacity-0" : "opacity-100",
            className
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}
    </>
  );
}
