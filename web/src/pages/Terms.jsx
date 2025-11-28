import { useNavigate } from 'react-router-dom';
import './Legal.css';

export default function Terms() {
  const navigate = useNavigate();

  // --- Render ---
  return (
    <div className="legal-container">
      <div className="legal-header">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back
        </button>
        <h1>Terms & Conditions</h1>
        <p>Somali Society Salford</p>
      </div>

      <div className="legal-content">
        <p className="legal-intro">
          Please read these Terms and Conditions carefully before purchasing tickets. 
          By completing your purchase, you agree to be bound by these terms.
        </p>

        <section>
          <h2>1. Definitions</h2>
          <p>
            <strong>"We", "Us", "Our"</strong> refers to Somali Society Salford.<br />
            <strong>"You", "Your"</strong> refers to the ticket purchaser.<br />
            <strong>"Event"</strong> refers to any event organized by Somali Society Salford.<br />
            <strong>"Ticket"</strong> refers to the electronic confirmation and QR code issued upon purchase.
          </p>
        </section>

        <section>
          <h2>2. Ticket Purchase & Payment</h2>
          <h3>2.1 Payment Processing</h3>
          <p>
            All payments are processed securely through Stripe. We do not store your payment card details. 
            By completing a purchase, you authorize us to charge your payment method for the total amount.
          </p>

          <h3>2.2 Booking Confirmation</h3>
          <p>
            Upon successful payment, you will receive an email confirmation containing:
          </p>
          <ul>
            <li>Your unique booking code</li>
            <li>QR code ticket (as an attachment)</li>
            <li>Event details (date, time, location)</li>
            <li>Number of tickets purchased</li>
          </ul>

          <h3>2.3 Ticket Validity</h3>
          <p>
            Tickets are valid only for the specific event, date, and time stated. 
            Each ticket admits one person unless otherwise specified.
          </p>
        </section>

        <section>
          <h2>3. Entry Requirements</h2>
          <h3>3.1 Required Documentation</h3>
          <p>
            To gain entry to the event, you must present:
          </p>
          <ul>
            <li>Your QR code ticket (printed or on mobile device)</li>
            <li>Valid photo identification (driver's license, passport, or university ID)</li>
            <li>Your booking confirmation email (if QR code is unavailable)</li>
          </ul>

          <h3>3.2 Age Restrictions</h3>
          <p>
            Some events may have age restrictions. These will be clearly stated on the event page. 
            You may be asked to provide proof of age at entry.
          </p>

          <h3>3.3 Right of Admission</h3>
          <p>
            We reserve the right to refuse entry or remove any person from the event for:
          </p>
          <ul>
            <li>Failure to provide valid ID or ticket</li>
            <li>Aggressive, threatening, or inappropriate behavior</li>
            <li>Being under the influence of alcohol or drugs</li>
            <li>Violation of event rules or UK law</li>
          </ul>
          <p>
            No refund will be issued in such cases.
          </p>
        </section>

        <section>
          <h2>4. Cancellations & Refunds</h2>
          <h3>4.1 No Refunds Policy</h3>
          <p>
            <strong>All ticket sales are final.</strong> We do not offer refunds or exchanges for any reason, including but not limited to:
          </p>
          <ul>
            <li>Change of personal circumstances</li>
            <li>Inability to attend</li>
            <li>Change of mind</li>
            <li>Travel issues</li>
          </ul>

          <h3>4.2 Event Cancellation by Organizer</h3>
          <p>
            If we cancel or significantly reschedule an event, you will be entitled to a full refund. 
            Refunds will be processed within 14 working days to the original payment method.
          </p>

          <h3>4.3 Unauthorized Chargebacks</h3>
          <p>
            If a chargeback or payment dispute is raised against a valid transaction, the corresponding ticket(s) 
            will be immediately invalidated, and entry will be refused. Any resulting fees incurred by the Society 
            may be subject to collection.
          </p>

          <h3>4.4 Event Changes</h3>
          <p>
            We reserve the right to make reasonable changes to:
          </p>
          <ul>
            <li>Event schedule or running order</li>
            <li>Performers or speakers (if applicable)</li>
            <li>Venue layout</li>
          </ul>
          <p>
            Such changes do not entitle you to a refund unless the event is cancelled entirely.
          </p>
        </section>

        <section>
          <h2>5. Ticket Transfer</h2>
          <h3>5.1 Transferring Tickets</h3>
          <p>
            You may transfer your ticket to another person by:
          </p>
          <ul>
            <li>Forwarding the confirmation email with QR code</li>
            <li>Providing them with your booking code</li>
          </ul>
          <p>
            Once transferred, you will no longer have access to the event. The new ticket holder must bring valid ID.
          </p>

          <h3>5.2 Unauthorized Resale</h3>
          <p>
            Tickets may not be resold for profit or commercial purposes. 
            Any tickets found to be resold in breach of these terms will be void, and entry may be refused.
          </p>
        </section>

        <section>
          <h2>6. Lost or Stolen Tickets</h2>
          <p>
            If you lose your ticket or booking confirmation:
          </p>
          <ul>
            <li>Check your email for the confirmation (including spam folder)</li>
            <li>Contact us at <a href="mailto:somsocsalford@gmail.com">somsocsalford@gmail.com</a> with your name and purchase details</li>
            <li>We can verify your booking using your email address</li>
          </ul>
          <p>
            We are not responsible for lost, stolen, or damaged tickets. Please keep your QR code secure.
          </p>
        </section>

        <section>
          <h2>7. Behavior & Safety</h2>
          <h3>7.1 Attendee Conduct</h3>
          <p>
            All attendees must:
          </p>
          <ul>
            <li>Treat staff, volunteers, and other attendees with respect</li>
            <li>Follow venue rules and health & safety instructions</li>
            <li>Not engage in discriminatory, threatening, or illegal behavior</li>
            <li>Not bring prohibited items (weapons, illegal substances, etc.)</li>
          </ul>

          <h3>7.2 Security & Searches</h3>
          <p>
            For your safety, we may conduct bag searches and security checks at entry. 
            By attending, you consent to such searches. Refusal may result in denied entry without refund.
          </p>

          <h3>7.3 Photography & Recording</h3>
          <p>
            Photography and video recording may take place at our events for promotional purposes. 
            By attending, you consent to being photographed and for such images to be used in our marketing materials.
          </p>
        </section>

        <section>
          <h2>8. Liability</h2>
          <h3>8.1 Our Liability</h3>
          <p>
            We accept liability for:
          </p>
          <ul>
            <li>Death or personal injury caused by our negligence</li>
            <li>Fraud or fraudulent misrepresentation</li>
            <li>Any other liability that cannot be excluded by UK law</li>
          </ul>

          <h3>8.2 Limitation of Liability</h3>
          <p>
            To the fullest extent permitted by law, we are not liable for:
          </p>
          <ul>
            <li>Loss or damage to your personal property</li>
            <li>Injury caused by other attendees or third parties</li>
            <li>Travel, accommodation, or other expenses incurred</li>
            <li>Indirect or consequential losses</li>
          </ul>

          <h3>8.3 Force Majeure</h3>
          <p>
            We are not liable for failure to perform our obligations due to circumstances beyond our reasonable control, including:
          </p>
          <ul>
            <li>Natural disasters, extreme weather</li>
            <li>Terrorism, war, civil unrest</li>
            <li>Public health emergencies or pandemics</li>
            <li>Government restrictions or venue closure</li>
            <li>Failure of utilities or transport networks</li>
          </ul>
          <p>
            In such cases, we will attempt to reschedule the event or offer refunds where reasonable.
          </p>
        </section>

        <section>
          <h2>9. Data Protection</h2>
          <p>
            We process your personal data in accordance with UK data protection law. 
            For full details, please see our <a href="/privacy" onClick={(e) => { e.preventDefault(); navigate('/privacy'); }}>Privacy Policy</a>.
          </p>
          <p>
            By purchasing a ticket, you consent to us using your data to:
          </p>
          <ul>
            <li>Process your booking and payment</li>
            <li>Send you event information and updates</li>
            <li>Communicate about your ticket or attendance</li>
          </ul>
        </section>

        <section>
          <h2>10. Contact & Complaints</h2>
          <p>
            If you have any questions, issues, or complaints, please contact us:
          </p>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:somsocsalford@gmail.com">somsocsalford@gmail.com</a></li>
            <li><strong>Website:</strong> <a href="https://somsoc-frontend.onrender.com">somsocsal.com</a></li>
          </ul>
          <p>
            We aim to respond to all inquiries within 3 working days.
          </p>
        </section>

        <section>
          <h2>11. General Terms</h2>
          <h3>11.1 Changes to Terms</h3>
          <p>
            We may update these Terms and Conditions from time to time. 
            The version in effect at the time of your purchase will apply to your booking.
          </p>

          <h3>11.2 Severability</h3>
          <p>
            If any provision of these terms is found to be invalid or unenforceable, 
            the remaining provisions will remain in full effect.
          </p>

          <h3>11.3 Governing Law</h3>
          <p>
            These Terms and Conditions are governed by the laws of England and Wales. 
            Any disputes will be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section>
          <h2>12. Acceptance of Terms</h2>
          <p>
            By completing your ticket purchase, you confirm that:
          </p>
          <ul>
            <li>You have read and understood these Terms and Conditions</li>
            <li>You agree to be bound by these terms</li>
            <li>You accept our no-refund policy</li>
            <li>The information you provided is accurate and complete</li>
          </ul>
        </section>

        <p className="legal-footer">
          <strong>Last Updated:</strong> November 2025<br />
          <strong>Version:</strong> 1.1
        </p>
      </div>
    </div>
  );
}