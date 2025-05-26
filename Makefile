.PHONY: all backend run-backend test-backend frontend run-frontend bot venv-bot run-bot test-bot dev-init clean stop-all run-all restart-all test-all status

# === Directory Variables ===
BACKEND_DIR=backend
FRONTEND_DIR=frontend
BOT_DIR=bot
PYTHON=bot/venv/Scripts/python.exe

# === Backend ===
backend:
	cd $(BACKEND_DIR) && npm install

run-backend:
	cd $(BACKEND_DIR) && npm start

test-backend:
	cd $(BACKEND_DIR) && npm test

# === Frontend ===
frontend:
	cd $(FRONTEND_DIR) && npm install

run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

# === Bot (Python) ===
venv-bot:
	cd $(BOT_DIR) && python -m venv venv && \
	. venv/bin/activate && pip install -r requirements.txt

run-bot:
	cd $(BOT_DIR) && python src/bot.py

test-bot:


# === First-Time Setup ===
dev-init:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Setting up Python bot virtual environment..."
	cd $(BOT_DIR) && python -m venv venv && \
	. venv/bin/activate && pip install -r requirements.txt
	@echo "All dependencies installed."

# === Run All Services in Parallel ===
run-all:
	@echo "Starting backend, frontend, and bot in background..."
	@cd $(BACKEND_DIR) && npm start & \
	cd $(FRONTEND_DIR) && npm run dev & \
	cd $(BOT_DIR) && python src/bot.py & \
	wait

# === Stop All Services ===
stop-all:
	@echo "Stopping backend, frontend, and bot..."
	@pkill -f "node src/index.js" || true
	@pkill -f "vite" || true
	@pkill -f "python src/bot.py" || true
	@echo "All services stopped."

# === Restart All ===
restart-all:
	@echo "Restarting all services..."
	@$(MAKE) stop-all
	@sleep 1
	@$(MAKE) run-all

# === Check Running Status ===
status:
	@echo "--- Node Backend ---"
	@tasklist | findstr node || echo "Not running"
	@echo "--- React Frontend (Vite) ---"
	@tasklist | findstr vite || echo "Not running"
	@echo "--- Python Bot ---"
	@tasklist | findstr python || echo "Not running"

# === Test All ===
test-all:
	@echo "Running backend tests..."
	cd $(BACKEND_DIR) && npm test
	@echo "\nRunning bot tests..."
	cd $(BOT_DIR) && python -m unittest discover -s tests -p "test_*.py"

# === Clean ===
clean:
	@echo "Removing node_modules folders..."
	rm -rf $(BACKEND_DIR)/node_modules \
	       $(FRONTEND_DIR)/node_modules
	@echo "To clean bot venv, manually delete bot/venv/ if needed."

# === Help ===
all:
	@echo "Available make commands:"
	@echo "  dev-init       # Install all dependencies"
	@echo "  run-backend    # Run backend"
	@echo "  run-frontend   # Run frontend"
	@echo "  run-bot        # Run Python bot"
	@echo "  run-all        # Run backend, frontend, bot in parallel"
	@echo "  stop-all       # Stop all running services"
	@echo "  restart-all    # Stop + start all services"
	@echo "  test-backend   # Run backend tests"
	@echo "  test-bot       # Run Python bot tests"
	@echo "  test-all       # Run all tests"
	@echo "  clean          # Delete node_modules folders"
	@echo "  status         # Show which services are running"
