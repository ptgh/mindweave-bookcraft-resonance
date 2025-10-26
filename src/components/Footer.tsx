import { Instagram } from "lucide-react";
import { NewsletterSignup } from "./NewsletterSignup";

const Footer = () => {
  return (
    <footer className="bg-slate-900 mt-auto border-t border-slate-800/50">
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Left: Newsletter */}
          <div>
            <div className="text-xs font-light text-cyan-400 uppercase tracking-wider mb-2">
              Join the Network
            </div>
            <NewsletterSignup />
            <p className="text-xs text-slate-500 mt-2">
              Weekly transmissions. Curated insights. Stay future-literate.
            </p>
          </div>
          
          {/* Right: Branding & Social */}
          <div className="flex flex-col md:items-end gap-3">
            <div className="flex items-center gap-4">
              <a
                href="https://instagram.com/leafnode.scifi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-cyan-400 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
            </div>
            <div className="text-xs text-slate-500">
              © 2025 Leafnode. Exploring the future-literate.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;