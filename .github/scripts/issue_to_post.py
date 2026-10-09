#!/usr/bin/env python3
"""
Turn a "blog-post" issue (created from the New blog post form) into Jekyll
post files for the website.

Input (environment variables):
  ISSUE_JSON      the GitHub event's issue object as JSON (required)
  DEEPL_API_KEY   DeepL API key; when missing or failing, no Japanese file is written
  GITHUB_TOKEN    used as a fallback when downloading issue attachments
  GITHUB_OUTPUT   path of the step-output file (set by GitHub Actions)

Output (files, relative to the repository root):
  _posts/blog/<date>-<slug>.md       English post (the original text)
  _posts/ja/blog/<date>-<slug>.md    Japanese post (machine translation)
  images/blog/<slug>/image-N.<ext>   photos attached to the issue

Standard library only, so it runs on a plain GitHub Actions runner.
"""

import datetime
import html
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[2]
EN_DIR = ROOT / "_posts" / "blog"
JA_DIR = ROOT / "_posts" / "ja" / "blog"
IMG_DIR = ROOT / "images" / "blog"
TYPES_FILE = ROOT / "_data" / "blog_types.yml"
SITE_URL = "https://ithems-math-soc.github.io"

# Field labels as they appear in .github/ISSUE_TEMPLATE/blog-post.yml.
FIELDS = {"Type", "Date", "Author", "Link", "Link label", "Body"}
NO_RESPONSE = "_No response_"

IMAGE_HOSTS = (
    "github.com/user-attachments/",
    "user-images.githubusercontent.com/",
    "private-user-images.githubusercontent.com/",
)

warnings: list[str] = []


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def fail(message: str) -> None:
    print(f"::error::{message}")
    sys.exit(1)


def set_output(name: str, value: str) -> None:
    value = str(value).replace("\r", " ").replace("\n", " ")
    out = os.environ.get("GITHUB_OUTPUT")
    if out:
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(f"{name}={value}\n")
    print(f"{name}={value}")


def load_types() -> list[str]:
    """Read the allowed post types from _data/blog_types.yml (no YAML lib needed)."""
    types = re.findall(r"^- key:\s*(\S+)", TYPES_FILE.read_text(encoding="utf-8"), flags=re.M)
    if not types:
        fail(f"No post types found in {TYPES_FILE}")
    return types


def parse_form(body: str) -> dict[str, str]:
    """Split an issue-form body into {field label: value}."""
    sections: dict[str, list[str]] = {}
    current = None
    for line in body.splitlines():
        m = re.match(r"^### (.+?)\s*$", line)
        if m and m.group(1).strip() in FIELDS:
            current = m.group(1).strip()
            sections[current] = []
            continue
        if current is not None:
            sections[current].append(line)
    result = {}
    for key, lines in sections.items():
        value = "\n".join(lines).strip()
        result[key] = "" if value == NO_RESPONSE else value
    return result


def slugify(text: str, fallback: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    slug = re.sub(r"[^A-Za-z0-9]+", "-", ascii_text).strip("-").lower()
    slug = slug[:60].rstrip("-")
    return slug or fallback


def clean_title(raw: str) -> str:
    title = re.sub(r"^\s*\[blog\]\s*:?\s*", "", raw, flags=re.I).strip()
    return title


def parse_date(value: str) -> datetime.date:
    if not value:
        return datetime.datetime.now(ZoneInfo("Asia/Tokyo")).date()
    try:
        return datetime.date.fromisoformat(value.strip())
    except ValueError:
        fail(f"Date must be YYYY-MM-DD, got: {value!r}")
    return datetime.date.today()  # unreachable, keeps type checkers quiet


def yaml_str(value) -> str:
    """A JSON string is a valid double-quoted YAML scalar."""
    return json.dumps(str(value), ensure_ascii=False)


def front_matter(fields: dict) -> str:
    lines = ["---"]
    for key, value in fields.items():
        if value is None or value == "" or value == []:
            continue
        if isinstance(value, bool):
            lines.append(f"{key}: {'true' if value else 'false'}")
        elif isinstance(value, int):
            lines.append(f"{key}: {value}")
        elif isinstance(value, list):
            lines.append(f"{key}: [{', '.join(value)}]")
        elif isinstance(value, dict):
            lines.append(f"{key}:")
            for sub_key, sub_value in value.items():
                if sub_value:
                    lines.append(f"  {sub_key}: {yaml_str(sub_value)}")
        else:
            lines.append(f"{key}: {yaml_str(value)}")
    lines.append("---")
    return "\n".join(lines)


def find_existing(issue_number: int) -> list[Path]:
    """Posts previously generated from this issue (so edits replace, not duplicate)."""
    found = []
    for directory in (EN_DIR, JA_DIR):
        if not directory.exists():
            continue
        for path in directory.glob("*.md"):
            head = path.read_text(encoding="utf-8")[:2000]
            if re.search(rf"^issue:\s*{issue_number}\s*$", head, flags=re.M):
                found.append(path)
    return found


def is_hand_edited(path: Path) -> bool:
    """
    True when a Japanese file was edited by a person and must not be regenerated.
    People mark this by setting `machine_translation: false` in the front matter.
    """
    head = path.read_text(encoding="utf-8")[:2000]
    return re.search(r"^machine_translation:\s*false\s*$", head, flags=re.M) is not None


def slug_from_filename(path: Path) -> str:
    return re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)


# --------------------------------------------------------------------------
# Images
# --------------------------------------------------------------------------

MAGIC = (
    (b"\x89PNG", ".png"),
    (b"\xff\xd8", ".jpg"),
    (b"GIF8", ".gif"),
    (b"RIFF", ".webp"),
)
CONTENT_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
}


def download_image(url: str, dest_stem: Path) -> Path | None:
    token = os.environ.get("GITHUB_TOKEN", "")
    attempts = [{}]
    if token:
        attempts.append({"Authorization": f"Bearer {token}"})
    last_error: Exception | None = None
    for extra in attempts:
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "mss-blog-bot", **extra})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
                ctype = resp.headers.get_content_type()
            ext = next((e for magic, e in MAGIC if data.startswith(magic)), None)
            if ext is None:
                ext = CONTENT_TYPES.get(ctype)
            if ext is None:
                raise ValueError(f"not an image (content-type {ctype})")
            dest = dest_stem.with_suffix(ext)
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            return dest
        except Exception as exc:  # noqa: BLE001 - we report and fall back
            last_error = exc
    warnings.append(f"could not download image {url} ({last_error}); kept the original URL")
    return None


def localise_images(body: str, slug: str) -> str:
    """
    Download images attached to the issue into images/blog/<slug>/ and point the
    Markdown at the local copies. The site uses the first image in the body as
    the post's thumbnail, so nothing else is recorded.
    """
    # Normalise HTML <img> tags (GitHub inserts these for some uploads) to Markdown.
    body = re.sub(
        r"<img\b[^>]*\bsrc=\"([^\"]+)\"[^>]*>",
        lambda m: f"![]({m.group(1)})",
        body,
        flags=re.I,
    )

    img_dir = IMG_DIR / slug
    if img_dir.exists():
        for old in img_dir.iterdir():
            old.unlink()

    counter = {"n": 0}

    def replace(match: re.Match) -> str:
        alt, url = match.group(1), match.group(2).strip()
        if not any(host in url for host in IMAGE_HOSTS):
            return match.group(0)
        counter["n"] += 1
        saved = download_image(url, img_dir / f"image-{counter['n']}")
        if saved is None:
            return match.group(0)
        rel = saved.relative_to(IMG_DIR).as_posix()
        return f"![{alt}](/images/blog/{rel})"

    body = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)(?:\s+\"[^\"]*\")?\)", replace, body)

    if img_dir.exists() and not any(img_dir.iterdir()):
        img_dir.rmdir()
    return body


# --------------------------------------------------------------------------
# Translation (DeepL)
# --------------------------------------------------------------------------

def protect_markdown(text: str) -> tuple[str, list[str]]:
    """
    Wrap parts that must not be translated (images, link targets, code, URLs)
    in <keep> tags that DeepL is told to ignore. Everything is XML-escaped
    first because we send the text with tag_handling=xml.
    """
    tokens: list[str] = []

    def keep(match: re.Match) -> str:
        tokens.append(match.group(0))
        return f"<keep>{len(tokens) - 1}</keep>"

    text = html.escape(text, quote=False)
    text = re.sub(r"```.*?```", keep, text, flags=re.S)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", keep, text)      # images: whole thing
    text = re.sub(r"\]\([^)]*\)", keep, text)                # links: keep the (url) part only
    text = re.sub(r"`[^`\n]*`", keep, text)                  # inline code
    text = re.sub(r"https?://[^\s<)]+", keep, text)          # bare URLs
    return text, tokens


def restore_markdown(text: str, tokens: list[str]) -> str:
    text = re.sub(r"<keep>\s*(\d+)\s*</keep>", lambda m: tokens[int(m.group(1))], text)
    return html.unescape(text)


def deepl_translate(texts: list[str], api_key: str) -> list[str] | None:
    endpoint = (
        "https://api-free.deepl.com/v2/translate"
        if api_key.endswith(":fx")
        else "https://api.deepl.com/v2/translate"
    )
    payload = {
        "text": texts,
        "source_lang": "EN",
        "target_lang": "JA",
        "tag_handling": "xml",
        "ignore_tags": ["keep"],
        "preserve_formatting": True,
    }
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"DeepL-Auth-Key {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "mss-blog-bot",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return [item["text"] for item in data["translations"]]
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:300]
        warnings.append(f"DeepL request failed (HTTP {exc.code}): {detail}")
    except Exception as exc:  # noqa: BLE001
        warnings.append(f"DeepL request failed: {exc}")
    return None


def translate_post(title: str, body: str, link_label: str) -> tuple[str, str, str] | None:
    api_key = os.environ.get("DEEPL_API_KEY", "").strip()
    if not api_key:
        warnings.append("DEEPL_API_KEY is not set, so no Japanese version was generated")
        return None
    protected_body, tokens = protect_markdown(body)
    texts = [html.escape(title, quote=False), protected_body]
    if link_label:
        texts.append(html.escape(link_label, quote=False))
    result = deepl_translate(texts, api_key)
    if result is None or len(result) != len(texts):
        return None
    ja_title = html.unescape(result[0])
    ja_body = restore_markdown(result[1], tokens)
    ja_label = html.unescape(result[2]) if link_label else ""
    return ja_title, ja_body, ja_label


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main() -> None:
    raw = os.environ.get("ISSUE_JSON")
    if not raw:
        fail("ISSUE_JSON is not set")
    issue = json.loads(raw)
    number = int(issue["number"])
    types = load_types()

    title = clean_title(issue.get("title") or "")
    if not title:
        fail("The issue title is empty. Replace '[Blog] ' with the post title.")

    form = parse_form(issue.get("body") or "")
    post_type = form.get("Type", "").strip()
    if post_type not in types:
        fail(f"Type must be one of {', '.join(types)}; got {post_type!r}")
    date = parse_date(form.get("Date", ""))
    author = form.get("Author", "").strip()
    link = form.get("Link", "").strip()
    link_label = form.get("Link label", "").strip()
    body = form.get("Body", "").strip()
    if not body:
        fail("The Body field is empty.")

    # Remove files generated by an earlier run for this issue. A Japanese file
    # that a person has edited (machine_translation: false) is kept as it is.
    old_files = find_existing(number)
    old_slug = slug_from_filename(old_files[0]) if old_files else None
    kept_ja: str | None = None
    for path in old_files:
        if path.parent == JA_DIR and is_hand_edited(path):
            kept_ja = path.read_text(encoding="utf-8")
            warnings.append(
                "the Japanese version was edited by hand, so it was kept and not re-translated"
            )
        path.unlink()

    slug = slugify(title, f"post-{number}")
    en_path = EN_DIR / f"{date.isoformat()}-{slug}.md"
    if en_path.exists():  # another issue already owns this slug
        slug = f"{slug}-{number}"
        en_path = EN_DIR / f"{date.isoformat()}-{slug}.md"
    ja_path = JA_DIR / en_path.name

    if old_slug and old_slug != slug and (IMG_DIR / old_slug).exists():
        for old in (IMG_DIR / old_slug).iterdir():
            old.unlink()
        (IMG_DIR / old_slug).rmdir()

    body = localise_images(body, slug)

    en_url = f"{SITE_URL}/blog/{slug}/"
    ja_url = f"{SITE_URL}/ja/blog/{slug}/"

    translation = None if kept_ja else translate_post(title, body, link_label)
    has_ja = bool(translation or kept_ja)

    EN_DIR.mkdir(parents=True, exist_ok=True)
    en_fm = {
        "layout": "blog",
        "title": title,
        "type": post_type,
        "lang": "en",
        "categories": "blog",
        "author": author,
        "link": link,
        "link_label": link_label if link else "",
        "translation_url": f"/ja/blog/{slug}/" if has_ja else "",
        "issue": number,
    }
    en_path.write_text(front_matter(en_fm) + "\n\n" + body.rstrip() + "\n", encoding="utf-8")
    print(f"wrote {en_path.relative_to(ROOT)}")

    if kept_ja:
        # Same text as before; only the link back to the English post may change.
        kept_ja = re.sub(
            r"^translation_url:.*$", f"translation_url: {yaml_str(f'/blog/{slug}/')}", kept_ja, count=1, flags=re.M
        )
        JA_DIR.mkdir(parents=True, exist_ok=True)
        ja_path.write_text(kept_ja, encoding="utf-8")
        print(f"kept {ja_path.relative_to(ROOT)} (hand-edited)")
    elif translation:
        ja_title, ja_body, ja_label = translation
        JA_DIR.mkdir(parents=True, exist_ok=True)
        ja_fm = {
            "layout": "blog",
            "title": ja_title,
            "type": post_type,
            "lang": "ja",
            "categories": ["ja", "blog"],
            "site_title": "数理社会科学チーム",
            "author": author,
            "link": link,
            "link_label": (ja_label or link_label) if link else "",
            "translation_url": f"/blog/{slug}/",
            "issue": number,
            # Set to false after editing the Japanese text by hand: the file is
            # then kept when the issue is edited, and the disclaimer disappears.
            "machine_translation": True,
        }
        ja_path.write_text(front_matter(ja_fm) + "\n\n" + ja_body.rstrip() + "\n", encoding="utf-8")
        print(f"wrote {ja_path.relative_to(ROOT)}")

    set_output("title", title)
    set_output("slug", slug)
    set_output("en_path", en_path.relative_to(ROOT).as_posix())
    set_output("ja_path", ja_path.relative_to(ROOT).as_posix() if has_ja else "")
    set_output("en_url", en_url)
    set_output("ja_url", ja_url if has_ja else "")
    set_output("translated", "true" if has_ja else "false")
    set_output("warnings", "; ".join(warnings))


if __name__ == "__main__":
    main()
