import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-stripe-bg">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto px-4 py-24 w-full">
        <h1 className="text-4xl font-display font-bold text-stripe-slate mb-2">Privacy Policy</h1>
        <p className="text-stripe-muted mb-8 italic">Effective Date: June 2026</p>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stripe-border prose prose-slate max-w-none">
          <p className="mb-6 text-stripe-slate leading-relaxed">
            This Privacy Policy sets out how Cosen ("the Platform") collects, uses, processes, and protects your personal data when you use our website, mobile application, and related peer-to-peer campus services. By accessing or using the Platform, you agree to the collection and use of your data in accordance with this policy.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">1. Information We Collect</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">We collect the following types of information:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li><strong>Personal Identification Information:</strong> Name, university email address (.edu / .ac.in), phone number, and student identity documents (ID card or fee receipt).</li>
            <li><strong>Profile Information:</strong> Bios, skills, department, and profile pictures.</li>
            <li><strong>Transaction Data:</strong> Orders placed, escrow payment statuses, and transaction history. Payment processing is handled by our third-party payment gateway (Razorpay), and we do not store your credit card or bank account credentials.</li>
            <li><strong>Communication Data:</strong> Chat messages, direct messages, and support inquiries.</li>
            <li><strong>Usage Data:</strong> Device information, IP addresses, browser types, and interaction logs with the Platform.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">2. How We Use Your Data</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">Your data is processed for the following purposes:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>To verify your identity and enrollment at a recognized educational institution.</li>
            <li>To facilitate peer-to-peer transactions, escrow payments, and communications.</li>
            <li>To provide customer support and dispute resolution services.</li>
            <li>To monitor, detect, and prevent fraud, abuse, or violations of our Terms &amp; Conditions.</li>
            <li>To improve Platform functionality, safety, and user experience.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">3. Data Sharing and Disclosure</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">We do not sell or rent your personal data to third parties. We may share your data in the following limited circumstances:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li><strong>Other Users:</strong> Profile information, reviews, and necessary transaction details are visible to other verified students on the Platform.</li>
            <li><strong>Service Providers:</strong> We share data with trusted third-party providers (e.g., Razorpay for payments, Cloudinary for image storage, Brevo for email delivery) under strict confidentiality agreements.</li>
            <li><strong>Legal Obligations:</strong> We may disclose your information if required to do so by law, court order, or governmental request in accordance with the Information Technology Act, 2000 and associated rules.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">4. Data Security</h2>
          <p className="mb-6 text-stripe-slate leading-relaxed">
            We implement reasonable security practices and procedures as mandated by the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 to protect your data from unauthorized access, disclosure, or destruction. Student identity documents are processed strictly for verification and stored securely.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">5. Your Rights</h2>
          <p className="mb-6 text-stripe-slate leading-relaxed">
            You have the right to access, correct, or delete your personal data. You may deactivate your account at any time through your account settings. Upon account termination, we may retain certain transaction data as required by law or for legitimate fraud prevention purposes.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">6. Contact Us</h2>
          <p className="mb-6 text-stripe-slate leading-relaxed">
            For questions or concerns regarding this Privacy Policy or your data, please contact our Grievance Officer at: <br/><br/>
            <strong>Email:</strong> cosen.hub@gmail.com <br/>
            <strong>Phone:</strong> +91 81558 60636
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
