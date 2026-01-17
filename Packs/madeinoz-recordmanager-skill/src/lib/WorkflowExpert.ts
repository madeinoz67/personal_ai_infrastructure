// $PAI_DIR/lib/recordsmanager/WorkflowExpert.ts
/**
 * Workflow Expert - Paperless-ngx workflow management
 * Analyzes document patterns and creates automated workflows for document processing
 */

import { PaperlessClient, Document, Tag, DocumentType, Correspondent, StoragePath } from './PaperlessClient';
import { TaxonomyExpert } from './TaxonomyExpert';

/**
 * Paperless-ngx Workflow structure
 */
export interface Workflow {
  id: number;
  name: string;
  description: string;
  workflow_type: 'consumption';
  workflow_data: {
    assign_tag: number;
    assign_document_type?: number;
    assign_storage_path?: number;
    assign_correspondent?: number;
    permissions?: {
      view?: number[];
      change?: number[];
    };
  };
  order: number;
  automatic: boolean;
  match?: string;
  matching_algorithm: number;
}

/**
 * Workflow recommendation based on document analysis
 */
export interface WorkflowRecommendation {
  name: string;
  description: string;

  // What to assign
  assignTag: string;
  assignDocumentType?: string;
  assignStoragePath?: string;
  assignCorrespondent?: string;

  // Pattern to match
  matchPattern?: string;
  matchingAlgorithm: number;

  // Confidence in recommendation
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];

  // Preview of what this would affect
  estimatedAffectedDocuments: number;
  sampleMatches: Document[];
}

/**
 * Workflow review with effectiveness metrics
 */
export interface WorkflowReview {
  workflowId: number;
  workflowName: string;

  // Effectiveness metrics
  totalDocuments: number;
  matchedDocuments: number;
  matchRate: number;

  // Quality metrics
  correctlyTagged: number;
  incorrectlyTagged: number;
  accuracy: number;

  // Suggestions
  suggestions: string[];

  // Sample matches
  sampleMatches: Document[];
  sampleMisses: Document[];
}

/**
 * Pattern analysis result
 */
interface PatternAnalysis {
  commonPatterns: string[];
  tagFrequencies: Map<string, number>;
  typeFrequencies: Map<string, number>;
  correspondentFrequencies: Map<string, number>;
  filenamePatterns: string[];
  contentKeywords: string[];
}

/**
 * Matching algorithms from paperless-ngx
 */
enum MatchingAlgorithm {
  None = 0,
  Auto = 1,
  All = 2,
  Any = 3,
  Exact = 4,
  Regex = 5,
  Fuzzy = 6,
}

/**
 * Workflow Expert Class
 */
export class WorkflowExpert {
  private paperless: PaperlessClient;
  private taxonomy: TaxonomyExpert;

  constructor(paperlessClient: PaperlessClient, taxonomyExpert: TaxonomyExpert) {
    this.paperless = paperlessClient;
    this.taxonomy = taxonomyExpert;
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<Workflow[]> {
    const response = await this.paperless['request']<{ results: Workflow[] }>('/workflows/');
    return response.results;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflow(id: number): Promise<Workflow> {
    return this.paperless['request']<Workflow>(`/workflows/${id}/`);
  }

  /**
   * Analyze existing documents and recommend workflow
   */
  async recommendWorkflow(
    entityTagId: number,
    sampleDocuments: Document[]
  ): Promise<WorkflowRecommendation> {
    // Get the entity tag to determine entity name
    const tags = await this.paperless.getTags();
    const entityTag = tags.find(t => t.id === entityTagId);

    if (!entityTag) {
      throw new Error(`Tag with ID ${entityTagId} not found`);
    }

    // Analyze patterns in sample documents
    const analysis = this.analyzePatterns(sampleDocuments);

    // Build recommendation
    const recommendation: WorkflowRecommendation = {
      name: this.generateWorkflowName(entityTag.name, analysis),
      description: this.generateWorkflowDescription(entityTag.name, analysis),
      assignTag: entityTag.name,
      matchingAlgorithm: this.selectMatchingAlgorithm(analysis),
      confidence: this.calculateConfidence(analysis, sampleDocuments.length),
      reasoning: [],
      estimatedAffectedDocuments: await this.estimateAffectedDocuments(analysis),
      sampleMatches: this.selectSampleMatches(sampleDocuments, 5),
    };

    // Suggest document type
    if (analysis.typeFrequencies.size > 0) {
      const mostCommonType = this.getMostFrequent(analysis.typeFrequencies);
      recommendation.assignDocumentType = mostCommonType;
      recommendation.reasoning.push(
        `Document type '${mostCommonType}' appears in ${analysis.typeFrequencies.get(mostCommonType)} of ${sampleDocuments.length} samples`
      );
    }

    // Suggest correspondent if applicable
    if (analysis.correspondentFrequencies.size > 0) {
      const mostCommonCorrespondent = this.getMostFrequent(analysis.correspondentFrequencies);
      recommendation.assignCorrespondent = mostCommonCorrespondent;
      recommendation.reasoning.push(
        `Correspondent '${mostCommonCorrespondent}' appears in ${analysis.correspondentFrequencies.get(mostCommonCorrespondent)} of ${sampleDocuments.length} samples`
      );
    }

    // Suggest storage path
    recommendation.assignStoragePath = this.suggestStoragePath(entityTag.name);
    recommendation.reasoning.push(
      `Storage path suggested based on entity: ${recommendation.assignStoragePath}`
    );

    // Generate match pattern
    recommendation.matchPattern = this.generateMatchPattern(analysis);
    if (recommendation.matchPattern) {
      recommendation.reasoning.push(
        `Match pattern based on filename analysis: ${recommendation.matchPattern}`
      );
    }

    return recommendation;
  }

  /**
   * Create workflow from recommendation
   */
  async createWorkflow(recommendation: WorkflowRecommendation): Promise<Workflow> {
    // Get or create the tag
    const tag = await this.paperless.getOrCreateTag(recommendation.assignTag);

    // Build workflow data
    const workflowData: {
      assign_tag: number;
      assign_document_type?: number;
      assign_storage_path?: number;
      assign_correspondent?: number;
    } = {
      assign_tag: tag.id,
    };

    // Get or create document type
    if (recommendation.assignDocumentType) {
      const docType = await this.paperless.getOrCreateDocumentType(recommendation.assignDocumentType);
      workflowData.assign_document_type = docType.id;
    }

    // Get or create storage path
    if (recommendation.assignStoragePath) {
      const storagePath = await this.paperless.getOrCreateStoragePath(recommendation.assignStoragePath);
      workflowData.assign_storage_path = storagePath.id;
    }

    // Get or create correspondent
    if (recommendation.assignCorrespondent) {
      const correspondent = await this.paperless.getOrCreateCorrespondent(recommendation.assignCorrespondent);
      workflowData.assign_correspondent = correspondent.id;
    }

    // Create workflow
    const workflow = await this.paperless['request']<Workflow>('/workflows/', {
      method: 'POST',
      body: JSON.stringify({
        name: recommendation.name,
        description: recommendation.description,
        workflow_type: 'consumption',
        workflow_data: workflowData,
        order: 0,
        automatic: true,
        matching_algorithm: recommendation.matchingAlgorithm,
        match: recommendation.matchPattern || '',
      }),
    });

    return workflow;
  }

  /**
   * Review workflow effectiveness
   */
  async reviewWorkflow(workflowId: number): Promise<WorkflowReview> {
    const workflow = await this.getWorkflow(workflowId);

    // Get tag from workflow data
    const tagId = workflow.workflow_data.assign_tag;
    const tags = await this.paperless.getTags();
    const tag = tags.find(t => t.id === tagId);

    if (!tag) {
      throw new Error(`Tag with ID ${tagId} not found`);
    }

    // Get documents with this tag
    const documents = await this.paperless.getDocumentsByTags([tagId]);

    // Analyze effectiveness
    const matchedDocuments = documents;
    const totalDocuments = await this.estimateTotalDocuments();

    // Simple accuracy check: if document has the expected tag
    const correctlyTagged = matchedDocuments.filter(doc => doc.tags.includes(tagId)).length;
    const incorrectlyTagged = matchedDocuments.length - correctlyTagged;

    const review: WorkflowReview = {
      workflowId: workflow.id,
      workflowName: workflow.name,
      totalDocuments,
      matchedDocuments: matchedDocuments.length,
      matchRate: totalDocuments > 0 ? (matchedDocuments.length / totalDocuments) * 100 : 0,
      correctlyTagged,
      incorrectlyTagged,
      accuracy: matchedDocuments.length > 0 ? (correctlyTagged / matchedDocuments.length) * 100 : 0,
      suggestions: this.generateReviewSuggestions(workflow, matchedDocuments),
      sampleMatches: matchedDocuments.slice(0, 5),
      sampleMisses: [], // Would need more complex analysis to find misses
    };

    return review;
  }

  /**
   * Explain workflow architecture
   */
  explainWorkflow(workflow: Workflow): string {
    const parts: string[] = [];

    parts.push(`# Workflow: ${workflow.name}`);
    parts.push(``);
    parts.push(`**Description**: ${workflow.description}`);
    parts.push(``);

    // Explain matching
    const matchingAlgorithm = this.explainMatchingAlgorithm(workflow.matching_algorithm);
    parts.push(`## Matching`);
    parts.push(``);
    parts.push(`- **Algorithm**: ${matchingAlgorithm}`);
    parts.push(`- **Pattern**: ${workflow.match || 'None'}`);
    parts.push(``);

    // Explain assignments
    parts.push(`## Automatic Assignments`);
    parts.push(``);

    const data = workflow.workflow_data;

    if (data.assign_tag) {
      parts.push(`- **Tag**: ID ${data.assign_tag} (automatically applied)`);
    }

    if (data.assign_document_type) {
      parts.push(`- **Document Type**: ID ${data.assign_document_type}`);
    }

    if (data.assign_correspondent) {
      parts.push(`- **Correspondent**: ID ${data.assign_correspondent}`);
    }

    if (data.assign_storage_path) {
      parts.push(`- **Storage Path**: ID ${data.assign_storage_path}`);
    }

    parts.push(``);

    // Explain permissions
    if (data.permissions) {
      parts.push(`## Permissions`);
      parts.push(``);

      if (data.permissions.view && data.permissions.view.length > 0) {
        parts.push(`- **View Users**: ${data.permissions.view.join(', ')}`);
      }

      if (data.permissions.change && data.permissions.change.length > 0) {
        parts.push(`- **Change Users**: ${data.permissions.change.join(', ')}`);
      }

      parts.push(``);
    }

    // Explain execution order
    parts.push(`## Execution`);
    parts.push(``);
    parts.push(`- **Order**: ${workflow.order}`);
    parts.push(`- **Automatic**: ${workflow.automatic ? 'Yes - applies on document consumption' : 'No - manual application only'}`);
    parts.push(``);

    return parts.join('\n');
  }

  /**
   * Analyze patterns in documents
   */
  private analyzePatterns(documents: Document[]): PatternAnalysis {
    const tagFrequencies = new Map<string, number>();
    const typeFrequencies = new Map<string, number>();
    const correspondentFrequencies = new Map<string, number>();
    const filenamePatterns: string[] = [];
    const contentKeywords: string[] = [];
    const commonPatterns: string[] = [];

    // Analyze each document
    for (const doc of documents) {
      // Extract filename patterns
      const filename = doc.original_file_name.toLowerCase();
      const parts = filename.split(/[._-]/).filter(p => p.length > 2);
      filenamePatterns.push(...parts);

      // Extract content keywords (if content available)
      if (doc.content) {
        const words = doc.content
          .toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 3);
        contentKeywords.push(...words);
      }
    }

    // Count frequencies
    const countFrequencies = (items: string[]) => {
      const freq = new Map<string, number>();
      for (const item of items) {
        freq.set(item, (freq.get(item) || 0) + 1);
      }
      return freq;
    };

    return {
      commonPatterns,
      tagFrequencies,
      typeFrequencies,
      correspondentFrequencies,
      filenamePatterns: [...new Set(filenamePatterns)], // Unique patterns
      contentKeywords: [...new Set(contentKeywords)],
    };
  }

  /**
   * Generate workflow name from entity and analysis
   */
  private generateWorkflowName(entityName: string, analysis: PatternAnalysis): string {
    const cleanName = entityName.replace(/^entity:/, '');
    return `Auto Tag - ${cleanName}`;
  }

  /**
   * Generate workflow description
   */
  private generateWorkflowDescription(entityName: string, analysis: PatternAnalysis): string {
    const cleanName = entityName.replace(/^entity:/, '');
    return `Automatically tag and organize documents for ${cleanName}`;
  }

  /**
   * Select appropriate matching algorithm
   */
  private selectMatchingAlgorithm(analysis: PatternAnalysis): number {
    // If we have clear filename patterns, use regex
    if (analysis.filenamePatterns.length > 0) {
      return MatchingAlgorithm.Regex;
    }

    // Default to auto matching
    return MatchingAlgorithm.Auto;
  }

  /**
   * Generate match pattern from analysis
   */
  private generateMatchPattern(analysis: PatternAnalysis): string | undefined {
    if (analysis.filenamePatterns.length === 0) {
      return undefined;
    }

    // Get most common patterns
    const topPatterns = analysis.filenamePatterns.slice(0, 3);

    // Generate regex pattern (simple version)
    // Join patterns with OR, escape special characters
    const pattern = topPatterns
      .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|');

    return pattern;
  }

  /**
   * Calculate confidence in recommendation
   */
  private calculateConfidence(analysis: PatternAnalysis, sampleSize: number): 'high' | 'medium' | 'low' {
    if (sampleSize < 3) {
      return 'low';
    }

    if (sampleSize < 10) {
      return 'medium';
    }

    // High confidence if we have consistent patterns
    if (analysis.filenamePatterns.length > 0) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * Estimate number of affected documents
   */
  private async estimateAffectedDocuments(analysis: PatternAnalysis): Promise<number> {
    // Simple estimate: search for documents with common patterns
    if (analysis.filenamePatterns.length === 0) {
      return 0;
    }

    const pattern = analysis.filenamePatterns[0];
    const results = await this.paperless.searchDocuments({
      query: pattern,
      page_size: 1,
    });

    return results.count;
  }

  /**
   * Select sample matches for preview
   */
  private selectSampleMatches(documents: Document[], count: number): Document[] {
    return documents.slice(0, Math.min(count, documents.length));
  }

  /**
   * Suggest storage path for entity
   */
  private suggestStoragePath(entityName: string): string {
    const cleanName = entityName.replace(/^entity:/, '');

    // Convert kebab-case to Title Case
    const titleName = cleanName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return `/${titleName}`;
  }

  /**
   * Get most frequent item from map
   */
  private getMostFrequent<T>(map: Map<T, number>): T {
    let maxCount = 0;
    let mostFrequent: T | null = null;

    for (const [item, count] of map.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }

    return mostFrequent as T;
  }

  /**
   * Estimate total documents in system
   */
  private async estimateTotalDocuments(): Promise<number> {
    const result = await this.paperless.searchDocuments({ page_size: 1 });
    return result.count;
  }

  /**
   * Generate review suggestions
   */
  private generateReviewSuggestions(workflow: Workflow, documents: Document[]): string[] {
    const suggestions: string[] = [];

    if (documents.length === 0) {
      suggestions.push('Workflow has not matched any documents yet. Consider reviewing the match pattern.');
      return suggestions;
    }

    // Check if workflow has a match pattern
    if (!workflow.match || workflow.match === '') {
      suggestions.push('Consider adding a match pattern to target specific documents.');
    }

    // Check if workflow assigns document type
    if (!workflow.workflow_data.assign_document_type) {
      suggestions.push('Consider assigning a document type for better organization.');
    }

    // Check if workflow assigns storage path
    if (!workflow.workflow_data.assign_storage_path) {
      suggestions.push('Consider assigning a storage path for automatic filing.');
    }

    // Check match rate
    const totalDocs = documents.length;
    if (totalDocs < 10) {
      suggestions.push(`Workflow has only matched ${totalDocs} documents. Pattern may be too restrictive.`);
    }

    return suggestions;
  }

  /**
   * Explain matching algorithm
   */
  private explainMatchingAlgorithm(algorithm: number): string {
    const algorithms: Record<number, string> = {
      0: 'None',
      1: 'Auto (automatic matching)',
      2: 'All (match all criteria)',
      3: 'Any (match any criterion)',
      4: 'Exact (exact match)',
      5: 'Regular Expression',
      6: 'Fuzzy (approximate matching)',
    };

    return algorithms[algorithm] || `Unknown (${algorithm})`;
  }
}

/**
 * Create expert from existing clients
 */
export function createWorkflowExpert(
  paperlessClient: PaperlessClient,
  taxonomyExpert: TaxonomyExpert
): WorkflowExpert {
  return new WorkflowExpert(paperlessClient, taxonomyExpert);
}
