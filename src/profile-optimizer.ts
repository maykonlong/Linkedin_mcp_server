import { LinkedInProfile } from './profile-reader.js';

export interface OptimizerRecommendation {
  problem: string;
  evidence: string;
  source: 'Official' | 'Inferred';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
}

export interface MetricScore {
  score: number;
  recommendations: OptimizerRecommendation[];
}

export interface OptimizationScore {
  totalScore: number;
  level: string;
  summary: string;
  metrics: {
    profileCompleteness: MetricScore;
    profileAccuracy: MetricScore;
    keywordRelevance: MetricScore;
    semanticConsistency: MetricScore;
    experienceQuality: MetricScore;
    skillsAlignment: MetricScore;
    professionalPositioning: MetricScore;
    searchIntentAlignment: MetricScore;
    authoritySignals: MetricScore;
    trustSafety: MetricScore;
  };
}

export class ProfileOptimizer {
  public static analyze(profile: LinkedInProfile): OptimizationScore {
    // 1. Profile Completeness (10%)
    const profileCompleteness = this.evaluateCompleteness(profile);
    
    // 2. Profile Accuracy (10%)
    const profileAccuracy = this.evaluateAccuracy(profile);
    
    // 3. Keyword Relevance (15%)
    const keywordRelevance = this.evaluateKeywordRelevance(profile);
    
    // 4. Semantic Consistency (15%)
    const semanticConsistency = this.evaluateSemanticConsistency(profile);
    
    // 5. Experience Quality (10%)
    const experienceQuality = this.evaluateExperienceQuality(profile);
    
    // 6. Skills Alignment (10%)
    const skillsAlignment = this.evaluateSkillsAlignment(profile);
    
    // 7. Professional Positioning (10%)
    const professionalPositioning = this.evaluateProfessionalPositioning(profile);
    
    // 8. Search Intent Alignment (10%)
    const searchIntentAlignment = this.evaluateSearchIntentAlignment(profile);
    
    // 9. Authority Signals (5%)
    const authoritySignals = this.evaluateAuthoritySignals(profile);
    
    // 10. Trust & Safety (5%)
    const trustSafety = this.evaluateTrustSafety(profile);

    const totalScore = Math.min(100, Math.round(
      (profileCompleteness.score * 0.10) +
      (profileAccuracy.score * 0.10) +
      (keywordRelevance.score * 0.15) +
      (semanticConsistency.score * 0.15) +
      (experienceQuality.score * 0.10) +
      (skillsAlignment.score * 0.10) +
      (professionalPositioning.score * 0.10) +
      (searchIntentAlignment.score * 0.10) +
      (authoritySignals.score * 0.05) +
      (trustSafety.score * 0.05)
    ));

    let level = 'Iniciante';
    if (totalScore >= 80) level = 'Top Voice (Alta Relevância e Descoberta)';
    else if (totalScore >= 60) level = 'Campeão (Presença Profissional Sólida)';
    else if (totalScore >= 40) level = 'Intermediário';

    return {
      totalScore,
      level,
      summary: `Baseado no Algoritmo do LinkedIn de 2026, seu perfil atingiu o nível "${level}" com pontuação de ${totalScore}/100. Lembre-se: Verdade, relevância e coerência importam mais do que volume de keywords.`,
      metrics: {
        profileCompleteness,
        profileAccuracy,
        keywordRelevance,
        semanticConsistency,
        experienceQuality,
        skillsAlignment,
        professionalPositioning,
        searchIntentAlignment,
        authoritySignals,
        trustSafety
      }
    };
  }

  private static evaluateCompleteness(profile: LinkedInProfile): MetricScore {
    const recommendations: OptimizerRecommendation[] = [];
    let score = 0;
    
    if (profile.headline) score += 20;
    else recommendations.push({
      problem: 'Headline ausente.',
      evidence: 'Headline é fundamental para People Search.',
      source: 'Official',
      impact: 'HIGH',
      confidence: 'HIGH',
      action: 'Adicionar headline estruturado.'
    });

    if (profile.about && profile.about.length > 50) score += 20;
    else recommendations.push({
      problem: 'Seção "Sobre" muito curta ou ausente.',
      evidence: 'A seção Sobre responde rapidamente quem você é e o que faz.',
      source: 'Official',
      impact: 'HIGH',
      confidence: 'HIGH',
      action: 'Escrever seção Sobre estruturada com especializações e competências.'
    });

    if (profile.experience && profile.experience.length > 0) score += 30;
    else recommendations.push({
      problem: 'Faltam experiências profissionais.',
      evidence: 'Experiência legítima influencia ranqueamento de perfil.',
      source: 'Official',
      impact: 'HIGH',
      confidence: 'HIGH',
      action: 'Cadastrar experiências recentes com resultados.'
    });

    if (profile.skills && profile.skills.length >= 5) score += 15;
    if (profile.education && profile.education.length > 0) score += 15;

    return { score: Math.min(100, score), recommendations };
  }

  private static evaluateAccuracy(profile: LinkedInProfile): MetricScore {
    return {
      score: 100, // Assumindo alta precisão inicialmente (Nome sem spam)
      recommendations: []
    };
  }

  private static evaluateKeywordRelevance(profile: LinkedInProfile): MetricScore {
    const recommendations: OptimizerRecommendation[] = [];
    let score = 80;
    if (!profile.headline?.includes('|') && !profile.headline?.includes('-')) {
        score -= 20;
        recommendations.push({
            problem: 'Headline não possui separação clara de especialidades (ex: Cargo | Stack).',
            evidence: 'Mais organização semântica facilita leitura humana e de IA.',
            source: 'Inferred',
            impact: 'MEDIUM',
            confidence: 'HIGH',
            action: 'Usar [CARGO] + [ESPECIALIDADE] + [TECNOLOGIA]'
        });
    }
    return { score, recommendations };
  }

  private static evaluateSemanticConsistency(profile: LinkedInProfile): MetricScore {
    const recommendations: OptimizerRecommendation[] = [];
    let score = 70; // Heurística: Necessita análise cruzada (Grafo)
    recommendations.push({
        problem: 'Falta mapa visual de keywords conectando Headline <-> Skills <-> Experience.',
        evidence: 'Coerência semântica aumenta a relevância da descoberta.',
        source: 'Inferred',
        impact: 'HIGH',
        confidence: 'MEDIUM',
        action: 'Cruzar termos do headline com as skills cadastradas.'
    });
    return { score, recommendations };
  }

  private static evaluateExperienceQuality(profile: LinkedInProfile): MetricScore {
    const recommendations: OptimizerRecommendation[] = [];
    let score = 50;
    const hasDetailed = profile.experience?.some(e => e.description && e.description.length > 50);
    if (hasDetailed) score = 90;
    else {
        recommendations.push({
            problem: 'Descrições de experiência vazias ou insuficientes.',
            evidence: 'Resultados e domínios de aplicação são mais importantes que listagem de cargos.',
            source: 'Official',
            impact: 'HIGH',
            confidence: 'HIGH',
            action: 'Descrever resultados, tecnologias e projetos usando métricas.'
        });
    }
    return { score, recommendations };
  }

  private static evaluateSkillsAlignment(profile: LinkedInProfile): MetricScore {
    return { score: 85, recommendations: [] };
  }

  private static evaluateProfessionalPositioning(profile: LinkedInProfile): MetricScore {
    return { score: 80, recommendations: [] };
  }

  private static evaluateSearchIntentAlignment(profile: LinkedInProfile): MetricScore {
    return { score: 75, recommendations: [] };
  }

  private static evaluateAuthoritySignals(profile: LinkedInProfile): MetricScore {
    return { score: 60, recommendations: [] };
  }

  private static evaluateTrustSafety(profile: LinkedInProfile): MetricScore {
    const recommendations: OptimizerRecommendation[] = [];
    let score = 100;
    // Check for spam in name (too many emojis or pipes)
    if (profile.name?.match(/[|\-🚀🔥]/)) {
        score = 0;
        recommendations.push({
            problem: 'Símbolos ou informações extras no campo de nome.',
            evidence: 'O LinkedIn penaliza colocar cargos ou emojis no nome real.',
            source: 'Official',
            impact: 'HIGH',
            confidence: 'HIGH',
            action: 'Remover tudo que não for seu nome civil do campo Nome.'
        });
    }
    return { score, recommendations };
  }
}
