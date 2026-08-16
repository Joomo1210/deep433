export const TEAM_FLAGS = {
  "Czechia": "🇨🇿", "South Africa": "🇿🇦", "Mexico": "🇲🇽", "South Korea": "🇰🇷",
  "Switzerland": "🇨🇭", "Bosnia & Herzegovina": "🇧🇦", "Canada": "🇨🇦", "Qatar": "🇶🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Morocco": "🇲🇦", "Brazil": "🇧🇷", "Haiti": "🇭🇹",
  "USA": "🇺🇸", "Australia": "🇦🇺", "Turkey": "🇹🇷", "Paraguay": "🇵🇾",
  "Germany": "🇩🇪", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨", "Curacao": "🇨🇼",
  "Netherlands": "🇳🇱", "Sweden": "🇸🇪", "Tunisia": "🇹🇳", "Japan": "🇯🇵",
  "Belgium": "🇧🇪", "Iran": "🇮🇷", "New Zealand": "🇳🇿", "Egypt": "🇪🇬",
  "Spain": "🇪🇸", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾", "Cape Verde": "🇨🇻",
  "France": "🇫🇷", "Iraq": "🇮🇶", "Norway": "🇳🇴", "Senegal": "🇸🇳",
  "Argentina": "🇦🇷", "Austria": "🇦🇹", "Jordan": "🇯🇴", "Algeria": "🇩🇿",
  "Portugal": "🇵🇹", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴", "Congo DR": "🇨🇩",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Ghana": "🇬🇭", "Panama": "🇵🇦", "Croatia": "🇭🇷",
};

function Shield({ cx, cy, number, color, border, delay = 0 }) {
  return (
    <g className="shield-reveal" style={{ animationDelay: `${delay}s`, transformBox: "fill-box", transformOrigin: "center" }}>
      <path
        d={`M${cx-13},${cy-16} Q${cx},${cy-20} ${cx+13},${cy-16} L${cx+13},${cy+8} Q${cx},${cy+20} ${cx-13},${cy+8} Z`}
        fill={color} stroke={border} strokeWidth="2"
      />
      <text x={cx} y={cy+14} textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="10" fontWeight="700" fill="#ffffff">{number}</text>
    </g>
  );
}

export default function PitchView({ homeTeam, awayTeam, homeFormation, awayFormation }) {
  const homeFlag = TEAM_FLAGS[homeTeam] || "🏳️";
  const awayFlag = TEAM_FLAGS[awayTeam] || "🏳️";
  // Parse formation e.g. "4-3-3" -> [4,3,3]
  const parseFormation = (f) => {
    if (!f) return [4,3,3];
    return f.split("-").map(Number);
  };
  const hForm = parseFormation(homeFormation);
  const aForm = parseFormation(awayFormation);
  // Generate player positions for a formation (top half, y range 55-390)
  const getPositions = (formation, yStart, yEnd) => {
    const rows = [1, ...formation]; // GK + formation rows
    const totalRows = rows.length;
    const positions = [];
    rows.forEach((count, rowIdx) => {
      const y = yStart + (rowIdx / (totalRows - 1)) * (yEnd - yStart);
      for (let i = 0; i < count; i++) {
        const x = 340 + (count === 1 ? 0 : (i - (count - 1) / 2) * (560 / count));
        positions.push({ x: Math.min(Math.max(x, 65), 615), y });
      }
    });
    return positions;
  };
  // Home team top half (y 55 to 390), Away team bottom half flipped (y 430 to 765)
  const homePositions = getPositions(hForm, 60, 385);
  const awayPositions = getPositions(aForm, 765, 440); // reversed
  let homeNum = 1;
  let awayNum = 1;
  return (
    <svg viewBox="0 0 680 820" style={{ width: "100%", display: "block" }} aria-label={`${homeTeam} vs ${awayTeam} tactical pitch`}>
      <style>{`
        @keyframes shieldReveal {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        .shield-reveal { animation: shieldReveal 0.35s ease-out forwards; opacity: 0; }
      `}</style>
      {/* Pitch */}
      <rect x="0" y="0" width="680" height="820" fill="#1a2e1a"/>
      {[0,1,2,3,4,5,6,7].map(i => <rect key={i} x={i*85} y="0" width="42" height="820" fill="#1e321e"/>)}
      {/* Lines */}
      <rect x="30" y="30" width="620" height="760" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" rx="4"/>
      <line x1="30" y1="410" x2="650" y2="410" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <circle cx="340" cy="410" r="65" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <circle cx="340" cy="410" r="4" fill="rgba(255,255,255,0.6)"/>
      <rect x="175" y="30" width="330" height="115" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <rect x="240" y="30" width="200" height="55" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <rect x="285" y="18" width="110" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <rect x="175" y="675" width="330" height="115" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <rect x="240" y="735" width="200" height="55" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <rect x="285" y="788" width="110" height="14" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
      <circle cx="340" cy="118" r="3" fill="rgba(255,255,255,0.5)"/>
      <circle cx="340" cy="702" r="3" fill="rgba(255,255,255,0.5)"/>
      {/* Watermark */}
      <text x="340" y="422" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="26" fontWeight="900" fill="rgba(255,255,255,0.04)">DEEP433</text>
      {/* Team labels */}
      <text x="340" y="20" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.65)">{homeTeam} · {homeFormation || "4-3-3"}</text>
      <text x="340" y="816" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="12" fontWeight="700" fill="rgba(255,255,255,0.65)">{awayTeam} · {awayFormation || "4-4-2"}</text>
      {/* Home players */}
      {homePositions.map((pos, i) => (
        <Shield key={`h${i}`} cx={pos.x} cy={pos.y} number={homeNum++} color="#0f3460" border="#4ade80" delay={i * 0.12}/>
      ))}
      {/* Away players */}
      {awayPositions.map((pos, i) => (
        <Shield key={`a${i}`} cx={pos.x} cy={pos.y} number={awayNum++} color="#3d0000" border="#f59e0b" delay={i * 0.12}/>
      ))}
    </svg>
  );
}
