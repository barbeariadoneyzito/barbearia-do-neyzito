import { ExternalLink, PenLine, Star } from "lucide-react";
import { SITE } from "@/lib/siteConfig";
import { trackCta } from "@/lib/analytics";

export default function Testimonials() {
  return (
    <section id="avaliacoes" className="py-16 md:py-24 bg-[#0A0A0B]">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="font-mono text-xs tracking-[0.3em] text-[#E05252]">AVALIAÇÕES</p>
        <h2 className="mt-3 font-heading text-4xl md:text-5xl tracking-wide text-white">
          O QUE NOSSOS CLIENTES DIZEM
        </h2>

        <div className="mt-8 flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-8 w-8 fill-[#E05252] text-[#E05252]" />
          ))}
        </div>
        <p className="mt-6 mx-auto max-w-2xl text-slate-300 leading-relaxed">
          A satisfação dos nossos clientes é o nosso melhor cartão de visita. Veja as avaliações
          reais da Barbearia do Neyzito diretamente no nosso perfil do Google.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={SITE.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCta("google_review", "testimonials")}
            className="inline-flex items-center justify-center gap-2 bg-[#A81C1C] hover:bg-[#C22424] text-white font-bold tracking-wide px-8 py-3.5 rounded-md transition-colors"
          >
            <PenLine className="h-4 w-4" /> AVALIAR NO GOOGLE
          </a>
          <a
            href={SITE.googleProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCta("google_reviews", "testimonials")}
            className="inline-flex items-center justify-center gap-2 border border-white/25 hover:border-white text-white font-bold text-sm tracking-wide px-8 py-3.5 rounded-md transition-colors"
          >
            VER AVALIAÇÕES NO GOOGLE <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-10 mx-auto max-w-2xl rounded-lg border border-white/10 bg-[#111113] p-6 text-center">
          <p className="font-heading text-2xl tracking-wide text-white">
            FICOU SATISFEITO COM SEU CORTE?
          </p>
          <p className="mt-2 text-slate-300 leading-relaxed">
            Poderia deixar uma avaliação no Google? Isso ajuda muito nosso trabalho.
          </p>
        </div>
      </div>
    </section>
  );
}