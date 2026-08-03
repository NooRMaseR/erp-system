import re

value = "PAY-2026-06"
print(re.match(r"^PAY\-\d{4}\-\d{2}$", value))