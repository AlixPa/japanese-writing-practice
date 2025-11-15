#!/bin/sh

backend_dir=backend
cd "$backend_dir" || exit 1

venv_dir=../.venv
"$venv_dir/bin/yoyo" apply --batch