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
    const lowerName = fileName.toLowerCase().replace(/[_-]/g, ' ');

    // Check for known document types (normalized matching)
    for (const docType of taxonomy.documentTypes) {
      const normalizedType = docType.toLowerCase().replace(/[_-]/g, ' ');

      // Special abbreviations for invoice
      const isInvoice = docType === 'Invoice' && (
        lowerName.includes('inv') ||
        lowerName.includes(normalizedType) ||
        fileName.includes(docType)
      );

      if (isInvoice ||
          lowerName.includes(normalizedType) ||
          fileName.includes(docType) ||
          (content && content.toLowerCase().includes(docType.toLowerCase()))) {
        suggestion.documentType = docType;

        // Apply retention rule
        const retention = taxonomy.retentionRules[docType];
        if (retention) {
          suggestion.retentionYears = retention.years;
          suggestion.retentionReason = retention.reason;
        }

        // Add category tag based on document type
        // Financial documents → financial tag
        if (['Invoice', 'Receipt', 'Contract', 'Tax Document', 'Tax Return',
             'Bank Statement', 'Investment Statement', 'Financial Statement'].includes(docType)) {
          if (!suggestion.tags.includes('financial')) {
            suggestion.tags.push('financial');
          }
        }
        // Legal documents → legal tag
        if (['Contract', 'Legal Document', 'Will', 'Power of Attorney', 'License', 'Permit'].includes(docType)) {
          if (!suggestion.tags.includes('legal')) {
            suggestion.tags.push('legal');
          }
        }
        // Insurance documents → insurance tag
        if (['Insurance Policy', 'Insurance Certificate'].includes(docType)) {
          if (!suggestion.tags.includes('insurance')) {
            suggestion.tags.push('insurance');
          }
        }

        break;
      }
    }

    // Suggest tags based on categories (normalized matching)
    for (const [category, tags] of Object.entries(taxonomy.tagCategories)) {
      for (const tag of tags) {
        const normalizedTag = tag.toLowerCase().replace(/[_-]/g, ' ');
        if (lowerName.includes(normalizedTag) ||
            lowerName.includes(tag) ||
            (content && content.toLowerCase().includes(tag.toLowerCase()))) {
          if (!suggestion.tags.includes(tag)) {
            suggestion.tags.push(tag);
          }
          if (!suggestion.tags.includes(category)) {
            suggestion.tags.push(category); // Add category tag too
          }
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
  const country = process.env.MADEINOZ_RECORDMANAGER_COUNTRY || 'Australia';
  const defaultDomain = (process.env.MADEINOZ_RECORDMANAGER_DEFAULT_DOMAIN as Domain) || 'household';

  if (!TaxonomyExpert.isCountrySupported(country)) {
    console.warn(`Country ${country} not supported, falling back to Australia`);
    return new TaxonomyExpert('Australia', defaultDomain);
  }

  return new TaxonomyExpert(country, defaultDomain);
}
