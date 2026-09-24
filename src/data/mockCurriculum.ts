export interface Question {
  id: number
  subject: string
  classNum: '11' | '12'
  chapter: string
  tier: number
  tierName: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Advanced'
  question: string
  formula?: string
  options: {
    id: 'A' | 'B' | 'C' | 'D'
    text: string
  }[]
  correctOption: 'A' | 'B' | 'C' | 'D'
  explanation: string
  jeeCount?: number
  neetCount?: number
  advCount?: number
}

export interface Chapter {
  id: string
  name: string
  subjectId: string
  classNum: '11' | '12'
  jeeCount: number
  neetCount: number
  advCount: number
  totalCount: number
  completedCount: number
  highYield?: boolean
}

export interface Subject {
  id: string
  name: string
  tagline: string
  color: string
  badgeColor: string
  totalQuestions: number
  totalChapters: number
  class11Count: number
  class12Count: number
  iconName: string
  formula: string
}

export interface PracticeTier {
  tier: number
  name: string
  subtitle: string
  difficulty: string
  timePerQuestion: string
  badge: string
  description: string
  questionCount: number
}

export interface PYQExamSet {
  id: string
  examName: string
  year: number
  shift?: string
  subject: string
  classNum: '11' | '12'
  chapter: string
  questionCount: number
  durationMinutes: number
  difficulty: string
}

export const SUBJECTS: Subject[] = [
  {
    id: 'physics',
    name: 'Physics',
    tagline: 'Mechanics, Electrodynamics & Quantum Physics',
    color: 'from-amber-500/20 via-orange-500/10 to-amber-600/5',
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    totalQuestions: 14250,
    totalChapters: 28,
    class11Count: 7100,
    class12Count: 7150,
    iconName: 'Atom',
    formula: 'F = m·a',
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    tagline: 'Physical, Organic & Inorganic Reactions',
    color: 'from-yellow-500/20 via-amber-500/10 to-orange-500/5',
    badgeColor: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
    totalQuestions: 11840,
    totalChapters: 30,
    class11Count: 5800,
    class12Count: 6040,
    iconName: 'FlaskConical',
    formula: 'PV = nRT',
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    tagline: 'Calculus, Algebra, Vectors & Coordinate Geometry',
    color: 'from-amber-600/20 via-orange-600/10 to-amber-700/5',
    badgeColor: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
    totalQuestions: 16500,
    totalChapters: 26,
    class11Count: 8200,
    class12Count: 8300,
    iconName: 'Calculator',
    formula: 'e^(iπ) + 1 = 0',
  },
  {
    id: 'biology',
    name: 'Biology',
    tagline: 'Cell Biology, Genetics, Human Physiology & Ecology',
    color: 'from-emerald-500/20 via-amber-500/10 to-emerald-600/5',
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    totalQuestions: 12900,
    totalChapters: 38,
    class11Count: 6500,
    class12Count: 6400,
    iconName: 'Dna',
    formula: 'ATP ↔ ADP + Pi',
  },
]

export const PRACTICE_TIERS: PracticeTier[] = [
  {
    tier: 1,
    name: 'Concept Builder',
    subtitle: 'NCERT & Core Fundamentals',
    difficulty: 'Foundation',
    timePerQuestion: '45s',
    badge: 'Tier 1',
    description: 'Master core definitions, direct formula applications, and build infallible conceptual clarity.',
    questionCount: 45,
  },
  {
    tier: 2,
    name: 'Speed Drill',
    subtitle: 'JEE Mains & NEET Level 1',
    difficulty: 'Moderate',
    timePerQuestion: '60s',
    badge: 'Tier 2',
    description: 'Timed sets designed to eliminate calculation errors and accelerate problem identification speed.',
    questionCount: 30,
  },
  {
    tier: 3,
    name: 'Rank Booster',
    subtitle: 'High-Yield Exam Scenarios',
    difficulty: 'Exam Standard',
    timePerQuestion: '90s',
    badge: 'Tier 3',
    description: 'Challenging questions with multi-step reasoning that separate the top 5% rankers.',
    questionCount: 25,
  },
  {
    tier: 4,
    name: 'Master Tier',
    subtitle: 'Multi-Concept Traps & Twists',
    difficulty: 'Challenging',
    timePerQuestion: '120s',
    badge: 'Tier 4',
    description: 'Complex problems intersecting 2 or more chapters, testing deep analytical intuition.',
    questionCount: 20,
  },
  {
    tier: 5,
    name: 'Advanced & Olympiad',
    subtitle: 'JEE Advanced & National Olympiads',
    difficulty: 'Extreme',
    timePerQuestion: '180s',
    badge: 'Tier 5',
    description: 'Rigorous proofs, non-standard approaches, and elite level physics, math, and chemistry challenges.',
    questionCount: 15,
  },
]

export const CHAPTERS: Chapter[] = [
  // Physics - Class 11
  {
    id: 'kinematics',
    name: 'Kinematics & Motion in 2D',
    subjectId: 'physics',
    classNum: '11',
    jeeCount: 420,
    neetCount: 380,
    advCount: 180,
    totalCount: 980,
    completedCount: 340,
    highYield: true,
  },
  {
    id: 'laws-of-motion',
    name: 'Laws of Motion & Friction',
    subjectId: 'physics',
    classNum: '11',
    jeeCount: 490,
    neetCount: 410,
    advCount: 230,
    totalCount: 1130,
    completedCount: 420,
    highYield: true,
  },
  {
    id: 'work-energy-power',
    name: 'Work, Energy and Power',
    subjectId: 'physics',
    classNum: '11',
    jeeCount: 390,
    neetCount: 340,
    advCount: 190,
    totalCount: 920,
    completedCount: 210,
  },
  {
    id: 'rotational-motion',
    name: 'Rotational Dynamics & Torque',
    subjectId: 'physics',
    classNum: '11',
    jeeCount: 560,
    neetCount: 320,
    advCount: 340,
    totalCount: 1220,
    completedCount: 180,
    highYield: true,
  },
  {
    id: 'gravitation',
    name: 'Gravitation & Planetary Orbits',
    subjectId: 'physics',
    classNum: '11',
    jeeCount: 310,
    neetCount: 290,
    advCount: 120,
    totalCount: 720,
    completedCount: 300,
  },
  {
    id: 'thermodynamics-11',
    name: 'Thermal Properties & Thermodynamics',
    subjectId: 'physics',
    classNum: '11',
    jeeCount: 440,
    neetCount: 480,
    advCount: 210,
    totalCount: 1130,
    completedCount: 510,
    highYield: true,
  },

  // Physics - Class 12
  {
    id: 'electrostatics',
    name: 'Electrostatics & Gauss Law',
    subjectId: 'physics',
    classNum: '12',
    jeeCount: 580,
    neetCount: 510,
    advCount: 290,
    totalCount: 1380,
    completedCount: 450,
    highYield: true,
  },
  {
    id: 'current-electricity',
    name: 'Current Electricity & Circuits',
    subjectId: 'physics',
    classNum: '12',
    jeeCount: 510,
    neetCount: 480,
    advCount: 220,
    totalCount: 1210,
    completedCount: 620,
    highYield: true,
  },
  {
    id: 'magnetic-effects',
    name: 'Magnetic Effects of Current & Magnetism',
    subjectId: 'physics',
    classNum: '12',
    jeeCount: 480,
    neetCount: 430,
    advCount: 250,
    totalCount: 1160,
    completedCount: 290,
  },
  {
    id: 'emi-ac',
    name: 'Electromagnetic Induction & Alternating Current',
    subjectId: 'physics',
    classNum: '12',
    jeeCount: 520,
    neetCount: 460,
    advCount: 260,
    totalCount: 1240,
    completedCount: 340,
    highYield: true,
  },
  {
    id: 'optics',
    name: 'Ray & Wave Optics',
    subjectId: 'physics',
    classNum: '12',
    jeeCount: 610,
    neetCount: 590,
    advCount: 310,
    totalCount: 1510,
    completedCount: 480,
    highYield: true,
  },
  {
    id: 'modern-physics',
    name: 'Modern Physics & Dual Nature',
    subjectId: 'physics',
    classNum: '12',
    jeeCount: 640,
    neetCount: 680,
    advCount: 280,
    totalCount: 1600,
    completedCount: 820,
    highYield: true,
  },

  // Chemistry - Class 11
  {
    id: 'mole-concept',
    name: 'Some Basic Concepts of Chemistry (Mole Concept)',
    subjectId: 'chemistry',
    classNum: '11',
    jeeCount: 380,
    neetCount: 390,
    advCount: 160,
    totalCount: 930,
    completedCount: 410,
  },
  {
    id: 'atomic-structure',
    name: 'Structure of Atom & Quantum Numbers',
    subjectId: 'chemistry',
    classNum: '11',
    jeeCount: 420,
    neetCount: 440,
    advCount: 190,
    totalCount: 1050,
    completedCount: 530,
    highYield: true,
  },
  {
    id: 'chemical-bonding',
    name: 'Chemical Bonding & Molecular Structure',
    subjectId: 'chemistry',
    classNum: '11',
    jeeCount: 620,
    neetCount: 610,
    advCount: 310,
    totalCount: 1540,
    completedCount: 710,
    highYield: true,
  },
  {
    id: 'chemical-thermo',
    name: 'Chemical Thermodynamics & Energetics',
    subjectId: 'chemistry',
    classNum: '11',
    jeeCount: 490,
    neetCount: 450,
    advCount: 260,
    totalCount: 1200,
    completedCount: 380,
    highYield: true,
  },
  {
    id: 'equilibrium',
    name: 'Chemical & Ionic Equilibrium',
    subjectId: 'chemistry',
    classNum: '11',
    jeeCount: 540,
    neetCount: 490,
    advCount: 280,
    totalCount: 1310,
    completedCount: 440,
    highYield: true,
  },
  {
    id: 'general-organic-chem',
    name: 'General Organic Chemistry (GOC & Isomerism)',
    subjectId: 'chemistry',
    classNum: '11',
    jeeCount: 680,
    neetCount: 630,
    advCount: 360,
    totalCount: 1670,
    completedCount: 920,
    highYield: true,
  },

  // Chemistry - Class 12
  {
    id: 'solutions',
    name: 'Solutions & Colligative Properties',
    subjectId: 'chemistry',
    classNum: '12',
    jeeCount: 410,
    neetCount: 440,
    advCount: 190,
    totalCount: 1040,
    completedCount: 490,
  },
  {
    id: 'electrochemistry',
    name: 'Electrochemistry & Nernst Equation',
    subjectId: 'chemistry',
    classNum: '12',
    jeeCount: 480,
    neetCount: 470,
    advCount: 240,
    totalCount: 1190,
    completedCount: 390,
    highYield: true,
  },
  {
    id: 'chemical-kinetics',
    name: 'Chemical Kinetics & Arrhenius Equation',
    subjectId: 'chemistry',
    classNum: '12',
    jeeCount: 460,
    neetCount: 480,
    advCount: 220,
    totalCount: 1160,
    completedCount: 510,
  },
  {
    id: 'coordination-compounds',
    name: 'Coordination Compounds & CFT',
    subjectId: 'chemistry',
    classNum: '12',
    jeeCount: 590,
    neetCount: 560,
    advCount: 290,
    totalCount: 1440,
    completedCount: 680,
    highYield: true,
  },
  {
    id: 'aldehydes-ketones',
    name: 'Aldehydes, Ketones & Carboxylic Acids',
    subjectId: 'chemistry',
    classNum: '12',
    jeeCount: 630,
    neetCount: 590,
    advCount: 340,
    totalCount: 1560,
    completedCount: 710,
    highYield: true,
  },

  // Mathematics - Class 11
  {
    id: 'quadratic-equations',
    name: 'Quadratic Equations & Complex Numbers',
    subjectId: 'mathematics',
    classNum: '11',
    jeeCount: 480,
    neetCount: 0,
    advCount: 280,
    totalCount: 760,
    completedCount: 390,
  },
  {
    id: 'permutations-combinations',
    name: 'Permutations, Combinations & Binomial Theorem',
    subjectId: 'mathematics',
    classNum: '11',
    jeeCount: 560,
    neetCount: 0,
    advCount: 340,
    totalCount: 900,
    completedCount: 410,
    highYield: true,
  },
  {
    id: 'coordinate-geometry-11',
    name: 'Straight Lines & Circles',
    subjectId: 'mathematics',
    classNum: '11',
    jeeCount: 620,
    neetCount: 0,
    advCount: 350,
    totalCount: 970,
    completedCount: 530,
    highYield: true,
  },
  {
    id: 'conic-sections',
    name: 'Conic Sections (Parabola, Ellipse, Hyperbola)',
    subjectId: 'mathematics',
    classNum: '11',
    jeeCount: 690,
    neetCount: 0,
    advCount: 410,
    totalCount: 1100,
    completedCount: 420,
    highYield: true,
  },

  // Mathematics - Class 12
  {
    id: 'functions-calculus',
    name: 'Relations, Functions & Inverse Trigonometry',
    subjectId: 'mathematics',
    classNum: '12',
    jeeCount: 590,
    neetCount: 0,
    advCount: 330,
    totalCount: 920,
    completedCount: 460,
  },
  {
    id: 'differential-calculus',
    name: 'Continuity, Differentiability & AOD',
    subjectId: 'mathematics',
    classNum: '12',
    jeeCount: 780,
    neetCount: 0,
    advCount: 490,
    totalCount: 1270,
    completedCount: 670,
    highYield: true,
  },
  {
    id: 'integral-calculus',
    name: 'Definite & Indefinite Integrals, Area Under Curves',
    subjectId: 'mathematics',
    classNum: '12',
    jeeCount: 820,
    neetCount: 0,
    advCount: 520,
    totalCount: 1340,
    completedCount: 580,
    highYield: true,
  },
  {
    id: 'vectors-3d',
    name: 'Vectors & 3D Geometry',
    subjectId: 'mathematics',
    classNum: '12',
    jeeCount: 740,
    neetCount: 0,
    advCount: 420,
    totalCount: 1160,
    completedCount: 790,
    highYield: true,
  },

  // Biology - Class 11 & 12
  {
    id: 'cell-biology',
    name: 'Cell: Structure & Cell Cycle Division',
    subjectId: 'biology',
    classNum: '11',
    jeeCount: 0,
    neetCount: 720,
    advCount: 0,
    totalCount: 720,
    completedCount: 580,
    highYield: true,
  },
  {
    id: 'human-physiology',
    name: 'Human Physiology & System Mechanisms',
    subjectId: 'biology',
    classNum: '11',
    jeeCount: 0,
    neetCount: 950,
    advCount: 0,
    totalCount: 950,
    completedCount: 720,
    highYield: true,
  },
  {
    id: 'genetics-evolution',
    name: 'Genetics, Heredity & Molecular Basis of Inheritance',
    subjectId: 'biology',
    classNum: '12',
    jeeCount: 0,
    neetCount: 1120,
    advCount: 0,
    totalCount: 1120,
    completedCount: 890,
    highYield: true,
  },
  {
    id: 'biotech-ecology',
    name: 'Biotechnology Principles & Ecology Dynamics',
    subjectId: 'biology',
    classNum: '12',
    jeeCount: 0,
    neetCount: 840,
    advCount: 0,
    totalCount: 840,
    completedCount: 640,
    highYield: true,
  },
]

export const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    subject: 'physics',
    classNum: '11',
    chapter: 'rotational-motion',
    tier: 3,
    tierName: 'Rank Booster',
    difficulty: 'Hard',
    question:
      'A solid cylinder of mass M and radius R rolls without slipping down an inclined plane of angle θ. The coefficient of static friction required to prevent slipping is:',
    formula: 'a = g sinθ / (1 + I / MR²)',
    options: [
      { id: 'A', text: '(1/3) tan θ' },
      { id: 'B', text: '(1/2) tan θ' },
      { id: 'C', text: '(2/3) tan θ' },
      { id: 'D', text: 'tan θ' },
    ],
    correctOption: 'A',
    explanation:
      'For rolling without slipping on an inclined plane: a = g sinθ / (1 + I/MR²). For a solid cylinder, I = (1/2) MR², so a = (2/3) g sinθ. The friction force f = I α / R = (1/2) M a = (1/3) M g sinθ. Since f ≤ μ_s N and N = M g cosθ, we have (1/3) M g sinθ ≤ μ_s M g cosθ ⇒ μ_s ≥ (1/3) tan θ.',
  },
  {
    id: 2,
    subject: 'physics',
    classNum: '11',
    chapter: 'rotational-motion',
    tier: 3,
    tierName: 'Rank Booster',
    difficulty: 'Medium',
    question:
      'Two discs of moments of inertia I₁ and I₂, rotating with angular velocities ω₁ and ω₂ about their common coaxial axis in the same sense, are brought in contact face to face. The loss of kinetic energy in the process is:',
    formula: 'ΔK = (1/2) [I₁ I₂ / (I₁ + I₂)] (ω₁ - ω₂)²',
    options: [
      { id: 'A', text: '(1/2) [I₁ I₂ / (I₁ + I₂)] (ω₁ - ω₂)²' },
      { id: 'B', text: '[I₁ I₂ / (I₁ + I₂)] (ω₁ - ω₂)²' },
      { id: 'C', text: '(1/4) (I₁ + I₂) (ω₁ - ω₂)²' },
      { id: 'D', text: '(1/2) (I₁ - I₂) (ω₁ + ω₂)²' },
    ],
    correctOption: 'A',
    explanation:
      'By conservation of angular momentum about the common axis: (I₁ + I₂) ω_f = I₁ ω₁ + I₂ ω₂. Initial KE = (1/2) I₁ ω₁² + (1/2) I₂ ω₂². Final KE = (1/2) (I₁ + I₂) ω_f². Computing ΔK = KE_initial - KE_final gives (1/2) [I₁ I₂ / (I₁ + I₂)] (ω₁ - ω₂)², which is strictly positive unless ω₁ = ω₂.',
  },
  {
    id: 3,
    subject: 'physics',
    classNum: '11',
    chapter: 'rotational-motion',
    tier: 3,
    tierName: 'Rank Booster',
    difficulty: 'Hard',
    question:
      'A thin uniform rod of length L and mass M is free to rotate in a vertical plane about a horizontal axis through its one end. If it is released from the horizontal position, the angular velocity when it passes through the vertical is:',
    formula: 'M g (L/2) = (1/2) I ω²',
    options: [
      { id: 'A', text: '√(2g / L)' },
      { id: 'B', text: '√(3g / L)' },
      { id: 'C', text: '√(6g / L)' },
      { id: 'D', text: '√(g / 3L)' },
    ],
    correctOption: 'B',
    explanation:
      'From conservation of mechanical energy: Loss in potential energy = Gain in rotational kinetic energy. The center of mass drops by L/2, so ΔU = M g (L/2). Rotational inertia about end is I = (1/3) M L². Thus, (1/2) [(1/3) M L²] ω² = M g L / 2  ⇒  ω² = 3g / L  ⇒  ω = √(3g / L).',
  },
  {
    id: 4,
    subject: 'physics',
    classNum: '11',
    chapter: 'rotational-motion',
    tier: 3,
    tierName: 'Rank Booster',
    difficulty: 'Advanced',
    question:
      'A particle of mass m moves along a line y = b, z = 0 with constant velocity v in the positive x-direction. Its angular momentum relative to the origin at any time t is:',
    formula: 'L = r × p',
    options: [
      { id: 'A', text: 'Zero' },
      { id: 'B', text: '- m v b k̂ (constant in time)' },
      { id: 'C', text: '+ m v b ĵ (increases with t)' },
      { id: 'D', text: '- m v b î (oscillates)' },
    ],
    correctOption: 'B',
    explanation:
      'Position vector r(t) = x î + b ĵ. Linear momentum p = m v î. Angular momentum L = r × p = (x î + b ĵ) × (m v î) = b m v (ĵ × î) = - m v b k̂. Notice this is totally independent of x and time t, demonstrating that angular momentum about the origin is conserved for unaccelerated linear motion.',
  },
  {
    id: 5,
    subject: 'physics',
    classNum: '11',
    chapter: 'rotational-motion',
    tier: 3,
    tierName: 'Rank Booster',
    difficulty: 'Medium',
    question:
      'The radius of gyration of a uniform sphere of radius R about a tangent is:',
    formula: 'I = I_cm + M d²',
    options: [
      { id: 'A', text: '√(2/5) R' },
      { id: 'B', text: '√(7/5) R' },
      { id: 'C', text: '√(5/7) R' },
      { id: 'D', text: '√(3/5) R' },
    ],
    correctOption: 'B',
    explanation:
      'Using the parallel axis theorem: I_tangent = I_cm + M R² = (2/5) M R² + M R² = (7/5) M R². The radius of gyration k is defined by I = M k². Equating gives M k² = (7/5) M R² ⇒ k = √(7/5) R.',
  },
]

export const PYQ_EXAM_SETS: PYQExamSet[] = [
  {
    id: 'jee-mains-2024-s1',
    examName: 'JEE Main 2024 (January Shift 1)',
    year: 2024,
    shift: 'Jan 27, Morning Shift',
    subject: 'physics',
    classNum: '11',
    chapter: 'rotational-motion',
    questionCount: 30,
    durationMinutes: 60,
    difficulty: 'Standard JEE Main',
  },
  {
    id: 'jee-mains-2024-s2',
    examName: 'JEE Main 2024 (April Shift 2)',
    year: 2024,
    shift: 'Apr 06, Evening Shift',
    subject: 'physics',
    classNum: '12',
    chapter: 'electrostatics',
    questionCount: 30,
    durationMinutes: 60,
    difficulty: 'Standard JEE Main',
  },
  {
    id: 'jee-adv-2024-p1',
    examName: 'JEE Advanced 2024 (Paper 1)',
    year: 2024,
    shift: 'Official Paper 1',
    subject: 'mathematics',
    classNum: '12',
    chapter: 'integral-calculus',
    questionCount: 18,
    durationMinutes: 60,
    difficulty: 'Advanced / High Rigor',
  },
  {
    id: 'neet-2024-code-r',
    examName: 'NEET UG 2024 (Code R3)',
    year: 2024,
    shift: 'May 05 Single Shift',
    subject: 'biology',
    classNum: '12',
    chapter: 'genetics-evolution',
    questionCount: 45,
    durationMinutes: 45,
    difficulty: 'Standard NEET UG',
  },
  {
    id: 'jee-adv-2023-p2',
    examName: 'JEE Advanced 2023 (Paper 2)',
    year: 2023,
    shift: 'Official Paper 2',
    subject: 'chemistry',
    classNum: '11',
    chapter: 'chemical-bonding',
    questionCount: 18,
    durationMinutes: 60,
    difficulty: 'Advanced / High Rigor',
  },
  {
    id: 'neet-2023-code-f',
    examName: 'NEET UG 2023 (Code F1)',
    year: 2023,
    shift: 'May 07 Single Shift',
    subject: 'chemistry',
    classNum: '12',
    chapter: 'coordination-compounds',
    questionCount: 45,
    durationMinutes: 45,
    difficulty: 'Standard NEET UG',
  },
]
