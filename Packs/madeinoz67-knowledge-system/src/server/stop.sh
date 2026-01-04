#!/bin/bash

# Stop PAI Knowledge System containers
# Stops both MCP server and FalkorDB containers

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

echo "Stopping PAI Knowledge System..."
echo ""

# Stop MCP server container first
if $RUNTIME ps --format "{{.Names}}" | grep -q "^${MCP_CONTAINER}$"; then
    echo "Stopping MCP server container: ${MCP_CONTAINER}"
    $RUNTIME stop "${MCP_CONTAINER}"
    echo -e "${GREEN}✓ MCP server stopped${NC}"
else
    echo -e "${YELLOW}⚠ MCP server container not running${NC}"
fi

# Stop FalkorDB container
if $RUNTIME ps --format "{{.Names}}" | grep -q "^${FALKORDB_CONTAINER}$"; then
    echo "Stopping FalkorDB container: ${FALKORDB_CONTAINER}"
    $RUNTIME stop "${FALKORDB_CONTAINER}"
    echo -e "${GREEN}✓ FalkorDB stopped${NC}"
else
    echo -e "${YELLOW}⚠ FalkorDB container not running${NC}"
fi

echo ""
echo -e "${GREEN}PAI Knowledge System stopped${NC}"
echo ""
echo "To start again:"
echo "  bash src/server/start.sh"
echo ""
echo "To remove containers and network:"
echo "  $RUNTIME rm ${MCP_CONTAINER} ${FALKORDB_CONTAINER}"
echo "  $RUNTIME network rm ${NETWORK_NAME}"
echo ""
