import dns.resolver
import dns.exception
from email_validator import validate_email, EmailNotValidError
from typing import Dict, Any

class EmailValidatorService:
    @staticmethod
    def validate(email_raw: str, check_dns: bool = True) -> Dict[str, Any]:
        """
        Validates email syntax, normalizes case, extracts domain,
        and optionally checks DNS MX records with dnspython.
        Never claims an inbox exists based solely on domain MX records.
        """
        if not email_raw or not email_raw.strip():
            return {
                "status": "invalid",
                "normalized_email": None,
                "domain": None,
                "reason": "Email address cannot be blank."
            }

        cleaned_email = email_raw.strip().lower()

        # Step 1: Syntax validation using email-validator
        try:
            valid_info = validate_email(cleaned_email, check_deliverability=False)
            normalized_email = valid_info.normalized.lower()
            domain = valid_info.domain.lower()
        except EmailNotValidError as e:
            return {
                "status": "invalid",
                "normalized_email": cleaned_email,
                "domain": cleaned_email.split('@')[-1] if '@' in cleaned_email else None,
                "reason": f"Invalid email syntax: {str(e)}"
            }
        except Exception as e:
            return {
                "status": "invalid",
                "normalized_email": cleaned_email,
                "domain": cleaned_email.split('@')[-1] if '@' in cleaned_email else None,
                "reason": f"Email parsing error: {str(e)}"
            }

        if not check_dns:
            return {
                "status": "syntax_valid",
                "normalized_email": normalized_email,
                "domain": domain,
                "reason": "Syntax is valid. Domain DNS MX check skipped."
            }

        # Step 2: DNS MX record check with dnspython
        try:
            resolver = dns.resolver.Resolver()
            if not resolver.nameservers:
                resolver.nameservers = ['8.8.8.8', '1.1.1.1']
            resolver.timeout = 0.5
            resolver.lifetime = 0.5
            
            # Query MX records with fast 0.5s lifetime
            mx_records = resolver.resolve(domain, 'MX', lifetime=0.5)
            if mx_records and len(mx_records) > 0:
                return {
                    "status": "domain_valid",
                    "normalized_email": normalized_email,
                    "domain": domain,
                    "reason": "Valid RFC syntax and active mail server (MX) records found. Note: Specific mailbox existence remains unverified."
                }
            else:
                return {
                    "status": "invalid",
                    "normalized_email": normalized_email,
                    "domain": domain,
                    "reason": f"Domain '{domain}' has no valid mail exchanger (MX) records configured."
                }
        except dns.resolver.NXDOMAIN:
            return {
                "status": "invalid",
                "normalized_email": normalized_email,
                "domain": domain,
                "reason": f"Domain '{domain}' does not exist (NXDOMAIN)."
            }
        except (dns.resolver.NoAnswer, dns.resolver.NoNameservers):
            return {
                "status": "invalid",
                "normalized_email": normalized_email,
                "domain": domain,
                "reason": f"Domain '{domain}' has no active DNS mail records."
            }
        except (dns.resolver.Timeout, dns.resolver.LifetimeTimeout, dns.exception.DNSException, OSError, Exception) as e:
            # Offline / sandbox / DNS timeout fallback - gracefully degrade to syntax_valid
            return {
                "status": "syntax_valid",
                "normalized_email": normalized_email,
                "domain": domain,
                "reason": f"Valid syntax. DNS check timed out or network is unavailable ({type(e).__name__}); unverified mailbox status."
            }

email_validator_service = EmailValidatorService()
