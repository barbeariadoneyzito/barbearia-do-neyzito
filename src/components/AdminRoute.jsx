import { Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const EMAILS_PERMITIDOS = [
  'barbeariadoneyzito@gmail.com',
  'ney.aleite68@gmail.com'
];

export default function AdminRoute({ unauthenticatedElement }) {
  const { user, isAuthenticated, isLoadingAuth, authChecked, authError } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0A0A0B]">
        <div className="w-8 h-8 border-4 border-white/20 border-t-[#E05252] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError || !isAuthenticated) {
    return unauthenticatedElement;
  }

  const email = (user?.email || '').toLowerCase().trim();

  if (!user || user.role !== 'admin' || !EMAILS_PERMITIDOS.includes(email)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] px-6">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl text-white tracking-wide">ACESSO NEGADO</h1>
          <p className="mt-3 text-slate-400 text-sm">
            Esta área é restrita apenas ao gestor e ao proprietário da Barbearia do Neyzito.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}