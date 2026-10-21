// Links rastreáveis prontos para campanhas. Mantêm o destino público correto da
// landing page e já vêm com UTMs. O gclid do Google Ads é adicionado automaticamente
// pelo Google (auto-tagging) — não precisa incluir manualmente.
//
// Estes links aparecem no painel "Origem dos Leads" com botão de copiar, para o
// Neyzito colar direto na ficha do Google e nas bios das redes sociais.
const BASE = "https://barbeariadoneyzito.base44.app/";

export const TRACKABLE_LINKS = [
  {
    grupo: "Google — Ficha da Empresa",
    onde: "Google Perfil da Empresa → Editar perfil → Informações básicas → Site",
    items: [
      {
        label: "Link da ficha (Google Meu Negócio)",
        url: `${BASE}?utm_source=google_meu_negocio&utm_medium=organic&utm_campaign=perfil_gmb`,
        hint: "Cole no campo 'Site' da sua ficha no Google. Tudo que vier dela aparece como 'Google Meu Negócio'.",
      },
    ],
  },
  {
    grupo: "Instagram",
    onde: "Instagram → Editar perfil → campo Site",
    items: [
      {
        label: "Link na bio",
        url: `${BASE}?utm_source=instagram&utm_medium=bio`,
        hint: "Use na bio e em posts do Instagram.",
      },
    ],
  },
  {
    grupo: "TikTok",
    onde: "TikTok → Editar perfil → campo Site",
    items: [
      {
        label: "Link na bio",
        url: `${BASE}?utm_source=tiktok&utm_medium=social&utm_campaign=tiktok_organico`,
        hint: "Use na bio do TikTok.",
      },
    ],
  },
  {
    grupo: "YouTube",
    onde: "YouTube Studio → Personalização → Informações básicas → Links",
    items: [
      {
        label: "Link do canal",
        url: `${BASE}?utm_source=youtube&utm_medium=social&utm_campaign=youtube_organico`,
        hint: "Use nos links do canal e na descrição dos vídeos.",
      },
    ],
  },
  {
    grupo: "WhatsApp Business",
    onde: "WhatsApp Business → Configurações → Perfil comercial",
    items: [
      {
        label: "Link no perfil / mensagem",
        url: `${BASE}?utm_source=whatsapp&utm_medium=bio`,
        hint: "Use no perfil comercial ou como link divulgado no WhatsApp.",
      },
    ],
  },
  {
    grupo: "Google Ads",
    onde: "Campanhas pagas no Google Ads",
    items: [
      {
        label: "Anúncio de pesquisa",
        url: `${BASE}?utm_source=google_ads&utm_medium=cpc&utm_campaign={campaignid}`,
        hint: "O {campaignid} é substituído automaticamente pelo Google. O gclid também é adicionado via auto-tagging.",
      },
    ],
  },
  {
    grupo: "Plataformas de IA",
    onde: "Quando o ChatGPT/Gemini/Perplexity citarem a barbearia",
    items: [
      {
        label: "Link para ChatGPT",
        url: `${BASE}?utm_source=chatgpt&utm_medium=referral&utm_campaign=ai_chatgpt`,
        hint: "Use quando o ChatGPT citar a barbearia.",
      },
      {
        label: "Link para Gemini",
        url: `${BASE}?utm_source=gemini&utm_medium=referral&utm_campaign=ai_gemini`,
        hint: "Use quando o Gemini citar a barbearia.",
      },
      {
        label: "Link para Perplexity",
        url: `${BASE}?utm_source=perplexity&utm_medium=referral&utm_campaign=ai_perplexity`,
        hint: "Use quando o Perplexity citar a barbearia.",
      },
    ],
  },
  {
    grupo: "Outras redes",
    onde: "Perfis secundários",
    items: [
      {
        label: "LinkedIn (perfil)",
        url: `${BASE}?utm_source=linkedin&utm_medium=social&utm_campaign=linkedin_organico`,
        hint: "Use em posts e perfil do LinkedIn.",
      },
      {
        label: "Facebook (post)",
        url: `${BASE}?utm_source=facebook&utm_medium=social&utm_campaign=facebook_organico`,
        hint: "Use em posts do Facebook.",
      },
    ],
  },
];

// Todas as URLs rastreáveis de uma rede/grupo (para o botão "copiar tudo").
export function linksDoGrupo(grupo) {
  const g = TRACKABLE_LINKS.find((x) => x.grupo === grupo);
  return g ? g.items.map((i) => i.url).join("\n") : "";
}
