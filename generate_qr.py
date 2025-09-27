import socket
import qrcode
import os
import time

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def generate_qr_code(url, filename="billing_system_qr.png"):
    filename = os.path.abspath(filename)
    #print(f"Saving QR code to: {filename}")
    img = qrcode.make(url)
    img.save(filename)
    print(f"QR code saved as {filename}")
    #print(f"File last modified: {time.ctime(os.path.getmtime(filename))}")

if __name__ == "__main__":
    #print("Current working directory:", os.getcwd())
    ip = get_local_ip()
    url = f"http://{ip}:3000/login.html"
    print(f"Generating QR code for: {url}")
    generate_qr_code(url)