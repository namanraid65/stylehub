"use client";
import { ErrorState } from '@/components/ui/states';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error service in production
    console.error('[StyleHub Error]', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2]">
          <ErrorState
            title="Something went wrong"
            message="An unexpected error occurred. Our team has been notified."
            onRetry={reset}
          />
        </div>
      </body>
    </html>
  );
}
