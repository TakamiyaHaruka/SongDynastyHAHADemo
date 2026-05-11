export interface HomeGalleryItem {
  src: string
  alt: string
  widths: number[]
  sizes: string
}

export interface HomeGallerySeasonItem {
  src: string
  alt: string
  label: string
  widths: number[]
  sizes: string
}

const svg = (content: string, w = 600, h = 800) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">${content}</svg>`)}`

// 四季水墨风格
export const homeGallerySeasons: HomeGallerySeasonItem[] = [
  {
    src: svg(`
      <rect width="600" height="800" fill="#f5f0e8"/>
      <path d="M0 650 Q150 500 300 580 Q450 660 600 520 L600 800 L0 800Z" fill="#7a9e7a" opacity="0.4"/>
      <path d="M0 700 Q100 620 250 660 Q400 700 600 600 L600 800 L0 800Z" fill="#5a7e5a" opacity="0.5"/>
      <circle cx="480" cy="120" r="60" fill="#f5e6d0" opacity="0.6"/>
      <path d="M100 500 Q120 450 140 500 Q160 450 180 500" fill="none" stroke="#8b4513" stroke-width="2"/>
      <circle cx="130" cy="460" r="12" fill="#e8a0b0" opacity="0.7"/>
      <circle cx="150" cy="440" r="10" fill="#e8a0b0" opacity="0.6"/>
      <circle cx="170" cy="455" r="11" fill="#e8a0b0" opacity="0.65"/>
      <circle cx="140" cy="430" r="8" fill="#e8a0b0" opacity="0.5"/>
      <circle cx="160" cy="425" r="9" fill="#e8a0b0" opacity="0.55"/>
      <text x="480" y="700" text-anchor="middle" font-family="serif" font-size="36" fill="#2c2c2c" opacity="0.4">春</text>
    `),
    alt: '春 · 桃花流水', label: '春', widths: [400, 600], sizes: '(min-width: 768px) 25vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="800" fill="#e8e0d0"/>
      <path d="M0 500 Q100 450 200 480 Q350 520 450 460 Q550 400 600 440 L600 800 L0 800Z" fill="#5a8a6a" opacity="0.3"/>
      <path d="M0 600 Q150 540 300 580 Q450 620 600 560 L600 800 L0 800Z" fill="#4a7a5a" opacity="0.4"/>
      <ellipse cx="300" cy="480" rx="40" ry="25" fill="#e85050" opacity="0.25"/>
      <ellipse cx="320" cy="470" rx="35" ry="22" fill="#e85050" opacity="0.2"/>
      <path d="M280 520 Q300 480 320 520" fill="none" stroke="#4a7a4a" stroke-width="2"/>
      <circle cx="200" cy="300" r="50" fill="#f5d060" opacity="0.15"/>
      <path d="M150 600 L160 580 L155 560 L165 540" fill="none" stroke="#4a7a4a" stroke-width="2"/>
      <path d="M400 650 L410 620 L405 600 L415 580" fill="none" stroke="#4a7a4a" stroke-width="2"/>
      <text x="480" y="700" text-anchor="middle" font-family="serif" font-size="36" fill="#2c2c2c" opacity="0.4">夏</text>
    `),
    alt: '夏 · 荷塘清趣', label: '夏', widths: [400, 600], sizes: '(min-width: 768px) 25vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="800" fill="#f0e8d8"/>
      <path d="M0 550 Q100 480 250 520 Q400 560 600 480 L600 800 L0 800Z" fill="#8a7a5a" opacity="0.3"/>
      <path d="M0 650 Q150 580 300 620 Q450 660 600 580 L600 800 L0 800Z" fill="#7a6a4a" opacity="0.4"/>
      <path d="M120 350 L140 320 L130 300 L150 280 L135 270" fill="none" stroke="#8b4513" stroke-width="2"/>
      <circle cx="140" cy="290" r="8" fill="#c0392b" opacity="0.5"/>
      <circle cx="155" cy="275" r="7" fill="#c0392b" opacity="0.45"/>
      <circle cx="130" cy="310" r="9" fill="#c0392b" opacity="0.55"/>
      <path d="M400 400 L420 370 L410 350 L430 330" fill="none" stroke="#8b4513" stroke-width="2"/>
      <circle cx="420" cy="340" r="7" fill="#c0392b" opacity="0.5"/>
      <circle cx="435" cy="325" r="6" fill="#c0392b" opacity="0.4"/>
      <path d="M300 200 L310 180 L320 190 L330 170" fill="none" stroke="#8b4513" stroke-width="1.5" opacity="0.5"/>
      <text x="480" y="700" text-anchor="middle" font-family="serif" font-size="36" fill="#2c2c2c" opacity="0.4">秋</text>
    `),
    alt: '秋 · 枫叶如丹', label: '秋', widths: [400, 600], sizes: '(min-width: 768px) 25vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="800" fill="#e8e4e0"/>
      <path d="M0 600 Q200 550 400 580 Q500 600 600 560 L600 800 L0 800Z" fill="#d0ccc8" opacity="0.5"/>
      <path d="M250 300 L270 250 L260 200 L280 150" fill="none" stroke="#5a5a5a" stroke-width="3"/>
      <path d="M260 200 L290 180" fill="none" stroke="#5a5a5a" stroke-width="2"/>
      <path d="M270 250 L240 230" fill="none" stroke="#5a5a5a" stroke-width="2"/>
      <path d="M280 150 L310 130" fill="none" stroke="#5a5a5a" stroke-width="1.5"/>
      <circle cx="280" cy="140" r="20" fill="#fff" opacity="0.3"/>
      <circle cx="290" cy="180" r="15" fill="#fff" opacity="0.25"/>
      <circle cx="240" cy="230" r="12" fill="#fff" opacity="0.2"/>
      <path d="M400 350 L420 300 L415 270" fill="none" stroke="#5a5a5a" stroke-width="2.5"/>
      <path d="M415 270 L440 250" fill="none" stroke="#5a5a5a" stroke-width="2"/>
      <circle cx="415" cy="265" r="18" fill="#fff" opacity="0.3"/>
      <circle cx="440" cy="250" r="12" fill="#fff" opacity="0.25"/>
      <line x1="100" y1="680" x2="120" y2="670" stroke="#8a8a8a" stroke-width="0.5" opacity="0.3"/>
      <line x1="200" y1="700" x2="230" y2="690" stroke="#8a8a8a" stroke-width="0.5" opacity="0.3"/>
      <line x1="400" y1="670" x2="440" y2="660" stroke="#8a8a8a" stroke-width="0.5" opacity="0.3"/>
      <text x="480" y="700" text-anchor="middle" font-family="serif" font-size="36" fill="#2c2c2c" opacity="0.4">冬</text>
    `),
    alt: '冬 · 踏雪寻梅', label: '冬', widths: [400, 600], sizes: '(min-width: 768px) 25vw, 50vw'
  },
]

// 古典水墨画风格
export const homeGalleryItems: HomeGalleryItem[] = [
  {
    src: svg(`
      <rect width="600" height="800" fill="#f8f4ee"/>
      <path d="M0 600 Q100 520 200 560 Q350 620 500 540 Q550 520 600 550 L600 800 L0 800Z" fill="#6a8a6a" opacity="0.3"/>
      <path d="M0 680 Q150 620 300 650 Q450 680 600 620 L600 800 L0 800Z" fill="#5a7a5a" opacity="0.4"/>
      <path d="M100 500 L120 450 L110 400 L130 350 L120 300" fill="none" stroke="#3a5a3a" stroke-width="2.5"/>
      <path d="M120 400 L90 370" fill="none" stroke="#3a5a3a" stroke-width="2"/>
      <path d="M130 350 L160 320" fill="none" stroke="#3a5a3a" stroke-width="2"/>
      <path d="M120 300 L90 270" fill="none" stroke="#3a5a3a" stroke-width="1.5"/>
      <ellipse cx="100" cy="380" rx="18" ry="10" fill="#3a5a3a" opacity="0.15" transform="rotate(-20 100 380)"/>
      <ellipse cx="150" cy="330" rx="16" ry="9" fill="#3a5a3a" opacity="0.12" transform="rotate(15 150 330)"/>
      <ellipse cx="85" cy="280" rx="14" ry="8" fill="#3a5a3a" opacity="0.1" transform="rotate(-25 85 280)"/>
      <circle cx="400" cy="200" r="45" fill="#f5e6d0" opacity="0.4"/>
      <text x="500" y="700" text-anchor="middle" font-family="serif" font-size="28" fill="#2c2c2c" opacity="0.3">竹石图</text>
    `, 600, 800),
    alt: '竹石清趣', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="400" fill="#f0e8d8"/>
      <path d="M0 250 Q100 200 200 230 Q350 270 500 210 Q550 190 600 220 L600 400 L0 400Z" fill="#7a9e7a" opacity="0.3"/>
      <path d="M0 320 Q150 270 300 300 Q450 330 600 280 L600 400 L0 400Z" fill="#5a7e5a" opacity="0.4"/>
      <path d="M150 180 Q180 150 200 180 Q220 150 240 180 Q260 150 280 180" fill="none" stroke="#8b4513" stroke-width="1.5"/>
      <circle cx="180" cy="160" r="6" fill="#e8a0b0" opacity="0.5"/>
      <circle cx="220" cy="150" r="5" fill="#e8a0b0" opacity="0.45"/>
      <circle cx="260" cy="155" r="7" fill="#e8a0b0" opacity="0.55"/>
      <text x="300" y="350" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">桃花流水</text>
    `, 600, 400),
    alt: '桃花流水鳜鱼肥', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="700" fill="#f5f0e8"/>
      <path d="M0 500 Q150 440 300 480 Q450 520 600 450 L600 700 L0 700Z" fill="#6a8a6a" opacity="0.25"/>
      <path d="M0 580 Q100 530 250 560 Q400 590 600 530 L600 700 L0 700Z" fill="#5a7a5a" opacity="0.35"/>
      <rect x="250" y="300" width="100" height="80" rx="2" fill="none" stroke="#8b4513" stroke-width="1.5"/>
      <polygon points="250,300 300,270 350,300" fill="none" stroke="#8b4513" stroke-width="1.5"/>
      <rect x="285" y="340" width="30" height="40" fill="#d4a574" opacity="0.3"/>
      <path d="M200 450 Q220 420 240 450" fill="none" stroke="#4a7a4a" stroke-width="1.5"/>
      <path d="M360 430 Q380 400 400 430" fill="none" stroke="#4a7a4a" stroke-width="1.5"/>
      <text x="300" y="650" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">山居图</text>
    `, 600, 700),
    alt: '山居秋暝', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="500" fill="#f8f4ee"/>
      <path d="M0 300 Q100 260 200 280 Q350 310 500 260 Q550 240 600 270 L600 500 L0 500Z" fill="#7a9e7a" opacity="0.25"/>
      <path d="M0 380 Q150 330 300 360 Q450 390 600 340 L600 500 L0 500Z" fill="#5a7e5a" opacity="0.35"/>
      <path d="M300 180 L300 350" fill="none" stroke="#5a5a5a" stroke-width="1"/>
      <ellipse cx="300" cy="250" rx="45" ry="25" fill="#e85050" opacity="0.2"/>
      <ellipse cx="310" cy="240" rx="40" ry="22" fill="#e85050" opacity="0.18"/>
      <path d="M280 350 Q300 320 320 350" fill="none" stroke="#4a7a4a" stroke-width="2"/>
      <path d="M100 400 Q110 380 120 400" fill="none" stroke="#4a7a4a" stroke-width="1.5"/>
      <path d="M480 380 Q490 360 500 380" fill="none" stroke="#4a7a4a" stroke-width="1.5"/>
      <text x="300" y="450" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">荷花</text>
    `, 600, 500),
    alt: '出水芙蓉', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="900" fill="#f0e8d8"/>
      <path d="M0 600 Q100 540 250 570 Q400 600 600 530 L600 900 L0 900Z" fill="#6a8a6a" opacity="0.3"/>
      <path d="M0 720 Q200 650 400 690 Q500 710 600 660 L600 900 L0 900Z" fill="#5a7a5a" opacity="0.4"/>
      <path d="M150 400 Q170 350 180 300 Q190 250 200 200" fill="none" stroke="#3a5a3a" stroke-width="3"/>
      <path d="M180 300 Q210 280 230 300" fill="none" stroke="#3a5a3a" stroke-width="2"/>
      <path d="M170 350 Q140 330 130 350" fill="none" stroke="#3a5a3a" stroke-width="2"/>
      <path d="M190 250 Q220 230 240 250" fill="none" stroke="#3a5a3a" stroke-width="1.5"/>
      <path d="M200 200 Q170 180 160 200" fill="none" stroke="#3a5a3a" stroke-width="1.5"/>
      <path d="M400 500 Q420 460 430 420 Q440 380 450 340" fill="none" stroke="#3a5a3a" stroke-width="2.5"/>
      <path d="M430 420 Q460 400 480 420" fill="none" stroke="#3a5a3a" stroke-width="2"/>
      <path d="M420 460 Q390 440 380 460" fill="none" stroke="#3a5a3a" stroke-width="2"/>
      <text x="450" y="800" text-anchor="middle" font-family="serif" font-size="28" fill="#2c2c2c" opacity="0.3">双松图</text>
    `, 600, 900),
    alt: '松下问童子', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="600" fill="#f5f0e8"/>
      <circle cx="300" cy="300" r="180" fill="none" stroke="#d4a574" stroke-width="1" opacity="0.4"/>
      <path d="M200 400 Q250 350 300 370 Q350 390 400 350" fill="none" stroke="#5a7a5a" stroke-width="2"/>
      <path d="M200 400 L200 500" fill="none" stroke="#5a7a5a" stroke-width="1.5"/>
      <path d="M400 350 L400 500" fill="none" stroke="#5a7a5a" stroke-width="1.5"/>
      <path d="M250 380 Q270 340 290 380" fill="none" stroke="#3a5a3a" stroke-width="1.5"/>
      <path d="M320 360 Q340 320 360 360" fill="none" stroke="#3a5a3a" stroke-width="1.5"/>
      <circle cx="300" cy="200" r="30" fill="#f5e6d0" opacity="0.3"/>
      <text x="300" y="550" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">园林</text>
    `, 600, 600),
    alt: '艮岳一隅', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="450" fill="#f8f4ee"/>
      <path d="M0 280 Q100 240 200 260 Q350 290 500 240 Q550 220 600 250 L600 450 L0 450Z" fill="#7a9e7a" opacity="0.25"/>
      <path d="M0 350 Q150 300 300 330 Q450 360 600 310 L600 450 L0 450Z" fill="#5a7e5a" opacity="0.35"/>
      <circle cx="300" cy="150" r="40" fill="#f5e6d0" opacity="0.4"/>
      <path d="M200 250 L220 220 L210 200 L230 180" fill="none" stroke="#5a5a5a" stroke-width="1.5"/>
      <path d="M380 230 L400 200 L390 180 L410 160" fill="none" stroke="#5a5a5a" stroke-width="1.5"/>
      <text x="300" y="400" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">秋山</text>
    `, 600, 450),
    alt: '秋山晚翠', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="750" fill="#f0e8d8"/>
      <path d="M0 550 Q150 490 300 520 Q450 550 600 490 L600 750 L0 750Z" fill="#6a8a6a" opacity="0.3"/>
      <path d="M0 640 Q100 590 250 620 Q400 650 600 590 L600 750 L0 750Z" fill="#5a7a5a" opacity="0.4"/>
      <path d="M280 350 Q300 300 320 350 Q340 300 360 350" fill="none" stroke="#8b4513" stroke-width="1.5"/>
      <circle cx="310" cy="310" r="8" fill="#c0392b" opacity="0.4"/>
      <circle cx="340" cy="305" r="7" fill="#c0392b" opacity="0.35"/>
      <circle cx="325" cy="290" r="6" fill="#c0392b" opacity="0.3"/>
      <path d="M320 350 L320 500" fill="none" stroke="#5a5a5a" stroke-width="1.5"/>
      <path d="M100 500 Q120 470 140 500" fill="none" stroke="#4a7a4a" stroke-width="1.5"/>
      <path d="M460 480 Q480 450 500 480" fill="none" stroke="#4a7a4a" stroke-width="1.5"/>
      <text x="300" y="700" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">寒梅</text>
    `, 600, 750),
    alt: '寒梅傲雪', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
  {
    src: svg(`
      <rect width="600" height="550" fill="#f5f0e8"/>
      <path d="M0 350 Q100 300 200 330 Q350 370 500 310 Q550 290 600 320 L600 550 L0 550Z" fill="#7a9e7a" opacity="0.25"/>
      <path d="M0 430 Q150 380 300 410 Q450 440 600 390 L600 550 L0 550Z" fill="#5a7e5a" opacity="0.35"/>
      <path d="M250 200 L270 180 L280 190 L300 170 L310 185 L330 165" fill="none" stroke="#5a5a5a" stroke-width="1.5"/>
      <circle cx="300" cy="280" r="35" fill="#e85050" opacity="0.15"/>
      <circle cx="310" cy="270" r="30" fill="#e85050" opacity="0.12"/>
      <path d="M280 320 Q300 290 320 320" fill="none" stroke="#4a7a4a" stroke-width="2"/>
      <text x="300" y="500" text-anchor="middle" font-family="serif" font-size="24" fill="#2c2c2c" opacity="0.3">仙鹤</text>
    `, 600, 550),
    alt: '瑞鹤呈祥', widths: [400, 600], sizes: '(min-width: 768px) 33vw, 50vw'
  },
]
