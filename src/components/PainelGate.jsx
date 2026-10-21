import { useState } from 'react';
import { Lock } from 'lucide-react';

const SENHA_PAINEL = 'Relatorios1361#';
const CHAVE_LOCAL = 'neyzito_painel_auth_global';

export default function PainelGate({ children }) {
  const [autenticado, setAutenticado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_LOCAL) === '1';
    } catch {
      return false;
    }
  });
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);

  const verificar = (e) => {
    e.preventDefault();
    if (senha === SENHA_PAINEL) {
      try { localStorage.setItem(CHAVE_LOCAL, '1'); } catch {}
      setAutenticado(true);
      setErro(false);
    } else {
      setErro(true);
      setSenha('');
    }
  };

  if (autenticado) return children;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
      <form onSubmit={verificar} className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#A81C1C]/20">
            <Lock className="w-6 h-6 text-[#E05252]" />
          </div>
          <h1 className="font-heading text-2xl tracking-wide text-white">ACESSO AOS RELATÓRIOS</h1>
          <p className="text-sm text-slate-400">Digite a senha uma vez para acessar todos os painéis</p>
        </div>
        <input
          type="password"
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro(false); }}
          placeholder="Senha"
          className="w-full rounded-lg border border-white/10 bg-[#0E0E10] px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-[#A81C1C] focus:outline-none"
          autoFocus
        />
        {erro && <p className="text-sm text-red-400 text-center">Senha incorreta</p>}
        <button
          type="submit"
          className="w-full rounded-lg bg-[#A81C1C] hover:bg-[#C22424] px-4 py-2.5 text-white font-medium transition-colors"
        >
          Liberar acesso aos painéis
        </button>
      </form>
    </div>
  );
}
