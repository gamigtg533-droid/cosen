import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#060D1A] border-t border-white/5 mt-auto" aria-label="Site footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          {/* Brand Column */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <div className="brand-logo-light">
              <BrandLogo size="sm" />
            </div>
            <p className="mt-6 text-[13px] leading-relaxed text-slate-400 max-w-xs">
              India's verified campus freelance marketplace. Hire student talent. Earn while you study.
            </p>
            <div className="mt-6 flex items-center gap-4" aria-label="Social media links">
              <a href="mailto:cosen.hub@gmail.com" aria-label="Email us" className="text-slate-400 hover:text-[#635BFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm">
                <Mail size={18} aria-hidden="true" />
              </a>
              <a href="https://www.instagram.com/cosen.hub?igsh=YmpiOTh4aWlxMjg3" target="_blank" rel="noopener noreferrer" aria-label="Follow us on Instagram" className="text-slate-400 hover:text-[#635BFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://whatsapp.com/channel/0029Va4dI6XKmCPJ1lc5Pa0L" target="_blank" rel="noopener noreferrer" aria-label="Join our WhatsApp channel" className="text-slate-400 hover:text-[#635BFF] transition-colors focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm">
                <MessageCircle size={18} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Links Columns */}
          <nav aria-label="Marketplace links" className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold tracking-[0.1em] text-white uppercase mb-2">Marketplace</h3>
            <Link to="/browse" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Browse Services</Link>
            <Link to="/services/new" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Post a Service</Link>
            <Link to="/signup" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Become a Seller</Link>
            <Link to="/login" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Sign In</Link>
          </nav>

          <nav aria-label="Legal links" className="flex flex-col gap-4">
            <h3 className="text-[11px] font-bold tracking-[0.1em] text-white uppercase mb-2">Legal</h3>
            <Link to="/contact" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Contact Us</Link>
            <Link to="/privacy" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Privacy Policy</Link>
            <Link to="/terms" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Terms &amp; Conditions</Link>
            <Link to="/refund" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">Refund Policy</Link>
          </nav>

          <address className="flex flex-col gap-4 not-italic">
            <h3 className="text-[11px] font-bold tracking-[0.1em] text-white uppercase mb-2">Contact</h3>
            <a href="mailto:cosen.hub@gmail.com" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit">cosen.hub@gmail.com</a>
            <a href="tel:+918155860636" className="text-[13px] font-medium text-slate-400 hover:text-[#635BFF] transition-colors truncate focus-visible:outline-2 focus-visible:outline-[#635BFF] rounded-sm w-fit" style={{ fontVariantNumeric: 'tabular-nums' }}>+91 81558 60636</a>
            <p className="text-[12px] text-slate-500 mt-2">Mon–Fri, 10AM–6PM IST</p>
          </address>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} Cosen Hub. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <span aria-label="love" className="text-pink-500">❤️</span> for campus India
          </p>
        </div>
      </div>
    </footer>
  );
}
