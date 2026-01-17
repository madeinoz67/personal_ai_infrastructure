// $PAI_DIR/lib/recordsmanager/SensitivityExpert.ts
/**
 * Sensitivity Expert - Industry-standard document classification
 * Provides ISO 27001, NIST, HIPAA, PCI-DSS, and GDPR compliant sensitivity labels
 */

export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface SensitivityClassification {
  level: SensitivityLevel;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string[];
  tags: string[];
  color: string;
  requires: {
    encryption: boolean;
    accessControl: boolean;
    labeling: boolean;
    auditLogging: boolean;
    dlp: boolean;
  };
  industrySpecific?: {
    type: 'HIPAA' | 'PCI-DSS' | 'GDPR' | 'Legal' | 'None';
    description?: string;
  };
}

/**
 * Security requirements by sensitivity level
 * Based on ISO 27001, NIST, and industry best practices
 */
const SECURITY_REQUIREMENTS: Record<SensitivityLevel, SensitivityClassification['requires']> = {
  public: {
    encryption: false,
    accessControl: false,
    labeling: false,
    auditLogging: false,
    dlp: false,
  },
  internal: {
    encryption: false,
    accessControl: true,
    labeling: true,
    auditLogging: false,
    dlp: false,
  },
  confidential: {
    encryption: true,
    accessControl: true,
    labeling: true,
    auditLogging: true,
    dlp: true,
  },
  restricted: {
    encryption: true,
    accessControl: true,
    labeling: true,
    auditLogging: true,
    dlp: true,
  },
};

/**
 * Color coding by sensitivity level
 * Industry-standard color scheme
 */
const LEVEL_COLORS: Record<SensitivityLevel, string> = {
  public: '#00C853',      // Green
  internal: '#FFD600',    // Yellow
  confidential: '#FF6D00', // Orange
  restricted: '#D50000',   // Red
};

/**
 * Tags by sensitivity level
 */
const LEVEL_TAGS: Record<SensitivityLevel, string[]> = {
  public: ['public', 'published', 'external'],
  internal: ['internal', 'employee-only', 'company-internal'],
  confidential: ['confidential', 'business-sensitive', 'proprietary'],
  restricted: ['restricted', 'highly-confidential', 'trade-secret'],
};

/**
 * Default sensitivity by document type
 * Based on industry standards and regulatory requirements
 */
const DEFAULT_SENSITIVITY: Record<string, SensitivityLevel> = {
  // Public
  'Press Release': 'public',
  'Marketing Material': 'public',
  'Published Research': 'public',
  'Website Content': 'public',
  'Brochure': 'public',
  'Flyer': 'public',

  // Internal
  'Internal Policy': 'internal',
  'Meeting Minutes': 'internal',
  'Procedure': 'internal',
  'Training Material': 'internal',
  'SOP': 'internal',
  'Organizational Chart': 'internal',
  'Org Chart': 'internal',
  'Staff Handbook': 'internal',

  // Confidential
  'Contract': 'confidential',
  'Invoice': 'confidential',
  'Receipt': 'confidential',
  'Bank Statement': 'confidential',
  'Financial Statement': 'confidential',
  'Tax Return': 'confidential',
  'Insurance Policy': 'confidential',
  'Trust Deed': 'confidential',
  'Unit Registry': 'confidential',
  'Customer List': 'confidential',
  'Business Plan': 'confidential',
  'Inv': 'confidential',

  // Restricted
  'Social Security Document': 'restricted',
  'Credit Card Statement': 'restricted',
  'Medical Record': 'restricted',
  'Legal Privileged Communication': 'restricted',
  'Security Vulnerability Report': 'restricted',
  'Encryption Key': 'restricted',
  'Audit Report': 'restricted',
  'Family Trust Election (FTE)': 'restricted',
  'Family Trust Election': 'restricted',
  'FTE': 'restricted',
  'Social Security': 'restricted',
  'SSN': 'restricted',
  'Security Vulnerability': 'restricted',
};

/**
 * Trust-specific sensitivity mappings
 * Trust documents often have elevated sensitivity
 */
const TRUST_SENSITIVITY: Record<string, SensitivityLevel> = {
  'Trust Deed': 'confidential',
  'Family Trust Election (FTE)': 'restricted',
  'Family Trust Election': 'restricted',
  'Unit Registry': 'confidential',
  'Distribution Minutes': 'confidential',
  'Trustee Resolution': 'confidential',
};

/**
 * Keywords and patterns for each sensitivity level
 */
const LEVEL_INDICATORS: Record<SensitivityLevel, { keywords: string[]; patterns: RegExp[] }> = {
  public: {
    keywords: [
      'press release',
      'public statement',
      'published',
      'marketing',
      'website',
      'brochure',
      'flyer',
      'announcement',
    ],
    patterns: [
      /\bpress\s+release\b/i,
      /\bpublic\s+(statement|announcement|notice)\b/i,
      /\bpublished\b/i,
    ],
  },
  internal: {
    keywords: [
      'internal',
      'policy',
      'procedure',
      'sop',
      'meeting minutes',
      'org chart',
      'organizational chart',
      'training material',
      'internal memo',
      'staff handbook',
    ],
    patterns: [
      /\binternal\s+(use|only|memo)\b/i,
      /\bstandard\s+operating\s+procedure\b/i,
      /\bsop\b/i,
      /\bmeeting\s+minutes\b/i,
    ],
  },
  confidential: {
    keywords: [
      'confidential',
      'contract',
      'agreement',
      'financial statement',
      'customer list',
      'proprietary',
      'business plan',
      'negotiation',
      'invoice',
      'receipt',
      'bank statement',
      'tax return',
      'insurance policy',
      'trust deed',
      'unit registry',
    ],
    patterns: [
      /\bconfidential\b/i,
      /\bproprietary\b/i,
      /\bnon-disclosure\b/i,
      /\bnda\b/i,
      /\bcontract\s+agreement\b/i,
    ],
  },
  restricted: {
    keywords: [
      'restricted',
      'secret',
      'top secret',
      'password',
      'encryption key',
      'ssn',
      'social security',
      'credit card',
      'cardholder',
      'phi',
      'protected health information',
      'hipaa',
      'attorney-client privileged',
      'legal privilege',
      'security vulnerability',
      'audit report',
      'family trust election',
      'fte',
    ],
    patterns: [
      /\brestricted\b/i,
      /\btop\s+secret\b/i,
      /\bencryption\s+key\b/i,
      /\bpassword\b/i,
      /\bssn\b/i,
      /\bsocial\s+security\b/i,
      /\battorney[- ]client\s+privileged?\b/i,
    ],
  },
};

/**
 * HIPAA PHI Patterns - 18 identifiers
 * Protected Health Information detection
 */
const PHI_PATTERNS = [
  { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { name: 'Date', pattern: /\b\d{1,2}\/\d{1,2}\/\d{4}\b/ },
  { name: 'Email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/ },
  { name: 'Phone', pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  { name: 'Medical Record', pattern: /\bmedical\s+record\s*(number|#)?\s*:?\s*\w+/i },
  { name: 'Health Plan', pattern: /\bhealth\s+plan\s*(number|#)?\s*:?\s*\w+/i },
  { name: 'Account Number', pattern: /\baccount\s*(number|#)?\s*:?\s*\w+/i },
  { name: 'Certificate', pattern: /\b(certificate|license)\s*(number|#)?\s*:?\s*\w+/i },
  { name: 'Vehicle', pattern: /\bvehicle\s*(identification\s*)?(number|VIN)?\s*:?\s*\w+/i },
  { name: 'Device', pattern: /\bdevice\s*(identification\s*)?(number|ID)?\s*:?\s*\w+/i },
  { name: 'URL', pattern: /https?:\/\/[^\s]+/ },
  { name: 'IP Address', pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/ },
  { name: 'Biometric', pattern: /\b(biometric|fingerprint|retinal)\s+(data|scan|identifier)/i },
  { name: 'Photo', pattern: /\b(full[- ]?face\s*)?photo\s*(identifier)?\b/i },
];

/**
 * PCI-DSS Cardholder Data Patterns
 * Payment card industry detection
 */
const PCI_PATTERNS = [
  {
    name: 'Credit Card (Visa)',
    pattern: /\b4[0-9]{12}(?:[0-9]{3})?\b/,
  },
  {
    name: 'Credit Card (MasterCard)',
    pattern: /\b5[1-5][0-9]{14}\b/,
  },
  {
    name: 'Credit Card (Amex)',
    pattern: /\b3[47][0-9]{13}\b/,
  },
  {
    name: 'Credit Card (Discover)',
    pattern: /\b6(?:011|5[0-9]{2})[0-9]{12}\b/,
  },
  {
    name: 'Credit Card with dashes',
    pattern: /\b(?:4[0-9]{3}|5[1-5][0-9]{2}|3[47][0-9]{2})[-\s]?[0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4}\b/,
  },
  {
    name: 'CVC/CVV',
    pattern: /\bc?vv\s*:?\s*\d{3,4}\b/i,
  },
  {
    name: 'PIN',
    pattern: /\bpin\s*:?\s*\d{4,}\b/i,
  },
  {
    name: 'Cardholder Name',
    pattern: /\bcardholder\s*name\s*:?\s*[A-Z][a-z]+ [A-Z][a-z]+/i,
  },
];

/**
 * PII (Personally Identifiable Information) Patterns
 * GDPR and general privacy detection
 */
const PII_PATTERNS = [
  {
    name: 'Full Name',
    pattern: /[A-Z][a-z]+ [A-Z][a-z]+/,
  },
  {
    name: 'Address',
    pattern: /\d+\s+[A-Z][a-z]+ (Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr)/i,
  },
  {
    name: 'Email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  },
  {
    name: 'Phone',
    pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  },
  {
    name: 'SSN',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/,
  },
  {
    name: 'Passport',
    pattern: /\bpassport\s*(number|#)?\s*:?\s*[A-Z0-9]{6,9}\b/i,
  },
  {
    name: 'Driver License',
    pattern: /\bdriver'?s?\s*(license|lic)\.?(s*)\s*(number|#)?\s*:?\s*[A-Z0-9]{6,15}\b/i,
  },
];

/**
 * Legal privilege detection
 */
const LEGAL_PATTERNS = [
  { pattern: /\battorney[- ]client\s+privileged?\b/i, type: 'attorney-client' },
  { pattern: /\blegal\s+privilege\b/i, type: 'privilege' },
  { pattern: /\bwork\s+product\b/i, type: 'work-product' },
  { pattern: /\blegal\s+hold\b/i, type: 'legal-hold' },
  { pattern: /\bsettlement\s+(agreement|negotiation)\b/i, type: 'settlement' },
];

/**
 * Sensitivity Expert Class
 * Industry-standard document classification for records management
 */
export class SensitivityExpert {
  /**
   * Classify document based on filename and content
   */
  classifyDocument(
    fileName: string,
    content?: string,
    entityType?: string
  ): SensitivityClassification {
    const classification: SensitivityClassification = {
      level: 'internal',
      confidence: 'low',
      reasoning: [],
      tags: [],
      color: LEVEL_COLORS.internal,
      requires: { ...SECURITY_REQUIREMENTS.internal },
      industrySpecific: { type: 'None' },
    };

    const lowerName = fileName.toLowerCase().replace(/[_-]/g, ' ');
    const combinedText = `${fileName} ${content || ''} ${entityType || ''}`.toLowerCase();

    // Check document type mappings (always check, even if trust type found)
    // Sort by document type length (descending) to match longer, more specific names first
    const sortedDocTypes = Object.entries(DEFAULT_SENSITIVITY).sort((a, b) => b[0].length - a[0].length);

    for (const [docType, level] of sortedDocTypes) {
      const normalizedDocType = docType.toLowerCase().replace(/[_-]/g, ' ');
      if (lowerName.includes(normalizedDocType) || fileName.includes(docType)) {
        // Document type classification should ALWAYS set the level
        classification.level = level;
        classification.confidence = 'high';
        classification.reasoning.push(`Document type: ${docType}`);
        break;
      }
    }

    // Check trust-specific sensitivity (overrides default)
    if (entityType && TaxonomyExpert.isTrustType(entityType)) {
      // Sort by document type length (descending) to match longer, more specific names first
      const sortedTrustTypes = Object.entries(TRUST_SENSITIVITY).sort((a, b) => b[0].length - a[0].length);

      for (const [docType, level] of sortedTrustTypes) {
        const normalizedDocType = docType.toLowerCase().replace(/[_-]/g, ' ');
        if (lowerName.includes(normalizedDocType) || fileName.includes(docType)) {
          classification.level = level;
          classification.confidence = 'high';
          classification.reasoning[0] = `Trust document type: ${docType}`; // Replace first reasoning
          break;
        }
      }
    }

    // Check for industry-specific regulated data (highest priority)
    if (content) {
      // SSN detection (always restricted)
      if (/\b\d{3}-\d{2}-\d{4}\b/.test(content)) {
        classification.level = 'restricted';
        classification.confidence = 'high';
        classification.reasoning.push('Contains Social Security Number');
        classification.industrySpecific = { type: 'HIPAA', description: 'Contains SSN' };
      }

      // HIPAA PHI detection
      const phiCount = this.countPatternMatches(content, PHI_PATTERNS);
      if (phiCount >= 3) {
        classification.level = 'restricted';
        classification.confidence = 'high';
        classification.reasoning.push(`Contains Protected Health Information (PHI) - HIPAA`);
        classification.industrySpecific = { type: 'HIPAA', description: 'Contains 3+ PHI identifiers' };
      }

      // PCI-DSS detection
      const pciCount = this.countPatternMatches(content, PCI_PATTERNS);
      if (pciCount >= 1) {
        classification.level = 'restricted';
        classification.confidence = 'high';
        classification.reasoning.push(`Contains cardholder data - PCI-DSS`);
        classification.industrySpecific = { type: 'PCI-DSS', description: 'Contains payment card data' };
      }

      // PII detection
      const piiCount = this.countPatternMatches(content, PII_PATTERNS);
      if (piiCount >= 2 && classification.level !== 'restricted') {
        classification.level = 'confidential';
        classification.confidence = classification.confidence === 'high' ? 'high' : 'medium';
        classification.reasoning.push(`Contains PII - GDPR/Privacy`);
        classification.industrySpecific = { type: 'GDPR', description: 'Contains personal data' };
      }

      // Legal privilege detection
      for (const { pattern, type } of LEGAL_PATTERNS) {
        if (pattern.test(content)) {
          classification.level = 'restricted';
          classification.confidence = 'high';
          classification.reasoning.push(`Contains legally privileged information: ${type}`);
          classification.industrySpecific = { type: 'Legal', description: `Attorney-client privilege: ${type}` };
          break;
        }
      }
    }

    // Check for level keywords and patterns (only if we don't have high confidence yet)
    if (classification.confidence !== 'high') {
      for (const [level, indicators] of Object.entries(LEVEL_INDICATORS)) {
        const sensitivityLevel = level as SensitivityLevel;

        // Check keywords
        for (const keyword of indicators.keywords) {
          if (combinedText.includes(keyword)) {
            if (classification.level !== sensitivityLevel) {
              classification.reasoning.push(`Keyword: "${keyword}"`);
            }
            // Upgrade sensitivity if higher level detected
            if (this.compareLevels(sensitivityLevel, classification.level) > 0) {
              classification.level = sensitivityLevel;
              classification.confidence = 'medium';
            }
          }
        }

        // Check patterns
        for (const pattern of indicators.patterns) {
          if (pattern.test(combinedText)) {
            if (classification.reasoning.length === 0) {
              classification.reasoning.push('Pattern match detected');
            }
            if (this.compareLevels(sensitivityLevel, classification.level) > 0) {
              classification.level = sensitivityLevel;
              classification.confidence = 'medium';
            }
          }
        }
      }
    }

    // Apply level-specific properties
    classification.color = LEVEL_COLORS[classification.level];
    classification.requires = { ...SECURITY_REQUIREMENTS[classification.level] };
    classification.tags = [...LEVEL_TAGS[classification.level]];

    // Add industry-specific tags
    if (classification.industrySpecific && classification.industrySpecific.type !== 'None') {
      classification.tags.push(`regulatory:${classification.industrySpecific.type.toLowerCase()}`);
    }

    return classification;
  }

  /**
   * Check if document contains PHI (Protected Health Information)
   */
  containsPHI(content: string): boolean {
    const matchCount = this.countPatternMatches(content, PHI_PATTERNS);
    return matchCount >= 2; // At least 2 PHI identifiers required
  }

  /**
   * Check if document contains PII (Personally Identifiable Information)
   */
  containsPII(content: string): boolean {
    const matchCount = this.countPatternMatches(content, PII_PATTERNS);
    return matchCount >= 2; // At least 2 PII elements required
  }

  /**
   * Check if document contains cardholder data (PCI-DSS)
   */
  containsCardholderData(content: string): boolean {
    const matchCount = this.countPatternMatches(content, PCI_PATTERNS);
    return matchCount >= 1; // Any cardholder data triggers PCI-DSS
  }

  /**
   * Get sensitivity tags for a level
   */
  getTagsForLevel(level: SensitivityLevel): string[] {
    return [...LEVEL_TAGS[level]];
  }

  /**
   * Get security requirements for a level
   */
  getSecurityRequirements(level: SensitivityLevel): {
    encryption: boolean;
    accessControl: boolean;
    labeling: boolean;
    auditLogging: boolean;
    dlp: boolean;
  } {
    return { ...SECURITY_REQUIREMENTS[level] };
  }

  /**
   * Suggest sensitivity based on document type
   */
  suggestSensitivityForDocType(documentType: string, entityType: string): SensitivityClassification {
    const classification = this.classifyDocument(documentType, undefined, entityType);
    classification.reasoning = [`Document type: ${documentType}`];
    return classification;
  }

  /**
   * Validate if sensitivity level is appropriate for document type
   */
  validateSensitivity(
    documentType: string,
    sensitivity: SensitivityLevel,
    entityType: string
  ): {
    appropriate: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const result = {
      appropriate: true,
      warnings: [] as string[],
      suggestions: [] as string[],
    };

    const suggested = this.suggestSensitivityForDocType(documentType, entityType);
    const suggestedLevel = suggested.level;

    // Under-classification check
    if (this.compareLevels(suggestedLevel, sensitivity) > 0) {
      result.appropriate = false;
      result.warnings.push(
        `Document type "${documentType}" typically classified as ${suggestedLevel.toUpperCase()}, ` +
        `but marked as ${sensitivity.toUpperCase()}. May be under-classified.`
      );
      result.suggestions.push(`Consider elevating to ${suggestedLevel.toUpperCase()}`);
    }

    // Over-classification check (informational, not a warning)
    if (this.compareLevels(sensitivity, suggestedLevel) > 1) {
      result.suggestions.push(
        `Document type "${documentType}" typically classified as ${suggestedLevel.toUpperCase()}, ` +
        `but marked as ${sensitivity.toUpperCase()}. This may be intentional for specific circumstances.`
      );
    }

    // Trust-specific warnings
    if (entityType && TaxonomyExpert.isTrustType(entityType)) {
      if (documentType === 'Family Trust Election (FTE)' && sensitivity !== 'restricted') {
        result.warnings.push(
          'Family Trust Election (FTE) should be RESTRICTED - ATO-critical document with 5-year retention from FTE date'
        );
        result.suggestions.push('Elevate to RESTRICTED for proper protection');
      }
    }

    return result;
  }

  /**
   * Count pattern matches in content
   */
  private countPatternMatches(content: string, patterns: Array<{ name: string; pattern: RegExp }>): number {
    let matchCount = 0;
    const lowerContent = content.toLowerCase();

    for (const { pattern } of patterns) {
      if (pattern.test(content)) {
        matchCount++;
      }
    }

    return matchCount;
  }

  /**
   * Compare sensitivity levels (returns positive if level1 > level2)
   */
  private compareLevels(level1: SensitivityLevel, level2: SensitivityLevel): number {
    const levelOrder: SensitivityLevel[] = ['public', 'internal', 'confidential', 'restricted'];
    const idx1 = levelOrder.indexOf(level1);
    const idx2 = levelOrder.indexOf(level2);
    return idx1 - idx2;
  }

  /**
   * Get supported sensitivity levels
   */
  static getSupportedLevels(): SensitivityLevel[] {
    return ['public', 'internal', 'confidential', 'restricted'];
  }
}

/**
 * Import helper to avoid circular dependency
 */
import { TaxonomyExpert } from './TaxonomyExpert';
