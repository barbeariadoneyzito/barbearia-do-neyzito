import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { trackCta } from "@/lib/analytics";

export default function QRWhatsApp() {
  return (
    <section id="whatsapp" className="py-16 md:py-24 bg-[#0E0E10] border-y border-white/5">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <p className="font-mono text-xs tracking-[0.3em] text-[#E05252]">WHATSAPP</p>
          <h2 className="mt-3 font-heading text-4xl md:text-5xl tracking-wide text-white leading-tight">
            ATENDIMENTO RÁPIDO PELO WHATSAPP
          </h2>
          <p className="mt-6 text-slate-300 leading-relaxed">
            Escaneie com a câmera do seu celular e fale diretamente conosco.
          </p>
          <p className="mt-2 text-slate-400">
            Prefere chamar direto? Nosso WhatsApp é <strong className="text-white">{SITE.phoneDisplay}</strong>.
          </p>
          <a
            href={SITE.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCta("whatsapp", "qr")}
            className="mt-8 inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1FB45A] text-white font-bold tracking-wide px-8 py-4 text-lg rounded-md transition-colors"
          >
            <MessageCircle className="h-5 w-5" /> FALAR NO WHATSAPP
          </a>
        </div>

        <div className="justify-self-center bg-white rounded-2xl p-6 shadow-2xl shadow-black/50">
          <img
            src={SITE.qrCodeUrl}
            alt="QR Code do WhatsApp da Barbearia do Neyzito"
            width={280}
            height={280}
            className="mx-auto"
            loading="lazy"
          />
          <p className="mt-4 text-center font-mono text-xs tracking-[0.2em] text-[#0A0A0B]">
            {SITE.phoneDisplay}
          </p>
        </div>
      </div>
    </section>
  );
}