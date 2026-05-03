import { type SVGProps } from 'react'

export function LinkedIn(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            width="1em"
            height="1em"
            fill="none"
            {...props}>
            <title>{'LinkedIn'}</title>
            <defs>
                <linearGradient id="linkedin-gradient" x1="50" x2="50" y1="100" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0A66C2" />
                    <stop offset="100%" stopColor="#4F9CEB" />
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={100} height={100} rx={20} fill="url(#linkedin-gradient)" />
            <path
                d="M25.8 37.3h16.7v7.1c2.4-4.2 6.8-7.9 14.1-7.9 15 0 17.8 9.3 17.8 21.5v24.9H57.8V63.2c0-5.9-.1-13.4-8.2-13.4-8.2 0-9.4 6.4-9.4 13V83H25.8V37.3Zm-10.3-.2h15.8V83H15.5V37.1Zm8-20.6c5.1 0 9.2 4.1 9.2 9.2 0 5.1-4.1 9.3-9.2 9.3s-9.2-4.2-9.2-9.3c0-5.1 4.1-9.2 9.2-9.2Z"
                fill="#FFFFFF"
            />
        </svg>
    )
}