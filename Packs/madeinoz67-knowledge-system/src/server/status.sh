#!/bin/bash

# Check the status of PAI Knowledge System containers
# Shows status of both FalkorDB and MCP server containers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Container and network names
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

echo -e "${BLUE}PAI Knowledge System Status${NC}"
echo "=================================="
echo ""

# Check network
if $RUNTIME network inspect "$NETWORK_NAME" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Network: $NETWORK_NAME"
else
    echo -e "${RED}✗${NC} Network: $NETWORK_NAME (not found)"
fi
echo ""

# Check FalkorDB container
if $RUNTIME ps -a --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
    FALKORDB_STATUS=$($RUNTIME ps -a --filter "name=${FALKORDB_CONTAINER}" --format "{{.Status}}")
    echo "FalkorDB Container: ${FALKORDB_CONTAINER}"
    echo "  Status: ${FALKORDB_STATUS}"
    if $RUNTIME ps --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
        echo -e "  ${GREEN}✓ Running${NC} (internal network only - not exposed to host)"
    else
        echo -e "  ${YELLOW}⚠ Stopped${NC}"
    fi
else
    echo -e "${RED}✗ FalkorDB container not found${NC}"
fi
echo ""

# Check MCP Server container
if $RUNTIME ps -a --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
    MCP_STATUS=$($RUNTIME ps -a --filter "name=${MCP_CONTAINER}" --format "{{.Status}}")
    echo "MCP Server Container: ${MCP_CONTAINER}"
    echo "  Status: ${MCP_STATUS}"
    if $RUNTIME ps --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
        echo -e "  ${GREEN}✓ Running${NC}"
        echo ""
        echo "  Access points:"
        echo "    MCP Server:    http://localhost:8000/mcp/"
        echo "    Health Check:  http://localhost:8000/health"
        echo "    FalkorDB UI:   http://localhost:3000"

        # Test health endpoint
        if command -v curl &> /dev/null; then
            if curl -s http://localhost:8000/health | grep -q "healthy"; then
                echo ""
                echo -e "  ${GREEN}✓ Health check passed${NC}"
            else
                echo ""
                echo -e "  ${YELLOW}⚠ Health check failed (server may be starting up)${NC}"
            fi
        fi
    else
        echo -e "  ${YELLOW}⚠ Stopped${NC}"
    fi
else
    echo -e "${RED}✗ MCP Server container not found${NC}"
fi

echo ""
echo "=================================="

# Show running containers
RUNNING_COUNT=0
if $RUNTIME ps --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
    RUNNING_COUNT=$((RUNNING_COUNT + 1))
fi
if $RUNTIME ps --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
    RUNNING_COUNT=$((RUNNING_COUNT + 1))
fi

echo "Running containers: ${RUNNING_COUNT}/2"

if [ $RUNNING_COUNT -eq 2 ]; then
    echo -e "${GREEN}✓ System fully operational${NC}"
    exit 0
elif [ $RUNNING_COUNT -eq 1 ]; then
    echo -e "${YELLOW}⚠ System partially operational${NC}"
    exit 1
else
    echo -e "${RED}✗ System not running${NC}"
    echo ""
    echo "To start the system:"
    echo "  bash src/server/start.sh"
    exit 1
fi
