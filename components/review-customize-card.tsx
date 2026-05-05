'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, Share2, Mail, Globe, X, Save, Copy, Edit2 } from 'lucide-react'
import { XTwitter } from './ui/svgs'

export function ReviewCustomizeCard() {
   const [activeIndex, setActiveIndex] = useState(0)
   const sliderRef = useRef<HTMLDivElement>(null)

   useEffect(() => {
      const interval = setInterval(() => {
         setActiveIndex((current) => {
            const next = (current + 1) % 4
            if (sliderRef.current) {
               const container = sliderRef.current
               const child = container.children[next] as HTMLElement
               if (child) {
                  container.scrollTo({
                     left: child.offsetLeft,
                     behavior: 'smooth'
                  })
               }
            }
            return next
         })
      }, 3500) // Change every 3.5 seconds
      return () => clearInterval(interval)
   }, [])

   // Common UI classes to maintain consistency and scale down for the card
   const inputBg = "bg-[#1a1a1a] border border-white/5 rounded-lg p-2"
   const labelClass = "text-[8px] sm:text-[9px] font-semibold text-zinc-400 mb-1"

   return (
      <div className="relative flex h-full w-full flex-col bg-[#141414] font-sans text-white">
         {/* Slider Container */}
         <div
            ref={sliderRef}
            className="flex h-full w-full overflow-x-auto scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
         >

            {/* Pane 1: Blog Post */}
            <div className="flex h-full w-full shrink-0 snap-center flex-col p-3 sm:p-4">
               <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div className="flex items-center gap-2">
                     <div className="rounded-lg border border-white/10 bg-white/5 p-1.5"><FileText className="size-3 text-zinc-300 sm:size-4" /></div>
                     <div>
                        <h3 className="text-xs font-semibold text-white sm:text-sm">Blog Post</h3>
                        <p className="text-[8px] text-zinc-500 sm:text-[9px]">5 min read</p>
                     </div>
                  </div>
                  <div className="flex gap-1.5 sm:gap-2">
                     <button className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[8px] font-medium hover:bg-white/5 sm:text-[10px]"><X className="size-2 sm:size-3" /> Cancel</button>
                     <button className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[8px] font-medium text-black hover:bg-zinc-200 sm:text-[10px]"><Save className="size-2 sm:size-3" /> Save Changes</button>
                  </div>
               </div>

               <div className="flex flex-1 flex-col gap-2 overflow-hidden sm:gap-3">
                  <div>
                     <div className={labelClass}>Title</div>
                     <div className={`${inputBg} text-[9px] sm:text-xs text-white`}>The Future of Remote Work in 2024: Key Trends</div>
                  </div>
                  <div>
                     <div className={labelClass}>Excerpt</div>
                     <div className={`${inputBg} text-[8px] sm:text-[10px] text-zinc-300 leading-tight`}>Explore the key trends shaping remote work in 2024, from hybrid models and technology to culture and global hiring. Practical insights for the future of work.</div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">
                     <div className={labelClass}>Content (Markdown)</div>
                     <div className={`${inputBg} relative flex-1 overflow-hidden font-mono text-[7px] leading-relaxed text-zinc-400 sm:text-[9px]`}>
                        <span className="font-bold text-white"># The Future of Remote Work in 2024</span><br /><br />
                        The landscape of work is undergoing a permanent transformation. As we navigate 2024, the question is no longer if remote work is here to stay, but how it will continue to evolve...
                        <div className="absolute bottom-1 right-1 top-1 w-1 rounded-full bg-white/10"></div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Pane 2: Social Media */}
            <div className="flex h-full w-full shrink-0 snap-center flex-col p-3 sm:p-4">
               {/* Pseudo tabs from the screenshot */}
               <div className="mb-3 flex justify-center gap-4 border-b border-white/5 pb-2 text-[8px] font-medium text-zinc-500 sm:mb-4 sm:gap-6 sm:text-[10px]">
                  <span className="flex items-center gap-1"><FileText className="size-2.5" /> Blog Post</span>
                  <span className="-mb-2 flex items-center gap-1 border-b border-white pb-2 text-white"><XTwitter className="size-2.5 text-white" /> Social Media</span>
                  <span className="flex items-center gap-1"><Mail className="size-2.5" /> Email</span>
                  <span className="flex items-center gap-1"><Globe className="size-2.5" /> SEO</span>
               </div>
               <div className="flex flex-1 flex-col rounded-xl border border-white/5 bg-[#101010] p-3">
                  <div className="mb-3 flex items-center justify-between">
                     <div className="flex items-center gap-1.5">
                        <XTwitter className="size-3 text-white sm:size-4" />
                        <span className="text-[10px] font-semibold text-white sm:text-xs">Twitter/X</span>
                     </div>
                     <div className="flex gap-1">
                        <button className="flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[8px] sm:text-[9px]"><Copy className="size-2.5" /> Copy</button>
                        <button className="flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[8px] sm:text-[9px]"><Edit2 className="size-2.5" /> Edit</button>
                     </div>
                  </div>
                  <div className="flex-1 rounded-lg border border-white/5 bg-[#181818] p-2.5 text-[9px] text-zinc-300 sm:p-3 sm:text-[11px] leading-relaxed">
                     Remote work isn&apos;t what it used to be. 💡 In 2024, it&apos;s about strategic hybrid models that boost flexibility without losing collaboration. The future is intentional, not accidental. 🚀 #FutureOfWork #RemoteWork
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                     <button className="rounded border border-white/10 px-2 py-1 text-[8px] font-medium hover:bg-white/5 sm:text-[10px]">Cancel</button>
                     <button className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[8px] font-medium text-black hover:bg-zinc-200 sm:text-[10px]"><Save className="size-2 sm:size-3" /> Save Changes</button>
                  </div>
               </div>
            </div>

            {/* Pane 3: Email Editor */}
            <div className="flex h-full w-full shrink-0 snap-center flex-col p-3 sm:p-4">
               <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-white sm:text-sm">Editor & Preview</h3>
                  <button className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[8px] font-medium hover:bg-white/5 sm:text-[10px]"><X className="size-2 sm:size-3" /> Cancel Edit</button>
               </div>

               <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                  <div className="flex min-h-0 flex-1 flex-col">
                     <div className="mb-1 flex items-center gap-2">
                        <span className={labelClass}>HTML Template</span>
                        <span className="rounded border border-white/10 px-1 text-[6px] uppercase tracking-wider text-zinc-500">Advanced</span>
                     </div>
                     <div className={`${inputBg} flex-1 overflow-hidden font-mono text-[6px] leading-tight text-zinc-400 sm:text-[8px]`}>
                        &lt;!DOCTYPE html&gt;&lt;html&gt;&lt;head&gt;&lt;style&gt;body &#123; margin: 0; padding: 0; width: 100%; font-family: Arial; &#125; .email-container &#123; max-width: 600px; margin: 0 auto; &#125;&lt;/style&gt;&lt;/head&gt;&lt;body&gt;&lt;div class=&quot;email-container&quot;&gt;&lt;div class=&quot;header&quot;&gt;&lt;h1&gt;The Future of Remote Work...
                     </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col">
                     <div className={labelClass}>Plain Text Fallback</div>
                     <div className={`${inputBg} relative flex-1 overflow-hidden text-[7px] leading-snug text-zinc-300 sm:text-[9px]`}>
                        Key takeaways:<br />
                        - Hybrid models are maturing into intentional strategies.<br />
                        - Technology is evolving to create cohesive digital workplaces.<br /><br />
                        Read Full Insights: #
                        <div className="absolute bottom-1 right-1 top-1 w-1 rounded-full bg-white/10">
                           <div className="mt-2 h-1/3 w-full rounded-full bg-zinc-600"></div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Pane 4: SEO Metadata */}
            <div className="flex h-full w-full shrink-0 snap-center flex-col p-3 sm:p-4">
               <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div className="flex items-center gap-2">
                     <div className="rounded-lg border border-white/10 bg-white/5 p-1.5"><Globe className="size-3 text-zinc-300 sm:size-4" /></div>
                     <div>
                        <h3 className="text-xs font-semibold text-white sm:text-sm">SEO Metadata</h3>
                        <p className="text-[8px] text-zinc-500 sm:text-[9px]">Optimized for search engines</p>
                     </div>
                  </div>
                  <button className="flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-[8px] font-medium hover:bg-white/5 sm:text-[10px]"><X className="size-2 sm:size-3" /> Cancel</button>
               </div>

               <div className="flex flex-1 flex-col gap-1.5 overflow-hidden rounded-xl border border-white/5 bg-[#0c0c0c] p-3 sm:gap-2">
                  <div>
                     <div className="mb-1 flex items-end justify-between">
                        <span className={labelClass}>Meta Title</span>
                        <span className="text-[7px] text-zinc-500">38/60 chars</span>
                     </div>
                     <div className={`${inputBg} text-[9px] text-white sm:text-[11px]`}>Future of Remote Work 2024: Key Trends</div>
                  </div>
                  <div>
                     <div className="mb-1 flex items-end justify-between">
                        <span className={labelClass}>Meta Description</span>
                        <span className="text-[7px] text-zinc-500">157/160 chars</span>
                     </div>
                     <div className={`${inputBg} text-[8px] leading-tight text-zinc-300 sm:text-[10px]`}>Explore hybrid models, technology, and global hiring shaping remote work in 2024. Get practical insights for employees and employers on the future of work.</div>
                  </div>
                  <div>
                     <div className={labelClass}>Keywords (comma-separated)</div>
                     <div className={`${inputBg} text-[8px] text-zinc-300 sm:text-[10px]`}>remote work, 2024, hybrid work, future of work, global hiring</div>
                  </div>
                  <div>
                     <div className={labelClass}>URL Slug</div>
                     <div className={`${inputBg} font-mono text-[8px] text-zinc-400 sm:text-[10px]`}><span className="text-zinc-600">/blog/</span>future-remote-work-2024-key-trends</div>
                  </div>
                  <div className="mt-auto flex justify-end">
                     <button className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[8px] font-medium text-black hover:bg-zinc-200 sm:text-[10px]"><Save className="size-2 sm:size-3" /> Save Changes</button>
                  </div>
               </div>
            </div>

         </div>

         {/* Progress indicators at bottom */}
         <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {[0, 1, 2, 3].map((idx) => (
               <div key={idx} className={`h-1 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/20'}`} />
            ))}
         </div>
      </div>
   )
}
