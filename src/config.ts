import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface LinkedInConfig {
  email: string;
  password: string;
  profileUrl: string;
}

export function loadConfig(): LinkedInConfig {
  // 1. Tenta obter das variáveis de ambiente (process.env)
  const envEmail = process.env.LINKEDIN_EMAIL;
  const envPassword = process.env.LINKEDIN_PASSWORD;
  const envProfileUrl = process.env.LINKEDIN_PROFILE_URL;

  if (envEmail && envPassword && envProfileUrl) {
    return {
      email: envEmail,
      password: envPassword,
      profileUrl: envProfileUrl,
    };
  }

  // 2. Fallback para conf.ini
  const configPath = resolve(__dirname, '..', 'conf.ini');
  if (!existsSync(configPath)) {
    throw new Error(`Configurações não encontradas em process.env nem em: ${configPath}`);
  }

  let content: string;
  try {
    content = readFileSync(configPath, 'utf-8');
  } catch (err: any) {
    throw new Error(`Erro ao ler conf.ini: ${err.message}`);
  }

  const iniConfig: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex > 0) {
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      iniConfig[key] = value;
    }
  }

  const email = envEmail || iniConfig.email;
  const password = envPassword || iniConfig.password;
  const profileUrl = envProfileUrl || iniConfig.profile_url;

  if (!email || email === 'SEU_EMAIL_AQUI') {
    throw new Error('Email do LinkedIn não configurado');
  }
  if (!password || password === 'SUA_SENHA_AQUI') {
    throw new Error('Senha do LinkedIn não configurada');
  }
  if (!profileUrl) {
    throw new Error('profile_url do LinkedIn não configurado');
  }

  return { email, password, profileUrl };
}
