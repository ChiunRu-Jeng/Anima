"""Anima Agent — powered by Asgard Skills + Claude (Anthropic API)."""

import os
from anthropic import Anthropic

from .skill_loader import Skill, load_all_skills
from .skill_selector import select_skills

_DEFAULT_SKILLS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "skills")

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


class AnimaAgent:
    """Asgard Skills agent powered by Claude.

    Args:
        skills_dir: Path to the Asgard Skills directory.
        top_k: Number of skills to inject per turn (default 5).
        model: Claude model ID (default: claude-sonnet-4-6).
        api_key: Anthropic API key. Falls back to ANTHROPIC_API_KEY env var.
    """

    def __init__(
        self,
        skills_dir: str | None = None,
        top_k: int = 5,
        model: str = "claude-sonnet-4-6",
        api_key: str | None = None,
    ):
        self.client = Anthropic(api_key=api_key) if api_key else Anthropic()
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
        system = _build_system_prompt(relevant)
        messages = list(history or []) + [{"role": "user", "content": query}]

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system,
            messages=messages,
        )
        return response.content[0].text
