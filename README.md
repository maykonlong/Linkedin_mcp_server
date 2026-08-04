# LinkedIn MCP Server 🚀

Servidor MCP (Model Context Protocol) para automação, leitura, otimização de SEO e pesquisa de vagas no LinkedIn via Playwright.

---

## 📋 Recursos e Ferramentas

| Nome da Ferramenta | Descrição |
|--------------------|-----------|
| `linkedin_get_profile` | Obtém headline, sobre, localização, cargo atual, experiências, formação e skills em formato JSON. |
| `linkedin_analyze_profile_seo` | **(Novo)** Analisa o perfil e gera nota (0-100), nível de atratividade e sugestões para chamar atenção de recrutadores. |
| `linkedin_search_jobs` | **(Novo)** Busca oportunidades de emprego por palavras-chave e localização. |
| `linkedin_update_headline` | Atualiza o título/headline do perfil. |
| `linkedin_update_about` | Atualiza a seção "Sobre" (resumo profissional). |
| `linkedin_add_experience` | Adiciona uma nova experiência profissional ao perfil. |
| `linkedin_add_education` | Adiciona uma nova formação acadêmica ao perfil. |
| `linkedin_add_skill` | Adiciona uma nova competência/habilidade. |
| `linkedin_update_current_position` | Atualiza cargo, empresa e descrição da posição atual. |
| `linkedin_publish_post` | Publica um post de texto no feed do LinkedIn. |

---

## ⚙️ Configuração

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Preencha suas credenciais no `.env` (ou no `conf.ini`):
   ```env
   LINKEDIN_EMAIL=seu_email@exemplo.com
   LINKEDIN_PASSWORD=sua_senha
   LINKEDIN_PROFILE_URL=https://www.linkedin.com/in/seu-perfil/
   ```

---

## 🔑 Login e Sessão

Para evitar bloqueios de 2FA/CAPTCHA, faça o login manual na primeira execução ou quando a sessão expirar:

```bash
npm run login
# ou dê um duplo clique no arquivo login.bat
```

A sessão é salva de forma persistente em `sessions/session.json`.

---

## 🚀 Como Executar

### 1. Compilar TypeScript
```bash
npm run build
```

### 2. Iniciar Servidor MCP (stdio)
```bash
npm start
# ou dê um duplo clique no arquivo iniciar.bat
```

---

## 🛠️ Exemplo de Configuração em Clientes MCP (Claude Desktop / Antigravity)

```json
{
  "mcpServers": {
    "linkedin": {
      "command": "node",
      "args": ["C:/caminho/para/Linkedin/build/index.js"]
    }
  }
}
```
