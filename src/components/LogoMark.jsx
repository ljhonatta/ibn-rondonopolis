// Logo IBN (globo oval com chama em cometa + "IBNROO") redesenhada em vetor, na cor do texto (currentColor).
// Se existir public/img/logo.png (arquivo oficial), o componente Logo usa o PNG no lugar desta.
export const LOGO_SVG_BODY = `
  <defs>
    <clipPath id="ibn-globo"><ellipse cx="355" cy="185" rx="157" ry="77"/></clipPath>
    <mask id="ibn-vao">
      <rect width="720" height="500" fill="#fff"/>
      <ellipse cx="355" cy="185" rx="174" ry="93" fill="#000"/>
    </mask>
  </defs>
  <path mask="url(#ibn-vao)" d="M200 140C215 90 270 52 345 40C395 32 430 22 455 0C452 22 440 36 424 46C470 40 510 26 540 6C532 32 508 50 480 58C530 58 575 46 612 24C600 54 566 72 524 80C570 84 610 80 645 66C628 96 588 110 540 110C565 124 590 132 615 134C580 154 530 152 500 140L470 160C400 118 300 112 215 130Z"/>
  <ellipse cx="355" cy="185" rx="165" ry="85" fill="none" stroke="currentColor" stroke-width="12"/>
  <g clip-path="url(#ibn-globo)">
    <rect x="180" y="108" width="360" height="26"/>
    <rect x="180" y="146" width="360" height="26"/>
    <rect x="180" y="184" width="360" height="26"/>
    <rect x="180" y="222" width="360" height="26"/>
    <rect x="180" y="260" width="360" height="26"/>
  </g>
  <ellipse cx="318" cy="185" rx="54" ry="85" fill="none" stroke="currentColor" stroke-width="14"/>
`

export default function LogoMark({ wordmark = true, className = '' }) {
  return (
    <svg
      viewBox={wordmark ? '0 0 720 500' : '160 0 400 290'}
      className={className}
      fill="currentColor"
      role="img"
      aria-label="IBN Rondonópolis"
    >
      <g dangerouslySetInnerHTML={{ __html: LOGO_SVG_BODY }} />
      {wordmark && (
        <text
          x="360"
          y="478"
          textAnchor="middle"
          fontFamily="Montserrat, system-ui, sans-serif"
          fontWeight="600"
          fontSize="190"
          textLength="700"
          lengthAdjust="spacingAndGlyphs"
        >
          IBNROO
        </text>
      )}
    </svg>
  )
}
