"""Load and parse SKILL.md files from the Asgard Skills library."""

import os
import re
from dataclasses import dataclass, field
from typing import Optional

import yaml


@dataclass
class Skill:
    name: str
    description: str
    body: str
    path: str
    category: str = ""
    tags: list = field(default_factory=list)

    def __repr__(self):
        return f"Skill(name={self.name!r}, category={self.category!r})"


def _parse_frontmatter(content: str) -> tuple[dict, str]:
    """Split YAML frontmatter from body. Returns (frontmatter_dict, body)."""
    if not content.startswith("---"):
        return {}, content

    match = re.match(r"^---\n(.*?)\n---\n?", content, re.DOTALL)
    if not match:
        return {}, content

    try:
        fm = yaml.safe_load(match.group(1)) or {}
    except yaml.YAMLError:
        fm = {}

    body = content[match.end():]
    return fm, body


def _extract_description_from_body(body: str) -> str:
    """Fallback: grab the first non-heading paragraph as description."""
    for line in body.splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            return line
    return ""


def parse_skill_md(file_path: str) -> Optional[Skill]:
    """Parse a single SKILL.md and return a Skill, or None on failure."""
    try:
        with open(file_path, encoding="utf-8") as f:
            content = f.read()
    except OSError:
        return None

    fm, body = _parse_frontmatter(content)

    # Derive skill folder name (e.g. "biz-dcf")
    skill_dir = os.path.basename(os.path.dirname(file_path))

    name = fm.get("name", skill_dir) or skill_dir
    description = fm.get("description", "") or _extract_description_from_body(body)

    metadata = fm.get("metadata") or {}
    raw_category = metadata.get("category", "")
    # Use the topic prefix (e.g. "biz", "algo") when no category is set
    category = str(raw_category) if raw_category else skill_dir.split("-")[0]

    raw_tags = metadata.get("tags", [])
    tags = raw_tags if isinstance(raw_tags, list) else []

    return Skill(
        name=name,
        description=description,
        body=body,
        path=file_path,
        category=category,
        tags=tags,
    )


def load_all_skills(skills_dir: str) -> list[Skill]:
    """Walk *skills_dir* and return every parsed Skill."""
    skills: list[Skill] = []

    if not os.path.isdir(skills_dir):
        return skills

    for entry in sorted(os.listdir(skills_dir)):
        if entry.startswith("."):
            continue
        skill_path = os.path.join(skills_dir, entry)
        if not os.path.isdir(skill_path):
            continue
        skill_md = os.path.join(skill_path, "SKILL.md")
        if os.path.isfile(skill_md):
            skill = parse_skill_md(skill_md)
            if skill:
                skills.append(skill)

    return skills
