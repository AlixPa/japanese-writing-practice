from pydantic import BaseModel


class Element(BaseModel):
    element: str
    meaning: str


class StoryGeneration(BaseModel):
    input_vocabulary_list: list[Element]
    text: str
    title: str
