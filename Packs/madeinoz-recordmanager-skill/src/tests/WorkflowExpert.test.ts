// $PAI_DIR/tests/WorkflowExpert.test.ts
/**
 * Workflow Expert Tests
 * Comprehensive test suite for workflow pattern analysis and management
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { WorkflowExpert, Workflow, WorkflowRecommendation, WorkflowReview } from '../lib/WorkflowExpert';
import { PaperlessClient, Document, Tag, DocumentType, Correspondent, StoragePath, SearchResult } from '../lib/PaperlessClient';
import { TaxonomyExpert } from '../lib/TaxonomyExpert';

// Mock data
const mockDocuments = [
  {
    id: 1,
    title: 'Acme Corp Invoice 2024-001.pdf',
    original_file_name: 'Acme Corp Invoice 2024-001.pdf',
    content: 'Invoice from Acme Corp for services rendered',
    created: '2024-01-15',
    modified: '2024-01-15',
    owner: 1,
    tags: [123],
    document_type: 1,
    storage_path: 1,
  },
  {
    id: 2,
    title: 'Acme Corp Invoice 2024-002.pdf',
    original_file_name: 'Acme Corp Invoice 2024-002.pdf',
    content: 'Monthly invoice from Acme Corp',
    created: '2024-02-15',
    modified: '2024-02-15',
    owner: 1,
    tags: [123],
    document_type: 1,
    storage_path: 1,
  },
  {
    id: 3,
    title: 'Acme Corp Invoice 2024-003.pdf',
    original_file_name: 'Acme Corp Invoice 2024-003.pdf',
    content: 'Quarterly invoice Acme Corp',
    created: '2024-03-15',
    modified: '2024-03-15',
    owner: 1,
    tags: [123],
    document_type: 1,
    storage_path: 1,
  },
  {
    id: 4,
    title: 'Other Document.pdf',
    original_file_name: 'Other Document.pdf',
    content: 'Some other content',
    created: '2024-01-20',
    modified: '2024-01-20',
    owner: 1,
    tags: [789],
    document_type: 2,
    storage_path: 2,
  },
];

const mockTags: Tag[] = [
  { id: 123, name: 'acme-corp', slug: 'acme-corp', color: '#FF0000', matching_algorithm: 4, is_insensitive: false },
  { id: 456, name: 'smith-trust', slug: 'smith-trust', color: '#00FF00', matching_algorithm: 4, is_insensitive: false },
  { id: 789, name: 'other-entity', slug: 'other-entity', color: '#0000FF', matching_algorithm: 4, is_insensitive: false },
];

const mockDocumentTypes: DocumentType[] = [
  { id: 1, name: 'Invoice', slug: 'invoice', matching_algorithm: 4, is_insensitive: false },
  { id: 2, name: 'Trust Deed', slug: 'trust-deed', matching_algorithm: 4, is_insensitive: false },
];

const mockCorrespondents: Correspondent[] = [
  { id: 1, name: 'Acme Corporation', slug: 'acme-corporation', matching_algorithm: 4, is_insensitive: false, document_count: 10 },
];

const mockStoragePaths: StoragePath[] = [
  { id: 1, name: 'Acme Corp', path: '/Corporate/Acme Corp', parent: null, document_count: 10 },
  { id: 2, name: 'Smith Trust', path: '/Trusts/Family/Smith', parent: null, document_count: 5 },
];

const mockSearchResults: SearchResult = {
  count: 50,
  next: null,
  previous: null,
  results: mockDocuments,
};

describe('WorkflowExpert', () => {
  let expert: WorkflowExpert;
  let mockPaperlessClient: PaperlessClient;
  let mockTaxonomyExpert: TaxonomyExpert;

  beforeEach(() => {
    // Mock PaperlessClient with all required methods
    mockPaperlessClient = {
      getTags: async () => mockTags,
      getDocumentTypes: async () => mockDocumentTypes,
      getStoragePaths: async () => mockStoragePaths,
      getCorrespondents: async () => mockCorrespondents,
      searchDocuments: async (params: any = {}) => {
        // Simulate search with pattern matching
        const query = (params.query || '').toLowerCase();
        if (query.includes('acme') || query.includes('invoice') || query.includes('2024')) {
          return mockSearchResults;
        }
        return { count: 0, next: null, previous: null, results: [] };
      },
      getDocumentsByTags: async (tagIds: number[]) => {
        return mockDocuments.filter(doc => doc.tags.some(tagId => tagIds.includes(tagId)));
      },
      request: async (endpoint: string, options?: any) => {
        // Mock workflow API calls
        if (endpoint === '/workflows/' && options?.method === 'POST') {
          const body = JSON.parse(options.body || '{}');
          return {
            id: 999,
            name: body.name,
            description: body.description,
            workflow_type: 'consumption',
            workflow_data: body.workflow_data,
            order: body.order || 0,
            automatic: body.automatic,
            matching_algorithm: body.matching_algorithm,
            match: body.match,
          };
        }
        if (endpoint.startsWith('/workflows/') && endpoint !== '/workflows/' && !options?.method) {
          // Get workflow by ID (GET request)
          return {
            id: parseInt(endpoint.split('/').pop() || '999'),
            name: 'Test Workflow',
            description: 'Test description',
            workflow_type: 'consumption',
            workflow_data: {
              assign_tag: 123,
            },
            order: 1,
            automatic: true,
            matching_algorithm: 5,
            match: 'test.*pattern',
          };
        }
        if (endpoint === '/workflows/' && !options?.method) {
          // List workflows (GET request)
          return {
            results: [
              {
                id: 1,
                name: 'Existing Workflow',
                description: 'Existing workflow description',
                workflow_type: 'consumption',
                workflow_data: {
                  assign_tag: 456,
                },
                order: 1,
                automatic: true,
                matching_algorithm: 1,
                match: '',
              },
            ],
          };
        }
        return {};
      },
      getOrCreateTag: async (tagName: string) => {
        const existing = mockTags.find(tag => tag.name === tagName);
        return existing || { id: Date.now(), name: tagName, slug: tagName.toLowerCase(), color: '#CCCCCC', matching_algorithm: 4, is_insensitive: false };
      },
      getOrCreateDocumentType: async (typeName: string) => {
        const existing = mockDocumentTypes.find(type => type.name === typeName);
        return existing || { id: Date.now(), name: typeName, slug: typeName.toLowerCase(), matching_algorithm: 4, is_insensitive: false };
      },
      getOrCreateStoragePath: async (pathName: string) => {
        const existing = mockStoragePaths.find(path => path.name === pathName);
        return existing || { id: Date.now(), name: pathName, path: `/${pathName}`, parent: null, document_count: 0 };
      },
      getOrCreateCorrespondent: async (correspondentName: string) => {
        const existing = mockCorrespondents.find(corr => corr.name === correspondentName);
        return existing || { id: Date.now(), name: correspondentName, slug: correspondentName.toLowerCase(), matching_algorithm: 4, is_insensitive: false, document_count: 0 };
      },
    } as unknown as PaperlessClient;

    // Mock TaxonomyExpert
    mockTaxonomyExpert = {
      suggestMetadata: (fileName: string) => {
        if (fileName.toLowerCase().includes('invoice')) {
          return {
            tags: ['invoice'],
            documentType: 'Invoice',
          };
        }
        if (fileName.toLowerCase().includes('deed')) {
          return {
            tags: ['deed'],
            documentType: 'Trust Deed',
          };
        }
        return {
          tags: [],
          documentType: undefined,
        };
      },
    } as unknown as TaxonomyExpert;

    // Create expert instance
    expert = new WorkflowExpert(mockPaperlessClient, mockTaxonomyExpert);
  });

  describe('listWorkflows', () => {
    it('should list all workflows', async () => {
      const response = await expert.listWorkflows();

      // The method should return an array directly
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBeGreaterThan(0);
      expect(response[0]).toHaveProperty('id');
      expect(response[0]).toHaveProperty('name');
      expect(response[0]).toHaveProperty('description');
      expect(response[0]).toHaveProperty('workflow_type');
      expect(response[0].workflow_type).toBe('consumption');
    });

    it('should handle empty workflow list', async () => {
      const mockClientWithEmptyWorkflows = {
        ...mockPaperlessClient,
        request: async (endpoint: string, options?: any) => {
          if (endpoint === '/workflows/' && !options?.method) {
            return { results: [] };
          }
          return {};
        },
      };

      const expertWithEmptyWorkflows = new WorkflowExpert(mockClientWithEmptyWorkflows, mockTaxonomyExpert);
      const response = await expertWithEmptyWorkflows.listWorkflows();

      // The method should return an array directly
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(0);
    });
  });

  describe('getWorkflow', () => {
    it('should get workflow by ID', async () => {
      const workflow = await expert.getWorkflow(999);

      expect(workflow).toHaveProperty('id', 999);
      expect(workflow).toHaveProperty('name');
      expect(workflow).toHaveProperty('description');
      expect(workflow.workflow_type).toBe('consumption');
    });
  });

  describe('recommendWorkflow', () => {
    it('should analyze patterns and recommend workflow', async () => {
      const sampleDocs = mockDocuments.slice(0, 3); // First 3 invoices

      const recommendation = await expert.recommendWorkflow(123, sampleDocs);

      expect(recommendation.name).toContain('Auto Tag');
      expect(recommendation.name).toContain('acme-corp');
      expect(recommendation.assignTag).toBe('acme-corp');
      expect(['high', 'medium', 'low']).toContain(recommendation.confidence);
      expect(recommendation.reasoning.length).toBeGreaterThan(0);
      expect(recommendation.estimatedAffectedDocuments).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(recommendation.sampleMatches)).toBe(true);
    });

    it('should detect low confidence with small sample size', async () => {
      const sampleDocs = [mockDocuments[0]]; // Single document

      const recommendation = await expert.recommendWorkflow(123, sampleDocs);

      expect(recommendation.confidence).toBe('low');
    });

    it('should detect low confidence with empty sample', async () => {
      const recommendation = await expert.recommendWorkflow(123, []);

      expect(recommendation.confidence).toBe('low');
      expect(recommendation.estimatedAffectedDocuments).toBe(0);
    });

    it('should suggest regex match pattern for filenames', async () => {
      const docs = [
        { ...mockDocuments[0], original_file_name: 'Smith Family Trust Deed.pdf' },
        { ...mockDocuments[0], original_file_name: 'Smith Family Trust FTE.pdf' },
        { ...mockDocuments[0], original_file_name: 'Smith Trust Resolution.pdf' },
      ];

      const recommendation = await expert.recommendWorkflow(456, docs);

      expect(recommendation.matchPattern).toBeDefined();
      expect(recommendation.matchPattern).toMatch(/smith/i);
      expect([1, 5]).toContain(recommendation.matchingAlgorithm); // Auto or Regex
    });

    it('should handle entity tag not found', async () => {
      await expect(expert.recommendWorkflow(99999, [mockDocuments[0]])).rejects.toThrow(
        'Tag with ID 99999 not found'
      );
    });

    it('should suggest storage path based on entity name', async () => {
      const sampleDocs = [mockDocuments[0]];

      const recommendation = await expert.recommendWorkflow(123, sampleDocs);

      expect(recommendation.assignStoragePath).toBeDefined();
      expect(recommendation.reasoning.some(r => r.includes('Storage path'))).toBe(true);
    });

    it('should estimate affected documents correctly', async () => {
      const sampleDocs = [mockDocuments[0]];

      const recommendation = await expert.recommendWorkflow(123, sampleDocs);

      // Should return a reasonable number
      expect(recommendation.estimatedAffectedDocuments).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createWorkflow', () => {
    it('should create workflow in paperless-ngx', async () => {
      const recommendation: WorkflowRecommendation = {
        name: 'Acme Corp Invoices',
        description: 'Auto-tag Acme invoices',
        assignTag: 'acme-corp',
        assignDocumentType: 'Invoice',
        assignCorrespondent: 'Acme Corporation',
        assignStoragePath: '/Corporate/Acme Corp',
        matchPattern: 'Acme.*Invoice',
        matchingAlgorithm: 5,
        confidence: 'high' as const,
        reasoning: ['Pattern found in 50 documents'],
        estimatedAffectedDocuments: 50,
        sampleMatches: [],
      };

      const workflow = await expert.createWorkflow(recommendation);

      expect(workflow).toHaveProperty('id');
      expect(workflow.id).toBe(999); // Mock response ID
      expect(workflow.name).toBe('Acme Corp Invoices');
      expect(workflow.description).toBe('Auto-tag Acme invoices');
      expect(workflow.workflow_type).toBe('consumption');
      expect(workflow.workflow_data.assign_tag).toBeDefined();
      expect(workflow.automatic).toBe(true);
      expect(workflow.matching_algorithm).toBe(5);
      expect(workflow.match).toBe('Acme.*Invoice');
    });

    it('should create workflow without optional fields', async () => {
      const recommendation: WorkflowRecommendation = {
        name: 'Simple Tag Workflow',
        description: 'Simple auto-tag workflow',
        assignTag: 'simple-tag',
        matchingAlgorithm: 1,
        confidence: 'medium' as const,
        reasoning: ['Simple workflow'],
        estimatedAffectedDocuments: 10,
        sampleMatches: [],
      };

      const workflow = await expert.createWorkflow(recommendation);

      expect(workflow).toHaveProperty('id');
      expect(workflow.name).toBe('Simple Tag Workflow');
      expect(workflow.workflow_data.assign_tag).toBeDefined();
      expect(workflow.workflow_data.assign_document_type).toBeUndefined();
      expect(workflow.workflow_data.assign_correspondent).toBeUndefined();
      expect(workflow.workflow_data.assign_storage_path).toBeUndefined();
    });
  });

  describe('reviewWorkflow', () => {
    it('should analyze workflow effectiveness', async () => {
      const review = await expert.reviewWorkflow(999);

      expect(review).toHaveProperty('workflowId', 999);
      expect(review).toHaveProperty('workflowName');
      expect(review).toHaveProperty('totalDocuments');
      expect(review).toHaveProperty('matchedDocuments');
      expect(review.matchRate).toBeGreaterThanOrEqual(0);
      expect(review.matchRate).toBeLessThanOrEqual(100);
      expect(review).toHaveProperty('correctlyTagged');
      expect(review).toHaveProperty('incorrectlyTagged');
      expect(review).toHaveProperty('accuracy');
      expect(Array.isArray(review.suggestions)).toBe(true);
      expect(Array.isArray(review.sampleMatches)).toBe(true);
      expect(Array.isArray(review.sampleMisses)).toBe(true);
    });

    it('should provide suggestions for improvement', async () => {
      const review = await expert.reviewWorkflow(999);

      expect(review.suggestions).toBeDefined();
      expect(Array.isArray(review.suggestions)).toBe(true);
      expect(review.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle workflow with no matches', async () => {
      const mockClient = {
        ...mockPaperlessClient,
        getWorkflow: async (id: number) => ({
          id,
          name: 'Test Workflow',
          description: 'Test description',
          workflow_type: 'consumption' as const,
          workflow_data: { assign_tag: 999 }, // Non-matching tag
          order: 1,
          automatic: true,
          matching_algorithm: 1,
          match: '',
        }),
        getTags: async () => mockTags,
        getDocumentsByTags: async (tagIds: number[]) => [],
      };

      const expertWithNoMatches = new WorkflowExpert(mockClient, mockTaxonomyExpert);
      const review = await expertWithNoMatches.reviewWorkflow(999);

      expect(review.matchedDocuments).toBe(0);
      expect(review.matchRate).toBe(0);
      expect(review.correctlyTagged).toBe(0);
      expect(review.incorrectlyTagged).toBe(0);
      expect(review.accuracy).toBe(0);

      // Should include specific suggestion for no matches
      expect(review.suggestions.some(s => s.includes('Workflow has not matched any documents yet'))).toBe(true);
    });
  });

  describe('explainWorkflow', () => {
    it('should explain workflow in plain language', () => {
      const workflow: Workflow = {
        id: 999,
        name: 'Auto-tag Acme Invoices',
        description: 'Auto-tag Acme invoices',
        workflow_type: 'consumption',
        workflow_data: {
          assign_tag: 123,
          assign_document_type: 1,
          assign_correspondent: 1,
          assign_storage_path: 1,
        },
        order: 1,
        automatic: true,
        matching_algorithm: 5,
        match: 'Acme.*Invoice',
      };

      const explanation = expert.explainWorkflow(workflow);

      expect(explanation).toContain('Workflow: Auto-tag Acme Invoices');
      expect(explanation).toContain('**Description**: Auto-tag Acme invoices');
      expect(explanation).toContain('Regular Expression');
      expect(explanation).toContain('Acme.*Invoice');
      expect(explanation).toContain('consumption');
      expect(explanation).toContain('automatic');
      expect(explanation).toContain('- **Tag**: ID 123 (automatically applied)');
    });

    it('should explain workflow without optional assignments', () => {
      const workflow: Workflow = {
        id: 999,
        name: 'Simple Workflow',
        description: 'Simple workflow',
        workflow_type: 'consumption',
        workflow_data: {
          assign_tag: 123,
        },
        order: 2,
        automatic: true,
        matching_algorithm: 1,
        match: '',
      };

      const explanation = expert.explainWorkflow(workflow);

      expect(explanation).toContain('Workflow: Simple Workflow');
      expect(explanation).toContain('- **Tag**: ID 123 (automatically applied)');
      expect(explanation).not.toContain('Document Type');
      expect(explanation).not.toContain('Correspondent');
      expect(explanation).not.toContain('Storage Path');
    });

    it('should explain workflow with permissions', () => {
      const workflow: Workflow = {
        id: 999,
        name: 'Restricted Workflow',
        description: 'Workflow with permissions',
        workflow_type: 'consumption',
        workflow_data: {
          assign_tag: 123,
          permissions: {
            view: [1, 2, 3],
            change: [1],
          },
        },
        order: 3,
        automatic: true,
        matching_algorithm: 4,
        match: 'test',
      };

      const explanation = expert.explainWorkflow(workflow);

      expect(explanation).toContain('Permissions');
      expect(explanation).toContain('- **View Users**: 1, 2, 3');
      expect(explanation).toContain('- **Change Users**: 1');
    });
  });

  describe('matching algorithms', () => {
    it('should explain None matching algorithm', () => {
      const workflow: Workflow = {
        id: 999,
        name: 'No Match Workflow',
        description: 'Workflow with no matching',
        workflow_type: 'consumption',
        workflow_data: {
          assign_tag: 123,
        },
        order: 1,
        automatic: false,
        matching_algorithm: 0, // None
        match: '',
      };

      const explanation = expert.explainWorkflow(workflow);

      expect(explanation).toContain('None');
      expect(explanation).toContain('No - manual application only');
    });

    it('should explain Auto matching algorithm', () => {
      const workflow: Workflow = {
        id: 999,
        name: 'Auto Match Workflow',
        description: 'Automatic matching workflow',
        workflow_type: 'consumption',
        workflow_data: {
          assign_tag: 123,
        },
        order: 1,
        automatic: true,
        matching_algorithm: 1, // Auto
        match: '',
      };

      const explanation = expert.explainWorkflow(workflow);

      expect(explanation).toContain('Auto (automatic matching)');
    });
  });

  describe('edge cases', () => {
    it('should handle single document recommendation', async () => {
      const singleDoc = [mockDocuments[0]];

      const recommendation = await expert.recommendWorkflow(123, singleDoc);

      expect(recommendation.confidence).toBe('low');
    });

    it('should handle documents with no content', async () => {
      const docsNoContent = [
        { ...mockDocuments[0], content: undefined },
        { ...mockDocuments[1], content: undefined },
        { ...mockDocuments[2], content: undefined },
      ];

      const recommendation = await expert.recommendWorkflow(123, docsNoContent);

      expect(recommendation).toBeDefined();
    });

    it('should handle documents with empty content', async () => {
      const docsEmptyContent = [
        { ...mockDocuments[0], content: '' },
        { ...mockDocuments[1], content: '' },
        { ...mockDocuments[2], content: '' },
      ];

      const recommendation = await expert.recommendWorkflow(123, docsEmptyContent);

      expect(recommendation).toBeDefined();
    });

    it('should handle documents with special characters in filenames', async () => {
      const specialCharsDoc = [
        {
          ...mockDocuments[0],
          original_file_name: 'Acme Corp (Invoice) - 2024/Q1 #001.pdf',
        },
      ];

      const recommendation = await expert.recommendWorkflow(123, specialCharsDoc);

      expect(recommendation).toBeDefined();
    });
  });

  describe('pattern analysis edge cases', () => {
    it('should handle documents with various filename patterns', async () => {
      const docs = [
        { ...mockDocuments[0], original_file_name: 'Acme Invoice 001.pdf' },
        { ...mockDocuments[1], original_file_name: 'Acme Invoice 002.pdf' },
        { ...mockDocuments[2], original_file_name: 'Acme Invoice 003.pdf' },
      ];

      const recommendation = await expert.recommendWorkflow(123, docs);

      expect(recommendation.matchPattern).toBeDefined();
      expect(recommendation.confidence).toBe('medium');
    });

    it('should handle documents with date patterns', async () => {
      const dateDocs = [
        { ...mockDocuments[0], original_file_name: 'Acme Corp 2024-01-15.pdf' },
        { ...mockDocuments[1], original_file_name: 'Acme Corp 2024-02-15.pdf' },
        { ...mockDocuments[2], original_file_name: 'Acme Corp 2024-03-15.pdf' },
      ];

      const recommendation = await expert.recommendWorkflow(123, dateDocs);

      expect(recommendation.matchPattern).toBeDefined();
      expect(recommendation.confidence).toBe('medium');
    });

    it('should handle invalid document data', async () => {
      const invalidDocs = [
        { ...mockDocuments[0], original_file_name: '' }, // Empty filename
        { ...mockDocuments[1], original_file_name: '   ' }, // Whitespace filename
        { ...mockDocuments[2], original_file_name: '.' }, // Single character
      ];

      const recommendation = await expert.recommendWorkflow(123, invalidDocs);

      expect(recommendation).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const errorClient = {
        ...mockPaperlessClient,
        getTags: async () => { throw new Error('API Error'); },
      };

      const errorExpert = new WorkflowExpert(errorClient, mockTaxonomyExpert);

      await expect(errorExpert.recommendWorkflow(123, [mockDocuments[0]])).rejects.toThrow('API Error');
    });

    it('should handle malformed workflow data', async () => {
      const mockClient = {
        ...mockPaperlessClient,
        getWorkflow: async (id: number) => ({
          id,
          name: 'Test Workflow',
          description: 'Test description',
          workflow_type: 'consumption' as const,
          workflow_data: { assign_tag: 123 }, // Tag that exists in main mock but not in filtered one
          order: 1,
          automatic: true,
          matching_algorithm: 1,
          match: '',
        }),
        getTags: async () => [], // Return empty array to simulate tag not found
      };

      const expertWithMissingTag = new WorkflowExpert(mockClient, mockTaxonomyExpert);
      await expect(expertWithMissingTag.reviewWorkflow(999)).rejects.toThrow(
        'Tag with ID 123 not found'
      );
    });
  });
});