// $PAI_DIR/lib/recordsmanager/SensitivityExpert.test.ts
/**
 * Sensitivity Expert Tests
 * Comprehensive test suite for document classification
 */

import { describe, it, expect } from 'bun:test';
import { SensitivityExpert, SensitivityLevel } from './SensitivityExpert';

describe('SensitivityExpert', () => {
  const expert = new SensitivityExpert();

  describe('Four-Tier Classification Model', () => {
    it('should classify public documents correctly', () => {
      const result = expert.classifyDocument('Press_Release_2025.pdf');

      expect(result.level).toBe('public');
      expect(result.color).toBe('#00C853'); // Green
      expect(result.tags).toContain('public');
      expect(result.requires.encryption).toBe(false);
      expect(result.requires.accessControl).toBe(false);
    });

    it('should classify internal documents correctly', () => {
      const result = expert.classifyDocument('Internal_Policy_HR.pdf');

      expect(result.level).toBe('internal');
      expect(result.color).toBe('#FFD600'); // Yellow
      expect(result.tags).toContain('internal');
      expect(result.requires.accessControl).toBe(true);
    });

    it('should classify confidential documents correctly', () => {
      const result = expert.classifyDocument('Invoice_ACME_Corp.pdf');

      expect(result.level).toBe('confidential');
      expect(result.color).toBe('#FF6D00'); // Orange
      expect(result.tags).toContain('confidential');
      expect(result.requires.encryption).toBe(true);
      expect(result.requires.auditLogging).toBe(true);
    });

    it('should classify restricted documents correctly', () => {
      const result = expert.classifyDocument('Social_Security_Card.pdf');

      expect(result.level).toBe('restricted');
      expect(result.color).toBe('#D50000'); // Red
      expect(result.tags).toContain('restricted');
      expect(result.requires.encryption).toBe(true);
      expect(result.requires.dlp).toBe(true);
    });
  });

  describe('HIPAA PHI Detection', () => {
    it('should detect PHI in medical records', () => {
      const content = `
        Patient: John Doe
        SSN: 123-45-6789
        DOB: 01/15/1980
        Phone: 555-123-4567
        Email: john.doe@example.com
      `;

      expect(expert.containsPHI(content)).toBe(true);
    });

    it('should classify medical records as restricted', () => {
      const content = `
        MEDICAL RECORD
        Patient Name: Jane Smith
        Date: 12/01/2025
        Medical Record #: MR12345
        Phone: 555-123-4567
        Email: jane.smith@example.com
      `;

      const result = expert.classifyDocument('Medical_Record.pdf', content);

      expect(result.level).toBe('restricted');
      expect(result.industrySpecific?.type).toBe('HIPAA');
      expect(result.reasoning).toContain('Contains Protected Health Information (PHI) - HIPAA');
    });

    it('should not detect PHI with insufficient identifiers', () => {
      const content = 'Date: 01/15/1980';

      expect(expert.containsPHI(content)).toBe(false);
    });
  });

  describe('PCI-DSS Detection', () => {
    it('should detect credit card numbers', () => {
      const content = 'Card Number: 4532-1234-5678-9010';

      expect(expert.containsCardholderData(content)).toBe(true);
    });

    it('should classify cardholder data as restricted', () => {
      const content = `
        Credit Card: 4532123456789010
        Expiry: 12/25
        CVC: 123
      `;

      const result = expert.classifyDocument('Payment_Details.pdf', content);

      expect(result.level).toBe('restricted');
      expect(result.industrySpecific?.type).toBe('PCI-DSS');
      expect(result.reasoning).toContain('Contains cardholder data - PCI-DSS');
    });

    it('should detect various card formats', () => {
      const visa = 'Card: 4123456789012';
      const mastercard = 'Card: 5412345678901234';
      const amex = 'Card: 371234567890123';

      expect(expert.containsCardholderData(visa)).toBe(true);
      expect(expert.containsCardholderData(mastercard)).toBe(true);
      expect(expert.containsCardholderData(amex)).toBe(true);
    });
  });

  describe('PII Detection', () => {
    it('should detect PII in documents', () => {
      const content = `
        Name: John Smith
        Address: 123 Main Street
        Email: john.smith@example.com
        Phone: 555-987-6543
      `;

      expect(expert.containsPII(content)).toBe(true);
    });

    it('should classify PII documents as confidential', () => {
      const content = `
        Employee Record
        Name: Jane Doe
        Email: jane.doe@company.com
        Phone: 555-123-4567
      `;

      const result = expert.classifyDocument('Employee_Record.pdf', content);

      expect(result.level).toBe('confidential');
      expect(result.industrySpecific?.type).toBe('GDPR');
    });
  });

  describe('Legal Privilege Detection', () => {
    it('should detect attorney-client privilege', () => {
      const content = `
        ATTORNEY-CLIENT PRIVILEGED COMMUNICATION
        This email is confidential and privileged.
      `;

      const result = expert.classifyDocument('Legal_Memo.pdf', content);

      expect(result.level).toBe('restricted');
      expect(result.industrySpecific?.type).toBe('Legal');
    });

    it('should detect settlement negotiations', () => {
      const content = 'Settlement Agreement - Confidential';

      const result = expert.classifyDocument('Settlement_Document.pdf', content);

      expect(result.level).toBe('restricted');
      expect(result.industrySpecific?.type).toBe('Legal');
    });
  });

  describe('Trust Document Sensitivity', () => {
    it('should classify Trust Deed as confidential', () => {
      const result = expert.classifyDocument('Trust_Deed.pdf', undefined, 'family-trust');

      expect(result.level).toBe('confidential');
      expect(result.reasoning).toContain('Trust document type: Trust Deed');
    });

    it('should classify FTE as restricted', () => {
      const result = expert.classifyDocument(
        'Family_Trust_Election_2025.pdf',
        undefined,
        'family-trust'
      );

      expect(result.level).toBe('restricted');
      expect(result.reasoning.some(r => r.includes('Trust document type: Family Trust Election'))).toBe(true);
    });

    it('should warn about FTE under-classification', () => {
      const validation = expert.validateSensitivity(
        'Family Trust Election (FTE)',
        'confidential',
        'family-trust'
      );

      expect(validation.appropriate).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
      expect(validation.suggestions).toContain('Elevate to RESTRICTED for proper protection');
    });
  });

  describe('Document Type Mappings', () => {
    it('should map invoices to confidential', () => {
      const result = expert.classifyDocument('INV-2025-001.pdf');

      expect(result.level).toBe('confidential');
    });

    it('should map tax returns to confidential', () => {
      const result = expert.classifyDocument('Tax_Return_2024.pdf');

      expect(result.level).toBe('confidential');
    });

    it('should map contracts to confidential', () => {
      const result = expert.classifyDocument('Service_Agreement_Contract.pdf');

      expect(result.level).toBe('confidential');
    });

    it('should map press releases to public', () => {
      const result = expert.classifyDocument('Press_Release_Product_Launch.pdf');

      expect(result.level).toBe('public');
    });
  });

  describe('Security Requirements', () => {
    it('should return correct security requirements for public', () => {
      const req = expert.getSecurityRequirements('public');

      expect(req.encryption).toBe(false);
      expect(req.accessControl).toBe(false);
      expect(req.labeling).toBe(false);
      expect(req.auditLogging).toBe(false);
      expect(req.dlp).toBe(false);
    });

    it('should return correct security requirements for internal', () => {
      const req = expert.getSecurityRequirements('internal');

      expect(req.encryption).toBe(false);
      expect(req.accessControl).toBe(true);
      expect(req.labeling).toBe(true);
    });

    it('should return correct security requirements for confidential', () => {
      const req = expert.getSecurityRequirements('confidential');

      expect(req.encryption).toBe(true);
      expect(req.accessControl).toBe(true);
      expect(req.labeling).toBe(true);
      expect(req.auditLogging).toBe(true);
      expect(req.dlp).toBe(true);
    });

    it('should return correct security requirements for restricted', () => {
      const req = expert.getSecurityRequirements('restricted');

      expect(req.encryption).toBe(true);
      expect(req.accessControl).toBe(true);
      expect(req.labeling).toBe(true);
      expect(req.auditLogging).toBe(true);
      expect(req.dlp).toBe(true);
    });
  });

  describe('Tags by Level', () => {
    it('should return correct tags for public', () => {
      const tags = expert.getTagsForLevel('public');

      expect(tags).toContain('public');
      expect(tags).toContain('published');
      expect(tags).toContain('external');
    });

    it('should return correct tags for internal', () => {
      const tags = expert.getTagsForLevel('internal');

      expect(tags).toContain('internal');
      expect(tags).toContain('employee-only');
      expect(tags).toContain('company-internal');
    });

    it('should return correct tags for confidential', () => {
      const tags = expert.getTagsForLevel('confidential');

      expect(tags).toContain('confidential');
      expect(tags).toContain('business-sensitive');
      expect(tags).toContain('proprietary');
    });

    it('should return correct tags for restricted', () => {
      const tags = expert.getTagsForLevel('restricted');

      expect(tags).toContain('restricted');
      expect(tags).toContain('highly-confidential');
      expect(tags).toContain('trade-secret');
    });
  });

  describe('Validation', () => {
    it('should warn about under-classification', () => {
      const validation = expert.validateSensitivity('Tax Return', 'public', 'household');

      expect(validation.appropriate).toBe(false);
      expect(validation.warnings.length).toBeGreaterThan(0);
    });

    it('should suggest correct classification for tax returns', () => {
      const validation = expert.validateSensitivity('Tax Return', 'public', 'household');

      expect(validation.suggestions).toContain('Consider elevating to CONFIDENTIAL');
    });

    it('should pass correct classification', () => {
      const validation = expert.validateSensitivity('Tax Return', 'confidential', 'household');

      expect(validation.appropriate).toBe(true);
      expect(validation.warnings.length).toBe(0);
    });
  });

  describe('Confidence Levels', () => {
    it('should have high confidence for known document types', () => {
      const result = expert.classifyDocument('Invoice_ACME_2025.pdf');

      expect(result.confidence).toBe('high');
    });

    it('should have medium confidence for keyword matches', () => {
      const result = expert.classifyDocument('Important_Document.pdf', 'This document is confidential');

      expect(result.confidence).toBe('medium');
    });

    it('should have low confidence for ambiguous documents', () => {
      const result = expert.classifyDocument('Document.pdf');

      expect(result.confidence).toBe('low');
    });
  });

  describe('Static Methods', () => {
    it('should return supported levels', () => {
      const levels = SensitivityExpert.getSupportedLevels();

      expect(levels).toEqual(['public', 'internal', 'confidential', 'restricted']);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should classify bank statement with account numbers', () => {
      const content = `
        BANK STATEMENT
        Account: 123-456-789
      `;

      const result = expert.classifyDocument('Bank_Statement_Jan2025.pdf', content);

      expect(result.level).toBe('confidential');
      expect(result.tags).toContain('confidential');
    });

    it('should elevate bank statement to restricted with SSN', () => {
      const content = `
        BANK STATEMENT
        Account: 123-456-789
        SSN: 123-45-6789
      `;

      const result = expert.classifyDocument('Bank_Statement_Jan2025.pdf', content);

      expect(result.level).toBe('restricted');
      expect(result.tags).toContain('restricted');
    });

    it('should classify marketing material as public', () => {
      const result = expert.classifyDocument('Product_Brochure_2025.pdf');

      expect(result.level).toBe('public');
      expect(result.tags).toContain('public');
    });

    it('should classify internal procedure as internal', () => {
      const result = expert.classifyDocument('SOP_HR_Onboarding.pdf');

      expect(result.level).toBe('internal');
      expect(result.tags).toContain('internal');
    });

    it('should classify security vulnerability report as restricted', () => {
      const result = expert.classifyDocument('Security_Vulnerability_Report.pdf');

      expect(result.level).toBe('restricted');
      expect(result.tags).toContain('restricted');
    });
  });
});
