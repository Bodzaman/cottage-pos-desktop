/**
 * Legacy Code Detection for Frontend
 * 
 * Utility functions to detect and prevent legacy patterns in frontend code.
 */

export interface LegacyIssue {
  filePath: string;
  lineNumber: number;
  issueType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedFix: string;
  codeSnippet: string;
}

export class FrontendLegacyDetector {
  private hardcodedUrlPatterns = [
    /https:\/\/[a-zA-Z0-9]+\.supabase\.co/,
    /http:\/\/localhost:\d+/,
    /https:\/\/api\.[a-zA-Z0-9]+\.com/
  ];

  private hardcodedCredentialPatterns = [
    /eyJ[A-Za-z0-9+/=]+/, // JWT tokens
    /sk_[a-zA-Z0-9]+/,    // Stripe secret keys
    /pk_[a-zA-Z0-9]+/,    // Stripe public keys
  ];

  private legacyTablePatterns = [
    /table\(["']categories["']\)/,
    /table\(["']orders["']\)/,
    /table\(["']users["']\)/,
    /from\(["']categories["']\)/,
    /from\(["']orders["']\)/,
    /from\(["']users["']\)/,
  ];

  /**
   * Scan code string for legacy patterns
   */
  scanCode(code: string, filePath = 'unknown'): LegacyIssue[] {
    const issues: LegacyIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Check for hardcoded URLs
      this.hardcodedUrlPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            filePath,
            lineNumber,
            issueType: 'hardcoded-url',
            description: 'Hardcoded URL detected',
            severity: 'high',
            suggestedFix: 'Use environment variables for URLs',
            codeSnippet: line.trim()
          });
        }
      });

      // Check for hardcoded credentials
      this.hardcodedCredentialPatterns.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            filePath,
            lineNumber,
            issueType: 'hardcoded-credential',
            description: 'Potential hardcoded credential detected',
            severity: 'critical',
            suggestedFix: 'Use environment variables for credentials',
            codeSnippet: line.trim()
          });
        }
      });

      // Check for legacy table references
      this.legacyTablePatterns.forEach(pattern => {
        if (pattern.test(line)) {
          issues.push({
            filePath,
            lineNumber,
            issueType: 'legacy-table',
            description: 'Legacy table name detected',
            severity: 'medium',
            suggestedFix: 'Use Tables constant from databaseConstants',
            codeSnippet: line.trim()
          });
        }
      });

      // Check for inconsistent naming
      if (/\b(?:active)\b(?!.*is_active)/.test(line)) {
        issues.push({
          filePath,
          lineNumber,
          issueType: 'inconsistent-naming',
          description: 'Inconsistent field naming detected',
          severity: 'low',
          suggestedFix: 'Use consistent naming pattern (e.g., is_active)',
          codeSnippet: line.trim()
        });
      }
    });

    return issues;
  }

  /**
   * Generate a report from legacy issues
   */
  generateReport(issues: LegacyIssue[]): string {
    if (issues.length === 0) {
      return '✅ No legacy code issues detected!';
    }

    const bySeverity = {
      critical: issues.filter(i => i.severity === 'critical'),
      high: issues.filter(i => i.severity === 'high'),
      medium: issues.filter(i => i.severity === 'medium'),
      low: issues.filter(i => i.severity === 'low')
    };

    const report = [];
    report.push('🔍 FRONTEND LEGACY CODE DETECTION REPORT');
    report.push('=' .repeat(50));
    report.push(`Total Issues Found: ${issues.length}`);
    report.push('');

    // Summary by severity
    report.push('📊 ISSUES BY SEVERITY:');
    Object.entries(bySeverity).forEach(([severity, severityIssues]) => {
      if (severityIssues.length > 0) {
        const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '⚪' }[severity as keyof typeof bySeverity];
        report.push(`  ${emoji} ${severity.toUpperCase()}: ${severityIssues.length} issues`);
      }
    });
    report.push('');

    return report.join('\n');
  }

  /**
   * Auto-fix legacy table references in code
   */
  fixLegacyTableReferences(code: string): string {
    let fixedCode = code;

    const replacements = {
      "table('categories')": "table(Tables.MENU_CATEGORIES)",
      'table("categories")': 'table(Tables.MENU_CATEGORIES)',
      "table('orders')": "table(Tables.ORDER_TRANSACTIONS)",
      'table("orders")': 'table(Tables.ORDER_TRANSACTIONS)',
      "table('users')": "table(Tables.USER_ACCOUNTS)",
      'table("users")': 'table(Tables.USER_ACCOUNTS)',
      "from('categories')": "from(Tables.MENU_CATEGORIES)",
      'from("categories")': 'from(Tables.MENU_CATEGORIES)',
      "from('orders')": "from(Tables.ORDER_TRANSACTIONS)",
      'from("orders")': 'from(Tables.ORDER_TRANSACTIONS)',
      "from('users')": "from(Tables.USER_ACCOUNTS)",
      'from("users")': 'from(Tables.USER_ACCOUNTS)',
    };

    let modified = false;
    Object.entries(replacements).forEach(([oldPattern, newPattern]) => {
      if (fixedCode.includes(oldPattern)) {
        fixedCode = fixedCode.replace(new RegExp(oldPattern, 'g'), newPattern);
        modified = true;
      }
    });

    // Add import if modified and not already present
    if (modified && !fixedCode.includes("import { Tables }")) {
      const lines = fixedCode.split('\n');
      let lastImportIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          lastImportIndex = i;
        }
      }
      
      lines.splice(lastImportIndex + 1, 0, "import { Tables } from 'utils/databaseConstants';");
      fixedCode = lines.join('\n');
    }

    return fixedCode;
  }
}

/**
 * Runtime validation for development
 * Note: Only logs issues, doesn't crash production
 */
export function validateCodeAtRuntime(code: string, context = 'unknown'): void {
    const detector = new FrontendLegacyDetector();
    const issues = detector.scanCode(code, context);
    
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      console.error(' CRITICAL LEGACY CODE ISSUES DETECTED:', criticalIssues);
    }

    const highIssues = issues.filter(i => i.severity === 'high');
    if (highIssues.length > 0) {
      console.warn('⚠️ HIGH SEVERITY LEGACY CODE ISSUES:', highIssues);
    }
}

/**
 * Check if a string contains legacy patterns
 */
export function hasLegacyPatterns(code: string): boolean {
  const detector = new FrontendLegacyDetector();
  const issues = detector.scanCode(code);
  return issues.length > 0;
}

/**
 * Export singleton instance
 */
export const legacyDetector = new FrontendLegacyDetector();
