Event Management System Somali society (somsocsal.com).

<img width="1900" height="903" alt="image" src="https://github.com/user-attachments/assets/79205b37-9b7f-4a83-9491-d55179bc201c" />

An event operations automation-integrated high-performance and secure ticketing and logistics platform. This operating-level system takes care of the entire event lifecycle, including credit card processing as well as real-time attendee verification.

## Live Environment
* **URL: https://somsocsal.com/
* **Status:** Live / Production

Technical Stack and Infrastructure: The stack of software, hardware, and infrastructure the company uses to deliver its service and product offerings.<|human|>Technical Stack and Infrastructure: The software, hardware, and infrastructure by which the company provides its service and product offerings.
* Frontend: React (Vite) to have a mobile-first, responsive administrative and user interface.
* Backend: Node.js (Express) that is structured by modular service layers that perform payments, emails and authentication.
* Database: Neon PostgreSQL, implemented as a Prisma ORM with type-safe data relational processing.
* Security & Infrastructure: Cloudflare-based SSL/TLS encryption; management of secure environment variables; prepared SQL statements in the form of PDO, used to prevent SQL injections.

## Core Engineering Features
* Financial Intelligibility: Built in Stripe API with powerful webhook capabilities to achieve 100 percent transaction consistency between payment status and database entries.
* Automated Fulfillment Logic: Developed an asynchronous Resend (SMTP) engine to create and issue unique QR-coded tickets as soon as the checkout was successful.
* Administrative Scanning Infrastructure: Built a mobile-based dashboard with a real-time QR scanner that coordinates the attendee check-ins to the main database.
* Performance Optimisation: Build time Leveraged Vite to build fast and Cloudflare edge security to reduce latency in protecting global DNS.

## Database Schema (Prisma)
The system makes use of relational schema to connect events, tickets, and persons to provide a high data integrity and efficient joins to administrative reporting.

Booking
<img width="1230" height="897" alt="image" src="https://github.com/user-attachments/assets/8a8158ec-ca72-4468-aa5d-70b503c7f9a2" />

Admin Dashboard
<img width="1908" height="484" alt="image" src="https://github.com/user-attachments/assets/df573c80-f4a2-46fb-be08-0615a082ef5f" />

Attendee List
<img width="1897" height="712" alt="image" src="https://github.com/user-attachments/assets/e771d755-b977-48ea-aec8-9462b9a9e2e6" />

Edit Page
<img width="1906" height="628" alt="image" src="https://github.com/user-attachments/assets/0646fafb-e609-4866-a087-bffe8f3367cc" />

Create Event
<img width="1911" height="687" alt="image" src="https://github.com/user-attachments/assets/a63d2261-7db2-4ade-b964-ed66facff259" />

Scanner
<img width="1252" height="442" alt="image" src="https://github.com/user-attachments/assets/0aa59627-e5fe-49a1-8348-b65d42360786" />

Payment Page
<img width="1112" height="893" alt="image" src="https://github.com/user-attachments/assets/e087a349-6289-434f-937b-a88c852d3098" />

Success Page
<img width="615" height="588" alt="image" src="https://github.com/user-attachments/assets/d208d30f-34e0-4423-abed-cc7ae9d51f8a" />

Email
<img width="557" height="698" alt="image" src="https://github.com/user-attachments/assets/6ef4de9e-05d5-4426-b51c-748d1305b6e7" />
<img width="577" height="759" alt="image" src="https://github.com/user-attachments/assets/9cfe6f38-772b-46f7-a46a-a953693530ba" />





