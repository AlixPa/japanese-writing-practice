from .sample import main as sample_main
from .wanikani_generation import main as wanikani_generation_main
from .save_seed_data import main as save_seed_data_main


__all__ = [
    "sample_main",
    "save_seed_data_main",
    "wanikani_generation_main",
]
