#!/usr/bin/env python3
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

REQUIRED_IDS = {
    "hero-terminal",
    "menu-btn",
    "mobile-menu",
    "writeup-grid",
    "writeup-list-view",
    "writeup-detail-view",
}
EXPECTED_SCRIPT_ORDER = (
    "https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.umd.min.js",
    "assets/js/motion.js",
    "assets/js/main.js",
)


class IndexCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.scripts = []
        self.local_refs = []
        self.skill_levels = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)

        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])

        for attr in ("src", "href"):
            value = values.get(attr)
            if value and self._is_local_ref(value):
                self.local_refs.append(value)

        if values.get("data-skill-level") is not None:
            self.skill_levels.append(values["data-skill-level"])

    @staticmethod
    def _is_local_ref(value):
        parsed = urlsplit(value)
        return (
            not parsed.scheme
            and not parsed.netloc
            and not value.startswith(("#", "mailto:", "tel:", "javascript:"))
        )


def fail(message):
    raise SystemExit(f"validation failed: {message}")


def main():
    parser = IndexCollector()
    parser.feed(INDEX.read_text(encoding="utf-8"))

    duplicates = sorted({value for value in parser.ids if parser.ids.count(value) > 1})
    if duplicates:
        fail(f"duplicate HTML ids: {', '.join(duplicates)}")

    missing_ids = sorted(REQUIRED_IDS.difference(parser.ids))
    if missing_ids:
        fail(f"missing motion hook ids: {', '.join(missing_ids)}")

    positions = []
    for script in EXPECTED_SCRIPT_ORDER:
        try:
            positions.append(parser.scripts.index(script))
        except ValueError:
            fail(f"missing script: {script}")
    if positions != sorted(positions):
        fail("Anime.js, motion.js, and main.js are loaded in the wrong order")

    for ref in parser.local_refs:
        path = urlsplit(ref).path.lstrip("/")
        if not (ROOT / path).exists():
            fail(f"missing local asset referenced by index.html: {ref}")

    if not parser.skill_levels:
        fail("no terminal skill levels found")

    for raw_level in parser.skill_levels:
        try:
            level = float(raw_level)
        except ValueError:
            fail(f"invalid terminal skill level: {raw_level}")
        if not 0 <= level <= 100:
            fail(f"terminal skill level out of range: {raw_level}")

    print(
        f"validated index.html: {len(parser.ids)} ids, "
        f"{len(parser.local_refs)} local assets, "
        f"{len(parser.skill_levels)} skill levels"
    )


if __name__ == "__main__":
    main()
