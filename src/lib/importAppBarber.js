// Importação do CSV de agendamentos do AppBarber para a entidade Leads.
//
// O AppBarber exporta um CSV com o cabeçalho:
//   ID_Registro;Data_Hora_Contato;Nome_Cliente;Telefone;Email;Servico;Barbeiro;
//   Canal_Origem;Meio_Acesso;Status_Agendamento;Valor_Servico
//
// O parser abaixo NÃO assume formatos fixos: detecta o separador, a data, o
// valor e o status a partir do conteúdo, porque cada instalação do AppBarber
// pode exportar com pequenas variações (vírgula vs ponto, com/sem hora, etc.).

// ---------- Parsing de CSV ----------

// Detecta se o texto é realmente um CSV (colunas separadas por ; ou ,).
//
// Antes bastava a primeira linha conter "," — e aí um texto colado com valores
// como "80,00" era tratado como CSV e quebrava. Agora exigimos que o separador
// se repita de forma CONSISTENTE na mesma contagem em todas as linhas (ou ao
// menos nas duas primeiras), e desempatamos TAB/| a favor do texto colado.
export function ehTextoCSV(texto) {
  const linhas = String(texto || "").split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length === 0) return false;
  // TAB ou | dominantes indicam tabela colada, não CSV.
  if (linhas[0].includes("\t") || linhas[0].includes("|")) return false;

  const contar = (l, s) => l.split(s).length - 1;
  const amostra = linhas.slice(0, 5);
  for (const sep of [";", ","]) {
    const contagens = amostra.map((l) => contar(l, sep));
    if (contagens[0] === 0) continue;
    // Todas as linhas amostradas precisam ter o mesmo número de separadores.
    if (contagens.every((c) => c === contagens[0])) return true;
  }
  return false;
}

// Detecta o separador dominante na primeira linha (cabeçalho).
export function detectarSeparador(texto) {
  const primeira = (texto.split(/\r?\n/).find((l) => l.trim()) || "");
  const cand = [";", ",", "\t"];
  let melhor = ";";
  let max = -1;
  for (const c of cand) {
    const n = primeira.split(c).length - 1;
    if (n > max) {
      max = n;
      melhor = c;
    }
  }
  return melhor;
}

// Divide uma linha de CSV respeitando campos entre aspas.
export function dividirLinha(linha, sep) {
  const out = [];
  let atual = "";
  let aspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (ch === '"') {
      if (aspas && linha[i + 1] === '"') {
        atual += '"';
        i++;
      } else {
        aspas = !aspas;
      }
    } else if (ch === sep && !aspas) {
      out.push(atual);
      atual = "";
    } else {
      atual += ch;
    }
  }
  out.push(atual);
  return out.map((s) => s.trim());
}

// Lê o CSV inteiro em um array de objetos {coluna: valor}.
export function parseCSV(texto) {
  const limpo = String(texto || "").replace(/^\uFEFF/, "");
  const linhas = limpo.split(/\r?\n/).filter((l) => l.trim());
  if (linhas.length < 2) return { colunas: [], linhas: [] };
  const sep = detectarSeparador(limpo);
  const colunas = dividirLinha(linhas[0], sep);
  const linhasObj = [];
  for (let i = 1; i < linhas.length; i++) {
    const vals = dividirLinha(linhas[i], sep);
    const obj = {};
    colunas.forEach((c, idx) => {
      obj[c] = vals[idx] ?? "";
    });
    linhasObj.push(obj);
  }
  return { colunas, linhas: linhasObj };
}

// ---------- Texto colado (tabela da tela / PDF) ----------

// Muitas vezes o AppBarber não exporta CSV — só mostra a tabela na tela ou em
// PDF. Nestes casos o usuário copia as linhas e cola aqui. Esta função aceita
// texto com colunas separadas por TAB (copiar de planilha), por "|" ou por
// múltiplos espaços, e devolve o mesmo formato do parseCSV.
//
// Também aceita um cabeçalho colado junto (ex.: "Cliente Telefone Serviço ...").
export function parseTextoColado(texto) {
  const limpo = String(texto || "").replace(/^\uFEFF/, "").replace(/\r/g, "");
  const todas = limpo.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l) => l.trim());
  if (todas.length === 0) return { colunas: [], linhas: [] };

  // Escolhe o separador da primeira linha: TAB > | > 2+ espaços.
  const primeira = todas[0];
  let sep;
  let split;
  if (primeira.includes("\t")) {
    sep = "\t";
    split = (l) => l.split("\t").map((s) => s.trim());
  } else if (primeira.includes("|")) {
    sep = "|";
    split = (l) => l.split("|").map((s) => s.trim());
  } else {
    sep = /\s{2,}/;
    split = (l) => l.split(/\s{2,}/).map((s) => s.trim());
  }

  const cabecalho = split(primeira);
  const linhas = [];
  // A primeira linha é tratada como cabeçalho apenas quando realmente parece
  // um (nenhum campo é uma data nem um valor). Sem isso, colar uma tabela sem
  // a linha de títulos descartaria o primeiro atendimento silenciosamente.
  const temCabecalho = pareceCabecalho(cabecalho);
  const inicio = temCabecalho ? 1 : 0;
  for (let i = inicio; i < todas.length; i++) {
    const vals = split(todas[i]);
    const obj = {};
    if (temCabecalho) {
      cabecalho.forEach((c, idx) => {
        obj[c] = vals[idx] ?? "";
      });
    } else {
      // Sem títulos: mapeia por POSIÇÃO com as chaves canônicas, na ordem em
      // que o AppBarber costuma listar (cliente, serviço, profissional, status,
      // valor, data). `linhaParaLead` ainda reconhece o conteúdo pelo formato.
      POSICIONAL.forEach((campo, idx) => {
        obj[campo] = vals[idx] ?? "";
      });
    }
    linhas.push(obj);
  }
  return { colunas: cabecalho, linhas };
}

// Ordem canônica assumida quando o texto colado não traz cabeçalho. É a ordem
// mais comum nos relatórios/telas do AppBarber. Campos a mais são ignorados e
// campos a menos simplesmente ficam vazios.
const POSICIONAL = ["Cliente", "Servico", "Barbeiro", "Status", "Valor", "Data", "Telefone"];

// Heurística de cabeçalho: nenhum campo contém data (dd/mm/aaaa ou ISO) nem
// valor monetário. Usada para não comer a primeira linha de dados quando o
// usuário cola a tabela sem os títulos.
export function pareceCabecalho(campos) {
  if (!campos || campos.length < 2) return false;
  const temData = campos.some((c) => /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}/.test(c));
  const temValor = campos.some((c) => /^\s*R?\$?\s*\d+[.,]\d{2}\s*$/.test(c));
  return !temData && !temValor;
}

// ---------- Normalização de valores ----------

// Data em vários formatos -> "YYYY-MM-DDTHH:MM" (aceito pela entidade) ou "YYYY-MM-DD".
export function normalizarData(v) {
  const s = String(v || "").trim();
  if (!s) return "";

  // 20/10/2026 15:30  ou  20/10/2026
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, d, mo, y, h, mi] = m;
    const data = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    return h ? `${data}T${h.padStart(2, "0")}:${mi}` : data;
  }

  // 2026-10-20T15:30  ou  2026-10-20 15:30  ou  2026-10-20
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, y, mo, d, h, mi] = m;
    const data = `${y}-${mo}-${d}`;
    return h ? `${data}T${h.padStart(2, "0")}:${mi}` : data;
  }

  // 20-10-2026
  m = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return "";
}

// Telefone -> só dígitos (mesma normalização usada no painel e no criarLead).
export function normalizarTelefone(v) {
  return String(v || "").replace(/\D/g, "").slice(0, 15);
}

// Valor -> número. Aceita "65,00", "R$ 65,00", "65.00".
export function normalizarValor(v) {
  let s = String(v || "").trim().replace(/[^\d.,-]/g, "");
  if (!s) return null;
  // Se tem vírgula e ponto, o último é o decimal.
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".")
      ? s.replace(/\./g, "").replace(",", ".")
      : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Status do AppBarber -> situacao_atendimento da entidade.
// Realizados -> compareceu · Ausentes/Faltou -> faltou · Cancelados -> cancelado.
export function normalizarSituacao(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return null;
  if (/realiz|conclu|atendid|comparec|finaliz/.test(s)) return "compareceu";
  if (/ausent|falt|no.?show/.test(s)) return "faltou";
  if (/cancel/.test(s)) return "cancelado";
  if (/reagend/.test(s)) return "reagendado";
  if (/confirm/.test(s)) return "confirmado";
  if (/pendent|aguard|aberto|agendad|marcad/.test(s)) return "pendente";
  if (/bloque/.test(s)) return null; // bloqueio de agenda: não é cliente
  return null;
}

// Canal de origem do AppBarber -> origem da entidade (lista permitida).
// Sempre cai em "AppBarber" quando não reconhecido: o registro veio de lá.
export function normalizarOrigem(v) {
  const s = String(v || "").toLowerCase().trim();
  if (!s) return "AppBarber";
  if (/instagram/.test(s)) return "Instagram";
  if (/tiktok/.test(s)) return "TikTok";
  if (/facebook|meta\b/.test(s)) return "Facebook";
  if (/youtube/.test(s)) return "YouTube";
  if (/linkedin/.test(s)) return "LinkedIn";
  if (/whats|zap/.test(s)) return "WhatsApp Business";
  if (/indica/.test(s)) return "Indica\u00e7\u00e3o de cliente";
  if (/maps|perfil|business|gmb|google.?meu/.test(s)) return "Google Meu Neg\u00f3cio";
  if (/google/.test(s)) return "Google Pesquisa";
  return "AppBarber";
}

// ---------- Conversão de uma linha ----------

// Sinônimos de cabeçalho: cada campo da entidade pode vir com nomes diferentes
// dependendo da exportação/relatório do AppBarber (ou de um texto colado).
// Comparação em minúsculas, sem acento e sem separadores.
function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const ALIASES = {
  nome: ["nomecliente", "cliente", "nome", "clientenome"],
  whatsapp: ["telefone", "celular", "whatsapp", "fone", "contato", "telefonecelular"],
  email: ["email", "emailcliente"],
  servico: ["servico", "servicos", "procedimento", "servicoproduto"],
  barbeiro: ["barbeiro", "profissional", "colaborador", "funcionario"],
  origem: ["canalorigem", "origem", "canal", "comosoube", "ondeconheceu"],
  meio: ["meioacesso", "meio", "plataforma", "acesso"],
  situacao: ["statusagendamento", "status", "situacao", "situacaoagendamento"],
  data: ["datahoracontato", "data", "dataagendamento", "datahora", "horario", "dataservico"],
  valor: ["valorservico", "valor", "preco", "vlr", "total"],
  id: ["idregistro", "id", "codigo", "cod", "registro"],
};

// Dado um objeto de colunas arbitrárias, encontra o valor do campo pedido.
function pegar(row, campo) {
  const alvos = ALIASES[campo] || [];
  const chaves = Object.keys(row);
  for (const k of chaves) {
    if (alvos.includes(normKey(k))) return row[k];
  }
  return "";
}

// Converte uma linha (CSV com cabeçalho ou texto colado) em um objeto pronto
// para a entidade Leads. O mapeamento de colunas é flexível: reconhece
// variações de nome de cabeçalho do AppBarber e de textos colados.
export function linhaParaLead(row) {
  const nome = String(pegar(row, "nome") || row.Nome_Cliente || row.nome || "").trim();
  const whatsapp = normalizarTelefone(pegar(row, "whatsapp") || row.Telefone || row.whatsapp);
  const dataHora = normalizarData(pegar(row, "data") || row.Data_Hora_Contato || row.Data || "");
  const situacao = normalizarSituacao(pegar(row, "situacao") || row.Status_Agendamento || row.Status || "");
  const valor = normalizarValor(pegar(row, "valor") || row.Valor_Servico || row.Valor || "");
  const barbeiro = String(pegar(row, "barbeiro") || row.Barbeiro || "").trim();

  const problemas = [];
  const avisos = [];
  if (nome.length < 2) problemas.push("nome ausente");
  // O telefone é desejável, mas os relatórios do AppBarber frequentemente vêm
  // sem ele. Antes a linha era descartada e o usuário via "nenhuma linha
  // válida". Agora importamos mesmo sem telefone — vira apenas um aviso.
  if (whatsapp.length < 10) avisos.push("sem telefone");

  return {
    dados: {
      nome,
      whatsapp,
      email: String(pegar(row, "email") || row.Email || "").trim().slice(0, 160),
      servico_interesse: String(pegar(row, "servico") || row.Servico || "").trim().slice(0, 120),
      barbeiro_preferido: barbeiro.slice(0, 120),
      responsavel_atendimento: barbeiro.slice(0, 120),
      status: "Importado do AppBarber",
      origem: normalizarOrigem(pegar(row, "origem") || row.Canal_Origem || row.Origem || ""),
      canal: String(pegar(row, "meio") || row.Meio_Acesso || "AppBarber").trim().slice(0, 80),
      situacao_atendimento: situacao,
      data_agendamento: dataHora,
      primeiro_contato: dataHora ? dataHora.slice(0, 10) : "",
      id_externo: String(pegar(row, "id") || row.ID_Registro || row.id || "").trim().slice(0, 80),
      preco_servico: valor,
      tipo_cliente: "N\u00e3o identificado",
      pagina_entrada: "/",
    },
    problemas,
    avisos,
  };
}

// ---------- Validação / resumo ----------

// Analisa o CSV inteiro e devolve o que será importado, o que será ignorado e
// os possíveis duplicados (por id_externo e por telefone+data).
// Aceita tanto o CSV exportado do AppBarber quanto texto colado (tabela da tela
// ou de um PDF), detectando automaticamente o formato.
export function analisarCSV(texto, idsExistentes = new Set()) {
  const bruto = String(texto || "").replace(/^\uFEFF/, "");
  const { colunas, linhas } = ehTextoCSV(bruto) ? parseCSV(bruto) : parseTextoColado(bruto);
  const validos = [];
  const ignorados = [];
  const vistosId = new Set();
  const vistosChave = new Set();
  const duplicados = [];
  let semTelefone = 0;

  for (const row of linhas) {
    const { dados, problemas, avisos } = linhaParaLead(row);
    if (problemas.length) {
      ignorados.push({ row, motivo: problemas.join(", ") });
      continue;
    }
    if (avisos?.includes("sem telefone")) semTelefone++;
    const idExt = dados.id_externo;
    // Chave de deduplicação: id externo quando existe; senão telefone+data;
    // senão nome+data+serviço (para linhas sem telefone, comuns nos relatórios
    // do AppBarber). Evita que a mesma pessoa entre duas vezes.
    const chave = dados.whatsapp
      ? `${dados.whatsapp}|${dados.data_agendamento || dados.primeiro_contato}`
      : `${dados.nome.toLowerCase()}|${dados.data_agendamento || dados.primeiro_contato}|${dados.servico_interesse}`;
    if (idExt && (idsExistentes.has(idExt) || vistosId.has(idExt))) {
      duplicados.push(dados);
      continue;
    }
    if (vistosChave.has(chave)) {
      duplicados.push(dados);
      continue;
    }
    if (idExt) vistosId.add(idExt);
    vistosChave.add(chave);
    validos.push(dados);
  }

  return {
    colunas,
    totalLinhas: linhas.length,
    validos,
    ignorados,
    duplicados,
    resumo: {
      total: linhas.length,
      aImportar: validos.length,
      ignorados: ignorados.length,
      duplicados: duplicados.length,
      compareceu: validos.filter((d) => d.situacao_atendimento === "compareceu").length,
      faltou: validos.filter((d) => d.situacao_atendimento === "faltou").length,
      cancelado: validos.filter((d) => d.situacao_atendimento === "cancelado").length,
      semTelefone,
      rendimento: validos.reduce(
        (s, d) => s + (d.situacao_atendimento === "compareceu" ? d.preco_servico || 0 : 0),
        0
      ),
    },
  };
}
