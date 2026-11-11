import re
import urllib.parse
import httpx
from typing import Dict, Any, Optional

COMMON_FREE_EMAIL_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
    "aol.com", "mail.com", "zoho.com", "proton.me", "protonmail.com", "gmx.com"
}

class EnrichmentService:
    @staticmethod
    def normalize_domain(url_or_domain: str) -> Optional[str]:
        """
        Normalizes a website URL or string to a clean domain (e.g., 'stripe.com').
        """
        if not url_or_domain or not url_or_domain.strip():
            return None

        val = url_or_domain.strip().lower()
        # Add protocol if missing for proper urllib parsing
        if not val.startswith(("http://", "https://")):
            val = "https://" + val

        try:
            parsed = urllib.parse.urlparse(val)
            netloc = parsed.netloc or parsed.path
            # Strip port
            netloc = netloc.split(":")[0]
            # Strip www.
            if netloc.startswith("www."):
                netloc = netloc[4:]
            # Validate domain pattern
            if "." in netloc and len(netloc) >= 4 and not " " in netloc:
                return netloc
        except Exception:
            pass

        # Fallback regex
        match = re.search(r'([a-zA-Z0-9-]+\.[a-zA-Z]{2,})', url_or_domain.lower())
        if match:
            d = match.group(1)
            if d.startswith("www."):
                d = d[4:]
            return d

        return None

    @staticmethod
    def extract_company_from_domain(domain: str) -> Optional[str]:
        """
        Infers a reasonable company name from domain (e.g., 'airbnb.com' -> 'Airbnb').
        """
        if not domain or domain in COMMON_FREE_EMAIL_DOMAINS:
            return None
        name_part = domain.split(".")[0]
        # Clean hyphen or underscore
        clean_name = re.sub(r'[-_]', ' ', name_part).strip().title()
        return clean_name if len(clean_name) >= 2 else None

    @classmethod
    def enrich_company_details(
        cls,
        company_name: Optional[str] = None,
        website: Optional[str] = None,
        email: Optional[str] = None,
        existing_description: Optional[str] = None,
        location: Optional[str] = None,
        fetch_online_metadata: bool = True
    ) -> Dict[str, Any]:
        """
        Enriches company information without fabricating data or scraping prohibited sites.
        """
        resolved_domain = None
        domain_source = "none"

        # 1. Normalize domain from website
        if website:
            resolved_domain = cls.normalize_domain(website)
            if resolved_domain:
                domain_source = "website_url"

        # 2. If no website domain, extract from email if not a generic mail provider
        if not resolved_domain and email and "@" in email:
            em_domain = email.split("@")[-1].strip().lower()
            if em_domain not in COMMON_FREE_EMAIL_DOMAINS:
                resolved_domain = cls.normalize_domain(em_domain)
                if resolved_domain:
                    domain_source = "email_domain"

        # 3. Resolve Company Name
        resolved_company_name = company_name.strip() if company_name and company_name.strip() else None
        name_source = "user_provided" if resolved_company_name else "none"

        if not resolved_company_name and resolved_domain:
            inferred = cls.extract_company_from_domain(resolved_domain)
            if inferred:
                resolved_company_name = inferred
                name_source = "inferred_from_domain"

        # 4. Normalized Website URL
        normalized_website = f"https://{resolved_domain}" if resolved_domain else (website.strip() if website else None)

        # 5. Extract meta description from public website if permitted and requested
        enriched_description = existing_description.strip() if existing_description and existing_description.strip() else None
        data_source = "user_provided" if enriched_description else "none"

        if not enriched_description and resolved_domain and fetch_online_metadata:
            try:
                # Safe HTTP request with short timeout for public OpenGraph/Meta tags
                url = f"https://{resolved_domain}"
                with httpx.Client(timeout=0.4, follow_redirects=True, headers={"User-Agent": "LeadIQ-B2B-Enricher/1.0"}) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        text = resp.text[:15000]  # Only inspect head section
                        # Extract <meta name="description" content="..." />
                        desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']+)["\']', text, re.I)
                        if not desc_match:
                            desc_match = re.search(r'<meta\s+property=["\']og:description["\']\s+content=["\']([^"\']+)["\']', text, re.I)
                        
                        if desc_match:
                            meta_desc = desc_match.group(1).strip()
                            if len(meta_desc) > 15:
                                enriched_description = meta_desc[:500]
                                data_source = "public_web_metadata"
            except Exception:
                # Graceful offline / timeout fallback: never fail or crash
                pass

        # Determine overall enrichment completeness
        has_sufficient_data = bool(resolved_company_name and (enriched_description or resolved_domain))

        return {
            "company_name": resolved_company_name,
            "company_domain": resolved_domain,
            "website": normalized_website,
            "company_description": enriched_description,
            "location": location.strip() if location else None,
            "domain_source": domain_source,
            "name_source": name_source,
            "data_source": data_source,
            "is_complete": has_sufficient_data,
            "enrichment_status": "completed" if has_sufficient_data else "needs_review"
        }

enrichment_service = EnrichmentService()
