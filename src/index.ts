#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { LinkedInAutomation, Experience, Education } from './linkedin-automation.js';
import { ProfileOptimizer } from './profile-optimizer.js';
import { JobSearch } from './job-search.js';
import { loadConfig } from './config.js';

const CONFIG = loadConfig();
const LINKEDIN_EMAIL = CONFIG.email;
const LINKEDIN_PASSWORD = CONFIG.password;
const LINKEDIN_PROFILE_URL = CONFIG.profileUrl;

class LinkedInMcpServer {
  private server: Server;
  private linkedin: LinkedInAutomation;
  private initialized = false;

  constructor() {
    this.server = new Server(
      {
        name: 'linkedin-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.linkedin = new LinkedInAutomation(
      LINKEDIN_PROFILE_URL!,
      LINKEDIN_EMAIL!,
      LINKEDIN_PASSWORD!
    );

    this.setupToolHandlers();
    this.server.onerror = (error) => console.error('[MCP Error]', error);

    process.on('SIGINT', async () => {
      await this.linkedin.close();
      await this.server.close();
      process.exit(0);
    });
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.linkedin.init();
      const loginOk = await this.linkedin.login();
      if (!loginOk) {
        throw new McpError(
          ErrorCode.InternalError,
          'Sessão do LinkedIn inválida ou expirada. Por favor, execute "npm run login" ou "npx tsx scripts/login.ts" no terminal para autenticar manualmente e salvar a sessão.'
        );
      }
      this.initialized = true;
    }
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'linkedin_get_profile',
          description:
            'Obtém todos os dados do perfil do LinkedIn: headline, sobre, localização, experiências, formação e habilidades.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'linkedin_update_headline',
          description: 'Atualiza o título/headline do perfil do LinkedIn.',
          inputSchema: {
            type: 'object',
            properties: {
              headline: {
                type: 'string',
                description: 'Novo título/headline do perfil',
              },
            },
            required: ['headline'],
          },
        },
        {
          name: 'linkedin_update_about',
          description: 'Atualiza a seção "Sobre" do perfil do LinkedIn.',
          inputSchema: {
            type: 'object',
            properties: {
              about: {
                type: 'string',
                description: 'Novo texto da seção Sobre',
              },
            },
            required: ['about'],
          },
        },
        {
          name: 'linkedin_add_experience',
          description: 'Adiciona uma nova experiência profissional ao perfil.',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Cargo (ex: "Arquiteto de Software")',
              },
              company: {
                type: 'string',
                description: 'Nome da empresa',
              },
              startDate: {
                type: 'string',
                description: 'Data de início (formato MM/YYYY)',
              },
              endDate: {
                type: 'string',
                description: 'Data de fim (formato MM/YYYY). Omita para cargo atual.',
              },
              description: {
                type: 'string',
                description: 'Descrição das atividades',
              },
              location: {
                type: 'string',
                description: 'Localização (opcional)',
              },
            },
            required: ['title', 'company', 'startDate'],
          },
        },
        {
          name: 'linkedin_add_education',
          description: 'Adiciona uma nova formação acadêmica ao perfil.',
          inputSchema: {
            type: 'object',
            properties: {
              school: {
                type: 'string',
                description: 'Nome da instituição de ensino',
              },
              degree: {
                type: 'string',
                description: 'Grau (ex: "Bacharelado", "Mestrado")',
              },
              fieldOfStudy: {
                type: 'string',
                description: 'Curso/Área de estudo',
              },
              startYear: {
                type: 'string',
                description: 'Ano de início',
              },
              endYear: {
                type: 'string',
                description: 'Ano de conclusão',
              },
            },
            required: ['school', 'degree', 'fieldOfStudy'],
          },
        },
        {
          name: 'linkedin_add_certification',
          description: 'Adiciona uma licença ou certificado ao perfil do LinkedIn.',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Nome da certificação/licença (ex: "AWS Certified Solutions Architect")',
              },
              issuer: {
                type: 'string',
                description: 'Organização emissora (ex: "Amazon Web Services")',
              },
              issueMonth: {
                type: 'string',
                description: 'Mês de emissão (ex: "1" para Janeiro)',
              },
              issueYear: {
                type: 'string',
                description: 'Ano de emissão (ex: "2024")',
              },
              credentialId: {
                type: 'string',
                description: 'Código/ID da credencial (opcional)',
              },
              credentialUrl: {
                type: 'string',
                description: 'URL da credencial (opcional)',
              },
            },
            required: ['name', 'issuer', 'issueMonth', 'issueYear'],
          },
        },
        {
          name: 'linkedin_add_skill',
          description: 'Adiciona uma nova habilidade ao perfil.',
          inputSchema: {
            type: 'object',
            properties: {
              skill: {
                type: 'string',
                description: 'Nome da habilidade para adicionar.',
              },
            },
            required: ['skill'],
          },
        },
        {
          name: 'linkedin_add_secondary_language',
          description: 'Adiciona um idioma secundário ao perfil do LinkedIn.',
          inputSchema: {
            type: 'object',
            properties: {
              languageValue: {
                type: 'string',
                description: 'Valor do idioma (ex: "en_US" para Inglês, "es_ES" para Espanhol)',
              },
              firstName: {
                type: 'string',
                description: 'Primeiro nome',
              },
              lastName: {
                type: 'string',
                description: 'Sobrenome',
              },
              headline: {
                type: 'string',
                description: 'Título/Headline traduzido para o novo idioma',
              },
            },
            required: ['languageValue', 'firstName', 'lastName', 'headline'],
          },
        },
        {
          name: 'linkedin_remove_skill',
          description: 'Remove uma competência do perfil.',
          inputSchema: {
            type: 'object',
            properties: {
              skill: {
                type: 'string',
                description: 'Nome exato da competência para remover.',
              },
            },
            required: ['skill'],
          },
        },
        {
          name: 'linkedin_link_skill',
          description: 'Vincula uma competência a uma experiência específica.',
          inputSchema: {
            type: 'object',
            properties: {
              skill: {
                type: 'string',
                description: 'Nome exato da competência (ex: "Playwright").',
              },
              targetExperience: {
                type: 'string',
                description: 'Texto exato da experiência alvo como aparece na lista de vínculo (ex: "Analista de Testes QA Jr na empresa C&M Software").',
              },
            },
            required: ['skill', 'targetExperience'],
          },
        },
        {
          name: 'linkedin_publish_post',
          description: 'Publica um post no feed do LinkedIn.',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Conteúdo do post',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'linkedin_update_current_position',
          description:
            'Atualiza o cargo atual (título, empresa e descrição) no perfil.',
          inputSchema: {
            type: 'object',
            properties: {
              title: {
                type: 'string',
                description: 'Título do cargo',
              },
              company: {
                type: 'string',
                description: 'Nome da empresa',
              },
              description: {
                type: 'string',
                description: 'Descrição das atividades',
              },
            },
            required: ['title', 'company', 'description'],
          },
        },
        {
          name: 'linkedin_analyze_profile_seo',
          description: 'Analisa o perfil do LinkedIn (Algoritmo 2026) e gera relatório holístico (0-100) dividido em SEO, Visibilidade, Qualidade de Conteúdo, Engajamento, Rede, Comportamento, Distribuição e Oportunidades.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'linkedin_search_jobs',
          description: 'Pesquisa vagas de emprego no LinkedIn por palavras-chave e localização.',
          inputSchema: {
            type: 'object',
            properties: {
              keywords: {
                type: 'string',
                description: 'Palavras-chave da busca de vaga (ex: "Desenvolvedor Node.js")',
              },
              location: {
                type: 'string',
                description: 'Localização (opcional, padrão "Brasil")',
              },
            },
            required: ['keywords'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        await this.ensureInitialized();

        switch (request.params.name) {
          case 'linkedin_get_profile': {
            const profile = await this.linkedin.getProfile();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(profile, null, 2),
                },
              ],
            };
          }

          case 'linkedin_update_headline': {
            const { headline } = request.params.arguments as { headline: string };
            if (!headline || typeof headline !== 'string') {
              throw new McpError(ErrorCode.InvalidParams, 'headline é obrigatório e deve ser uma string');
            }
            const success = await this.linkedin.updateHeadline(headline);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success, message: success ? 'Headline atualizado com sucesso!' : 'Falha ao atualizar headline' }),
                },
              ],
            };
          }

          case 'linkedin_update_about': {
            const { about } = request.params.arguments as { about: string };
            if (!about || typeof about !== 'string') {
              throw new McpError(ErrorCode.InvalidParams, 'about é obrigatório e deve ser uma string');
            }
            const success = await this.linkedin.updateAbout(about);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success, message: success ? 'Sobre atualizado com sucesso!' : 'Falha ao atualizar Sobre' }),
                },
              ],
            };
          }

          case 'linkedin_add_experience': {
            const args = request.params.arguments as unknown as Record<string, string>;
            if (!args.title || !args.company || !args.startDate) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'title, company e startDate são obrigatórios'
              );
            }
            const exp: Experience = {
              title: args.title,
              company: args.company,
              startDate: args.startDate,
              endDate: args.endDate || null,
              description: args.description || '',
              location: args.location,
            };
            const success = await this.linkedin.addExperience(exp);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success, message: success ? 'Experiência adicionada com sucesso!' : 'Falha ao adicionar experiência' }),
                },
              ],
            };
          }

          case 'linkedin_add_education': {
            const args = request.params.arguments as unknown as Record<string, string>;
            if (!args.school || !args.degree || !args.fieldOfStudy) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'school, degree e fieldOfStudy são obrigatórios'
              );
            }
            const edu: Education = {
              school: args.school,
              degree: args.degree,
              fieldOfStudy: args.fieldOfStudy,
              startYear: args.startYear || '',
              endYear: args.endYear || '',
            };
            const success = await this.linkedin.addEducation(edu);
            return {
              content: [{ type: 'text', text: JSON.stringify({ success, message: success ? 'Formação adicionada com sucesso' : 'Erro ao adicionar formação' }) }],
            };
          }



          case 'linkedin_add_skill': {
            const { skill } = request.params.arguments as any;
            const success = await this.linkedin.addSkill(skill);
            return {
              content: [{ type: 'text', text: JSON.stringify({ success, message: success ? 'Habilidade adicionada com sucesso' : 'Erro ao adicionar habilidade' }) }],
            };
          }

          case 'linkedin_add_secondary_language': {
            const { languageValue, firstName, lastName, headline } = request.params.arguments as any;
            const success = await this.linkedin.addSecondaryLanguage(languageValue, firstName, lastName, headline);
            return {
              content: [{ type: 'text', text: JSON.stringify({ success, message: success ? 'Idioma adicionado com sucesso' : 'Erro ao adicionar idioma' }) }],
            };
          }

          case 'linkedin_remove_skill': {
            const { skill } = request.params.arguments as any;
            const success = await this.linkedin.removeSkill(skill);
            return {
              content: [{ type: 'text', text: JSON.stringify({ success, message: success ? 'Competência removida com sucesso' : 'Erro ao remover competência' }) }],
            };
          }

          case 'linkedin_link_skill': {
            const { skill, targetExperience } = request.params.arguments as any;
            const success = await this.linkedin.linkSkill(skill, targetExperience);
            return {
              content: [{ type: 'text', text: JSON.stringify({ success, message: success ? 'Competência vinculada com sucesso' : 'Erro ao vincular competência' }) }],
            };
          }

          case 'linkedin_add_certification': {
            const { name, issuer, issueMonth, issueYear, credentialId, credentialUrl } = request.params.arguments as any;
            const success = await this.linkedin.addCertification({ name, issuer, issueMonth, issueYear, credentialId, credentialUrl });
            return {
              content: [{ type: 'text', text: JSON.stringify({ success, message: success ? 'Certificação adicionada com sucesso' : 'Erro ao adicionar certificação' }) }],
            };
          }

          case 'linkedin_add_skill': {
            const { skill } = request.params.arguments as { skill: string };
            if (!skill || typeof skill !== 'string') {
              throw new McpError(ErrorCode.InvalidParams, 'skill é obrigatório e deve ser uma string');
            }
            const success = await this.linkedin.addSkill(skill);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success, message: success ? 'Habilidade adicionada com sucesso!' : 'Falha ao adicionar habilidade' }),
                },
              ],
            };
          }

          case 'linkedin_publish_post': {
            const { content } = request.params.arguments as { content: string };
            if (!content || typeof content !== 'string') {
              throw new McpError(ErrorCode.InvalidParams, 'content é obrigatório e deve ser uma string');
            }
            const success = await this.linkedin.publishPost(content);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success, message: success ? 'Post publicado com sucesso!' : 'Falha ao publicar post' }),
                },
              ],
            };
          }

          case 'linkedin_update_current_position': {
            const { title, company, description } = request.params.arguments as {
              title: string;
              company: string;
              description: string;
            };
            if (!title || !company || !description) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'title, company e description são obrigatórios'
              );
            }
            const success = await this.linkedin.updateCurrentPosition(title, company, description);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ success, message: success ? 'Cargo atual atualizado com sucesso!' : 'Falha ao atualizar cargo atual' }),
                },
              ],
            };
          }

          case 'linkedin_analyze_profile_seo': {
            const profile = await this.linkedin.getProfile();
            const analysis = ProfileOptimizer.analyze(profile);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(analysis, null, 2),
                },
              ],
            };
          }

          case 'linkedin_search_jobs': {
            const { keywords, location } = request.params.arguments as { keywords: string; location?: string };
            if (!keywords || typeof keywords !== 'string') {
              throw new McpError(ErrorCode.InvalidParams, 'keywords é obrigatório e deve ser uma string');
            }
            if (!this.linkedin['page']) throw new Error('Browser não inicializado');
            const jobSearch = new JobSearch(this.linkedin['page']);
            const jobs = await jobSearch.search(keywords, location || 'Brasil');
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(jobs, null, 2),
                },
              ],
            };
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Tool desconhecida: ${request.params.name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Erro desconhecido';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: errorMessage }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('LinkedIn MCP server running on stdio');
  }
}

const server = new LinkedInMcpServer();
server.run().catch(console.error);