# Install PAI Knowledge System

**Complete installation workflow for the PAI Knowledge System pack.**

---

## Step 1: Announce Workflow

```bash
~/.claude/Tools/SkillWorkflowNotification Install PaiKnowledgeSystem
```

**Output to user:**
```
Running the **Install** workflow from the **PaiKnowledgeSystem** skill...
```

---

## Step 2: Verify Prerequisites

**Check if container runtime is installed:**

```bash
# Check for Podman or Docker
if command -v podman &> /dev/null; then
    CONTAINER_RUNTIME="podman"
    podman --version
    echo "✓ Detected Podman"
elif command -v docker &> /dev/null; then
    CONTAINER_RUNTIME="docker"
    docker --version
    echo "✓ Detected Docker"
else
    echo "❌ No container runtime found"
    echo "Install Podman: brew install podman (macOS)"
    echo "Install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if compose is available
if [[ "$CONTAINER_RUNTIME" == "podman" ]]; then
    podman-compose --version 2>/dev/null || echo "podman-compose not installed (optional)"
else
    docker compose version 2>/dev/null || echo "docker compose not installed (optional)"
fi
```

**Expected results:**
- Podman version 3.0+ OR Docker installed
- docker-compose or podman-compose is optional (run.sh works without it)

**If no container runtime is installed:**
```
❌ **Prerequisite Not Met**

No container runtime is installed on your system.

**Install Podman:**
- macOS: `brew install podman`
- Linux: `sudo apt install podman` (Ubuntu/Debian)
- Or visit: https://podman.io/getting-started/installation

**Install Docker:**
- Visit: https://docs.docker.com/get-docker/

Please install a container runtime and run this installation again.
```

---

## Step 3: Gather Configuration Requirements

**Determine installation directory:**

```bash
# Default: current directory
DEFAULT_DIR="$(pwd)"

# Ask user for installation location
echo "Installation directory [default: $DEFAULT_DIR]:"
read -r INSTALL_DIR

INSTALL_DIR="${INSTALL_DIR:-$DEFAULT_DIR}"
```

**Create installation directory structure:**

```bash
cd "$INSTALL_DIR"

# Verify required files exist
if [[ ! -f "src/server/run.sh" ]] || [[ ! -f "src/config/.env.example" ]]; then
    echo "❌ Error: Installation files not found in $INSTALL_DIR"
    echo "Please navigate to the pai-knowledge-system pack directory"
    echo "Required files:"
    echo "  - src/server/run.sh"
    echo "  - src/config/.env.example"
    exit 1
fi

echo "✓ Installation directory verified: $INSTALL_DIR"
```

---

## Step 4: API Key Configuration

**Collect required API keys from user:**

```bash
echo "🔑 API Key Configuration"
echo "========================"
echo ""
echo "The PAI Knowledge System requires an LLM provider API key."
echo "OpenAI is recommended for best results."
echo ""

# Ask which LLM provider to use
echo "Select LLM provider:"
echo "1) OpenAI (recommended) - Requires: OPENAI_API_KEY"
echo "2) Anthropic - Requires: ANTHROPIC_API_KEY + OPENAI_API_KEY (for embeddings)"
echo "3) Google Gemini - Requires: GOOGLE_API_KEY"
echo "4) Groq - Requires: GROQ_API_KEY + OPENAI_API_KEY (for embeddings)"
echo ""
read -p "Enter choice [1-4]: " llm_choice

case $llm_choice in
    1)
        LLM_PROVIDER="openai"
        EMBEDDER_PROVIDER="openai"
        ;;
    2)
        LLM_PROVIDER="anthropic"
        EMBEDDER_PROVIDER="openai"
        ;;
    3)
        LLM_PROVIDER="gemini"
        EMBEDDER_PROVIDER="gemini"
        ;;
    4)
        LLM_PROVIDER="groq"
        EMBEDDER_PROVIDER="openai"
        ;;
    *)
        echo "Invalid choice. Defaulting to OpenAI."
        LLM_PROVIDER="openai"
        EMBEDDER_PROVIDER="openai"
        ;;
esac

echo ""
echo "Selected: $LLM_PROVIDER (LLM) + $EMBEDDER_PROVIDER (embeddings)"
echo ""

# Collect API keys
collect_api_key() {
    local key_name=$1
    local key_description=$2

    echo "Enter your $key_name API key:"
    echo "($key_description)"
    echo "(or press Enter to skip if not using this provider)"
    read -s -r "$key_name"
    export "$key_name"
    echo ""
}

# Collect required keys based on provider
if [[ "$LLM_PROVIDER" == "openai" ]] || [[ "$EMBEDDER_PROVIDER" == "openai" ]]; then
    collect_api_key "OPENAI_API_KEY" "Get it from: https://platform.openai.com/api-keys"
fi

if [[ "$LLM_PROVIDER" == "anthropic" ]]; then
    collect_api_key "ANTHROPIC_API_KEY" "Get it from: https://console.anthropic.com/"
fi

if [[ "$LLM_PROVIDER" == "gemini" ]] || [[ "$EMBEDDER_PROVIDER" == "gemini" ]]; then
    collect_api_key "GOOGLE_API_KEY" "Get it from: https://aistudio.google.com/app/apikey"
fi

if [[ "$LLM_PROVIDER" == "groq" ]]; then
    collect_api_key "GROQ_API_KEY" "Get it from: https://console.groq.com/"
fi
```

---

## Step 5: Model Configuration

**Select model based on provider:**

```bash
echo "🤖 Model Configuration"
echo "======================"
echo ""

case $LLM_PROVIDER in
    openai)
        echo "Select OpenAI model:"
        echo "1) gpt-4o-mini (recommended) - Fast, cost-effective"
        echo "2) gpt-4o - Best quality, higher cost"
        echo "3) gpt-3.5-turbo - Economy option"
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
        echo "Using model: $MODEL_NAME"
        ;;
    gemini)
        MODEL_NAME="gemini-2.0-flash-exp"
        echo "Using model: $MODEL_NAME"
        ;;
    groq)
        echo "Select Groq model:"
        echo "1) llama-3.3-70b-versatile (recommended)"
        echo "2) llama-3.1-70b-versatile"
        echo ""
        read -p "Enter choice [1-2]: " model_choice
        case $model_choice in
            1) MODEL_NAME="llama-3.3-70b-versatile" ;;
            2) MODEL_NAME="llama-3.1-70b-versatile" ;;
            *) MODEL_NAME="llama-3.3-70b-versatile" ;;
        esac
        ;;
esac

echo ""
echo "Selected model: $MODEL_NAME"
```

---

## Step 6: Concurrency Configuration

**Determine SEMAPHORE_LIMIT based on API tier:**

```bash
echo "⚙️  Performance Configuration"
echo "============================"
echo ""

# Ask about API tier if OpenAI
if [[ "$LLM_PROVIDER" == "openai" ]]; then
    echo "What is your OpenAI API tier?"
    echo "1) Free tier (0 RPM)"
    echo "2) Tier 2 (60 RPM)"
    echo "3) Tier 3 (500 RPM) - Default/unknown"
    echo "4) Tier 4 (5000 RPM)"
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
    # Conservative defaults for other providers
    SEMAPHORE_LIMIT="5"
fi

echo ""
echo "Concurrency limit (SEMAPHORE_LIMIT): $SEMAPHORE_LIMIT"
```

---

## Step 7: Create .env File

**Generate configuration file:**

```bash
echo "📝 Creating Configuration"
echo "========================"
echo ""

# Backup existing .env if present
if [[ -f "src/config/.env" ]]; then
    echo "Found existing src/config/.env file. Backing up to src/config/.env.backup"
    cp src/config/.env src/config/.env.backup
fi

# Create new .env file
cat > src/config/.env << EOF
# PAI Knowledge System Configuration
# Generated: $(date)

# LLM Provider Configuration
LLM_PROVIDER=$LLM_PROVIDER
EMBEDDER_PROVIDER=$EMBEDDER_PROVIDER
MODEL_NAME=$MODEL_NAME

# API Keys
EOF

# Add API keys to .env
if [[ -n "$OPENAI_API_KEY" ]]; then
    echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> src/config/.env
fi

if [[ -n "$ANTHROPIC_API_KEY" ]]; then
    echo "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" >> src/config/.env
fi

if [[ -n "$GOOGLE_API_KEY" ]]; then
    echo "GOOGLE_API_KEY=$GOOGLE_API_KEY" >> src/config/.env
fi

if [[ -n "$GROQ_API_KEY" ]]; then
    echo "GROQ_API_KEY=$GROQ_API_KEY" >> src/config/.env
fi

# Add performance settings
cat >> src/config/.env << EOF

# Performance Configuration
SEMAPHORE_LIMIT=$SEMAPHORE_LIMIT

# Knowledge Graph Configuration
GROUP_ID=main

# Telemetry (set to 'false' to disable)
GRAPHITI_TELEMETRY_ENABLED=false
EOF

echo "✓ Configuration file created: src/config/.env"
```

---

## Step 8: Start Services

**Launch the Graphiti MCP server:**

```bash
echo ""
echo "🚀 Starting Services"
echo "===================="
echo ""

# Detect container runtime (reuse from Step 2 or re-detect)
if command -v podman &> /dev/null; then
    CONTAINER_RUNTIME="podman"
elif command -v docker &> /dev/null; then
    CONTAINER_RUNTIME="docker"
else
    echo "❌ No container runtime found!"
    exit 1
fi

echo "Using container runtime: $CONTAINER_RUNTIME"
echo ""

# Make run script executable
chmod +x src/server/run.sh

# Start the server
echo "Starting Graphiti MCP server..."
bash src/server/run.sh

# Wait for server to start
echo ""
echo "Waiting for server to start..."
sleep 10

# Check server health
echo "Verifying server health..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ Server is running!"
else
    echo "⚠ Server may not be fully started yet"
    echo "Check logs with: bash src/server/logs.sh"
fi
```

---

## Step 9: Install Knowledge Skill

**Create the Knowledge skill in your PAI installation:**

```bash
echo ""
echo "📦 Installing Knowledge Skill"
echo "=============================="
echo ""

# Determine PAI directory
if [[ -d "$HOME/.claude" ]]; then
    PAI_SKILLS_DIR="$HOME/.claude/skills"
elif [[ -n "$PAI_DIR" ]]; then
    PAI_SKILLS_DIR="$PAI_DIR/skills"
else
    echo "⚠ PAI directory not found."
    echo "Creating PAI directory structure at ~/.claude/skills"
    PAI_SKILLS_DIR="$HOME/.claude/skills"
    mkdir -p "$PAI_SKILLS_DIR"
fi

# Create skill directory (flat structure - no src/ in installed skill)
mkdir -p "$PAI_SKILLS_DIR/Knowledge/workflows"
mkdir -p "$PAI_SKILLS_DIR/Knowledge/tools"
mkdir -p "$PAI_SKILLS_DIR/Knowledge/server"
mkdir -p "$PAI_SKILLS_DIR/Knowledge/config"

echo "Created Knowledge skill directory structure"
echo ""

# Copy SKILL.md
echo "Installing SKILL.md..."
cp SKILL.md "$PAI_SKILLS_DIR/Knowledge/SKILL.md"

# Copy README
echo "Installing README.md..."
cp README.md "$PAI_SKILLS_DIR/Knowledge/README.md"

# Copy workflows (flatten to lowercase workflows/)
echo "Installing workflows..."
cp src/skills/workflows/*.md "$PAI_SKILLS_DIR/Knowledge/workflows/"

# Copy tools (flatten to lowercase tools/)
echo "Installing tools..."
cp src/skills/tools/*.md "$PAI_SKILLS_DIR/Knowledge/tools/"

# Copy server scripts (flatten to server/, not src/server/)
echo "Installing server scripts..."
cp src/server/*.sh "$PAI_SKILLS_DIR/Knowledge/server/"
cp src/server/*.yml "$PAI_SKILLS_DIR/Knowledge/server/"
chmod +x "$PAI_SKILLS_DIR/Knowledge/server/"*.sh

# Copy config (flatten to config/, not src/config/)
echo "Installing configuration..."
cp src/config/.env.example "$PAI_SKILLS_DIR/Knowledge/config/.env.example"

# Copy icon
echo "Installing icon..."
cp icon.png "$PAI_SKILLS_DIR/Knowledge/icon.png" 2>/dev/null || echo "  (No icon found, skipping)"

echo ""
echo "✓ Knowledge skill installed to: $PAI_SKILLS_DIR/Knowledge"
```

---

## Step 10: Verify Installation

**Run installation checks:**

```bash
echo ""
echo "✅ Installation Verification"
echo "============================"
echo ""

# Check 1: Container running
if bash src/server/status.sh 2>/dev/null | grep -q "running"; then
    echo "✓ PAI Knowledge container is running"
else
    echo "✗ Container may not be running"
    echo "  Start with: bash src/server/start.sh"
fi

# Check 2: Server responding
if curl -s http://localhost:8000/health | grep -q "healthy"; then
    echo "✓ MCP server is responding"
else
    echo "✗ MCP server health check failed"
    echo "  Check logs: bash src/server/logs.sh"
fi

# Check 3: Skill installed
if [[ -d "$PAI_SKILLS_DIR/Knowledge" ]]; then
    echo "✓ Knowledge skill is installed at: $PAI_SKILLS_DIR/Knowledge"
else
    echo "✗ Knowledge skill installation failed"
fi

# Check 4: Configuration exists
if [[ -f "src/config/.env" ]] && [[ -n "$OPENAI_API_KEY$ANTHROPIC_API_KEY$GOOGLE_API_KEY$GROQ_API_KEY" ]]; then
    echo "✓ Configuration file exists with API keys"
else
    echo "✗ Configuration may be incomplete"
    echo "  Check: src/config/.env"
fi
```

---

## Step 11: Configure MCP Server (Global)

**Enable MCP server integration in Claude Code:**

```bash
echo ""
echo "📝 Configuring MCP Server"
echo "=========================="
echo ""

# Create project-level .mcp.json (for reference)
echo "Creating .mcp.json (project reference)..."
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "pai-knowledge": {
      "type": "sse",
      "url": "http://localhost:8000/sse"
    }
  }
}
EOF

echo "✓ Created .mcp.json"
echo ""

# Configure global MCP server in ~/.claude.json
CLAUDE_CONFIG="$HOME/.claude.json"

echo "Configuring global MCP server in ~/.claude.json..."

# Check if ~/.claude.json exists, create if not
if [ ! -f "$CLAUDE_CONFIG" ]; then
    echo "Creating ~/.claude.json..."
    echo '{}' > "$CLAUDE_CONFIG"
fi

# Add MCP server configuration using Python
python3 << 'PYTHON_EOF'
import json

config_path = "$CLAUDE_CONFIG"

try:
    with open(config_path, 'r') as f:
        config = json.load(f)

    # Ensure mcpServers object exists
    if 'mcpServers' not in config:
        config['mcpServers'] = {}

    # Add pai-knowledge MCP server configuration
    config['mcpServers']['pai-knowledge'] = {
        'type': 'sse',
        'url': 'http://localhost:8000/sse'
    }

    # Write updated configuration
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

    print("✓ Added pai-knowledge to ~/.claude.json (global MCP configuration)")

except Exception as e:
    print(f"⚠️  Error updating ~/.claude.json: {e}")
    print("   Manual configuration may be required")
PYTHON_EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "IMPORTANT: Restart Claude Code to load MCP configuration!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
```

**What this step does:**
- Creates `.mcp.json` with SSE transport configuration (project-level reference)
- Configures `~/.claude.json` with MCP server for **global availability**
- Makes MCP tools available in all Claude Code sessions, not just this project

**Available MCP Tools (after restart):**
- `add_episode` - Add knowledge to graph
- `search_nodes` - Search entities
- `search_facts` - Search relationships
- `get_episodes` - Get recent episodes
- `get_status` - Check system status
- `clear_graph` - Clear all knowledge
- `delete_episode` - Remove episodes
- `delete_entity_edge` - Remove relationships
- `get_entity_edge` - Get edge details

---

## Step 12: Display Summary

**Present installation results:**

```markdown
🎉 **Installation Complete!**

**Configuration Summary:**

**Services:**
- MCP Server: http://localhost:8000/mcp/
- FalkorDB Web UI: http://localhost:3000
- Health Check: http://localhost:8000/health

**LLM Configuration:**
- Provider: [LLM_PROVIDER]
- Model: [MODEL_NAME]
- Embedder: [EMBEDDER_PROVIDER]
- Concurrency: [SEMAPHORE_LIMIT]

**PAI Integration:**
- Skill installed: [PAI_SKILLS_DIR]/pai-knowledge-system/
- Restart Claude Code to load the skill

**Next Steps:**

1. **Test the installation:**
   ```
   Remember that I'm testing the PAI Knowledge System installation.
   ```

2. **Search your knowledge:**
   ```
   What do I know about PAI?
   ```

3. **Check system status:**
   ```
   Show the knowledge graph status
   ```

**Management Commands:**

```bash
# View logs
bash src/server/logs.sh

# Restart server
bash src/server/stop.sh && bash src/server/start.sh

# Stop server
bash src/server/stop.sh

# Start again
bash src/server/start.sh

# Check status
bash src/server/status.sh
```

**Documentation:**
- [README](README.md) - Complete pack documentation
- [INSTALL.md](INSTALL.md) - Detailed installation guide
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide

🚀 Your PAI Knowledge System is ready to use!
```

---

## Troubleshooting

**Installation Fails:**

1. **Container runtime not installed**
   - Install Podman or Docker first
   - See: https://podman.io/getting-started/installation
   - Or: https://docs.docker.com/get-docker/

2. **API key validation fails**
   - Verify API key is correct
   - Check API key has credits/quota
   - Try regenerating key

3. **Server won't start**
   - Check port conflicts (8000, 6379, 3000)
   - Review logs: `bash src/server/logs.sh`
   - Ensure src/config/.env file is valid

4. **Skill not loading**
   - Verify PAI directory path
   - Restart Claude Code
   - Check SKILL.md for syntax errors

**Get Help:**
- Check logs: `bash src/server/logs.sh`
- Check status: `bash src/server/status.sh`
- Review: [TROUBLESHOOTING section in README](README.md#troubleshooting)

---

**Related Workflows:**
- `GetStatus.md` - Check system health after installation
- `CaptureEpisode.md` - Test knowledge capture
- `SearchKnowledge.md` - Test knowledge retrieval
