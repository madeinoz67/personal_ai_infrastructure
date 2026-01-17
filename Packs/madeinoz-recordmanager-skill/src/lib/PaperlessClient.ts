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
  const baseUrl = process.env.MADEINOZ_RECORDMANAGER_PAPERLESS_URL;
  const apiToken = process.env.MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN;

  if (!baseUrl || !apiToken) {
    throw new Error('MADEINOZ_RECORDMANAGER_PAPERLESS_URL and MADEINOZ_RECORDMANAGER_PAPERLESS_API_TOKEN must be set in environment');
  }

  return new PaperlessClient({ baseUrl, apiToken });
}
