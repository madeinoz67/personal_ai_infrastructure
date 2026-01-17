// $PAI_DIR/lib/recordsmanager/TrustExpert.ts
/**
 * Trust Expert - Australian trust document requirements and retention rules
 * Provides ATO-compliant guidance for Unit Trusts, Discretionary Trusts, and Family Trusts
 */

export type TrustType = 'unit-trust' | 'discretionary-trust' | 'family-trust';

export interface TrustDocumentChecklist {
  trustType: TrustType;
  requiredDocuments: string[];
  optionalDocuments: string[];
}

export interface RetentionRequirement {
  years: number;
  reason: string;
  atoReference?: string;
}

export interface TrustValidationResult {
  complete: boolean;
  missing: string[];
  warnings: string[];
}

export interface FTERetentionWarning {
  retentionUntil: Date;
  warning: string;
  daysRemaining: number;
}

export interface TrustTagSuggestion {
  tags: string[];
  documentType?: string;
  retentionYears?: number;
  notes?: string;
}

/**
 * Australian Trust Document Requirements
 * Based on ATO guidelines and trust administration best practices
 */
const AUSTRALIAN_TRUST_REQUIREMENTS: Record<TrustType, TrustDocumentChecklist> = {
  'unit-trust': {
    trustType: 'unit-trust',
    requiredDocuments: [
      'Trust Deed',
      'Unit Registry',
      'Trustee Appointment',
      'ABN Registration',
      'TFN Registration',
      'Annual Financial Statements',
      'Unit Distribution Statement',
      'Tax Return',
    ],
    optionalDocuments: [
      'Unit Application Form',
      'Unit Transfer Documentation',
      'Unitholder Agreement',
      'Trustee Resolution',
    ],
  },
  'discretionary-trust': {
    trustType: 'discretionary-trust',
    requiredDocuments: [
      'Trust Deed',
      'Trustee Appointment',
      'Beneficiary Declaration',
      'ABN Registration',
      'TFN Registration',
      'Annual Financial Statements',
      'Trustee Resolution (Pre-EOFY)',
      'Distribution Minutes',
      'Tax Return',
    ],
    optionalDocuments: [
      'Variation to Trust Deed',
      'Beneficiary Consent Forms',
      'Trustee Change Notification',
      'Asset Register',
    ],
  },
  'family-trust': {
    trustType: 'family-trust',
    requiredDocuments: [
      'Trust Deed',
      'Family Trust Election (FTE)',
      'Trustee Appointment',
      'Beneficiary Declaration',
      'ABN Registration',
      'TFN Registration',
      'Annual Financial Statements',
      'Trustee Resolution (Pre-EOFY)',
      'Distribution Minutes',
      'Tax Return',
    ],
    optionalDocuments: [
      'Variation to Trust Deed',
      'Beneficiary Consent Forms',
      'Interposed Entity Election',
      'Trustee Change Notification',
      'Asset Register',
    ],
  },
};

/**
 * ATO-Compliant Retention Rules
 * Key distinction: FTE retention is from FTE lodgment date, NOT EOFY
 */
const RETENTION_RULES: Record<string, RetentionRequirement> = {
  // Permanent trust records
  'Trust Deed': {
    years: 15,
    reason: 'Permanent trust record - establishes trust existence and terms',
    atoReference: 'Trust law - must be retained for life of trust + 15 years',
  },
  'Unit Registry': {
    years: 15,
    reason: 'Permanent ownership record - tracks unit holdings and transfers',
    atoReference: 'Corporate law - permanent register',
  },

  // Family Trust Election - SPECIAL RULE
  'Family Trust Election (FTE)': {
    years: 5,
    reason: '5 years from FTE lodgment date (NOT EOFY) - ATO special rule',
    atoReference: 'TD 2007/D23 - FTE retention from lodgment date',
  },

  // Distribution evidence - 7 years
  'Trustee Resolution (Pre-EOFY)': {
    years: 7,
    reason: 'ATO requirement for distribution substantiation',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Distribution Minutes': {
    years: 7,
    reason: 'ATO requirement for distribution evidence',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Trustee Resolution': {
    years: 7,
    reason: 'ATO requirement for trust decision evidence',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },

  // Financial records - 7 years
  'Annual Financial Statements': {
    years: 7,
    reason: 'ATO requirement for income and deduction substantiation',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Tax Return': {
    years: 7,
    reason: 'ATO requirement for trust tax compliance',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Unit Distribution Statement': {
    years: 7,
    reason: 'ATO capital gains tax calculation evidence',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },

  // Registration documents - 7 years
  'ABN Registration': {
    years: 7,
    reason: 'ATO business registration evidence',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'TFN Registration': {
    years: 7,
    reason: 'ATO tax file number registration evidence',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },

  // Administrative documents - 7 years
  'Trustee Appointment': {
    years: 7,
    reason: 'Evidence of trustee authority for trust actions',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Beneficiary Declaration': {
    years: 7,
    reason: 'Evidence of beneficiary eligibility for distributions',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },

  // Optional documents - 7 years default
  'Variation to Trust Deed': {
    years: 7,
    reason: 'Evidence of trust amendment (may need longer for complex variations)',
    atoReference: 'Trust law - recommend retaining until trust winds up',
  },
  'Unit Transfer Documentation': {
    years: 7,
    reason: 'Capital gains tax calculation evidence',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Beneficiary Consent Forms': {
    years: 7,
    reason: 'Evidence of beneficiary agreement to trust actions',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
  'Asset Register': {
    years: 7,
    reason: 'Capital gains tax base cost tracking',
    atoReference: 'Section 254 - Tax Administration Act 1953',
  },
};

/**
 * Trust-specific tag categories
 */
const TRUST_TAG_CATEGORIES: Record<TrustType, Record<string, string[]>> = {
  'unit-trust': {
    'unit-trust': ['unitholder', 'unit-transfer', 'beneficiary'],
    financial: ['distribution', 'capital-accounts', 'unit-value'],
    governance: ['trustee-resolution', 'unit-registry', 'variation'],
    regulatory: ['abn', 'tfn', 'ato', 'lodgment'],
  },
  'discretionary-trust': {
    'discretionary-trust': ['beneficiary', 'distribution', 'discretion'],
    financial: ['income', 'capital', 'distribution', 'tax-free'],
    governance: ['trustee-resolution', 'minutes', 'pre-eofy', 'variation'],
    regulatory: ['abn', 'tfn', 'ato', 'lodgment'],
  },
  'family-trust': {
    'family-trust': ['fte', 'family-trust-election', 'beneficiary', 'interposed-entity'],
    financial: ['distribution', 'income', 'capital', 'stream-trust'],
    governance: ['trustee-resolution', 'minutes', 'pre-eofy', 'variation'],
    regulatory: ['abn', 'tfn', 'ato', 'lodgment'],
  },
};

/**
 * Trust Expert Class
 * Provides Australian trust document requirements and ATO-compliant retention rules
 */
export class TrustExpert {
  private country: string;

  constructor(country: string = 'Australia') {
    this.country = country;
  }

  /**
   * Get document checklist for a trust type
   */
  getTrustChecklist(trustType: TrustType): string[] {
    const requirements = AUSTRALIAN_TRUST_REQUIREMENTS[trustType];
    if (!requirements) {
      throw new Error(`Unknown trust type: ${trustType}`);
    }

    return [
      ...requirements.requiredDocuments,
      ...requirements.optionalDocuments,
    ];
  }

  /**
   * Get required documents only
   */
  getRequiredDocuments(trustType: TrustType): string[] {
    const requirements = AUSTRALIAN_TRUST_REQUIREMENTS[trustType];
    if (!requirements) {
      throw new Error(`Unknown trust type: ${trustType}`);
    }

    return requirements.requiredDocuments;
  }

  /**
   * Get retention requirements for a document type
   */
  getRetentionRequirements(documentType: string, trustType?: TrustType): RetentionRequirement | null {
    // Direct match first
    if (documentType in RETENTION_RULES) {
      return RETENTION_RULES[documentType];
    }

    // Fuzzy match for variations
    const normalizedDoc = documentType.toLowerCase();
    for (const [key, value] of Object.entries(RETENTION_RULES)) {
      if (key.toLowerCase().includes(normalizedDoc) || normalizedDoc.includes(key.toLowerCase())) {
        return value;
      }
    }

    // Default 7-year retention for trust documents
    return {
      years: 7,
      reason: 'ATO default retention period for trust documents',
      atoReference: 'Section 254 - Tax Administration Act 1953',
    };
  }

  /**
   * Validate if a trust's documents are complete
   */
  validateTrustDocuments(
    trustType: TrustType,
    existingDocuments: string[]
  ): TrustValidationResult {
    const requirements = AUSTRALIAN_TRUST_REQUIREMENTS[trustType];
    if (!requirements) {
      throw new Error(`Unknown trust type: ${trustType}`);
    }

    const normalizedExisting = existingDocuments.map((doc) =>
      doc.toLowerCase().trim()
    );

    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required documents
    for (const required of requirements.requiredDocuments) {
      const normalizedRequired = required.toLowerCase().trim();
      const hasDocument = normalizedExisting.some((existing) =>
        existing.includes(normalizedRequired) ||
        normalizedRequired.includes(existing)
      );

      if (!hasDocument) {
        missing.push(required);
      }
    }

    // Family Trust specific warning for FTE
    if (trustType === 'family-trust') {
      const hasFTE = normalizedExisting.some((doc) =>
        doc.includes('family trust election') || doc.includes('fte')
      );

      if (!hasFTE) {
        warnings.push(
          'Family Trust Election (FTE) document not found. ' +
          'This is critical for tax flow-through benefits.'
        );
      }
    }

    // Pre-EOFY resolution warning
    const hasPreEOFYResolution = normalizedExisting.some((doc) =>
      doc.includes('pre-eofy') || doc.includes('pre eofy')
    );

    if (!hasPreEOFYResolution) {
      warnings.push(
        'Pre-EOFY Trustee Resolution not found. ' +
        'This should be prepared before June 30 each year.'
      );
    }

    return {
      complete: missing.length === 0,
      missing,
      warnings,
    };
  }

  /**
   * Get FTE warning for family trusts
   * Critical: FTE retention is from FTE lodgment date, NOT EOFY
   */
  getFTERetentionWarning(fteDate: Date): FTERetentionWarning {
    // FTE must be retained for 5 years from FTE lodgment date
    const retentionUntil = new Date(fteDate);
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 5);

    const today = new Date();
    const daysRemaining = Math.ceil(
      (retentionUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let warning = `Family Trust Election must be retained until ${retentionUntil.toLocaleDateString()}.`;
    if (daysRemaining < 0) {
      warning += ' RETENTION PERIOD EXPIRED - Document can be archived or destroyed.';
    } else if (daysRemaining < 90) {
      warning += ' RETENTION EXPIRING SOON - Prepare to archive or destroy.';
    } else {
      warning += ' Retention period active.';
    }

    warning += ' Note: FTE retention is calculated from FTE lodgment date, not EOFY.';

    return {
      retentionUntil,
      warning,
      daysRemaining,
    };
  }

  /**
   * Suggest tags for trust documents
   */
  suggestTags(fileName: string, trustType: TrustType): TrustTagSuggestion {
    const suggestion: TrustTagSuggestion = {
      tags: [],
    };

    // Add trust type tag
    suggestion.tags.push(trustType);

    // Add category tags based on trust type
    const categories = TRUST_TAG_CATEGORIES[trustType];
    const lowerFileName = fileName.toLowerCase().replace(/[_-]/g, ' ');

    // Check for document type
    const checklist = this.getTrustChecklist(trustType);
    for (const docType of checklist) {
      const normalizedType = docType.toLowerCase().replace(/[_-]/g, ' ');

      if (lowerFileName.includes(normalizedType) ||
          fileName.includes(docType)) {
        suggestion.documentType = docType;

        // Get retention requirements
        const retention = this.getRetentionRequirements(docType, trustType);
        if (retention) {
          suggestion.retentionYears = retention.years;
          suggestion.notes = retention.reason;
        }

        break;
      }
    }

    // Add category-specific tags
    for (const [category, tags] of Object.entries(categories)) {
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().replace(/[_-]/g, ' ');

        if (lowerFileName.includes(normalizedTag) ||
            lowerFileName.includes(tag)) {
          if (!suggestion.tags.includes(tag)) {
            suggestion.tags.push(tag);
          }
          if (!suggestion.tags.includes(category)) {
            suggestion.tags.push(category);
          }
        }
      }
    }

    // Special handling for Family Trust Election
    if (lowerFileName.includes('fte') ||
        lowerFileName.includes('family trust election')) {
      if (!suggestion.tags.includes('fte')) {
        suggestion.tags.push('fte');
      }
      if (!suggestion.tags.includes('critical')) {
        suggestion.tags.push('critical');
      }
    }

    // Pre-EOFY marker
    if (lowerFileName.includes('pre-eofy') ||
        lowerFileName.includes('pre eofy') ||
        lowerFileName.includes('resolution')) {
      if (!suggestion.tags.includes('pre-eofy')) {
        suggestion.tags.push('pre-eofy');
      }
      if (!suggestion.tags.includes('annual')) {
        suggestion.tags.push('annual');
      }
    }

    // Financial documents
    if (lowerFileName.includes('financial') ||
        lowerFileName.includes('statement') ||
        lowerFileName.includes('distribution')) {
      if (!suggestion.tags.includes('financial')) {
        suggestion.tags.push('financial');
      }
    }

    return suggestion;
  }

  /**
   * Get supported trust types
   */
  static getSupportedTrustTypes(): TrustType[] {
    return ['unit-trust', 'discretionary-trust', 'family-trust'];
  }

  /**
   * Check if trust type is supported
   */
  static isTrustTypeSupported(trustType: string): trustType is TrustType {
    return this.getSupportedTrustTypes().includes(trustType as TrustType);
  }

  /**
   * Get country support status
   */
  isCountrySupported(country: string = this.country): boolean {
    return country.toLowerCase() === 'australia';
  }
}

/**
 * Create expert from environment variables
 */
export function createTrustExpertFromEnv(): TrustExpert {
  const country = process.env.MADEINOZ_RECORDMANAGER_COUNTRY || 'Australia';

  if (country.toLowerCase() !== 'australia') {
    console.warn(`TrustExpert currently only supports Australian trusts, got: ${country}`);
  }

  return new TrustExpert(country);
}
