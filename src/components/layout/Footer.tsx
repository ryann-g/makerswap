import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t bg-muted/40 py-8 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} MakerSwap. Built for the university ecosystem.
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
        </div>
      </div>
    </footer>
  );
}
