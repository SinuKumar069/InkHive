import { type SVGProps } from 'react'

export function Instagram(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            fill="none"
            {...props}>
            <title>{'Instagram'}</title>
            <defs>
                <linearGradient
                    id="instagram-gradient"
                    x1="3"
                    y1="21"
                    x2="21"
                    y2="3"
                    gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FEDA75" />
                    <stop offset="45%" stopColor="#FA7E1E" />
                    <stop offset="70%" stopColor="#D62976" />
                    <stop offset="100%" stopColor="#4F5BD5" />
                </linearGradient>
            </defs>
            <rect x={3} y={3} width={18} height={18} rx={5} stroke="url(#instagram-gradient)" strokeWidth={2} />
            <circle cx={12} cy={12} r={4} stroke="url(#instagram-gradient)" strokeWidth={2} />
            <circle cx={17.5} cy={6.5} r={1.25} fill="#D62976" />
        </svg>
    )
}