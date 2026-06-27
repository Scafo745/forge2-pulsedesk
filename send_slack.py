#!/usr/bin/env python3
import sys
import os
import urllib.request
import urllib.parse
import json

def post_message(channel, text):
    token = os.getenv("SLACK_BOT_TOKEN")
    if not token:
        # Fallback: try to read from ~/.hermes/.env
        try:
            env_path = os.path.expanduser("~/.hermes/.env")
            if os.path.exists(env_path):
                with open(env_path) as f:
                    for line in f:
                        if line.startswith("SLACK_BOT_TOKEN="):
                            token = line.split("=", 1)[1].strip()
                            break
        except Exception:
            pass

    if not token:
        print("Error: SLACK_BOT_TOKEN not found", file=sys.stderr)
        sys.exit(1)

    data = urllib.parse.urlencode({
        "channel": channel,
        "text": text,
        "unfurl_links": "false",
        "unfurl_media": "false"
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            if res.get("ok"):
                print(f"Successfully posted to {channel}")
                return res
            else:
                print(f"Slack API error: {res.get('error')}", file=sys.stderr)
                sys.exit(1)
    except Exception as e:
        print(f"Network error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: send_slack.py <channel_id_or_name> <message>", file=sys.stderr)
        sys.exit(1)
    
    channel = sys.argv[1]
    message = sys.argv[2]
    post_message(channel, message)
