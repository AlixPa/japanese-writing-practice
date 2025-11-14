import json
import os
import time

from src.clients.voicevox import VoiceVoxClient
from src.config.path import path_config
from src.logger import get_logger
from tqdm import tqdm

logger = get_logger()


def main() -> None:
    voicevox = VoiceVoxClient(logger)
    speakers = voicevox.list_speakers()
    with open("speakers.json", "w") as f:
        json.dump([s.model_dump() for s in speakers], f, indent=2, ensure_ascii=False)

    max_speaker_id = 0
    for s in speakers:
        for style in s.styles:
            max_speaker_id = max(max_speaker_id, style.id)
    # logger.info(f"{max_speaker_id=}")

    output_dir = path_config.local_data_scripts / "test_audio_voices"
    output_dir.mkdir(parents=True, exist_ok=True)

    for speed in [1]:
        last_generated = 0
        for file_name in os.listdir(output_dir):
            try:
                file_speed = int(file_name.split("_")[1].split(".")[0])
                if file_speed == int(speed * 10):
                    last_generated = max(last_generated, int(file_name.split("_")[0]))
            except Exception:
                pass
        # for speaker_id in tqdm(range(last_generated, 113)):
        for speaker_id in tqdm(
            [
                i
                for i in [27]
                # for i in [6, 8, 9, 16, 23, 27, 51, 55, 68, 69, 74, 81, 83, 108]
                if i >= last_generated
            ]
        ):
            time.sleep(0.5)
            audio = voicevox.text_to_speech(
                japanese_text="入り口の上に「ふじ山」と書かれた大きな看板があります。三人の大人と二人の子どもが力いっぱい山を登っています。",
                speed=speed,
                speaker_id=speaker_id,
            )
            with open(
                output_dir / f"{speaker_id:04}_{int(speed*100):02}.wav", "wb"
            ) as f:
                f.write(audio)
