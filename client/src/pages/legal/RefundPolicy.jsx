import React from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-stripe-bg">
      <Navbar />
      <div className="flex-grow max-w-4xl mx-auto px-4 py-24 w-full">
        <h1 className="text-4xl font-display font-bold text-stripe-slate mb-2">Cancellation &amp; Refund Policy</h1>
        <p className="text-stripe-muted mb-8 italic">Effective Date: June 2026</p>
        
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-stripe-border prose prose-slate max-w-none">
          <p className="mb-6 text-stripe-slate leading-relaxed">
            Cosen operates as a peer-to-peer technology intermediary. Because the services offered on the Platform are provided directly by other students (Sellers) to Buyers, our cancellation and refund policy is structured around our Escrow payment system.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">1. Escrow Payments</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            When a Buyer places an Order, the funds are securely held in Escrow. These funds are only released to the Seller when:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>The Buyer explicitly confirms that the service has been successfully delivered.</li>
            <li>A dispute is resolved in favor of the Seller by the Platform Administration.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">2. Order Cancellations</h2>
          <h3 className="text-xl font-bold text-stripe-slate mt-4 mb-2">Before Delivery:</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            A Buyer may request to cancel an order at any time before the Seller marks the order as "Delivered". If the Seller agrees to the cancellation, a full refund (excluding Platform commissions and Payment Gateway processing fees, if any) will be initiated.
          </p>
          <h3 className="text-xl font-bold text-stripe-slate mt-4 mb-2">Seller Cancellation:</h3>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            If a Seller cancels an order because they are unable to fulfill it, the Buyer will receive a full 100% refund of the amount paid.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">3. Disputes &amp; Refunds After Delivery</h2>
          <p className="mb-4 text-stripe-slate leading-relaxed">
            If a Seller marks an order as "Delivered" but the Buyer is unsatisfied with the quality, or the service was not rendered as agreed:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2 text-stripe-slate">
            <li>The Buyer must raise a Dispute within 3 days of the delivery notification.</li>
            <li>Once a dispute is raised, the Escrow funds remain frozen.</li>
            <li>Our administrative team will review the communications and deliverables in the Order Chat.</li>
            <li>If the dispute is resolved in favor of the Buyer, a refund will be processed. If resolved in favor of the Seller, the funds will be released to the Seller.</li>
          </ul>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">4. Refund Processing Time</h2>
          <p className="mb-6 text-stripe-slate leading-relaxed">
            All approved refunds are processed back to the original method of payment through our payment gateway partner, Razorpay. Please allow <strong>5-7 business days</strong> for the refunded amount to reflect in your bank account or credit card statement.
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">5. Non-Refundable Items</h2>
          <p className="mb-6 text-stripe-slate leading-relaxed">
            Once an order is marked as "Completed" (either by the Buyer's confirmation or by the resolution of a dispute), the transaction is final and no refunds will be issued. 
          </p>

          <h2 className="text-2xl font-bold text-stripe-slate mt-8 mb-4">6. Contact Us</h2>
          <p className="mb-6 text-stripe-slate leading-relaxed">
            For any issues related to payments or refunds, please contact us at: <br/><br/>
            <strong>Email:</strong> cosen.hub@gmail.com <br/>
            <strong>Phone:</strong> +91 81558 60636
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
