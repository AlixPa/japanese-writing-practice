# render_entrypoint.sh
#!/bin/sh
echo "PORT is: $PORT"
exec uvicorn src.main:app --host 0.0.0.0 --port "$PORT"