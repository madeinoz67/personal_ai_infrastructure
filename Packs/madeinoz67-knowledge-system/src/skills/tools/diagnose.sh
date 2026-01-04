#!/bin/bash

# PAI Knowledge System Diagnostics Script
# Checks installation and provides troubleshooting guidance

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo "  → $1"
}

clear
print_header "PAI Knowledge System Diagnostics"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"
cd "$INSTALL_DIR"

ISSUES_FOUND=0

# Check 1: Podman Installation
print_header "Check 1: Podman Installation"

if command -v podman &> /dev/null; then
    PODMAN_VERSION=$(podman --version)
    print_success "Podman installed: $PODMAN_VERSION"
else
    print_error "Podman not installed"
    print_info "Install from: https://podman.io/getting-started/installation"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 2: Configuration File
print_header "Check 2: Configuration File"

if [[ -f ".env" ]]; then
    print_success ".env file exists"

    # Check for API keys
    if grep -q "OPENAI_API_KEY=sk-" .env 2>/dev/null; then
        print_success "OpenAI API key configured"
    elif grep -q "ANTHROPIC_API_KEY=" .env 2>/dev/null; then
        print_success "Anthropic API key configured"
    elif grep -q "GOOGLE_API_KEY=" .env 2>/dev/null; then
        print_success "Google API key configured"
    elif grep -q "GROQ_API_KEY=" .env 2>/dev/null; then
        print_success "Groq API key configured"
    else
        print_warning "No API keys found in .env"
        print_info "Run: ./pai-knowledge-system/tools/install.sh"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi

    # Check for required config
    if grep -q "MODEL_NAME=" .env; then
        MODEL=$(grep "MODEL_NAME=" .env | cut -d'=' -f2)
        print_success "Model configured: $MODEL"
    fi

    if grep -q "SEMAPHORE_LIMIT=" .env; then
        LIMIT=$(grep "SEMAPHORE_LIMIT=" .env | cut -d'=' -f2)
        print_success "Concurrency limit: $LIMIT"
    fi
else
    print_error ".env file not found"
    print_info "Run: ./pai-knowledge-system/tools/install.sh"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 3: Container Status
print_header "Check 3: Container Status"

if podman ps | grep -q "graphiti-knowledge-graph-mcp"; then
    print_success "Container is running"

    # Get container details
    CONTAINER_STATUS=$(podman ps --filter name=graphiti-knowledge-graph-mcp --format "{{.Status}}")
    print_info "Status: $CONTAINER_STATUS"

    CONTAINER_PORTS=$(podman ps --filter name=graphiti-knowledge-graph-mcp --format "{{.Ports}}")
    print_info "Ports: $CONTAINER_PORTS"
else
    if podman ps -a | grep -q "graphiti-knowledge-graph-mcp"; then
        print_warning "Container exists but not running"
        print_info "Start with: ./run.sh"
        print_info "Or: podman start graphiti-knowledge-graph-mcp"
    else
        print_error "Container not found"
        print_info "Run: ./run.sh"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

# Check 4: Server Health
print_header "Check 4: MCP Server Health"

if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
    if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
        print_success "MCP server is healthy"
    else
        print_warning "Server responding but health check unclear"
        print_info "Response: $HEALTH_RESPONSE"
    fi
else
    print_error "MCP server not responding"
    print_info "Check logs: podman logs graphiti-knowledge-graph-mcp"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

# Check 5: PAI Skill Installation
print_header "Check 5: PAI Skill Installation"

PAI_FOUND=0
if [[ -d "$HOME/.claude/Skills/pai-knowledge-system" ]]; then
    print_success "PAI skill installed: ~/.claude/Skills/pai-knowledge-system"
    PAI_FOUND=1
elif [[ -n "$PAI_DIR" ]] && [[ -d "$PAI_DIR/Skills/pai-knowledge-system" ]]; then
    print_success "PAI skill installed: $PAI_DIR/Skills/pai-knowledge-system"
    PAI_FOUND=1
else
    print_warning "PAI skill not found in standard locations"
    print_info "Install with: cp -r pai-knowledge-system ~/.claude/Skills/"
fi

if [[ $PAI_FOUND -eq 1 ]]; then
    # Check skill structure
    if [[ -f "$HOME/.claude/Skills/pai-knowledge-system/SKILL.md" ]]; then
        print_success "SKILL.md exists"
    fi

    WORKFLOW_COUNT=$(find ~/.claude/Skills/pai-knowledge-system/workflows -name "*.md" 2>/dev/null | wc -l)
    print_info "Workflows found: $WORKFLOW_COUNT"
fi

# Check 6: Port Availability
print_header "Check 6: Port Availability"

check_port() {
    local port=$1
    local description=$2

    if lsof -i :$port > /dev/null 2>&1; then
        print_success "$description (port $port) is in use"
    else
        print_warning "$description (port $port) is available"
    fi
}

check_port 8000 "MCP Server"
check_port 6379 "FalkorDB"
check_port 3000 "FalkorDB Web UI"

# Check 7: Resource Usage
print_header "Check 7: Resource Usage"

if podman ps | grep -q "graphiti-knowledge-graph-mcp"; then
    # Get stats
    STATS=$(podman stats graphiti-knowledge-graph-mcp --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "")

    if [[ -n "$STATS" ]]; then
        print_success "Container resource usage:"
        echo "$STATS"
    fi
fi

# Summary
print_header "Diagnostic Summary"

if [[ $ISSUES_FOUND -eq 0 ]]; then
    print_success "All checks passed! System is healthy."
    echo ""
    echo "Your PAI Knowledge System is ready to use."
    echo ""
    echo "Try these commands:"
    echo "  Remember that I'm testing the knowledge system."
    echo "  What do I know about PAI?"
    echo "  Show the knowledge graph status"
else
    print_warning "Found $ISSUES_FOUND issue(s) that need attention"
    echo ""
    echo "Recommended actions:"

    if ! command -v podman &> /dev/null; then
        echo "  1. Install Podman"
    fi

    if [[ ! -f ".env" ]]; then
        echo "  2. Run installation: ./pai-knowledge-system/tools/install.sh"
    fi

    if ! podman ps | grep -q "graphiti-knowledge-graph-mcp"; then
        echo "  3. Start the server: ./run.sh"
    fi

    if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "  4. Check logs: podman logs graphiti-knowledge-graph-mcp"
    fi
fi

echo ""
echo "For more help, see:"
echo "  - README.md"
echo "  - INTEGRATION.md"
echo "  - QUICKSTART.md"
echo ""
