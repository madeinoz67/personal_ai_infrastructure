# Delete Confirmation Workflow

> **CRITICAL SAFEGUARD:** This workflow MUST be used for ALL deletion operations. Direct API deletion is disabled to prevent catastrophic data loss.

## Purpose

Ensure that document deletion is intentional, understood, and approved by the principal. This workflow:
1. Explains what will be deleted
2. Describes consequences
3. Requires explicit confirmation
4. Logs the decision for audit trail

## When to Use

Trigger this workflow when:
- User asks to delete documents
- User asks to remove old records
- User asks to clean up or purge documents
- ANY deletion intent is detected

## Process

### Step 1: Describe Deletion Scope

```bash
# Show what will be deleted
bun run $PAI_DIR/tools/RecordManager.ts search --query "<search_criteria>"
```

For each document:
- Show document ID, title, created date
- Show tags and document type
- Check retention requirements
- Warn if retention period not met

### Step 2: Explain Consequences

Inform the principal:
1. **Deletion is permanent** - paperless-ngx does not have an undo function
2. **Backup status** - Are these documents backed up elsewhere?
3. **Retention warning** - Are any documents still within retention period?
4. **Search impact** - Deleting these may affect future searches

### Step 3: Require Explicit Confirmation

Ask the principal to type:

```
I understand this cannot be undone and I want to proceed with deleting N documents
```

**Accept ONLY this exact phrasing.** Do not accept "yes", "proceed", "do it", or similar.

### Step 4: Execute Deletion (If Approved)

**Only after explicit confirmation:**

```typescript
// Execute deletion via paperless-ngx API
// Note: This is the ONLY place where deletion API calls are made
const response = await fetch(`${PAPERLESS_URL}/api/documents/${id}/`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Token ${PAPERLESS_API_TOKEN}`,
  },
});
```

### Step 5: Log Decision

Append to `$PAI_DIR/MEMORY/deletions.log`:

```json
{
  "timestamp": "2026-01-17T12:00:00Z",
  "principal": "{principal.name}",
  "documents_deleted": N,
  "search_criteria": "<criteria>",
  "confirmation": "EXPLICIT",
  "retention_warnings": ["doc 123 within retention period"]
}
```

## Example Execution

```
AI: You've asked to delete 12 documents with tag "insurance" from before 2020.

    Here's what will be deleted:
    [45] Home Insurance Policy - State Farm (2018-05-15)
    [46] Car Insurance Policy - Geico (2019-03-22)
    ...

    ⚠️  RETENTION WARNING: Some documents may still be within retention period
    ⚠️  DELETION IS PERMANENT - No undo function available

    To proceed, type: "I understand this cannot be undone and I want to proceed with deleting 12 documents"

Principal: I understand this cannot be undone and I want to proceed with deleting 12 documents

AI: ✓ Deleting 12 documents...
    ✓ Decision logged to $PAI_DIR/MEMORY/deletions.log
```

## Anti-Patterns

❌ **DO NOT** delete without showing document details
❌ **DO NOT** accept casual confirmation like "yes" or "ok"
❌ **DO NOT** skip retention warnings
❌ **DO NOT** bypass this workflow for "batch" deletions
❌ **DO NOT** delete documents that are within retention period without explicit warning

## Safety First

When in doubt, **DO NOT DELETE**. Suggest:
- Moving to archive storage instead
- Adding "do_not_delete" tag to important documents
- Creating a backup before deletion
- Reviewing documents individually before batch deletion
