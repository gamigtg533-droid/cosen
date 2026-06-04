import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-stripe-border py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-stripe-slate text-xl">Cosen.</span>
            <span className="text-stripe-muted text-sm ml-2">© {new Date().getFullYear()} Cosen Hub. All rights reserved.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium">
            <Link to="/contact" className="text-stripe-muted hover:text-stripe-purple transition-colors">Contact Us</Link>
            <Link to="/privacy" className="text-stripe-muted hover:text-stripe-purple transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-stripe-muted hover:text-stripe-purple transition-colors">Terms &amp; Conditions</Link>
            <Link to="/refund" className="text-stripe-muted hover:text-stripe-purple transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
