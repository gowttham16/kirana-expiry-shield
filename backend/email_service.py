import smtplib
from email.mime.text import MIMEText
import os

def send_critical_alert(product_name: str, days_left: int):
    sender_email = os.getenv("GMAIL_ADDRESS")
    app_password = os.getenv("GMAIL_APP_PASSWORD") # Get this from Google Account Security
    
    body = f"URGENT: Your stock of {product_name} expires in {days_left} days. Please apply a discount or move it to the front of the shelf."
    msg = MIMEText(body)
    msg['Subject'] = f"🔴 Critical Expiry Alert: {product_name}"
    msg['From'] = sender_email
    msg['To'] = sender_email # Sending to yourself (the owner)
    
    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, app_password)
            server.send_message(msg)
            print("✅ Email alert sent successfully.")
    except Exception as e:
        print(f"❌ Email failed: {e}")