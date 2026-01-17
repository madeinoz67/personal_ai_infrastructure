#!/usr/bin/env tsx
/**
 * Create Hierarchical Tag Structure in paperless-ngx
 *
 * This script creates the complete tag taxonomy for record keeping.
 * READ-ONLY operation - only creates tags, never deletes.
 */

interface TagDefinition {
  name: string;
  color: string;
}

// Tag colors by category
const CATEGORY_COLORS: Record<string, string> = {
  'DOMAIN': '#6c757d',    // Gray
  'COMPANY': '#17a2b8',   // Cyan
  'TRUST': '#6610f2',     // Purple
  'FINANCIAL': '#28a745', // Green
  'INSURANCE': '#fd7e14', // Orange
  'LEGAL': '#dc3545',     // Red
  'MEDICAL': '#20c997',   // Teal
  'PROPERTY': '#6f42c1',  // Purple-light
  'VEHICLE': '#ffc107',   // Yellow
  'RETENTION': '#343a40', // Dark gray
  'YEAR': '#007bff',      // Blue
};

// Complete tag structure
const TAG_STRUCTURE: Record<string, TagDefinition[]> = {
  'DOMAIN': [
    { name: 'DOMAIN/household', color: CATEGORY_COLORS.DOMAIN },
    { name: 'DOMAIN/company', color: CATEGORY_COLORS.DOMAIN },
    { name: 'DOMAIN/trust', color: CATEGORY_COLORS.DOMAIN },
    { name: 'DOMAIN/personal', color: CATEGORY_COLORS.DOMAIN },
  ],
  'COMPANY': [
    { name: 'COMPANY/darklight', color: CATEGORY_COLORS.COMPANY },
    { name: 'COMPANY/strobotics', color: CATEGORY_COLORS.COMPANY },
  ],
  'TRUST': [
    { name: 'TRUST/eaton-family-trust', color: CATEGORY_COLORS.TRUST },
    { name: 'TRUST/courtney-eaton-trust', color: CATEGORY_COLORS.TRUST },
  ],
  'FINANCIAL': [
    { name: 'FINANCIAL/tax', color: CATEGORY_COLORS.FINANCIAL },
    { name: 'FINANCIAL/banking', color: CATEGORY_COLORS.FINANCIAL },
    { name: 'FINANCIAL/insurance', color: CATEGORY_COLORS.FINANCIAL },
    { name: 'FINANCIAL/investment', color: CATEGORY_COLORS.FINANCIAL },
    { name: 'FINANCIAL/superannuation', color: CATEGORY_COLORS.FINANCIAL },
  ],
  'INSURANCE': [
    { name: 'INSURANCE/home', color: CATEGORY_COLORS.INSURANCE },
    { name: 'INSURANCE/vehicle', color: CATEGORY_COLORS.INSURANCE },
    { name: 'INSURANCE/health', color: CATEGORY_COLORS.INSURANCE },
    { name: 'INSURANCE/life', color: CATEGORY_COLORS.INSURANCE },
  ],
  'LEGAL': [
    { name: 'LEGAL/contract', color: CATEGORY_COLORS.LEGAL },
    { name: 'LEGAL/agreement', color: CATEGORY_COLORS.LEGAL },
    { name: 'LEGAL/will', color: CATEGORY_COLORS.LEGAL },
    { name: 'LEGAL/power-of-attorney', color: CATEGORY_COLORS.LEGAL },
  ],
  'MEDICAL': [
    { name: 'MEDICAL/doctor', color: CATEGORY_COLORS.MEDICAL },
    { name: 'MEDICAL/hospital', color: CATEGORY_COLORS.MEDICAL },
    { name: 'MEDICAL/pharmacy', color: CATEGORY_COLORS.MEDICAL },
    { name: 'MEDICAL/specialist', color: CATEGORY_COLORS.MEDICAL },
    { name: 'MEDICAL/receipt', color: CATEGORY_COLORS.MEDICAL },
  ],
  'PROPERTY': [
    { name: 'PROPERTY/utility', color: CATEGORY_COLORS.PROPERTY },
    { name: 'PROPERTY/maintenance', color: CATEGORY_COLORS.PROPERTY },
    { name: 'PROPERTY/warranty', color: CATEGORY_COLORS.PROPERTY },
    { name: 'PROPERTY/rental', color: CATEGORY_COLORS.PROPERTY },
    { name: 'PROPERTY/ownership', color: CATEGORY_COLORS.PROPERTY },
  ],
  'VEHICLE': [
    { name: 'VEHICLE/registration', color: CATEGORY_COLORS.VEHICLE },
    { name: 'VEHICLE/insurance', color: CATEGORY_COLORS.VEHICLE },
    { name: 'VEHICLE/maintenance', color: CATEGORY_COLORS.VEHICLE },
    { name: 'VEHICLE/fuel', color: CATEGORY_COLORS.VEHICLE },
  ],
  'RETENTION': [
    { name: 'RETENTION/5-years', color: CATEGORY_COLORS.RETENTION },
    { name: 'RETENTION/7-years', color: CATEGORY_COLORS.RETENTION },
    { name: 'RETENTION/10-years', color: CATEGORY_COLORS.RETENTION },
    { name: 'RETENTION/indefinite', color: CATEGORY_COLORS.RETENTION },
  ],
  'YEAR': [
    { name: 'YEAR/2020', color: CATEGORY_COLORS.YEAR },
    { name: 'YEAR/2021', color: CATEGORY_COLORS.YEAR },
    { name: 'YEAR/2022', color: CATEGORY_COLORS.YEAR },
    { name: 'YEAR/2023', color: CATEGORY_COLORS.YEAR },
    { name: 'YEAR/2024', color: CATEGORY_COLORS.YEAR },
    { name: 'YEAR/2025', color: CATEGORY_COLORS.YEAR },
  ],
};

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface CreateTagResponse {
  id: number;
  name: string;
  slug: string;
  color: string;
}

async function getTags(baseUrl: string, apiToken: string): Promise<Tag[]> {
  const response = await fetch(`${baseUrl}/api/tags/`, {
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || data;
}

async function createTag(
  baseUrl: string,
  apiToken: string,
  name: string,
  color: string
): Promise<Tag | null> {
  const response = await fetch(`${baseUrl}/api/tags/`, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      slug: name.toLowerCase().replace(/\//g, '-').replace(/\s+/g, '-'),
      color,
      matching_algorithm: 0,
      is_insensitive: true,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`  Error creating tag "${name}":`, error);
    return null;
  }

  const data = await response.json();
  return data;
}

async function createTagStructure(baseUrl: string, apiToken: string): Promise<void> {
  console.log('Fetching existing tags...');
  const existingTags = await getTags(baseUrl, apiToken);
  const existingTagNames = new Set(existingTags.map(t => t.name.toLowerCase()));

  console.log(`Found ${existingTags.length} existing tags\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [category, tags] of Object.entries(TAG_STRUCTURE)) {
    console.log(`\n${category}:`);
    for (const tag of tags) {
      if (existingTagNames.has(tag.name.toLowerCase())) {
        console.log(`  [SKIP] "${tag.name}" already exists`);
        skipped++;
      } else {
        const result = await createTag(baseUrl, apiToken, tag.name, tag.color);
        if (result) {
          console.log(`  [CREATE] "${tag.name}" - ID: ${result.id}`);
          created++;
        } else {
          failed++;
        }
      }
    }
  }

  console.log('\n========================================');
  console.log('Summary:');
  console.log(`  Created: ${created} tags`);
  console.log(`  Skipped: ${skipped} existing tags`);
  console.log(`  Failed:  ${failed} tags`);
  console.log('========================================');
}

// Main execution
async function main() {
  const baseUrl = process.env.MADEINOZ_RECORDMANAGER_PAPERLESS_URL;
  const apiToken = process.env.MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN;

  if (!baseUrl || !apiToken) {
    console.error('Error: Missing environment variables');
    console.error('\nPlease set the following:');
    console.error('  MADEINOZ_RECORDMANAGER_PAPERLESS_URL');
    console.error('  MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN');
    console.error('\nExample:');
    console.error(`  export MADEINOZ_RECORDMANAGER_PAPERLESS_URL="https://paperless.example.com"`);
    console.error(`  export MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN="your-token-here"`);
    console.error(`  bun run create-tags.ts`);
    process.exit(1);
  }

  // Remove trailing slash from baseUrl
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  console.log(`Connecting to: ${cleanBaseUrl}`);
  console.log('Creating hierarchical tag structure...\n');

  try {
    await createTagStructure(cleanBaseUrl, apiToken);
    console.log('\nDone!');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module || import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { TAG_STRUCTURE, CATEGORY_COLORS, createTagStructure };
