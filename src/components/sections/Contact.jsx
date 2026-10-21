import {
  Calendar,
  ExternalLink,
  Instagram,
  MapPin,
  MessageCircle,
  Navigation,
  Youtube,
} from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import TikTokIcon from "@/components/icons/TikTokIcon";
import { trackCta, trackSocial } from "@/lib/analytics";
import { abrirAgendarModal } from "@/lib/agendar";

const SOCIALS = [
  { name: "Instagram", href: SITE.social.instagram, Icon: Instagram },
  { name: "TikTok", href: SITE.social.tiktok, Icon: TikTokIcon },
  { name: "YouTube", href: SITE.social.youtube, Icon: Youtube },
];

export default function Contact() {
  return (
    <section id="contato" className="py-16 md:py-24 bg-[#0E0E10] border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        <p className="font-mono text-xs tracking-[0.3em] text-[#E05252]">CONTATO E LOCALIZAÇÃO</p>
        <h2 className="mt-3 font-heading text-4xl md:text-5xl tracking-wide text-white">
          VENHA NOS VISITAR
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Estamos na Vila Nova Conceição, em São Paulo. Agende online em segundos, chame no
          WhatsApp ou trace a rota até nós.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="overflow-hidden rounded-lg border border-white/10 min-h-[380px]">
            <iframe
              title="Mapa da Barbearia do Neyzito — Vila Nova Conceição, São Paulo"
              src={SITE.mapEmbedUrl}
              className="w-full h-full min-h-[380px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-[#A81C1C]/50 bg-[#A81C1C]/10 p-6">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="h-4 w-4" /> Agendamento Online
              </div>
              <p className="mt-1 text-slate-300 text-sm">
                Reserve em segundos: veja os horários disponíveis, escolha o profissional e os
                valores.
              </p>
              <a
                href={SITE.appBarberUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { trackCta("appbarber", "contact"); abrirAgendarModal("contact"); }}
                className="mt-4 inline-flex items-center gap-2 bg-[#A81C1C] hover:bg-[#C22424] text-white font-bold text-sm tracking-wide px-6 py-3 rounded-md transition-colors"
              >
                AGENDAR AGORA
              </a>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#111113] p-6">
              <div className="flex items-center gap-2 text-slate-300">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </div>
              <p className="mt-1 text-xl font-bold text-white">{SITE.phoneDisplay}</p>
              <a
                href={SITE.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCta("whatsapp", "contact")}
                className="mt-4 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1FB45A] text-white font-bold text-sm tracking-wide px-6 py-3 rounded-md transition-colors"
              >
                FALAR NO WHATSAPP
              </a>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#111113] p-6">
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="h-4 w-4" /> Localização
              </div>
              <p className="mt-1 text-sm text-slate-300 font-semibold">{SITE.addressFull}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={SITE.mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCta("maps", "contact")}
                  className="inline-flex items-center gap-2 border border-white/25 hover:border-white text-white font-bold text-sm tracking-wide px-5 py-3 rounded-md transition-colors"
                >
                  <Navigation className="h-4 w-4" /> COMO CHEGAR
                </a>
                <a
                  href={SITE.googleProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackCta("google", "contact")}
                  className="inline-flex items-center gap-2 border border-white/25 hover:border-white text-white font-bold text-sm tracking-wide px-5 py-3 rounded-md transition-colors"
                >
                  VER NO GOOGLE <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#111113] p-6">
              <p className="text-slate-300 font-semibold">Redes sociais</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {SOCIALS.map(({ name, href, Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    onClick={() => trackSocial(name.toLowerCase(), "contact")}
                    className="inline-flex items-center gap-2 border border-white/25 hover:border-[#E05252] hover:text-white text-slate-300 font-semibold text-sm px-5 py-3 rounded-md transition-colors"
                  >
                    <Icon className="h-4 w-4" /> {name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}