from dataclasses import dataclass
from pathlib import Path


@dataclass
class GPTConfig:
    generation_model: str = "gpt-4.1"
    generation_developer_prompt: str = (
        "You are a smart Japanese professor. You only answer with perfectly natural Japanese. Your Japanese is very natural and never strange or odd just to full fill students needs."
    )
    generation_prompt: str = """You are a Japanese teacher creating dictation stories for language students.

I will give you a list of vocabulary. Your task is to write a short story (5 sentences) that uses vocabulary from the list.

Rules:
	1.	Make sure thats each sentence could be said by a native Japanese speaker and are not odd or unnatural.
	2.	Focus on using the vocabulary provided, you can conjuge the verbs and use any katakana words.
	3.	Output only the dictation text, nothing else.

The list of vocabulary is: {}
"""
    correction_model: str = "gpt-5"
    correction_prompt: str = """You are a Japanese language professional correcting dictations.

I will give you a short story written with restricted vocabulary. Sometimes sentences may be strange, ungrammatical, or unnatural.

Your task is to correct the unnatural or incorrect parts, while keeping the vocabulary mostly the same.

Steps:
    1. Identify the spots where the sentence is unnatural, wrong or a bit off.
    2. Think of good ways to keep the same vocabulary but turn it into a more natural and correct way.
    3. Correct each strange spot you noticed with natural, simple and proper Japanese.
	4. Output only the corrected story, nothing else.

Use your deep knowledge in Japanese to correct any unnatural sentence.

The text is: {}"""
    name_model: str = "gpt-4.1-mini"

    name_prompt: str = """You will be given a small story in Japanese and you must output a title for the story.

Try to be as concise as possible and keep it simple.

Only output the title and nothing else.
        
The story is: {}"""


gpt_config = GPTConfig()
