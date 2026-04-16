# Anima

Claude agent powered by [Asgard Skills](https://github.com/asgard-ai-platform/skills) — 263 domain-specific methodologies covering finance, algorithms, business strategy, statistics, Taiwan regulations, and more.

## How it works

```
User query
    │
    ▼
skill_selector  ──►  picks the top-5 most relevant SKILL.md files
    │
    ▼
AnimaAgent      ──►  injects skills into Claude's system prompt
    │
    ▼
Claude API      ──►  answers following the Iron Laws & methodology
```

## Setup

```bash
# 1. Clone with submodule
git clone --recurse-submodules https://github.com/chiunru-jeng/anima.git
cd anima

# If already cloned without submodules:
git submodule update --init --recursive

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# 4. Run
python main.py
```

## Interactive CLI

```
You: 我想評估一家公司的內在價值
Anima: (applies biz-dcf + relevant skills and answers with DCF methodology)

/skills          list all 263 skills
/cat biz         filter skills to the "biz" category
/reset           clear conversation history
/quit            exit
```

## Use as a Python library

```python
from anima import AnimaAgent

agent = AnimaAgent(top_k=5)

reply = agent.chat("How do I calculate EOQ for my warehouse?")
print(reply)

# Multi-turn conversation
history = []
for user_msg in ["What is CAC?", "How does it relate to LTV?"]:
    reply = agent.chat(user_msg, history=history)
    print(reply)
    history += [{"role": "user", "content": user_msg},
                {"role": "assistant", "content": reply}]
```

## Skill categories

| Prefix | Domain | Count |
|--------|--------|-------|
| `grad` | Graduate-level theory | 87 |
| `algo` | Algorithms & quant | 62 |
| `biz`  | Business frameworks | 22 |
| `hum`  | Humanities & reasoning | 9 |
| `tw`   | Taiwan-specific knowledge | 9 |
| `ecom` | E-commerce | 7 |
| `soc`  | Social science | 7 |
| `econ` | Economics | 6 |
| `meta` | Meta-thinking | 6 |
| `ops`  | Operations | 6 |
| …      | + 11 more | … |

## License

MIT
