// $PAI_DIR/lib/recordsmanager/TaxonomyExpert.ts
/**
 * Taxonomy Expert - Country-specific record keeping guidelines
 * Provides domain expertise for household, corporate, trust, and project management records
 */

export type Domain = 'household' | 'corporate' | 'projects' | 'unit-trust' | 'discretionary-trust' | 'family-trust';

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
          'Insurance Claim',
          'Warranty Document',
          'Education Record',
          'Bank Statement',
          'Investment Statement',
          'Utility Bill',
          'Receipt',
          'Contract',
          'Legal Document',
          'Car Lease',
          'Car Registration',
          'Health Record',
          'Referral Letter',
          'Test Results',
          'Prescription',
          'Superannuation Statement',
          'Dividend Statement',
          'Loan Document',
          'Lease Agreement',
          'Mortgage Statement',
          'Rate Notice',
        ],
        tagCategories: {
          financial: ['tax', 'income', 'expense', 'investment', 'superannuation', 'dividend', 'loan', 'mortgage'],
          medical: ['doctor', 'hospital', 'pharmacy', 'insurance', 'receipt', 'referral', 'test-results', 'prescription', 'health-record'],
          insurance: ['home', 'contents', 'vehicle', 'health', 'life', 'claim'],
          legal: ['contract', 'agreement', 'will', 'power-of-attorney', 'lease'],
          education: ['transcript', 'certificate', 'qualification'],
          household: ['utility', 'maintenance', 'warranty', 'manual', 'rate-notice'],
          vehicle: ['car', 'registration', 'lease', 'insurance'],
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
          'Insurance Claim': {
            years: 7,
            reason: 'ATO tax deduction + potential claim dispute period',
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
          'Car Lease': {
            years: 5,
            reason: 'Until lease expires + residual value disputes',
          },
          'Car Registration': {
            years: 5,
            reason: 'Current registration period + proof of ownership',
          },
          'Health Record': {
            years: 10,
            reason: 'Long-term personal health history',
          },
          'Referral Letter': {
            years: 5,
            reason: 'Medical treatment substantiation',
          },
          'Test Results': {
            years: 7,
            reason: 'Medical history and tax deduction substantiation',
          },
          'Prescription': {
            years: 5,
            reason: 'Medical expense tax deduction substantiation',
          },
          'Superannuation Statement': {
            years: 7,
            reason: 'ATO superannuation contribution and balance records',
          },
          'Dividend Statement': {
            years: 7,
            reason: 'ATO investment income and franking credit substantiation',
          },
          'Loan Document': {
            years: 7,
            reason: 'ATO interest deduction + contract statute of limitations',
          },
          'Lease Agreement': {
            years: 7,
            reason: 'Contract statute of limitations + bond disputes',
          },
          'Mortgage Statement': {
            years: 7,
            reason: 'ATO interest deduction substantiation',
          },
          'Rate Notice': {
            years: 5,
            reason: 'ATO tax deduction + council record',
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
          'Balance Sheet',
          'Cash Flow Statement',
          'Income Statement',
          'Statement of Changes',
          'Equity Statement',
          'Insurance Certificate',
          'Insurance Claim',
          'License',
          'Permit',
          'Compliance Report',
          'Board Resolution',
          'Shareholder Record',
          'Purchase Order',
          'Credit Note',
          'Debit Note',
          'Car Registration',
          'Lease Agreement',
          'Loan Agreement',
          'Pay Slip',
          'Timesheet',
          'Employee Contract',
          'Termination Letter',
          'Warning Letter',
        ],
        tagCategories: {
          financial: ['accounts-payable', 'accounts-receivable', 'expense', 'revenue', 'purchase-order', 'credit-note', 'debit-note'],
          legal: ['contract', 'agreement', 'insurance', 'license', 'lease', 'loan'],
          hr: ['employee', 'payroll', 'leave', 'performance', 'pay-slip', 'timesheet', 'employee-contract', 'termination', 'warning'],
          compliance: ['audit', 'report', 'certificate', 'permit'],
          corporate: ['board', 'shareholder', 'meeting', 'resolution'],
          reporting: ['balance-sheet', 'cash-flow', 'income-statement', 'equity', 'statement-of-changes'],
          vehicle: ['car', 'registration', 'lease'],
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
          'Balance Sheet': {
            years: 7,
            reason: 'ATO requirement - Corporations Act',
          },
          'Cash Flow Statement': {
            years: 7,
            reason: 'ATO requirement - Corporations Act',
          },
          'Income Statement': {
            years: 7,
            reason: 'ATO requirement - Corporations Act',
          },
          'Statement of Changes': {
            years: 7,
            reason: 'ATO requirement - Corporations Act',
          },
          'Equity Statement': {
            years: 7,
            reason: 'ATO requirement - Corporations Act',
          },
          'Insurance Certificate': {
            years: 10,
            reason: 'Current + expired policy period',
          },
          'Insurance Claim': {
            years: 7,
            reason: 'ATO tax deduction + potential claim dispute period',
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
          'Purchase Order': {
            years: 7,
            reason: 'ATO expense substantiation + audit trail',
          },
          'Credit Note': {
            years: 7,
            reason: 'ATO adjustment substantiation',
          },
          'Debit Note': {
            years: 7,
            reason: 'ATO adjustment substantiation',
          },
          'Car Registration': {
            years: 5,
            reason: 'Current registration period + business asset records',
          },
          'Lease Agreement': {
            years: 7,
            reason: 'Contract statute of limitations + lease disputes',
          },
          'Loan Agreement': {
            years: 7,
            reason: 'ATO interest deduction + contract statute of limitations',
          },
          'Pay Slip': {
            years: 7,
            reason: 'Fair Work Act + ATO requirement',
          },
          'Timesheet': {
            years: 7,
            reason: 'Fair Work Act + payroll substantiation',
          },
          'Employee Contract': {
            years: 7,
            reason: 'Fair Work Act + employment disputes',
          },
          'Termination Letter': {
            years: 7,
            reason: 'Fair Work Act + potential disputes',
          },
          'Warning Letter': {
            years: 7,
            reason: 'Fair Work Act + performance management evidence',
          },
        },
      },
      'unit-trust': {
        documentTypes: [
          'Trust Deed',
          'Unit Registry',
          'Trustee Appointment',
          'ABN Registration',
          'TFN Registration',
          'Annual Financial Statements',
          'Unit Distribution Statement',
          'Tax Return',
          'Unit Transfer Form',
          'Beneficiary Statement',
          'Trustee Resolution',
          'Trustee Minutes',
          'GST Registration',
          'Business Activity Statement',
          'Capital Account Statement',
          'Variation to Trust Deed',
          'Unit Statement',
          'Unitholder Statement',
          'Trust Correspondence',
          'Actuarial Certificate',
        ],
        tagCategories: {
          'unit-trust': ['unit-registry', 'distribution', 'unitholder', 'unit-transfer', 'capital-account', 'unit-statement'],
          financial: ['income', 'expense', 'capital-gain', 'loss', 'gst'],
          compliance: ['tax', 'superannuation', 'gst', 'bas', 'actuarial'],
          governance: ['trustee', 'beneficiary', 'resolution', 'minutes', 'trust-deed', 'correspondence'],
        },
        retentionRules: {
          'Trust Deed': {
            years: 15,
            reason: 'Permanent trust record - foundational document',
          },
          'Unit Registry': {
            years: 15,
            reason: 'Permanent ownership record - unit holdings evidence',
          },
          'Trustee Appointment': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'ABN Registration': {
            years: 7,
            reason: 'ATO business registration requirement',
          },
          'TFN Registration': {
            years: 7,
            reason: 'ATO tax file number requirement',
          },
          'Annual Financial Statements': {
            years: 7,
            reason: 'ATO requirement - income tax substantiation',
          },
          'Unit Distribution Statement': {
            years: 7,
            reason: 'ATO capital gains calculation - CGT event records',
          },
          'Tax Return': {
            years: 7,
            reason: 'ATO requirement - Section 254 of Tax Administration Act 1953',
          },
          'Unit Transfer Form': {
            years: 7,
            reason: 'Ownership change evidence - CGT records',
          },
          'Beneficiary Statement': {
            years: 7,
            reason: 'Income distribution evidence',
          },
          'Trustee Resolution': {
            years: 7,
            reason: 'Trust governance and decision evidence',
          },
          'Trustee Minutes': {
            years: 7,
            reason: 'Trust governance and decision evidence',
          },
          'GST Registration': {
            years: 7,
            reason: 'ATO GST compliance requirement',
          },
          'Business Activity Statement': {
            years: 7,
            reason: 'ATO GST and tax reporting requirement',
          },
          'Capital Account Statement': {
            years: 7,
            reason: 'CGT calculation and tax basis evidence',
          },
          'Variation to Trust Deed': {
            years: 15,
            reason: 'Permanent trust amendment record',
          },
          'Unit Statement': {
            years: 7,
            reason: 'ATO capital gains calculation - CGT event records',
          },
          'Unitholder Statement': {
            years: 7,
            reason: 'Income distribution evidence',
          },
          'Trust Correspondence': {
            years: 7,
            reason: 'ATO audit trail + governance evidence',
          },
          'Actuarial Certificate': {
            years: 7,
            reason: 'ATO tax deduction substantiation',
          },
        },
      },
      'discretionary-trust': {
        documentTypes: [
          'Trust Deed',
          'Trustee Resolution',
          'Trustee Minutes',
          'Beneficiary Declaration',
          'Distribution Minutes',
          'Annual Financial Statements',
          'Tax Return',
          'Beneficiary Consent',
          'Trustee Appointment',
          'Trustee Resignation',
          'Variation to Trust Deed',
          'Appointor Appointment',
          'Appointor Resignation',
          'Guardian Appointment',
          'Income Distribution Statement',
          'Capital Gains Tax Election',
          'Streaming Resolution',
          'Trust Correspondence',
          'Actuarial Certificate',
        ],
        tagCategories: {
          'discretionary-trust': ['trustee-resolution', 'beneficiary', 'distribution', 'pre-eofy', 'streaming'],
          financial: ['income', 'expense', 'distribution', 'capital-gain'],
          compliance: ['tax', 'gst', 'bas', 'actuarial'],
          governance: ['trustee', 'appointor', 'guardian', 'beneficiary', 'resolution', 'minutes', 'correspondence'],
        },
        retentionRules: {
          'Trust Deed': {
            years: 15,
            reason: 'Permanent trust record - foundational document',
          },
          'Trustee Resolution': {
            years: 7,
            reason: 'ATO distribution substantiation - Section 100A ITAA 1936 compliance',
          },
          'Trustee Minutes': {
            years: 7,
            reason: 'ATO distribution substantiation - governance evidence',
          },
          'Beneficiary Declaration': {
            years: 7,
            reason: 'Beneficiary entitlement evidence',
          },
          'Distribution Minutes': {
            years: 7,
            reason: 'ATO distribution evidence - income allocation substantiation',
          },
          'Annual Financial Statements': {
            years: 7,
            reason: 'ATO income tax substantiation',
          },
          'Tax Return': {
            years: 7,
            reason: 'ATO requirement - Section 254 of Tax Administration Act 1953',
          },
          'Beneficiary Consent': {
            years: 7,
            reason: 'Beneficiary agreement evidence',
          },
          'Trustee Appointment': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Trustee Resignation': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Variation to Trust Deed': {
            years: 15,
            reason: 'Permanent trust amendment record',
          },
          'Appointor Appointment': {
            years: 15,
            reason: 'Permanent governance record - appointor controls trust',
          },
          'Appointor Resignation': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Guardian Appointment': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Income Distribution Statement': {
            years: 7,
            reason: 'ATO distribution evidence',
          },
          'Capital Gains Tax Election': {
            years: 7,
            reason: 'ATO CGT streaming evidence',
          },
          'Streaming Resolution': {
            years: 7,
            reason: 'ATO streaming election evidence',
          },
          'Trust Correspondence': {
            years: 7,
            reason: 'ATO audit trail + governance evidence',
          },
          'Actuarial Certificate': {
            years: 7,
            reason: 'ATO tax deduction substantiation',
          },
        },
      },
      'family-trust': {
        documentTypes: [
          'Trust Deed',
          'Family Trust Election',
          'Trustee Resolution',
          'Trustee Minutes',
          'Beneficiary Declaration',
          'Distribution Minutes',
          'Annual Financial Statements',
          'Tax Return',
          'Beneficiary Consent',
          'Trustee Appointment',
          'Trustee Resignation',
          'Variation to Trust Deed',
          'Appointor Appointment',
          'Appointor Resignation',
          'Interpositionary Trust Election',
          'Loss Trust Election',
          'Revocation of Family Trust Election',
          'Income Distribution Statement',
          'Trust Correspondence',
          'Actuarial Certificate',
        ],
        tagCategories: {
          'family-trust': ['fte', 'family-trust-election', 'beneficiary', 'trustee-resolution', 'interpositionary'],
          financial: ['income', 'expense', 'distribution', 'capital-gain'],
          compliance: ['tax', 'gst', 'bas', 'actuarial'],
          governance: ['trustee', 'appointor', 'beneficiary', 'resolution', 'minutes', 'correspondence'],
        },
        retentionRules: {
          'Trust Deed': {
            years: 15,
            reason: 'Permanent trust record - foundational document',
          },
          'Family Trust Election': {
            years: 5,
            reason: 'ATO Family Trust Election requirement - Section 272-80 ITAA 1936 - 5 years from FTE date',
          },
          'Trustee Resolution': {
            years: 7,
            reason: 'ATO distribution substantiation - Section 100A ITAA 1936 compliance',
          },
          'Trustee Minutes': {
            years: 7,
            reason: 'ATO distribution substantiation - governance evidence',
          },
          'Beneficiary Declaration': {
            years: 7,
            reason: 'Beneficiary entitlement evidence',
          },
          'Distribution Minutes': {
            years: 7,
            reason: 'ATO distribution evidence - income allocation substantiation',
          },
          'Annual Financial Statements': {
            years: 7,
            reason: 'ATO income tax substantiation',
          },
          'Tax Return': {
            years: 7,
            reason: 'ATO requirement - Section 254 of Tax Administration Act 1953',
          },
          'Beneficiary Consent': {
            years: 7,
            reason: 'Beneficiary agreement evidence',
          },
          'Trustee Appointment': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Trustee Resignation': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Variation to Trust Deed': {
            years: 15,
            reason: 'Permanent trust amendment record',
          },
          'Appointor Appointment': {
            years: 15,
            reason: 'Permanent governance record - appointor controls trust',
          },
          'Appointor Resignation': {
            years: 15,
            reason: 'Permanent governance record',
          },
          'Interpositionary Trust Election': {
            years: 5,
            reason: 'ATO interpositionary trust election - Section 272-80 ITAA 1936',
          },
          'Loss Trust Election': {
            years: 5,
            reason: 'ATO loss trust election - Section 272-80 ITAA 1936',
          },
          'Revocation of Family Trust Election': {
            years: 5,
            reason: 'ATO revocation evidence - Section 272-80 ITAA 1936',
          },
          'Income Distribution Statement': {
            years: 7,
            reason: 'ATO distribution evidence',
          },
          'Trust Correspondence': {
            years: 7,
            reason: 'ATO audit trail + governance evidence',
          },
          'Actuarial Certificate': {
            years: 7,
            reason: 'ATO tax deduction substantiation',
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

          // Special handling for Family Trust Election
          if (docType === 'Family Trust Election' && targetDomain === 'family-trust') {
            suggestion.notes = 'CRITICAL: Family Trust Election must be retained for 5 years from FTE date, not EOFY. This affects the entire trust structure.';
          }
        }

        // Add category tag based on document type
        // Financial documents → financial tag
        if (['Invoice', 'Receipt', 'Contract', 'Tax Document', 'Tax Return', 'Tax Assessment',
             'Bank Statement', 'Investment Statement', 'Financial Statement',
             'Unit Distribution Statement', 'Income Distribution Statement',
             'Capital Account Statement', 'Balance Sheet', 'Cash Flow Statement',
             'Income Statement', 'Statement of Changes', 'Equity Statement',
             'Superannuation Statement', 'Dividend Statement', 'Loan Document',
             'Mortgage Statement', 'Rate Notice', 'Purchase Order',
             'Credit Note', 'Debit Note', 'Unit Statement', 'Unitholder Statement'].includes(docType)) {
          if (!suggestion.tags.includes('financial')) {
            suggestion.tags.push('financial');
          }
        }
        // Legal documents → legal tag
        if (['Contract', 'Legal Document', 'Will', 'Power of Attorney', 'License', 'Permit',
            'Trust Deed', 'Trustee Resolution', 'Trustee Appointment', 'Lease Agreement',
            'Loan Agreement', 'Employee Contract', 'Car Lease', 'Car Registration'].includes(docType)) {
          if (!suggestion.tags.includes('legal')) {
            suggestion.tags.push('legal');
          }
        }
        // Insurance documents → insurance tag
        if (['Insurance Policy', 'Insurance Certificate', 'Insurance Claim'].includes(docType)) {
          if (!suggestion.tags.includes('insurance')) {
            suggestion.tags.push('insurance');
          }
        }
        // Medical documents → medical tag
        if (['Medical Receipt', 'Health Record', 'Referral Letter', 'Test Results', 'Prescription'].includes(docType)) {
          if (!suggestion.tags.includes('medical')) {
            suggestion.tags.push('medical');
          }
        }
        // HR documents → hr tag
        if (['Employee Record', 'Payroll Record', 'Pay Slip', 'Timesheet',
             'Termination Letter', 'Warning Letter'].includes(docType)) {
          if (!suggestion.tags.includes('hr')) {
            suggestion.tags.push('hr');
          }
        }
        // Corporate reporting documents → reporting tag
        if (['Balance Sheet', 'Cash Flow Statement', 'Income Statement',
             'Statement of Changes', 'Equity Statement'].includes(docType)) {
          if (!suggestion.tags.includes('reporting')) {
            suggestion.tags.push('reporting');
          }
        }
        // Trust governance documents → governance tag
        if (TaxonomyExpert.isTrustType(targetDomain) &&
            ['Trust Deed', 'Trustee Resolution', 'Trustee Minutes', 'Beneficiary Declaration',
             'Distribution Minutes', 'Trustee Appointment', 'Appointor Appointment',
             'Family Trust Election', 'Interpositionary Trust Election',
             'Trust Correspondence'].includes(docType)) {
          if (!suggestion.tags.includes('governance')) {
            suggestion.tags.push('governance');
          }
        }
        // Vehicle documents → vehicle tag
        if (['Car Lease', 'Car Registration'].includes(docType)) {
          if (!suggestion.tags.includes('vehicle')) {
            suggestion.tags.push('vehicle');
          }
        }
        // Household documents → household tag
        if (['Utility Bill', 'Warranty Document', 'Rate Notice'].includes(docType)) {
          if (!suggestion.tags.includes('household')) {
            suggestion.tags.push('household');
          }
        }
        // Education documents → education tag
        if (['Education Record'].includes(docType)) {
          if (!suggestion.tags.includes('education')) {
            suggestion.tags.push('education');
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

  /**
   * Get all supported trust types
   */
  static getSupportedTrustTypes(): string[] {
    return ['unit-trust', 'discretionary-trust', 'family-trust'];
  }

  /**
   * Check if entity type is a trust
   */
  static isTrustType(entity: string): boolean {
    return TaxonomyExpert.getSupportedTrustTypes().includes(entity);
  }

  /**
   * Get FTE retention warning for family trusts
   * Returns retention until date and warning message
   */
  getFTERetentionWarning(fteDate: Date): {
    retentionUntil: Date;
    warning: string;
  } {
    const retentionUntil = new Date(fteDate);
    retentionUntil.setFullYear(retentionUntil.getFullYear() + 5);

    return {
      retentionUntil,
      warning: `Family Trust Election (dated ${fteDate.toISOString().split('T')[0]}) must be retained until ${retentionUntil.toISOString().split('T')[0]} (5 years from FTE date, not EOFY). Section 272-80 ITAA 1936 requirement. This document is critical for the trust's tax structure.`,
    };
  }

  /**
   * Get supported domains for a country
   */
  getSupportedDomains(): Domain[] {
    const countryData = this.taxonomies[this.country];
    if (!countryData) {
      return [];
    }
    return Object.keys(countryData.domains) as Domain[];
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
