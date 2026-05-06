'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnimatedGroup } from '@/components/ui/animated-group'
import type { MouseEvent } from 'react'


const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring' as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export function HeroSection() {
    const scrollToHowItWorks = (event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault()
        window.history.pushState(null, '', '/#how-it-works')
        document.getElementById('how-it-works')?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        })
    }

    return (
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="z-2 absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block ">
                    <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-320 absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-40">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 1,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring',
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            }}
                            className="absolute inset-0 -z-20">
                            {null}
                        </AnimatedGroup>
                        <div aria-hidden className="absolute inset-0 -z-10 size-full bg-[radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-6">
                                <AnimatedGroup variants={transitionVariants}>
                                    <Link
                                        href="/#how-it-works"
                                        onClick={scrollToHowItWorks}
                                        className="bg-white/5 hover:bg-white/10 group mx-auto flex w-fit items-center gap-4 rounded-full border border-white/10 p-1 pl-4 shadow-sm shadow-black/10 backdrop-blur-sm transition-all duration-300">
                                        <span className="text-foreground text-sm">Multi-agent AI content system</span>
                                        <span className="block h-4 w-0.5 border-l border-white/10 bg-white/25"></span>

                                        <div className="bg-background/20 group-hover:bg-white/10 size-6 overflow-hidden rounded-full duration-500 ring-1 ring-white/10">
                                            <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                                <span className="flex size-6">
                                                    <ArrowRight className="m-auto size-3" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>

                                    <h1
                                        className="mt-8 max-w-4xl mx-auto text-balance text-3xl md:text-4xl lg:mt-16 xl:text-[4rem] text-transparent bg-linear-to-b from-white via-[#ece8e2] to-neutral-500 bg-clip-text">
                                        Build a Content Empire from a Single Idea
                                    </h1>
                                    <p
                                        className="mx-auto mt-8 max-w-2xl text-balance text-sm md:text-md">
                                        InkHive uses specialized AI agents to generate blog posts, social media content, email newsletters, and SEO metadata from a single topic in seconds                                    </p>
                                </AnimatedGroup>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                                    <div
                                        key={1}
                                        className="rounded-[14px] border border-white/10 bg-white/5 p-0.5 shadow-sm shadow-black/10 backdrop-blur-sm">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-xl border border-white/10 bg-white px-5 text-base text-zinc-950 shadow-sm hover:bg-zinc-100">
                                            <Link href="/create">
                                                <span className="text-nowrap">Start Creating</span>
                                            </Link>
                                        </Button>
                                    </div>
                                    <Button
                                        key={2}
                                        asChild
                                        size="lg"
                                        variant="ghost"
                                        className="group h-10.5 rounded-xl border border-white/15 bg-white/4 px-5 text-white/90 shadow-sm shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/9 hover:text-white">
                                        <Link href="/docs">
                                            <span className="flex items-center gap-2 text-nowrap font-medium tracking-wide">
                                                Documentation
                                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                                            </span>
                                        </Link>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>

                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                                <div
                                    aria-hidden
                                    className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                                />
                                <div className="inset-shadow-2xs bg-background relative mx-auto max-w-7xl overflow-hidden rounded-2xl border border-white/10 p-4 shadow-lg shadow-zinc-950/20 ring-1 ring-white/10">
                                    <img
                                        className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
                                        src="/inkhive-dashboard-preview.svg"
                                        alt="InkHive dashboard preview"
                                        width="2700"
                                        height="1440"
                                    />
                                    <img
                                        className="z-2 aspect-15/8 relative rounded-2xl border border-white/10 dark:hidden"
                                        src="/inkhive-dashboard-preview.svg"
                                        alt="InkHive dashboard preview"
                                        width="2700"
                                        height="1440"
                                    />
                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
            </main>
    )
}
