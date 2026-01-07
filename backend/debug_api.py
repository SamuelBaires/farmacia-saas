
import urllib.request
import urllib.parse
import json
import urllib.error

BASE_URL = "http://localhost:8000/api"

def debug_api():
    print(f"Testing API at {BASE_URL}")
    
    # 1. Login
    try:
        login_url = f"{BASE_URL}/auth/login"
        login_data = json.dumps({"username": "admin", "password": "admin123"}).encode('utf-8')
        req = urllib.request.Request(login_url, data=login_data, headers={'Content-Type': 'application/json'})
        
        print(f"Attempting login...")
        with urllib.request.urlopen(req) as response:
            print(f"Login Response Status: {response.status}")
            response_body = response.read()
            token_data = json.loads(response_body)
            token = token_data["access_token"]
            print("Login success! Token received.")
        
        # 2. Get Medicamentos
        meds_url = f"{BASE_URL}/medicamentos"
        req = urllib.request.Request(meds_url, headers={"Authorization": f"Bearer {token}"})
        print("Fetching medicamentos...")
        with urllib.request.urlopen(req) as response:
            print(f"Medicamentos Response Status: {response.status}")
            response_body = response.read()
            data = json.loads(response_body)
            print(f"Medicamentos found: {len(data)}")
            if len(data) > 0:
                print(f"Sample: {data[0]['nombre_comercial']}")
                
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        print(e.read().decode())
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api()
