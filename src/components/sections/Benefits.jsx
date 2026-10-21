import { Check, Martini, Music, Snowflake, SquareParking, Wifi } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { Image } from "@/components/ui/image";

const BENEFITS = [
  "Atendimento personalizado",
  "Ambiente profissional",
  "Agendamento online rápido",
  "Localização de fácil acesso",
  "Qualidade nos detalhes",
];

const COMFORTS = [
  { label: "Ambiente climatizado", Icon: Snowflake },
  { label: "Música boa", Icon: Music },
  { label: "Wi-Fi grátis", Icon: Wifi },
  { label: "Bar com bebidas", Icon: Martini },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="py-12 md:py-16 bg-[#0A0A0B]">
      <div className="max-w-6xl mx-auto px-4">
        <p className="font-mono text-xs tracking-[0.3em] text-[#E05252]">NOSSOS DIFERENCIAIS</p>
        <h2 className="mt-3 font-heading text-3xl md:text-4xl tracking-wide text-white">
          POR QUE ESCOLHER A BARBEARIA DO NEYZITO
        </h2>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {BENEFITS.map((title) => (
            <div
              key={title}
              className="rounded-lg border border-white/10 bg-[#111113] p-3.5 flex items-start gap-2.5 hover:border-[#A81C1C]/60 transition-colors"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#A81C1C]">
                <Check className="h-4 w-4 text-white" />
              </span>
              <h3 className="font-semibold text-sm text-white leading-snug">{title}</h3>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2.5">
          {COMFORTS.map(({ label, Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#111113] px-3.5 py-1.5 text-xs text-slate-300"
            >
              <Icon className="h-3.5 w-3.5 text-[#E05252]" /> {label}
            </span>
          ))}
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-[#A81C1C]/60">
          <Image
            src={SITE.images.fachada}
            alt="Fachada da Barbearia do Neyzito com as duas vagas grátis na porta"
            fittingType="fit"
            className="w-full h-56 sm:h-80 bg-[#0A0A0B]"
          />
          <div className="bg-gradient-to-r from-[#A81C1C]/25 to-transparent p-4 flex items-center gap-3 justify-center text-center">
            <SquareParking className="h-6 w-6 text-[#E05252] shrink-0" />
            <div>
              <p className="font-heading text-lg tracking-wide text-white">
                ESTACIONE GRÁTIS NA PORTA
              </p>
              <p className="text-sm text-slate-400 mt-0.5">
                Chegue de carro sem preocupação: duas vagas gratuitas na porta da barbearia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}