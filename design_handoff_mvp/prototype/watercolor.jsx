// watercolor.jsx — generative watercolor washes, voice orb, waveform.
// Uses feTurbulence/feDisplacementMap to bleed soft shapes into paper —
// abstract, symbolic texture (never hand-drawn illustration).

const { useState, useEffect, useRef } = React;

/* Global SVG filter defs — mounted once. */
function WatercolorDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <filter id="wc-bleed" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.013" numOctaves="4" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="34" xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id="wc-bleed-2" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="22" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="wc-paper" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="p" />
          <feColorMatrix in="p" type="saturate" values="0" />
          <feComponentTransfer><feFuncA type="linear" slope="0.06" /></feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
      </defs>
    </svg>
  );
}

/* A single watercolor bloom — blurred, displaced blob of color. */
function Bloom({ color, cx = 50, cy = 50, r = 40, seed = 1, opacity, filter = 'wc-bleed', className = '', style }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
         className={className}
         style={{ width: '100%', height: '100%', display: 'block', ...style }} aria-hidden="true">
      <g filter={`url(#${filter})`} style={{ mixBlendMode: 'multiply' }}>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * (0.82 + (seed % 5) * 0.04)}
                 fill={color} opacity={opacity != null ? opacity : 'var(--bloom-opacity)'} />
        <ellipse cx={cx + (seed % 7) - 3} cy={cy + (seed % 5) - 2} rx={r * 0.62} ry={r * 0.66}
                 fill={color} opacity={(opacity != null ? opacity : 0.55) * 0.7} />
      </g>
    </svg>
  );
}

/* Layered watercolor artwork used inside memory cards / canvas tiles. */
function WatercolorArt({ palette = ['var(--bloom-a)', 'var(--bloom-b)'], seed = 1, motif }) {
  const [a, b, c] = [palette[0], palette[1] || palette[0], palette[2] || palette[1] || palette[0]];
  return (
    <div className="wc-art" aria-hidden="true"
         style={{ background: `linear-gradient(160deg, color-mix(in oklab, ${a} 18%, var(--surface)), color-mix(in oklab, ${b} 12%, var(--surface)))` }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g filter="url(#wc-bleed)" style={{ mixBlendMode: 'multiply' }}>
          <ellipse cx={32 + (seed % 6)} cy={44} rx={34} ry={30} fill={a} opacity="var(--bloom-opacity)" />
          <ellipse cx={70 - (seed % 5)} cy={58} rx={28} ry={26} fill={b} opacity="calc(var(--bloom-opacity) * 0.85)" />
          <ellipse cx={54} cy={34 + (seed % 4)} rx={18} ry={17} fill={c} opacity="calc(var(--bloom-opacity) * 0.7)" />
        </g>
      </svg>
      {motif ? <span className="wc-art__motif">{motif}</span> : null}
    </div>
  );
}

/* Pulsing voice orb for the interview centerpiece. */
function VoiceOrb({ active = true, size = 196, persona }) {
  return (
    <div className="orb" style={{ width: size, height: size }} data-active={active}>
      <div className="orb__halo orb__halo--1" />
      <div className="orb__halo orb__halo--2" />
      <div className="orb__core">
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
          <g filter="url(#wc-bleed-2)" style={{ mixBlendMode: 'screen' }}>
            <ellipse cx="38" cy="40" rx="34" ry="32" fill="var(--bloom-a)" opacity="0.9" />
            <ellipse cx="64" cy="58" rx="30" ry="30" fill="var(--bloom-b)" opacity="0.8" />
            <ellipse cx="52" cy="46" rx="20" ry="20" fill="#fff" opacity="0.5" />
          </g>
        </svg>
        {persona ? <span className="orb__glyph">{persona}</span> : null}
      </div>
    </div>
  );
}

/* Live audio waveform (animated bars). */
function Waveform({ bars = 38, active = true, color = 'var(--accent)' }) {
  return (
    <div className="wave" data-active={active} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className="wave__bar"
              style={{ '--i': i, background: color,
                       animationDelay: `${(i % 9) * -0.13}s`,
                       height: `${18 + Math.abs(Math.sin(i * 1.7)) * 60}%` }} />
      ))}
    </div>
  );
}

Object.assign(window, { WatercolorDefs, Bloom, WatercolorArt, VoiceOrb, Waveform });
