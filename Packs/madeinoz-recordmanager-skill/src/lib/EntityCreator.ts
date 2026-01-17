// $PAI_DIR/lib/recordsmanager/EntityCreator.ts
/**
 * Entity Creator - Dynamic entity creation for Records Manager
 * Creates new entities in paperless-ngx with proper tags, storage paths, and custom fields
 */

import { PaperlessClient, Tag, StoragePath, CustomField } from './PaperlessClient.js';
import { TaxonomyExpert, Domain } from './TaxonomyExpert.js';

/**
 * Entity configuration
 */
export interface EntityConfig {
  id: string;
  name: string;
  type: EntityType;
  entityTagId: number;
  storagePathId?: number;
  customFieldIds?: number[];
  created: string;
  trustConfig?: TrustConfig;
  corporateConfig?: CorporateConfig;
  projectConfig?: ProjectConfig;
  householdConfig?: HouseholdConfig;
}

/**
 * Entity types supported
 */
export type EntityType =
  | 'household'
  | 'corporate'
  | 'unit-trust'
  | 'discretionary-trust'
  | 'family-trust'
  | 'project';

/**
 * Trust-specific configuration
 */
export interface TrustConfig {
  trustName: string;
  trusteeName: string;
  abn: string;
  tfn?: string;
  trustDeedDate?: string;
  fteDate?: string; // Family Trust Election date (family trusts only)
  unitCount?: number; // Unit trusts only
  beneficiaries?: string; // Discretionary trusts - comma-separated list
}

/**
 * Corporate configuration
 */
export interface CorporateConfig {
  businessName: string;
  abn?: string;
  businessType: 'sole-trader' | 'company' | 'partnership';
}

/**
 * Project configuration
 */
export interface ProjectConfig {
  projectName: string;
  projectType: 'software' | 'construction' | 'research' | 'creative' | 'other';
  startDate?: string;
}

/**
 * Household configuration
 */
export interface HouseholdConfig {
  householdName: string;
  startYear?: string;
}

/**
 * Entity question for interactive creation
 */
export interface EntityQuestion {
  key: string;
  question: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  validation?: (value: string) => boolean | { valid: boolean; error: string };
}

/**
 * Entity registry structure
 */
interface EntityRegistry {
  entities: Record<string, EntityConfig>;
  version: string;
}

/**
 * Entity Creator Class
 */
export class EntityCreator {
  private paperlessClient: PaperlessClient;
  private taxonomyExpert: TaxonomyExpert;
  private registryPath: string;

  constructor(paperlessClient: PaperlessClient, taxonomyExpert: TaxonomyExpert) {
    this.paperlessClient = paperlessClient;
    this.taxonomyExpert = taxonomyExpert;
    // Use PAI_HOME for entity registry
    this.registryPath = process.env.PAI_HOME
      ? `${process.env.PAI_HOME}/skills/RECORDSMANAGER/Context/entities.json`
      : `${process.env.HOME}/.pai/skills/RECORDSMANAGER/Context/entities.json`;
  }

  /**
   * Interactive entity creation
   * This is a helper that returns the questions - actual prompting is done by the skill
   */
  async createEntityInteractive(
    entityType: EntityType,
    answers: Record<string, string>
  ): Promise<EntityConfig> {
    // Build config from answers
    const config = this.buildConfigFromAnswers(entityType, answers);

    // Validate config
    const validation = this.validateEntityConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid entity configuration:\n${validation.errors.join('\n')}`);
    }

    // Create the entity
    return await this.createEntity(config);
  }

  /**
   * Create entity with provided config
   */
  async createEntity(config: EntityConfig): Promise<EntityConfig> {
    // Validate config first
    const validation = this.validateEntityConfig(config);
    if (!validation.valid) {
      throw new Error(`Invalid entity configuration:\n${validation.errors.join('\n')}`);
    }

    try {
      // Step 1: Create entity tag
      const entityTag = await this.paperlessClient.getOrCreateTag(
        `entity:${config.id}`,
        this.getColorForEntityType(config.type)
      );
      config.entityTagId = entityTag.id;

      // Step 2: Create required tags for this entity type
      await this.createRequiredTags(config.type, config.id);

      // Step 3: Create storage path
      const storagePath = await this.createStoragePath(config);
      if (storagePath) {
        config.storagePathId = storagePath.id;
      }

      // Step 4: Create custom fields for trust entities
      if (this.isTrustType(config.type)) {
        const customFieldIds = await this.createCustomFields(config);
        config.customFieldIds = customFieldIds;
      }

      // Step 5: Register entity locally
      await this.registerEntity(config);

      return config;
    } catch (error) {
      // Cleanup on failure
      await this.cleanupFailedCreation(config);
      throw error;
    }
  }

  /**
   * Get questions for a specific entity type
   */
  getQuestionsForEntityType(entityType: EntityType): EntityQuestion[] {
    const questions: Record<EntityType, EntityQuestion[]> = {
      household: [
        {
          key: 'householdName',
          question: 'What is the household name? (e.g., "Smith Household")',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Household name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'startYear',
          question: 'What year did this household start? (for retention calculations)',
          type: 'text',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            const year = parseInt(value);
            if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
              return { valid: false, error: 'Please enter a valid year' };
            }
            return true;
          },
        },
      ],
      corporate: [
        {
          key: 'businessName',
          question: 'What is the business name?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Business name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'abn',
          question: 'What is the ABN? (optional)',
          type: 'text',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            if (!/^\d{11}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'ABN must be 11 digits' };
            }
            return true;
          },
        },
        {
          key: 'businessType',
          question: 'What type of business?',
          type: 'select',
          required: true,
          options: ['sole-trader', 'company', 'partnership'],
        },
      ],
      'unit-trust': [
        {
          key: 'trustName',
          question: 'What is the trust name? (e.g., "Smith Unit Trust")',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Trust name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'trusteeName',
          question: 'Who is the trustee?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Trustee name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'abn',
          question: 'What is the ABN?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!/^\d{11}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'ABN must be 11 digits' };
            }
            return true;
          },
        },
        {
          key: 'tfn',
          question: 'What is the TFN? (optional)',
          type: 'text',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            if (!/^\d{8,9}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'TFN must be 8 or 9 digits' };
            }
            return true;
          },
        },
        {
          key: 'unitCount',
          question: 'How many units? (optional)',
          type: 'number',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            const count = parseInt(value);
            if (isNaN(count) || count < 1) {
              return { valid: false, error: 'Unit count must be a positive number' };
            }
            return true;
          },
        },
      ],
      'discretionary-trust': [
        {
          key: 'trustName',
          question: 'What is the trust name?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Trust name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'trusteeName',
          question: 'Who is the trustee?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Trustee name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'abn',
          question: 'What is the ABN?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!/^\d{11}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'ABN must be 11 digits' };
            }
            return true;
          },
        },
        {
          key: 'tfn',
          question: 'What is the TFN? (optional)',
          type: 'text',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            if (!/^\d{8,9}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'TFN must be 8 or 9 digits' };
            }
            return true;
          },
        },
        {
          key: 'beneficiaries',
          question: 'Who are the beneficiaries? (optional, comma-separated)',
          type: 'text',
          required: false,
        },
      ],
      'family-trust': [
        {
          key: 'trustName',
          question: 'What is the trust name?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Trust name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'trusteeName',
          question: 'Who is the trustee?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Trustee name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'abn',
          question: 'What is the ABN?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!/^\d{11}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'ABN must be 11 digits' };
            }
            return true;
          },
        },
        {
          key: 'tfn',
          question: 'What is the TFN? (optional)',
          type: 'text',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            if (!/^\d{8,9}$/.test(value.replace(/\s/g, ''))) {
              return { valid: false, error: 'TFN must be 8 or 9 digits' };
            }
            return true;
          },
        },
        {
          key: 'fteDate',
          question: 'What is the Family Trust Election (FTE) date? (CRITICAL for retention)',
          type: 'date',
          required: true,
          validation: (value: string) => {
            if (!value) {
              return { valid: false, error: 'FTE date is required for family trusts' };
            }
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              return { valid: false, error: 'Invalid date format' };
            }
            return true;
          },
        },
      ],
      project: [
        {
          key: 'projectName',
          question: 'What is the project name?',
          type: 'text',
          required: true,
          validation: (value: string) => {
            if (!value || value.trim().length < 2) {
              return { valid: false, error: 'Project name must be at least 2 characters' };
            }
            return true;
          },
        },
        {
          key: 'projectType',
          question: 'What type of project?',
          type: 'select',
          required: true,
          options: ['software', 'construction', 'research', 'creative', 'other'],
        },
        {
          key: 'startDate',
          question: 'When did/will the project start? (optional)',
          type: 'date',
          required: false,
          validation: (value: string) => {
            if (!value) return true;
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              return { valid: false, error: 'Invalid date format' };
            }
            return true;
          },
        },
      ],
    };

    return questions[entityType];
  }

  /**
   * Validate entity config before creation
   */
  validateEntityConfig(config: EntityConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!config.id || config.id.trim().length === 0) {
      errors.push('Entity ID is required');
    }

    if (!config.name || config.name.trim().length === 0) {
      errors.push('Entity name is required');
    }

    if (!config.type) {
      errors.push('Entity type is required');
    }

    // Trust-specific validation
    if (this.isTrustType(config.type)) {
      if (!config.trustConfig) {
        errors.push(`${config.type} requires trust configuration`);
      } else {
        if (!config.trustConfig.trustName) {
          errors.push('Trust name is required');
        }
        if (!config.trustConfig.trusteeName) {
          errors.push('Trustee name is required');
        }
        if (!config.trustConfig.abn) {
          errors.push('ABN is required');
        } else if (!/^\d{11}$/.test(config.trustConfig.abn.replace(/\s/g, ''))) {
          errors.push('ABN must be 11 digits');
        }

        // Family trust requires FTE date
        if (config.type === 'family-trust' && !config.trustConfig.fteDate) {
          errors.push('Family Trust Election (FTE) date is required');
        }

        // TFN validation for trusts
        if (config.trustConfig.tfn && !/^\d{8,9}$/.test(config.trustConfig.tfn.replace(/\s/g, ''))) {
          errors.push('TFN must be 8 or 9 digits');
        }
      }
    }

    // Corporate validation
    if (config.type === 'corporate') {
      if (!config.corporateConfig) {
        errors.push('Corporate configuration is required');
      } else {
        if (!config.corporateConfig.businessName) {
          errors.push('Business name is required');
        }
        if (config.corporateConfig.abn && !/^\d{11}$/.test(config.corporateConfig.abn.replace(/\s/g, ''))) {
          errors.push('ABN must be 11 digits');
        }
      }
    }

    // Project validation
    if (config.type === 'project') {
      if (!config.projectConfig) {
        errors.push('Project configuration is required');
      } else {
        if (!config.projectConfig.projectName) {
          errors.push('Project name is required');
        }
      }
    }

    // Household validation
    if (config.type === 'household') {
      if (!config.householdConfig) {
        errors.push('Household configuration is required');
      } else {
        if (!config.householdConfig.householdName) {
          errors.push('Household name is required');
        }
      }
    }

    // Check for duplicate entity names
    const existingEntities = this.loadEntityRegistry();
    const duplicate = Object.values(existingEntities.entities).find(
      e => e.name.toLowerCase() === config.name.toLowerCase() && e.id !== config.id
    );
    if (duplicate) {
      errors.push(`An entity with name "${config.name}" already exists (ID: ${duplicate.id})`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build entity config from user answers
   */
  private buildConfigFromAnswers(
    entityType: EntityType,
    answers: Record<string, string>
  ): EntityConfig {
    // Generate entity ID from name
    const name = answers.name || answers.businessName || answers.trustName || answers.projectName || answers.householdName || 'unnamed';
    const id = this.generateEntityId(entityType, name);

    const config: EntityConfig = {
      id,
      name,
      type: entityType,
      entityTagId: 0, // Will be set during creation
      created: new Date().toISOString(),
    };

    // Add type-specific config
    switch (entityType) {
      case 'household':
        config.householdConfig = {
          householdName: name,
          startYear: answers.startYear,
        };
        break;

      case 'corporate':
        config.corporateConfig = {
          businessName: name,
          abn: answers.abn,
          businessType: answers.businessType as any,
        };
        break;

      case 'unit-trust':
      case 'discretionary-trust':
      case 'family-trust':
        config.trustConfig = {
          trustName: name,
          trusteeName: answers.trusteeName,
          abn: answers.abn,
          tfn: answers.tfn,
          fteDate: answers.fteDate,
          unitCount: answers.unitCount ? parseInt(answers.unitCount) : undefined,
          beneficiaries: answers.beneficiaries,
        };
        break;

      case 'project':
        config.projectConfig = {
          projectName: name,
          projectType: answers.projectType as any,
          startDate: answers.startDate,
        };
        break;
    }

    return config;
  }

  /**
   * Generate unique entity ID
   */
  private generateEntityId(entityType: EntityType, name: string): string {
    // Normalize name: lowercase, replace spaces with hyphens
    const normalizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);

    // Add type prefix and year
    const year = new Date().getFullYear();
    const baseId = `${entityType}-${normalizedName}-${year}`;

    // Check for duplicates and add suffix if needed
    const existingEntities = this.loadEntityRegistry();
    let finalId = baseId;
    let counter = 1;

    while (existingEntities.entities[finalId]) {
      finalId = `${baseId}-${counter}`;
      counter++;
    }

    return finalId;
  }

  /**
   * Create required tags for entity type
   */
  private async createRequiredTags(entityType: EntityType, entityId: string): Promise<void> {
    const requiredTags: Record<EntityType, string[]> = {
      household: ['household', 'personal'],
      corporate: ['corporate', 'business'],
      'unit-trust': ['trust', 'unit-trust', 'governance'],
      'discretionary-trust': ['trust', 'discretionary-trust', 'governance'],
      'family-trust': ['trust', 'family-trust', 'fte', 'governance'],
      project: ['project'],
    };

    const tags = requiredTags[entityType] || [];

    for (const tag of tags) {
      await this.paperlessClient.getOrCreateTag(tag);
    }
  }

  /**
   * Create storage path for entity
   */
  private async createStoragePath(config: EntityConfig): Promise<StoragePath | null> {
    const pathMap: Record<EntityType, (c: EntityConfig) => string | null> = {
      household: (c) => `/Household/${c.name}`,
      corporate: (c) => `/Corporate/${c.name}`,
      'unit-trust': (c) => `/Trusts/Unit Trusts/${c.name}`,
      'discretionary-trust': (c) => `/Trusts/Discretionary Trusts/${c.name}`,
      'family-trust': (c) => `/Trusts/Family Trusts/${c.name}`,
      project: (c) => `/Projects/${c.name}`,
    };

    const pathGenerator = pathMap[config.type];
    if (!pathGenerator) return null;

    const path = pathGenerator(config);
    return await this.paperlessClient.getOrCreateStoragePath(path);
  }

  /**
   * Create custom fields for trust entities
   */
  private async createCustomFields(config: EntityConfig): Promise<number[]> {
    if (!config.trustConfig) return [];

    const fieldIds: number[] = [];

    // Common trust fields
    const commonFields = [
      { name: `ABN (${config.name})`, data_type: 'text' as const },
      { name: `TFN (${config.name})`, data_type: 'text' as const },
      { name: `Trustee Name (${config.name})`, data_type: 'text' as const },
      { name: `Trust Deed Date (${config.name})`, data_type: 'date' as const },
    ];

    // Type-specific fields
    let typeFields: Array<{ name: string; data_type: 'text' | 'number' | 'date' }> = [];

    if (config.type === 'family-trust') {
      typeFields = [
        { name: `FTE Date (${config.name})`, data_type: 'date' as const },
      ];
    } else if (config.type === 'unit-trust') {
      typeFields = [
        { name: `Unit Count (${config.name})`, data_type: 'number' as const },
      ];
    } else if (config.type === 'discretionary-trust') {
      typeFields = [
        { name: `Beneficiaries (${config.name})`, data_type: 'text' as const },
      ];
    }

    // Create all fields
    for (const field of [...commonFields, ...typeFields]) {
      try {
        const createdField = await this.paperlessClient.createCustomField(field);
        fieldIds.push(createdField.id);
      } catch (error) {
        console.warn(`Failed to create custom field ${field.name}:`, error);
      }
    }

    return fieldIds;
  }

  /**
   * Register entity locally
   */
  private async registerEntity(config: EntityConfig): Promise<void> {
    const registry = this.loadEntityRegistry();

    registry.entities[config.id] = config;
    registry.version = '2.0.0';

    await this.saveEntityRegistry(registry);
  }

  /**
   * Load entity registry from disk
   */
  private loadEntityRegistry(): EntityRegistry {
    try {
      const fs = require('fs');
      const path = require('path');

      const dir = path.dirname(this.registryPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.registryPath)) {
        const data = fs.readFileSync(this.registryPath, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load entity registry, creating new one:', error);
    }

    return {
      entities: {},
      version: '2.0.0',
    };
  }

  /**
   * Save entity registry to disk
   */
  private async saveEntityRegistry(registry: EntityRegistry): Promise<void> {
    const fs = require('fs').promises;
    const path = require('path');

    const dir = path.dirname(this.registryPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(this.registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  }

  /**
   * Cleanup failed entity creation
   */
  private async cleanupFailedCreation(config: EntityConfig): Promise<void> {
    try {
      // Delete created tag
      if (config.entityTagId) {
        // Note: PaperlessClient doesn't have delete methods intentionally
        // This is a no-op, but we log what would need cleanup
        console.warn(`Entity creation failed - tag ${config.entityTagId} would need cleanup`);
      }

      // Delete created storage path
      if (config.storagePathId) {
        console.warn(`Entity creation failed - storage path ${config.storagePathId} would need cleanup`);
      }

      // Delete created custom fields
      if (config.customFieldIds && config.customFieldIds.length > 0) {
        console.warn(`Entity creation failed - custom fields ${config.customFieldIds.join(', ')} would need cleanup`);
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  /**
   * Check if entity type is a trust
   */
  private isTrustType(type: EntityType): boolean {
    return TaxonomyExpert.isTrustType(type);
  }

  /**
   * Get color for entity type tag
   */
  private getColorForEntityType(type: EntityType): string {
    const colors: Record<EntityType, string> = {
      household: '#4a90d9',
      corporate: '#50c878',
      'unit-trust': '#ff6b6b',
      'discretionary-trust': '#ffd93d',
      'family-trust': '#6bcb77',
      project: '#9b59b6',
    };

    return colors[type] || '#4a90d9';
  }

  /**
   * Get all registered entities
   */
  async getEntities(): Promise<EntityConfig[]> {
    const registry = this.loadEntityRegistry();
    return Object.values(registry.entities);
  }

  /**
   * Get entity by ID
   */
  async getEntity(id: string): Promise<EntityConfig | null> {
    const registry = this.loadEntityRegistry();
    return registry.entities[id] || null;
  }
}

/**
 * Create EntityCreator from environment variables
 */
export async function createEntityCreatorFromEnv(): Promise<EntityCreator> {
  const paperlessClient = (await import('./PaperlessClient.js')).createClientFromEnv();
  const taxonomyExpert = (await import('./TaxonomyExpert.js')).createExpertFromEnv();

  return new EntityCreator(paperlessClient, taxonomyExpert);
}
