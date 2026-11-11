# LeadIQ Test CSV Datasets

This folder contains sample CSV files for testing the **LeadIQ** application.

---

## 1. Files Included

### A. [`leads_test_dataset.csv`](file:///c:/projects/Lead-IQ/testing/leads_test_dataset.csv)
A comprehensive **22-lead test dataset** using standard LeadIQ field headers:
- `full_name`, `email`, `phone`, `company_name`, `website`, `job_title`, `industry`, `location`, `company_description`

**What it tests:**
1. **Valid Contacts:** Real enterprise domains (`stripe.com`, `github.com`, `spotify.com`, `zoho.com`, `siemens.com`) testing active MX lookups and E.164 phone formats.
2. **Invalid Email Syntax:** Corrupted formats (e.g., `zoe.kravitz-invalid-email-format`) to verify syntax rejection.
3. **Non-Existent Domains:** Fake domains (e.g., `nonexistentdomainxyz12345.com`) to verify DNS MX lookup failure detection.
4. **Invalid Phone Formats:** Missing country prefixes (e.g., `9876543210`, `555-0199`) to verify the strict "do not guess country code" rule.
5. **Duplicate Interception:** Records with emails/phones matching the pre-seeded dataset (`alex.morgan@techwave.io`, `sjenkins@apexhealth.org`) to test the duplicate alert badge and suppression options.
6. **Missing Data Fallbacks:** Missing websites or phone numbers to verify domain extraction from email.
7. **AI & Rule-Based Enrichment:** Multiple industry sectors (SaaS, Healthcare, FinTech, Logistics, Retail, Manufacturing) to evaluate classification accuracy.

---

### B. [`leads_alternative_headers.csv`](file:///c:/projects/Lead-IQ/testing/leads_alternative_headers.csv)
An **8-lead test dataset** designed specifically to test the **Smart Column Mapping** feature:
- Uses alternative column names:
  - `contact_name` &rarr; mapped to `full_name`
  - `work_email` &rarr; mapped to `email`
  - `mobile_number` &rarr; mapped to `phone`
  - `organization` &rarr; mapped to `company_name`
  - `web_url` &rarr; mapped to `website`
  - `designation` &rarr; mapped to `job_title`
  - `sector` &rarr; mapped to `industry`
  - `city_state` &rarr; mapped to `location`
  - `overview` &rarr; mapped to `company_description`

---

## 2. How to Test via the LeadIQ UI

1. Open the LeadIQ web interface in your browser: **`http://localhost:5173`**
2. Click **"Import CSV"** on the sidebar or top navigation.
3. Drag & drop or select either:
   - `testing/leads_test_dataset.csv`
   - `testing/leads_alternative_headers.csv`
4. In **Step 2 (Map & Preview)**:
   - Notice how LeadIQ automatically suggests the correct column mapping.
   - Adjust toggles as desired:
     - *"Skip Confirmed Duplicate Leads"*
     - *"Validate Email Syntax & Phone E.164"*
     - *"Auto-Enrich with AI"*
5. Click **"Confirm & Process Import"**.
6. In **Step 3 (Complete)**:
   - Review the summary metrics: *Total Records*, *Successfully Imported*, *Duplicate Records*, and *Invalid Records*.
   - If records are rejected or skipped, click **"Download Rejected CSV"** to audit the exact rejection reasons.
7. Navigate to **"All Leads"**, **"Enrichment Results"**, or **"Duplicate Review"** to inspect the ingested records.
