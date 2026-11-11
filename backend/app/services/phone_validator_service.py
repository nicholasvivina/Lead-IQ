import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberFormat
from typing import Dict, Any

class PhoneValidatorService:
    @staticmethod
    def validate(phone_raw: str) -> Dict[str, Any]:
        """
        Validates international phone numbers using the Google phonenumbers library.
        Validates possible & valid numbers, normalizes to E.164,
        and never guesses missing country codes.
        """
        if not phone_raw or not phone_raw.strip():
            return {
                "status": "unverified",
                "normalized_phone": None,
                "country_code": None,
                "reason": "Phone number not provided."
            }

        cleaned = phone_raw.strip()

        # Check if country code indicator (+) is present or user provided valid country code
        # We strictly do not guess country codes
        if not cleaned.startswith("+") and not (cleaned.startswith("00") and len(cleaned) > 4):
            # Check if it looks like a local number without country code
            return {
                "status": "invalid",
                "normalized_phone": cleaned,
                "country_code": None,
                "reason": "Missing international country code (e.g. +1, +44, +91). Country code cannot be guessed."
            }

        try:
            # Parse with None so it expects international format starting with +
            parsed_num = phonenumbers.parse(cleaned, None)
        except NumberParseException as e:
            return {
                "status": "invalid",
                "normalized_phone": cleaned,
                "country_code": None,
                "reason": f"Phone format parsing error: {e.args[0] if e.args else str(e)}"
            }
        except Exception as e:
            return {
                "status": "invalid",
                "normalized_phone": cleaned,
                "country_code": None,
                "reason": f"Invalid phone number structure: {str(e)}"
            }

        # Check if number is possible
        if not phonenumbers.is_possible_number(parsed_num):
            return {
                "status": "invalid",
                "normalized_phone": cleaned,
                "country_code": parsed_num.country_code,
                "reason": "Phone number has impossible digit count or length for its country prefix."
            }

        # Check if number is valid for the region
        if not phonenumbers.is_valid_number(parsed_num):
            return {
                "status": "invalid",
                "normalized_phone": cleaned,
                "country_code": parsed_num.country_code,
                "reason": "Phone number structure is possible but not recognized as a valid number in its country region."
            }

        # Valid number: format to E.164 (e.g., +14155552671)
        e164_format = phonenumbers.format_number(parsed_num, PhoneNumberFormat.E164)
        return {
            "status": "valid",
            "normalized_phone": e164_format,
            "country_code": parsed_num.country_code,
            "reason": f"Valid international number ({e164_format}) verified for country code +{parsed_num.country_code}."
        }

phone_validator_service = PhoneValidatorService()
