import urllib.request
import urllib.parse
import json

req = urllib.request.Request("http://127.0.0.1:8000/read_pr_comments", headers={"Content-Type": "application/json"})
response = urllib.request.urlopen(req)
print(response.read().decode("utf-8"))
