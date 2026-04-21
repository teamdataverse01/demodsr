import os
import json
import urllib.request

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY
)


def generate_draft(
    request_type: str,
    subject_name: str,
    subject_email: str,
    request_description: str,
) -> str:
    if not GEMINI_API_KEY:
        return ""

    type_label = request_type.replace("_", " ")
    prompt = (
        f"You are a Data Protection Officer at Covenant University. "
        f"Draft a professional, compliant response to this Data Subject Request.\n\n"
        f"Request type: {type_label}\n"
        f"Subject name: {subject_name}\n"
        f"Subject email: {subject_email}\n"
        f"Subject's description: {request_description}\n\n"
        f"Write a clear, empathetic response (2-3 paragraphs). "
        f"Reference NDPR (Nigeria Data Protection Regulation) compliance. "
        f"Do not include a subject line or email headers — just the body."
    )

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}]
    }).encode()

    req = urllib.request.Request(
        GEMINI_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return ""
