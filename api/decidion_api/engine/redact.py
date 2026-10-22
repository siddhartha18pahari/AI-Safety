"""Pattern-based PII and PHI detection. Not a clinical NLP or enterprise DLP product."""

from __future__ import annotations

import re
from dataclasses import dataclass


@dataclass
class Redaction:
    arguments: dict | list | str | int | float | bool | None
    prompt: str | None
    labels: list[str]


_EMAIL = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
_SSN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_PHONE = re.compile(r"\b(?:\+1[-.\s])?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b")
_CARD = re.compile(r"\b(?:\d[ -]*?){13,19}\b")
_MRN = re.compile(r"\bMRN[:\s#]*[A-Z0-9]{5,}\b", re.I)
_DOB = re.compile(r"\bDOB[:\s]+\d{4}-\d{2}-\d{2}\b", re.I)
_DIAG = re.compile(r"\b(?:diagnosis|diagnosed|ICD-10)[:\s]+[A-Z0-9.]{3,}\b", re.I)

PHI_LABELS = {"MRN", "DOB", "DIAGNOSIS"}
PII_LABELS = {"EMAIL", "SSN", "PHONE", "CARD"}
EXTERNAL_TOOLS = {
    "send_email",
    "share_external",
    "http_post",
    "post_slack",
    "export_phi",
    "export_csv",
}


def _luhn_ok(raw: str) -> bool:
    digits = [int(c) for c in raw if c.isdigit()]
    if not 13 <= len(digits) <= 16:
        return False
    total = 0
    for index, digit in enumerate(reversed(digits)):
        if index % 2 == 1:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0


def _sub_card(match: re.Match[str]) -> str:
    if _luhn_ok(match.group(0)):
        return "[CARD]"
    return match.group(0)


def redact_text(value: str) -> tuple[str, list[str]]:
    labels: list[str] = []

    def mark(label: str):
        def _replace(_: re.Match[str]) -> str:
            labels.append(label)
            return f"[{label}]"

        return _replace

    text = _EMAIL.sub(mark("EMAIL"), value)
    text = _SSN.sub(mark("SSN"), text)
    text = _PHONE.sub(mark("PHONE"), text)
    text = _MRN.sub(mark("MRN"), text)
    text = _DOB.sub(mark("DOB"), text)
    text = _DIAG.sub(mark("DIAGNOSIS"), text)
    if _CARD.search(text):
        replaced = _CARD.sub(_sub_card, text)
        if replaced != text:
            labels.append("CARD")
            text = replaced
    return text, labels


def _walk(value):
    if isinstance(value, str):
        redacted, labels = redact_text(value)
        return redacted, labels
    if isinstance(value, list):
        labels: list[str] = []
        items = []
        for item in value:
            redacted, found = _walk(item)
            items.append(redacted)
            labels.extend(found)
        return items, labels
    if isinstance(value, dict):
        labels = []
        out = {}
        for key, item in value.items():
            redacted, found = _walk(item)
            out[key] = redacted
            labels.extend(found)
        return out, labels
    return value, []


def redact_payload(arguments: dict, prompt: str | None) -> Redaction:
    redacted_args, labels = _walk(arguments or {})
    redacted_prompt = prompt
    if prompt:
        redacted_prompt, found = redact_text(prompt)
        labels.extend(found)
    # Preserve first-seen order.
    unique: list[str] = []
    for label in labels:
        if label not in unique:
            unique.append(label)
    return Redaction(arguments=redacted_args, prompt=redacted_prompt, labels=unique)
