import re

EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")

PHONE_PATTERN = re.compile(r"(?<!\d)(?:\+46[\s-]?\d{1,3}|0\d{1,3})(?:[\s-]?\d{2,3}){2,4}(?!\d)")

PERSONNUMMER_PATTERN = re.compile(r"\b(?:\d{8}|\d{6})[-+]?\d{4}\b")


def redact_pii(text: str) -> str:
    redacted = text

    redacted = EMAIL_PATTERN.sub("[EMAIL]", redacted)
    redacted = PERSONNUMMER_PATTERN.sub("[PERSONNUMMER]", redacted)
    redacted = PHONE_PATTERN.sub("[PHONE]", redacted)

    return redacted
