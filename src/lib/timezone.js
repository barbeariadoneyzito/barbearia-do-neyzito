// Fuso horário oficial de Brasília (America/Sao_Paulo). O Brasil não adota
// horário de verão desde 2019, logo o deslocamento é fixo em UTC-3 o ano todo.
// Os registros seguem armazenados em UTC (created_date automático da plataforma);
// toda exibição e todo limite de dia são convertidos para Brasília aqui — sem
// aplicar o deslocamento duas vezes.
export const SP_TZ = "America/Sao_Paulo";
const SP_OFFSET_MS = 3 * 60 * 60 * 1000; // UTC-3

// O banco devolve created_date como string ISO SEM sufixo de fuso (ex.:
// "2026-10-15T22:55:19.187000"). new Date() trata string date-time sem offset
// como hora LOCAL do navegador — em São Paulo (UTC-3) o instante UTC acaba
// interpretado como se já fosse local, anulando a conversão para SP e
// deslocando os horários em ~3h. Esta função força a leitura como UTC
// (anexa "Z" quando não há offset) e trunca frações de segundo a 3 dígitos
// (milissegundos, padrão ECMAScript). Não subtrai horas — apenas declara o
// fuso real do instante armazenado, que é UTC.
export function parseDbDate(iso) {
  if (iso instanceof Date) return iso;
  if (!iso) return new Date(NaN);
  let s = String(iso).trim();
  if (!s.includes("T")) return new Date(s); // data-only: deixa o motor decidir
  const hasOffset = /[zZ]$/.test(s) || /[+-]\d{2}:?\d{2}$/.test(s);
  s = s.replace(/\.(\d{3,})/, (_, f) => "." + f.slice(0, 3));
  if (!hasOffset) s += "Z";
  return new Date(s);
}

// Chave de data "YYYY-MM-DD" do instante d no fuso de Brasília.
export function spDateKey(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SP_TZ }).format(parseDbDate(d));
}

// Um valor "YYYY-MM-DD" (data SEM hora) representa um dia civil, não um instante.
// O JavaScript lê "2026-10-20" como meia-noite UTC, que em Brasília é 21h do dia
// 19 — ou seja, o dia "anda para trás" e o filtro de período erra. Esta função
// detecta datas sem horário (e sem offset) para que os comparadores as tratem
// como o dia inteiro em Brasília, e não como um instante UTC.
export function isDateOnly(v) {
  if (v instanceof Date) return false;
  const s = String(v || "").trim();
  if (!s || s.includes("T")) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Converte o valor de referência de um registro no intervalo [inicioMs, fimMs]
// do dia civil em Brasília, pronto para comparação. Data com horário usa o
// instante real; data sem horário vira o dia inteiro (00:00→23:59:59 em BRT).
export function intervaloDoDia(v) {
  if (!v) return null;
  if (isDateOnly(v)) {
    const key = String(v).slice(0, 10);
    return {
      inicio: new Date(key + "T00:00:00-03:00").getTime(),
      fim: new Date(key + "T23:59:59.999-03:00").getTime(),
    };
  }
  const t = parseDbDate(v).getTime();
  if (Number.isNaN(t)) return null;
  return { inicio: t, fim: t };
}

// Testa se o valor de referência cai dentro da janela [ini, fim] (instantes UTC).
// Datas sem hora contam o dia inteiro em Brasília; `ini`/`fim` nulos são abertos.
export function dentroDaJanela(v, ini, fim) {
  const iv = intervaloDoDia(v);
  if (!iv) return false;
  if (ini && iv.fim < ini.getTime()) return false;
  if (fim && iv.inicio > fim.getTime()) return false;
  return true;
}

// Início (00:00:00) do dia de Brasília que contém o instante d, como instante UTC.
export function spStartOfDay(d = new Date()) {
  return new Date(spDateKey(d) + "T00:00:00-03:00");
}

// Fim (23:59:59.999) do dia de Brasília que contém o instante d, como instante UTC.
export function spEndOfDay(d = new Date()) {
  return new Date(spDateKey(d) + "T23:59:59.999-03:00");
}

// Rótulo curto "DD/MM" no fuso de Brasília (para eixos de gráfico).
export function spDayMonth(d = new Date()) {
  const [, m, day] = spDateKey(d).split("-");
  return `${day}/${m}`;
}

// Rótulo de dia de Brasília a partir de um bucket diário UTC (00:00 UTC).
// Como Brasília é UTC-3, o dia de Brasília que o bucket representa começa às
// 03:00 UTC desse mesmo dia; somamos 3h para obter o rótulo correto.
export function spBucketDayLabel(bucketIso) {
  if (!bucketIso) return "";
  return spDayMonth(new Date(new Date(bucketIso).getTime() + SP_OFFSET_MS));
}

// Rótulo completo de "agora" no fuso de Brasília para o Consultor Neyzito.
// O agente roda no servidor (UTC); este rótulo é injetado no contexto de cada
// mensagem do usuário para que ele responda sobre expediente com a hora local
// correta de São Paulo, em vez do relógio UTC do servidor.
export function spNowLabel(d = new Date()) {
  const dt = parseDbDate(d);
  const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: SP_TZ, hour: "2-digit", minute: "2-digit" }).format(dt);
  const diaSemana = new Intl.DateTimeFormat("pt-BR", { timeZone: SP_TZ, weekday: "long" }).format(dt);
  const data = new Intl.DateTimeFormat("pt-BR", { timeZone: SP_TZ, day: "2-digit", month: "long", year: "numeric" }).format(dt);
  return `${hora} (horário de Brasília), ${diaSemana}, ${data}`;
}