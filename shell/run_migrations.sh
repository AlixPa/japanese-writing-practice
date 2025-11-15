#!/bin/sh

backend_dir=backend
cd "$backend_dir" || exit 1

venv_dir=../.venv
"$venv_dir/bin/python" -m src.scripts.manage_dbfile_s3.load_db
"$venv_dir/bin/yoyo" apply --batch