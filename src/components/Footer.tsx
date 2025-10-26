import { Instagram } from "lucide-react";
import { NewsletterSignup } from "./NewsletterSignup";

const Footer = () => {
  return (
    <footer className="bg-slate-900 mt-auto border-t border-slate-800/50">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 md:items-center">
          {/* Newsletter */}
          <div className="w-full">
            <div className="text-xs font-light text-cyan-400 uppercase tracking-wider mb-2">
              Join the Network
            </div>
            <NewsletterSignup />
            <p className="text-xs text-slate-500 mt-2">
              Weekly transmissions. Curated insights. Stay future-literate.
            </p>
          </div>
          
          {/* Branding & Social */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            <div className="text-xs text-slate-500 order-1 md:order-2">
              © 2025 Leafnode. Exploring the future-literate.
            </div>
            <a
              href="https://instagram.com/leafnode.scifi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1 order-2 md:order-1"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;