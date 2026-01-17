---
name: Records Manager Skill
pack-id: madeinoz-recordmanager-skill-v1.0.0
version: 1.0.0
author: madeinoz
description: Subject matter expert in record keeping and paperless-ngx API integration with country-specific taxonomies and deletion confirmation safeguards
type: skill
purpose-type: [productivity, automation, organization]
platform: agnostic
dependencies: []
keywords: [records, management, paperless-ngx, documents, taxonomy, archiving, household, corporate, compliance]
---

<p align="center">
  <img src="icons/madeinoz-recordmanager-skill.png" alt="Records Manager Skill" width="256">
</p>

# Records Manager Skill

> Expert record keeping system with paperless-ngx integration, country-specific taxonomies, and intelligent document management

## Installation Prompt

You are receiving a PAI Pack - a modular upgrade for AI agent systems.

**What is PAI?** See: [PAI Project Overview](../../README.md#what-is-pai)

**What is a Pack?** See: [Pack System](../../README.md#the-journey-pai-v1x--v20)

This pack adds expert record keeping capabilities to your AI assistant. The Records Manager Skill is a comprehensive document management system that integrates with paperless-ngx to provide:

- **Intelligent Document Organization**: Automatic tagging, categorization, and taxonomic structure
- **Country-Specific Compliance**: Record keeping guidelines tailored to your jurisdiction
- **Safe Operations**: Deletion confirmation workflow prevents catastrophic data loss
- **Search Optimization**: Data structures optimized for finding relevant documents quickly
- **Expert Taxonomies**: Household, corporate, and project management record structures

**Core principle**: Organize once, find forever. Your AI assistant becomes an expert records manager that knows how to properly categorize, tag, and manage documents according to best practices and local requirements.

Please follow the installation instructions below to integrate this pack into your infrastructure.

---

## What's Included

| Component | File | Purpose |
|-----------|------|---------|
| Skill definition | `src/skills/RECORDSMANAGER/SKILL.md` | Main skill routing and workflow definitions |
| Paperless API client | `src/lib/PaperlessClient.ts` | Complete paperless-ngx API integration |
| Taxonomy expert | `src/lib/TaxonomyExpert.ts` | Country-specific record keeping taxonomies |
| Record manager CLI | `src/tools/RecordManager.ts` | Main CLI tool for all record operations |
| Delete confirmation | `src/workflows/DeleteConfirmation.md` | Mandatory workflow for deletion approval |
| Test suite | `src/tests/RecordManager.test.ts` | Comprehensive test coverage |
| Environment template | `src/config/.env.template` | Configuration template with all variables |

**Summary:**
- **Files created:** 7
- **Skills registered:** 1
- **Dependencies:** None (uses bun runtime)
- **External services:** paperless-ngx instance required

---

## The Concept and/or Problem

Digital document management is universally broken. Across households, small businesses, and organizations, the same problems repeat:

**For Households:**
- Important documents lost in disorganized folders
- Tax documents scattered across email, downloads, and paper
- Insurance policies, warranties, and receipts impossible to find when needed
- No system for knowing what to keep and for how long
- Family members can't find documents after the "keeper of the papers" is unavailable

**For Small Business:**
- Corporate records compliance requirements misunderstood or ignored
- Invoice and receipt chaos makes accounting painful
- No audit trail for important business decisions
- Contract management is ad-hoc and unreliable
- Regulatory deadlines missed because records aren't tracked

**For Project Management:**
- Project documentation scattered across multiple systems
- No clear structure for what belongs in a project record
- Difficulty finding historical project data when planning new work
- Lessons learned not captured or accessible
- Handoffs between team members are incomplete

**For Everyone:**
- Search is only as good as your taxonomy
- Naming conventions break down at scale
- Consistent tagging requires discipline most people don't have
- Deletion is terrifying because recovery is uncertain
- Re-organizing is a nightmare because moving documents breaks links

**The Fundamental Problem:**

Most document management systems are just storage with a search box. They don't know:
- What documents you have based on your life/business situation
- How long you're legally required to keep things
- What taxonomy structure makes sense for your use case
- How to safely delete when you're sure you don't need something
- How to optimize structures for finding, not just storing

Without a records manager expert, your documents are stored but not managed. Every search is a treasure hunt. Every deletion is a risk. Compliance is accidental.

---

## The Solution

The Records Manager Skill solves this through **intelligent, taxonomy-driven document management** with paperless-ngx as the storage engine.

**High-Level Architecture:**

```
User Request
    ↓
┌─────────────────────────────────────────────────────────┐
│  RECORDS MANAGER SKILL                                  │
│  - Triggers on record/document intent                   │
│  - Routes to appropriate workflow                       │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│  TAXONOMY EXPERT                                        │
│  - Country-specific guidelines (from setup)             │
│  - Domain expertise (household/corporate/projects)      │
│  - Suggests tags, document types, retention periods     │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│  PAPERLESS-NGX API CLIENT                               │
│  - Complete API integration                             │
│  - Document upload, tagging, searching                  │
│  - Metadata management                                  │
└─────────────────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────────────────┐
│  DELETION CONFIRMATION (SPECIAL CASE)                   │
│  - Explicit approval required                           │
│  - Explains consequences                                │
│  - Cannot be bypassed                                   │
└─────────────────────────────────────────────────────────┘
```

**Key Components:**

1. **TaxonomyExpert Library** (`src/lib/TaxonomyExpert.ts`)
   - Country-specific record keeping requirements
   - Household taxonomies (financial, medical, legal, insurance, education)
   - Corporate taxonomies (invoices, contracts, compliance, HR)
   - Project management taxonomies (plans, deliverables, communications)
   - Retention period recommendations based on document type

2. **PaperlessClient Library** (`src/lib/PaperlessClient.ts`)
   - Full paperless-ngx REST API wrapper
   - Document upload with OCR
   - Tag and document type management
   - Search with filters
   - Batch operations
   - **NO DELETE METHODS** (must use confirmation workflow)

3. **RecordManager CLI** (`src/tools/RecordManager.ts`)
   - `upload` - Add documents with intelligent tagging
   - `search` - Find documents by tag, type, date, content
   - `organize` - Suggest and apply taxonomy improvements
   - `tag` - Add or modify tags on documents
   - `info` - Get document details and metadata
   - `retention` - Check retention requirements for documents

4. **DeleteConfirmation Workflow** (`src/workflows/DeleteConfirmation.md`)
   - MANGATORY approval step before any deletion
   - Explains what will be deleted and consequences
   - Requires explicit confirmation from principal
   - Logs all deletion requests for audit trail

**Design Principles:**

1. **Safety First**: Deletion is catastrophic - approval cannot be bypassed
2. **Taxonomy-Driven**: Structure emerges from domain expertise, not ad-hoc decisions
3. **Country-Aware**: Record keeping rules vary by jurisdiction
4. **Search-Optimized**: Structures designed for finding, not just storing
5. **Complete**: Every component from API client to confirmation workflow included

---

## What Makes This Different

Most "document management" approaches are just filing cabinets with search. The Records Manager Skill is fundamentally different because it's **taxonomy-driven expertise**, not just storage.

**Architectural Innovation:**

The skill has 3 explicit layers that transform intent into action:

```
1. INTENT LAYER (SKILL.md)
   - Detects record keeping intent
   - Routes to appropriate workflow
   - Contextualizes request (domain, country, urgency)

2. EXPERTISE LAYER (TaxonomyExpert)
   - Country-specific guidelines
   - Domain taxonomies (household/corporate/projects)
   - Retention requirements
   - Best practices for document types

3. EXECUTION LAYER (PaperlessClient + RecordManager)
   - API operations
   - Batch processing
   - Metadata management
   - Search optimization
```

**Why This Architecture Matters:**

- **Separation of concerns**: Expertise is separate from execution
- **Explicit routing**: Clear path from user intent to action
- **Deterministic outcomes**: Same request produces consistent taxonomy
- **Knowledge capture**: Taxonomy structure is explicit and inspectable
- **Safe by default**: Deletion requires explicit workflow, not direct API call

**WITHOUT this architecture**, you'd have:
- Ad-hoc tagging with no consistency
- No country-specific compliance
- Search that degrades over time
- Risky deletions without approval

**WITH this architecture**, you get:
- Expert-level organization without being an expert
- Compliance-aware retention automatically
- Search that improves as structure refines
- Deletions that are intentional and traceable

---

## Why This Is Different

This sounds similar to file managers which also organize documents. What makes this approach different?

File managers treat organization as a manual task - you create folders, you name files, you remember where things are. The Records Manager Skill treats organization as **expert knowledge applied systematically**. It knows that tax records have different retention than medical records. It knows that invoices need different tags than contracts. It encodes this expertise so you don't have to be a records management expert.

- Taxonomy-driven organization instead of manual folder creation
- Country-specific retention rules instead of guessing how long to keep things
- Search-optimized structures instead of hierarchical nesting
- Mandatory deletion approval instead of catastrophic accidental loss
- AI-powered tagging suggestions instead of inconsistent manual tagging

---

## Invocation Scenarios

The Records Manager Skill triggers on document and record keeping intent:

| Trigger | Example | Workflow | Action |
|---------|---------|----------|--------|
| Upload intent | "Store this invoice" | UploadWorkflow | Add document with suggested tags |
| Search intent | "Find insurance policies" | SearchWorkflow | Query by tags and types |
| Organize intent | "Organize my receipts" | OrganizeWorkflow | Suggest taxonomy improvements |
| Tag intent | "Tag this as tax document" | TagWorkflow | Add metadata to documents |
| Delete intent | "Delete these old papers" | DeleteConfirmation | **Requires approval** |
| Retention check | "What can I shred?" | RetentionWorkflow | Check retention requirements |

**Special Case - Deletion:**

Deletion requests ALWAYS route through `DeleteConfirmation` workflow which:
1. Explains what will be deleted
2. Describes consequences
3. Requires explicit approval
4. Logs the decision for audit trail
5. Cannot be bypassed

---

## Example Usage

### Example 1: Uploading with Intelligent Tagging

```bash
# User: "Store this medical bill"
bun run $PAI_DIR/tools/RecordManager.ts upload \
  --file "~/Downloads/medical-bill.pdf" \
  --domain household \
  --country Australia

# Skill automatically:
# - Detects it's a medical document
# - Suggests tags: medical, receipt, health-insurance
# - Sets document type: Medical Receipt
# - Recommends retention: 7 years (ATO requirement)
# - Applies ASSET tags for household accounting
```

### Example 2: Searching by Taxonomy

```bash
# User: "Find all tax documents for 2024"
bun run $PAI_DIR/tools/RecordManager.ts search \
  --tags "tax,financial,2024" \
  --domain household

# Returns structured results with document types, dates, and retention status
```

### Example 3: Deletion with Confirmation

```bash
# User: "Delete old insurance documents"
bun run $PAI_DIR/tools/RecordManager.ts delete \
  --query "tag:insurance, before:2020"

# System invokes DeleteConfirmation workflow:
# - Shows: 12 documents will be deleted
# - Warns: "These are expired policies, but shred receipts first"
# - Requires: Type "I understand this cannot be undone" to proceed
# - Logs: Decision to audit trail
```

---

## Configuration

**Environment variables:**

**Option 1: `.env` file** (recommended - created by PAI setup wizard):
```bash
# $PAI_DIR/.env
# Paperless-ngx connection
PAPERLESS_URL="https://paperless.example.com"
PAPERLESS_API_TOKEN="your-api-token-here"

# Records Manager settings
RECORDS_COUNTRY="Australia"  # Your country for compliance
RECORDS_DEFAULT_DOMAIN="household"  # household | corporate | projects

# Optional: Custom taxonomy paths
RECORDS_TAXONOMY_PATH="$PAI_DIR/skills/RECORDSMANAGER/Taxonomies/"
```

**Option 2: Shell profile** (for manual installation):
```bash
# Add to ~/.zshrc or ~/.bashrc
export PAPERLESS_URL="https://paperless.example.com"
export PAPERLESS_API_TOKEN="your-api-token-here"
export RECORDS_COUNTRY="Australia"
export RECORDS_DEFAULT_DOMAIN="household"
```

---

## Customization

### Recommended Customization

**What to Customize:** Country-specific taxonomies and domain structures

**Why:** Default taxonomies are generic - customizing to your specific country and use case dramatically improves relevance and compliance

**Process:**
1. During setup, specify your country when prompted
2. Review the suggested taxonomy structure for your domain
3. Add custom tags specific to your situation (e.g., specific tax forms, insurance types)
4. Save custom taxonomy to `$PAI_DIR/skills/RECORDSMANAGER/Taxonomies/{country}/{domain}/custom.md`

**Expected Outcome:** Record suggestions are highly relevant to your jurisdiction and situation, with accurate retention periods

---

### Optional Customization

| Customization | File | Impact |
|--------------|------|--------|
| Custom retention periods | `Taxonomies/{country}/retention.md` | Override default retention rules |
| Additional tag sets | `Taxonomies/{country}/tags.md` | Add domain-specific tags |
| Search presets | `config/search-presets.json` | Quick access to common queries |
| Archive workflows | `workflows/Archive.md` | Custom archive-to-cold-storage procedures |

---

## Credits

- **Original concept**: madeinoz - developed for personal document management needs
- **Inspired by**: paperless-ngx project, national archives retention guidelines, records management best practices

---

## Related Work

- [paperless-ngx](https://docs.paperless-ngx.com/) - Document management system this skill integrates with
- [National Archives of Australia](https://www.naa.gov.au/) - Retention guidelines reference

---

## Works Well With

- **pai-brightdata-skill** - For fetching documents from web sources
- **pai-osint-skill** - For background research on document sources
- **pai-research-skill** - For investigating record keeping requirements

---

## Recommended

- **pai-hook-system** - For automatic session capture of record keeping operations
- **pai-voice-system** - For spoken confirmation of deletion requests

---

## Relationships

### Parent Of
*None specified.*

### Child Of
*None specified.*

### Sibling Of
*None specified.*

### Part Of Collection
*None specified.*

---

## Changelog

### 1.0.0 - 2026-01-17
- Initial release
- Paperless-ngx API integration
- Taxonomy expert with country-specific guidelines
- Deletion confirmation workflow
- CLI tool with upload, search, organize, tag, info, retention commands
- Comprehensive test suite
