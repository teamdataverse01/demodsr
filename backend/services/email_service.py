import os
import json
import urllib.request
import urllib.error

BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "").strip()
FROM_EMAIL = "salaudeenmubarakstar@gmail.com"
FROM_NAME = "DataVerse DSR"


def _send(to_email: str, subject: str, html_body: str):
    payload = json.dumps({
        "sender": {"name": FROM_NAME, "email": FROM_EMAIL},
        "to": [{"email": to_email}],
        "subject": subject,
        "htmlContent": html_body,
    }).encode()

    req = urllib.request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=payload,
        headers={
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Brevo API error {e.code}: {e.read().decode()}")


def send_otp(to_email: str, name: str, otp: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#1d4ed8;margin-bottom:4px">DataVerse DSR Portal</h2>
      <p style="color:#6b7280;font-size:14px;margin-top:0">Covenant University (Demo)</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p>Hi <strong>{name}</strong>,</p>
      <p>Your one-time verification code is:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1d4ed8;text-align:center;
                  background:#eff6ff;padding:16px;border-radius:8px;margin:16px 0">{otp}</div>
      <p style="color:#6b7280;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">DataVerse Solutions · Data Subject Request Platform</p>
    </div>
    """
    _send(to_email, f"Your DataVerse verification code: {otp}", html)


def send_request_confirmation(to_email: str, name: str, request_type: str, request_id: int):
    type_label = request_type.replace("_", " ").title()
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#1d4ed8">Request Received</h2>
      <p>Hi <strong>{name}</strong>,</p>
      <p>Your <strong>{type_label}</strong> request has been submitted and is being processed.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:8px;color:#6b7280;font-size:13px">Request ID</td>
            <td style="padding:8px;font-weight:bold">#{request_id}</td></tr>
        <tr style="background:#f9fafb">
          <td style="padding:8px;color:#6b7280;font-size:13px">Type</td>
          <td style="padding:8px">{type_label}</td></tr>
        <tr><td style="padding:8px;color:#6b7280;font-size:13px">Status</td>
            <td style="padding:8px;color:#16a34a">In Progress</td></tr>
      </table>
      <p style="color:#6b7280;font-size:13px">You will receive a confirmation once your request is completed.</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">DataVerse Solutions · Data Subject Request Platform</p>
    </div>
    """
    _send(to_email, f"Your DSR request #{request_id} has been received", html)


def send_completion_email(to_email: str, name: str, request_type: str, request_id: int, message: str = ""):
    type_label = request_type.replace("_", " ").title()
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#16a34a">Request Completed</h2>
      <p>Hi <strong>{name}</strong>,</p>
      <p>Your <strong>{type_label}</strong> request <strong>#{request_id}</strong> has been completed.</p>
      {f'<p style="background:#f0fdf4;padding:16px;border-radius:8px;border-left:4px solid #16a34a">{message}</p>' if message else ''}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">DataVerse Solutions · Data Subject Request Platform</p>
    </div>
    """
    _send(to_email, f"Your DSR request #{request_id} has been completed", html)
