import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-stripe-bg">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto px-4 py-24 w-full">
        <h1 className="text-4xl font-display font-bold text-stripe-slate mb-2">Terms and Conditions of Use</h1>
        <p className="text-stripe-muted mb-8 italic">Student Peer Marketplace Platform | Effective Date: June 2026</p>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stripe-border prose prose-slate max-w-none">
          
          <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg mb-8">
            <p className="text-red-700 font-bold m-0 text-sm">
              IMPORTANT: PLEASE READ THESE TERMS CAREFULLY BEFORE USING THIS PLATFORM. BY REGISTERING OR USING THIS PLATFORM, YOU AGREE TO BE BOUND BY THESE TERMS AND CONDITIONS.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">PREAMBLE</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            This document sets out the Terms and Conditions ("Terms") governing access to and use of the peer-to-peer campus service marketplace ("the Platform"). The Platform is an online technology intermediary that enables verified university students ("Users") to list, discover, offer, and transact peer-to-peer services within campus communities across India.
          </p>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            The Platform operates solely as a neutral technology intermediary. It does not itself provide any services listed herein, does not employ any student listed as a service provider, and does not guarantee the quality, legality, or outcome of any transaction or interaction conducted through it.
          </p>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            These Terms are a legally binding agreement entered into pursuant to the Information Technology Act, 2000 ("IT Act"), the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 ("IT Rules 2021"), the Indian Contract Act, 1872, the Consumer Protection Act, 2019, and all other applicable laws of India.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">1. DEFINITIONS</h2>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li><strong>"Platform"</strong> means this peer-to-peer campus service marketplace, its website, mobile applications, APIs, and all associated services.</li>
            <li><strong>"User"</strong> means any individual who creates an account on the Platform, whether as a Buyer, Seller, or both.</li>
            <li><strong>"Seller"</strong> means a verified student User who lists one or more services on the Platform.</li>
            <li><strong>"Buyer"</strong> means a verified student User who purchases, engages with, or initiates contact with a Seller through the Platform.</li>
            <li><strong>"Service Listing"</strong> means any offer of service posted by a Seller on the Platform, across any permitted category.</li>
            <li><strong>"Order"</strong> means a confirmed transaction between a Buyer and Seller, initiated through the Platform.</li>
            <li><strong>"Escrow"</strong> means the temporary holding of payment funds by the Platform's payment processor on behalf of both parties, pending completion or dispute resolution.</li>
            <li><strong>"Negotiable Service"</strong> means a Service Listing where the final price is agreed upon between Buyer and Seller prior to payment.</li>
            <li><strong>"Content"</strong> means any text, image, video, audio, portfolio material, profile information, review, or other material submitted to the Platform by any User.</li>
            <li><strong>"Prohibited Content"</strong> means any Content or activity described as impermissible under these Terms.</li>
            <li><strong>"Verification"</strong> means the process of confirming a User's enrollment at a recognized university or college through their institutional email address and/or student identity document.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">2. ELIGIBILITY AND ACCOUNT REGISTRATION</h2>
          
          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">2.1 Eligibility</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">Use of the Platform is restricted to individuals who:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>Are currently enrolled as full-time or part-time students at a recognised university, college, or higher education institution in India;</li>
            <li>Are at least 18 (eighteen) years of age;</li>
            <li>Hold a valid institutional email address ending in .edu, .ac.in, or an equivalent domain recognised by the Platform;</li>
            <li>Are legally competent to enter into binding contracts under the Indian Contract Act, 1872;</li>
            <li>Have not previously been suspended or permanently banned from the Platform.</li>
          </ul>

          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">2.2 Account Registration</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>Users must provide accurate, current, and complete information during registration.</li>
            <li>Each individual may maintain only one (1) active account. Creating multiple accounts is a violation of these Terms.</li>
            <li>Users are solely responsible for maintaining the confidentiality of their account credentials.</li>
            <li>Users must notify the Platform immediately upon becoming aware of any unauthorised use of their account.</li>
          </ul>

          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">2.3 Verification of Student Identity</h3>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>Registration requires verification via an institutional email address (OTP-based confirmation).</li>
            <li>Additional verification via student identity card upload may be required. The Platform uses automated image recognition technology to validate these documents.</li>
            <li>By submitting a student identity document, the User confirms that the document is genuine, unaltered, and belongs to them.</li>
            <li>Submission of forged, altered, or fraudulent identity documents constitutes a criminal offence under the Indian Penal Code, 1860 (Sections 463-471) and will result in immediate account termination and may be reported to law enforcement.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">3. NATURE OF THE PLATFORM — INTERMEDIARY STATUS</h2>
          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">3.1 Technology Intermediary</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">The Platform is an "intermediary" as defined under Section 2(1)(w) of the Information Technology Act, 2000. It provides a neutral online infrastructure enabling peer-to-peer transactions between students. The Platform does not:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>Direct, supervise, control, or interfere with the content of any Service Listing or the delivery of any service;</li>
            <li>Endorse, verify the quality of, or take responsibility for any service offered by a Seller;</li>
            <li>Employ any Seller or create any employer-employee or principal-agent relationship with any User;</li>
            <li>Guarantee successful completion of any Order or delivery of any service;</li>
            <li>Provide any academic, professional, financial, medical, or legal services of its own.</li>
          </ul>

          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">3.2 User-to-User Transactions</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            All contracts for services are formed exclusively between the Buyer and the Seller. The Platform facilitates but is not a party to any such contract. Disputes arising from the quality, delivery, or outcome of services are solely between the Buyer and the Seller, except as provided in these Terms.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">4. PERMITTED CATEGORIES AND ACCEPTABLE USE</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">The Platform currently supports several service categories. Each category is subject to specific rules in addition to the general rules set out in these Terms. These categories include Study Helper, Tech Services, Art &amp; Design, Food Friendship, Photography, Playground, and SendiYou.</p>
          <p className="mb-4 text-stripe-slate leading-relaxed">Under no circumstances may the Platform be used to facilitate academic cheating, non-consensual photography, unlicensed commercial food enterprises, gambling, solicitation, or any unlawful acts.</p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">5. PROHIBITED CONDUCT AND CONTENT</h2>
          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">5.1 Absolutely Prohibited Activities</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">The following are strictly prohibited on the Platform and may result in immediate account termination, legal action, and reporting to law enforcement authorities:</p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>Uploading, transmitting, sharing, or storing any sexually explicit material, or content that sexualises minors in any form whatsoever.</li>
            <li>Using any service category for the solicitation, arrangement, advertisement, or facilitation of sexual services.</li>
            <li>Engaging in any form of harassment, sexual harassment, stalking, blackmail, coercion, intimidation, or threatening behaviour toward any User.</li>
            <li>Sharing, distributing, or threatening to distribute non-consensual intimate images ("revenge porn").</li>
            <li>Offering or procuring services that violate any applicable law of India.</li>
            <li>Posting false, deceptive, or misleading Service Listings, reviews, or profile information.</li>
            <li>Conducting any financial transaction outside the Platform's payment infrastructure in violation of the escrow mechanism ("off-platform payments").</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">6. PAYMENTS, ESCROW, AND FINANCIAL TERMS</h2>
          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">6.1 Payment Processing &amp; Escrow Mechanism</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            All financial transactions on the Platform are processed through Razorpay, a Payment Aggregator regulated by the Reserve Bank of India (RBI). When a Buyer places an Order, the payment is held in escrow by the payment processor. Funds are released to the Seller only upon the Buyer confirming delivery or upon resolution of any dispute.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">7. LIMITATION OF LIABILITY AND DISCLAIMERS</h2>
          <h3 className="text-xl font-bold text-stripe-slate mt-6 mb-2">7.1 Platform Disclaimer</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">8. GOVERNING LAW AND DISPUTE RESOLUTION</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of India.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">9. CONTACT AND GRIEVANCE OFFICER</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            <strong>Email:</strong> cosen.hub@gmail.com <br/>
            <strong>Phone:</strong> +91 81558 60636
          </p>

        </div>
      </div>
      <Footer />
    </div>
  );
}
