"use client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Logo } from "./logo"
import { Menu, Plus, X } from "lucide-react"
import { Show, SignInButton, UserButton } from "@clerk/nextjs"
import { Button } from "./ui/button"
import type { MouseEvent } from "react"


const menuItems = [
    { name: 'How it works', href: '/#how-it-works' },
    { name: 'Integrations', href: '/#integrations' },
]

export const Header = () => {
    const [menuState, setMenuState] = useState(false)
    const [isScrolled, setIsScrolled] = useState(false)

    const handleMenuClick = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
        const [path, hash] = href.split("#")

        if (hash && window.location.pathname === path) {
            event.preventDefault()
            setMenuState(false)
            window.history.pushState(null, "", href)
            document.getElementById(hash)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            })
            return
        }

        if (hash) {
            sessionStorage.setItem("center-section-scroll", hash)
            setMenuState(false)
        }
    }

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)

        const hash = window.location.hash.slice(1)
        const shouldCenterSection = sessionStorage.getItem("center-section-scroll") === hash

        if (hash && shouldCenterSection) {
            sessionStorage.removeItem("center-section-scroll")
            requestAnimationFrame(() => {
                document.getElementById(hash)?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })
            })
        }

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])
    return (
        <header>
            <nav
                data-state={menuState && 'active'}
                className="fixed z-20 w-full px-2 group">
                <div
                    className={cn(
                        'mx-auto mt-2 max-w-6xl rounded-2xl border border-transparent px-6 backdrop-blur-none transition-all duration-300 lg:px-12',
                        isScrolled && 'bg-white/2 max-w-4xl border-white/10 backdrop-blur-lg lg:px-5 shadow-sm shadow-black/10'
                    )}>
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-2 lg:gap-0 lg:py-2">
                        <div className="flex w-full justify-between lg:w-auto">
                            <Link
                                href="/"
                                aria-label="home"
                                className="flex items-center space-x-2">
                                <Logo />
                            </Link>

                            <button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? 'Close Menu' : 'Open Menu'}
                                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </button>
                        </div>

                        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
                            <ul className="flex gap-8 text-sm">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link
                                            href={item.href}
                                            onClick={(event) => handleMenuClick(event, item.href)}
                                            className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-background/95 group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent">
                            <div className="lg:hidden">
                                <ul className="space-y-6 text-base">
                                    {menuItems.map((item, index) => (
                                        <li key={index}>
                                            <Link
                                                href={item.href}
                                                onClick={(event) => handleMenuClick(event, item.href)}
                                                className="text-muted-foreground hover:text-accent-foreground block duration-150">
                                                <span>{item.name}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                                <Show when="signed-out">
                                    <SignInButton mode="modal" >
                                        <Button>Sign In</Button>
                                    </SignInButton>
                                </Show>
                                <Show when="signed-in">
                                    <Link href="/create">
                                        <Button variant="outline" className="w-full">
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Content
                                        </Button>
                                    </Link>
                                    
                                    <UserButton />
                                </Show>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
