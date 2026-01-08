import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-tandoor-platinum p-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-serif font-bold mb-4">Page Not Found</h1>
        <p className="text-tandoor-offwhite mb-8">
          Sorry, we couldn't find the page you were looking for. It might have been moved or deleted.
        </p>
        <div className="space-y-4">
          <Button asChild className="bg-tandoor-charcoal hover:bg-tandoor-black text-tandoor-platinum font-light tracking-wide shadow-lg shadow-black/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(229,229,229,0.1)]">
            <Link to="/">Go to Homepage</Link>
          </Button>
          <Button asChild variant="outline" className="text-tandoor-platinum border-tandoor-platinum hover:bg-tandoor-platinum/5 bg-transparent font-light tracking-wide">
            <Link to="/menu">Browse Menu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
