"""
邮件验证码发送测试脚本（独立运行，不依赖 Flask 应用）。

功能：
- 使用项目 mail_util 模块向指定邮箱发送 6 位验证码
- 记录完整日志：SMTP 连接、认证、发送状态、响应码、耗时
- 捕获完整异常堆栈
- 支持 SMTP 连通性诊断

用法:
    python backend/scripts/test_email_send.py [收件邮箱，默认 1405128011@qq.com]
"""

import logging
import os
import random
import smtplib
import socket
import sys
import time
import traceback
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

TZ = timezone(timedelta(hours=8))
RECIPIENT = sys.argv[1] if len(sys.argv) > 1 else "1405128011@qq.com"

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("email_test")

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.qq.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SENDER_EMAIL = os.getenv("SMTP_SENDER", "1405128011@qq.com")
SENDER_PASSWORD = os.getenv("SMTP_PASSWORD", "rkguaemrwsijbafa")

MALL_BRAND = "助听器商城 Hearing Aid Mall"
TZ_STR = datetime.now(TZ).strftime("%Y-%m-%d %H:%M:%S CST")


def generate_verify_code() -> str:
    return "".join([str(random.randint(0, 9)) for _ in range(6)])


def log_step(step: int, msg: str):
    log.info(f"[步骤 {step}] {msg}")


def diagnose_smtp_connectivity():
    """SMTP 连通性诊断"""
    log.info("=" * 60)
    log.info("SMTP 连通性诊断")
    log.info("=" * 60)

    results = {}

    # 1. DNS 解析
    try:
        ip = socket.getaddrinfo(SMTP_SERVER, SMTP_PORT)
        log.info(f"[诊断] DNS 解析 {SMTP_SERVER} → {ip[0][4]}")
        results["dns"] = "OK"
    except Exception as e:
        log.error(f"[诊断] DNS 解析失败: {e}")
        results["dns"] = f"FAIL: {e}"

    # 2. TCP 连通性
    for port in [465, 587, 25]:
        sock = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)
            sock.connect((SMTP_SERVER, port))
            log.info(f"[诊断] TCP {SMTP_SERVER}:{port} 连通 OK")
            results[f"tcp_{port}"] = "OK"
        except Exception as e:
            log.warning(f"[诊断] TCP {SMTP_SERVER}:{port} 不通: {e}")
            results[f"tcp_{port}"] = f"FAIL: {e}"
        finally:
            if sock:
                sock.close()

    # 3. 环境变量检查
    for var in ["SMTP_SERVER", "SMTP_PORT", "SMTP_SENDER", "SMTP_PASSWORD"]:
        val = os.getenv(var, "")
        masked = val[:4] + "****" if len(val) > 4 else "****"
        log.info(f"[诊断] 环境变量 {var} = {masked}")
        results[f"env_{var}"] = masked

    return results


def send_email_detailed(to_email: str, code: str):
    """发送邮件并记录完整日志"""
    from email.mime.text import MIMEText
    from email.header import Header
    from email.utils import formataddr

    subject = f"{MALL_BRAND} - 邮箱验证码"
    body = f"""您好！

欢迎来到 {MALL_BRAND}！

您正在进行邮箱验证操作，验证码如下：

    【 {code} 】

该验证码 5 分钟内有效，请勿将验证码透露给他人。

如非本人操作，请忽略此邮件。

—— {MALL_BRAND} 团队

发送时间: {TZ_STR}"""

    t_start = time.time()

    # ---- 步骤 1: 构造 MIME 消息 ----
    log_step(1, f"构造 MIME 消息: From={SENDER_EMAIL}, To={to_email}, Subject={subject}")
    message = MIMEText(body, "plain", "utf-8")
    message["From"] = formataddr((MALL_BRAND, SENDER_EMAIL))
    message["To"] = to_email
    message["Subject"] = Header(subject, "utf-8")
    message["Date"] = datetime.now(TZ).strftime("%a, %d %b %Y %H:%M:%S +0800")
    t_construct = time.time()
    log.info(f"[步骤 1] MIME 构造耗时: {t_construct - t_start:.3f}s")

    # ---- 步骤 2: SMTP SSL 连接 ----
    log_step(2, f"SMTP_SSL 连接 {SMTP_SERVER}:{SMTP_PORT} (timeout=15s)")
    server = None
    try:
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, timeout=15)
        log.info(f"[步骤 2] SSL 连接成功，耗时: {time.time() - t_construct:.3f}s")
    except smtplib.SMTPConnectError as e:
        log.error(f"[步骤 2] SMTP 连接失败 (ConnectError): errno={e.errno}, msg={e.strerror}")
        raise
    except socket.timeout as e:
        log.error(f"[步骤 2] SMTP 连接超时 (socket.timeout): {e}")
        raise
    except Exception as e:
        log.error(f"[步骤 2] SMTP_SSL 未知异常: {type(e).__name__}: {e}")
        raise

    # ---- 步骤 3: EHLO 握手（SSL 模式下自动完成，这里显式确认） ----
    log_step(3, "EHLO 握手")
    try:
        code_resp, msg_resp = server.ehlo()
        log.info(f"[步骤 3] EHLO 响应: code={code_resp}, msg={msg_resp.decode() if isinstance(msg_resp, bytes) else msg_resp}")
    except Exception as e:
        log.warning(f"[步骤 3] EHLO 异常（SSL 模式可能已自动完成）: {e}")
    t_ehlo = time.time()

    # ---- 步骤 4: 登录认证 ----
    log_step(4, f"LOGIN 认证: {SENDER_EMAIL}")
    try:
        login_resp = server.login(SENDER_EMAIL, SENDER_PASSWORD)
        log.info(f"[步骤 4] LOGIN 成功，响应: {login_resp}, 耗时: {time.time() - t_ehlo:.3f}s")
    except smtplib.SMTPAuthenticationError as e:
        log.error(f"[步骤 4] 认证失败 (SMTPAuthenticationError): code={e.smtp_code}, msg={e.smtp_error}")
        raise
    except Exception as e:
        log.error(f"[步骤 4] LOGIN 未知异常: {type(e).__name__}: {e}")
        raise
    t_login = time.time()

    # ---- 步骤 5: 发送邮件 ----
    log_step(5, f"发送邮件: {SENDER_EMAIL} → {to_email}")
    try:
        send_refused = server.sendmail(SENDER_EMAIL, [to_email], message.as_string())
        if send_refused:
            log.warning(f"[步骤 5] 部分收件人被拒绝: {send_refused}")
        else:
            log.info(f"[步骤 5] sendmail 返回空字典，所有收件人均已接受")
        log.info(f"[步骤 5] 发送耗时: {time.time() - t_login:.3f}s")
    except smtplib.SMTPRecipientsRefused as e:
        log.error(f"[步骤 5] 收件人被拒绝: {e.recipients}")
        raise
    except smtplib.SMTPSenderRefused as e:
        log.error(f"[步骤 5] 发件人被拒绝: code={e.smtp_code}, msg={e.smtp_error}")
        raise
    except smtplib.SMTPDataError as e:
        log.error(f"[步骤 5] SMTP 数据错误: code={e.smtp_code}, msg={e.smtp_error}")
        raise
    except Exception as e:
        log.error(f"[步骤 5] 发送未知异常: {type(e).__name__}: {e}")
        raise
    t_send = time.time()

    # ---- 步骤 6: QUIT ----
    log_step(6, "QUIT 断开连接")
    try:
        server.quit()
        log.info(f"[步骤 6] QUIT 成功，总耗时: {t_send - t_start:.3f}s")
    except Exception as e:
        log.warning(f"[步骤 6] QUIT 异常: {e}")

    return t_send - t_start


def main():
    log.info("=" * 60)
    log.info(f"邮件验证码发送测试 — 开始")
    log.info(f"  SMTP 服务器: {SMTP_SERVER}:{SMTP_PORT} (SSL)")
    log.info(f"  发件人: {SENDER_EMAIL}")
    log.info(f"  收件人: {RECIPIENT}")
    log.info(f"  时间: {TZ_STR}")
    log.info("=" * 60)

    # 诊断
    diag = diagnose_smtp_connectivity()

    # 生成验证码
    code = generate_verify_code()
    log.info(f"[准备] 生成验证码: {code}")

    # 发送
    log.info("")
    log.info("=" * 60)
    log.info("开始发送邮件")
    log.info("=" * 60)

    last_error = None
    for attempt in range(1, 4):
        log.info(f"\n>>> 第 {attempt} 次尝试 <<<")
        try:
            elapsed = send_email_detailed(RECIPIENT, code)
            log.info("")
            log.info("=" * 60)
            log.info(f"✅ 邮件发送成功！验证码: {code}")
            log.info(f"   总耗时: {elapsed:.3f}s")
            log.info(f"   请检查 {RECIPIENT} 收件箱（含垃圾邮件箱）")
            log.info(f"   验证码 5 分钟内有效")
            log.info("=" * 60)

            return 0
        except Exception as e:
            last_error = e
            log.error("")
            log.error("!" * 60)
            log.error(f"❌ 第 {attempt} 次发送失败")
            log.error(f"   异常类型: {type(e).__name__}")
            log.error(f"   异常信息: {e}")
            log.error("!" * 60)
            log.error("完整堆栈:")
            traceback.print_exc()
            if attempt < 3:
                wait = attempt * 3
                log.info(f"等待 {wait}s 后重试...")
                time.sleep(wait)

    # 全部失败，输出分析
    log.error("")
    log.error("=" * 60)
    log.error("⚠️ 连续 3 次失败，问题分析：")
    log.error("=" * 60)

    err_msg = str(last_error).lower() if last_error else ""
    err_type = type(last_error).__name__ if last_error else "Unknown"

    if "authentication" in err_msg or "535" in err_msg:
        log.error("→ 认证失败：授权码/密码错误或已失效。")
        log.error("  修复: 登录 QQ 邮箱 → 设置 → 账户 → POP3/SMTP 服务 → 生成新授权码")
        log.error(f"  然后设置环境变量: $env:SMTP_PASSWORD='新授权码'")
    elif "connect" in err_msg or "timeout" in err_msg or "refused" in err_msg:
        log.error("→ 网络连接失败：无法连接到 SMTP 服务器。")
        log.error(f"  检查: {SMTP_SERVER}:{SMTP_PORT} 是否可达")
        log.error("  可能原因: 防火墙阻止、VPN 干扰、QQ SMTP 限流")
    elif "recipient" in err_msg or "refused" in err_msg:
        log.error("→ 收件人地址被拒绝。")
        log.error(f"  检查: {RECIPIENT} 是否有效、是否开启了邮箱、是否在 QQ 邮箱黑名单")
    elif diag.get("tcp_465") != "OK" and diag.get("tcp_587") != "OK":
        log.error("→ 网络不通：所有 SMTP 端口均无法连接。")
        log.error("  可能原因: 企业网络出口限制、Windows 防火墙、云服务器安全组")
    else:
        log.error(f"→ 未识别错误类型: {err_type}: {last_error}")
        log.error("  建议: 检查 QQ 邮箱 SMTP 服务是否开启、授权码是否正确")

    return 1


if __name__ == "__main__":
    sys.exit(main())
