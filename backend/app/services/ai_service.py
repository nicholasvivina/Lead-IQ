import os
import json
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field, ValidationError
from app.config import settings

logger = logging.getLogger(__name__)

class AIClassificationOutput(BaseModel):
    industry: str = Field(description="The primary industry sector of the company")
    business_category: str = Field(description="Specific business category, e.g. B2B SaaS, E-commerce, Consulting")
    company_summary: str = Field(description="Concise factual description of what the company does")
    business_model: str = Field(description="Likely business monetization model")
    confidence: str = Field(description="Confidence level: high, medium, or low")
    reason: str = Field(description="Explanation of what provided data supports this classification")

class AIService:
    @staticmethod
    def _rule_based_fallback(
        company_name: Optional[str],
        company_domain: Optional[str],
        job_title: Optional[str],
        company_description: Optional[str],
        industry_hint: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deterministic, zero-cost, rule-based classification engine.
        Acts as reliable fallback when GROQ_API_KEY is not configured or network is offline.
        """
        name_str = (company_name or "").lower()
        domain_str = (company_domain or "").lower()
        title_str = (job_title or "").lower()
        desc_str = (company_description or "").lower()
        hint_str = (industry_hint or "").lower()

        combined = f"{name_str} {domain_str} {title_str} {desc_str} {hint_str}"

        # Heuristic rules
        if any(w in combined for w in ["health", "med", "clinic", "pharma", "biotech", "hospital", "patient", "care"]):
            industry = "Healthcare & Life Sciences"
            category = "HealthTech / Medical Services"
            biz_model = "Service / Fee-for-Service"
            summary = f"{company_name or 'The company'} operates in healthcare and medical services."
            conf = "medium"
            reason = "Classified based on healthcare and medical terminology in company details."
        elif any(w in combined for w in ["bank", "fintech", "finance", "invest", "capital", "wealth", "pay", "crypto", "credit"]):
            industry = "Financial Services & Fintech"
            category = "Financial Technology"
            biz_model = "Transaction Fees / Financial Products"
            summary = f"{company_name or 'The company'} provides financial or payment technology solutions."
            conf = "medium"
            reason = "Classified based on financial and payment indicators in lead data."
        elif any(w in combined for w in ["saas", "software", "cloud", "platform", "ai", "data", "cyber", "security", "dev", "tech", "code"]):
            industry = "Technology & Software"
            category = "B2B SaaS / Enterprise Software"
            biz_model = "Subscription-based software"
            summary = f"{company_name or 'The company'} develops software and digital technology solutions."
            conf = "medium" if (desc_str or name_str) else "low"
            reason = "Classified based on technology and software keywords in company name and profile."
        elif any(w in combined for w in ["shop", "store", "retail", "commerce", "fashion", "apparel", "goods"]):
            industry = "Retail & E-commerce"
            category = "E-Commerce / Direct-to-Consumer"
            biz_model = "Product Sales (Direct & Wholesale)"
            summary = f"{company_name or 'The company'} provides retail and consumer merchandise."
            conf = "medium"
            reason = "Classified based on retail and e-commerce signals in company metadata."
        elif any(w in combined for w in ["consult", "agency", "marketing", "advisory", "talent", "staffing", "design"]):
            industry = "Professional Services & Consulting"
            category = "Business Consulting & Agency"
            biz_model = "Client Retainer / Hourly Professional Services"
            summary = f"{company_name or 'The company'} provides specialized professional and consulting services."
            conf = "medium"
            reason = "Classified based on advisory and professional service roles."
        elif any(w in combined for w in ["logistics", "supply", "freight", "transport", "ship", "warehouse"]):
            industry = "Logistics & Supply Chain"
            category = "Freight & Supply Chain Operations"
            biz_model = "Contract Logistics / Freight Rates"
            summary = f"{company_name or 'The company'} coordinates transportation and supply chain operations."
            conf = "medium"
            reason = "Classified based on logistics and transportation keywords."
        elif any(w in combined for w in ["edu", "school", "learn", "academy", "university", "course"]):
            industry = "Education & Training"
            category = "EdTech / Educational Institution"
            biz_model = "Tuition / Course Subscriptions"
            summary = f"{company_name or 'The company'} delivers educational training and learning programs."
            conf = "medium"
            reason = "Classified based on educational keywords in domain or title."
        else:
            industry = "General Business & Commercial Services"
            category = "Corporate Business Services"
            biz_model = "B2B Commercial Services"
            summary = f"{company_name or 'The organization'} provides business products or commercial services."
            conf = "low"
            reason = "General business classification inferred from available company metadata."

        return {
            "industry": industry,
            "business_category": category,
            "company_summary": summary,
            "business_model": biz_model,
            "confidence": conf,
            "reason": reason,
            "method": "rule_based"
        }

    @classmethod
    def classify_company(
        cls,
        company_name: Optional[str] = None,
        company_domain: Optional[str] = None,
        job_title: Optional[str] = None,
        company_description: Optional[str] = None,
        industry_hint: Optional[str] = None,
        location: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Classifies company using Groq API if GROQ_API_KEY is configured.
        Otherwise seamlessly falls back to the deterministic rule-based engine.
        """
        api_key = settings.GROQ_API_KEY.strip() if settings.GROQ_API_KEY else ""

        # Check if API key is absent
        if not api_key:
            result = cls._rule_based_fallback(company_name, company_domain, job_title, company_description, industry_hint)
            result["method"] = "rule_based"
            return result

        # Attempt Groq API call
        try:
            from groq import Groq
            client = Groq(api_key=api_key)

            system_prompt = (
                "You are an expert B2B company intelligence analyst. "
                "Analyze the provided factual company metadata and classify the organization. "
                "CRITICAL RULES:\n"
                "1. NEVER invent fictional details, revenue figures, or employee counts.\n"
                "2. Base your summary and classification strictly on provided information.\n"
                "3. If evidence is sparse, set confidence to 'low'.\n"
                "4. Respond ONLY with valid JSON conforming to the requested schema."
            )

            user_prompt = (
                f"Company Name: {company_name or 'Unknown'}\n"
                f"Domain: {company_domain or 'None'}\n"
                f"Contact Job Title: {job_title or 'None'}\n"
                f"Existing Description: {company_description or 'None'}\n"
                f"Location: {location or 'None'}\n"
                f"Industry Hint: {industry_hint or 'None'}\n\n"
                "Provide a JSON object with EXACTLY the following keys:\n"
                "{\n"
                '  "industry": "Primary industry name",\n'
                '  "business_category": "E.g. B2B SaaS, E-Commerce, Consulting, etc.",\n'
                '  "company_summary": "1-2 sentence factual summary",\n'
                '  "business_model": "E.g. Subscription-based software, Transactional, Retainer, etc.",\n'
                '  "confidence": "high, medium, or low",\n'
                '  "reason": "What specific data points justify this classification"\n'
                "}"
            )

            completion = client.chat.completions.create(
                model=settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=400
            )

            content = completion.choices[0].message.content
            parsed_json = json.loads(content)
            
            # Validate with Pydantic
            validated = AIClassificationOutput(**parsed_json)
            
            data = validated.model_dump()
            data["method"] = "groq_ai"
            return data

        except (ValidationError, json.JSONDecodeError) as e:
            logger.warning(f"AI response JSON parsing failed: {e}. Falling back to rule-based classification.")
            result = cls._rule_based_fallback(company_name, company_domain, job_title, company_description, industry_hint)
            result["method"] = "rule_based"
            result["reason"] = f"Rule-based classification (AI output format error: {str(e)})"
            return result
        except Exception as e:
            logger.warning(f"Groq API call encountered error: {e}. Falling back to rule-based classification.")
            result = cls._rule_based_fallback(company_name, company_domain, job_title, company_description, industry_hint)
            result["method"] = "rule_based"
            result["reason"] = f"Rule-based classification (Groq API unavailable: {type(e).__name__})"
            return result

ai_service = AIService()
