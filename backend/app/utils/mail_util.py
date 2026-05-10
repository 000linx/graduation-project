"""
邮件发送工具模块
从 Base_Study/Python/邮件/email.py 重构，避免与标准库 email 模块命名冲突。
"""
import logging
import random
import smtplib
import os
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr

logger = logging.getLogger(__name__)

SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.qq.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '465'))
SENDER_EMAIL = os.getenv('SMTP_SENDER', '1405128011@qq.com')
SENDER_PASSWORD = os.getenv('SMTP_PASSWORD', 'rkguaemrwsijbafa')

MALL_BRAND = '助听器商城 Hearing Aid Mall'


def generate_verify_code():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])


def send_verification_code_email(to_email: str, code: str) -> bool:
    subject = f'{MALL_BRAND} - 邮箱验证码'
    body = f"""您好！

欢迎来到 {MALL_BRAND}！

您正在进行邮箱验证操作，验证码如下：

    【 {code} 】

该验证码 5 分钟内有效，请勿将验证码透露给他人。

如非本人操作，请忽略此邮件。

—— {MALL_BRAND} 团队"""

    message = MIMEText(body, 'plain', 'utf-8')
    message['From'] = formataddr((MALL_BRAND, SENDER_EMAIL))
    message['To'] = to_email
    message['Subject'] = Header(subject, 'utf-8')

    server = None
    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=15)
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.sendmail(SENDER_EMAIL, [to_email], message.as_string())
        return True
    except Exception as e:
        logger.error(f"Failed to send verification code to {to_email}: {e}")
        return False
    finally:
        if server:
            try:
                server.quit()
            except Exception:
                pass
