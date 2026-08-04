import { LinkedInProfile } from './profile-reader.js';

export interface SeoAnalysisResult {
  score: number;
  level: string;
  summary: string;
  recommendations: string[];
  metrics: {
    headlineScore: number;
    aboutScore: number;
    experienceScore: number;
    skillsScore: number;
  };
}

export class ProfileOptimizer {
  public static analyze(profile: LinkedInProfile): SeoAnalysisResult {
    const recommendations: string[] = [];
    let headlineScore = 0;
    let aboutScore = 0;
    let experienceScore = 0;
    let skillsScore = 0;

    // 1. Análise do Headline / Título (Peso 30%)
    if (!profile.headline) {
      recommendations.push('Adicione um Título (Headline) claro contendo seu cargo principal e tecnologias de destaque.');
    } else {
      const hl = profile.headline;
      if (hl.length >= 30) headlineScore += 15;
      if (hl.includes('|') || hl.includes('•') || hl.includes(' - ') || hl.includes('🚀')) headlineScore += 5;
      
      const techKeywords = ['developer', 'engineer', 'desenvolvedor', 'arquiteto', 'architect', 'full stack', 'backend', 'frontend', 'node', 'react', 'typescript', 'java', 'python', 'cloud', 'aws'];
      const hasTech = techKeywords.some(kw => hl.toLowerCase().includes(kw));
      if (hasTech) headlineScore += 10;
      else recommendations.push('Inclua palavras-chave de cargos/tecnologias buscadas por recrutadores no Título (ex: Desenvolvedor Full Stack | Node.js | React).');
    }

    // 2. Análise da seção "Sobre" / Resumo (Peso 25%)
    if (!profile.about) {
      recommendations.push('Preencha a seção "Sobre" contando sua trajetória, principais projetos, metodologias e tecnologias dominadas.');
    } else {
      const len = profile.about.length;
      if (len > 100) aboutScore += 10;
      if (len > 300) aboutScore += 10;
      if (len > 600) aboutScore += 5;

      if (!profile.about.includes('http') && !profile.about.toLowerCase().includes('contato') && !profile.about.includes('@')) {
        recommendations.push('Adicione um meio de contato direto ou link para portfólio/GitHub na seção "Sobre".');
      }
    }

    // 3. Análise de Experiências (Peso 25%)
    const expCount = profile.experience.length;
    if (expCount === 0) {
      recommendations.push('Cadastre suas experiências profissionais recentes descrevendo conquistas e responsabilidades.');
    } else {
      experienceScore += Math.min(expCount * 8, 20);
      const hasDetailedDesc = profile.experience.some(e => e.description && e.description.length > 50);
      if (hasDetailedDesc) experienceScore += 5;
      else recommendations.push('Detalhe as atividades e resultados obtidos em cada experiência profissional.');
    }

    // 4. Análise de Competências / Skills (Peso 20%)
    const skillsCount = profile.skills.length;
    if (skillsCount < 5) {
      recommendations.push(`Você possui apenas ${skillsCount} competências visíveis. Adicione pelo menos 10 a 15 competências relevantes.`);
      skillsScore += skillsCount * 2;
    } else {
      skillsScore = Math.min(skillsCount * 2, 20);
    }

    const totalScore = headlineScore + aboutScore + experienceScore + skillsScore;
    let level = 'Iniciante';
    if (totalScore >= 80) level = 'Campeão (Alta atratividade)';
    else if (totalScore >= 60) level = 'Intermediário';
    else if (totalScore >= 40) level = 'Básico';

    return {
      score: totalScore,
      level,
      summary: `Seu perfil está classificado como "${level}" com nota ${totalScore}/100 para mecanismos de busca de recrutadores.`,
      recommendations,
      metrics: {
        headlineScore,
        aboutScore,
        experienceScore,
        skillsScore,
      },
    };
  }
}
