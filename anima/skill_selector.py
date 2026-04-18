"""Select the most relevant skills for a given query using keyword scoring."""

import re
from .skill_loader import Skill

# Common stop words to ignore during matching
_STOP_WORDS = {
    "a", "an", "the", "is", "in", "it", "of", "to", "and", "or", "for",
    "on", "at", "by", "as", "with", "this", "that", "be", "are", "was",
    "do", "how", "what", "when", "which", "can", "i", "we", "you",
}


def _tokenize(text: str) -> set[str]:
    tokens = re.findall(r"\b\w+\b", text.lower())
    return {t for t in tokens if t not in _STOP_WORDS and len(t) > 1}


def _score(skill: Skill, query_tokens: set[str]) -> float:
    if not query_tokens:
        return 0.0

    score = 0.0

    # Name — highest weight (hyphen-separated parts count individually)
    name_tokens = _tokenize(skill.name.replace("-", " "))
    score += len(query_tokens & name_tokens) * 4.0

    # Description — high weight
    score += len(query_tokens & _tokenize(skill.description)) * 3.0

    # Tags — medium weight
    for tag in skill.tags:
        score += len(query_tokens & _tokenize(tag)) * 2.0

    # Body preview — low weight (first 1 500 chars to stay fast)
    score += len(query_tokens & _tokenize(skill.body[:1500])) * 0.5

    return score


def select_skills(
    skills: list[Skill],
    query: str,
    top_n: int = 5,
    category_filter: str | None = None,
) -> list[Skill]:
    """Return the *top_n* skills most relevant to *query*.

    Args:
        skills: Full skill catalogue.
        query: User's natural-language query.
        top_n: Maximum number of skills to return.
        category_filter: If set, restrict to skills whose name starts with
                         this prefix (e.g. ``"biz"`` or ``"tw"``).
    """
    pool = skills
    if category_filter:
        prefix = category_filter.rstrip("-") + "-"
        pool = [s for s in skills if s.name.startswith(prefix)]

    query_tokens = _tokenize(query)
    scored = sorted(pool, key=lambda s: _score(s, query_tokens), reverse=True)

    # Prefer skills with a positive score; fall back to top-N if nothing matches
    positive = [s for s in scored if _score(s, query_tokens) > 0]
    return (positive if positive else scored)[:top_n]
