from pathlib import Path


class GPTConfig:
    def __init__(
        self,
        generation_prompt: str | None = None,
        generation_developer_prompt: str | None = None,
        generation_model: str | None = None,
        correction_prompt: str | None = None,
        correction_model: str | None = None,
        name_model: str | None = None,
        name_prompt: str | None = None,
    ) -> None:
        self.GENERATION_MODEL = generation_model or "gpt-4.1"
        self.GENERATION_DEVELOPER_PROMPT = (
            generation_developer_prompt
            or "You are a smart Japanese professor. You only answer with perfectly natural Japanese. Your Japanese is very natural and never strange or odd just to full fill students needs."
        )
        self.GENERATION_PROMPT = (
            generation_prompt
            or """You are a Japanese teacher creating dictation stories for language students.

I will give you a list of vocabulary. Your task is to write a short story (5 sentences) that uses vocabulary from the list.

Rules:
	1.	Make sure thats each sentence could be said by a native Japanese speaker and are not odd or unnatural.
	2.	Focus on using the vocabulary provided, you can conjuge the verbs and use any katakana words.
	3.	Output only the dictation text, nothing else.

The list of vocabulary is: {}
"""
        )
        self.CORRECTION_MODEL = correction_model or "gpt-5"
        self.CORRECTION_PROMPT = (
            correction_prompt
            or """You are a Japanese language professional correcting dictations.

I will give you a short story written with restricted vocabulary. Sometimes sentences may be strange, ungrammatical, or unnatural.

Your task is to correct the unnatural or incorrect parts, while keeping the vocabulary mostly the same.

Steps:
    1. Identify the spots where the sentence is unnatural, wrong or a bit off.
    2. Think of good ways to keep the same vocabulary but turn it into a more natural and correct way.
    3. Correct each strange spot you noticed with natural, simple and proper Japanese.
	4. Output only the corrected story, nothing else.

Use your deep knowledge in Japanese to correct any unnatural sentence.

The text is: {}"""
        )
        self.NAME_MODEL = name_model or "gpt-4.1-mini"
        self.NAME_PROMPT = (
            name_prompt
            or """You will be given a small story in Japanese and you must output a title for the story.

Try to be as concise as possible and keep it simple.

Only output the title and nothing else.
        
The story is: {}"""
        )


GPT_CONFIG = GPTConfig()
