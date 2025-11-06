from .scripts import (
    s3_presigned_url_main,
    s3_test_main,
    s3_upload_audios_main,
    sample_main,
    save_seed_data_main,
    sqlite_test_main,
    test_audio_voices_main,
    wanikani_gen_prev_seed,
    wanikani_generation_main,
)

if __name__ == "__main__":
    # sample_main()
    # wanikani_generation_main(level_from=11, level_to=20, stories_per_level=2)
    # save_seed_data_main()
    # test_audio_voices()
    # wanikani_gen_prev_seed()
    # s3_test_main()
    # sqlite_test_main()
    # s3_upload_audios_main()
    s3_presigned_url_main()
    pass
