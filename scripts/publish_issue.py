import json
import os
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo


def field(body: str, label: str) -> str:
    pattern = rf"### {re.escape(label)}\s*\n+(.*?)(?=\n+### |\Z)"
    match = re.search(pattern, body, flags=re.DOTALL)
    if not match:
        return ""
    value = match.group(1).strip()
    return "" if value == "_No response_" else value


event = json.loads(Path(os.environ["GITHUB_EVENT_PATH"]).read_text(encoding="utf-8"))
issue = event["issue"]
form = issue.get("body") or ""

title = field(form, "記事タイトル")
mood = field(form, "今日の気分")
tags_text = field(form, "タグ")
article = field(form, "本文")

if not title or not article:
    raise SystemExit("記事タイトルまたは本文が見つかりません。")

created = datetime.fromisoformat(issue["created_at"].replace("Z", "+00:00")).astimezone(ZoneInfo("Asia/Tokyo"))
date_text = created.strftime("%Y-%m-%d %H:%M:%S %z")
filename = f"{created:%Y-%m-%d}-post-{issue['number']}.md"

tags = [tag.strip() for tag in re.split(r"[,、，]", tags_text) if tag.strip()]
front_matter = [
    "---",
    f"title: {json.dumps(title, ensure_ascii=False)}",
    f"date: {date_text}",
    f"tags: {json.dumps(tags, ensure_ascii=False)}",
]
if mood:
    front_matter.append(f"mood: {json.dumps(mood, ensure_ascii=False)}")
front_matter.extend(["---", ""])

excerpt_marker = "\n\n<!--more-->\n\n"
if "<!--more-->" not in article:
    paragraphs = re.split(r"\n\s*\n", article, maxsplit=1)
    article = paragraphs[0] + excerpt_marker + (paragraphs[1] if len(paragraphs) > 1 else "")

post_path = Path("_posts") / filename
post_path.write_text("\n".join(front_matter) + article.strip() + "\n", encoding="utf-8")

output_path = Path(os.environ["GITHUB_OUTPUT"])
with output_path.open("a", encoding="utf-8") as output:
    output.write(f"title={title.replace(chr(10), ' ')}\n")
    output.write(f"file={post_path.as_posix()}\n")

