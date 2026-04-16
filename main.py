#!/usr/bin/env python3
"""Anima — interactive CLI powered by Asgard Skills + Claude."""

import sys
from anima.agent import AnimaAgent


def _print_banner(agent: AnimaAgent) -> None:
    count = len(agent.skills)
    categories = ", ".join(agent.list_categories())
    print("=" * 60)
    print("  Anima  —  Claude Agent + Asgard Skills")
    print("=" * 60)
    if count:
        print(f"  {count} skills loaded  |  categories: {categories}")
    else:
        print("  WARNING: no skills found.")
        print("  Run:  git submodule update --init --recursive")
    print()
    print("  Commands:")
    print("    /skills            list all skills")
    print("    /cat <prefix>      filter by category (e.g. /cat biz)")
    print("    /reset             clear conversation history")
    print("    /quit  or  Ctrl-C  exit")
    print("=" * 60)
    print()


def main() -> None:
    agent = AnimaAgent()
    _print_banner(agent)

    history: list[dict] = []
    category_filter: str | None = None

    while True:
        try:
            raw = input("You: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nBye!")
            sys.exit(0)

        if not raw:
            continue

        # --- built-in commands ---
        if raw.lower() in ("/quit", "/exit", "quit", "exit"):
            print("Bye!")
            sys.exit(0)

        if raw.lower() == "/skills":
            for s in agent.skills:
                print(f"  {s.name:45s}  {s.description[:60]}")
            print()
            continue

        if raw.lower().startswith("/cat "):
            category_filter = raw[5:].strip() or None
            label = category_filter or "(none)"
            print(f"  Category filter set to: {label}\n")
            continue

        if raw.lower() == "/reset":
            history = []
            print("  Conversation reset.\n")
            continue

        # --- normal query ---
        try:
            reply = agent.chat(raw, history=history, category_filter=category_filter)
        except Exception as exc:  # noqa: BLE001
            print(f"  [Error] {exc}\n")
            continue

        print(f"\nAnima: {reply}\n")

        history.append({"role": "user", "content": raw})
        history.append({"role": "assistant", "content": reply})


if __name__ == "__main__":
    main()
