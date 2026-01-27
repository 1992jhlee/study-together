from pydantic import EmailStr
import os
import logging

logger = logging.getLogger(__name__)

# SMTP 설정 여부 확인
MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
SMTP_CONFIGURED = bool(MAIL_USERNAME and MAIL_PASSWORD)

if SMTP_CONFIGURED:
    from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
    conf = ConnectionConfig(
        MAIL_USERNAME=MAIL_USERNAME,
        MAIL_PASSWORD=MAIL_PASSWORD,
        MAIL_FROM=os.getenv("MAIL_FROM", MAIL_USERNAME),
        MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
        MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
        MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
        MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
    )
else:
    logger.warning("SMTP not configured. Password reset links will be printed to console.")


async def send_password_reset_email(email: EmailStr, reset_token: str):
    """비밀번호 재설정 이메일 전송"""
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"

    if not SMTP_CONFIGURED:
        print("=" * 60)
        print(f"[PASSWORD RESET] Email: {email}")
        print(f"[PASSWORD RESET] Link: {reset_link}")
        print("=" * 60)
        logger.info(f"Password reset link for {email}: {reset_link}")
        return

    from fastapi_mail import FastMail, MessageSchema, MessageType
    html_body = f"""<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px;">
<h2 style="color: #007bff;">비밀번호 재설정 요청</h2>
<p>비밀번호 재설정을 요청하셨습니다.</p>
<p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:</p>
<p style="text-align: center; margin: 30px 0;">
<a href="{reset_link}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">비밀번호 재설정하기</a>
</p>
<p style="color: #666; font-size: 14px;">
또는 아래 링크를 브라우저에 복사하여 붙여넣으세요:<br>
<a href="{reset_link}" style="color: #007bff;">{reset_link}</a>
</p>
<hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
<p style="color: #999; font-size: 12px;">
이 링크는 1시간 후에 만료됩니다.<br>
만약 비밀번호 재설정을 요청하지 않으셨다면, 이 이메일을 무시해주세요.
</p>
<p style="color: #666; font-size: 14px; margin-top: 30px;">Study Together 팀</p>
</div>
</body>
</html>"""

    message = MessageSchema(
        subject="[Study Together] 비밀번호 재설정",
        recipients=[email],
        body=html_body,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
