#!/bin/bash

# Script to run PAI Knowledge System with Podman
# Uses network isolation with separate FalkorDB and MCP server containers
#
# This script is located in the pack at src/server/run.sh
# It expects the .env file to be in ../config/.env

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the pack root (parent of script_dir)
PACK_ROOT="$(dirname "$SCRIPT_DIR")"
# Config directory
CONFIG_DIR="$PACK_ROOT/config"

# Network and container names
NETWORK_NAME="pai-knowledge-net"
FALKORDB_CONTAINER="pai-knowledge-falkordb"
MCP_CONTAINER="pai-knowledge-graph-mcp"
VOLUME_NAME="pai-knowledge-falkordb-data"

echo -e "${BLUE}PAI Knowledge System${NC}"
echo "========================"
echo ""

# Check if .env file exists in config directory
if [ ! -f "$CONFIG_DIR/.env" ]; then
    echo -e "${RED}Error: .env file not found in config directory!${NC}"
    echo -e "${YELLOW}Please copy .env.example to .env and configure your API keys:${NC}"
    echo "  cp $CONFIG_DIR/.env.example $CONFIG_DIR/.env"
    echo "  nano $CONFIG_DIR/.env  # or your preferred editor"
    exit 1
fi

# Source the .env file
set -a
source "$CONFIG_DIR/.env"
set +a

# Check if PAI_KNOWLEDGE_OPENAI_API_KEY is set
# Map PAI_KNOWLEDGE_OPENAI_API_KEY to OPENAI_API_KEY for container compatibility
if [ -n "$PAI_KNOWLEDGE_OPENAI_API_KEY" ]; then
    OPENAI_API_KEY="$PAI_KNOWLEDGE_OPENAI_API_KEY"
    echo -e "${GREEN}✓ Using dedicated PAI Knowledge System API key${NC}"
elif [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}Warning: PAI_KNOWLEDGE_OPENAI_API_KEY is not set in .env${NC}"
    echo "The server may not work properly without an API key."
fi

# Map other PAI_KNOWLEDGE_* variables to standard container environment variables
if [ -n "$PAI_KNOWLEDGE_LLM_PROVIDER" ]; then
    LLM_PROVIDER="$PAI_KNOWLEDGE_LLM_PROVIDER"
fi

if [ -n "$PAI_KNOWLEDGE_EMBEDDER_PROVIDER" ]; then
    EMBEDDER_PROVIDER="$PAI_KNOWLEDGE_EMBEDDER_PROVIDER"
fi

if [ -n "$PAI_KNOWLEDGE_MODEL_NAME" ]; then
    MODEL_NAME="$PAI_KNOWLEDGE_MODEL_NAME"
fi

if [ -n "$PAI_KNOWLEDGE_SEMAPHORE_LIMIT" ]; then
    SEMAPHORE_LIMIT="$PAI_KNOWLEDGE_SEMAPHORE_LIMIT"
fi

if [ -n "$PAI_KNOWLEDGE_GROUP_ID" ]; then
    GROUP_ID="$PAI_KNOWLEDGE_GROUP_ID"
fi

if [ -n "$PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED" ]; then
    GRAPHITI_TELEMETRY_ENABLED="$PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED"
fi

if [ -n "$PAI_KNOWLEDGE_DATABASE_TYPE" ]; then
    DATABASE_TYPE="$PAI_KNOWLEDGE_DATABASE_TYPE"
fi

# Detect container runtime
if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo -e "${RED}Error: No container runtime found!${NC}"
    echo "Please install Podman or Docker:"
    echo "  Podman: brew install podman (macOS)"
    echo "  Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo -e "${GREEN}Using container runtime: ${RUNTIME}${NC}"
echo ""

# Create network if it doesn't exist
if ! $RUNTIME network inspect "$NETWORK_NAME" &> /dev/null; then
    echo "Creating isolated network: $NETWORK_NAME"
    $RUNTIME network create \
        --driver bridge \
        --subnet=172.28.0.0/16 \
        "$NETWORK_NAME"
    echo -e "${GREEN}✓ Network created${NC}"
else
    echo -e "${GREEN}✓ Network exists: $NETWORK_NAME${NC}"
fi

# Check if FalkorDB container exists
if $RUNTIME ps -a --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
    echo -e "${YELLOW}FalkorDB container '${FALKORDB_CONTAINER}' already exists.${NC}"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping and removing existing FalkorDB container..."
        $RUNTIME stop "${FALKORDB_CONTAINER}" 2>/dev/null || true
        $RUNTIME rm "${FALKORDB_CONTAINER}" 2>/dev/null || true
    else
        echo "Using existing FalkorDB container..."
    fi
fi

# Check if MCP container exists
if $RUNTIME ps -a --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
    echo -e "${YELLOW}MCP container '${MCP_CONTAINER}' already exists.${NC}"
    read -p "Do you want to remove and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping and removing existing MCP container..."
        $RUNTIME stop "${MCP_CONTAINER}" 2>/dev/null || true
        $RUNTIME rm "${MCP_CONTAINER}" 2>/dev/null || true
    else
        echo "Using existing MCP container..."
        echo -e "${GREEN}✓ Done!${NC}"
        echo ""
        echo "Access points:"
        echo "  MCP Server:  http://localhost:8000/mcp/"
        echo "  Health Check: http://localhost:8000/health"
        echo "  FalkorDB UI: http://localhost:3000"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}Starting FalkorDB container...${NC}"

# Run FalkorDB container (internal only - no exposed ports)
if ! $RUNTIME ps --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
    $RUNTIME run -d \
        --name "${FALKORDB_CONTAINER}" \
        --restart unless-stopped \
        --network "$NETWORK_NAME" \
        -v "${VOLUME_NAME}:/data" \
        -e FALKORDB_PASSWORD="${FALKORDB_PASSWORD:-}" \
        falkordb/falkordb:latest

    echo -e "${GREEN}✓ FalkorDB container started${NC}"
    echo "  Container: $FALKORDB_CONTAINER"
    echo "  Volume: $VOLUME_NAME"
    echo "  Network: $NETWORK_NAME (internal only)"
else
    echo "FalkorDB already running"
fi

# Wait for FalkorDB to be ready
echo "Waiting for FalkorDB to be ready..."
sleep 5

echo ""
echo -e "${BLUE}Starting Graphiti MCP Server container...${NC}"

# Run MCP server container (exposed to host)
if ! $RUNTIME ps --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
    $RUNTIME run -d \
        --name "${MCP_CONTAINER}" \
        --restart unless-stopped \
        --network "$NETWORK_NAME" \
        -p 8000:8000 \
        -p 3000:3000 \
        -e OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
        -e ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
        -e GOOGLE_API_KEY="${GOOGLE_API_KEY:-}" \
        -e GROQ_API_KEY="${GROQ_API_KEY:-}" \
        -e VOYAGE_API_KEY="${VOYAGE_API_KEY:-}" \
        -e DATABASE_TYPE=falkordb \
        -e FALKORDB_HOST="${FALKORDB_CONTAINER}" \
        -e FALKORDB_PORT=6379 \
        -e FALKORDB_PASSWORD="${FALKORDB_PASSWORD:-}" \
        -e NEO4J_URI="${NEO4J_URI:-bolt://localhost:7687}" \
        -e NEO4J_USER="${NEO4J_USER:-neo4j}" \
        -e NEO4J_PASSWORD="${NEO4J_PASSWORD:-demodemo}" \
        -e SEMAPHORE_LIMIT="${SEMAPHORE_LIMIT:-10}" \
        -e GRAPHITI_TELEMETRY_ENABLED="${GRAPHITI_TELEMETRY_ENABLED:-false}" \
        -e MODEL_NAME="${MODEL_NAME:-gpt-4o-mini}" \
        -e LLM_PROVIDER="${LLM_PROVIDER:-openai}" \
        -e EMBEDDER_PROVIDER="${EMBEDDER_PROVIDER:-openai}" \
        -e GROUP_ID="${GROUP_ID:-main}" \
        falkordb/graphiti-knowledge-graph-mcp:latest

    echo -e "${GREEN}✓ MCP Server container started${NC}"
    echo "  Container: $MCP_CONTAINER"
    echo "  Network: $NETWORK_NAME"
else
    echo "MCP server already running"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}PAI Knowledge System is running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Network Topology:"
echo "  FalkorDB:     $FALKORDB_CONTAINER (internal network only)"
echo "  MCP Server:   $MCP_CONTAINER (exposed to host)"
echo "  Network:      $NETWORK_NAME (isolated bridge)"
echo ""
echo "Access points:"
echo "  MCP Server:    http://localhost:8000/mcp/"
echo "  Health Check:  http://localhost:8000/health"
echo "  FalkorDB UI:   http://localhost:3000"
echo ""
echo "Management commands:"
echo "  View logs:     bash $SCRIPT_DIR/logs.sh"
echo "  Stop system:   bash $SCRIPT_DIR/stop.sh"
echo "  Start system:  bash $SCRIPT_DIR/start.sh"
echo "  Check status:  bash $SCRIPT_DIR/status.sh"
echo ""
echo -e "${YELLOW}Note: FalkorDB port 6379 is NOT exposed to host (network isolation)${NC}"
echo -e "${YELLOW}      Access FalkorDB only through the MCP server or web UI${NC}"
echo ""
