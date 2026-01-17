---
name: RECORDSMANAGER
description: Expert record keeping system with paperless-ngx integration, country-specific taxonomies, and intelligent document management
version: 1.0.0
author: madeinoz
capabilities: [document-management, records-organization, taxonomy-expertise, paperless-ngx-integration]
triggers:
  - upload.*document
  - store.*file
  - organize.*records
  - find.*document
  - search.*papers
  - tag.*documents
  - delete.*records
  - retention.*check
  - archive.*documents
dependencies: []
---

# Records Manager Skill

> Expert record keeping with paperless-ngx integration, country-specific taxonomies, and safe deletion practices

## Overview

The Records Manager Skill is a subject matter expert in record keeping and document management. It integrates with paperless-ngx to provide intelligent document organization, country-specific compliance guidance, and safe deletion practices.

**Core Capabilities:**
- Intelligent document upload with automatic tagging
- Country-specific record keeping taxonomies
- Retention requirement checking
- Safe deletion with mandatory confirmation
- Search optimization for document discovery

**Key Safety Feature:**
Document deletion ALWAYS requires explicit approval through the DeleteConfirmation workflow. This prevents catastrophic data loss.

---

## Voice Notification

When executing workflows, send voice notification:

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the WORKFLOWNAME workflow from the Records Manager skill"}' \
  > /dev/null 2>&1 &
```

---

## Workflow Routing

| Trigger | Workflow | Purpose |
|---------|----------|---------|
| Upload intent | `Workflows/UploadWorkflow.md` | Add documents with intelligent tagging |
| Search intent | `Workflows/SearchWorkflow.md` | Find documents by tags, content, type |
| Organize intent | `Workflows/OrganizeWorkflow.md` | Suggest and apply taxonomy improvements |
| Tag intent | `Workflows/TagWorkflow.md` | Add or modify tags on documents |
| Delete intent | `Workflows/DeleteConfirmation.md` | **MANDATORY** approval workflow |
| Retention intent | `Workflows/RetentionWorkflow.md` | Check retention requirements |
| Info intent | `Workflows/InfoWorkflow.md` | Get document details and metadata |

---

## Workflows

### Upload Workflow

**Triggers:**
- "Upload this document"
- "Store this file"
- "Add to records"
- "Save this [document type]"

**Process:**
1. Ask for file path or document
2. Determine domain (household/corporate/projects) from context or user
3. Use TaxonomyExpert to suggest tags and document type
4. Get or create tags in paperless-ngx
5. Upload document with metadata
6. Confirm upload and show document ID

**CLI Command:**
```bash
bun run $PAI_DIR/tools/RecordManager.ts upload <file> --domain <domain>
```

---

### Search Workflow

**Triggers:**
- "Find [document type]"
- "Search for [query]"
- "Show me [tag] documents"
- "Where are my [type] records?"

**Process:**
1. Parse search criteria from user request
2. Build search query with tags, types, dates
3. Execute search via PaperlessClient
4. Present results with document details
5. Offer to show more details or refine search

**CLI Command:**
```bash
bun run $PAI_DIR/tools/RecordManager.ts search --query <text> --tags <tags> --type <type>
```

---

### Organize Workflow

**Triggers:**
- "Organize my records"
- "Clean up documents"
- "Improve document structure"
- "Suggest better tags"

**Process:**
1. Get untagged or poorly tagged documents
2. Use TaxonomyExpert to analyze and suggest improvements
3. Show suggested tags and types
4. Ask user approval before applying
5. Update document metadata in paperless-ngx
6. Report changes made

**CLI Command:**
```bash
bun run $PAI_DIR/tools/RecordManager.ts organize --domain <domain> --apply
```

---

### Tag Workflow

**Triggers:**
- "Tag these documents"
- "Add [tag] to documents"
- "Change tags on [document]"

**Process:**
1. Get document IDs and tag names from user
2. Verify documents exist
3. Get or create tags in paperless-ngx
4. Apply tags to documents
5. Confirm changes

**CLI Command:**
```bash
bun run $PAI_DIR/tools/RecordManager.ts tag <docIds> <tagNames>
```

---

### Delete Confirmation Workflow (CRITICAL)

**Triggers:**
- "Delete these documents"
- "Remove old records"
- "Purge [tag] documents"
- **ANY deletion intent**

**Process:**
1. Show documents that will be deleted (ID, title, date, tags)
2. Check retention requirements for each document
3. Warn if documents within retention period
4. Explain consequences (permanent, no undo)
5. Require EXACT confirmation phrase
6. Only after approval: Execute deletion
7. Log decision to audit trail

**MANDATORY APPROVAL PHRASE:**
```
I understand this cannot be undone and I want to proceed with deleting N documents
```

**Do NOT accept:**
- "yes"
- "do it"
- "proceed"
- "delete them"
- Any casual confirmation

**CLI Command:**
```bash
# This command REFUSES to delete and points to the workflow
bun run $PAI_DIR/tools/RecordManager.ts delete <query>
```

**Why This Matters:**
Deleting records is catastrophic. Tax documents, legal papers, insurance policies - once deleted, they're gone forever. The confirmation workflow ensures:
- Principal sees exactly what will be deleted
- Retention warnings are surfaced
- Decision is intentional and understood
- Audit trail exists for compliance

---

### Retention Workflow

**Triggers:**
- "What can I shred?"
- "How long should I keep [type]?"
- "Retention requirements"
- "Can I delete old [documents]?"

**Process:**
1. Get document type or domain from user
2. Look up retention requirements for country and type
3. Show retention period and legal reason
4. Calculate keep-until date for documents
5. Advise what can be safely archived or deleted

**CLI Command:**
```bash
bun run $PAI_DIR/tools/RecordManager.ts retention --domain <domain>
```

---

### Info Workflow

**Triggers:**
- "Show me document [ID]"
- "What do you know about [document]?"
- "Details for [document]"

**Process:**
1. Get document ID from user
2. Fetch document details from paperless-ngx
3. Show metadata: title, date, tags, type
4. Check retention requirements
5. Advise if document can be archived or deleted

**CLI Command:**
```bash
bun run $PAI_DIR/tools/RecordManager.ts info <docId>
```

---

## Taxonomy Expert System

The TaxonomyExpert provides country-specific record keeping knowledge:

### Supported Countries

- **Australia** (default)
  - ATO tax record requirements
  - Australian Consumer Law retention
  - State-specific legal document retention

- **United States**
  - IRS tax record requirements
  - Federal and state retention guidelines
  - Industry-specific requirements

- **United Kingdom**
  - HMRC self-assessment requirements
  - FCA insurance documentation
  - Companies House records

### Domains

**Household:**
- Financial: Tax, bank statements, investments
- Medical: Records, receipts, insurance
- Insurance: Home, contents, vehicle, health, life
- Legal: Contracts, wills, powers of attorney
- Education: Transcripts, certificates
- Household: Utilities, warranties, manuals

**Corporate:**
- Financial: Invoices, receipts, expenses, revenue
- Legal: Contracts, agreements, licenses
- HR: Employee records, payroll, leave
- Compliance: Audit reports, certificates, permits
- Corporate: Board resolutions, shareholder records

**Projects:**
- Planning: Project plans, proposals
- Deliverables: Outputs, artifacts
- Communications: Meeting notes, emails
- Documentation: Specs, requirements
- Lessons: Retrospectives, learnings

---

## Configuration

Required environment variables (set in `$PAI_DIR/.env`):

```bash
# Paperless-ngx connection
PAPERLESS_URL="https://paperless.example.com"
PAPERLESS_API_TOKEN="your-api-token-here"

# Records Manager settings
RECORDS_COUNTRY="Australia"  # Your country for compliance
RECORDS_DEFAULT_DOMAIN="household"  # household | corporate | projects
```

---

## Integration with Other Skills

### Works Well With

- **pai-brightdata-skill**: Fetch documents from web sources before uploading
- **pai-research-skill**: Investigate record keeping requirements for specific situations
- **pai-osint-skill**: Background research on document sources or parties

### Use Cases

**Household Record Keeping:**
- Upload tax documents with automatic tagging
- Organize insurance policies by type and renewal date
- Find medical receipts for tax deductions
- Check retention before shredding old documents

**Corporate Compliance:**
- Ensure invoice retention meets tax requirements
- Tag contracts by department and expiration
- Organize employee records by retention period
- Audit trail for document deletions

**Project Management:**
- Organize project documents by phase
- Tag deliverables with project metadata
- Archive completed projects systematically
- Find related documents across projects

---

## Safety Principles

1. **Deletion is catastrophic** - Always requires explicit approval
2. **Retention is legal** - Country-specific requirements are authoritative
3. **Tags are permanent** - Well-tagged documents are findable documents
4. **Search is king** - Structure for finding, not just storing
5. **Compliance matters** - Retention rules have legal weight

---

## Troubleshooting

### Common Issues

**Problem:** "Country not supported, falling back to Australia"

**Solution:** Taxonomies available for Australia, United States, United Kingdom. For other countries, contribute your country's guidelines!

**Problem:** "Cannot reach paperless-ngx API"

**Solution:** Verify PAPERLESS_URL includes protocol (https://) and instance is running

**Problem:** "API authentication failed"

**Solution:** Regenerate API token in paperless-ngx with correct permissions

**Problem:** "No tags suggested"

**Solution:** Document type or filename may not match known patterns. Manually tag first few to build patterns.

---

## Credits

- **Original concept**: madeinoz - developed for personal document management
- **Taxonomy sources**: National archives of Australia, IRS, HMRC
- **Inspired by**: paperless-ngx community best practices

---

## Version History

### 1.0.0 (2026-01-17)
- Initial release
- Paperless-ngx API integration
- Taxonomy expert for AU, US, UK
- Deletion confirmation workflow
- CLI tool with upload, search, organize, tag, info, retention commands
