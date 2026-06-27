import urllib.request
import json
import os

token = os.environ.get("SLACK_BOT_TOKEN", "")
channel = "C0BDEPWKQB0"  # #agent-coder

req = urllib.request.Request(
    f"https://slack.com/api/conversations.history?channel={channel}&limit=5",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        if data.get("ok"):
            print(json.dumps(data.get("messages"), indent=2))
        else:
            print("Failed to fetch history:", data)
except Exception as e:
    print("Error:", e)
