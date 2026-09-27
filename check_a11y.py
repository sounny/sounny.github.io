import re
import sys

def main():
    try:
        with open('index.html', 'r') as f:
            content = f.read()

        # Find the navToggle button and its contents
        nav_toggle_match = re.search(r'<button class="nav-toggle"[^>]*>([\s\S]*?)</button>', content)
        if not nav_toggle_match:
            print("Error: Could not find nav-toggle button in index.html")
            sys.exit(1)

        btn_content = nav_toggle_match.group(1)

        # Check if it contains an icon with aria-hidden
        icon_match = re.search(r'<i class="[^"]*fa-bars"[^>]*></i>', btn_content)
        if not icon_match:
            print("Error: Could not find fa-bars icon in nav-toggle button")
            sys.exit(1)

        if 'aria-hidden="true"' not in icon_match.group(0):
            print("A11Y Error: Decorative icon in nav-toggle missing aria-hidden=\"true\"")
            sys.exit(1)

        print("A11Y Check Passed: Decorative icon in nav-toggle has aria-hidden=\"true\"")
        sys.exit(0)
    except Exception as e:
        print(f"Error checking accessibility: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
