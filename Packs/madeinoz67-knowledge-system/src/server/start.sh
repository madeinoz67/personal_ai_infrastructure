#!/bin/bash

# Start PAI Knowledge System containers
# Starts both FalkorDB and MCP server containers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Container names
FALKORDB_CONTAINER="pai-knowledge-falkordb"
MCP_CONTAINER="pai-knowledge-graph-mcp"
NETWORK_NAME="pai-knowledge-net"

# Detect container runtime
if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo -e "${RED}Error: No container runtime found!${NC}"
    exit 1
fi

# Check if containers exist
FALKORDB_EXISTS=$($RUNTIME ps -a --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$" && echo "yes" || echo "no")
MCP_EXISTS=$($RUNTIME ps -a --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$" && echo "yes" || echo "no")

if [ "$FALKORDB_EXISTS" = "no" ] && [ "$MCP_EXISTS" = "no" ]; then
    echo -e "${RED}✗ Containers not found${NC}"
    echo "Please run the main setup script first:"
    echo "  bash src/server/run.sh"
    exit 1
fi

echo "Starting PAI Knowledge System..."
echo ""

# Start FalkorDB first
if [ "$FALKORDB_EXISTS" = "yes" ]; then
    if $RUNTIME ps --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
        echo -e "${GREEN}✓ FalkorDB already running${NC}"
    else
        echo "Starting FalkorDB container: ${FALKORDB_CONTAINER}"
        $RUNTIME start "${FALKORDB_CONTAINER}"
        echo -e "${GREEN}✓ FalkorDB started${NC}"
    fi
fi

# Wait for FalkorDB to be ready
if [ "$FALKORDB_EXISTS" = "yes" ] && ! $RUNTIME ps --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
    sleep 3
fi

# Start MCP server
if [ "$MCP_EXISTS" = "yes" ]; then
    if $RUNTIME ps --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
        echo -e "${GREEN}✓ MCP Server already running${NC}"
    else
        echo "Starting MCP Server container: ${MCP_CONTAINER}"
        $RUNTIME start "${MCP_CONTAINER}"
        echo -e "${GREEN}✓ MCP Server started${NC}"
    fi
fi

echo ""
echo -e "${GREEN}PAI Knowledge System started${NC}"
echo ""
echo "Access points:"
echo "  MCP Server:    http://localhost:8000/mcp/"
echo "  Health Check:  http://localhost:8000/health"
echo "  FalkorDB UI:   http://localhost:3000"
echo ""
