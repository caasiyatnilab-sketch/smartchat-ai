#!/bin/bash

# SmartChat AI - One-Click Deploy Script
# Run this after setting up your cloud account

set -e

echo "🤖 SmartChat AI Deployment Script"
echo "=================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "Git not found. Installing..."
    apt-get update && apt-get install -y git
fi

# Clone repo if not exists
if [ ! -d "smartchat-ai" ]; then
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/caasiyatnilab-sketch/smartchat-ai.git
    cd smartchat-ai
else
    cd smartchat-ai
    git pull origin master
fi

# Create .env file
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp backend/.env.example backend/.env
    
    echo -e "${GREEN}Please edit backend/.env and add your API keys:${NC}"
    echo "  - OPENAI_API_KEY (optional, for best AI)"
    echo "  - HUGGINGFACE_API_KEY (free alternative)"
    echo "  - COHERE_API_KEY (free alternative)"
    echo ""
    echo "Then run: docker-compose up -d"
    exit 0
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker not found. Installing...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    apt-get install -y docker-compose
fi

echo -e "${GREEN}Starting services...${NC}"
docker-compose up -d

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Services:"
echo "  - Backend API: http://localhost:3000"
echo "  - Frontend: http://localhost:5173"
echo ""
echo "Next steps:"
echo "  1. Add your API keys to backend/.env"
echo "  2. Restart: docker-compose restart backend"
echo "  3. Open http://localhost:5173 to use the app"
