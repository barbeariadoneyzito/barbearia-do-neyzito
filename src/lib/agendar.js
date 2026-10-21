// Store minimalista (pub/sub) para abrir o modal de captura de agendamento
// a partir de qualquer botão "AGENDAR" da landing page, sem prop drilling.
// Qualquer CTA chama abrirAgendarModal(location); o <AgendarModal /> (renderizado
// uma vez no Home) reage via useSyncExternalStore.
let state = { open: false, location: "" };
let snapshot = { ...state };
const listeners = new Set();

function emit() {
  snapshot = { ...state };
  listeners.forEach((l) => l());
}

export function abrirAgendarModal(location = "cta") {
  state = { open: true, location };
  emit();
}

export function fecharAgendarModal() {
  state = { open: false, location: "" };
  emit();
}

export function subscribeAgendar(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAgendarSnapshot() {
  return snapshot;
}