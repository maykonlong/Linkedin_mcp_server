# LinkedIn Algorithm Specification 2026

*Status: 2026*
*Escopo: Profile SEO + People Search + Feed Ranking + Content Distribution + Network + Trust/Safety*
*Fonte primária: LinkedIn Help + LinkedIn Engineering*
*Objetivo: maximizar descoberta, relevância profissional, qualidade percebida e distribuição sem recorrer a manipulação.*

## 0. Princípio central
O algoritmo do LinkedIn não é um único algoritmo. Existem sistemas diferentes para: People Search, Feed, Jobs, Pages, Recomendações, Conexões, Conteúdo.

## 1. People Search — SEO do Perfil
O LinkedIn afirma que os resultados de People Search são personalizados para cada usuário. A classificação considera o contexto do pesquisador, o perfil pesquisado, atividade, conexões, comportamento de outros usuários em buscas semelhantes e histórico de busca.

**Regra importante**: Mais keywords ≠ melhor ranking. Evite keyword stuffing.

## 2. Profile SEO
### 2.1 Nome
O nome deve representar o nome real.
- **Não fazer**: João Silva | CEO | Python
- **Fazer**: João Silva
- **Score**: NAME_ACCURACY = 100 se legítimo, penalização se houver manipulação.

### 3. Headline
O headline é crucial para clareza e descoberta profissional.
- **Estrutura recomendada**: [CARGO] + [ESPECIALIDADE] + [TECNOLOGIA/DOMÍNIO] + [PROPOSTA DE VALOR]
- Exemplo: Software Engineer | Python & APIs | Fintech & Payments | Automação e IA
- **Regra**: As palavras precisam representar realmente a experiência do profissional.

### 4. About
Deve responder rapidamente:
- QUEM SOU?
- O QUE FAÇO?
- EM QUE SOU BOM?
- EM QUE DOMÍNIO?
- QUE RESULTADOS GERO?
- O QUE ESTOU BUSCANDO?

**SEO**: Distribuir naturalmente cargos, tecnologias, competências, etc. Não repetir artificialmente.

### 5. Experience
A experiência deve ser real e precisa.
Melhor descrição: Focar em resultados e domínios de aplicação (ex: "Desenvolvi APIs REST em Python utilizadas na integração de sistemas financeiros...").

### 6. Skills
As competências funcionam como um vocabulário profissional do perfil.
Evite repetição artificial.

### 7. Coerência Semântica (Heurística)
O grau de alinhamento entre Headline, About, Experience e Skills.
Se o headline menciona "Python" e "Fintech", o About, Experiências e Skills devem convergir para isso.

### 8. Completude do Perfil
Um perfil rico, preciso e completo garante que as pessoas certas encontrem você.
- Foto, Headline, About, Experience, Education, Skills, Location, Industry, Certifications, Projects, Contact.
- **Regra**: Completo + relevante + verdadeiro.

## 9-22. (Sinais e Comportamento de Feed)
- **Feed Algorithm 2026**: Baseado em LLMs e GPUs para compreensão profunda de contexto (O que diz? Qual contexto? Para quem? Probabilidade de ser útil?).
- **User Interest**: Histórico de consumo, pesquisas.
- **Dwell Time**: Tempo de qualidade gasto no conteúdo. Penaliza "Scroll rápido". Punição severa para Clickbait/Dwell Bait.
- **Conteúdo Profissional**: Forte (experiência, cases, análise). Fraco (genérico, clickbait, spam).
- **Out-of-Network Discovery**: Seu conteúdo pode alcançar níveis além das conexões via interações e recomendação do algoritmo.
- **Demographic Signals**: Idade, raça, gênero NÃO SÃO usados para ranking (Oficial).
- **Spam**: Punição para keyword stuffing, experiências falsas, manipulação de nome.

## 23. Score Proposto para o Optimizer (LinkedIn Optimization Score)
- **Profile Completeness**: 10%
- **Profile Accuracy**: 10%
- **Keyword Relevance**: 15%
- **Semantic Consistency**: 15%
- **Experience Quality**: 10%
- **Skills Alignment**: 10%
- **Professional Positioning**: 10%
- **Search Intent Alignment**: 10%
- **Authority Signals**: 5%
- **Trust/Safety**: 5%
*Total: 100%*

## Estrutura de Recomendação do Agente
Cada recomendação do sistema deve seguir este formato:
- **PROBLEM**: O problema identificado
- **EVIDENCE**: Evidência que sustenta
- **SOURCE**: Official / Inferred
- **IMPACT**: HIGH / MEDIUM / LOW
- **CONFIDENCE**: HIGH / MEDIUM / LOW
- **ACTION**: Proposta de mudança (Auto-rewrite)

## Regra de Ouro
Nunca otimizar um perfil para o algoritmo sacrificando a precisão profissional.
A estratégia correta é: VERDADE + RELEVÂNCIA + ESPECIALIZAÇÃO + COERÊNCIA + UTILIDADE + AUTORIDADE + ENGAJAMENTO NATURAL.
