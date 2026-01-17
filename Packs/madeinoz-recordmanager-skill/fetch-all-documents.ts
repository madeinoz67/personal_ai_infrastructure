#!/usr/bin/env bun
/**
 * Fetch all documents from paperless-ngx for migration planning
 * Output includes: ID, title, tags, document type, correspondent, created date, ASN
 * READ-ONLY operation - no documents are deleted or modified
 */

// Load environment variables from .env file
import { config } from 'dotenv';

// Try loading from various possible locations
const envPaths = [
  '/Users/seaton/.claude/.env',
  '.env',
  '/Users/seaton/Documents/src/personal_ai_infrastructure/.env',
];

let envLoaded = false;
for (const path of envPaths) {
  try {
    const result = config({ path });
    if (result.error) {
      // Try next path
      continue;
    }
    envLoaded = true;
    console.log(`Loaded environment from: ${path}`);
    break;
  } catch {
    // Try next path
  }
}

if (!envLoaded) {
  console.log('No .env file found, using existing environment variables');
}

interface PaperlessConfig {
  baseUrl: string;
  apiToken: string;
}

interface Document {
  id: number;
  title: string;
  created: string;
  modified: string;
  archive_serial_number?: number;
  original_file_name: string;
  owner: number;
  tags: number[];
  document_type?: number;
  correspondent?: number;
  storage_path?: number;
  notes?: string[];
}

interface Tag {
  id: number;
  name: string;
  slug: string;
  color: string;
}

interface DocumentType {
  id: number;
  name: string;
  slug: string;
}

interface Correspondent {
  id: number;
  name: string;
  slug: string;
}

interface SearchResult {
  count: number;
  next?: string;
  previous?: string;
  results: Document[];
}

interface EnrichedDocument {
  id: number;
  title: string;
  created: string;
  asn?: number;
  tags: string[];
  document_type?: string;
  correspondent?: string;
  original_file_name: string;
}

class PaperlessFetcher {
  private config: PaperlessConfig;
  private baseUrl: string;

  constructor(config: PaperlessConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Token ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const response = await fetch(url, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Paperless API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getAllTags(): Promise<Map<number, Tag>> {
    console.log('Fetching tags...');
    const tagMap = new Map<number, Tag>();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: '100',
      });
      const response = await this.request<{ count: number; next?: string; results: Tag[] }>(`/tags/?${searchParams.toString()}`);
      response.results.forEach(t => tagMap.set(t.id, t));
      hasMore = response.next !== null && response.next !== undefined;
      page++;
    }

    console.log(`✓ Found ${tagMap.size} tags`);
    return tagMap;
  }

  async getAllDocumentTypes(): Promise<Map<number, DocumentType>> {
    console.log('Fetching document types...');
    const typeMap = new Map<number, DocumentType>();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: '100',
      });
      const response = await this.request<{ count: number; next?: string; results: DocumentType[] }>(`/document_types/?${searchParams.toString()}`);
      response.results.forEach(t => typeMap.set(t.id, t));
      hasMore = response.next !== null && response.next !== undefined;
      page++;
    }

    console.log(`✓ Found ${typeMap.size} document types`);
    return typeMap;
  }

  async getAllCorrespondents(): Promise<Map<number, Correspondent>> {
    console.log('Fetching correspondents...');
    const correspondentMap = new Map<number, Correspondent>();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: '100',
      });
      const response = await this.request<{ count: number; next?: string; results: Correspondent[] }>(`/correspondents/?${searchParams.toString()}`);
      response.results.forEach(c => correspondentMap.set(c.id, c));
      hasMore = response.next !== null && response.next !== undefined;
      page++;
    }

    console.log(`✓ Found ${correspondentMap.size} correspondents`);
    return correspondentMap;
  }

  async getAllDocuments(pageSize: number = 100): Promise<Document[]> {
    console.log(`Fetching documents (page size: ${pageSize})...`);
    const allDocuments: Document[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const searchParams = new URLSearchParams({
        page: String(page),
        page_size: String(pageSize),
      });

      const result = await this.request<SearchResult>(`/documents/?${searchParams.toString()}`);

      allDocuments.push(...result.results);
      console.log(`  Fetched page ${page}: ${result.results.length} documents (total: ${allDocuments.length}/${result.count})`);

      hasMore = result.next !== null && result.next !== undefined;
      page++;
    }

    console.log(`✓ Found ${allDocuments.length} total documents`);
    return allDocuments;
  }

  async fetchAll(): Promise<EnrichedDocument[]> {
    // Fetch all metadata in parallel
    const [tags, documentTypes, correspondents, documents] = await Promise.all([
      this.getAllTags(),
      this.getAllDocumentTypes(),
      this.getAllCorrespondents(),
      this.getAllDocuments(),
    ]);

    console.log('\nEnriching documents with metadata...');

    // Enrich each document with human-readable metadata
    const enriched: EnrichedDocument[] = documents.map(doc => {
      const tagNames = doc.tags.map(tagId => tags.get(tagId)?.name || `Unknown(${tagId})`);
      const docTypeName = doc.document_type ? documentTypes.get(doc.document_type)?.name : undefined;
      const correspondentName = doc.correspondent ? correspondents.get(doc.correspondent)?.name : undefined;

      return {
        id: doc.id,
        title: doc.title,
        created: doc.created,
        asn: doc.archive_serial_number,
        tags: tagNames,
        document_type: docTypeName,
        correspondent: correspondentName,
        original_file_name: doc.original_file_name,
      };
    });

    console.log(`✓ Enriched ${enriched.length} documents`);
    return enriched;
  }
}

/**
 * Create client from environment variables
 */
function createClientFromEnv(): PaperlessFetcher {
  const baseUrl = process.env.MADEINOZ_RECORDMANAGER_PAPERLESS_URL;
  const apiToken = process.env.MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN;

  if (!baseUrl || !apiToken) {
    throw new Error('MADEINOZ_RECORDMANAGER_PAPERLESS_URL and MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN must be set in environment');
  }

  return new PaperlessFetcher({ baseUrl, apiToken });
}

async function main() {
  console.log('📄 Paperless-ngx Document Fetcher');
  console.log('=================================\n');
  console.log('READ-ONLY OPERATION - No documents will be modified or deleted\n');

  try {
    const fetcher = createClientFromEnv();
    const documents = await fetcher.fetchAll();

    // Output to JSON file
    const outputPath = '/Users/seaton/.claude/MEMORY/Work/current/all-documents.json';
    await Bun.write(outputPath, JSON.stringify(documents, null, 2));

    console.log(`\n✅ Successfully exported ${documents.length} documents to:`);
    console.log(`   ${outputPath}`);

    // Print summary statistics
    console.log('\n📊 Summary Statistics:');
    console.log(`   Total documents: ${documents.length}`);

    const withTags = documents.filter(d => d.tags.length > 0).length;
    const withDocType = documents.filter(d => d.document_type).length;
    const withCorrespondent = documents.filter(d => d.correspondent).length;
    const withAsn = documents.filter(d => d.asn).length;

    console.log(`   With tags: ${withTags} (${((withTags / documents.length) * 100).toFixed(1)}%)`);
    console.log(`   With document type: ${withDocType} (${((withDocType / documents.length) * 100).toFixed(1)}%)`);
    console.log(`   With correspondent: ${withCorrespondent} (${((withCorrespondent / documents.length) * 100).toFixed(1)}%)`);
    console.log(`   With ASN: ${withAsn} (${((withAsn / documents.length) * 100).toFixed(1)}%)`);

    // Show unique tags, types, and correspondents
    const allTags = new Set<string>();
    const allTypes = new Set<string>();
    const allCorrespondents = new Set<string>();

    documents.forEach(doc => {
      doc.tags.forEach(t => allTags.add(t));
      if (doc.document_type) allTypes.add(doc.document_type);
      if (doc.correspondent) allCorrespondents.add(doc.correspondent);
    });

    console.log(`\n🏷️  Unique tags: ${allTags.size}`);
    console.log(`📋 Unique document types: ${allTypes.size}`);
    console.log(`👤 Unique correspondents: ${allCorrespondents.size}`);

  } catch (error) {
    if (error instanceof Error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

main();
