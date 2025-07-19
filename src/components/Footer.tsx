import { Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-700 mt-auto">
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="text-xs text-slate-400">
            © 2025 Leafnode. Exploring the future-literate.
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://instagram.com/leafnode.scifi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded p-1"
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