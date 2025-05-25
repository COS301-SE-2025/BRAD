.PHONY: backend run-backend frontend run-frontend bot run-bot stop restart clean dev-init all

# === Directory Variables ===
BACKEND_DIR=backend
FRONTEND_DIR=frontend
BOT_DIR=bot

# === Backend ===
backend:
	cd $(BACKEND_DIR) && npm install

run-backend:
	cd $(BACKEND_DIR) && npm start

# === Frontend ===
frontend:
	cd $(FRONTEND_DIR) && npm install

run-frontend:
	cd $(FRONTEND_DIR) && npm run dev

# === Bot ===
bot:
	cd $(BOT_DIR) && npm install

run-bot:
	cd $(BOT_DIR) && npm start

# === First-Time Setup ===
dev-init:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && npm install
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install
	@echo "Installing bot dependencies..."
	cd $(BOT_DIR) && npm install
	@echo "All dependencies installed!"

# === Restart Message (Manual Start) ===
restart:
	@$(MAKE) stop
	@echo "System stopped."
	@echo "Now run in separate terminals:"
	@echo " make run-backend"
	@echo " make run-frontend"
	@echo " make run-bot"

# === Remove all node_modules ===
clean:
	@echo "Removing all node_modules folders..."
	rm -rf $(BACKEND_DIR)/node_modules \
	       $(FRONTEND_DIR)/node_modules \
	       $(BOT_DIR)/node_modules
	@echo "You will need to run 'make dev-init' again."

# === Help ===
all:
	@echo "Available make commands:"
	@echo " Setup:"
	@echo "   make dev-init      # Install all dependencies"
	@echo " Run:"
	@echo "   make run-backend   # Start Express backend"
	@echo "   make run-frontend  # Start Vite React frontend"
	@echo "   make run-bot       # Run Puppeteer bot"
	@echo " Maintenance:"
	@echo "   make stop          # Stop all running node processes"
	@echo "   make restart       # Stop all and show next steps"
	@echo "   make clean         # Delete all node_modules"
