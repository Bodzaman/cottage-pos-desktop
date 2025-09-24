// Font Recommendation Engine for Thermal Receipt Design

import { ThermalFont, THERMAL_FONTS } from './thermalFonts';

export interface FontRecommendation {
  font: ThermalFont;
  score: number;
  reasons: string[];
  warnings?: string[];
}

export interface RecommendationCriteria {
  templateType: 'kitchen' | 'foh';
  paperWidth: 58 | 80;
  elementType: 'header' | 'items' | 'totals' | 'footer' | 'notes';
  priority: 'speed' | 'readability' | 'branding' | 'compliance';
}

// Advanced font recommendation engine
export const getSmartFontRecommendations = (criteria: RecommendationCriteria): FontRecommendation[] => {
  const recommendations: FontRecommendation[] = [];
  
  THERMAL_FONTS.forEach(font => {
    let score = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];
    
    // Template type compatibility
    if (criteria.templateType === 'kitchen') {
      if (font.bestFor === 'kitchen' || font.bestFor === 'both') {
        score += 30;
        reasons.push('Optimized for kitchen environments');
      }
      if (font.thermalOptimized) {
        score += 20;
        reasons.push('Thermal printer optimized');
      }
      if (font.category === 'monospace') {
        score += 15;
        reasons.push('Monospace ensures consistent alignment');
      }
    } else {
      if (font.bestFor === 'customer' || font.bestFor === 'both') {
        score += 30;
        reasons.push('Customer-facing design');
      }
      if (font.category === 'sans-serif' && criteria.elementType !== 'items') {
        score += 15;
        reasons.push('Modern, professional appearance');
      }
    }
    
    // Element type specific scoring
    switch (criteria.elementType) {
      case 'header':
        if (font.name === 'Impact' || font.name === 'Montserrat') {
          score += 25;
          reasons.push('Excellent for headers and branding');
        }
        break;
      case 'items':
        if (font.category === 'monospace') {
          score += 20;
          reasons.push('Perfect alignment for itemized lists');
        }
        break;
      case 'totals':
        if (font.category === 'monospace' || font.name === 'Arial') {
          score += 15;
          reasons.push('Clear number presentation');
        }
        break;
      case 'footer':
        if (font.thermalOptimized || font.name === 'Lato') {
          score += 10;
          reasons.push('Good for small footer text');
        }
        break;
    }
    
    // Priority-based scoring
    switch (criteria.priority) {
      case 'speed':
        if (font.thermalOptimized) {
          score += 20;
          reasons.push('Optimized for fast thermal printing');
        }
        break;
      case 'readability':
        if (font.name.includes('Sans') || font.category === 'monospace') {
          score += 15;
          reasons.push('High readability at small sizes');
        }
        break;
      case 'branding':
        if (font.category === 'specialized' || font.name === 'Montserrat') {
          score += 20;
          reasons.push('Professional branding appearance');
        }
        break;
      case 'compliance':
        if (font.name === 'Arial' || font.name === 'Courier') {
          score += 25;
          reasons.push('Industry standard compliance');
        }
        break;
    }
    
    // Paper width considerations
    if (criteria.paperWidth === 58) {
      const optimalSize = font.recommendedSizes.kitchen.optimal;
      if (optimalSize <= 12) {
        score += 10;
        reasons.push('Suitable for narrow 58mm paper');
      } else {
        warnings.push('May be too large for 58mm paper');
      }
    }
    
    // Google Fonts availability bonus
    if (font.googleFont) {
      score += 5;
      reasons.push('Google Fonts integration');
    }
    
    // Add warnings for non-optimal combinations
    if (criteria.templateType === 'kitchen' && !font.thermalOptimized) {
      warnings.push('Not specifically optimized for thermal printing');
    }
    
    if (criteria.templateType === 'foh' && font.category === 'monospace' && criteria.elementType === 'header') {
      warnings.push('Monospace may look too technical for customer headers');
    }
    
    recommendations.push({
      font,
      score,
      reasons,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  });
  
  // Sort by score and return top recommendations
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
};

// Quick preset recommendations
export const getQuickPresets = (templateType: 'kitchen' | 'foh') => {
  if (templateType === 'kitchen') {
    return {
      recommended: THERMAL_FONTS.find(f => f.name === 'JetBrains Mono')!,
      fallback: THERMAL_FONTS.find(f => f.name === 'Courier')!,
      emphasis: THERMAL_FONTS.find(f => f.name === 'IBM Plex Mono')!
    };
  } else {
    return {
      recommended: THERMAL_FONTS.find(f => f.name === 'Inter')!,
      fallback: THERMAL_FONTS.find(f => f.name === 'Arial')!,
      emphasis: THERMAL_FONTS.find(f => f.name === 'Montserrat')!
    };
  }
};

// Font pairing suggestions
export const getFontPairings = (templateType: 'kitchen' | 'foh') => {
  if (templateType === 'kitchen') {
    return [
      {
        name: 'Clear & Fast',
        header: THERMAL_FONTS.find(f => f.name === 'IBM Plex Mono')!,
        body: THERMAL_FONTS.find(f => f.name === 'JetBrains Mono')!,
        description: 'Maximum clarity for busy kitchen environments'
      },
      {
        name: 'Traditional',
        header: THERMAL_FONTS.find(f => f.name === 'Courier')!,
        body: THERMAL_FONTS.find(f => f.name === 'Courier')!,
        description: 'Classic thermal printer look, universal compatibility'
      }
    ];
  } else {
    return [
      {
        name: 'Modern Professional',
        header: THERMAL_FONTS.find(f => f.name === 'Montserrat')!,
        body: THERMAL_FONTS.find(f => f.name === 'Inter')!,
        description: 'Contemporary branding with excellent readability'
      },
      {
        name: 'Friendly & Warm',
        header: THERMAL_FONTS.find(f => f.name === 'Poppins')!,
        body: THERMAL_FONTS.find(f => f.name === 'Lato')!,
        description: 'Welcoming appearance for customer interaction'
      },
      {
        name: 'Technical Precision',
        header: THERMAL_FONTS.find(f => f.name === 'Source Sans Pro')!,
        body: THERMAL_FONTS.find(f => f.name === 'JetBrains Mono')!,
        description: 'Perfect alignment with professional appearance'
      }
    ];
  }
};
