# Correções — Barbearia do Neyzito

**Projeto original:** `6ac2d1562681ffc82d791d55`
**Projeto clonado (novo):** `6ad7a401bdd9aca0b214c7b4` — https://barbearia-do-neyzito-copy-b214c7b4.base44.app
**Agent:** `consultor_neyzito`
**AppBarber:** https://sites.appbarber.com.br/barbeariadoneyz-sqbc

---

## ✅ 1. Assistente Neyzito — não informar valores (FEITO)

**Arquivo:** `base44/agents/consultor_neyzito.jsonc`

**Causa encontrada:** as instruções mandavam o agente informar preço:
- Regra 2 dizia: "apresente o nome, **o preço** e uma explicação curta"
- Regra 4 tinha exemplo: *"O corte fica em R$ 80,00. Quer agendar?"*

**O que mudou:**
| Regra | Antes | Depois |
|---|---|---|
| 2 | "SERVIÇOS E PREÇOS" — apresenta preço | "SERVIÇOS (SEM VALORES)" — só nome e descrição |
| 2b | (não existia) | Nova regra absoluta anti-preço, inclusive contra insistência |
| 3 | "nunca invente preços" | preço não é assunto dele — direciona ao AppBarber |
| 4 | exemplo com R$ 80,00 | exemplo limpo, sem valores |
| 7 | grava lead na entidade Leads | grava pela função `criarLead` |
| 14 | — | alinhada ao novo mecanismo |

---

## ✅ 2. Lead não aparecia no painel (FEITO)

**Causa raiz:** a entidade `Leads` exigia `role: admin` para criar
(`"create": { "user_condition": { "role": "admin" } }`). Quem conversa no chat é
**visitante anônimo**, e pela documentação do Base44 regras com `user_condition`
**bloqueiam chamadores anônimos por completo**. Ou seja: o agente tentava gravar,
o RLS negava, e o lead desaparecia silenciosamente.

Comparação: o `registrarAnalytics` funciona porque a função usa `asServiceRole`.

**Solução aplicada:** nova função backend **`criarLead`**
(`base44/functions/criarLead/`), que grava o lead com **service role**.

Controles de segurança na função:
- Só **cria** lead (nunca lê, atualiza ou exclui)
- Campos de controle **não são aceitos** do cliente: `visualizado`,
  `situacao_atendimento`, `id_externo`, `responsavel_atendimento`, `descadastrado`
- `status` é sempre fixado em "Redirecionado para AppBarber"
- `origem` só aceita a lista padronizada; qualquer outro valor vira "Não identificado"
- Telefone normalizado para dígitos com validação de tamanho
- E-mail validado; consentimento de marketing só `true` com manifestação explícita
- `preco_servico` é buscado no catálogo `Servicos` pelo nome (não aceito do cliente)

**Agent atualizado:** trocou a ferramenta `Leads: create` (bloqueada) pela
função `criarLead` no `tool_configs`.

---

## ✅ 3. Rastreamento de navegação (FEITO)

Os painéis (Leads e Métricas) já leem bem os eventos. Eventos existentes:

| Evento | Onde dispara | Observação |
|---|---|---|
| `visita` | `trackVisit` | 1x por sessão por página |
| `clique` | `trackCta` | destinos: appbarber, whatsapp, redes |
| `chat_aberto` | `trackChatOpen` | 1x por sessão |
| `chat_interacao` | `trackChatInteraction` | dedup 2s |

**Melhorias aplicadas:**

- **Seções vistas** (`secao_vista`): `IntersectionObserver` registra quando cada
  seção entra na tela (`top`, `beneficios`, `ambiente`, `servicos`, `whatsapp`,
  `avaliacoes`, `contato`). O nome da seção vai em `origem_botao`.
- **Profundidade de scroll** (`scroll_profundidade`): marcos de 25/50/75/100%,
  1x por sessão cada. O marco vai em `origem_botao`.
- **Log de falhas**: o `send()` agora registra falhas de envio
  (`console.warn("[tracker] ...")`) em vez de engolir silenciosamente.
- **`gclid` no contexto do chat**: `getCampaignContext()` do `ConsultorChat`
  passou a incluir `gclid` e a garantir `sessao_id` no cache.

**Decisão de arquitetura:** os dois novos eventos usam **tipos próprios**
(`secao_vista`, `scroll_profundidade`) em vez de reutilizar `visita`. Motivo: o
painel conta `visitas` filtrando por `tipo_evento === "visita"` — reutilizar
inflaria a métrica. Ajustes para não distorcer o painel:

- `computeMetrics` → `byDevice`/`byUtmCampaign` contam só `visita` e `clique`.
- `buildJourney` → `interacoes` conta só engajamento (visita/clique/chat);
  navegação aparece na timeline mas não infla a contagem.
- `ACTION_LABELS` ganhou rótulos; `dotColor` ganhou cores para os novos tipos.
- `registrarAnalytics` → `ALLOWED_TIPOS` ampliado, `clean(tipo, 24)` (era 10,
  truncava "scroll_profundidade"), dedup por sessão+página+rótulo.
- `AnalyticsEvent.jsonc` → enum de `tipo_evento` ampliado.

---

## Como publicar as mudanças

O diretório local está vinculado ao projeto **clone** (`6ad7a401bdd9aca0b214c7b4`,
criado pelo eject). Para publicar no **projeto original** (`6ac2d1562681ffc82d791d55`),
rode o deploy apontando para ele:

```powershell
cd C:\Users\dzmkt\barbearia-do-neyzito
npx base44 deploy --app-id 6ac2d1562681ffc82d791d55
```

Isso envia as 6 entidades, as 2 funções (registrarAnalytics + criarLead),
o agent atualizado e o site para o app em produção.

## Como testar

1. Abrir o site publicado
2. Abrir o balão vermelho do Neyzito
3. Perguntar "quanto custa o corte?" → **não deve informar valor nenhum**
4. Informar nome e WhatsApp → o lead deve aparecer no painel de Leads
5. Rolar a página → no painel de Métricas, a jornada deve mostrar as seções
   vistas e os marcos de scroll (sem inflar a contagem de visitas)

