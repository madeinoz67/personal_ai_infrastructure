#!/bin/bash

# PAI Knowledge System Installation Script
# This script automates the complete installation process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

print_step() {
    echo ""
    echo -e "${GREEN}▶ $1${NC}"
    echo ""
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$(dirname "$SCRIPT_DIR")"

cd "$INSTALL_DIR"

# Welcome message
clear
print_header "PAI Knowledge System Installation"
echo "This script will install and configure the PAI Knowledge System."
echo ""
echo "Prerequisites:"
echo "  - Podman (must be installed)"
echo "  - At least one LLM provider API key"
echo ""
read -p "Press Enter to continue..."

# Step 1: Verify Podman
print_header "Step 1: Verify Prerequisites"

if ! command -v podman &> /dev/null; then
    print_error "Podman is not installed!"
    echo ""
    echo "Please install Podman first:"
    echo "  macOS: brew install podman"
    echo "  Linux: sudo apt install podman"
    echo ""
    echo "Visit: https://podman.io/getting-started/installation"
    exit 1
fi

PODMAN_VERSION=$(podman --version)
print_success "Podman is installed: $PODMAN_VERSION"

# Check for podman-compose (optional)
if command -v podman-compose &> /dev/null; then
    PODMAN_COMPOSE_VERSION=$(podman-compose --version)
    print_success "podman-compose available: $PODMAN_COMPOSE_VERSION"
else
    print_warning "podman-compose not found (optional, using run.sh instead)"
fi

# Step 2: Installation Directory
print_header "Step 2: Installation Directory"
echo "Current installation directory: $INSTALL_DIR"
echo ""
read -p "Use this directory? [Y/n]: " use_dir
use_dir=${use_dir:-Y}

if [[ "$use_dir" =~ ^[Nn]$ ]]; then
    read -p "Enter installation directory: " custom_dir
    if [[ -d "$custom_dir" ]] && [[ -f "$custom_dir/run.sh" ]]; then
        INSTALL_DIR="$custom_dir"
        cd "$INSTALL_DIR"
        print_success "Changed to: $INSTALL_DIR"
    else
        print_error "Invalid directory or run.sh not found"
        exit 1
    fi
fi

# Verify required files
if [[ ! -f "run.sh" ]] || [[ ! -f ".env.example" ]]; then
    print_error "Required files not found in $INSTALL_DIR"
    exit 1
fi

# Step 3: LLM Provider Selection
print_header "Step 3: LLM Provider Selection"
echo ""
echo "Select your LLM provider:"
echo "  1) OpenAI (recommended)"
echo "  2) Anthropic Claude"
echo "  3) Google Gemini"
echo "  4) Groq"
echo ""
read -p "Enter choice [1-4]: " llm_choice

case $llm_choice in
    1)
        LLM_PROVIDER="openai"
        EMBEDDER_PROVIDER="openai"
        print_success "Selected: OpenAI"
        ;;
    2)
        LLM_PROVIDER="anthropic"
        EMBEDDER_PROVIDER="openai"
        print_success "Selected: Anthropic (requires OpenAI for embeddings)"
        ;;
    3)
        LLM_PROVIDER="gemini"
        EMBEDDER_PROVIDER="gemini"
        print_success "Selected: Google Gemini"
        ;;
    4)
        LLM_PROVIDER="groq"
        EMBEDDER_PROVIDER="openai"
        print_success "Selected: Groq (requires OpenAI for embeddings)"
        ;;
    *)
        print_warning "Invalid choice, defaulting to OpenAI"
        LLM_PROVIDER="openai"
        EMBEDDER_PROVIDER="openai"
        ;;
esac

# Step 4: API Key Collection
print_header "Step 4: API Key Configuration"

# Function to read PAI Knowledge System configuration from PAI .env
read_pai_knowledge_config() {
    local pai_env=""

    # Check common PAI .env locations
    if [[ -f "$HOME/.config/pai/.env" ]]; then
        pai_env="$HOME/.config/pai/.env"
    elif [[ -n "$PAI_DIR" ]] && [[ -f "$PAI_DIR/.env" ]]; then
        pai_env="$PAI_DIR/.env"
    elif [[ -f "$HOME/.pai/.env" ]]; then
        pai_env="$HOME/.pai/.env"
    fi

    if [[ -n "$pai_env" ]]; then
        # Source the file safely to read all PAI_KNOWLEDGE_* variables
        set -a
        source "$pai_env"
        set +a

        # Export variables if they exist
        [[ -n "$PAI_KNOWLEDGE_OPENAI_API_KEY" ]] && export PAI_KNOWLEDGE_OPENAI_API_KEY
        [[ -n "$PAI_KNOWLEDGE_LLM_PROVIDER" ]] && export PAI_KNOWLEDGE_LLM_PROVIDER
        [[ -n "$PAI_KNOWLEDGE_EMBEDDER_PROVIDER" ]] && export PAI_KNOWLEDGE_EMBEDDER_PROVIDER
        [[ -n "$PAI_KNOWLEDGE_MODEL_NAME" ]] && export PAI_KNOWLEDGE_MODEL_NAME
        [[ -n "$PAI_KNOWLEDGE_DATABASE_TYPE" ]] && export PAI_KNOWLEDGE_DATABASE_TYPE
        [[ -n "$PAI_KNOWLEDGE_SEMAPHORE_LIMIT" ]] && export PAI_KNOWLEDGE_SEMAPHORE_LIMIT
        [[ -n "$PAI_KNOWLEDGE_GROUP_ID" ]] && export PAI_KNOWLEDGE_GROUP_ID
        [[ -n "$PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED" ]] && export PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED

        return 0
    fi

    return 1
}

collect_key() {
    local key_name=$1
    local key_url=$2
    local key_var=$3
    local current_value=${!3}

    echo ""
    echo "You need a $key_name API key."
    echo "Get it from: $key_url"
    echo ""

    # If we already have a value from PAI .env, confirm it
    if [[ -n "$current_value" ]]; then
        echo "Found $key_name API key in PAI configuration."
        echo "Key: ${current_value:0:20}...${current_value: -4}"
        echo ""
        read -p "Use this key? [Y/n]: " use_key
        use_key=${use_key:-Y}

        if [[ "$use_key" =~ ^[Yy]$ ]]; then
            print_success "Using existing $key_name API key"
            eval "$key_var='$current_value'"
            return 0
        fi
    fi

    # Prompt for new key
    read -sp "Enter your $key_name API key: " api_key
    echo ""

    if [[ -z "$api_key" ]]; then
        print_warning "No API key provided. You'll need to add it later."
        eval "$key_var=''"
    else
        print_success "$key_name API key received"
        eval "$key_var='$api_key'"
    fi
}

# Initialize API key and config variables
PAI_KNOWLEDGE_OPENAI_API_KEY=""
PAI_KNOWLEDGE_LLM_PROVIDER=""
PAI_KNOWLEDGE_EMBEDDER_PROVIDER=""
PAI_KNOWLEDGE_MODEL_NAME=""
PAI_KNOWLEDGE_DATABASE_TYPE=""
PAI_KNOWLEDGE_SEMAPHORE_LIMIT=""
PAI_KNOWLEDGE_GROUP_ID=""
PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED=""
ANTHROPIC_API_KEY=""
GOOGLE_API_KEY=""
GROQ_API_KEY=""

# Try to read from PAI .env first
print_step "Checking PAI configuration..."
read_pai_knowledge_config
if [[ $? -eq 0 ]]; then
    print_success "Found PAI Knowledge System configuration in PAI .env"

    # Map PAI_KNOWLEDGE_* variables to script variables for provider selection
    if [[ -n "$PAI_KNOWLEDGE_LLM_PROVIDER" ]]; then
        LLM_PROVIDER="$PAI_KNOWLEDGE_LLM_PROVIDER"
        print_success "LLM Provider from config: $LLM_PROVIDER"
    fi

    if [[ -n "$PAI_KNOWLEDGE_EMBEDDER_PROVIDER" ]]; then
        EMBEDDER_PROVIDER="$PAI_KNOWLEDGE_EMBEDDER_PROVIDER"
    fi

    if [[ -n "$PAI_KNOWLEDGE_MODEL_NAME" ]]; then
        MODEL_NAME="$PAI_KNOWLEDGE_MODEL_NAME"
        print_success "Model from config: $MODEL_NAME"
    fi

    if [[ -n "$PAI_KNOWLEDGE_SEMAPHORE_LIMIT" ]]; then
        SEMAPHORE_LIMIT="$PAI_KNOWLEDGE_SEMAPHORE_LIMIT"
    fi

    if [[ -n "$PAI_KNOWLEDGE_DATABASE_TYPE" ]]; then
        DATABASE_TYPE="$PAI_KNOWLEDGE_DATABASE_TYPE"
    fi
fi

if [[ "$LLM_PROVIDER" == "openai" ]] || [[ "$EMBEDDER_PROVIDER" == "openai" ]]; then
    collect_key "PAI Knowledge System OpenAI" "https://platform.openai.com/api-keys" PAI_KNOWLEDGE_OPENAI_API_KEY
fi

if [[ "$LLM_PROVIDER" == "anthropic" ]]; then
    collect_key "Anthropic" "https://console.anthropic.com/" ANTHROPIC_API_KEY
fi

if [[ "$LLM_PROVIDER" == "gemini" ]] || [[ "$EMBEDDER_PROVIDER" == "gemini" ]]; then
    collect_key "Google" "https://aistudio.google.com/app/apikey" GOOGLE_API_KEY
fi

if [[ "$LLM_PROVIDER" == "groq" ]]; then
    collect_key "Groq" "https://console.groq.com/" GROQ_API_KEY
fi

# Step 5: Model Selection
print_header "Step 5: Model Configuration"

case $LLM_PROVIDER in
    openai)
        echo "Select OpenAI model:"
        echo "  1) gpt-4o-mini (recommended - fast & cost-effective)"
        echo "  2) gpt-4o (best quality)"
        echo "  3) gpt-3.5-turbo (economy)"
        echo ""
        read -p "Enter choice [1-3]: " model_choice
        case $model_choice in
            1) MODEL_NAME="gpt-4o-mini" ;;
            2) MODEL_NAME="gpt-4o" ;;
            3) MODEL_NAME="gpt-3.5-turbo" ;;
            *) MODEL_NAME="gpt-4o-mini" ;;
        esac
        ;;
    anthropic)
        MODEL_NAME="claude-sonnet-4-20250514"
        echo "Using Claude Sonnet 4"
        ;;
    gemini)
        MODEL_NAME="gemini-2.0-flash-exp"
        echo "Using Gemini 2.0 Flash"
        ;;
    groq)
        echo "Select Groq model:"
        echo "  1) llama-3.3-70b-versatile (recommended)"
        echo "  2) llama-3.1-70b-versatile"
        echo ""
        read -p "Enter choice [1-2]: " model_choice
        case $model_choice in
            1) MODEL_NAME="llama-3.3-70b-versatile" ;;
            2) MODEL_NAME="llama-3.1-70b-versatile" ;;
            *) MODEL_NAME="llama-3.3-70b-versatile" ;;
        esac
        ;;
esac

print_success "Selected model: $MODEL_NAME"

# Step 6: Concurrency Configuration
print_header "Step 6: Performance Configuration"

if [[ "$LLM_PROVIDER" == "openai" ]]; then
    echo "What is your OpenAI API tier?"
    echo "  1) Free tier"
    echo "  2) Tier 2 (60 requests/minute)"
    echo "  3) Tier 3 (500 requests/minute) - most common"
    echo "  4) Tier 4 (5000 requests/minute)"
    echo ""
    read -p "Enter choice [1-4]: " tier_choice

    case $tier_choice in
        1) SEMAPHORE_LIMIT="2" ;;
        2) SEMAPHORE_LIMIT="8" ;;
        3) SEMAPHORE_LIMIT="10" ;;
        4) SEMAPHORE_LIMIT="20" ;;
        *) SEMAPHORE_LIMIT="10" ;;
    esac
else
    SEMAPHORE_LIMIT="5"
    print_success "Using conservative concurrency: $SEMAPHORE_LIMIT"
fi

print_success "Concurrency limit: $SEMAPHORE_LIMIT"

# Step 7: Create Configuration
print_header "Step 7: Creating Configuration"

# Backup existing .env
if [[ -f ".env" ]]; then
    print_warning "Found existing .env file"
    read -p "Backup and replace? [Y/n]: " backup_choice
    backup_choice=${backup_choice:-Y}

    if [[ "$backup_choice" =~ ^[Yy]$ ]]; then
        cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
        print_success "Backed up to .env.backup.$(date +%Y%m%d_%H%M%S)"
    else
        print_error "Installation cancelled"
        exit 1
    fi
fi

# Create .env file
cat > .env << EOF
# PAI Knowledge System Configuration
# Generated: $(date)

# ============================================================================
# DEDICATED CONFIGURATION FOR THIS PACK
# ============================================================================
# This pack uses PAI_KNOWLEDGE_* prefixed variables to avoid conflicts with
# other packs. These will be automatically mapped to standard container
# environment variables during startup.
# ============================================================================

# API Keys (pack-specific)
EOF

if [[ -n "$PAI_KNOWLEDGE_OPENAI_API_KEY" ]]; then
    echo "PAI_KNOWLEDGE_OPENAI_API_KEY=$PAI_KNOWLEDGE_OPENAI_API_KEY" >> .env
fi

if [[ -n "$ANTHROPIC_API_KEY" ]]; then
    echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" >> .env
fi

if [[ -n "$GOOGLE_API_KEY" ]]; then
    echo "GOOGLE_API_KEY=$GOOGLE_API_KEY" >> .env
fi

if [[ -n "$GROQ_API_KEY" ]]; then
    echo "GROQ_API_KEY=$GROQ_API_KEY" >> .env
fi

cat >> .env << EOF

# LLM Provider Configuration (pack-specific)
PAI_KNOWLEDGE_LLM_PROVIDER=$LLM_PROVIDER
PAI_KNOWLEDGE_EMBEDDER_PROVIDER=$EMBEDDER_PROVIDER
PAI_KNOWLEDGE_MODEL_NAME=$MODEL_NAME

# Performance Configuration (pack-specific)
PAI_KNOWLEDGE_SEMAPHORE_LIMIT=$SEMAPHORE_LIMIT

# Knowledge Graph Configuration (pack-specific)
PAI_KNOWLEDGE_GROUP_ID=${PAI_KNOWLEDGE_GROUP_ID:-main}

# Database Configuration (pack-specific)
PAI_KNOWLEDGE_DATABASE_TYPE=${PAI_KNOWLEDGE_DATABASE_TYPE:-falkordb}

# Telemetry (set to 'false' to disable)
PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED=${PAI_KNOWLEDGE_GRAPHITI_TELEMETRY_ENABLED:-false}
EOF

print_success "Configuration file created: .env"

# Step 8: Start Services
print_header "Step 8: Starting Services"

chmod +x run.sh

print_step "Starting Graphiti MCP server..."
./run.sh

print_step "Waiting for server to start..."
sleep 15

# Check server health
print_step "Verifying server health..."
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    print_success "Server is running!"
else
    print_warning "Server health check inconclusive"
    echo "Check logs with: podman logs graphiti-knowledge-graph-mcp"
fi

# Step 9: Install PAI Skill
print_header "Step 9: Installing PAI Skill"

# Determine PAI directory
PAI_SKILLS_DIR=""
if [[ -d "$HOME/.claude/Skills" ]]; then
    PAI_SKILLS_DIR="$HOME/.claude/Skills"
elif [[ -n "$PAI_DIR" ]] && [[ -d "$PAI_DIR/Skills" ]]; then
    PAI_SKILLS_DIR="$PAI_DIR/Skills"
else
    echo ""
    echo "PAI skills directory not found."
    echo "Common locations:"
    echo "  - ~/.claude/Skills"
    echo "  - \$PAI_DIR/Skills"
    echo ""
    read -p "Enter PAI skills directory: " PAI_SKILLS_DIR

    if [[ ! -d "$PAI_SKILLS_DIR" ]]; then
        print_error "Directory does not exist: $PAI_SKILLS_DIR"
        echo "Skipping PAI skill installation. You can install it manually later."
        PAI_SKILLS_DIR=""
    fi
fi

if [[ -n "$PAI_SKILLS_DIR" ]]; then
    print_step "Installing to: $PAI_SKILLS_DIR/pai-knowledge-system"

    # Remove existing installation
    if [[ -d "$PAI_SKILLS_DIR/pai-knowledge-system" ]]; then
        print_warning "Removing existing installation"
        rm -rf "$PAI_SKILLS_DIR/pai-knowledge-system"
    fi

    # Copy skill
    cp -r pai-knowledge-system "$PAI_SKILLS_DIR/"
    print_success "PAI Knowledge System skill installed"
fi

# Step 10: Installation Summary
print_header "Installation Complete!"

echo ""
echo "📦 Configuration Summary:"
echo ""
echo "LLM Provider: $LLM_PROVIDER"
echo "Model: $MODEL_NAME"
echo "Concurrency: $SEMAPHORE_LIMIT"
echo ""
echo "Services:"
echo "  MCP Server: http://localhost:8000/mcp/"
echo "  FalkorDB UI: http://localhost:3000"
echo "  Health Check: http://localhost:8000/health"
echo ""

if [[ -n "$PAI_SKILLS_DIR" ]]; then
    echo "PAI Skill: $PAI_SKILLS_DIR/pai-knowledge-system"
    echo ""
    echo "⚠️  Restart Claude Code to load the skill"
fi

echo ""
echo "🎉 Next Steps:"
echo ""
echo "1. Test the installation:"
echo "   Remember that I'm testing the PAI Knowledge System."
echo ""
echo "2. Search your knowledge:"
echo "   What do I know about PAI?"
echo ""
echo "3. Check system status:"
echo "   Show the knowledge graph status"
echo ""

echo "Management Commands:"
echo "  View logs:    podman logs -f graphiti-knowledge-graph-mcp"
echo "  Restart:      podman restart graphiti-knowledge-graph-mcp"
echo "  Stop:         podman stop graphiti-knowledge-graph-mcp"
echo "  Start:        ./run.sh"
echo ""

print_success "Installation complete!"
