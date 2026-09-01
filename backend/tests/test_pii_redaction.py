import unittest

from app.services.pii import redact_pii


class PiiRedactionTests(unittest.TestCase):
    def test_redacts_email(self):
        text = "Contact me at anna@example.com"
        self.assertEqual(
            redact_pii(text),
            "Contact me at [EMAIL]",
        )

    def test_redacts_swedish_phone_number(self):
        text = "Ring mig på 070-123 45 67"
        self.assertEqual(
            redact_pii(text),
            "Ring mig på [PHONE]",
        )

    def test_redacts_personnummer(self):
        text = "Mitt personnummer är 19900101-1234"
        self.assertEqual(
            redact_pii(text),
            "Mitt personnummer är [PERSONNUMMER]",
        )

    def test_keeps_normal_text_unchanged(self):
        text = "Vi behöver bättre trappstädning varje vecka."
        self.assertEqual(redact_pii(text), text)


if __name__ == "__main__":
    unittest.main()
