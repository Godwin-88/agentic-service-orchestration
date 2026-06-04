#!/bin/bash

# Digital Marketing Hub & Agentic CRM — Local Development Startup Script

# 1. Load environment variables
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "WARNING: Using default .env. Please update it with your API keys later."
fi

# Export variables for the local environment
set -a
source .env
set +a

# 2. Start Infrastructure (PostgreSQL, Redis, n8n)
echo "Starting Docker-based infrastructure (Databases & n8n)..."
docker compose up -d postgres redis n8n

# Wait for Postgres to be ready
echo "Waiting for PostgreSQL to be healthy..."
until docker exec marketing_hub_postgres pg_isready -U ${DB_USER:-postgres} > /dev/null 2>&1; do
  sleep 1
done
echo "PostgreSQL is ready."

# 3. Start Backend Agent Service (Local Venv)
echo "Starting Backend Agent Service in virtual environment..."
if [ ! -d "agents/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv agents/venv
fi

source agents/venv/bin/activate
echo "Installing/Updating backend requirements..."
pip install -q --upgrade pip
pip install -q -r agents/requirements.txt

# Run backend from within its own directory to fix package resolution
export DATABASE_URL="postgresql+asyncpg://${DB_USER:-postgres}:${DB_PASSWORD:-postgres_dev}@localhost:${DB_PORT:-5432}/${DB_NAME:-marketing_hub}"
cd agents
export PYTHONPATH=.
python main.py &
BACKEND_PID=$!
cd ..
echo "Backend started (PID: $BACKEND_PID)"

# 4. Start Frontend UI
echo "Starting Frontend UI..."
# Add common Bun installation path to PATH for the script
export PATH="$HOME/.bun/bin:$PATH"

cd frontend
if command -v bun &> /dev/null; then
    echo "Using Bun at $(command -v bun) (recommended)..."
    bun dev &
    FRONTEND_PID=$!
else
    echo "WARNING: Bun not found. Falling back to npm."
    echo "If you encounter 'fetch' errors, install Bun: curl -fsSL https://bun.sh/install | bash"
    npm run dev &
    FRONTEND_PID=$!
fi
echo "Frontend started (PID: $FRONTEND_PID)"
cd ..

echo "----------------------------------------------------------------"
echo "Stack is running!"
echo "- n8n: http://localhost:${N8N_PORT:-5678}"
echo "- Backend: http://localhost:8000"
echo "- Frontend: http://localhost:5173 (check vite output)"
echo "----------------------------------------------------------------"
echo "Press Ctrl+C to stop all services."

# 5. Handle Exit
trap "echo 'Stopping services...'; kill $BACKEND_PID; kill $FRONTEND_PID; docker compose stop; exit" INT
wait
