import requests
import re
import json

shortcode = "DWMt1h-jPOC"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-IG-App-ID": "936619743392459",
}

print("=== Try: Instagram API ===")
try:
    r = requests.get(
        f"https://www.instagram.com/p/{shortcode}/?__a=1&__d=dis",
        headers=headers,
        timeout=15,
    )
    print("STATUS:", r.status_code)
    if r.status_code == 200:
        try:
            data = json.loads(r.text)
            print("KEYS:", list(data.keys())[:10])
            if "graphql" in data:
                media = data["graphql"]["shortcode_media"]
                print("TYPE:", media.get("__typename"))
                print("DISPLAY:", media.get("display_url", "?")[:150])
            elif "items" in data:
                item = data["items"][0]
                print("TYPE:", item.get("media_type"))
                if "image_versions2" in item:
                    candidates = item["image_versions2"]["candidates"]
                    print("IMAGE URL:", candidates[0]["url"][:150])
                    print("RESOLUTION:", candidates[0].get("width"), "x", candidates[0].get("height"))
        except json.JSONDecodeError:
            print("NOT JSON, first 300 chars:", r.text[:300])
    else:
        print("RESPONSE:", r.text[:300])
except Exception as e:
    print("ERROR:", e)

print("\n=== Try: Instagram embed with media_info ===")
try:
    r = requests.get(
        f"https://i.instagram.com/api/v1/media/{shortcode}/info/",
        headers={**headers, "X-IG-App-ID": "936619743392459"},
        timeout=15,
    )
    print("STATUS:", r.status_code)
    if r.status_code == 200:
        data = json.loads(r.text)
        print("KEYS:", list(data.keys())[:10])
except Exception as e:
    print("ERROR:", e)
