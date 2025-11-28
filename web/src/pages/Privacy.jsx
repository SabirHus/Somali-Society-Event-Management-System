import { useNavigate } from 'react-router-dom';
import './Legal.css';

export default function Privacy() {
  const navigate = useNavigate();

  // --- Render ---
  return (
    <div className="legal-container">
      <div className="legal-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back
        </button>
        <h1>Privacy Policy</h1>
        <p>Somali Society Salford</p>
      </div>

      <div className="legal-content">
        <p className="legal-intro">
          This Privacy Policy explains how we collect, use, and protect your personal information 
          when you use our ticketing service.
        </p>

        <section>
          <h2>1. Information We Collect</h2>
          <h3>1.1 Information You Provide</h3>
          <p>When you purchase a ticket, we collect:</p>
          <ul>
            <li><strong>Personal Details:</strong> Full name, email address, phone number (optional)</li>
            <li><strong>Payment Information:</strong> Processed securely by Stripe (we do not store card details)</li>
            <li><strong>Booking Details:</strong> Event name, ticket quantity, booking code</li>
          </ul>

          <h3>1.2 Automatically Collected Information</h3>
          <p>When you visit our website, we may collect:</p>
          <ul>
            <li>IP address and browser type</li>
            <li>Pages visited and time spent</li>
            <li>Device information</li>
            <li>Cookies (see Cookie Policy below)</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use your personal data to:</p>
          <ul>
            <li><strong>Process Your Booking:</strong> Confirm your ticket purchase and send confirmation emails</li>
            <li><strong>Communicate With You:</strong> Send event updates, reminders, and important information</li>
            <li><strong>Event Management:</strong> Check you in at events and manage attendance</li>
            <li><strong>Customer Support:</strong> Respond to your inquiries and resolve issues</li>
            <li><strong>Improve Our Service:</strong> Analyze usage to improve our website and events</li>
            <li><strong>Legal Compliance:</strong> Comply with legal obligations and prevent fraud</li>
          </ul>
        </section>

        <section>
          <h2>3. Legal Basis for Processing</h2>
          <p>Under UK GDPR, we process your data based on:</p>
          <ul>
            <li><strong>Contract Performance:</strong> To fulfill our ticketing contract with you</li>
            <li><strong>Legitimate Interests:</strong> To improve our services and communicate about events</li>
            <li><strong>Legal Obligation:</strong> To comply with financial and tax regulations</li>
            <li><strong>Consent:</strong> For marketing communications (where required)</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Sharing & Third Parties</h2>
          <h3>4.1 Third-Party Services</h3>
          <p>We share your data with trusted third parties to operate our service:</p>
          <ul>
            <li><strong>Stripe:</strong> Payment processing (secure, PCI-compliant)</li>
            <li><strong>Resend:</strong> Email delivery service</li>
            {/* Updated based on Render hosting plan */}
            <li><b>Render:</b> Hosting for application code (front-end and back-end APIs)</li>
          </ul>

          <h3>4.2 We Do NOT:</h3>
          <ul>
            <li>Sell your personal data to third parties</li>
            <li>Share your data for marketing by other companies</li>
            <li>Use your data for purposes unrelated to our ticketing service</li>
          </ul>

          <h3>4.3 Legal Disclosure</h3>
          <p>We may disclose your information if required by law or to:</p>
          <ul>
            <li>Comply with legal processes or government requests</li>
            <li>Protect our rights, property, or safety</li>
            <li>Prevent fraud or illegal activity</li>
          </ul>
        </section>

        <section>
          <h2>5. Data Retention</h2>
          <p>We retain your data for the following periods:</p>
          <ul>
            <li><b>Booking Records:</b> 7 years (for financial and tax compliance)</li>
            <li><strong>Email Confirmations:</strong> Indefinitely (in your email inbox)</li>
            <li><strong>Marketing Data:</strong> Until you unsubscribe or request deletion</li>
            <li><strong>Website Analytics:</strong> Up to 2 years</li>
          </ul>
          <p>After these periods, we securely delete or anonymize booking data.</p>
        </section>

        <section>
          <h2>6. Your Rights</h2>
          <p>Under UK data protection law, you have the right to:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data (subject to legal requirements)</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Object:</strong> Opt out of certain processing (e.g., marketing)</li>
            <li><strong>Withdraw Consent:</strong> Where processing is based on consent</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:somsocsalford@gmail.com">somsocsalford@gmail.com</a></p>
        </section>

        <section>
          <h2>7. Data Security</h2>
          <p>We take security seriously and implement measures to protect your data:</p>
          <ul>
            <li>Encrypted connections (HTTPS/SSL)</li>
            <li>Secure password storage (bcrypt hashing)</li>
            <li>Access controls and authentication</li>
            <li>Regular security updates</li>
            <li>PCI-compliant payment processing via Stripe</li>
          </ul>
          <p>
            However, no method of transmission over the internet is 100% secure. 
            While we strive to protect your data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2>8. Cookies</h2>
          <h3>8.1 What Are Cookies?</h3>
          <p>
            Cookies are small text files stored on your device to help websites function and improve user experience.
          </p>

          <h3>8.2 Cookies We Use</h3>
          <ul>
            <li><strong>Essential Cookies:</strong> Required for the website to function (login sessions, shopping cart)</li>
            <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our site</li>
            <li><strong>Stripe Cookies:</strong> Required for secure payment processing</li>
          </ul>

          <h3>8.3 Managing Cookies</h3>
          <p>
            You can control cookies through your browser settings. However, disabling essential cookies may affect website functionality.
          </p>
        </section>

        <section>
          <h2>9. International Transfers</h2>
          <p>
            Your data may be processed outside the UK/EEA by our service providers (e.g., cloud hosting). 
            We ensure appropriate safeguards are in place, such as:
          </p>
          <ul>
            <li>Standard Contractual Clauses (SCCs)</li>
            <li>Adequacy decisions by the UK Government</li>
            <li>Service provider compliance with data protection standards</li>
          </ul>
        </section>

        <section>
          <h2>10. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not knowingly collect data from children. 
            If you believe a child has provided us with personal information, please contact us immediately.
          </p>
          <p>
            For events with attendees under 18, we require parental/guardian consent for ticket purchases.
          </p>
        </section>

        <section>
          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last Reviewed" date. 
            Significant changes will be communicated via email where appropriate.
          </p>
        </section>

        <section>
          <h2>12. Contact & Complaints</h2>
          <h3>12.1 Contact Us</h3>
          <p>For questions or requests regarding your personal data:</p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:somsocsalford@gmail.com">somsocsalford@gmail.com</a></li>
            <li><strong>Website:</strong> <a href="https://somsoc-frontend.onrender.com">somsocsal.com</a></li>
          </ul>

          <h3>12.2 Complaints</h3>
          <p>
            If you're not satisfied with how we handle your data, you have the right to complain to the 
            Information Commissioner's Office (ICO):
          </p>
          <ul>
            <li><strong>Website:</strong> <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a></li>
            <li><strong>Phone:</strong> 0303 123 1113</li>
          </ul>
        </section>

        <p className="legal-footer">
          <strong>Last Reviewed:</strong> November 2025<br />
          <b>Version:</b> 1.1
        </p>
      </div>
    </div>
  );
}