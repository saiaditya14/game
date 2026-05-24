import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Sparkles } from 'lucide-react';

export const GameCard = ({ title, description, badge }) => {
  const isActionRequired = badge === "Action Required";
  
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.22, ease: "easeOut" } }}
      className="group relative flex aspect-square w-full cursor-pointer flex-col overflow-hidden border border-border/70 bg-[color:var(--surface)] shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-[var(--shadow)]"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ background: 'var(--card-gradient)' }}>
        <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-[color:var(--card-sheen)] blur-xl transition-transform duration-500 group-hover:scale-125" />
        <div className="absolute inset-x-4 top-4 h-24 rounded-theme border border-white/40 bg-white/20 backdrop-blur-[1px]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.35),transparent_36%,rgba(0,0,0,0.07))]" />

        <div className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-theme border border-white/50 bg-background/70 text-primary shadow-sm backdrop-blur-md transition group-hover:rotate-3 group-hover:scale-110">
          <Sparkles className="h-5 w-5" />
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--surface)] via-[color:var(--surface)]/70 to-transparent opacity-95 transition-opacity group-hover:opacity-100" />

      {badge && (
        <div className="absolute right-3 top-3 z-20">
          <span 
            className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-sm backdrop-blur-md ${
              isActionRequired 
                ? 'border-red-500/20 bg-red-500/10 text-red-600' 
                : 'border-primary/20 bg-background/70 text-primary'
            }`}
            style={{ borderRadius: '9999px' }}
          >
            {isActionRequired && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
            {badge === 'Action Required' ? 'Turn' : badge}
          </span>
        </div>
      )}

      <div className="relative z-10 flex h-full flex-col justify-end p-4">
        <div className="translate-y-7 pb-1 transition-transform duration-300 ease-in-out group-hover:translate-y-0">
          <h3 className="w-full truncate text-lg font-semibold text-foreground">{title}</h3>
          
          <p className="mt-1 mb-3 line-clamp-2 h-8 text-xs font-normal leading-4 text-[color:var(--muted)] opacity-0 transition-opacity delay-75 duration-300 group-hover:opacity-100">
            {description}
          </p>
          
          <div className="mt-auto flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-background shadow-lg transition-transform group-hover:scale-110">
              <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
            </div>
            <span className="text-xs font-semibold text-primary transition-colors">
              {isActionRequired ? 'Play Move' : 'Open Game'}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};
