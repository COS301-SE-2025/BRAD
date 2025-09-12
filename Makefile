.PHONY: all api run-api test-api frontend run-frontend bot venv-bot run-bot test-bot dev-init clean stop-all run-all restart-all test-all status

# === Directory Variables ===
API_DIR=api
FRONTEND_DIR=frontend
BOT_DIR=bot
PYTHON=bot/venv/Scripts/python.exe
PIP=$(PYTHON) -m pip


# === API (NestJS Backend) ===
api:
	cd $(API_DIR) && npm install

run-api:
	cd $(API_DIR) && npm run start:dev

test-api:
	cd $(API_DIR) && npm run test

# === Frontend ===
frontend:
	cd $(FRONTEND_DIR) && npm install

run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

# === Bot (Python) ===
venv-bot:
	cd $(BOT_DIR) && py -m venv venv && \
	venv/Scripts/python.exe -m pip install -r requirements.txt

run-bot:
	cd $(BOT_DIR) && py src/bot.py

test-bot:


# === First-Time Setup ===
dev-init:
	@echo "Installing API dependencies..."
	cd $(API_DIR) && npm install
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Setting up Python bot virtual environment..."
	cd $(BOT_DIR) && python -m venv venv && \
	. venv/bin/activate && pip install -r requirements.txt
	@echo "All dependencies installed."

# === Clean ===
clean:
	@echo "Removing node_modules folders..."
	rm -rf $(API_DIR)/node_modules \
	       $(FRONTEND_DIR)/node_modules
	@echo "To clean bot venv, manually delete bot/venv/ if needed."

