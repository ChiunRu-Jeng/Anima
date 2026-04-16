"""Anima Agent — powered by Asgard Skills + Gemini REST API."""

import os
import requests

from .skill_loader import Skill, load_all_skills
from .skill_selector import select_skills

_DEFAULT_SKILLS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "skills")
_GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models"
    "/{model}:generateContent?key={key}"
)

_BASE_SYSTEM_PROMPT = """\
You are Anima, an intelligent assistant backed by Asgard Skills — a curated \
library of domain methodologies covering finance, algorithms, business strategy, \
statistics, Taiwan-specific regulations, and more.

When answering:
1. Apply the Iron Laws and phase-gate processes from the relevant skills below.
2. Call out assumptions explicitly ("GIGO" principle).
3. Structure your answer with clear headings and a summary.
4. If none of the injected skills directly apply, say so and answer from general \
knowledge while flagging the limitation.
"""


def _format_skill(skill: Skill) -> str:
    lines = [f"### [{skill.name}]"]
    if skill.description:
        lines.append(f"**When to use:** {skill.description}\n")
    lines.append(skill.body.strip())
    return "\n".join(lines)


def _build_system_prompt(relevant_skills: list[Skill]) -> str:
    if not relevant_skills:
        return _BASE_SYSTEM_PROMPT
    skill_block = "\n\n---\n\n".join(_format_skill(s) for s in relevant_skills)
    return _BASE_SYSTEM_PROMPT + "\n\n# Relevant Skills\n\n" + skill_block


def _to_gemini_contents(history: list[dict], query: str) -> list[dict]:
    """Convert history + query into Gemini's contents format."""
    contents = []
    for msg in history:
        role = "model" if msg["role"] == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": msg["content"]}]})
    contents.append({"role": "user", "parts": [{"text": query}]})
    return contents


class AnimaAgent:
    """Asgard Skills agent powered by Gemini.

    Args:
        skills_dir: Path to the Asgard Skills directory.
        top_k: Number of skills to inject per turn (default 5).
        model: Gemini model ID (default: gemini-2.0-flash).
        api_key: Gemini API key. Falls back to GEMINI_API_KEY env var.
    """

    def __init__(
        self,
        skills_dir: str | None = None,
        top_k: int = 5,
        model: str = "gemini-2.0-flash",
        api_key: str | None = None,
    ):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "Gemini API key not found. "
                "Set GEMINI_API_KEY env var or pass api_key=..."
            )
        self.model = model
        self.skills_dir = skills_dir or _DEFAULT_SKILLS_DIR
        self.top_k = top_k
        self._skills: list[Skill] | None = None

    @property
    def skills(self) -> list[Skill]:
        if self._skills is None:
            self._skills = load_all_skills(self.skills_dir)
        return self._skills

    def list_categories(self) -> list[str]:
        return sorted({s.name.split("-")[0] for s in self.skills})

    def chat(
        self,
        query: str,
        history: list[dict] | None = None,
        category_filter: str | None = None,
    ) -> str:
        relevant = select_skills(
            self.skills, query, top_n=self.top_k, category_filter=category_filter
        )
        system_prompt = _build_system_prompt(relevant)
        contents = _to_gemini_contents(history or [], query)

        url = _GEMINI_URL.format(model=self.model, key=self.api_key)
        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": contents,
            "generationConfig": {"maxOutputTokens": 4096},
        }

        resp = requests.post(url, json=payload, timeout=60)
        resp.raise_for_status()
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
