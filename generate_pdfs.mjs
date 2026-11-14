import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';

const outDir = path.resolve('project_docs_and_ppt');
fs.mkdirSync(outDir, { recursive: true });

function buildProjectDocumentationPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = 20;

  const drawPageHeader = (pageTitle) => {
    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, pageW, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(34, 211, 238);
    doc.text('SOL-7: INTERPLANETARY MISSION SIMULATOR — PROJECT DOCUMENTATION', margin, 9);
    doc.setTextColor(251, 191, 36);
    doc.text(pageTitle, pageW - margin, 9, { align: 'right' });
  };

  const checkPageBreak = (neededHeight, sectionLabel) => {
    if (y + neededHeight > pageH - 16) {
      doc.addPage();
      drawPageHeader(sectionLabel);
      y = 24;
    }
  };

  const addSectionHeading = (num, title) => {
    checkPageBreak(18, title);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(margin, y, contentW, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, y, contentW, 9, 1.5, 1.5, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(34, 211, 238);
    doc.text(`${num}. ${title.toUpperCase()}`, margin + 4, y + 6.2);
    y += 14;
  };

  const addSubHeading = (subtitle) => {
    checkPageBreak(10, subtitle);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(subtitle, margin, y);
    y += 5.5;
  };

  const addParagraph = (text) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(text, contentW);
    checkPageBreak(lines.length * 4.8 + 3, 'DOCUMENTATION');
    doc.text(lines, margin, y);
    y += lines.length * 4.6 + 3;
  };

  const addBullets = (items) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.3);
    doc.setTextColor(51, 65, 85);
    items.forEach((item) => {
      const lines = doc.splitTextToSize(item, contentW - 6);
      checkPageBreak(lines.length * 4.6 + 2, 'DOCUMENTATION');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(14, 116, 144);
      doc.text('•', margin + 1, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(lines, margin + 6, y);
      y += lines.length * 4.5 + 2;
    });
    y += 2;
  };

  // Cover Header
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, pageW, 52, 'F');
  doc.setDrawColor(34, 211, 238);
  doc.setLineWidth(0.8);
  doc.line(0, 52, pageW, 52);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36);
  doc.text('PROTOTYPE TECHNICAL & EDUCATIONAL DOCUMENTATION', margin, 15);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('SOL-7: 3D INTERPLANETARY MISSION', margin, 26);
  doc.text('SIMULATOR & NASA STORY ENGINE', margin, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'React 19 • Three.js (React Three Fiber) • Procedural CanvasTextures • Web Audio API • Real NASA Science',
    margin,
    44
  );

  y = 62;

  addSectionHeading('1', 'Executive Summary');
  addParagraph(
    'SOL-7 is a browser-native, interactive 3D space exploration simulator and decision-driven educational story game built with React 19, Three.js (React Three Fiber), TypeScript, and the Web Audio API. Designed for students, educators, and space enthusiasts, SOL-7 bridges the gap between passive space textbooks and complex orbital simulators.'
  );
  addParagraph(
    'Players register a personalized Astronaut Commander Dossier, walk across Earth Launch Complex 39A, launch aboard the SOL-7 Rocket to the 100 km Karman Line, navigate an interactive 8-planet + Moon 3D Solar System, execute a retro-propulsive landing on the Moon or Mars, and lead a 4-astronaut crew through 4 branching chapters grounded in real NASA Open Data (DONKI, DSN, OSDR, and ECLSS). Players can snap live 3D photos with the in-game EVA Camera and review them alongside their 4-Chapter Decision Flowchart Certificate.'
  );

  addSectionHeading('2', 'Problem Statements');
  addSubHeading('2.1 Passive & Disconnected Space STEM Education');
  addBullets([
    'Traditional space science relies on static textbook diagrams or raw telemetry tables that feel abstract to learners.',
    'Students rarely experience cause-and-effect leadership decisions—such as how a Coronal Mass Ejection (solar storm) impacts habitat power, radiation safety, and crew morale in real time.',
  ]);
  addSubHeading('2.2 High Hardware & Download Barriers');
  addBullets([
    'Existing 3D space simulators require expensive gaming GPUs and multi-gigabyte downloads, making them inaccessible on school laptops and standard web browsers.',
  ]);
  addSubHeading('2.3 Missing Human Teamwork & Life-Support Trade-offs');
  addBullets([
    'Most space games focus purely on piloting mechanics rather than the biological, engineering, and psychological challenges of keeping a 4-person astronaut crew alive on the Moon or Mars.',
  ]);

  addSectionHeading('3', 'Proposed Solution');
  addParagraph(
    'SOL-7 delivers a 100% procedural, zero-asset-download 3D WebGL mission experience across five integrated stages:'
  );
  addBullets([
    'Stage 1 — Pre-Flight Astronaut Briefing & Live Dossier: Players configure Commander Name, Age Rank, Difficulty Mode (Cadet with hints, Astronaut, or Commander), Destination (Moon or Mars), 3D Suit Avatar, and Mission Patch.',
    'Stage 2 — Earth Launchpad & Dual-Camera Ascent: Walk in 3rd-person EVA suit, ride the gantry tower elevator, ignite boosters, and switch between Cockpit Visor View and Exterior Chase Cam up to 100 km.',
    'Stage 3 — 8-Planet + Moon 3D Solar System Map: Inspect Mercury, Venus, Earth (+ Moon), Mars, Asteroid Belt, Jupiter, Saturn, Uranus, and Neptune with NASA telemetry cards.',
    'Stage 4 — Planetary Descent & 4-Crew Branching Story: Experience custom Moon or Mars landing physics and resolve 4 Detroit: Become Human-style crew dilemmas with Raj, Leo, and Dr. Sarah.',
    'Stage 5 — EVA Camera, Gallery & Progress Certificate: Capture live 3D photos stamped with NASA telemetry and review them with the final Decision Flowchart.',
  ]);

  addSectionHeading('4', 'Methodology');
  addBullets([
    '1. Scientific Grounding: Translated NASA DONKI (Space Weather), ECLSS (Water/O2 Recycling), OSDR (Radiation Dosimetry), and DSN (Light-Time Delay) into interactive crew dilemmas paired with a Kid-Friendly Science Glossary (Key G).',
    '2. Zero-Dependency Procedural Graphics: All planetary surfaces, clouds, rings, craters, and Martian basalt rocks are drawn dynamically in JavaScript using HTML5 2D Canvas and THREE.CanvasTexture.',
    '3. State-Driven Camera & Low-G Physics: Engineered 10 camera/gameplay states with smooth vector lerping and realistic surface gravity (1/6g Lunar and 0.38g Martian).',
    '4. Procedural Web Audio Synthesis: Rocket turbine roar, countdown tones, airlock hiss, elevator hum, and camera shutter clicks are synthesized mathematically via AudioContext.',
  ]);

  addSectionHeading('5', 'System Architecture');
  addParagraph(
    'The application follows a modular Dual-Layer Reactive Architecture coordinated by a master state controller:'
  );
  addBullets([
    'Master Controller (src/App.tsx): Manages AstronautProfile, the 10-mode ViewMode state machine (WALK, ELEVATOR_RIDE, ENTERING, COCKPIT, COUNTDOWN, IN_FLIGHT, SPACE_ORBIT, WARP_DRIVE, PLANET_DESCENT, PLANET_SURFACE, CONVERSATION), Outpost Survival Stats (Power, Oxygen, Water, Morale), and Offscreen 2D Canvas photo watermarking.',
    '3D WebGL Layer (src/components/3d/): Scene.tsx (with preserveDrawingBuffer enabled), SpaceOrbitNav.tsx (8 planets + Moon + 120 instanced asteroids), PlanetarySurface.tsx (Mars & Moon outposts), Astronaut.tsx (4 distinct PBR suits), and ThirdPersonCamera.tsx.',
    '2D Cybernetic HUD Layer (src/components/ui/): MissionBriefingScreen.tsx, Overlay.tsx, DetroitDialogueWheel.tsx, CommandCenterUI.tsx, and JuniorCommanderCertificate.tsx.',
  ]);

  addSectionHeading('6', 'Technologies Used');
  addBullets([
    'Frontend & Typing: React 19 + TypeScript 5.8 (strict interfaces for chapters, telemetry, and dossiers).',
    '3D Engine: Three.js + @react-three/fiber + @react-three/drei.',
    'Procedural Texturing & Imaging: HTML5 2D Canvas API (THREE.CanvasTexture & JPEG telemetry watermarking).',
    'Styling & Iconography: Tailwind CSS v4 + Lucide React + Orbitron & Rajdhani sci-fi typography.',
    'Audio Engine: Native Web Audio API (oscillators, noise buffers, biquad filters).',
    'Build Tooling: Vite 6.',
  ]);

  addSectionHeading('7', 'Implementation Highlights');
  addBullets([
    'Sunrise Terrain Lighting & Shadow Fix: Added a 0.9-intensity HemisphereLight (#FFE0B2 sky / warm ground bounce) and tuned shadow bias (-0.0005) to eliminate pitch-black sunrise terrain.',
    '4 Distinct Crew PBR Spacesuits: Commander (Deep Navy & White, Gold Visor), Systems Engineer Raj (Crimson Red & Charcoal, Ruby Visor), Engineer Leo (Hazard Orange, Copper Visor), and Dr. Sarah (Medical Teal, Emerald Visor) — all with Indian flag shoulder patches.',
    '4 Scripted NASA Story Chapters: Ch 1 DONKI Solar Storm (Raj), Ch 2 Electrostatic Dust Crisis (Leo), Ch 3 Bio-Dome Water & Radiation (Dr. Sarah), and Ch 4 14-Minute DSN Comms Delay & Earth Return.',
    'EVA Camera & Gallery: Pressing P or clicking SNAP PHOTO captures the WebGL frame, stamps Commander Callsign, Phase, Location, Progress %, and Timestamp, and displays all photos on the final Certificate.',
  ]);

  addSectionHeading('8', 'Expected Impact');
  addBullets([
    'Universal Classroom Accessibility: Runs at 60 FPS in any web browser with zero installation and 0 MB of external 3D asset downloads.',
    'Experiential STEM & Leadership Literacy: Empowers students to learn real NASA systems by balancing Power, Oxygen, Water, and Morale under pressure.',
    'Shareable Student Portfolios: Every student finishes with downloadable, telemetry-stamped mission photos and a personalized Mission Commander Certificate.',
  ]);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `SOL-7 Prototype Documentation • Page ${i} of ${totalPages}`,
      pageW / 2,
      pageH - 7,
      { align: 'center' }
    );
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(path.join(outDir, 'SOL7_Project_Documentation.pdf'), pdfBuffer);
}

const SLIDES = [
  {
    num: '01 / 12',
    tag: 'PROTOTYPE PITCH DECK',
    title: 'SOL-7: INTERPLANETARY MISSION SIMULATOR',
    presenter: 'PRESENTER 1 • INTRO',
    columns: [
      {
        heading: 'What is SOL-7?',
        points: [
          'Browser-native 3D Space Exploration & Decision-Driven NASA Story Game.',
          'Built with React 19, Three.js (React Three Fiber), TypeScript & Web Audio API.',
          'Pre-Flight Astronaut Registration & Live Dossier.',
          '8-Planet + Moon 3D Solar System & 4-Crew Branching Story Engine.',
          'In-Game EVA Camera, Photo Gallery & Final Progress Certificate.',
        ],
      },
      {
        heading: 'Core Mission Objective',
        points: [
          'Transform passive space textbooks into an interactive leadership simulation.',
          'Command Artemis Base Alpha (Moon) or Olympus Station (Mars).',
          '100% Procedural 3D Graphics & Synthesized Audio (Zero external downloads).',
        ],
      },
    ],
    speakerNote:
      'Hello everyone! Today we present SOL-7, a browser-native 3D space simulator and NASA story engine where anyone can launch from Earth, navigate the Solar System, land on the Moon or Mars, and lead a 4-astronaut crew through real NASA crises.',
  },
  {
    num: '02 / 12',
    tag: 'PROBLEM STATEMENT',
    title: 'THE 3 CORE PROBLEMS WE SOLVE',
    presenter: 'PRESENTER 1 • PROBLEM',
    columns: [
      {
        heading: '1. Passive STEM Learning & Hardware Barriers',
        points: [
          'Space science is often taught via static diagrams and raw telemetry tables.',
          'Students rarely experience real-time cause-and-effect decision making.',
          'Traditional 3D space sims require expensive GPUs and multi-GB downloads.',
        ],
      },
      {
        heading: '2. Missing Human Teamwork in Spaceflight',
        points: [
          'Most space games focus only on piloting mechanics.',
          'They ignore the human, biological, and psychological trade-offs of keeping a 4-person crew alive and united under pressure.',
        ],
      },
    ],
    speakerNote:
      'We identified three major problems: passive textbook learning, heavy hardware barriers in traditional 3D simulators, and the lack of crew teamwork and life-support decision-making.',
  },
  {
    num: '03 / 12',
    tag: 'PROPOSED SOLUTION',
    title: 'THE SOL-7 END-TO-END MISSION LOOP',
    presenter: 'PRESENTER 1 • SOLUTION',
    columns: [
      {
        heading: 'Stages 1 to 3: Briefing, Launch & Orbit',
        points: [
          '1. Briefing Terminal: Callsign, Age Rank, Difficulty, Suit Avatar & Target World.',
          '2. Launchpad & Ascent: Walk to gantry lift, board SOL-7, launch to 100 km.',
          '3. 3D Solar System: Inspect all 8 planets + Moon and lock trajectory.',
        ],
      },
      {
        heading: 'Stages 4 to 5: Outpost Story & Photo Log',
        points: [
          '4. Descent & 4-Crew Story: Land on Moon/Mars and solve 4 real NASA crises.',
          '5. EVA Camera & Certificate: Snap telemetry-stamped photos (Key P) and review them alongside your final Decision Flowchart.',
        ],
      },
    ],
    speakerNote:
      'Our solution is a five-stage mission in the browser: register your astronaut profile, launch into orbit, navigate the 8-planet Solar System, land on the Moon or Mars to solve 4 crew crises, and review your mission photos and decision flowchart.',
  },
  {
    num: '04 / 12',
    tag: 'KEY INNOVATIONS',
    title: 'WHAT MAKES SOL-7 UNIQUE & INNOVATIVE?',
    presenter: 'PRESENTER 2 • INNOVATION',
    columns: [
      {
        heading: '100% Procedural Graphics & Audio',
        points: [
          'Every planet surface, cloud layer, ring, crater, and sound effect is generated in code via CanvasTexture and Web Audio API.',
          '0 MB of external image, model, or audio downloads.',
        ],
      },
      {
        heading: 'Grounded in 4 Real NASA Systems + EVA Cam',
        points: [
          'NASA DONKI (Solar Storms) & ECLSS (Water/O2 Recycling).',
          'NASA OSDR (Radiation Dosimetry) & DSN (14-min Signal Latency).',
          'Live WebGL EVA Camera stamps Mission Progress % onto every photo.',
        ],
      },
    ],
    speakerNote:
      'Three innovations set SOL-7 apart: 100% procedural graphics and sound synthesis with zero external assets, integration of four real NASA science domains, and a live WebGL camera that stamps telemetry onto every photo.',
  },
  {
    num: '05 / 12',
    tag: 'SYSTEM ARCHITECTURE',
    title: 'DUAL-LAYER ARCHITECTURE & STATE MACHINE',
    presenter: 'PRESENTER 2 • ARCHITECTURE',
    columns: [
      {
        heading: 'Master State Machine (App.tsx)',
        points: [
          'Coordinates 10 seamless ViewMode states: WALK -> ELEVATOR_RIDE -> COCKPIT -> COUNTDOWN -> IN_FLIGHT -> SPACE_ORBIT -> WARP_DRIVE -> PLANET_DESCENT -> PLANET_SURFACE -> CONVERSATION.',
          'Tracks real-time Outpost Survival Stats: Power, Oxygen, Water, Morale.',
        ],
      },
      {
        heading: '3D WebGL Viewport + 2D Cybernetic HUD',
        points: [
          'Scene.tsx: 60 FPS React Three Fiber canvas with preserveDrawingBuffer: true.',
          'Overlay.tsx: Cybernetic HUD, Kid-Friendly Science Glossary (G), 4-Way Dialogue Wheel, and Photo Gallery Modal.',
        ],
      },
    ],
    speakerNote:
      'Architecturally, SOL-7 separates the 60 FPS Three.js WebGL scene from the reactive Tailwind CSS HUD overlay, coordinated by a central 10-mode state machine in App.tsx.',
  },
  {
    num: '06 / 12',
    tag: 'TECHNOLOGY STACK',
    title: 'MODERN WEB STACK FOR HIGH-PERFORMANCE 3D',
    presenter: 'PRESENTER 2 • TECH STACK',
    columns: [
      {
        heading: 'Core Frontend & 3D Graphics',
        points: [
          'React 19 + TypeScript 5.8 for modular, type-safe state management.',
          'Three.js + @react-three/fiber + @react-three/drei for declarative 3D scenes.',
          'HTML5 2D Canvas API for procedural planetary textures & photo watermarks.',
        ],
      },
      {
        heading: 'UI Styling, Audio & Build Tooling',
        points: [
          'Tailwind CSS v4 + Lucide React Icons + Orbitron/Rajdhani typography.',
          'Native Browser Web Audio API for procedural sound synthesis.',
          'Vite 6 for fast bundling and optimized production builds.',
        ],
      },
    ],
    speakerNote:
      'We built SOL-7 using React 19, TypeScript, Three.js with React Three Fiber, Tailwind CSS v4, and the native Web Audio API so the entire simulation is fast and self-contained.',
  },
  {
    num: '07 / 12',
    tag: 'IMPLEMENTATION PART 1',
    title: '8-PLANET SOLAR SYSTEM & PLANETARY DESCENT',
    presenter: 'PRESENTER 3 • 3D WORLD',
    columns: [
      {
        heading: 'Interactive Solar System (SpaceOrbitNav.tsx)',
        points: [
          'Sun with pulsing corona + Mercury, Venus, Earth (+ Moon), Mars, Asteroid Belt (120 instanced rocks), Jupiter, Saturn, Uranus, Neptune.',
          'Click any body to smoothly zoom and inspect NASA planetary telemetry.',
        ],
      },
      {
        heading: 'Lighting & Touchdown (PlanetarySurface.tsx)',
        points: [
          'HemisphereLight bounce prevents pitch-black shadows at sunrise.',
          'Moon Descent: Blue-white vacuum retro-plumes & grey crater dust spray.',
          'Mars Descent: Orange entry glow, swirling red dust storm & shockwave ring.',
        ],
      },
    ],
    speakerNote:
      'In our 3D world implementation, players can inspect all 8 planets plus the Moon in orbit, then watch a custom landing sequence tailored to either the Moon vacuum or Mars atmosphere.',
  },
  {
    num: '08 / 12',
    tag: 'IMPLEMENTATION PART 2',
    title: '4-ASTRONAUT CREW & BRANCHING STORY ENGINE',
    presenter: 'PRESENTER 3 • CREW & STORY',
    columns: [
      {
        heading: '4 Distinct PBR Spacesuits (Indian Flag Patch)',
        points: [
          'Commander (Player): Deep Navy & White armor, Mirrored Gold visor.',
          'Raj (Command Hub): Crimson Red suit — NASA DONKI Space Weather.',
          'Leo (Solar Array): Hazard Orange suit — Power & Rover Mechanics.',
          'Dr. Sarah (Bio-Dome): Medical Teal suit — ECLSS Water & OSDR Radiation.',
        ],
      },
      {
        heading: 'Detroit-Style 4-Way Dialogue Wheel',
        points: [
          '[UP] SCIENTIFIC  |  [LEFT] CAUTIOUS  |  [RIGHT] EMPATHETIC  |  [DOWN] BOLD',
          'Every decision dynamically updates Power, Oxygen, Water & Morale and records to the final Mission Flowchart.',
        ],
      },
    ],
    speakerNote:
      'On the surface, the player leads a 4-astronaut crew wearing distinct PBR spacesuits. Talking to Raj, Leo, or Dr. Sarah triggers an over-the-shoulder camera and a 4-choice dialogue wheel.',
  },
  {
    num: '09 / 12',
    tag: 'IMPLEMENTATION PART 3',
    title: 'EVA CAMERA, GALLERY & PROGRESS CERTIFICATE',
    presenter: 'PRESENTER 3 • CAMERA & DEBRIEF',
    columns: [
      {
        heading: 'In-Game EVA Camera (SNAP PHOTO [P])',
        points: [
          'Available at any moment during Launch, Orbit, Descent, or Surface EVA.',
          'Plays mechanical shutter sound + white flash overlay.',
          'Stamps bottom NASA telemetry bar with Commander Name, Phase, Location & Progress %.',
        ],
      },
      {
        heading: 'Mission Complete Debriefing',
        points: [
          'In-game Gallery Modal lets players inspect or download JPGs anytime.',
          'At Mission Complete, all photos are displayed alongside their Progress Step and the 4-Chapter Decision Flowchart.',
        ],
      },
    ],
    speakerNote:
      'Players can press P or click Snap Photo at any stage of the mission. Each screenshot is stamped with NASA telemetry and showcased alongside the 4-chapter decision flowchart at the end of the mission.',
  },
  {
    num: '10 / 12',
    tag: 'LIVE DEMONSTRATION',
    title: '3-MINUTE LIVE DEMO WALKTHROUGH',
    presenter: 'PRESENTER 4 • LIVE DEMO',
    columns: [
      {
        heading: 'Minutes 0:00 – 1:15 (Briefing, Launch & Orbit)',
        points: [
          '0:00 — Register Commander Profile, pick Avatar & Difficulty, select MARS.',
          '0:35 — Walk to gantry elevator (E), launch to 100 km, toggle flight cameras (C).',
          '0:55 — Explore 8-planet Solar System map, snap orbital photo (P), lock Mars trajectory.',
        ],
      },
      {
        heading: 'Minutes 1:15 – 3:00 (Outpost Story & Debrief)',
        points: [
          '1:15 — Watch Mars atmospheric entry & retro-rocket landing animation.',
          '1:40 — Resolve Chapters 1–4 with Raj, Leo, and Dr. Sarah using the Dialogue Wheel.',
          '2:30 — Launch back to Earth and showcase the Certificate + Photo Progress Log.',
        ],
      },
    ],
    speakerNote:
      'For our live demonstration, we follow four smooth steps: Astronaut Registration, Launch & Solar System Navigation, resolving the four surface crises on Mars, and reviewing our final Certificate and Photo Gallery.',
  },
  {
    num: '11 / 12',
    tag: 'EXPECTED IMPACT',
    title: 'EDUCATIONAL IMPACT & FUTURE ROADMAP',
    presenter: 'PRESENTER 4 • IMPACT',
    columns: [
      {
        heading: 'Immediate Classroom & STEM Impact',
        points: [
          'Zero-install browser architecture makes 3D space labs accessible on any school laptop.',
          'Difficulty tiers (Cadet, Astronaut, Commander) + Science Glossary (G) adapt to ages 8–18+.',
          'Downloadable EVA photos give students a personalized artifact of their mission.',
        ],
      },
      {
        heading: 'Future Scope & Extensibility',
        points: [
          'Connect live NASA DONKI API webhooks for real-time solar weather alerts.',
          'Add 4-player classroom co-op where 4 students play Commander, Raj, Leo, and Sarah.',
          'Expand landable missions to Europa and Titan.',
        ],
      },
    ],
    speakerNote:
      'SOL-7 turns passive science reading into active leadership in any classroom browser, and its modular architecture is ready for live NASA webhooks and multiplayer classroom co-op.',
  },
  {
    num: '12 / 12',
    tag: 'CONCLUSION & Q&A',
    title: 'MISSION ACCOMPLISHED — THANK YOU!',
    presenter: 'ALL TEAM • Q&A',
    columns: [
      {
        heading: 'SOL-7 Prototype Summary',
        points: [
          'Pre-Game Astronaut Registration & Live Dossier.',
          'Full 8-Planet + Moon 3D Solar System Navigation.',
          '4-Astronaut Crew & 4 Branching NASA Story Chapters.',
          'In-Game EVA Camera, Photo Gallery & Final Progress Certificate.',
        ],
      },
      {
        heading: 'Ready for Liftoff!',
        points: [
          '100% Browser-Native WebGL & Web Audio Synthesis.',
          'We welcome your questions and invite you to test the live simulation!',
        ],
      },
    ],
    speakerNote:
      'Thank you for joining our mission briefing! Our entire team is now open for questions and ready to jump into any part of the live 3D simulation.',
  },
];

function buildPresentationDeckPDF() {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167],
  });

  const pageW = 297;
  const pageH = 167;
  const margin = 14;

  SLIDES.forEach((slide, idx) => {
    if (idx > 0) {
      doc.addPage([297, 167], 'landscape');
    }

    doc.setFillColor(2, 6, 23);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setDrawColor(34, 211, 238);
    doc.setLineWidth(0.6);
    doc.roundedRect(6, 6, pageW - 12, pageH - 12, 4, 4, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(251, 191, 36);
    doc.text(`${slide.tag}  •  SLIDE ${slide.num}`, margin, 17);

    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(34, 211, 238);
    doc.roundedRect(pageW - margin - 62, 11, 62, 9, 2, 2, 'FD');
    doc.setFontSize(8.5);
    doc.setTextColor(103, 232, 249);
    doc.text(slide.presenter, pageW - margin - 31, 16.8, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.setTextColor(255, 255, 255);
    doc.text(slide.title, margin, 28);

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.4);
    doc.line(margin, 33, pageW - margin, 33);

    const colGap = 8;
    const colW = (pageW - margin * 2 - colGap) / 2;
    const colTop = 38;
    const colH = 88;

    slide.columns.forEach((col, cIdx) => {
      const colX = margin + cIdx * (colW + colGap);
      doc.setFillColor(15, 23, 42);
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.4);
      doc.roundedRect(colX, colTop, colW, colH, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(251, 191, 36);
      doc.text(col.heading, colX + 6, colTop + 10);

      let py = colTop + 19;
      col.points.forEach((pt) => {
        const lines = doc.splitTextToSize(pt, colW - 16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(34, 211, 238);
        doc.text('•', colX + 6, py);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text(lines, colX + 11, py);
        py += lines.length * 5.4 + 3.2;
      });
    });

    const noteY = 132;
    doc.setFillColor(23, 37, 84);
    doc.setDrawColor(251, 191, 36);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, noteY, pageW - margin * 2, 22, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(251, 191, 36);
    doc.text('TEAM SPEAKER NOTE:', margin + 5, noteY + 6.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(254, 243, 199);
    const noteLines = doc.splitTextToSize(`"${slide.speakerNote}"`, pageW - margin * 2 - 10);
    doc.text(noteLines, margin + 5, noteY + 12.5);
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(path.join(outDir, 'SOL7_Presentation_Slides.pdf'), pdfBuffer);
}

buildProjectDocumentationPDF();
buildPresentationDeckPDF();
console.log('Generated SOL7_Project_Documentation.pdf and SOL7_Presentation_Slides.pdf in /project_docs_and_ppt/');
