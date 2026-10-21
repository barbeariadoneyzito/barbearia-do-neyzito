import { ArrowRight, Calendar, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { Image } from "@/components/ui/image";
import { trackCta } from "@/lib/analytics";
import { abrirAgendarModal } from "@/lib/agendar";

const SERVICES = [
  {
    src: SITE.images.services.corte,
    alt: "Barbeiro aplicando um corte fade moderno com máquina",
    title: "Corte Masculino",
    desc: "Cortes clássicos e modernos, com técnica e acabamento impecável.",
  },
  {
    src: SITE.images.services.infantil,
    alt: "Barbeiro cortando o cabelo de uma criança com atenção",
    title: "Corte Infantil",
    desc: "Atendimento paciente e cuidadoso, do jeitinho que a criançada gosta.",
  },
  {
    src: SITE.images.services.barba,
    alt: "Barbeiro modelando a barba com navalha e pincel",
    title: "Barba",
    desc: "Modelagem e alinhamento de barba com produtos de qualidade.",
  },
  {
    src: SITE.images.services.combo,
    alt: "Cliente recebendo serviço completo de corte e barba",
    title: "Corte + Barba",
    desc: "O combo completo para renovar o visual do começo ao fim.",
  },
  {
    src: SITE.images.hidratacao,
    alt: "Cliente recebendo hidratação com vapor na Barbearia do Neyzito",
    title: "Hidratação com Vapor",
    desc: "Tratamento com vapor que hidrata e revitaliza cabelo e pele.",
  },
];

export default function Services() {
  return (
    <section id="servicos" className="py-16 md:py-24 bg-[#0E0E10] border-y border-white/5">
      <div className="max-w-6xl mx-auto px-4">
        <p className="font-mono text-xs tracking-[0.3em] text-[#E05252]">O QUE FAZEMOS</p>
        <h2 className="mt-3 font-heading text-4xl md:text-5xl tracking-wide text-white">
          NOSSOS SERVIÇOS
        </h2>
        <p className="mt-4 max-w-2xl text-slate-400">
          Na Vila Nova Conceição, a Barbearia do Neyzito cuida do seu visual com profissionalismo —
          corte masculino, corte infantil, barba e hidratação em São Paulo. Horários, profissionais
          e valores você vê direto no agendamento online.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <figure
              key={s.title}
              className="group rounded-lg overflow-hidden border border-white/10 bg-[#111113] hover:border-[#A81C1C]/60 transition-colors"
            >
              <div className="h-44 overflow-hidden">
                <Image
                  src={s.src}
                  alt={s.alt}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-2xl tracking-wide text-white">{s.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{s.desc}</p>
                <a
                  href={SITE.appBarberUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { trackCta("appbarber", "services-card"); abrirAgendarModal("services-card"); }}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#E05252] hover:text-white transition-colors"
                >
                  Agendar <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </figure>
          ))}

          <div className="rounded-lg border border-[#A81C1C]/50 bg-[#A81C1C]/10 p-6 flex flex-col justify-center">
            <h3 className="font-heading text-2xl tracking-wide text-white">
              PRONTO PARA O NOVO VISUAL?
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Agende em segundos: veja os horários disponíveis, escolha o profissional e os valores.
            </p>
            <a
              href={SITE.appBarberUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { trackCta("appbarber", "services"); abrirAgendarModal("services"); }}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-[#A81C1C] hover:bg-[#C22424] text-white font-bold text-sm tracking-wide px-6 py-3 rounded-md transition-colors"
            >
              <Calendar className="h-4 w-4" /> AGENDAR AGORA
            </a>
            <a
              href={SITE.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#25D366] hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" /> ou fale no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}