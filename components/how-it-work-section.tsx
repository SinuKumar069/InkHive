'use client'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ChartBarIncreasingIcon, Database, Fingerprint, IdCard } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { BorderBeam } from '@/components/ui/border-beam'
import { StartTopicCard } from './start-topic-card'
import { GenerateAssetsCard } from './generate-assets-card'
import { ReviewCustomizeCard } from './review-customize-card'


export default function HowitWorks() {
    type ImageKey = 'item-1' | 'item-2' | 'item-3' | 'item-4'
    const [accordionValue, setAccordionValue] = useState<ImageKey | ''>('item-1')
    const [activeItem, setActiveItem] = useState<ImageKey>('item-1')

    const handleAccordionChange = (value: string) => {
        setAccordionValue(value as ImageKey | '')

        if (value) {
            setActiveItem(value as ImageKey)
        }
    }

    const images = {
        'item-1': {
            image: '/charts.png',
            alt: 'Content planning and analytics',
        },
        'item-2': {
            image: '/music.png',
            alt: 'AI collaboration and drafting',
        },
        'item-3': {
            image: '/mail2.png',
            alt: 'Publishing and scheduling',
        },
        'item-4': {
            image: '/payments.png',
            alt: 'Performance and growth',
        },
    }

    return (
        <section id="how-it-works" className="scroll-mt-24 py-12 md:py-20 lg:py-32">
            <div className="bg-linear-to-b absolute inset-0 -z-10 sm:inset-6 sm:rounded-b-3xl dark:block dark:to-[color-mix(in_oklab,var(--color-zinc-900)_75%,var(--color-background))]"></div>
            <div className="mx-auto max-w-5xl space-y-8 px-6 md:space-y-16 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-white)_10%,transparent)]">
                <div className="relative z-10 mx-auto max-w-2xl space-y-6 text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-6xl">How InkHive Works</h2>
                    <p>Turn one idea into a complete content campaign with AI agents that research, write, optimize, and prepare your content for publishing.</p>
                </div>

                <div className="grid gap-12 sm:px-12 md:grid-cols-2 lg:gap-20 lg:px-0">
                    <Accordion
                        type="single"
                        collapsible
                        value={accordionValue}
                        onValueChange={handleAccordionChange}
                        className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <Database className="size-4" />
                                    Start with a Topic or Article
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p className="mb-2">Enter a fresh topic or paste an existing article. InkHive analyzes your input, understands the core message, and prepares it for a full content generation workflow.</p>
                                <ol className="ml-4 list-decimal text-sm">
                                    <li>Use a topic to create new content from scratch</li>
                                    <li>Use an article to repurpose existing content</li>
                                    <li>Prepare the input for blog, social, email, and SEO assets</li>
                                </ol>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <Fingerprint className="size-4" />
                                    Generate Content Assets
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p>Specialized AI agents create the full content package: blog post, social captions, email newsletter, SEO title, meta description, and keywords.</p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <IdCard className="size-4" />
                                    Review and Customize
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p>Edit the generated content, adjust the tone, improve sections, and make every output match your brand voice before publishing.</p>
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-base">
                                    <ChartBarIncreasingIcon className="size-4" />
                                    Publish and Grow
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <p>Use your ready-to-publish assets across your blog, social channels, newsletter, and SEO workflow to grow traffic and engagement.</p>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>

                    <div className="bg-background relative flex overflow-hidden rounded-3xl border border-white/10 p-2">
                        <div className="w-15 absolute inset-0 right-0 ml-auto border border-white/10 bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_8px)]"></div>
                        <div className="aspect-76/59 bg-background relative w-[calc(3/4*100%+3rem)] rounded-2xl">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={`${activeItem}-id`}
                                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                                    transition={{ duration: 0.2 }}
                                    className="size-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-md">
                                    {activeItem === 'item-1' ? (
                                        <StartTopicCard />
                                    ) : activeItem === 'item-2' ? (
                                        <GenerateAssetsCard />
                                    ) : activeItem === 'item-3' ? (
                                        <ReviewCustomizeCard />
                                    ) : (
                                        <Image
                                            src={images[activeItem].image}
                                            className="size-full object-cover object-top-left dark:mix-blend-lighten"
                                            alt={images[activeItem].alt}
                                            width={1207}
                                            height={929}
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <BorderBeam
                            duration={6}
                            size={200}
                            className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}
