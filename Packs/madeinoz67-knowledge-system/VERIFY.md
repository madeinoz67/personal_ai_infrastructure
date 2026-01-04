# Knowledge - Verification Checklist

Mandatory verification checklist for the Knowledge pack installation.

**Use this checklist to verify that your installation is complete and functional.**

---

## Verification Overview

This checklist ensures:
- ✅ All components are installed
- ✅ System is properly configured
- ✅ All integrations are working
- ✅ End-to-end functionality is operational

**Run through each section in order. Mark items as PASS or FAIL.**

---

## Section 1: Directory Structure Verification

Verify all required files and directories are present.

### 1.1 Pack Root Files

- [ ] **README.md** exists in pack root (`pai-knowledge-system/README.md`)
- [ ] **INSTALL.md** exists in pack root (`pai-knowledge-system/INSTALL.md`)
- [ ] **VERIFY.md** exists in pack root (this file)
- [ ] **SKILL.md** exists in pack root (`pai-knowledge-system/SKILL.md`)

**Verification commands:**
```bash
cd /path/to/podman-graphiti-knowledge-graph-mcp/pai-knowledge-system
ls -la README.md INSTALL.md VERIFY.md SKILL.md
```

**Expected result:** All four files listed

---

### 1.2 Source Directory Structure

- [ ] **src/skills/workflows/** directory exists
- [ ] **src/skills/tools/** directory exists

**Verification commands:**
```bash
ls -la src/skills/workflows/
ls -la src/skills/tools/
```

**Expected result:** Directories exist with workflow and tool files

---

### 1.3 Workflow Files

All required workflows must be present:

- [ ] `CaptureEpisode.md` - Add knowledge to graph
- [ ] `SearchKnowledge.md` - Search entities and summaries
- [ ] `SearchFacts.md` - Find relationships
- [ ] `GetRecent.md` - Retrieve recent knowledge
- [ ] `GetStatus.md` - Check system health
- [ ] `ClearGraph.md` - Delete all knowledge
- [ ] `BulkImport.md` - Import multiple documents

**Verification commands:**
```bash
ls -1 src/skills/workflows/
```

**Expected result:** All 7 workflow files listed

---

### 1.4 Tool Files

Required tool files:

- [ ] `Install.md` - Installation workflow
- [ ] `README.md` - Tools documentation

**Verification commands:**
```bash
ls -1 src/skills/tools/
```

**Expected result:** At least Install.md and README.md

---

### 1.5 MCP Server Files

- [ ] `run.sh` exists in project root
- [ ] `.env` exists in project root
- [ ] `.env` contains valid API key
- [ ] `.env` has MODEL_NAME configured
- [ ] `.env` has LLM_PROVIDER configured

**Verification commands:**
```bash
cd /path/to/podman-graphiti-knowledge-graph-mcp
ls -la run.sh .env
grep OPENAI_API_KEY .env | grep -v "^#"
grep MODEL_NAME .env
grep LLM_PROVIDER .env
```

**Expected result:** Files exist, API key is set (not empty), model and provider are configured

---

## Section 2: MCP Server Verification

Verify the Graphiti MCP server is running and accessible.

### 2.1 Container Status

- [ ] **Container is running**

**Verification commands:**
```bash
podman ps | grep graphiti-knowledge-graph-mcp
```

**Expected result:** Container listed with status "Up"

---

### 2.2 Server Health Endpoint

- [ ] **Health endpoint returns "healthy"**

**Verification commands:**
```bash
curl -s http://localhost:8000/health
```

**Expected result:** `{"status":"healthy"}` or similar

---

### 2.3 MCP Endpoint Access

- [ ] **MCP endpoint is accessible**

**Verification commands:**
```bash
curl -s http://localhost:8000/mcp/ | head -20
```

**Expected result:** JSON response with MCP tools listed (add_episode, search_nodes, etc.)

---

### 2.4 FalkorDB Connection

- [ ] **FalkorDB is responding**

**Verification commands:**
```bash
podman exec graphiti-knowledge-graph-mcp redis-cli -p 6379 PING
```

**Expected result:** `PONG` or similar

---

### 2.5 Server Logs (No Errors)

- [ ] **No critical errors in logs**

**Verification commands:**
```bash
podman logs --tail 50 graphiti-knowledge-graph-mcp | grep -i "error\|critical\|fatal"
```

**Expected result:** No output (or only warnings, not errors)

---

## Section 3: PAI Skill Verification

Verify the PAI skill is properly installed and formatted.

### 3.1 Skill Installation

- [ ] **Skill directory exists in PAI installation**

**Verification commands:**
```bash
ls -la ~/.claude/skills/Knowledge/
# OR if using custom PAI_DIR
ls -la ${PAI_DIR}/Skills/Knowledge/
```

**Expected result:** Directory exists with SKILL.md, README.md, workflows/, tools/, server/, config/

---

### 3.2 SKILL.md Frontmatter

- [ ] **SKILL.md has valid YAML frontmatter**
- [ ] **Frontmatter contains 'name' field**
- [ ] **Frontmatter contains 'description' field**
- [ ] **Description includes 'USE WHEN' clause**

**Verification commands:**
```bash
head -10 ~/.claude/skills/Knowledge/SKILL.md
```

**Expected result:** YAML frontmatter with name and description containing "USE WHEN"

---

### 3.3 Workflow Routing Table

- [ ] **SKILL.md contains workflow routing table**
- [ ] **All 7 workflows are listed in table**
- [ ] **Each workflow has trigger phrases**

**Verification commands:**
```bash
grep -A 20 "## Workflow Routing" ~/.claude/skills/Knowledge/SKILL.md
```

**Expected result:** Table with workflows and their triggers

---

### 3.4 Workflow Files Accessible

- [ ] **All workflow files are readable**
- [ ] **Workflow files have proper titles**
- [ ] **Workflow files follow PAI conventions**

**Verification commands:**
```bash
for file in ~/.claude/skills/Knowledge/workflows/*.md; do
    echo "Checking: $file"
    head -5 "$file"
done
```

**Expected result:** All files are readable with markdown headers

---

## Section 4: Configuration Verification

Verify all configuration is correct.

### 4.1 Environment Variables

- [ ] **OPENAI_API_KEY is set** (or alternative provider)
- [ ] **MODEL_NAME is set**
- [ ] **LLM_PROVIDER is set**
- [ ] **EMBEDDER_PROVIDER is set**
- [ ] **SEMAPHORE_LIMIT is set**

**Verification commands:**
```bash
cd /path/to/podman-graphiti-knowledge-graph-mcp
source .env
echo "API Key: ${OPENAI_API_KEY:+SET}"
echo "Model: $MODEL_NAME"
echo "LLM Provider: $LLM_PROVIDER"
echo "Embedder: $EMBEDDER_PROVIDER"
echo "Semaphore Limit: $SEMAPHORE_LIMIT"
```

**Expected result:** All variables show values (not empty)

---

### 4.2 API Key Validation

- [ ] **API key has valid format** (starts with "sk-" for OpenAI)
- [ ] **API key has quota/credits available**

**Verification commands:**
```bash
# Check format
grep OPENAI_API_KEY .env | grep -v "^#" | grep "sk-"

# Test API (requires curl and jq)
curl -s https://api.openai.com/v1/models \
    -H "Authorization: Bearer $(grep OPENAI_API_KEY .env | cut -d= -f2)" \
    | head -5
```

**Expected result:** API key matches format, API returns model list (not error)

---

### 4.3 Port Availability

- [ ] **Port 8000 is available** (or server is listening)
- [ ] **Port 6379 is available** (or FalkorDB is listening)

**Verification commands:**
```bash
lsof -i :8000
lsof -i :6379
```

**Expected result:** Either no output (ports available) or graphiti-knowledge-graph-mcp listed (using ports)

---

## Section 5: End-to-End Functionality

Verify the complete system works end-to-end.

### 5.1 Knowledge Capture

- [ ] **Can capture knowledge to graph**

**Verification commands:**
```bash
curl -s -X POST http://localhost:8000/mcp/ \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc":"2.0",
        "id":1,
        "method":"tools/call",
        "params":{
            "name":"add_episode",
            "arguments":{
                "episode_body":"PAI Knowledge System verification test on $(date)",
                "reference_timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
            }
        }
    }' | jq .
```

**Expected result:** JSON response with episode UUID, no errors

---

### 5.2 Knowledge Search

- [ ] **Can search knowledge graph**

**Verification commands:**
```bash
curl -s -X POST http://localhost:8000/mcp/ \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc":"2.0",
        "id":2,
        "method":"tools/call",
        "params":{
            "name":"search_nodes",
            "arguments":{
                "query":"PAI Knowledge System",
                "limit":5
            }
        }
    }' | jq .
```

**Expected result:** JSON response with search results (may be empty if graph is new)

---

### 5.3 Relationship Search

- [ ] **Can search relationships**

**Verification commands:**
```bash
curl -s -X POST http://localhost:8000/mcp/ \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc":"2.0",
        "id":3,
        "method":"tools/call",
        "params":{
            "name":"search_facts",
            "arguments":{
                "query":"PAI",
                "limit":5
            }
        }
    }' | jq .
```

**Expected result:** JSON response with facts/relationships (may be empty if graph is new)

---

### 5.4 Status Check

- [ ] **Can get system status**

**Verification commands:**
```bash
curl -s -X POST http://localhost:8000/mcp/ \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc":"2.0",
        "id":4,
        "method":"tools/call",
        "params":{
            "name":"get_status",
            "arguments":{}
        }
    }' | jq .
```

**Expected result:** JSON with entity_count, episode_count, last_updated fields

---

### 5.5 Recent Episodes

- [ ] **Can retrieve recent episodes**

**Verification commands:**
```bash
curl -s -X POST http://localhost:8000/mcp/ \
    -H "Content-Type: application/json" \
    -d '{
        "jsonrpc":"2.0",
        "id":5,
        "method":"tools/call",
        "params":{
            "name":"get_episodes",
            "arguments":{
                "limit":5
            }
        }
    }' | jq .
```

**Expected result:** JSON array with episodes (includes test episode from 5.1)

---

## Section 6: Integration Verification

Verify integration with PAI system and Claude Code.

### 6.1 PAI Skill Recognition

- [ ] **Claude Code recognizes the skill**

**Verification:**
1. Restart Claude Code
2. In Claude Code, type: `What is the PAI Knowledge System?`
3. Check if Claude mentions the skill

**Expected result:** Claude is aware of the PAI Knowledge System skill

---

### 6.2 Workflow Invocation

- [ ] **Workflows can be invoked via natural language**

**Verification:**
In Claude Code, try each trigger phrase:

1. "Show the knowledge graph status" → Should invoke GetStatus
2. "Remember that this is a test" → Should invoke CaptureEpisode
3. "What do I know about PAI?" → Should invoke SearchKnowledge

**Expected result:** Claude Code follows the workflow instructions

---

### 6.3 MCP Tool Access

- [ ] **Claude Code can access MCP tools**

**Verification:**
In Claude Code, the workflows reference MCP server tools. If workflows execute successfully, MCP integration is working.

**Expected result:** Workflows complete without MCP connection errors

---

## Section 7: Documentation Verification

Verify all documentation is complete and accurate.

### 7.1 README.md Completeness

- [ ] **README.md has all required sections**
- [ ] **README.md has proper YAML frontmatter**
- [ ] **Architecture diagrams are present**
- [ ] **Example usage is documented**

**Verification commands:**
```bash
grep "^##" pai-knowledge-system/README.md | head -20
head -35 pai-knowledge-system/README.md | grep "^---"
```

**Expected result:** All major sections listed, frontmatter present

---

### 7.2 INSTALL.md Completeness

- [ ] **INSTALL.md has pre-installation analysis**
- [ ] **INSTALL.md has step-by-step instructions**
- [ ] **INSTALL.md has troubleshooting section**

**Verification commands:**
```bash
grep "^##" pai-knowledge-system/INSTALL.md
```

**Expected result:** Sections for Prerequisites, Pre-Installation, Steps, Troubleshooting

---

### 7.3 Workflow Documentation

- [ ] **Each workflow has clear purpose**
- [ ] **Each workflow has usage examples**
- [ ] **Each workflow has MCP tool references**

**Verification:**
Open and review each workflow file in `src/skills/workflows/`

**Expected result:** All workflows are well-documented

---

## Section 8: End-to-End Completeness

Verify the pack has no missing components (Template Requirement).

### 8.1 Chain Test

**The Chain Test:** Trace every data flow to ensure no "beyond scope" gaps.

**Data Flow 1: User Input → Knowledge Graph**
- [ ] User triggers skill (Claude Code)
- [ ] Workflow executes (SKILL.md routing)
- [ ] MCP server receives request (HTTP to localhost:8000)
- [ ] Graphiti processes episode (LLM extraction)
- [ ] FalkorDB stores data (graph persistence)

**Verification:** All components are included in pack ✅

---

**Data Flow 2: Knowledge Graph → User Output**
- [ ] User searches knowledge (Claude Code)
- [ ] Workflow executes (SearchKnowledge)
- [ ] MCP server receives request (HTTP)
- [ ] Graphiti searches graph (vector embeddings)
- [ ] FalkorDB returns results (graph query)
- [ ] Results formatted and returned (workflow output)

**Verification:** All components are included in pack ✅

---

### 8.2 No "Beyond Scope" Statements

- [ ] **README has no "beyond scope" statements**
- [ ] **INSTALL has no "implement your own" statements**
- [ ] **All referenced components are included**

**Verification commands:**
```bash
grep -i "beyond.*scope\|implement.*your.*own\|left as.*exercise" \
    pai-knowledge-system/README.md \
    pai-knowledge-system/INSTALL.md
```

**Expected result:** No matches (all components are included)

---

### 8.3 Complete Component List

- [ ] **MCP Server included** (`run.sh` in project root)
- [ ] **PAI Skill included** (`SKILL.md` with workflows)
- [ ] **Workflows included** (7 complete workflows in `src/skills/workflows/`)
- [ ] **Installation included** (`INSTALL.md` with all steps)
- [ ] **Configuration included** (`.env` template with all variables)
- [ ] **Documentation included** (README, INSTALL, VERIFY)
- [ ] **No external dependencies** beyond documented prerequisites

**Verification:** Manual review of pack contents ✅

---

## Section 9: Optional Verification

Optional but recommended checks.

### 9.1 Performance Test

- [ ] **Knowledge capture completes in < 30 seconds**
- [ ] **Search completes in < 10 seconds**
- [ ] **Server responds to health check in < 1 second**

**Verification:**
```bash
time curl -s http://localhost:8000/health
```

---

### 9.2 Data Persistence

- [ ] **Knowledge persists across container restarts**

**Verification:**
1. Add test knowledge
2. Restart container: `podman restart graphiti-knowledge-graph-mcp`
3. Search for test knowledge
4. Verify it's still there

---

### 9.3 Error Handling

- [ ] **Invalid API key returns clear error**
- [ ] **Server not handled gracefully in workflows**
- [ ] **Empty search results handled gracefully**

**Verification:**
Test error scenarios and verify helpful error messages

---

## Verification Summary

### Pass Criteria

For a successful installation, you must have:

**Critical (ALL must pass):**
- ✅ All files in correct locations (Section 1)
- ✅ MCP server running and accessible (Section 2)
- ✅ PAI skill installed and formatted (Section 3)
- ✅ Configuration complete with valid API key (Section 4)
- ✅ End-to-end functionality working (Section 5)
- ✅ No "beyond scope" gaps (Section 8)

**Important (at least 80% pass):**
- ✅ Integration with Claude Code (Section 6)
- ✅ Documentation complete (Section 7)

### Failure Actions

If any critical item fails:

1. **Review logs:** `podman logs graphiti-knowledge-graph-mcp`
2. **Check configuration:** Verify `.env` has correct values
3. **Re-run installation:** Follow `INSTALL.md` steps again
4. **Check troubleshooting:** Review troubleshooting section in `INSTALL.md`

### Final Verification

Once all checks pass:

- [ ] **Create a test episode** in Claude Code: "Remember that I've successfully installed the PAI Knowledge System"
- [ ] **Search for it**: "What do I know about the PAI Knowledge System installation?"
- [ ] **Verify it's returned**: The search should find your test episode

**If all three steps work, your installation is complete and verified!** ✅

---

**Verification completed:** _______________

**Verified by:** _______________

**Result:** PASS / FAIL

---

**Next Steps:**
- If PASS: Start using the PAI Knowledge System!
- If FAIL: Review failed items, re-install as needed, and re-verify
