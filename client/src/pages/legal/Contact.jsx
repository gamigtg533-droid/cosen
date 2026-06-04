import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-stripe-bg">
      <Navbar />
      <div className="flex-grow max-w-3xl mx-auto px-4 py-24 w-full">
        <h1 className="text-4xl font-display font-bold text-stripe-slate mb-6">Contact Us</h1>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stripe-border">
          <p className="text-stripe-muted mb-8 leading-relaxed">
            Have a question, feedback, or need assistance with an order? Our support team is here to help you. Reach out to us via email or phone.
          </p>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-stripe-slate uppercase tracking-wider mb-2">Email Address</h3>
              <a href="mailto:cosen.hub@gmail.com" className="text-lg text-stripe-purple hover:underline font-medium">
                cosen.hub@gmail.com
              </a>
              <p className="text-sm text-stripe-muted mt-1">We aim to respond to all queries within 24 hours.</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-stripe-slate uppercase tracking-wider mb-2">Phone Number</h3>
              <a href="tel:+918155860636" className="text-lg text-stripe-slate hover:text-stripe-purple transition-colors font-medium">
                +91 81558 60636
              </a>
              <p className="text-sm text-stripe-muted mt-1">Available Mon-Fri, 10:00 AM - 6:00 PM (IST).</p>
            </div>
            
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-stripe-slate uppercase tracking-wider mb-2">Office Address</h3>
              <p className="text-lg text-stripe-slate">
                Cosen Hub HQ<br/>
                Gujarat, India
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
