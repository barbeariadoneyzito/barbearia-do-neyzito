export const LOCAL_CATALOGO_META = Object.freeze({
  nome: "Catálogo local — Barbearia do Neyzito",
  moeda: "BRL",
  timezone: "America/Sao_Paulo",
  aviso:
    "Prévia interna com dados locais. Nenhum produto está publicado e os dados comerciais ainda não foram confirmados.",
});

/**
 * Dados locais derivados do levantamento de sete produtos.
 * Preço, estoque, descrição validada e publicação permanecem pendentes.
 */
export const LOCAL_CATALOGO_PRODUTOS = [
  {
    id: "balm-barba-octo",
    nome: "Balm para barba OCTO",
    slug: "balm-para-barba-octo",
    categoria: "barba",
    quantidade_embalagem: "140 g",
    texto_rotulo_confirmado: "Beard Balm; uso profissional",
    imagem_principal: "/catalogo/produtos/IMG_01_Produto_preçonormal.jpg",
    imagem_alt: "Embalagem do Balm para barba OCTO",
    arquivo_foto_origem: "IMG_01_Produto_preçonormal.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 1,
  },
  {
    id: "leave-in-octo",
    nome: "Leave-in OCTO",
    slug: "leave-in-octo",
    categoria: "cabelo",
    quantidade_embalagem: "120 g",
    texto_rotulo_confirmado: "Uso profissional",
    imagem_principal: "/catalogo/produtos/IMG_02_Produto_preçonormal.jpg",
    imagem_alt: "Embalagem do Leave-in OCTO",
    arquivo_foto_origem: "IMG_02_Produto_preçonormal.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 2,
  },
  {
    id: "pomada-po-octo-snow",
    nome: "Pomada em pó OCTO Snow",
    slug: "pomada-em-po-octo-snow",
    categoria: "finalizacao",
    quantidade_embalagem: "5 g",
    texto_rotulo_confirmado: "Textura; alta fixação",
    imagem_principal: "/catalogo/produtos/IMG-20261112-WA0042.jpg",
    imagem_alt: "Embalagem da Pomada em pó OCTO Snow",
    arquivo_foto_origem: "IMG-20261112-WA0042.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 3,
  },
  {
    id: "creme-modelador-octo",
    nome: "Creme modelador OCTO",
    slug: "creme-modelador-octo",
    categoria: "finalizacao",
    quantidade_embalagem: null,
    texto_rotulo_confirmado: "Styling Cream; demais informações ilegíveis",
    imagem_principal: "/catalogo/produtos/IMG-20261112-WA0043.jpg",
    imagem_alt: "Embalagem do Creme modelador OCTO",
    arquivo_foto_origem: "IMG-20261112-WA0043.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 4,
  },
  {
    id: "shampoo-octo-puring",
    nome: "Shampoo OCTO Puring",
    slug: "shampoo-octo-puring",
    categoria: "cabelo",
    quantidade_embalagem: "250 mL",
    texto_rotulo_confirmado:
      "Antioleosidade; rótulo menciona polipeptídeos de soja e gengibre",
    imagem_principal: "/catalogo/produtos/IMG-20261112-WA0044.jpg",
    imagem_alt: "Embalagem do Shampoo OCTO Puring",
    arquivo_foto_origem: "IMG-20261112-WA0044.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 5,
  },
  {
    id: "shampoo-premium-cabelo-octo",
    nome: "Shampoo Premium Cabelo OCTO",
    slug: "shampoo-premium-cabelo-octo",
    categoria: "cabelo",
    quantidade_embalagem: "250 mL",
    texto_rotulo_confirmado: "Uso diário",
    imagem_principal: "/catalogo/produtos/IMG-20261112-WA0045.jpg",
    imagem_alt: "Embalagem do Shampoo Premium Cabelo OCTO",
    arquivo_foto_origem: "IMG-20261112-WA0045.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 6,
  },
  {
    id: "shampoo-premium-barba-octo",
    nome: "Shampoo Premium Barba OCTO",
    slug: "shampoo-premium-barba-octo",
    categoria: "barba",
    quantidade_embalagem: "250 mL",
    texto_rotulo_confirmado: "Uso profissional; com microesferas",
    imagem_principal: "/catalogo/produtos/IMG-20261112-WA0046.jpg",
    imagem_alt: "Embalagem do Shampoo Premium Barba OCTO",
    arquivo_foto_origem: "IMG-20261112-WA0046.jpg",
    preco_normal: null,
    moeda: "BRL",
    estoque: null,
    ativo_para_venda: false,
    status_publicacao: "rascunho",
    status_validacao: "pendente",
    origem_dados: "manual",
    observacoes_validacao:
      "Prévia local: preço, estoque, quantidade e publicação pendentes de confirmação.",
    ordem_exibicao: 7,
  },
];

export const LOCAL_CATALOGO_PROMOCOES = [];
export const LOCAL_CATALOGO_PROMOCAO_ITENS = [];

/**
 * Mensagens institucional de fim de ano.
 * A serem injetadas como instruções quando houver confirmação oficial.
 * Não são exibidas automaticamente ao cliente.
 */
export const MENSAGENS_FIM_DE_ANO = Object.freeze({
  felizNatal:
    "Feliz Natal! Que o espírito da estação traga paz e renovação. Estamos de volta em breve.",
  anoNovo:
    "Feliz Ano Novo! Que 2027 traga muitos novos looks e momentos incríveis. O atendimento retorna em 2 de janeiro.",
  boasFestas:
    "Boas festas! Obrigado por fazer parte da nossa comunidade. Reserve seu horário para janeiro pelo AppBarber.",
});

/**
 * Comunicado de recesso oficial.
 * Campos para preenchimento pelo painel administrativo quando confirmado.
 * Não contém dados reais - apenas estrutura para recebimento.
 */
export const COMUNICADO_RECESSO = Object.freeze({
  dataFechamentoInicial: null,
  dataFechamentoFinal: null,
  dataRetorno: null,
  horarioEspecial: null,
  mensagemRetorno: null,
  ativo: false,
});
