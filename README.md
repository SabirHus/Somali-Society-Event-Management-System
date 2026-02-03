Event Management System Somali society (somsocsal.com).

An event operations automation-integrated high-performance and secure ticketing and logistics platform. This operating-level system takes care of the entire event lifecycle, including credit card processing as well as real-time attendee verification.

## Live Environment
* **URL: [ https ](https) somsocsal.com
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
