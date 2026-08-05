import { LinkedInProfile } from './profile-reader.js';

export interface ProfileSeoScore {
  score: number;
  recommendations: string[];
}

export interface SearchVisibilityScore {
  score: number;
  recommendations: string[];
}

export interface ContentQualityScore {
  score: number;
  recommendations: string[];
}

export interface EngagementScore {
  score: number;
  recommendations: string[];
}

export interface NetworkScore {
  score: number;
  recommendations: string[];
}

export interface BehaviorScore {
  score: number;
  recommendations: string[];
}

export interface ContentDistributionScore {
  score: number;
  recommendations: string[];
}

export interface OpportunityScore {
  score: number;
  recommendations: string[];
}

export interface OptimizerAnalysisResult {
  totalScore: number;
  level: string;
  summary: string;
  metrics: {
    profileSeo: ProfileSeoScore;
    searchVisibility: SearchVisibilityScore;
    contentQuality: ContentQualityScore;
    engagement: EngagementScore;
    network: NetworkScore;
    behavior: BehaviorScore;
    contentDistribution: ContentDistributionScore;
    opportunity: OpportunityScore;
  };
}

export class ProfileOptimizer {
  public static analyze(profile: LinkedInProfile): OptimizerAnalysisResult {
    // 1. Profile SEO (Nome, Headline, About, etc)
    const profileSeo = this.analyzeProfileSeo(profile);
    
    // 2. Search Visibility (Keywords, Cargo, Skills, Industry)
    const searchVisibility = this.analyzeSearchVisibility(profile);
    
    // 3. Content Quality (Relevância, Originalidade, Utilidade)
    const contentQuality = this.analyzeContentQuality(profile);
    
    // 4. Engagement (Comentários, Reações, Dwell time)
    const engagement = this.analyzeEngagement(profile);
    
    // 5. Network (Conexões, Seguidores, Empresas)
    const network = this.analyzeNetwork(profile);
    
    // 6. Behavior (Quem segue, Pesquisas)
    const behavior = this.analyzeBehavior(profile);
    
    // 7. Content Distribution (Spam, Segurança)
    const contentDistribution = this.analyzeContentDistribution(profile);
    
    // 8. Opportunity (Recruiters, Jobs, Connections)
    const opportunity = this.analyzeOpportunity(profile);

    const totalScore = Math.min(100, Math.round(
      (profileSeo.score * 0.20) +
      (searchVisibility.score * 0.20) +
      (contentQuality.score * 0.15) +
      (engagement.score * 0.15) +
      (network.score * 0.10) +
      (behavior.score * 0.10) +
      (contentDistribution.score * 0.05) +
      (opportunity.score * 0.05)
    ));

    let level = 'Iniciante';
    if (totalScore >= 80) level = 'Top Voice (Alta Relevância)';
    else if (totalScore >= 60) level = 'Campeão (Relevância Sólida)';
    else if (totalScore >= 40) level = 'Intermediário';

    return {
      totalScore,
      level,
      summary: `Baseado no Algoritmo do LinkedIn de 2026, seu perfil atingiu o nível "${level}" com pontuação de ${totalScore}/100.`,
      metrics: {
        profileSeo,
        searchVisibility,
        contentQuality,
        engagement,
        network,
        behavior,
        contentDistribution,
        opportunity
      }
    };
  }

  private static analyzeProfileSeo(profile: LinkedInProfile): ProfileSeoScore {
    const recommendations: string[] = [];
    let score = 0;
    
    if (profile.headline && profile.headline.length > 20) score += 40;
    else recommendations.push('Seu Título (Headline) precisa ser preenchido e detalhado.');

    if (profile.about && profile.about.length > 200) score += 40;
    else recommendations.push('Expanda a seção Sobre para gerar mais aderência ao algoritmo de busca.');

    if (profile.experience && profile.experience.length > 0) score += 20;
    else recommendations.push('Adicione suas experiências profissionais recentes.');

    return { score: Math.min(score, 100), recommendations };
  }

  private static analyzeSearchVisibility(profile: LinkedInProfile): SearchVisibilityScore {
    const recommendations: string[] = [];
    let score = 0;
    
    if (profile.skills && profile.skills.length >= 10) score += 50;
    else recommendations.push('Adicione pelo menos 10 skills estratégicas para SEO.');

    if (profile.experience && profile.experience.length >= 2) score += 50;
    else recommendations.push('Múltiplas experiências aumentam sua proeminência no Search.');

    return { score: Math.min(score, 100), recommendations };
  }

  // Métricas estendidas (Aguardando Especificação de 2026 para calibração exata)
  private static analyzeContentQuality(profile: LinkedInProfile): ContentQualityScore {
    return {
      score: 50,
      recommendations: ['[Pendente] Aguardando extração de posts para avaliar a relevância técnica (LLMs).']
    };
  }

  private static analyzeEngagement(profile: LinkedInProfile): EngagementScore {
    return {
      score: 50,
      recommendations: ['[Pendente] Aguardando integração de métricas de interações e Dwell Time.']
    };
  }

  private static analyzeNetwork(profile: LinkedInProfile): NetworkScore {
    return {
      score: 50,
      recommendations: ['[Pendente] Avaliar se a rede (seguidores/conexões) é densa no nicho tech.']
    };
  }

  private static analyzeBehavior(profile: LinkedInProfile): BehaviorScore {
    return {
      score: 50,
      recommendations: ['[Pendente] Avaliar histórico de engajamento e pesquisa do usuário.']
    };
  }

  private static analyzeContentDistribution(profile: LinkedInProfile): ContentDistributionScore {
    return {
      score: 100, // Presume-se sem restrições/spam
      recommendations: ['Mantenha a qualidade para evitar flags de spam do algoritmo de 2026.']
    };
  }

  private static analyzeOpportunity(profile: LinkedInProfile): OpportunityScore {
    return {
      score: 50,
      recommendations: ['[Pendente] Medir atratividade direta para recrutadores (mensagens e visualizações).']
    };
  }
}
