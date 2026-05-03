import { type SVGProps } from 'react'

export function Facebook(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 36 36"
            width="1em"
            height="1em"
            fill="none"
            {...props}>
            <title>{'Facebook'}</title>
            <defs>
                <linearGradient id="facebook-gradient" x1="18" x2="18" y1="0" y2="36" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0062E0" />
                    <stop offset="100%" stopColor="#19AFFF" />
                </linearGradient>
            </defs>
            <circle cx={18} cy={18} r={18} fill="url(#facebook-gradient)" />
            <path
                d="M20.8 12.8h2.7V9.1c-.5-.1-2.2-.2-4.1-.2-4 0-6.7 2.5-6.7 7.1v4h-4.4v4.8h4.4V35.8c.8.1 1.7.2 2.8.2 1.1 0 2-.1 2.8-.2V24.8h4.2l.7-4.8h-4.9v-3.6c0-1.4.4-2.1 2.5-2.1Z"
                fill="#FFFFFF"
            />
        </svg>
    )
}