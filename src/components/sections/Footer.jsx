import { Instagram, Youtube } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { Image } from "@/components/ui/image";
import TikTokIcon from "@/components/icons/TikTokIcon";
import { trackSocial } from "@/lib/analytics";

const SOCIALS = [
  { name: "Instagram", href: SITE.social.instagram, Icon: Instagram },
  { name: "TikTok", href: SITE.social.tiktok, Icon: TikTokIcon },
  { name: "YouTube", href: SITE.social.youtube, Icon: Youtube },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#070708] pb-24 md:pb-10">
      <div className="max-w-6xl mx-auto px-4 pt-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Image
              src={SITE.images.logo}
              alt="Logo Barbearia do Neyzito"
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="font-heading text-xl tracking-wider text-white">
                BARBEARIA DO NEYZITO
              </p>
              <p className="font-mono text-[10px] tracking-[0.25em] text-slate-400">
                {SITE.since} · SÃO PAULO, SP
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {SOCIALS.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                onClick={() => trackSocial(name.toLowerCase(), "footer")}
                className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-slate-300 hover:border-[#E05252] hover:text-white transition-colors"
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8 max-w-3xl text-sm text-slate-400 leading-relaxed">
          Barbearia profissional na Vila Nova Conceição, São Paulo. Se você procura barbearia
          perto de mim, barbeiro em São Paulo ou corte masculino com acabamento impecável, a
          Barbearia do Neyzito entrega estilo, precisão e atendimento de qualidade desde 2017.
        </p>
        <p className="mt-2 text-xs text-slate-500">{SITE.addressFull}</p>

        <div className="mt-8 border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Barbearia do Neyzito. Todos os direitos reservados.</p>
          <p>WhatsApp {SITE.phoneDisplay} · Agendamento online pelo AppBarber</p>
          <p className="md:w-full md:text-right">
            <a
              href="https://dzmktdigital-1.base44.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Design &amp; Desenvolvimento por Doni Leite CEO
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}