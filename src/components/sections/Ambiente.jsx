import { Image } from "@/components/ui/image";
import { SITE } from "@/lib/siteConfig";

export default function Ambiente() {
  return (
    <section id="ambiente" className="py-12 md:py-16 bg-[#0A0A0B]">
      <div className="max-w-6xl mx-auto px-4">
        <p className="font-mono text-xs tracking-[0.3em] text-[#E05252] text-center">
          NOSSO ESPAÇO
        </p>
        <h2 className="mt-3 font-heading text-3xl md:text-4xl tracking-wide text-white text-center">
          CONHEÇA A BARBEARIA POR DENTRO
        </h2>
        <p className="mt-3 mx-auto max-w-2xl text-center text-slate-400 leading-relaxed">
          Ambiente profissional, climatizado e preparado para você relaxar enquanto
          cuida do visual.
        </p>
        <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
          <Image
            src={SITE.images.interior}
            alt="Interior profissional da Barbearia do Neyzito"
            className="w-full h-[260px] sm:h-[440px] object-cover"
          />
        </div>
      </div>
    </section>
  );
}