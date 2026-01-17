# Records Manager Skill - Installation Instructions

> **FOR AI ASSISTANTS:** This document contains step-by-step installation instructions. Follow each section in order. The pre-installation analysis is REQUIRED to detect conflicts before making changes.

---

## Prerequisites

### Required Dependencies

- **Bun runtime**: `curl -fsSL https://bun.sh/install | bash`
- **Claude Code** (or compatible agent system with skill support)
- **Write access** to `$PAI_DIR/` (or your PAI directory)
- **Running paperless-ngx instance** with API access

### Paperless-ngx Setup

Before installing this skill, you must have:
1. A running paperless-ngx instance (self-hosted or managed)
2. API token generated from paperless-ngx settings
3. URL of your paperless-ngx instance

**Getting a paperless-ngx API token:**
```bash
# In paperless-ngx web UI:
# 1. Go to Settings → Tokens
# 2. Create new token with "Read/Write" permissions
# 3. Copy the token - you'll need it for configuration
```

---

## Pre-Installation: System Analysis

**IMPORTANT:** Before installing, analyze the current system state to detect conflicts and ensure dependencies are met.

### Step 0.1: Detect Current Configuration

Run these commands to understand your current system:

```bash
# 1. Check if PAI_DIR is set
echo "PAI_DIR: ${PAI_DIR:-'NOT SET - will use ~/.claude'}"

# 2. Check for existing PAI directory
PAI_CHECK="${PAI_DIR:-$HOME/.claude}"
if [ -d "$PAI_CHECK" ]; then
  echo "⚠️  PAI directory EXISTS at: $PAI_CHECK"
  echo "Contents:"
  ls -la "$PAI_CHECK" 2>/dev/null | head -20
else
  echo "✓ PAI directory does not exist (clean install)"
fi

# 3. Check for existing Records Manager skill
echo ""
echo "Checking for existing Records Manager installation..."
if [ -d "$PAI_CHECK/skills/RECORDSMANAGER" ]; then
  echo "⚠️  RECORDSMANAGER skill directory already exists"
  echo "Contents:"
  ls -la "$PAI_CHECK/skills/RECORDSMANAGER" 2>/dev/null
else
  echo "✓ No existing RECORDSMANAGER skill (clean install)"
fi

# 4. Check for RecordManager tool
if [ -f "$PAI_CHECK/tools/RecordManager.ts" ]; then
  echo "⚠️  RecordManager.ts tool already exists"
else
  echo "✓ No existing RecordManager tool"
fi

# 5. Check environment variables for paperless-ngx
echo ""
echo "Environment variables:"
echo "  PAPERLESS_URL: ${PAPERLESS_URL:-'NOT SET'}"
echo "  PAPERLESS_API_TOKEN: ${PAPERLESS_API_TOKEN:+SET (hidden)}"
echo "  RECORDS_COUNTRY: ${RECORDS_COUNTRY:-'NOT SET'}"
echo "  RECORDS_DEFAULT_DOMAIN: ${RECORDS_DEFAULT_DOMAIN:-'NOT SET'}"

# 6. Check if .env file exists
if [ -f "$PAI_CHECK/.env" ]; then
  echo ""
  echo "⚠️  .env file EXISTS at: $PAI_CHECK/.env"
  if grep -q "PAPERLESS_URL" "$PAI_CHECK/.env" 2>/dev/null; then
    echo "  ⚠️  Paperless-ngx variables already configured"
  fi
else
  echo ""
  echo "✓ No .env file (will be created)"
fi
```

### Step 0.2: Verify Dependencies

```bash
PAI_CHECK="${PAI_DIR:-$HOME/.claude}"

# Check for bun
if command -v bun &> /dev/null; then
  echo "✓ bun is installed: $(bun --version)"
else
  echo "❌ bun is NOT installed"
  echo "   Install with: curl -fsSL https://bun.sh/install | bash"
  exit 1
fi

# Test paperless-ngx connectivity (if configured)
if [ -n "$PAPERLESS_URL" ]; then
  echo ""
  echo "Testing paperless-ngx connection..."
  if curl -s -f -I "$PAPERLESS_URL/api/" &> /dev/null; then
    echo "✓ paperless-ngx API is accessible at $PAPERLESS_URL"
  else
    echo "⚠️  Cannot reach paperless-ngx API at $PAPERLESS_URL"
    echo "   You'll need to configure this during installation"
  fi
else
  echo ""
  echo "⚠️  PAPERLESS_URL not set - will configure during installation"
fi
```

### Step 0.3: Conflict Resolution Matrix

Based on the detection above, follow the appropriate path:

| Scenario | Existing State | Action |
|----------|---------------|--------|
| **Clean Install** | No PAI_DIR, no conflicts | Proceed normally with Step 1 |
| **Directory Exists** | PAI_DIR has files | Review files, backup if needed, then proceed |
| **Skill Exists** | RECORDSMANAGER skill present | Backup old skill, compare versions, then replace |
| **Tool Exists** | RecordManager.ts present | Backup old tool, then replace |
| **.env Exists** | Paperless variables configured | Review existing config, merge updates |

### Step 0.4: Backup Existing Installation (If Needed)

If conflicts were detected, create a backup before proceeding:

```bash
# Create timestamped backup
BACKUP_DIR="$HOME/.recordsmanager-backup/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
PAI_CHECK="${PAI_DIR:-$HOME/.claude}"

echo "Creating backup at: $BACKUP_DIR"

# Backup skill directory if it exists
if [ -d "$PAI_CHECK/skills/RECORDSMANAGER" ]; then
  cp -r "$PAI_CHECK/skills/RECORDSMANAGER" "$BACKUP_DIR/"
  echo "✓ Backed up RECORDSMANAGER skill"
fi

# Backup tool if it exists
if [ -f "$PAI_CHECK/tools/RecordManager.ts" ]; then
  cp "$PAI_CHECK/tools/RecordManager.ts" "$BACKUP_DIR/"
  echo "✓ Backed up RecordManager tool"
fi

# Backup lib files if they exist
if [ -d "$PAI_CHECK/lib/recordsmanager" ]; then
  cp -r "$PAI_CHECK/lib/recordsmanager" "$BACKUP_DIR/"
  echo "✓ Backed up recordsmanager lib"
fi

echo "Backup complete: $BACKUP_DIR"
```

**After completing system analysis, proceed to Step 1.**

---

## Installation Steps

### ⚠️ CRITICAL RULE: URL Preservation

**DO NOT CORRECT URL SPELLING** - URLs must be copied EXACTLY as provided by the user, even if they appear to be misspelled.

- Example: `https://paperless.groove.com/` is correct (even if "groove" might look like a typo)
- NEVER "fix" domain names or paths
- Copy the URL exactly character-for-character
- If in doubt, confirm with the user before changing

**Why this matters:** Custom domain names, subdomains, and paths can have intentional unusual spellings that are valid DNS entries.

---

### Step 1: Create Directory Structure

```bash
# Set PAI_DIR (default to ~/.claude if not set)
export PAI_DIR="${PAI_DIR:-$HOME/.claude}"

# Create skill directory
mkdir -p "$PAI_DIR/skills/RECORDSMANAGER"/{Workflows,Taxonomies,Tools,Context}

# Create lib directory for shared libraries
mkdir -p "$PAI_DIR/lib/recordsmanager"

# Create tools directory
mkdir -p "$PAI_DIR/tools"

# Verify structure
echo "Directory structure created:"
ls -la "$PAI_DIR/skills/RECORDSMANAGER"
```

Expected output:
```
Directory structure created:
total 0
drwxr-xr-x  5 user  staff  160 Jan 17 12:00 .
drwxr-xr-x  3 user  staff   96 Jan 17 12:00 ..
drwxr-xr-x  2 user  staff   64 Jan 17 12:00 Context
drwxr-xr-x  2 user  staff   64 Jan 17 12:00 Taxonomies
drwxr-xr-x  2 user  staff   64 Jan 17 12:00 Tools
drwxr-xr-x  2 user  staff   64 Jan 17 12:00 Workflows
```

---

### Step 2: Gather Configuration Information

The installation wizard needs to collect this information. Use `AskUserQuestion` for interactive prompts.

**Required Configuration:**

1. **Paperless-ngx URL**: The base URL of your paperless-ngx instance
2. **API Token**: Your paperless-ngx API token with read/write permissions
3. **Country**: Your country for record keeping compliance (e.g., Australia, United States, United Kingdom)
4. **Entities**: All entities you want to manage (households, businesses, trusts, projects)

**Interactive Setup Prompt:**

```bash
cat << 'SETUP_QUESTIONS'
Records Manager Multi-Entity Configuration

The Records Manager can track multiple entities simultaneously.
Each entity represents a separate record-keeping domain (household, business, trusts, projects).

1. How many entities do you want to manage? (1-20)

For each entity, I will ask:
   - Entity type (household, corporate, unit-trust, discretionary-trust, family-trust, project)
   - Entity name
   - Type-specific details (ABN, TFN, trustee, FTE date for trusts, etc.)

Examples of common setups:
  - Single household: "Smith Household" (household)
  - Small business: "Acme Corp" (corporate) + "Smith Household" (household)
  - Trust structure: "Smith Family Trust" (family-trust) + "Jones Unit Trust" (unit-trust)
  - Complex: Multiple trusts + business + household

Let's start configuring your entities.
SETUP_QUESTIONS
```

**Entity Configuration Loop:**

For each entity, ask type-specific questions:

```bash
# Entity 1
echo "=== Entity 1 of ${TOTAL_ENTITIES} ==="
echo "What type of entity is this?"
echo "  1. household      - Personal documents and records"
echo "  2. corporate       - Business records and operations"
echo "  3. unit-trust      - Unit trust with unitholders"
echo "  4. discretionary-trust - Discretionary trust with beneficiary allocations"
echo "  5. family-trust    - Family trust (requires Family Trust Election)"
echo "  6. project        - Project-based records"

# Based on selection, ask appropriate questions

if [[ "$ENTITY_TYPE" == "family-trust" ]]; then
  echo "Family Trust Configuration"
  read -p "Trust name: " TRUST_NAME
  read -p "Trustee name: " TRUSTEE_NAME
  read -p "ABN (11 digits): " ABN
  read -p "TFN (optional, 9 digits): " TFN
  read -p "Family Trust Election date (YYYY-MM-DD): " FTE_DATE
  echo "⚠️  FTE documents require 5+ year retention from FTE date (not EOFY)"
elif [[ "$ENTITY_TYPE" == "unit-trust" ]]; then
  echo "Unit Trust Configuration"
  read -p "Trust name: " TRUST_NAME
  read -p "Trustee name: " TRUSTEE_NAME
  read -p "ABN (11 digits): " ABN
  read -p "TFN (optional, 9 digits): " TFN
  read -p "Total units (optional): " UNIT_COUNT
elif [[ "$ENTITY_TYPE" == "discretionary-trust" ]]; then
  echo "Discretionary Trust Configuration"
  read -p "Trust name: " TRUST_NAME
  read -p "Trustee name: " TRUSTEE_NAME
  read -p "ABN (11 digits): " ABN
  read -p "TFN (optional, 9 digits): " TFN
  read -p "Beneficiaries (optional, comma-separated): " BENEFICIARIES
elif [[ "$ENTITY_TYPE" == "corporate" ]]; then
  echo "Corporate Entity Configuration"
  read -p "Business name: " BUSINESS_NAME
  read -p "ABN (11 digits): " ABN
  read -p "Business type (sole-trader/company/partnership): " BUSINESS_TYPE
elif [[ "$ENTITY_TYPE" == "household" ]]; then
  echo "Household Entity Configuration"
  read -p "Household name: " HOUSEHOLD_NAME
  read -p "Starting year (for retention): " START_YEAR
elif [[ "$ENTITY_TYPE" == "project" ]]; then
  echo "Project Entity Configuration"
  read -p "Project name: " PROJECT_NAME
  read -p "Project type (software/construction/research/creative/other): " PROJECT_TYPE
  read -p "Start date (YYYY-MM-DD): " START_DATE
fi
```

**Trust-Specific Warnings:**

```bash
if [[ "$ENTITY_TYPE" =~ .*-trust ]]; then
  echo ""
  echo "⚠️  TRUST RETENTION REQUIREMENTS:"
  echo "  - Trust deed: Keep forever (original document)"
  echo "  - Trust variations: Keep forever"
  echo "  - Trustee records: Keep while trustee + 5 years"
  echo "  - Distribution minutes: Keep 5+ years"
  echo "  - FTE documents: Keep 5+ years from FTE date (not EOFY)"
  echo "  - Unitholder registers: Keep while trust exists + 5 years"
  echo ""
  echo "  For family trusts with Family Trust Election (FTE),"
  echo "  retention periods start from the FTE date, not EOFY."
  echo ""
fi
```

---

### Step 3: Create Environment Configuration

Create or update `$PAI_DIR/.env` with paperless-ngx configuration:

```bash
# File: $PAI_DIR/.env
# Add these variables to your existing .env file

# Paperless-ngx connection
PAPERLESS_URL="https://paperless.example.com"
PAPERLESS_API_TOKEN="your-api-token-here"

# Records Manager settings
RECORDS_COUNTRY="Australia"

# Entity configuration (JSON array)
# Example: Single household
# RECORDS_ENTITIES='[{"type":"household","name":"Smith Household","startYear":"2020"}]'
#
# Example: Business + household
# RECORDS_ENTITIES='[
#   {"type":"corporate","name":"Acme Corp","abn":"12345678901","businessType":"company"},
#   {"type":"household","name":"Smith Household","startYear":"2020"}
# ]'
#
# Example: Trust structure
# RECORDS_ENTITIES='[
#   {"type":"family-trust","name":"Smith Family Trust","abn":"12345678901","tfn":"987654321","trustee":"Smith Pty Ltd","fteDate":"2020-01-15"},
#   {"type":"unit-trust","name":"Jones Unit Trust","abn":"98765432101","tfn":"123456789","trustee":"Jones Pty Ltd","unitCount":"100"}
# ]'

RECORDS_ENTITIES='[{"type":"household","name":"My Household","startYear":"2020"}]'

# Optional: Custom retention periods (overrides defaults)
# RECORDS_RETENTION_TAX_YEARS="7"
# RECORDS_RETENTION_MEDICAL_YEARS="7"
# RECORDS_RETENTION_INSURANCE_YEARS="10"
```

**Entity Configuration Format:**

The `RECORDS_ENTITIES` variable is a JSON array of entity objects. Each entity type has different fields:

**Household:**
```json
{
  "type": "household",
  "name": "Smith Household",
  "startYear": "2020"
}
```

**Corporate:**
```json
{
  "type": "corporate",
  "name": "Acme Corporation",
  "abn": "12345678901",
  "businessType": "company"
}
```

**Unit Trust:**
```json
{
  "type": "unit-trust",
  "name": "Jones Unit Trust",
  "abn": "12345678901",
  "tfn": "987654321",
  "trustee": "Jones Pty Ltd",
  "unitCount": "100"
}
```

**Discretionary Trust:**
```json
{
  "type": "discretionary-trust",
  "name": "Smith Discretionary Trust",
  "abn": "12345678901",
  "tfn": "987654321",
  "trustee": "Smith Pty Ltd",
  "beneficiaries": ["Beneficiary 1", "Beneficiary 2"]
}
```

**Family Trust:**
```json
{
  "type": "family-trust",
  "name": "Smith Family Trust",
  "abn": "12345678901",
  "tfn": "987654321",
  "trustee": "Smith Pty Ltd",
  "fteDate": "2020-01-15"
}
```

**Project:**
```json
{
  "type": "project",
  "name": "Website Redesign",
  "projectType": "software",
  "startDate": "2024-01-01"
}
```

**Source the environment:**

```bash
# Load the new environment variables
export $(grep -v '^#' $PAI_DIR/.env | xargs)

# Verify
echo "Paperless URL: $PAPERLESS_URL"
echo "Records Country: $RECORDS_COUNTRY"
echo "Entities: $RECORDS_ENTITIES"
```

---

## Records Manager v2.0 Features

The Records Manager skill now includes powerful features for trust management, workflow automation, and dynamic entity creation.

### Trust Document Management

- **ATO-compliant retention rules** for unit, discretionary, and family trusts
- **Trust document checklists** and validation
- **Family Trust Election (FTE)** tracking with 5-year retention from FTE date
- **Trustee management** and record keeping
- **Unitholder registers** for unit trusts
- **Distribution minutes** and beneficiary records

**Trust-specific retention:**
- Trust deed: Keep forever (original document)
- Trust variations: Keep forever
- Trustee records: Keep while trustee + 5 years
- Distribution minutes: Keep 5+ years
- FTE documents: Keep 5+ years from FTE date (NOT EOFY)
- Unitholder registers: Keep while trust exists + 5 years

### Workflow Automation

- **WorkflowExpert agent** analyzes document patterns and recommends automated workflows
- Create paperless-ngx workflows for auto-tagging
- Review workflow effectiveness and match rates
- Bulk operations for document reprocessing
- Smart tag suggestions based on existing documents

**Example workflow:**
```
AI: "I've analyzed your invoice documents. I can create a workflow that:
     - Detects invoices by content analysis
     - Auto-tags with 'invoice', 'supplier', 'financial-year'
     - Matches 94% of your existing invoices
     - Want me to create this workflow?"
```

### Dynamic Entity Creation

- **Add new entities anytime:** "Records Manager, add a new entity"
- Supports 6 entity types with type-specific configuration
- Creates tags, storage paths, and custom fields automatically
- No need to reconfigure entire system

**Example:**
```
You: "Records Manager, add a new unit trust called 'Jones Unit Trust'"
AI: "Creating entity 'Jones Unit Trust' (unit-trust)
     ✓ Created tags: unit-trust, jones-unit-trust
     ✓ Created storage path: /Jones Unit Trust/
     ✓ Created custom fields: abn, tfn, trustee, unitCount
     ✓ Entity registered in entities.json"
```

### Enhanced Paperless-ngx Integration

- **Correspondents** - Track people and organizations
- **Storage paths** - Hierarchical organization by entity
- **Custom fields** - Entity-specific metadata (ABN, TFN, trustee, etc.)
- **Bulk operations** - Edit multiple documents at once
- **Workflow integration** - Seamless paperless-ngx workflow support

### Expert Agents

The Records Manager includes specialized expert agents:

- **WorkflowExpert** - Analyze patterns and create automated workflows
- **TrustExpert** - Trust-specific document management and compliance
- **EntityCreator** - Dynamic entity creation and configuration
- **TaxonomyExpert** - Country-specific retention and tagging rules

---

### Step 4: Create Entity Registry

Create an entity registry file to track all configured entities:

```bash
# File: $PAI_DIR/skills/RECORDSMANAGER/entities.json
# This file is auto-generated during installation
# You can edit it manually to add/modify entities
cat > "$PAI_DIR/skills/RECORDSMANAGER/entities.json" << 'EOF'
{
  "entities": [],
  "created": null,
  "lastModified": null
}
EOF
```

**Installation script will populate this file** with the entities configured in Step 2.

---

### Step 5: Create Core Library Files

#### 4.1: Create PaperlessClient Library

```bash
# File: $PAI_DIR/lib/recordsmanager/PaperlessClient.ts
```

```typescript
// $PAI_DIR/lib/recordsmanager/PaperlessClient.ts
/**
 * Paperless-ngx API Client
 * Complete integration with paperless-ngx REST API
 * NO DELETE METHODS - must use DeleteConfirmation workflow
 */

export interface PaperlessConfig {
  baseUrl: string;
  apiToken: string;
}

export interface Document {
  id: number;
  title: string;
  content?: string;
  created: string;
  modified: string;
  archive_serial_number?: number;
  original_file_name: string;
  owner: number;
  tags: number[];
  document_type?: number;
  storage_path?: number;
  notes?: string[];
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
  match?: string;
  matching_algorithm: number;
  is_insensitive: boolean;
}

export interface DocumentType {
  id: number;
  name: string;
  slug: string;
  match?: string;
  matching_algorithm: number;
  is_insensitive: boolean;
}

export interface SearchResult {
  count: number;
  next?: string;
  previous?: string;
  results: Document[];
}

export class PaperlessClient {
  private config: PaperlessConfig;
  private baseUrl: string;

  constructor(config: PaperlessConfig) {
    this.config = config;
    // Remove trailing slash from baseUrl
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Token ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Paperless API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get document by ID
   */
  async getDocument(id: number): Promise<Document> {
    return this.request<Document>(`/documents/${id}/`);
  }

  /**
   * Search documents with filters
   */
  async searchDocuments(params: {
    query?: string;
    tags__id__in?: number[];
    document_type__id?: number;
    created__gte?: string;
    created__lte?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<SearchResult> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          searchParams.set(key, value.join(','));
        } else {
          searchParams.set(key, String(value));
        }
      }
    });

    return this.request<SearchResult>(`/documents/?${searchParams.toString()}`);
  }

  /**
   * Upload document with metadata
   */
  async uploadDocument(
    file: File | Blob,
    metadata?: {
      title?: string;
      tags?: number[];
      document_type?: number;
      created?: string;
    }
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('document', file);

    if (metadata?.title) {
      formData.append('title', metadata.title);
    }
    if (metadata?.tags) {
      metadata.tags.forEach(tag => formData.append('tags', String(tag)));
    }
    if (metadata?.document_type) {
      formData.append('document_type', String(metadata.document_type));
    }
    if (metadata?.created) {
      formData.append('created', metadata.created);
    }

    const url = `${this.baseUrl}/api/documents/post_document/`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${this.config.apiToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    id: number,
    updates: Partial<Pick<Document, 'title' | 'tags' | 'document_type' | 'notes'>>
  ): Promise<Document> {
    return this.request<Document>(`/documents/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<Tag[]> {
    const response = await this.request<{ results: Tag[] }>('/tags/');
    return response.results;
  }

  /**
   * Get tag by name (create if not exists)
   */
  async getOrCreateTag(name: string, color?: string): Promise<Tag> {
    try {
      const tags = await this.getTags();
      const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
    } catch (error) {
      // Continue to creation
    }

    // Create new tag
    return this.request<Tag>('/tags/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        color: color || '#4a90d9',
        matching_algorithm: 0, // Auto matching
        is_insensitive: true,
      }),
    });
  }

  /**
   * Get all document types
   */
  async getDocumentTypes(): Promise<DocumentType[]> {
    const response = await this.request<{ results: DocumentType[] }>('/document_types/');
    return response.results;
  }

  /**
   * Get document type by name (create if not exists)
   */
  async getOrCreateDocumentType(name: string): Promise<DocumentType> {
    try {
      const types = await this.getDocumentTypes();
      const existing = types.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
    } catch (error) {
      // Continue to creation
    }

    // Create new document type
    return this.request<DocumentType>('/document_types/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        matching_algorithm: 0,
        is_insensitive: true,
      }),
    });
  }

  /**
   * Search document content
   */
  async searchContent(query: string, limit: number = 20): Promise<Document[]> {
    const result = await this.searchDocuments({
      query,
      page_size: limit,
    });
    return result.results;
  }

  /**
   * Get documents by tag IDs
   */
  async getDocumentsByTags(tagIds: number[]): Promise<Document[]> {
    const result = await this.searchDocuments({
      tags__id__in: tagIds,
      page_size: 1000,
    });
    return result.results;
  }

  /**
   * NO DELETE METHODS - Use DeleteConfirmation workflow
   *
   * Deletion requires explicit user approval through the
   * DeleteConfirmation workflow to prevent catastrophic data loss.
   */
}

/**
 * Create client from environment variables
 */
export function createClientFromEnv(): PaperlessClient {
  const baseUrl = process.env.PAPERLESS_URL;
  const apiToken = process.env.PAPERLESS_API_TOKEN;

  if (!baseUrl || !apiToken) {
    throw new Error('PAPERLESS_URL and PAPERLESS_API_TOKEN must be set in environment');
  }

  return new PaperlessClient({ baseUrl, apiToken });
}
```

#### 4.2: Create TaxonomyExpert Library

```bash
# File: $PAI_DIR/lib/recordsmanager/TaxonomyExpert.ts
```

```typescript
// $PAI_DIR/lib/recordsmanager/TaxonomyExpert.ts
/**
 * Taxonomy Expert - Country-specific record keeping guidelines
 * Provides domain expertise for household, corporate, and project management records
 */

export type Domain = 'household' | 'corporate' | 'projects';

export interface TaxonomySuggestion {
  tags: string[];
  documentType?: string;
  retentionYears?: number;
  retentionReason?: string;
  notes?: string;
}

export interface CountryGuidelines {
  country: string;
  domains: {
    [key in Domain]?: DomainTaxonomy;
  };
}

export interface DomainTaxonomy {
  documentTypes: string[];
  tagCategories: {
    [category: string]: string[];
  };
  retentionRules: {
    [documentType: string]: {
      years: number;
      reason: string;
    };
  };
}

/**
 * Country-specific taxonomies
 */
const COUNTRY_TAXONOMIES: Record<string, CountryGuidelines> = {
  Australia: {
    country: 'Australia',
    domains: {
      household: {
        documentTypes: [
          'Tax Return',
          'Tax Assessment',
          'Medical Receipt',
          'Insurance Policy',
          'Warranty Document',
          'Education Record',
          'Bank Statement',
          'Investment Statement',
          'Utility Bill',
          'Receipt',
          'Contract',
          'Legal Document',
        ],
        tagCategories: {
          financial: ['tax', 'income', 'expense', 'investment', 'superannuation'],
          medical: ['doctor', 'hospital', 'pharmacy', 'insurance', 'receipt'],
          insurance: ['home', 'contents', 'vehicle', 'health', 'life'],
          legal: ['contract', 'agreement', 'will', 'power-of-attorney'],
          education: ['transcript', 'certificate', 'qualification'],
          household: ['utility', 'maintenance', 'warranty', 'manual'],
        },
        retentionRules: {
          'Tax Return': {
            years: 7,
            reason: 'ATO requirement - Section 254 of Tax Administration Act 1953',
          },
          'Tax Assessment': {
            years: 7,
            reason: 'ATO requirement',
          },
          'Medical Receipt': {
            years: 7,
            reason: 'ATO tax deduction substantiation',
          },
          'Insurance Policy': {
            years: 10,
            reason: 'Until expired + cover for potential claims period',
          },
          'Warranty Document': {
            years: 0,
            reason: 'Keep until warranty expires',
          },
          'Education Record': {
            years: 10,
            reason: 'Long-term personal record',
          },
          'Bank Statement': {
            years: 5,
            reason: 'ATO evidence for income and deductions',
          },
          'Investment Statement': {
            years: 7,
            reason: 'ATO capital gains tax calculation',
          },
          'Utility Bill': {
            years: 2,
            reason: 'Proof of address, tax deductions',
          },
          'Receipt': {
            years: 5,
            reason: 'Consumer guarantees, tax deductions',
          },
          'Contract': {
            years: 10,
            reason: 'Statute of limitations in most states',
          },
          'Legal Document': {
            years: 15,
            reason: 'Indefinitely for wills, powers of attorney',
          },
        },
      },
      corporate: {
        documentTypes: [
          'Invoice',
          'Receipt',
          'Contract',
          'Employee Record',
          'Payroll Record',
          'Tax Document',
          'Financial Statement',
          'Insurance Certificate',
          'License',
          'Permit',
          'Compliance Report',
          'Board Resolution',
          'Shareholder Record',
        ],
        tagCategories: {
          financial: ['accounts-payable', 'accounts-receivable', 'expense', 'revenue'],
          legal: ['contract', 'agreement', 'insurance', 'license'],
          hr: ['employee', 'payroll', 'leave', 'performance'],
          compliance: ['audit', 'report', 'certificate', 'permit'],
          corporate: ['board', 'shareholder', 'meeting', 'resolution'],
        },
        retentionRules: {
          'Invoice': {
            years: 7,
            reason: 'ATO requirement plus limitations period',
          },
          'Receipt': {
            years: 7,
            reason: 'ATO expense substantiation',
          },
          'Contract': {
            years: 10,
            reason: 'Statute of limitations + potential disputes',
          },
          'Employee Record': {
            years: 7,
            reason: 'Fair Work Act requirements',
          },
          'Payroll Record': {
            years: 7,
            reason: 'ATO requirement',
          },
          'Tax Document': {
            years: 7,
            reason: 'ATO requirement',
          },
          'Financial Statement': {
            years: 7,
            reason: 'Corporations Act requirements',
          },
          'Insurance Certificate': {
            years: 10,
            reason: 'Current + expired policy period',
          },
          'License': {
            years: 5,
            reason: 'Current license period',
          },
          'Permit': {
            years: 5,
            reason: 'Until renewal required',
          },
          'Compliance Report': {
            years: 7,
            reason: 'Regulatory body requirements',
          },
          'Board Resolution': {
            years: 15,
            reason: 'Corporate record permanence',
          },
          'Shareholder Record': {
            years: 15,
            reason: 'Corporate register requirements',
          },
        },
      },
    },
  },
  UnitedStates: {
    country: 'United States',
    domains: {
      household: {
        documentTypes: [
          'Tax Return',
          'Tax Document',
          'Medical Record',
          'Insurance Policy',
          'Warranty',
          'Receipt',
          'Bank Statement',
          'Investment Statement',
          'Contract',
          'Legal Document',
        ],
        tagCategories: {
          financial: ['tax', 'income', 'expense', 'investment', 'retirement'],
          medical: ['doctor', 'hospital', 'pharmacy', 'insurance', 'bill'],
          insurance: ['home', 'auto', 'health', 'life'],
          legal: ['contract', 'agreement', 'will', 'power-of-attorney'],
          household: ['utility', 'maintenance', 'warranty', 'receipt'],
        },
        retentionRules: {
          'Tax Return': {
            years: 7,
            reason: 'IRS recommendation - 3 years minimum, 7 for safety',
          },
          'Tax Document': {
            years: 7,
            reason: 'IRS supporting documentation',
          },
          'Medical Record': {
            years: 10,
            reason: 'Long-term health history',
          },
          'Insurance Policy': {
            years: 10,
            reason: 'Until expired + claims period',
          },
          'Warranty': {
            years: 0,
            reason: 'Keep until warranty expires',
          },
          'Receipt': {
            years: 7,
            reason: 'Tax deductions, proof of purchase',
          },
          'Bank Statement': {
            years: 7,
            reason: 'IRS income verification',
          },
          'Investment Statement': {
            years: 7,
            reason: 'IRS capital gains reporting',
          },
          'Contract': {
            years: 10,
            reason: 'State statute of limitations',
          },
          'Legal Document': {
            years: 15,
            reason: 'Indefinitely for estate planning documents',
          },
        },
      },
    },
  },
  UnitedKingdom: {
    country: 'United Kingdom',
    domains: {
      household: {
        documentTypes: [
          'Tax Return',
          'SA302',
          'P60',
          'P11D',
          'Medical Record',
          'Insurance Policy',
          'Utility Bill',
          'Receipt',
          'Bank Statement',
        ],
        tagCategories: {
          financial: ['tax', 'income', 'expense', 'savings', 'pension'],
          medical: ['gp', 'hospital', 'prescription', 'nhs'],
          insurance: ['home', 'car', 'life', 'travel'],
          household: ['utility', 'council-tax', 'tv-licence'],
        },
        retentionRules: {
          'Tax Return': {
            years: 7,
            reason: 'HMRC requirement for self-assessment',
          },
          'SA302': {
            years: 7,
            reason: 'HMRC mortgage income verification',
          },
          'P60': {
            years: 7,
            reason: 'HMRC tax year summary',
          },
          'P11D': {
            years: 7,
            reason: 'HMRC benefits documentation',
          },
          'Medical Record': {
            years: 10,
            reason: 'NHS and personal health history',
          },
          'Insurance Policy': {
            years: 10,
            reason: 'FCA guidance',
          },
          'Utility Bill': {
            years: 2,
            reason: 'Proof of address',
          },
          'Receipt': {
            years: 7,
            reason: 'Consumer Rights Act',
          },
          'Bank Statement': {
            years: 7,
            reason: 'HMRC income verification',
          },
        },
      },
    },
  },
};

/**
 * Taxonomy Expert Class
 */
export class TaxonomyExpert {
  private country: string;
  private defaultDomain: Domain;
  private taxonomies: Record<string, CountryGuidelines>;

  constructor(country: string, defaultDomain: Domain = 'household') {
    this.country = country;
    this.defaultDomain = defaultDomain;
    this.taxonomies = COUNTRY_TAXONOMIES;
  }

  /**
   * Get taxonomy for a domain
   */
  private getTaxonomy(domain: Domain): DomainTaxonomy | null {
    const countryData = this.taxonomies[this.country];
    if (!countryData) {
      return null;
    }
    return countryData.domains[domain] || null;
  }

  /**
   * Suggest tags and metadata for a document
   */
  suggestMetadata(
    fileName: string,
    content?: string,
    domain?: Domain
  ): TaxonomySuggestion {
    const targetDomain = domain || this.defaultDomain;
    const taxonomy = this.getTaxonomy(targetDomain);

    if (!taxonomy) {
      return { tags: [], notes: `No taxonomy found for ${this.country}` };
    }

    const suggestion: TaxonomySuggestion = {
      tags: [],
    };

    // Analyze filename for hints
    const lowerName = fileName.toLowerCase();

    // Check for known document types
    for (const docType of taxonomy.documentTypes) {
      if (lowerName.includes(docType.toLowerCase()) ||
          (content && content.toLowerCase().includes(docType.toLowerCase()))) {
        suggestion.documentType = docType;

        // Apply retention rule
        const retention = taxonomy.retentionRules[docType];
        if (retention) {
          suggestion.retentionYears = retention.years;
          suggestion.retentionReason = retention.reason;
        }

        break;
      }
    }

    // Suggest tags based on categories
    for (const [category, tags] of Object.entries(taxonomy.tagCategories)) {
      for (const tag of tags) {
        if (lowerName.includes(tag) ||
            (content && content.toLowerCase().includes(tag))) {
          suggestion.tags.push(tag);
          suggestion.tags.push(category); // Add category tag too
        }
      }
    }

    // Add domain tag if not present
    if (!suggestion.tags.includes(targetDomain)) {
      suggestion.tags.push(targetDomain);
    }

    return suggestion;
  }

  /**
   * Get all document types for a domain
   */
  getDocumentTypes(domain?: Domain): string[] {
    const targetDomain = domain || this.defaultDomain;
    const taxonomy = this.getTaxonomy(targetDomain);
    return taxonomy?.documentTypes || [];
  }

  /**
   * Get all tag categories for a domain
   */
  getTagCategories(domain?: Domain): Record<string, string[]> {
    const targetDomain = domain || this.defaultDomain;
    const taxonomy = this.getTaxonomy(targetDomain);
    return taxonomy?.tagCategories || {};
  }

  /**
   * Get retention requirements for a document type
   */
  getRetentionRequirements(documentType: string, domain?: Domain): {
    years: number;
    reason: string;
  } | null {
    const targetDomain = domain || this.defaultDomain;
    const taxonomy = this.getTaxonomy(targetDomain);
    if (!taxonomy) return null;
    return taxonomy.retentionRules[documentType] || null;
  }

  /**
   * Check if documents can be deleted based on retention
   */
  canDelete(document: {
    type: string;
    createdDate: Date;
  }, domain?: Domain): boolean {
    const targetDomain = domain || this.defaultDomain;
    const retention = this.getRetentionRequirements(document.type, targetDomain);

    if (!retention || retention.years === 0) {
      return false; // Cannot auto-delete if no rule or "keep forever"
    }

    const retentionDate = new Date(document.createdDate);
    retentionDate.setFullYear(retentionDate.getFullYear() + retention.years);

    return retentionDate < new Date();
  }

  /**
   * Get supported countries
   */
  static getSupportedCountries(): string[] {
    return Object.keys(COUNTRY_TAXONOMIES);
  }

  /**
   * Check if country is supported
   */
  static isCountrySupported(country: string): boolean {
    return country in COUNTRY_TAXONOMIES;
  }
}

/**
 * Create expert from environment variables
 */
export function createExpertFromEnv(): TaxonomyExpert {
  const country = process.env.RECORDS_COUNTRY || 'Australia';
  const defaultDomain = (process.env.RECORDS_DEFAULT_DOMAIN as Domain) || 'household';

  if (!TaxonomyExpert.isCountrySupported(country)) {
    console.warn(`Country ${country} not supported, falling back to Australia`);
    return new TaxonomyExpert('Australia', defaultDomain);
  }

  return new TaxonomyExpert(country, defaultDomain);
}
```

---

### Step 5: Create RecordManager CLI Tool

```bash
# File: $PAI_DIR/tools/RecordManager.ts
```

```typescript
// $PAI_DIR/tools/RecordManager.ts
#!/usr/bin/env bun
/**
 * Records Manager CLI Tool
 * Main interface for all record keeping operations
 */

import { PaperlessClient, createClientFromEnv } from '../lib/recordsmanager/PaperlessClient';
import { TaxonomyExpert, createExpertFromEnv, Domain } from '../lib/recordsmanager/TaxonomyExpert';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface CommandOptions {
  [key: string]: string | boolean | number | string[];
}

/**
 * Upload document with intelligent tagging
 */
async function upload(file: string, options: CommandOptions): Promise<void> {
  const client = createClientFromEnv();
  const expert = createExpertFromEnv();
  const domain = (options.domain as Domain) || undefined;

  console.log(`📄 Uploading: ${file}`);

  // Read file
  const fileContent = await readFile(file);
  const fileName = file.split('/').pop() || file;

  // Get taxonomy suggestions
  const suggestions = expert.suggestMetadata(fileName, undefined, domain);

  console.log('💡 Suggested metadata:');
  console.log(`   Document Type: ${suggestions.documentType || 'Auto-detect'}`);
  console.log(`   Tags: ${suggestions.tags.join(', ') || 'None'}`);
  console.log(`   Retention: ${suggestions.retentionYears ? `${suggestions.retentionYears} years` : 'Not specified'}`);
  if (suggestions.retentionReason) {
    console.log(`   Reason: ${suggestions.retentionReason}`);
  }

  // Get or create tags
  const tagIds: number[] = [];
  for (const tagName of suggestions.tags) {
    const tag = await client.getOrCreateTag(tagName);
    tagIds.push(tag.id);
    console.log(`✓ Created/found tag: ${tag.name}`);
  }

  // Get or create document type
  let documentTypeId: number | undefined;
  if (suggestions.documentType) {
    const docType = await client.getOrCreateDocumentType(suggestions.documentType);
    documentTypeId = docType.id;
    console.log(`✓ Created/found document type: ${docType.name}`);
  }

  // Upload document
  const blob = new Blob([fileContent], { type: 'application/pdf' });
  const uploaded = await client.uploadDocument(blob, {
    title: options.title as string || fileName,
    tags: tagIds,
    document_type: documentTypeId,
    created: new Date().toISOString(),
  });

  console.log(`✅ Document uploaded successfully! ID: ${uploaded.id}`);
}

/**
 * Search documents
 */
async function search(options: CommandOptions): Promise<void> {
  const client = createClientFromEnv();

  console.log(`🔍 Searching documents...`);

  const params: any = {};
  if (options.query) params.query = options.query as string;
  if (options.tags) {
    const tagIds = await parseTagIds(client, options.tags as string);
    params.tags__id__in = tagIds;
  }
  if (options.type) {
    const types = await client.getDocumentTypes();
    const type = types.find(t => t.name.toLowerCase() === (options.type as string).toLowerCase());
    if (type) params.document_type__id = type.id;
  }

  const results = await client.searchDocuments(params);

  console.log(`\n📊 Found ${results.count} documents:\n`);
  for (const doc of results.results) {
    console.log(`[${doc.id}] ${doc.title}`);
    console.log(`    Created: ${new Date(doc.created).toLocaleDateString()}`);
    console.log(`    Tags: ${doc.tags.length > 0 ? doc.tags.join(', ') : 'None'}`);
    console.log('');
  }
}

/**
 * Organize documents with taxonomy improvements
 */
async function organize(options: CommandOptions): Promise<void> {
  const client = createClientFromEnv();
  const expert = createExpertFromEnv();
  const domain = (options.domain as Domain) || undefined;

  console.log(`🗂️  Analyzing document organization...`);

  // Get recent documents without proper tags
  const results = await client.searchDocuments({ page_size: 100 });
  const untagged = results.results.filter(d => d.tags.length === 0);

  console.log(`\n📋 Found ${untagged.length} documents without tags\n`);

  for (const doc of untagged) {
    const suggestions = expert.suggestMetadata(doc.title, doc.content, domain);

    console.log(`[${doc.id}] ${doc.title}`);
    console.log(`    Suggested Tags: ${suggestions.tags.join(', ') || 'None'}`);
    console.log(`    Suggested Type: ${suggestions.documentType || 'Auto-detect'}`);

    if (options.apply) {
      // Apply suggestions
      const tagIds: number[] = [];
      for (const tagName of suggestions.tags) {
        const tag = await client.getOrCreateTag(tagName);
        tagIds.push(tag.id);
      }

      await client.updateDocument(doc.id, { tags: tagIds });
      console.log(`    ✅ Applied tags`);
    }
    console.log('');
  }
}

/**
 * Add tags to documents
 */
async function tag(docIds: string[], tagNames: string[]): Promise<void> {
  const client = createClientFromEnv();

  console.log(`🏷️  Tagging ${docIds.length} documents...`);

  // Get or create tags
  const tagIds: number[] = [];
  for (const tagName of tagNames) {
    const tag = await client.getOrCreateTag(tagName);
    tagIds.push(tag.id);
    console.log(`✓ Tag: ${tag.name} (ID: ${tag.id})`);
  }

  // Apply to documents
  for (const idStr of docIds) {
    const id = parseInt(idStr, 10);
    const doc = await client.getDocument(id);

    const newTags = [...new Set([...doc.tags, ...tagIds])];
    await client.updateDocument(id, { tags: newTags });

    console.log(`✅ Tagged document ${id}: ${doc.title}`);
  }
}

/**
 * Get document information
 */
async function info(docId: string): Promise<void> {
  const client = createClientFromEnv();
  const expert = createExpertFromEnv();

  const id = parseInt(docId, 10);
  const doc = await client.getDocument(id);

  console.log(`\n📄 Document Information\n`);
  console.log(`ID: ${doc.id}`);
  console.log(`Title: ${doc.title}`);
  console.log(`Filename: ${doc.original_file_name}`);
  console.log(`Created: ${new Date(doc.created).toLocaleString()}`);
  console.log(`Modified: ${new Date(doc.modified).toLocaleString()}`);

  // Get tags
  const allTags = await client.getTags();
  const docTags = allTags.filter(t => doc.tags.includes(t.id));
  console.log(`\nTags:`);
  if (docTags.length === 0) {
    console.log(`  (None)`);
  } else {
    for (const tag of docTags) {
      console.log(`  • ${tag.name} (${tag.color})`);
    }
  }

  // Get document type
  if (doc.document_type) {
    const allTypes = await client.getDocumentTypes();
    const docType = allTypes.find(t => t.id === doc.document_type);
    if (docType) {
      console.log(`\nDocument Type: ${docType.name}`);

      // Check retention
      const retention = expert.getRetentionRequirements(docType.name);
      if (retention) {
        const retentionDate = new Date(doc.created);
        retentionDate.setFullYear(retentionDate.getFullYear() + retention.years);
        const canDelete = retentionDate < new Date();

        console.log(`\nRetention:`);
        console.log(`  Period: ${retention.years} years`);
        console.log(`  Reason: ${retention.reason}`);
        console.log(`  Keep Until: ${retentionDate.toLocaleDateString()}`);
        console.log(`  Can Delete: ${canDelete ? 'Yes (past retention)' : 'No'}`);
      }
    }
  }

  console.log('');
}

/**
 * Check retention requirements
 */
async function retention(options: CommandOptions): Promise<void> {
  const expert = createExpertFromEnv();
  const domain = (options.domain as Domain) || undefined;

  console.log(`📅 Retention Requirements for ${expert.constructor.name}\n`);

  const docTypes = expert.getDocumentTypes(domain);

  for (const docType of docTypes) {
    const retention = expert.getRetentionRequirements(docType, domain);
    if (retention) {
      console.log(`${docType}:`);
      console.log(`  Keep for: ${retention.years} years`);
      console.log(`  Reason: ${retention.reason}`);
      console.log('');
    }
  }
}

/**
 * Parse tag names to IDs
 */
async function parseTagIds(client: PaperlessClient, tagNamesStr: string): Promise<number[]> {
  const tagNames = tagNamesStr.split(',').map(t => t.trim());
  const allTags = await client.getTags();

  const ids: number[] = [];
  for (const name of tagNames) {
    const tag = allTags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (tag) {
      ids.push(tag.id);
    }
  }

  return ids;
}

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  // Parse options
  const options: CommandOptions = {};
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    }
  }

  try {
    switch (command) {
      case 'upload':
        await upload(args[1], options);
        break;

      case 'search':
        await search(options);
        break;

      case 'organize':
        await organize(options);
        break;

      case 'tag':
        await tag(args[1].split(','), args.slice(2));
        break;

      case 'info':
        await info(args[1]);
        break;

      case 'retention':
        await retention(options);
        break;

      case 'delete':
        console.error('❌ Deletion requires explicit approval');
        console.error('   Use the DeleteConfirmation workflow instead');
        console.error('   This prevents catastrophic data loss');
        process.exit(1);
        break;

      default:
        console.log(`
Records Manager CLI - Document Management with Expert Taxonomies

Usage:
  bun run tools/RecordManager.ts <command> [options]

Commands:
  upload <file>              Upload document with intelligent tagging
    --title <title>          Custom document title
    --domain <domain>        household | corporate | projects

  search                     Search documents
    --query <text>           Search in content
    --tags <tags>            Comma-separated tag names
    --type <type>            Document type filter

  organize                   Suggest and apply taxonomy improvements
    --domain <domain>        Domain to analyze
    --apply                  Apply suggested tags (dry run without)

  tag <docIds> <tags>        Add tags to documents
    docIds:                  Comma-separated document IDs
    tags:                    Tag names to add

  info <docId>               Get document information and retention status

  retention                  Show retention requirements for document types
    --domain <domain>        Domain to show

  delete <query>             ⚠️  REQUIRES EXPLICIT APPROVAL
                             Must use DeleteConfirmation workflow

Examples:
  bun run tools/RecordManager.ts upload invoice.pdf --domain corporate
  bun run tools/RecordManager.ts search --tags "tax,2024"
  bun run tools/RecordManager.ts organize --domain household --apply
  bun run tools/RecordManager.ts info 12345
  bun run tools/RecordManager.ts retention --domain corporate

Environment Variables:
  PAPERLESS_URL              Your paperless-ngx instance URL
  PAPERLESS_API_TOKEN        API token with read/write permissions
  RECORDS_COUNTRY            Your country for compliance (default: Australia)
  RECORDS_DEFAULT_DOMAIN     Default domain (default: household)
        `);
        process.exit(1);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main();
```

Make the tool executable:

```bash
chmod +x $PAI_DIR/tools/RecordManager.ts
```

---

### Step 6: Create Skill Definition File

```bash
# File: $PAI_DIR/skills/RECORDSMANAGER/SKILL.md
```

See the next section for the complete skill file content. This file is created in Step 6.

---

### Step 7: Create Workflows

#### 7.1: DeleteConfirmation Workflow

```bash
# File: $PAI_DIR/skills/RECORDSMANAGER/Workflows/DeleteConfirmation.md
```

```markdown
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
```

---

### Step 7.2: Create Additional Workflows

Create these additional workflow files in `$PAI_DIR/skills/RECORDSMANAGER/Workflows/`:

- **UploadWorkflow.md** - Document upload with intelligent tagging
- **SearchWorkflow.md** - Document search and retrieval
- **OrganizeWorkflow.md** - Taxonomy improvement suggestions
- **RetentionWorkflow.md** - Retention requirement checking

(Each workflow follows a similar structure to DeleteConfirmation with step-by-step instructions)

---

### Step 8: Create Taxonomy Reference Files

```bash
# Create country-specific taxonomy directories
mkdir -p "$PAI_DIR/skills/RECORDSMANAGER/Taxonomies"/{Australia,UnitedStates,UnitedKingdom}
```

Create taxonomy documentation files for each country with:
- Document types and descriptions
- Tag categories and usage guidelines
- Retention requirements with legal references
- Best practices specific to that jurisdiction

---

### Step 9: Verify Installation

Run these verification steps:

```bash
# 1. Check all files exist
ls -la $PAI_DIR/lib/recordsmanager/
# Should show: PaperlessClient.ts, TaxonomyExpert.ts

ls -la $PAI_DIR/tools/RecordManager.ts
# Should show the CLI tool

ls -la $PAI_DIR/skills/RECORDSMANAGER/
# Should show: SKILL.md, Workflows/, Taxonomies/, Tools/, Context/, entities.json

# 2. Verify Bun can run the tool
bun run $PAI_DIR/tools/RecordManager.ts --help
# Should show usage information

# 3. Test paperless-ngx connection
bun run $PAI_DIR/tools/RecordManager.ts search
# Should return documents or empty result set

# 4. Check environment variables
echo "PAPERLESS_URL: $PAPERLESS_URL"
echo "RECORDS_COUNTRY: $RECORDS_COUNTRY"
echo "Entities configured:"
echo "$RECORDS_ENTITIES" | jq '.'
```

**Verify entity configuration:**

```bash
# Check entities.json was created
cat "$PAI_DIR/skills/RECORDSMANAGER/entities.json"

# Verify each entity has tags in paperless-ngx
echo "Checking entity tags in paperless-ngx..."
bun run $PAI_DIR/tools/RecordManager.ts search --tags "household"
bun run $PAI_DIR/tools/RecordManager.ts search --tags "corporate"
bun run $PAI_DIR/tools/RecordManager.ts search --tags "family-trust"
bun run $PAI_DIR/tools/RecordManager.ts search --tags "unit-trust"
```

**Test entity-specific features:**

```bash
# Test trust-specific retention check
echo "Testing trust retention for family trusts..."
bun run $PAI_DIR/tools/RecordManager.ts retention --domain family-trust

# Test workflow creation
echo "Testing workflow analysis..."
# The WorkflowExpert agent will analyze existing documents
```

If all checks pass, installation is complete!

---

## Post-Installation Configuration

### Add or Modify Entities

After installation, you can add new entities or modify existing ones:

**Option 1: Edit entities.json directly**
```bash
# Edit the entity registry
nano "$PAI_DIR/skills/RECORDSMANAGER/entities.json"

# Add new entity to the entities array
{
  "entities": [
    {
      "id": "smith-family-trust",
      "type": "family-trust",
      "name": "Smith Family Trust",
      "abn": "12345678901",
      "tfn": "987654321",
      "trustee": "Smith Pty Ltd",
      "fteDate": "2020-01-15",
      "created": "2024-01-17T00:00:00Z"
    }
  ],
  "created": "2024-01-17T00:00:00Z",
  "lastModified": "2024-01-17T00:00:00Z"
}
```

**Option 2: Use the EntityCreator agent**
```bash
# Ask the Records Manager to add an entity
"Records Manager, add a new unit trust called 'Jones Unit Trust' with ABN 98765432101"

# The EntityCreator will:
# 1. Create entity-specific tags
# 2. Create storage paths
# 3. Create custom fields
# 4. Update entities.json
```

**Option 3: Update .env and re-run setup**
```bash
# Edit .env to add new entity
nano $PAI_DIR/.env

# Update RECORDS_ENTITIES to include new entity
RECORDS_ENTITIES='[
  {"type":"family-trust","name":"Smith Family Trust","abn":"12345678901","tfn":"987654321","trustee":"Smith Pty Ltd","fteDate":"2020-01-15"},
  {"type":"unit-trust","name":"Jones Unit Trust","abn":"98765432101","tfn":"123456789","trustee":"Jones Pty Ltd"}
]'

# Reload environment
export $(grep -v '^#' $PAI_DIR/.env | xargs)
```

### Create Custom Taxonomies (Optional)

If you have specific needs, create custom taxonomy files:

```bash
# Create custom tags
cat > $PAI_DIR/skills/RECORDSMANAGER/Taxonomies/${RECORDS_COUNTRY}/custom_tags.md << EOF
# Custom Tags for [Your Name]

## Household Specific Tags
- [specific-tag-1]: Description and usage
- [specific-tag-2]: Description and usage

## Custom Retention Periods
- [Document Type]: X years - [Specific reason]
EOF
```

---

## Usage Examples

### Example 1: Upload Document to Specific Entity

```bash
# Upload a tax document to Smith Family Trust
bun run $PAI_DIR/tools/RecordManager.ts upload \
  tax_return_2024.pdf \
  --title "Smith Family Trust - Tax Return 2024" \
  --tags "family-trust,smith-family-trust,tax,2024"
```

### Example 2: Search Documents by Entity

```bash
# Search all documents for Jones Unit Trust
bun run $PAI_DIR/tools/RecordManager.ts search \
  --tags "unit-trust,jones-unit-trust"

# Search invoices across all corporate entities
bun run $PAI_DIR/tools/RecordManager.ts search \
  --tags "corporate" \
  --type "Invoice"
```

### Example 3: Trust Document Retention Check

```bash
# Check retention for family trust documents
bun run $PAI_DIR/tools/RecordManager.ts retention --domain family-trust

# Output will show:
# Family Trust Election: Keep 5+ years from FTE date
# Trust Deed: Keep forever
# Distribution Minutes: Keep 5+ years
```

### Example 4: Auto-Organize Documents

```bash
# Suggest tags for untagged documents (dry run)
bun run $PAI_DIR/tools/RecordManager.ts organize --domain corporate

# Apply suggestions automatically
bun run $PAI_DIR/tools/RecordManager.ts organize --domain corporate --apply
```

### Example 5: Create Workflow for Invoices

```
You: "Records Manager, create a workflow for supplier invoices"

AI: "I'll analyze your invoice documents and create a workflow.

     Analyzing 150 invoice documents...
     ✓ Found common patterns
     ✓ Detected suppliers
     ✓ Identified invoice numbers
     ✓ Extracted dates and amounts

     Proposed workflow:
     - Match documents containing 'tax invoice' or 'invoice'
     - Auto-tag with 'invoice', 'supplier', financial-year'
     - Extract supplier name as correspondent
     - Match rate: 94%

     Want me to create this workflow in paperless-ngx?"

You: "Yes, create it"

AI: "✓ Created workflow 'Supplier Invoices'
     ✓ Auto-tagging rules configured
     ✓ Correspondent matching enabled
     ✓ Test run: 142/150 invoices matched (94.7%)"
```

### Example 6: Add New Trust Entity

```
You: "Records Manager, add a new discretionary trust called 'Brown Discretionary Trust'"

AI: "Creating entity 'Brown Discretionary Trust' (discretionary-trust)

     I need some information:
     1. ABN (11 digits)?
     2. TFN (optional, 9 digits)?
     3. Trustee name?
     4. Beneficiaries (optional, comma-separated)?

     Please provide the details..."

You: "ABN is 98765432101, TFN is 123456789, trustee is Brown Pty Ltd, beneficiaries are John Brown, Jane Brown"

AI: "✓ Creating entity 'Brown Discretionary Trust'
     ✓ Created tags: discretionary-trust, brown-discretionary-trust
     ✓ Created storage path: /Brown Discretionary Trust/
     ✓ Created custom fields: abn, tfn, trustee, beneficiaries
     ✓ Set up retention rules for discretionary trust documents
     ✓ Entity registered in entities.json

     Trust-specific retention requirements:
     - Trust deed: Keep forever
     - Trust variations: Keep forever
     - Trustee records: Keep while trustee + 5 years
     - Distribution minutes: Keep 5+ years
     - Beneficiary records: Keep while trust exists + 5 years"
```

### Example 7: Bulk Tag by Entity

```bash
# Tag all documents for a specific trust
bun run $PAI_DIR/tools/RecordManager.ts tag \
  $(bun run $PAI_DIR/tools/RecordManager.ts search --query "Smith Family Trust" --output-ids) \
  "smith-family-trust,family-trust,trust"
```

---

## Troubleshooting

### Paperless-ngx Connection Issues

**Problem:** "Cannot reach paperless-ngx API"

**Solution:**
1. Verify URL includes protocol (https:// or http://)
2. Check API token has correct permissions
3. Test connectivity: `curl -I $PAPERLESS_URL/api/`

### Permission Errors

**Problem:** "API error: 403 Forbidden"

**Solution:**
1. Regenerate API token in paperless-ngx
2. Ensure token has "Read/Write" permissions
3. Update .env file with new token

### Country Not Supported

**Problem:** "Country X not supported, falling back to Australia"

**Solution:**
1. Taxonomies are currently available for: Australia, United States, United Kingdom
2. For other countries, default to Australia or create custom taxonomy
3. Contribute your country's guidelines to the pack!

---

## Uninstallation

To remove the Records Manager Skill:

```bash
# Remove skill directory
rm -rf $PAI_DIR/skills/RECORDSMANAGER

# Remove libraries
rm -rf $PAI_DIR/lib/recordsmanager

# Remove tool
rm $PAI_DIR/tools/RecordManager.ts

# Remove environment variables from .env
nano $PAI_DIR/.env
# Delete or comment out PAPERLESS_* and RECORDS_* variables
```

**Note:** This does not delete any documents in paperless-ngx. Your documents are safe.

---

## Next Steps

1. **Test the installation:** Run a few test commands to ensure everything works
2. **Customize your taxonomy:** Add country-specific tags and retention rules
3. **Upload some documents:** Try uploading with intelligent tagging
4. **Review retention requirements:** Understand how long to keep different document types

For detailed verification, see [VERIFY.md](./VERIFY.md)
