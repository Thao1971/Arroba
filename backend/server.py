# Supervisor shim. Real app at src/main.py.
# Supervisor command: `uvicorn server:app --host 0.0.0.0 --port 8001` from /app/backend.
from src.main import app  # noqa: F401
