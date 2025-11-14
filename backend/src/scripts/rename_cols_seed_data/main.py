import json
import os

from src.config.path import path_config


def main() -> None:
    to_rename = {
        "story_audios.json": {
            "audioId": "audio_id",
            "storyId": "story_id",
            "speedPercentage": "speed_percentage",
            "speakerId": "speaker_id",
        },
        "story_chunks.json": {
            "storyId": "story_id",
        },
        "story_chunk_audios.json": {
            "audioId": "audio_id",
            "storyChunkId": "story_chunk_id",
            "speedPercentage": "speed_percentage",
            "speakerId": "speaker_id",
        },
    }

    for filename, rename_map in to_rename.items():
        with open(path_config.seed_db / filename, "r") as f:
            es = json.load(f)
        for e in es:
            for init, final in rename_map.items():
                e[final] = e[init]
                del e[init]
        with open(path_config.seed_db / filename, "w") as f:
            json.dump(es, f)
