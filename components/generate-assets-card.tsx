'use client'

import { useState, useEffect, useRef } from 'react'
import { CheckCircle2, Loader2, FileText, Share2, Mail, Search } from 'lucide-react'

type AgentStatus = 'pending' | 'generating' | 'done'

export function GenerateAssetsCard() {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const agents = [
    { id: 'blog', name: 'Blog Writer', task: 'Long-form Article', icon: FileText },
    { id: 'social', name: 'Social Expert', task: 'Twitter & LinkedIn', icon: Share2 },
    { id: 'email', name: 'Newsletter Agent', task: 'Email Digest', icon: Mail },
    { id: 'seo', name: 'SEO Agent', task: 'Keywords & Meta', icon: Search },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev >= 4 ? 0 : prev + 1;
        // Auto-scroll to the active item if needed
        if (scrollContainerRef.current && next < 4) {
          const container = scrollContainerRef.current;
          const child = container.children[next] as HTMLElement;
          if (child) {
            container.scrollTo({
              left: child.offsetLeft - container.offsetWidth / 2 + child.offsetWidth / 2,
              behavior: 'smooth'
            });
          }
        }
        return next;
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#141414] p-4 font-sans text-white sm:p-6 md:p-8">
      <h3 className="mb-8 text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-500 text-center">Agent Swarm Progress</h3>
      
      {/* Container with hidden scrollbar */}
      <div 
        ref={scrollContainerRef}
        className="flex w-full gap-4 overflow-x-auto pb-6 pt-2 px-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {agents.map((agent, index) => {
          let status: AgentStatus = 'pending'
          if (index < currentStep) status = 'done'
          if (index === currentStep) status = 'generating'

          return (
            <div 
              key={agent.id} 
              className={`flex w-40 sm:w-48 lg:w-56 shrink-0 flex-col items-center justify-center gap-3 sm:gap-4 rounded-xl border p-5 sm:p-6 text-center transition-all duration-500 snap-center ${
                status === 'generating' 
                  ? 'bg-white/10 border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.07)] scale-105' 
                  : status === 'done'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-white/5 border-white/5 opacity-50'
              }`}
            >
               <div className="flex-shrink-0 mb-1 sm:mb-2">
                 {status === 'done' && <CheckCircle2 className="size-8 sm:size-10 text-emerald-400" />}
                 {status === 'generating' && <Loader2 className="size-8 sm:size-10 animate-spin text-yellow-400" />}
                 {status === 'pending' && <div className="size-8 sm:size-10 rounded-full border-2 border-zinc-700" />}
               </div>
               <div className="flex flex-col gap-1 sm:gap-1.5">
                 <span className="text-sm sm:text-base font-medium text-white whitespace-nowrap">{agent.name}</span>
                 <span className="text-[10px] sm:text-xs text-zinc-400 whitespace-nowrap">{agent.task}</span>
               </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

