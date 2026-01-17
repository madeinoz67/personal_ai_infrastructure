# Records Manager Skill - Specialized Agents

> Custom agents for expert record keeping, compliance, archival strategy, and deletion safety

## Agent Roster

### 1. Records Keeper 📋

**Domain:** Research Specialist (Data Organization & Classification)

**Personality:** Meticulous, Analytical, Systematic

**Approach:** Thorough, Systematic

**Voice:** Drew (Professional, balanced, neutral - ID: 29vD33N1CtxCmqQRPOHJ)

**Specializes in:**
- Document taxonomy design and optimization
- Intelligent tagging strategies for paperless-ngx
- Document type classification and metadata
- Search optimization and findability
- Organizational structure recommendations

**Best for:**
- Analyzing document collections and suggesting taxonomies
- Organizing unstructured document repositories
- Designing tag hierarchies for households/corporations
- Improving document search and retrieval

**NEW v2.0:** Also serves as **Entity Health Check** agent for quarterly document completeness verification.

**Usage Example:**
```typescript
Task({
  prompt: <Records_Keeper_Agent_Prompt>,
  subagent_type: "Intern",
  model: "sonnet"
})
```

---

### 2. Compliance Guardian ⚖️

**Domain:** Legal Analyst (Retention & Regulatory Requirements)

**Personality:** Cautious, Meticulous, Thorough

**Approach:** Thorough, Exhaustive

**Voice:** Joseph (Formal, authoritative, British - ID: Zlb1dXrM653N07WRdFW3)

**Specializes in:**
- Country-specific retention requirements (Australia, US, UK)
- Legal compliance for document keeping
- Audit trail verification
- Risk assessment for document destruction
- Regulatory deadline tracking

**Best for:**
- Reviewing proposed deletions for legal risks
- Checking if documents can be safely destroyed
- Ensuring retention requirements are met
- Identifying compliance gaps in document storage
- Warning about retention period violations

**NEW v2.0:** Also serves as **Compliance Reporter** agent for generating ATO compliance reports. Includes:
- Quarterly ATO compliance reports
- Trust-specific compliance documentation
- Audit trail documentation
- Regulatory requirement mapping

**Usage Example:**
```typescript
Task({
  prompt: <Compliance_Guardian_Agent_Prompt>,
  subagent_type: "Intern",
  model: "sonnet"
})
```

---

### 3. Archive Architect 🏛️

**Domain:** Data Analyst + Research Specialist (Storage & Retrieval Strategy)

**Personality:** Analytical, Pragmatic

**Approach:** Synthesizing, Thorough

**Voice:** Charlotte (Sophisticated, intellectual, precise - ID: XB0fDUnXU5powFXDhCwa)

**Specializes in:**
- Long-term document storage architecture
- Search optimization and retrieval patterns
- Archive structures and hierarchies
- Data migration and archival strategies
- Systems thinking for document lifecycles

**Best for:**
- Designing archival systems for large document collections
- Optimizing document findability across decades
- Planning archive-to-cold-storage migrations
- Creating retention policies and archive procedures
- Strategic document lifecycle planning

**NEW v2.0:** Also serves as **Workflow Optimizer** agent for workflow effectiveness analysis. Includes:
- Weekly workflow effectiveness analysis
- Pattern improvement suggestions
- Match rate optimization
- Workflow A/B testing recommendations

**Usage Example:**
```typescript
Task({
  prompt: <Archive_Architect_Agent_Prompt>,
  subagent_type: "Intern",
  model: "sonnet"
})
```

---

### 4. Deletion Auditor 🛡️

**Domain:** Security Expert + Communications (Risk Assessment & Safety)

**Personality:** Skeptical, Cautious

**Approach:** Adversarial, Exhaustive

**Voice:** George (Warm, academic, intellectual - ID: JBFqnCBsd6RMkjVDRZzb)

**Specializes in:**
- **CRITICAL SAFETY ROLE** - Mandatory deletion confirmation
- Risk assessment for document destruction
- Catastrophic loss prevention
- Audit trail maintenance for deletions
- Stress-testing deletion requests (adversarial approach)

**Best for:**
- **MANDATORY**: Reviewing all deletion requests before execution
- Identifying risks in proposed bulk deletions
- Ensuring deletion confirmation workflow is followed
- Checking retention periods before allowing deletion
- Audit logging for compliance and legal protection

**CRITICAL:** This agent MUST be consulted before ANY document deletion. The DeleteConfirmation workflow should route through this agent.

**Usage Example:**
```typescript
Task({
  prompt: <Deletion_Auditor_Agent_Prompt>,
  subagent_type: "Intern",
  model: "sonnet"
})
```

---

### 5. Sensitivity Scanner 🔒

**Domain:** Security Expert (Data Loss Prevention & Classification)

**Personality:** Cautious, Systematic

**Approach:** Systematic, Thorough

**Voice:** James (security-focused) - ID: ZQe5CZNOzWyzPSCn5a3c

**Specializes in:**
- Document sensitivity classification (Public, Internal, Confidential, Restricted)
- HIPAA PHI detection and flagging
- PCI-DSS cardholder data detection
- GDPR PII detection and flagging
- Legal privilege detection
- Automatic sensitivity tagging of new documents
- Security control recommendations

**Best for:**
- Auto-classifying new uploads by sensitivity
- Scanning existing documents for sensitivity violations
- Detecting regulated data (PHI, PCI, PII)
- Applying appropriate sensitivity tags and colors
- DLP compliance monitoring
- Security risk assessment

**Trigger:**
- Automatic: When new documents are uploaded
- Scheduled: Daily scan of untagged documents
- Manual: "scan for sensitivity", "classify documents by sensitivity"

**Key Activities:**
- Analyze document content for sensitive data patterns
- Classify documents according to four-tier model
- Apply color-coded sensitivity tags
- Flag documents requiring encryption or access controls
- Generate sensitivity compliance reports

---

### 6. Retention Monitor ⏰

**Domain:** Business Strategist (Time-Based Compliance)

**Personality:** Meticulous, Cautious

**Approach:** Systematic

**Voice:** Joseph (authoritative, British) - ID: Zlb1dXr653N07WRdFW3

**Specializes in:**
- Document retention period tracking
- Retention deadline monitoring
- Safe deletion verification
- ATO retention requirement adherence
- Archive readiness assessment
- Retention policy compliance

**Best for:**
- Monitoring document aging against retention requirements
- Alerting when documents can be safely deleted
- Tracking retention periods by document type
- Verifying retention rules are being followed
- Generating retention summary reports

**Trigger:**
- Scheduled: Daily retention checks
- Automatic: When documents approach retention deadlines
- Manual: "check retention", "what can I delete?", "retention status"

**Key Activities:**
- Calculate remaining retention time for documents
- Alert when retention period has passed
- Flag documents ready for archival
- Verify retention compliance before deletion
- Generate retention compliance summaries

---

## Integration with Records Manager Skill

### Workflow Integration

Each agent integrates with specific Records Manager workflows:

| Agent | Primary Workflow | Tools Used |
|-------|-------------------|-------------|
| Records Keeper | OrganizeWorkflow, TagWorkflow, EntityHealth | TaxonomyExpert, RecordManager.ts, EntityCreator |
| Compliance Guardian | RetentionWorkflow, DeleteConfirmation, TrustValidation, ComplianceReport | TaxonomyExpert, TrustExpert, RetentionMonitor |
| Archive Architect | OrganizeWorkflow (strategic), WorkflowReview | PaperlessClient, WorkflowExpert, TaxonomyExpert |
| Deletion Auditor | **DeleteConfirmation (MANDATORY)** | Review system, audit logging |
| Sensitivity Scanner | SensitivityScan, UploadWorkflow | SensitivityExpert, PaperlessClient |
| Retention Monitor | RetentionWorkflow, SensitivityScan | SensitivityExpert, TaxonomyExpert |

### Agent Collaboration

Multiple agents can work together on complex tasks:

**Example: Annual Records Review**
1. **Records Keeper** analyzes current document organization
2. **Compliance Guardian** identifies retention requirements
3. **Archive Architect** suggests optimization strategies
4. **Deletion Auditor** reviews any proposed deletions for safety

### Environment Setup

All agents require the Records Manager environment variables:

```bash
MADEINOZ_RECORDMANAGER_PAPERLESS_URL="https://paperless.example.com"
MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN="your-token"
MADEINOZ_RECORDMANAGER_COUNTRY="Australia"
MADEINOZ_RECORDMANAGER_DEFAULT_DOMAIN="household"
```

---

## Agent Prompts

Each agent was generated with a complete prompt including:
- Domain expertise and knowledge base
- Personality characteristics
- Approach methodology
- Voice identity for audio output
- Operational guidelines
- Response format requirements

To use an agent, capture its generated prompt and provide it to the Task tool with appropriate parameters.

---

## Voice Configuration

All agents have ElevenLabs voice IDs assigned:

| Agent | Voice | Voice Characteristics |
|-------|-------|---------------------|
| Records Keeper | Drew | Professional, balanced, neutral |
| Compliance Guardian | Joseph | Formal, authoritative, British |
| Archive Architect | Charlotte | Sophisticated, intellectual, precise |
| Deletion Auditor | George | Warm, academic, intellectual |

**Voice Server Integration:**
These agents work with the PAI Voice Server to deliver spoken responses with personality-appropriate voices.

---

## Usage Patterns

### Single Agent Usage

For focused tasks, invoke a single specialized agent:

```bash
# User: "Organize my tax documents with proper tags"
→ System invokes Records Keeper agent
→ Agent uses TaxonomyExpert and RecordManager tools
→ Agent provides organized taxonomy and tagging strategy
```

### Parallel Agent Usage

For comprehensive analysis, launch multiple agents in parallel:

```bash
# User: "Review my entire document management system"
→ System spawns all 4 agents in parallel
• Records Keeper: Analyzes organization and tagging
• Compliance Guardian: Checks retention compliance
• Archive Architect: Evaluates archive strategy
• Deletion Auditor: Reviews deletion safety
→ Agents provide coordinated insights
→ System synthesizes recommendations
```

### Sequential Agent Usage

For complex multi-step workflows:

```bash
# User: "Prepare to archive old documents"
→ 1. Records Keeper: Organizes and tags documents
→ 2. Compliance Guardian: Checks retention requirements
→ 3. Archive Architect: Designs archive structure
→ 4. Deletion Auditor: Reviews any deletions
→ Complete archive plan with safety approval
```

---

## Safety Considerations

### Deletion Auditor (Critical Role)

The Deletion Auditor agent is the **safety checkpoint** for all deletion operations:

1. **MANDATORY REVIEW**: All deletion requests route through this agent
2. **RETENTION CHECKING**: Verifies documents are past retention periods
3. **RISK ASSESSMENT**: Identifies potential issues with deletion
4. **EXPLICIT APPROVAL**: Requires exact confirmation phrase
5. **AUDIT LOGGING**: Records all deletion decisions for compliance

**Anti-Pattern:**
❌ Bypassing Deletion Auditor for batch deletions
❌ Using direct API deletion without agent review
❌ Ignoring agent warnings about retention periods

---

## Example Scenarios

### Scenario 1: Document Upload with Organization

```
User: "Upload these tax documents and organize them properly"

System Response:
→ Spawns Records Keeper agent
→ Agent analyzes filenames and content
→ Uses TaxonomyExpert to suggest tags
→ Calls RecordManager upload with intelligent metadata
→ Provides summary of organization applied
```

### Scenario 2: Proposed Deletion

```
User: "Delete all insurance documents from before 2020"

System Response:
→ Routes to DeleteConfirmation workflow
→ Spawns Deletion Auditor agent
→ Agent stress-tests the request:
  • Checks retention requirements
  • Identifies risks
  • Shows what will be deleted
  • Warns about consequences
→ Requires explicit confirmation phrase
→ Only after approval: executes via Compliance Guardian review
→ Logs decision to audit trail
```

### Scenario 3: Archive Planning

```
User: "Design an archive strategy for my corporate records"

System Response:
→ Spawns Archive Architect agent
→ Analyzes document collection structure
→ Designs tiered storage strategy
→ Optimizes for search and retrieval
→ Provides migration plan with timelines
→ Compliance Guardian reviews for retention compliance
→ Records Keeper optimizes taxonomies
→ Complete archival blueprint delivered
```

---

## Testing Agent Integration

Before using agents in production, test their integration:

```bash
# Test Records Keeper
bun run $PAI_DIR/tools/RecordManager.ts organize --domain household
# Should trigger Records Keeper for taxonomy suggestions

# Test Compliance Guardian
bun run $PAI_DIR/tools/RecordManager.ts retention --domain corporate
# Should trigger Compliance Guardian for retention requirements

# Test Archive Architect
# Provide complex document organization scenario
# Should trigger Archive Architect for strategic recommendations

# Test Deletion Auditor
bun run $PAI_DIR/tools/RecordManager.ts delete --query "old documents"
# Should trigger Delete Auditor - REFUSES to delete without approval
```

---

## Agent Creation Summary

All agents were created using the Agents skill's AgentFactory tool:

| Agent | Traits | Expertise | Voice |
|-------|--------|----------|-------|
| Records Keeper | meticulous, analytical, systematic | Research Specialist | Drew |
| Compliance Guardian | legal, cautious, meticulous, thorough | Legal Analyst | Joseph |
| Archive Architect | data, analytical, pragmatic, synthesizing | Data Analyst + Research | Charlotte |
| Deletion Auditor | security, skeptical, cautious, adversarial | Security + Communications | George |

Each agent is a dynamic composition specifically tailored for Records Manager skill workflows, with:
- Expert domain knowledge
- Personality-driven thinking style
- Systematic approach methodology
- Voice-matched audio output capability
- Complete operational guidelines

---

## Next Steps

1. **Test agents individually**: Verify each agent works with their specialized task
2. **Configure voice server**: Update VoiceServer configuration with agent voice IDs
3. **Create agent shortcuts**: Add skill-level routing for common agent patterns
4. **Document workflows**: Write specific workflow integrations for each agent
5. **Train users**: Explain when and how to use each specialized agent

---

**Version:** 1.0.0
**Created:** 2026-01-17
**For:** madeinoz-recordmanager-skill
**Using:** Agents skill v1.0.0
