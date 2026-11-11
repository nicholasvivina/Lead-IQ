SECTION 1: How to Run Locally (Step-by-Step)
Step 1: Environment Variables & API Key

The backend configuration file already exists at backend/.env.

Open backend/.env:
env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite:///./leadiq.db
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173
About the API Key:
If you have a free Groq API key: Paste it after GROQ_API_KEY= (e.g., GROQ_API_KEY=gsk_your_key_here). You can get a free key with no credit card at console.groq.com
.
If you do NOT have a key: Leave it blank! The system will automatically use the built-in rule-based engine for free. Nothing will break.
Step 2: Start the Backend

Open a terminal in the project root folder (Lead-IQ):

bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
Backend URL: http://127.0.0.1:8000
Interactive API Docs (Swagger): http://127.0.0.1:8000/docs
Step 3: Start the Frontend

Open a second terminal in the project root folder (Lead-IQ):

bash
cd frontend
npm run dev
App URL: Open your browser and go to http://localhost:5173
(Shortcut Option for Windows)

Instead of running two terminals manually, you can just double-click:

cmd
start.bat

(Or in PowerShell run: .\run_dev.ps1)

SECTION 2: The Project Explained Simply (In Plain English)
What is a "Lead"?

In business, a lead is just a person who might buy your product (their name, work email, phone number, and where they work).

What Problem Does This App Solve?

When sales and marketing teams collect leads from conferences, LinkedIn, or website forms, the data is usually messy and broken:

Bad emails: Someone typed john@gmailll.com or a fake company email. When sales teams email them, the email bounces, damaging the company's email reputation.
Broken phone numbers: Numbers are typed without country codes (9876543210), making them impossible to dial.
Duplicate contacts: Two different sales reps might call the same person without realizing it because one rep saved "John Smith" and another saved "J. Smith".
No context: A rep sees "Acme Corp" on a spreadsheet, but has no clue what Acme Corp actually sells. They waste 10 minutes Googling the company before every call.
What Does LeadIQ Do?

Think of LeadIQ as an automatic cleaning and intelligence machine for your sales list.

When you upload a spreadsheet of leads:

Checks the email:
Is the syntax correct?
Does the company's domain actually have an active mail server (MX records)?
Cleans the phone number:
Formats it into the proper international standard (+1..., +44..., +91...).
Spots duplicates:
Warns you if this email or person already exists in your database so nobody double-pitches a client.
Researches the company with AI:
It looks at the company's website and description.
It summarizes what the company sells in one simple sentence.
It tells the sales rep the industry and business model (e.g., "They sell subscription software to hospitals").
Gives you a clean list:
You can download a clean, verified CSV file to give directly to your sales team.
SECTION 3: Technical Architecture (Under the Hood)

Here are the technical implementation details:

1. Backend Architecture (Python & FastAPI)
Framework: FastAPI provides an asynchronous REST API with automatic Pydantic request/response validation and interactive Swagger UI.
Database: SQLite with SQLAlchemy 2.0 ORM. Runs locally as an ACID-compliant file (leadiq.db) with composite indexes on email, phone, company_name, and company_domain. Zero hosting cost.
Email Deliverability:
email-validator verifies RFC 5322 and RFC 6531 syntax.
dnspython performs non-blocking DNS queries to find MX (Mail Exchange) records on the domain.
Transparent status reporting: distinguishes domain_valid (MX records confirmed) from syntax_valid and invalid, without making false claims about mailbox existence.
Phone Number Normalization:
Google's phonenumbers library parses and validates numbers.
Formats valid numbers into E.164 standard (e.g., +14155552671).
Refuses to guess missing international country codes to prevent corrupting dialing data.
Deduplication Engine:
Multi-tier matching logic:
Exact match: Case-insensitive email or normalized phone → confirmed_duplicate.
Fuzzy match: (Full Name + Company) or (Company + Domain) → possible_duplicate.
AI Classification & Heuristic Fallback:
Integrates Groq SDK running llama-3.3-70b-versatile with JSON schema enforcement.
Returns structured attributes: industry, business_category, business_model, company_summary, confidence, and reason.
Deterministic Fallback: A rule-based keyword engine automatically runs if GROQ_API_KEY is empty, ensuring zero downtime and 100% free offline execution.
CSV Security:
Prevents CSV formula injection (CSV Injection / Formula Execution) by prepending a single quote (') to any cell beginning with =, +, -, @, \t, or \r.
2. Frontend Architecture (React, Vite & Tailwind)
Vite 6 + React 18: Fast development server with pre-configured backend proxy (/api → http://127.0.0.1:8000).
Tailwind CSS: Custom corporate design system with slate and navy color palettes (#0B132B).
Recharts: Live SVG charts displaying deliverability donut charts and horizontal industry distribution bars, computed strictly from database queries.
CSV Ingestion Pipeline: 7-step wizard that inspects file encodings (UTF-8, Latin-1), auto-maps alternate header aliases (e.g. contact_name → full_name), previews the first 10 rows, and allows exporting rejected records for audit.