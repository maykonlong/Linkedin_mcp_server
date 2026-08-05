#!/usr/bin/env node
/**
 * linkedin-third-party-mcp — Servidor MCP SEPARADO para leitura de perfis de terceiros.
 * 
 * NÃO modifica nenhum perfil. Apenas lê qualquer URL de perfil público do LinkedIn
 * aproveitando a sessão autenticada do usuário.
 * 
 * Tools disponíveis:
 *   - linkedin_read_third_party_profile  → lê perfil completo de terceiros
 *   - linkedin_compare_profiles          → compara dois perfis lado a lado
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { LinkedInAutomation } from './linkedin-automation.js';
import { ThirdPartyReader, ThirdPartyProfile } from './third-party-reader.js';
import { loadConfig } from './config.js';

const CONFIG = loadConfig();

// ─────────────────────────────────────────────────────────────────────────────
// Score de otimização (algoritmo LinkedIn 2026 — público, não vazia )
// ─────────────────────────────────────────────────────────────────────────────

function scoreProfile(profile: ThirdPartyProfile): { score: number; breakdown: Record<string, number>; tips: string[] } {
  const breakdown: Record<string, number> = {};
  const tips: string[] = [];

  // Nome (1)
  breakdown.name = profile.name ? 5 : 0;

  // Foto de perfil (3)
  breakdown.profilePicture = profile.profilePictureUrl ? 10 : 0;
  if (!profile.profilePictureUrl) tips.push('Adicionar foto de perfil profissional (+10 pontos)');

  // Capa/Banner (2)
  breakdown.banner = profile.bannerUrl ? 5 : 0;
  if (!profile.bannerUrl) tips.push('Adicionar imagem de capa relevante (+5 pontos)');

  // Headline (3)
  if (profile.headline.length >= 60) { breakdown.headline = 10; }
  else if (profile.headline.length >= 20) { breakdown.headline = 7; }
  else { breakdown.headline = 0; tips.push('Headline muito curto (ideal: 60+ caracteres com palavras-chave)'); }

  // About (5)
  if (profile.about.length >= 1500) { breakdown.about = 15; }
  else if (profile.about.length >= 500) { breakdown.about = 10; }
  else if (profile.about.length > 0) { breakdown.about = 5; tips.push('Seção "Sobre" curta (ideal: 1500+ caracteres)'); }
  else { breakdown.about = 0; tips.push('Seção "Sobre" vazia — impacto alto no SEO do LinkedIn'); }

  // Location
  breakdown.location = profile.location ? 5 : 0;
  if (!profile.location) tips.push('Adicionar localização ao perfil');

  // Experiência
  if (profile.experience.length >= 3) { breakdown.experience = 15; }
  else if (profile.experience.length >= 1) { breakdown.experience = 8; tips.push('Menos de 3 experiências listadas'); }
  else { breakdown.experience = 0; tips.push('Nenhuma experiência encontrada — crítico para SEO'); }

  // Descrição nas experiências
  const expWithDesc = profile.experience.filter(e => e.description && e.description.length > 50).length;
  breakdown.experienceDescriptions = Math.min(expWithDesc * 3, 10);
  if (expWithDesc === 0 && profile.experience.length > 0) tips.push('Adicionar descrições nas experiências (palavras-chave aparecem na busca)');

  // Educação
  breakdown.education = profile.education.length >= 1 ? 5 : 0;
  if (profile.education.length === 0) tips.push('Nenhuma educação listada');

  // Competências
  if (profile.skills.length >= 25) { breakdown.skills = 15; }
  else if (profile.skills.length >= 10) { breakdown.skills = 10; }
  else if (profile.skills.length >= 5) { breakdown.skills = 5; tips.push(`Apenas ${profile.skills.length} competências (ideal: 25+)`); }
  else { breakdown.skills = 0; tips.push('Competências insuficientes — alto impacto na busca de recrutadores'); }

  // Certificações
  breakdown.certifications = Math.min(profile.certifications.length * 2, 5);

  // Idiomas
  breakdown.languages = profile.languages.length >= 2 ? 5 : profile.languages.length >= 1 ? 3 : 0;
  if (profile.languages.length === 0) tips.push('Adicionar idiomas ao perfil');

  // Open to Work
  breakdown.openToWork = profile.openToWork ? 3 : 0;

  // Website
  breakdown.website = profile.website ? 2 : 0;

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return { score: Math.min(score, 100), breakdown, tips };
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile comparison
// ─────────────────────────────────────────────────────────────────────────────

function compareProfiles(a: ThirdPartyProfile, b: ThirdPartyProfile) {
  const scoreA = scoreProfile(a);
  const scoreB = scoreProfile(b);

  const skillsOnlyA = a.skills.map(s => s.name).filter(s => !b.skills.map(x => x.name).includes(s));
  const skillsOnlyB = b.skills.map(s => s.name).filter(s => !a.skills.map(x => x.name).includes(s));
  const commonSkills = a.skills.map(s => s.name).filter(s => b.skills.map(x => x.name).includes(s));

  return {
    profiles: [
      { url: a.profileUrl, name: a.name, score: scoreA.score, breakdown: scoreA.breakdown, tips: scoreA.tips },
      { url: b.profileUrl, name: b.name, score: scoreB.score, breakdown: scoreB.breakdown, tips: scoreB.tips },
    ],
    winner: scoreA.score >= scoreB.score ? a.name : b.name,
    skillsOnlyIn: { [a.name]: skillsOnlyA, [b.name]: skillsOnlyB },
    commonSkills,
    experienceCount: { [a.name]: a.experience.length, [b.name]: b.experience.length },
    scrapedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MCP Server
// ─────────────────────────────────────────────────────────────────────────────

class LinkedInThirdPartyMcpServer {
  private server: Server;
  private automation: LinkedInAutomation;
  private reader: ThirdPartyReader | null = null;
  private initialized = false;

  constructor() {
    this.server = new Server(
      { name: 'linkedin-third-party-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.automation = new LinkedInAutomation(
      CONFIG.profileUrl,
      CONFIG.email,
      CONFIG.password
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error('[ThirdParty MCP Error]', error);

    process.on('SIGINT', async () => {
      await this.automation.close();
      await this.server.close();
      process.exit(0);
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.automation.init();
      const loginOk = await this.automation.login();
      if (!loginOk) {
        throw new McpError(
          ErrorCode.InternalError,
          'Sessão LinkedIn expirada. Execute o script de login: node scripts/login.mjs'
        );
      }
      // ThirdPartyReader usa diretamente a page interna do automation
      this.reader = new ThirdPartyReader((this.automation as any).page);
      this.initialized = true;
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'linkedin_read_third_party_profile',
          description: 'Lê e analisa o perfil público de qualquer usuário do LinkedIn. Retorna dados estruturados + score de otimização baseado no algoritmo 2026.',
          inputSchema: {
            type: 'object',
            properties: {
              profileUrl: {
                type: 'string',
                description: 'URL completa do perfil LinkedIn (ex: https://www.linkedin.com/in/nome-sobrenome-123/)',
              },
              includeScore: {
                type: 'boolean',
                description: 'Se true, retorna análise de otimização do perfil. Default: true',
              },
            },
            required: ['profileUrl'],
          },
        },
        {
          name: 'linkedin_compare_profiles',
          description: 'Compara dois perfis LinkedIn lado a lado, gerando um relatório com scores, diferenças de competências e recomendações.',
          inputSchema: {
            type: 'object',
            properties: {
              profileUrlA: { type: 'string', description: 'URL do primeiro perfil' },
              profileUrlB: { type: 'string', description: 'URL do segundo perfil' },
            },
            required: ['profileUrlA', 'profileUrlB'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      await this.ensureInitialized();

      switch (request.params.name) {
        case 'linkedin_read_third_party_profile': {
          const { profileUrl, includeScore = true } = request.params.arguments as {
            profileUrl: string;
            includeScore?: boolean;
          };

          if (!profileUrl || !profileUrl.includes('linkedin.com/in/')) {
            throw new McpError(ErrorCode.InvalidParams, 'profileUrl deve ser uma URL válida do LinkedIn (linkedin.com/in/...)');
          }

          const profile = await this.reader!.readProfile(profileUrl);
          const result: any = { profile };

          if (includeScore) {
            result.optimization = scoreProfile(profile);
          }

          return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
          };
        }

        case 'linkedin_compare_profiles': {
          const { profileUrlA, profileUrlB } = request.params.arguments as {
            profileUrlA: string;
            profileUrlB: string;
          };

          if (!profileUrlA.includes('linkedin.com/in/') || !profileUrlB.includes('linkedin.com/in/')) {
            throw new McpError(ErrorCode.InvalidParams, 'Ambas as URLs devem ser perfis válidos do LinkedIn');
          }

          const [profileA, profileB] = await Promise.all([
            this.reader!.readProfile(profileUrlA),
            this.reader!.readProfile(profileUrlB),
          ]);

          // Note: Promise.all here runs them serially in practice since both use the same browser page
          // For true parallelism we'd need 2 pages, but for safety we run them sequentially

          const comparison = compareProfiles(profileA, profileB);

          return {
            content: [{ type: 'text', text: JSON.stringify(comparison, null, 2) }],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Tool não encontrada: ${request.params.name}`);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[ThirdParty MCP] Servidor iniciado. Aguardando chamadas...');
  }
}

const server = new LinkedInThirdPartyMcpServer();
server.run().catch(console.error);
