// Original vector illustration. The optical tube, finder, diagonal and mount share one axis.
export function observatoryIllustration(prefix) {
  const key = `${prefix}-optics`;
  const paint = name => `url(#${key}-${name})`;
  return `<defs>
    <radialGradient id="${key}-sky" cx=".38" cy=".28" r=".85"><stop stop-color="#334554"/><stop offset=".55" stop-color="#182936"/><stop offset="1" stop-color="#0c1826"/></radialGradient>
    <radialGradient id="${key}-sky-glow"><stop stop-color="#b6cacc" stop-opacity=".13"/><stop offset="1" stop-color="#b6cacc" stop-opacity="0"/></radialGradient>
    <linearGradient id="${key}-enamel" x1="0" y1="-21" x2="0" y2="21" gradientUnits="userSpaceOnUse"><stop stop-color="#a2a9a6"/><stop offset=".13" stop-color="#f7f6eb"/><stop offset=".35" stop-color="#fffef5"/><stop offset=".62" stop-color="#e4e4d8"/><stop offset=".85" stop-color="#b4bdb8"/><stop offset="1" stop-color="#6e8284"/></linearGradient>
    <linearGradient id="${key}-burgundy" x1="0" y1="-27" x2="0" y2="27" gradientUnits="userSpaceOnUse"><stop stop-color="#6b233d"/><stop offset=".2" stop-color="#b9647c"/><stop offset=".42" stop-color="#9c425e"/><stop offset=".72" stop-color="#792b45"/><stop offset="1" stop-color="#491b2e"/></linearGradient>
    <linearGradient id="${key}-metal" x1="0" y1="-27" x2="0" y2="27" gradientUnits="userSpaceOnUse"><stop stop-color="#647980"/><stop offset=".16" stop-color="#d5dfda"/><stop offset=".38" stop-color="#fbfcf1"/><stop offset=".6" stop-color="#b8c8c4"/><stop offset="1" stop-color="#455f6b"/></linearGradient>
    <linearGradient id="${key}-graphite" x1="0" y1="0" x2="1" y2=".75"><stop stop-color="#779094"/><stop offset=".25" stop-color="#3e555e"/><stop offset=".65" stop-color="#253b47"/><stop offset="1" stop-color="#142632"/></linearGradient>
    <linearGradient id="${key}-leg" x1="0" y1="0" x2="1" y2=".2"><stop stop-color="#526b76"/><stop offset=".25" stop-color="#dce5df"/><stop offset=".43" stop-color="#fbfcf2"/><stop offset=".65" stop-color="#a8bcbc"/><stop offset="1" stop-color="#3e5a66"/></linearGradient>
    <radialGradient id="${key}-glass" cx=".3" cy=".2" r=".86"><stop stop-color="#4c929b"/><stop offset=".32" stop-color="#244e65"/><stop offset=".7" stop-color="#102c45"/><stop offset="1" stop-color="#061626"/></radialGradient>
    <linearGradient id="${key}-glass-reflection" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c6eee5" stop-opacity=".75"/><stop offset=".6" stop-color="#6dadd1" stop-opacity=".13"/><stop offset="1" stop-color="#93cee3" stop-opacity="0"/></linearGradient>
    <radialGradient id="${key}-moon" cx=".32" cy=".25" r=".85"><stop stop-color="#f5f2dc"/><stop offset=".5" stop-color="#c9d0c7"/><stop offset="1" stop-color="#6f8590"/></radialGradient>
    <radialGradient id="${key}-ground-shadow"><stop stop-color="#07131d" stop-opacity=".55"/><stop offset="1" stop-color="#07131d" stop-opacity="0"/></radialGradient>
    <clipPath id="${key}-moon-disc"><circle cx="251" cy="61" r="23"/></clipPath>
    <clipPath id="${key}-lens"><ellipse cx="-12" cy="0" rx="8" ry="22"/></clipPath>
    <filter id="${key}-shadow" x="-25%" y="-25%" width="150%" height="160%"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#050e18" flood-opacity=".32"/></filter>
  </defs><g fill="none">
  <circle cx="160" cy="140" r="133" fill="${paint('sky')}"/>
  <ellipse cx="122" cy="99" rx="106" ry="94" fill="${paint('sky-glow')}"/>
  <path d="M57 226a133 133 0 0 0 205-4" stroke="#8ca0a3" stroke-opacity=".12"/>
  <g fill="#e3e8d8"><circle cx="58" cy="74" r="1.2" opacity=".85"/><circle cx="117" cy="35" r="1.1" opacity=".7"/><circle cx="193" cy="31" r=".8" opacity=".65"/><circle cx="217" cy="109" r="1.4" opacity=".85"/><circle cx="275" cy="143" r=".9" opacity=".7"/><circle cx="49" cy="172" r=".8" opacity=".65"/><circle cx="95" cy="209" r="1.1" opacity=".6"/><circle cx="241" cy="218" r="1.2" opacity=".75"/><circle cx="188" cy="234" r=".7" opacity=".6"/></g>
  <g stroke="#f4dfb7" stroke-linecap="round"><path d="M176 72v6m-3-3h6" stroke-width=".65" opacity=".8"/><path d="M71 135v4m-2-2h4" stroke-width=".55" opacity=".55"/></g>
  <g clip-path="${paint('moon-disc')}">
    <circle cx="251" cy="61" r="23" fill="${paint('moon')}"/>
    <path d="M234 48q12-8 16 1t-8 11q-10 1-8-12m20 12q10-10 15-1t-3 13q-12 1-12-12" fill="#5d7580" opacity=".2"/>
    <g fill="#617b86" fill-opacity=".25" stroke="#f5f2df" stroke-opacity=".35" stroke-width=".5"><circle cx="239" cy="65" r="3"/><circle cx="252" cy="45" r="2.5"/><circle cx="251" cy="73" r="4"/><circle cx="263" cy="53" r="2"/><circle cx="242" cy="54" r="1.4"/></g>
    <path d="M251 38a23 23 0 0 1 0 46c10-12 10-34 0-46" fill="#0f2030" fill-opacity=".92"/>
  </g>
  <ellipse cx="161" cy="300" rx="105" ry="10" fill="${paint('ground-shadow')}"/>
  <g filter="${paint('shadow')}">
    <path d="m157 210 9 2-3 68-7 1Z" fill="${paint('leg')}"/>
    <path d="m157 275 6-1 1 8q-4 4-9 1Z" fill="#172a34"/>
    <path d="m153 210 9 5-59 83-10-1Z" fill="${paint('leg')}" stroke="#5d7580" stroke-width=".6"/>
    <path d="m158 218 1 3-55 74-3-1Z" fill="#edf2e5" fill-opacity=".55"/>
    <path d="m94 291 11 4-3 7q-6 3-11-1Z" fill="#1a303b"/>
    <path d="m166 212 9-4 62 87-10 5Z" fill="${paint('leg')}" stroke="#536e7c" stroke-width=".7"/>
    <path d="m173 217 3-1 55 77-3 2Z" fill="#f6f9ed" fill-opacity=".55"/>
    <path d="m225 295 11-4 4 8q-4 5-10 4Z" fill="#172c38"/>
    <g fill="#2d4855" stroke="#93a9ab" stroke-width=".65"><path d="m115 258 9 5-5 7-9-5Z"/><path d="m201 263 9-6 6 7-10 6Z"/></g>
    <g stroke="#718c94" stroke-width="2" stroke-linejoin="round"><path d="m124 255 36 11 45-11-42-18Z" fill="#243e4a"/><path d="m160 217 0 48m-36-10 36-38 45 38" fill="none"/></g>
    <path d="m126 255 34 8 41-9" stroke="#c0d0cd" stroke-opacity=".55" stroke-width=".7"/>
    <ellipse cx="150" cy="252" rx="4" ry="2" fill="#142c3b"/><ellipse cx="174" cy="252" rx="4" ry="2" fill="#142c3b"/>
    <path d="M144 207q18-8 36 0v10q-18 7-36 0Z" fill="${paint('graphite')}"/>
    <ellipse cx="162" cy="207" rx="18" ry="5" fill="#7c9293" stroke="#b3c3bd" stroke-width=".6"/>
    <path d="M156 188h12v20q-6 4-12 0Z" fill="${paint('leg')}"/>
    <path d="m147 169 10-3 14 23-6 11-12-8Z" fill="${paint('graphite')}" stroke="#84989a" stroke-width=".8"/>
    <path d="m152 176 4-1 10 17-3 4Z" fill="#b0bdb5" fill-opacity=".5"/>
    <path d="m155 188-33 18" stroke="#8ea6aa" stroke-width="3" stroke-linecap="round"/>
    <path d="m124 205-13 7" stroke="#233e4a" stroke-width="6" stroke-linecap="round"/>
    <g transform="translate(84 88) rotate(36)">
      <path d="M18-19h115v38H18Z" fill="${paint('enamel')}" stroke="#98aaa7" stroke-width=".6"/>
      <ellipse cx="133" cy="0" rx="7" ry="19" fill="#64808a"/>
      <path d="M126-20h12v40h-12Z" fill="${paint('graphite')}"/>
      <path d="M128-19h2v38h-2Z" fill="${paint('metal')}"/>
      <path d="M138-9h21V9h-21Z" fill="${paint('metal')}" stroke="#738d93" stroke-width=".6"/>
      <path d="M150-9h7V9h-7Z" fill="${paint('graphite')}"/>
      <path d="m157-9 15 1 7 8-8 12-14-3Z" fill="${paint('graphite')}" stroke="#90a5a6" stroke-width=".7"/>
      <path d="m164-9 7-10 7 4-5 16Z" fill="#bdc9c2"/>
      <g transform="translate(173 -18) rotate(22)"><path d="M-5-15h10V2H-5Z" fill="${paint('metal')}"/><path d="M-6-21H6v9H-6Z" fill="${paint('graphite')}"/><ellipse cy="-21" rx="6" ry="2.8" fill="#132c3c" stroke="#b5c9c7" stroke-width=".6"/><path d="M-5-16H5m-10 2H5" stroke="#83999d" stroke-width=".7"/></g>
      <path d="M143 6v8" stroke="#728a91" stroke-width="2"/>
      <ellipse cx="144" cy="16" rx="5" ry="3" fill="#213b48" stroke="#8a9c9c" stroke-width=".7"/>
      <path d="M47-19v-15h7v15m41 0v-15h7v15" fill="${paint('graphite')}" stroke="#a1b2af" stroke-width=".5"/>
      <path d="M41-42h60v10H41Z" fill="${paint('enamel')}" stroke="#8ea4a7" stroke-width=".6"/>
      <path d="M38-44h12v14H38Z" fill="${paint('graphite')}"/>
      <ellipse cx="38" cy="-37" rx="3" ry="7" fill="#2c5c70" stroke="#a8c3c2" stroke-width="1"/>
      <path d="M101-40h13v6h-13Z" fill="${paint('graphite')}"/><path d="M45-40h49" stroke="#fffef4" stroke-opacity=".8" stroke-width=".9"/>
      <g fill="${paint('graphite')}" stroke="#829b9f" stroke-width=".5"><path d="M51-20h8v42h-8Z"/><path d="M99-20h8v42h-8Z"/></g>
      <path d="M52-18h2v34m46-34h2v34" stroke="#f3f6e9" stroke-opacity=".65"/>
      <path d="M49 21h61v8H49Z" fill="#203743" stroke="#80999d" stroke-width=".7"/>
      <path d="M52 22h55" stroke="#aebcb6" stroke-width="1"/>
      <path d="M21-25h-34v50h34q7-25 0-50Z" fill="${paint('burgundy')}" stroke="#d4a1a7" stroke-width=".7"/>
      <ellipse cx="-13" cy="0" rx="12" ry="26" fill="${paint('metal')}" stroke="#c0d1cb" stroke-width=".6"/>
      <ellipse cx="-13" cy="0" rx="10" ry="24" fill="#183747"/>
      <ellipse cx="-12" cy="0" rx="8" ry="22" fill="${paint('glass')}" stroke="#75acb7" stroke-width=".65"/>
      <g clip-path="${paint('lens')}"><path d="m-22-16 17-12 10 19-21 24Z" fill="${paint('glass-reflection')}"/><path d="m-21 11 21-20" stroke="#95ced3" stroke-opacity=".3" stroke-width="1"/></g>
      <path d="M-17-20q-7 17 0 37" stroke="#f3e6ca" stroke-opacity=".75" stroke-width=".6" fill="none"/>
      <path d="M-7-22h25" stroke="#e7acb4" stroke-opacity=".6" stroke-width=".7"/>
      <path d="M29-12h17m17 0h30m18 0h10" stroke="#fffef4" stroke-opacity=".7" stroke-width="1"/>
    </g>
    <circle cx="154" cy="181" r="10" fill="${paint('graphite')}" stroke="#9bb0ae" stroke-width="1"/>
    <circle cx="154" cy="181" r="6.5" fill="#b4a178" stroke="#e8d8ad" stroke-width=".7"/>
    <circle cx="154" cy="181" r="3.4" fill="#6f5c47"/>
    <path d="m152 181 2-2 2 2-2 2Z" fill="#e4d5ad"/>
    <circle cx="175" cy="204" r="3" fill="#223d4a" stroke="#a9bcb8" stroke-width=".5"/>
  </g></g>`;
}
