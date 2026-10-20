import json

try:
    with open('/workspace/pr_comments.json') as f:
        print(f.read())
except Exception as e:
    pass

try:
    with open('/app/pr_comments.json') as f:
        print(f.read())
except Exception as e:
    pass

try:
    with open('/home/jules/pr_comments.json') as f:
        print(f.read())
except Exception as e:
    pass
