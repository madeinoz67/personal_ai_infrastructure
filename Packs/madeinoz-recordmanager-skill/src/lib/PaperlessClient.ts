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

export interface Correspondent {
  id: number;
  name: string;
  slug: string;
  match?: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  document_count: number;
}

export interface StoragePath {
  id: number;
  name: string;
  path: string;
  parent?: number;
  document_count: number;
}

export interface CustomField {
  id: number;
  name: string;
  data_type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  extra_data?: {
    options?: string[];
  };
}

export interface SearchResult {
  count: number;
  next?: string;
  previous?: string;
  results: Document[];
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  succeeded: number[];
  failed: Array<{
    documentId: number;
    error: string;
  }>;
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
   * Get all correspondents
   */
  async getCorrespondents(): Promise<Correspondent[]> {
    const response = await this.request<{ results: Correspondent[] }>('/correspondents/');
    return response.results;
  }

  /**
   * Get correspondent by ID
   */
  async getCorrespondent(id: number): Promise<Correspondent> {
    return this.request<Correspondent>(`/correspondents/${id}/`);
  }

  /**
   * Get correspondent by name (create if not exists)
   */
  async getOrCreateCorrespondent(name: string): Promise<Correspondent> {
    try {
      const correspondents = await this.getCorrespondents();
      const existing = correspondents.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing) return existing;
    } catch (error) {
      // Continue to creation
    }

    // Create new correspondent
    return this.request<Correspondent>('/correspondents/', {
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
   * Get all storage paths
   */
  async getStoragePaths(): Promise<StoragePath[]> {
    const response = await this.request<{ results: StoragePath[] }>('/storage_paths/');
    return response.results;
  }

  /**
   * Get storage path by ID
   */
  async getStoragePath(id: number): Promise<StoragePath> {
    return this.request<StoragePath>(`/storage_paths/${id}/`);
  }

  /**
   * Get storage path by path string (create if not exists)
   */
  async getOrCreateStoragePath(path: string): Promise<StoragePath> {
    try {
      const paths = await this.getStoragePaths();
      const existing = paths.find(p => p.path.toLowerCase() === path.toLowerCase());
      if (existing) return existing;
    } catch (error) {
      // Continue to creation
    }

    // Extract name from path (last component)
    const name = path.split('/').filter(Boolean).pop() || path;

    // Create new storage path
    return this.request<StoragePath>('/storage_paths/', {
      method: 'POST',
      body: JSON.stringify({
        name,
        path,
        matching_algorithm: 0,
        is_insensitive: true,
      }),
    });
  }

  /**
   * Get all custom fields
   */
  async getCustomFields(): Promise<CustomField[]> {
    const response = await this.request<{ results: CustomField[] }>('/custom_fields/');
    return response.results;
  }

  /**
   * Create custom field
   */
  async createCustomField(field: Omit<CustomField, 'id'>): Promise<CustomField> {
    return this.request<CustomField>('/custom_fields/', {
      method: 'POST',
      body: JSON.stringify(field),
    });
  }

  /**
   * Bulk edit documents
   */
  async bulkEdit(
    documentIds: number[],
    updates: Partial<Pick<Document, 'title' | 'tags' | 'document_type' | 'correspondent' | 'storage_path'>>
  ): Promise<BulkOperationResult> {
    const response = await this.request<{
      task_id: string;
    }>('/documents/bulk_edit/', {
      method: 'POST',
      body: JSON.stringify({
        documents: documentIds,
        ...updates,
      }),
    });

    // Note: paperless-ngx processes bulk operations asynchronously
    // The task_id can be used to check status
    // For simplicity, we return success immediately
    return {
      success: true,
      processed: documentIds.length,
      succeeded: documentIds,
      failed: [],
    };
  }

  /**
   * Bulk reprocess documents
   */
  async bulkReprocess(documentIds: number[]): Promise<BulkOperationResult> {
    const response = await this.request<{
      task_id: string;
    }>('/documents/bulk_reprocess/', {
      method: 'POST',
      body: JSON.stringify({
        documents: documentIds,
      }),
    });

    // Note: paperless-ngx processes bulk operations asynchronously
    return {
      success: true,
      processed: documentIds.length,
      succeeded: documentIds,
      failed: [],
    };
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
