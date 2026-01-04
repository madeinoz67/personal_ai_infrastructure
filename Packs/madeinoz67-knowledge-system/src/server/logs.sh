#!/bin/bash

# View logs from PAI Knowledge System containers
# Shows logs from MCP server or FalkorDB container

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Container names
FALKORDB_CONTAINER="pai-knowledge-falkordb"
MCP_CONTAINER="pai-knowledge-graph-mcp"

# Detect container runtime
if command -v podman &> /dev/null; then
    RUNTIME="podman"
elif command -v docker &> /dev/null; then
    RUNTIME="docker"
else
    echo -e "${RED}Error: No container runtime found!${NC}"
    exit 1
fi

# Default to MCP server logs
CONTAINER="${MCP_CONTAINER}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--falkordb)
            CONTAINER="${FALKORDB_CONTAINER}"
            shift
            ;;
        -m|--mcp)
            CONTAINER="${MCP_CONTAINER}"
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -f, --falkordb    View FalkorDB container logs"
            echo "  -m, --mcp        View MCP Server container logs (default)"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# Check if container exists
if ! $RUNTIME ps -a --format "{{.Names}}" | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}✗ Container '${CONTAINER}' not found${NC}"
    exit 1
fi

echo -e "${BLUE}Viewing logs for: ${CONTAINER}${NC}"
echo "Press Ctrl+C to stop viewing logs"
echo ""

$RUNTIME logs -f "${CONTAINER}"
