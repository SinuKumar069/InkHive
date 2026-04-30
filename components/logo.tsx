import { cn } from '../lib/utils'

export const Logo = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <svg
            className={cn('text-foreground h-6 w-auto', className)}
            viewBox="0 0 1000 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(0, 0)">
                <path 
                    d="M 110 15 L 185 58.3 L 185 144.9 L 110 188.2 L 35 144.9 L 35 58.3 Z" 
                    stroke={uniColor ? 'currentColor' : 'url(#paint_logo)'}
                    strokeWidth="24" 
                    strokeLinejoin="round" 
                    fill="none" 
                />
                <g transform="translate(56, 58) scale(4.5)">
                    <path 
                        d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" 
                        fill="currentColor" 
                    />
                </g>
            </g>
            <text 
                x="250" 
                y="170" 
                className="font-sans"
                fontSize="180" 
                fontWeight="600" 
                letterSpacing="0.05em"
                fill="currentColor">
                InkHive
            </text>
            <defs>
                <linearGradient
                    id="paint_logo"
                    x1="110"
                    y1="0"
                    x2="110"
                    y2="220"
                    gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9B99FE" />
                    <stop offset="1" stopColor="#2BC8B7" />
                </linearGradient>
            </defs>
        </svg>
    )
}

export const LogoIcon = ({ className, uniColor }: { className?: string; uniColor?: boolean }) => {
    return (
        <svg
            className={cn('size-6', className)}
            viewBox="0 0 220 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path 
                d="M 110 15 L 185 58.3 L 185 144.9 L 110 188.2 L 35 144.9 L 35 58.3 Z" 
                stroke={uniColor ? 'currentColor' : 'url(#paint_logo)'}
                strokeWidth="24" 
                strokeLinejoin="round" 
                fill="none" 
            />
            <g transform="translate(56, 58) scale(4.5)">
                <path 
                    d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" 
                    fill="currentColor" 
                />
            </g>
            <defs>
                <linearGradient
                    id="paint_logo"
                    x1="110"
                    y1="0"
                    x2="110"
                    y2="220"
                    gradientUnits="userSpaceOnUse">
                    <stop stopColor="#9B99FE" />
                    <stop offset="1" stopColor="#2BC8B7" />
                </linearGradient>
            </defs>
        </svg>
    )
}





