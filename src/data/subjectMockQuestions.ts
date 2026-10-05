/** Subject-correct practice mocks for Biology, Chemistry, Mathematics, and remaining Physics chapters. */

export type SubjectMockQuestion = {
  id: number
  subject: string
  classNum: '11' | '12'
  chapter: string
  tier: number
  tierName: string
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Advanced'
  question: string
  formula?: string
  options: { id: 'A' | 'B' | 'C' | 'D'; text: string }[]
  correctOption: 'A' | 'B' | 'C' | 'D'
  explanation: string
}

const TIER_NAME: Record<number, string> = {
  1: 'Concept Builder',
  2: 'Speed Drill',
  3: 'Rank Booster',
  4: 'Master Tier',
  5: 'Advanced & Olympiad',
}

const DIFF: Record<number, SubjectMockQuestion['difficulty']> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
  4: 'Hard',
  5: 'Advanced',
}

type Stem = {
  question: string
  options: [string, string, string, string]
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string
  formula?: string
}

let nextId = 100

function expandChapter(
  subject: string,
  classNum: '11' | '12',
  chapter: string,
  stems: Stem[],
): SubjectMockQuestion[] {
  const rows: SubjectMockQuestion[] = []
  for (const tier of [1, 2, 3, 4, 5] as const) {
    for (const stem of stems) {
      nextId += 1
      rows.push({
        id: nextId,
        subject,
        classNum,
        chapter,
        tier,
        tierName: TIER_NAME[tier],
        difficulty: DIFF[tier],
        question: stem.question,
        formula: stem.formula,
        options: [
          { id: 'A', text: stem.options[0] },
          { id: 'B', text: stem.options[1] },
          { id: 'C', text: stem.options[2] },
          { id: 'D', text: stem.options[3] },
        ],
        correctOption: stem.correct,
        explanation: stem.explanation,
      })
    }
  }
  return rows
}

export const SUBJECT_MOCK_QUESTIONS: SubjectMockQuestion[] = [
  ...expandChapter('chemistry', '11', 'mole-concept', [
    {
      question: 'How many molecules are present in 18 g of water? (Nₐ = 6.022 × 10²³)',
      options: ['6.022 × 10²³', '3.011 × 10²³', '1.204 × 10²⁴', '18 × 10²³'],
      correct: 'A',
      explanation: 'Moles = 18/18 = 1. Molecules = 1 × Nₐ.',
      formula: 'N = n × Nₐ',
    },
    {
      question: 'One mole of any substance contains how many entities?',
      options: ['6.022 × 10²²', '6.022 × 10²³', '6.022 × 10²⁴', '10²³'],
      correct: 'B',
      explanation: 'By definition, 1 mole contains Avogadro’s number of entities.',
    },
    {
      question: 'Molar mass of CO₂ is approximately:',
      options: ['28 g mol⁻¹', '32 g mol⁻¹', '44 g mol⁻¹', '16 g mol⁻¹'],
      correct: 'C',
      explanation: 'C = 12, O₂ = 32 ⇒ CO₂ = 44 g mol⁻¹.',
    },
    {
      question: 'Number of moles in 11.2 L of O₂ at STP is:',
      options: ['0.25', '0.5', '1.0', '2.0'],
      correct: 'B',
      explanation: 'At STP, 22.4 L = 1 mol ⇒ 11.2 L = 0.5 mol.',
    },
  ]),
  ...expandChapter('chemistry', '11', 'atomic-structure', [
    {
      question: 'Maximum electrons in a shell with principal quantum number n is:',
      options: ['n²', '2n', '2n²', 'n³'],
      correct: 'C',
      explanation: 'Capacity of a shell is 2n².',
      formula: 'N_max = 2n²',
    },
    {
      question: 'The azimuthal quantum number for a p-orbital is:',
      options: ['0', '1', '2', '3'],
      correct: 'B',
      explanation: 'For p subshell, l = 1.',
    },
    {
      question: 'Isotopes have the same number of:',
      options: ['Neutrons', 'Nucleons', 'Protons', 'Mass number'],
      correct: 'C',
      explanation: 'Isotopes of an element have the same atomic number (protons).',
    },
    {
      question: 'De Broglie wavelength is λ =:',
      options: ['h/mv', 'mv/h', 'hν', 'mc²'],
      correct: 'A',
      explanation: 'λ = h/p = h/(mv) for a material particle.',
      formula: 'λ = h/p',
    },
  ]),
  ...expandChapter('chemistry', '11', 'chemical-bonding', [
    {
      question: 'Which molecule is linear by VSEPR?',
      options: ['H₂O', 'NH₃', 'BeCl₂', 'SO₂'],
      correct: 'C',
      explanation: 'BeCl₂ has 2 bond pairs, 0 lone pairs → linear.',
    },
    {
      question: 'Hybridization of carbon in CH₄ is:',
      options: ['sp', 'sp²', 'sp³', 'dsp²'],
      correct: 'C',
      explanation: 'Four equivalent C–H bonds → sp³.',
    },
    {
      question: 'Which bond is the most polar?',
      options: ['H–H', 'C–H', 'O–H', 'Cl–Cl'],
      correct: 'C',
      explanation: 'Largest electronegativity difference among the options is O–H.',
    },
    {
      question: 'SF₆ has geometry:',
      options: ['Tetrahedral', 'Square planar', 'Octahedral', 'Trigonal bipyramidal'],
      correct: 'C',
      explanation: 'Six bonding pairs → octahedral (sp³d²).',
    },
  ]),
  ...expandChapter('chemistry', '11', 'chemical-thermo', [
    {
      question: 'For an ideal gas in an isothermal process, ΔU is:',
      options: ['Positive', 'Negative', 'Zero', 'Equal to q_p'],
      correct: 'C',
      explanation: 'U depends only on T for an ideal gas ⇒ ΔT = 0 ⇒ ΔU = 0.',
    },
    {
      question: 'First law of thermodynamics is:',
      options: ['ΔU = q + w', 'ΔU = q − w always', 'q = w', 'ΔH = ΔU'],
      correct: 'A',
      explanation: 'Energy conservation: ΔU = q + w (IUPAC sign convention).',
    },
    {
      question: 'Enthalpy H is defined as:',
      options: ['U + PV', 'U − PV', 'q_v', 'TΔS'],
      correct: 'A',
      explanation: 'H ≡ U + PV.',
      formula: 'H = U + PV',
    },
    {
      question: 'An adiabatic process means:',
      options: ['ΔT = 0', 'q = 0', 'w = 0', 'ΔV = 0'],
      correct: 'B',
      explanation: 'No heat exchange with surroundings: q = 0.',
    },
  ]),
  ...expandChapter('chemistry', '11', 'equilibrium', [
    {
      question: 'For N₂ + 3H₂ ⇌ 2NH₃, Kₚ = Kᶜ(RT)^{Δn} with Δn =',
      options: ['+2', '−2', '0', '+1'],
      correct: 'B',
      explanation: 'Δn_g = 2 − 4 = −2.',
      formula: 'Kₚ = Kᶜ(RT)^{Δn_g}',
    },
    {
      question: 'If Q < K, the net reaction proceeds:',
      options: ['Backward', 'Forward', 'Neither', 'Only at 0 K'],
      correct: 'B',
      explanation: 'System moves forward to increase Q toward K.',
    },
    {
      question: 'Le Chatelier’s principle predicts effect of:',
      options: ['Only catalysts', 'Disturbances on equilibrium', 'Nuclear reactions', 'Photons only'],
      correct: 'B',
      explanation: 'Equilibrium shifts to counteract an applied change.',
    },
    {
      question: 'For a weak acid HA, Kₐ =',
      options: ['[H⁺][A⁻]/[HA]', '[HA]/[H⁺][A⁻]', '[H⁺]/[A⁻]', '[A⁻]/[HA]'],
      correct: 'A',
      explanation: 'Acid dissociation constant expression for HA ⇌ H⁺ + A⁻.',
    },
  ]),
  ...expandChapter('chemistry', '11', 'general-organic-chem', [
    {
      question: 'Which is aromatic by Hückel’s rule?',
      options: ['Cyclobutadiene', 'Cyclooctatetraene', 'Benzene', 'Cyclopropene'],
      correct: 'C',
      explanation: 'Benzene is planar, conjugated, 6 π e⁻ (4n+2).',
    },
    {
      question: 'Homolytic bond cleavage produces:',
      options: ['Ions', 'Free radicals', 'Carbanions only', 'Carbocations only'],
      correct: 'B',
      explanation: 'Equal sharing of electrons → radicals.',
    },
    {
      question: 'Inductive effect is transmitted through:',
      options: ['π bonds only', 'σ bonds', 'Hydrogen bonds', 'van der Waals forces'],
      correct: 'B',
      explanation: '±I effects operate through sigma framework.',
    },
    {
      question: 'Most stable carbocation among methyl, ethyl, isopropyl, t-butyl is:',
      options: ['Methyl', 'Ethyl', 'Isopropyl', 't-Butyl'],
      correct: 'D',
      explanation: 'Tertiary carbocation is most stable due to hyperconjugation/inductive effect.',
    },
  ]),
  ...expandChapter('chemistry', '12', 'solutions', [
    {
      question: 'Ideal solutions obey:',
      options: ['Henry’s law only', 'Raoult’s law', 'Ohm’s law', 'Hess’s law'],
      correct: 'B',
      explanation: 'Ideal solutions follow Raoult’s law for all compositions.',
      formula: 'pᵢ = pᵢ⁰ xᵢ',
    },
    {
      question: 'Molality is moles of solute per:',
      options: ['Litre of solution', 'kg of solvent', 'Litre of solvent', 'kg of solution'],
      correct: 'B',
      explanation: 'm = moles solute / kg solvent.',
    },
    {
      question: 'Relative lowering of vapour pressure equals mole fraction of:',
      options: ['Solvent', 'Solute', 'Solution density', 'Air'],
      correct: 'B',
      explanation: '(p⁰ − p)/p⁰ = x_solute for non-volatile solute.',
    },
    {
      question: 'Colligative properties depend on:',
      options: ['Nature of solute only', 'Number of solute particles', 'Colour of solution', 'Odour'],
      correct: 'B',
      explanation: 'Colligative properties depend on particle count, not identity.',
    },
  ]),
  ...expandChapter('chemistry', '12', 'electrochemistry', [
    {
      question: 'SI unit of cell potential is:',
      options: ['Ampere', 'Ohm', 'Volt', 'Faraday'],
      correct: 'C',
      explanation: 'EMF / potential difference is measured in volts.',
    },
    {
      question: 'In a galvanic cell, oxidation occurs at the:',
      options: ['Cathode', 'Anode', 'Salt bridge', 'Voltmeter'],
      correct: 'B',
      explanation: 'Anode is the oxidation electrode.',
    },
    {
      question: 'Nernst equation at 25 °C for n electrons uses the factor:',
      options: ['0.059/n', 'n/0.059', 'RT only', 'F only'],
      correct: 'A',
      explanation: 'E = E° − (0.059/n) log Q (approx. at 298 K).',
      formula: 'E = E° − (0.059/n) log Q',
    },
    {
      question: '1 Faraday is the charge of:',
      options: ['1 electron', '1 mole of electrons', '1 ampere', '1 coulomb'],
      correct: 'B',
      explanation: 'F ≈ 96500 C mol⁻¹ = charge of 1 mol electrons.',
    },
  ]),
  ...expandChapter('chemistry', '12', 'chemical-kinetics', [
    {
      question: 'Half-life of a first-order reaction is:',
      options: ['∝ [A]₀', 'Independent of [A]₀', '∝ 1/[A]₀', '∝ [A]₀²'],
      correct: 'B',
      explanation: 't₁/₂ = ln2/k for first order.',
      formula: 't₁/₂ = 0.693/k',
    },
    {
      question: 'Unit of rate constant for a first-order reaction is:',
      options: ['mol L⁻¹ s⁻¹', 's⁻¹', 'L mol⁻¹ s⁻¹', 'mol² L⁻² s⁻¹'],
      correct: 'B',
      explanation: 'First-order k has dimensions of time⁻¹.',
    },
    {
      question: 'Arrhenius equation is k =:',
      options: ['A e^{−Ea/RT}', 'A e^{Ea/RT}', 'Ea/RT', 'A/T'],
      correct: 'A',
      explanation: 'k = A exp(−Ea/RT).',
      formula: 'k = A e^{−Ea/RT}',
    },
    {
      question: 'A catalyst increases rate by:',
      options: ['Increasing Ea', 'Decreasing Ea', 'Changing ΔG°', 'Changing ΔH°'],
      correct: 'B',
      explanation: 'Catalyst provides a lower activation energy path.',
    },
  ]),
  ...expandChapter('chemistry', '12', 'coordination-compounds', [
    {
      question: 'Oxidation number of Co in [Co(NH₃)₆]Cl₃ is:',
      options: ['+1', '+2', '+3', '0'],
      correct: 'C',
      explanation: 'NH₃ neutral; 3Cl⁻ ⇒ Co = +3.',
    },
    {
      question: 'EDTA is a:',
      options: ['Monodentate ligand', 'Bidentate ligand', 'Hexadentate ligand', 'Bridge only'],
      correct: 'C',
      explanation: 'EDTA has six donor sites (hexadentate).',
    },
    {
      question: 'According to CFT, d-orbitals split in octahedral field into:',
      options: ['t₂g and e_g', 'Only e_g', 'sp³ sets', 'Only s orbitals'],
      correct: 'A',
      explanation: 'Octahedral splitting → t₂g (lower) and e_g (higher).',
    },
    {
      question: '[Ni(CN)₄]²⁻ is typically:',
      options: ['Tetrahedral paramagnetic', 'Square planar diamagnetic', 'Linear', 'Octahedral'],
      correct: 'B',
      explanation: 'Strong-field CN⁻ → dsp² square planar, diamagnetic Ni²⁺.',
    },
  ]),
  ...expandChapter('chemistry', '12', 'aldehydes-ketones', [
    {
      question: 'Tollens’ test is positive for:',
      options: ['Most ketones', 'Aldehydes', 'Alkanes', 'Ethers'],
      correct: 'B',
      explanation: 'Aldehydes reduce Ag(NH₃)₂⁺ to silver mirror.',
    },
    {
      question: 'Cannizzaro reaction needs aldehyde with:',
      options: ['α-H present', 'No α-H', 'Only aromatic rings', 'Triple bond'],
      correct: 'B',
      explanation: 'Aldehydes without α-hydrogen undergo Cannizzaro.',
    },
    {
      question: 'Carbonyl carbon is:',
      options: ['sp³', 'sp²', 'sp', 'dsp²'],
      correct: 'B',
      explanation: 'C=O carbon is trigonal planar → sp².',
    },
    {
      question: 'Wolff–Kishner reduction converts C=O to:',
      options: ['C–OH', 'CH₂', 'COOH', 'C≡N'],
      correct: 'B',
      explanation: 'Wolff–Kishner reduces carbonyl to methylene.',
    },
  ]),
  ...expandChapter('mathematics', '11', 'quadratic-equations', [
    {
      question: 'If roots of x² − 5x + k = 0 are equal, k =',
      options: ['25/4', '5/2', '25/2', '5'],
      correct: 'A',
      explanation: 'D = 0 ⇒ 25 − 4k = 0 ⇒ k = 25/4.',
      formula: 'D = b² − 4ac',
    },
    {
      question: 'Sum of roots of ax² + bx + c = 0 is:',
      options: ['c/a', '−b/a', 'b/a', '−c/a'],
      correct: 'B',
      explanation: 'α + β = −b/a.',
    },
    {
      question: 'i² equals:',
      options: ['1', '−1', 'i', '0'],
      correct: 'B',
      explanation: 'By definition i² = −1.',
    },
    {
      question: 'If α, β are roots of x² − 3x + 2 = 0, α + β =',
      options: ['2', '3', '5', '1'],
      correct: 'B',
      explanation: 'Sum of roots = 3.',
    },
  ]),
  ...expandChapter('mathematics', '11', 'permutations-combinations', [
    {
      question: '5! equals:',
      options: ['60', '100', '120', '24'],
      correct: 'C',
      explanation: '5 × 4 × 3 × 2 × 1 = 120.',
    },
    {
      question: 'C(n, r) is defined for:',
      options: ['r > n only', '0 ≤ r ≤ n', 'r < 0', 'n = 0 only'],
      correct: 'B',
      explanation: 'Combinations require 0 ≤ r ≤ n.',
    },
    {
      question: 'C(10, 2) equals:',
      options: ['20', '45', '90', '10'],
      correct: 'B',
      explanation: 'C(10,2) = 45.',
    },
    {
      question: 'Number of ways to choose 3 books from 5 distinct books:',
      options: ['10', '15', '60', '125'],
      correct: 'A',
      explanation: 'C(5,3) = 10.',
    },
  ]),
  ...expandChapter('mathematics', '11', 'coordinate-geometry-11', [
    {
      question: 'Slope between (1, 2) and (3, 6) is:',
      options: ['1', '2', '3', '4'],
      correct: 'B',
      explanation: 'm = (6−2)/(3−1) = 2.',
      formula: 'm = (y₂−y₁)/(x₂−x₁)',
    },
    {
      question: 'Equation of x-axis is:',
      options: ['x = 0', 'y = 0', 'x = y', 'x + y = 0'],
      correct: 'B',
      explanation: 'All points on x-axis have y = 0.',
    },
    {
      question: 'Circle x² + y² = 25 has radius:',
      options: ['5', '25', '10', '√25/2'],
      correct: 'A',
      explanation: 'x² + y² = r² ⇒ r = 5.',
    },
    {
      question: 'Distance between (0,0) and (3,4) is:',
      options: ['5', '7', '12', '1'],
      correct: 'A',
      explanation: '√(9+16) = 5.',
    },
  ]),
  ...expandChapter('mathematics', '11', 'conic-sections', [
    {
      question: 'Eccentricity of a parabola is:',
      options: ['0', '1', 'Between 0 and 1', '> 1'],
      correct: 'B',
      explanation: 'Parabola has e = 1.',
    },
    {
      question: 'For ellipse x²/25 + y²/9 = 1, a =',
      options: ['3', '5', '9', '25'],
      correct: 'B',
      explanation: 'a² = 25 ⇒ a = 5 (major axis along x).',
    },
    {
      question: 'Focus–directrix definition uses eccentricity e where PF =',
      options: ['e · (distance to directrix)', 'e²', '1/e', 'Only a'],
      correct: 'A',
      explanation: 'PF = e · PM for conics.',
    },
    {
      question: 'A hyperbola has eccentricity:',
      options: ['e = 0', 'e = 1', 'e > 1', '0 < e < 1'],
      correct: 'C',
      explanation: 'Hyperbola: e > 1.',
    },
  ]),
  ...expandChapter('mathematics', '12', 'functions-calculus', [
    {
      question: 'Domain of √(x − 2) is:',
      options: ['x ≤ 2', 'x ≥ 2', 'x > 0', 'All reals'],
      correct: 'B',
      explanation: 'Need x − 2 ≥ 0.',
    },
    {
      question: 'Range of sin⁻¹ x is:',
      options: ['[0, π]', '[−π/2, π/2]', '[0, π/2]', 'ℝ'],
      correct: 'B',
      explanation: 'Principal values of arcsin lie in [−π/2, π/2].',
    },
    {
      question: 'A function is one-one if:',
      options: ['f(a)=f(b) ⇒ a=b', 'Always onto', 'f(x)=0', 'Periodic'],
      correct: 'A',
      explanation: 'Injective means distinct inputs → distinct outputs.',
    },
    {
      question: 'Inverse of f exists if f is:',
      options: ['Only even', 'Bijective', 'Constant', 'Only odd'],
      correct: 'B',
      explanation: 'Bijection is required for an inverse function on the codomain.',
    },
  ]),
  ...expandChapter('mathematics', '12', 'differential-calculus', [
    {
      question: 'd/dx (x³) =',
      options: ['x²', '2x²', '3x²', '3x³'],
      correct: 'C',
      explanation: 'Power rule: 3x².',
      formula: 'd/dx(xⁿ)=n xⁿ⁻¹',
    },
    {
      question: 'd/dx (sin x) =',
      options: ['cos x', '−cos x', 'sin x', '−sin x'],
      correct: 'A',
      explanation: 'Derivative of sine is cosine.',
    },
    {
      question: 'If y = e^{2x}, y′(0) =',
      options: ['0', '1', '2', 'e'],
      correct: 'C',
      explanation: 'y′ = 2e^{2x}; at 0 equals 2.',
    },
    {
      question: 'Product rule: (uv)′ =',
      options: ['u′v′', 'u′v + uv′', 'u/v', 'vu'],
      correct: 'B',
      explanation: '(uv)′ = u′v + uv′.',
    },
  ]),
  ...expandChapter('mathematics', '12', 'integral-calculus', [
    {
      question: '∫ 2x dx =',
      options: ['x² + C', '2x² + C', 'x + C', '2 + C'],
      correct: 'A',
      explanation: '∫ 2x dx = x² + C.',
    },
    {
      question: '∫₀¹ x dx =',
      options: ['0', '1/2', '1', '2'],
      correct: 'B',
      explanation: '[x²/2]₀¹ = 1/2.',
    },
    {
      question: '∫ cos x dx =',
      options: ['sin x + C', '−sin x + C', 'cos x + C', '−cos x + C'],
      correct: 'A',
      explanation: 'Antiderivative of cos is sin.',
    },
    {
      question: 'd/dx ∫₀ˣ f(t) dt =',
      options: ['f(x)', 'f(0)', '0', '∫ f'],
      correct: 'A',
      explanation: 'Fundamental theorem of calculus.',
    },
  ]),
  ...expandChapter('mathematics', '12', 'vectors-3d', [
    {
      question: 'If a · b = 0 (non-zero), a and b are:',
      options: ['Parallel', 'Antiparallel', 'Perpendicular', 'Equal'],
      correct: 'C',
      explanation: 'Dot product zero ⇒ perpendicular.',
      formula: 'a · b = |a||b| cosθ',
    },
    {
      question: '|î + ĵ + k̂| =',
      options: ['1', '√2', '√3', '3'],
      correct: 'C',
      explanation: '√(1+1+1) = √3.',
    },
    {
      question: 'a × a equals:',
      options: ['|a|²', '0', 'a', '2a'],
      correct: 'B',
      explanation: 'Cross product of a vector with itself is zero.',
    },
    {
      question: 'Direction ratios of x-axis are:',
      options: ['1,0,0', '0,1,0', '0,0,1', '1,1,1'],
      correct: 'A',
      explanation: 'Unit vector along x is î → (1,0,0).',
    },
  ]),
  ...expandChapter('biology', '11', 'cell-biology', [
    {
      question: 'Powerhouse of the cell is the:',
      options: ['Ribosome', 'Nucleus', 'Mitochondrion', 'Golgi apparatus'],
      correct: 'C',
      explanation: 'Mitochondria synthesise ATP.',
    },
    {
      question: 'Ribosomes are the site of:',
      options: ['Lipid synthesis', 'Protein synthesis', 'Photosynthesis', 'DNA replication only'],
      correct: 'B',
      explanation: 'Translation occurs on ribosomes.',
    },
    {
      question: 'Sister chromatids separate in:',
      options: ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'],
      correct: 'C',
      explanation: 'Anaphase splits sister chromatids.',
    },
    {
      question: 'Plasma membrane is mainly made of:',
      options: ['Cellulose', 'Lipid bilayer with proteins', 'Chitin only', 'Only DNA'],
      correct: 'B',
      explanation: 'Fluid mosaic: phospholipid bilayer + proteins.',
    },
  ]),
  ...expandChapter('biology', '11', 'human-physiology', [
    {
      question: 'Oxygen is mainly transported by:',
      options: ['Leukocytes', 'Thrombocytes', 'Erythrocytes', 'Plasma proteins only'],
      correct: 'C',
      explanation: 'RBCs carry haemoglobin-bound O₂.',
    },
    {
      question: 'Pacemaker of the heart is:',
      options: ['AV node', 'SA node', 'Purkinje fibres only', 'Bundle of His only'],
      correct: 'B',
      explanation: 'SA node initiates heartbeat.',
    },
    {
      question: 'Functional unit of kidney is:',
      options: ['Neuron', 'Nephron', 'Alveolus', 'Osteon'],
      correct: 'B',
      explanation: 'Nephron filters blood and forms urine.',
    },
    {
      question: 'Insulin is secreted by:',
      options: ['α cells of pancreas', 'β cells of pancreas', 'Thyroid', 'Adrenal cortex'],
      correct: 'B',
      explanation: 'β-cells of islets of Langerhans secrete insulin.',
    },
  ]),
  ...expandChapter('biology', '12', 'genetics-evolution', [
    {
      question: 'F₂ phenotypic ratio in monohybrid cross is:',
      options: ['1:1', '3:1', '9:3:3:1', '1:2:1'],
      correct: 'B',
      explanation: 'Classic Mendelian monohybrid F₂ = 3:1.',
    },
    {
      question: 'Base absent in RNA is:',
      options: ['Adenine', 'Uracil', 'Thymine', 'Guanine'],
      correct: 'C',
      explanation: 'RNA has U instead of T.',
    },
    {
      question: 'DNA replication is:',
      options: ['Conservative only', 'Semi-conservative', 'Dispersive only', 'Non-conservative'],
      correct: 'B',
      explanation: 'Each strand templates a new strand (Meselson–Stahl).',
    },
    {
      question: 'Hardy–Weinberg assumes:',
      options: ['Strong selection', 'No migration, no selection, large population', 'Small isolated founders only', 'Directed mutations only'],
      correct: 'B',
      explanation: 'Ideal population: no selection/migration/mutation/drift; random mating.',
    },
  ]),
  ...expandChapter('biology', '12', 'biotech-ecology', [
    {
      question: 'PCR is used to:',
      options: ['Digest proteins', 'Amplify DNA', 'Make lipids', 'Separate organelles'],
      correct: 'B',
      explanation: 'PCR amplifies DNA in vitro.',
    },
    {
      question: 'Restriction enzymes cut:',
      options: ['RNA randomly', 'DNA at specific sites', 'Proteins', 'Lipids'],
      correct: 'B',
      explanation: 'Endonucleases recognise palindromic DNA sequences.',
    },
    {
      question: 'In a pyramid of energy, energy at higher trophic levels:',
      options: ['Increases', 'Decreases', 'Stays equal', 'Becomes infinite'],
      correct: 'B',
      explanation: '~10% energy transfer; energy decreases up the chain.',
    },
    {
      question: 'Biodiversity hotspot concept emphasises:',
      options: ['Only deserts', 'High endemism and threat', 'Only oceans', 'Only farms'],
      correct: 'B',
      explanation: 'Hotspots have exceptional endemism under habitat threat.',
    },
  ]),
  ...expandChapter('physics', '11', 'rotational-motion', [
    {
      question: 'Angular momentum about a point is:',
      options: ['r · p', 'r × p', 'p only', 'm v²'],
      correct: 'B',
      explanation: 'L = r × p.',
      formula: 'L = r × p',
    },
    {
      question: 'SI unit of torque is:',
      options: ['Newton', 'N m', 'Joule/s', 'Watt'],
      correct: 'B',
      explanation: 'τ = r F sinθ → N·m.',
    },
    {
      question: 'For pure rolling without slipping, v =',
      options: ['ω/R', 'ω R', 'ω R²', '0'],
      correct: 'B',
      explanation: 'v = ωR for rolling without slipping.',
    },
    {
      question: 'Moment of inertia of a thin ring about its central axis is:',
      options: ['MR²', '(1/2)MR²', '(2/5)MR²', '(1/12)ML²'],
      correct: 'A',
      explanation: 'All mass at distance R ⇒ I = MR².',
    },
  ]),
  ...expandChapter('physics', '11', 'kinematics', [
    {
      question: 'From rest with acceleration a, distance in time t is:',
      options: ['at', '½ at²', 'at²', '2at'],
      correct: 'B',
      explanation: 's = ½at² when u = 0.',
      formula: 's = ut + ½at²',
    },
    {
      question: 'Velocity is the time rate of change of:',
      options: ['Acceleration', 'Displacement', 'Force', 'Mass'],
      correct: 'B',
      explanation: 'v = ds/dt.',
    },
    {
      question: 'Area under v–t graph gives:',
      options: ['Acceleration', 'Displacement', 'Force', 'Power'],
      correct: 'B',
      explanation: '∫v dt = displacement.',
    },
    {
      question: 'If speed is constant but direction changes, acceleration is:',
      options: ['Always zero', 'Possibly non-zero', 'Infinite', 'Undefined'],
      correct: 'B',
      explanation: 'Direction change ⇒ velocity change ⇒ acceleration (e.g. UCM).',
    },
  ]),
  ...expandChapter('physics', '11', 'kinematics-2d', [
    {
      question: 'Time of flight for projectile (level ground) is:',
      options: ['u sinθ / g', '2u sinθ / g', 'u cosθ / g', 'u²/g'],
      correct: 'B',
      explanation: 'T = 2u sinθ / g.',
      formula: 'T = 2u sinθ / g',
    },
    {
      question: 'Horizontal component of projectile velocity is:',
      options: ['u sinθ', 'u cosθ', 'u tanθ', '0'],
      correct: 'B',
      explanation: 'u_x = u cosθ (constant if no air drag).',
    },
    {
      question: 'Maximum range on horizontal plane occurs at:',
      options: ['30°', '45°', '60°', '90°'],
      correct: 'B',
      explanation: 'R = u² sin2θ / g max at θ = 45°.',
    },
    {
      question: 'In uniform circular motion, acceleration is:',
      options: ['Zero', 'Tangential only', 'Centripetal', 'Random'],
      correct: 'C',
      explanation: 'a = v²/r toward centre.',
    },
  ]),
  ...expandChapter('physics', '11', 'laws-of-motion', [
    {
      question: 'Newton’s second law (constant mass) is:',
      options: ['F = mv', 'F = ma', 'F = m/a', 'F = a/m'],
      correct: 'B',
      explanation: 'F_net = ma.',
      formula: 'F = ma',
    },
    {
      question: 'Action–reaction forces act on:',
      options: ['Same body', 'Different bodies', 'Only Earth', 'Only photons'],
      correct: 'B',
      explanation: 'Third law pairs act on two different bodies.',
    },
    {
      question: 'Friction always:',
      options: ['Speeds up objects', 'Opposes relative tendency of sliding', 'Is zero on rough surfaces', 'Equals mg'],
      correct: 'B',
      explanation: 'Friction opposes impending/actual relative motion.',
    },
    {
      question: 'Momentum p equals:',
      options: ['mv', 'm/v', '½mv²', 'ma'],
      correct: 'A',
      explanation: 'Linear momentum p = mv.',
    },
  ]),
  ...expandChapter('physics', '11', 'work-energy-power', [
    {
      question: 'Work by constant force along displacement is:',
      options: ['F/s', 'F s cosθ', 'F + s', 'F − s'],
      correct: 'B',
      explanation: 'W = F · s = F s cosθ.',
      formula: 'W = F s cosθ',
    },
    {
      question: 'SI unit of power is:',
      options: ['Joule', 'Watt', 'Newton', 'Pascal'],
      correct: 'B',
      explanation: 'Power = work/time → watt.',
    },
    {
      question: 'Kinetic energy is:',
      options: ['mv', '½ mv²', 'mgh only', 'FΔx only'],
      correct: 'B',
      explanation: 'KE = ½ mv².',
    },
    {
      question: 'Work–energy theorem states work by net force equals:',
      options: ['ΔPE only', 'ΔKE', 'Δm', 'ΔT only'],
      correct: 'B',
      explanation: 'W_net = ΔK.',
    },
  ]),
  ...expandChapter('physics', '11', 'gravitation', [
    {
      question: 'g near Earth’s surface is about:',
      options: ['1 m/s²', '9.8 m/s²', '98 m/s²', '0.98 m/s²'],
      correct: 'B',
      explanation: 'g ≈ 9.8 m/s².',
      formula: 'g = GM/R²',
    },
    {
      question: 'Newton’s law of gravitation is an:',
      options: ['Inverse law', 'Inverse-square law', 'Linear law', 'Exponential law'],
      correct: 'B',
      explanation: 'F ∝ 1/r².',
    },
    {
      question: 'Escape speed from Earth surface is about:',
      options: ['1.1 km/s', '7.9 km/s', '11.2 km/s', '3 × 10⁸ m/s'],
      correct: 'C',
      explanation: 'v_esc = √(2GM/R) ≈ 11.2 km/s.',
    },
    {
      question: 'Kepler’s second law means areal velocity is:',
      options: ['Zero', 'Constant', 'Increasing', 'Random'],
      correct: 'B',
      explanation: 'Equal areas in equal times ⇒ constant areal velocity.',
    },
  ]),
  ...expandChapter('physics', '11', 'thermodynamics-11', [
    {
      question: 'In an adiabatic process:',
      options: ['Q = 0', 'W = 0', 'ΔU = 0 always', 'T constant always'],
      correct: 'A',
      explanation: 'Adiabatic ⇒ no heat exchange.',
    },
    {
      question: 'Absolute zero is:',
      options: ['0 °C', '−273.15 °C', '100 °C', '273 °C'],
      correct: 'B',
      explanation: '0 K = −273.15 °C.',
    },
    {
      question: 'Ideal gas law is:',
      options: ['PV = μRT', 'P = VRT', 'TV = P', 'P/T = V²'],
      correct: 'A',
      explanation: 'PV = nRT (or μRT).',
    },
    {
      question: 'Heat capacity at constant pressure C_p is related to C_v by:',
      options: ['C_p − C_v = R (ideal gas, molar)', 'C_p = C_v', 'C_p + C_v = 0', 'C_p = R only'],
      correct: 'A',
      explanation: 'Mayer’s relation: C_p − C_v = R for ideal gas.',
    },
  ]),
  ...expandChapter('physics', '12', 'electrostatics', [
    {
      question: 'Coulomb force ∝',
      options: ['r', '1/r', '1/r²', 'r²'],
      correct: 'C',
      explanation: 'Inverse-square electrostatic force.',
      formula: 'F = k q₁q₂ / r²',
    },
    {
      question: 'SI unit of electric charge is:',
      options: ['Volt', 'Coulomb', 'Ampere', 'Ohm'],
      correct: 'B',
      explanation: 'Charge unit is coulomb.',
    },
    {
      question: 'Electric field inside a charged conductor (electrostatics) is:',
      options: ['Maximum', 'Zero', 'Infinite', 'Equal to σ/ε₀ always outside too'],
      correct: 'B',
      explanation: 'E = 0 inside conductor in electrostatic equilibrium.',
    },
    {
      question: 'Capacitance of parallel plate capacitor increases if:',
      options: ['Plate separation increases', 'Area increases', 'Charge decreases only', 'Voltage becomes zero'],
      correct: 'B',
      explanation: 'C = ε₀A/d increases with A.',
    },
  ]),
  ...expandChapter('physics', '12', 'current-electricity', [
    {
      question: 'Ohm’s law: V =',
      options: ['IR', 'I/R', 'R/I', 'I²R'],
      correct: 'A',
      explanation: 'V = IR for ohmic resistors.',
      formula: 'V = IR',
    },
    {
      question: 'SI unit of resistance is:',
      options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
      correct: 'C',
      explanation: 'Resistance is measured in ohm (Ω).',
    },
    {
      question: 'Kirchhoff’s junction rule is based on conservation of:',
      options: ['Energy', 'Charge', 'Momentum', 'Mass'],
      correct: 'B',
      explanation: 'Current into a junction equals current out (charge conservation).',
    },
    {
      question: 'Power dissipated in resistor is:',
      options: ['VI', 'V/I', 'I/V', 'V + I'],
      correct: 'A',
      explanation: 'P = VI = I²R = V²/R.',
    },
  ]),
  ...expandChapter('physics', '12', 'magnetic-effects', [
    {
      question: 'SI unit of magnetic field B is:',
      options: ['Weber', 'Tesla', 'Henry', 'Gauss only'],
      correct: 'B',
      explanation: 'B is measured in tesla.',
      formula: 'F = qvB sinθ',
    },
    {
      question: 'Force on a charge in magnetic field is maximum when v is:',
      options: ['Parallel to B', 'Perpendicular to B', 'Zero', 'Anti-parallel only'],
      correct: 'B',
      explanation: 'F = qvB sinθ max at 90°.',
    },
    {
      question: 'Magnetic field inside a long solenoid is:',
      options: ['μ₀ n I', 'μ₀ I / 2πr', 'Zero always', '∞'],
      correct: 'A',
      explanation: 'B = μ₀ n I along axis (ideal long solenoid).',
    },
    {
      question: 'SI unit of magnetic flux is:',
      options: ['Tesla', 'Weber', 'Henry', 'Ampere'],
      correct: 'B',
      explanation: 'Flux Φ_B is in weber (Wb).',
    },
  ]),
  ...expandChapter('physics', '12', 'emi-ac', [
    {
      question: 'Faraday’s law: induced emf relates to:',
      options: ['Change of magnetic flux', 'Temperature only', 'Mass of coil', 'Colour of wire'],
      correct: 'A',
      explanation: 'ε = −dΦ/dt.',
      formula: 'ε = −dΦ/dt',
    },
    {
      question: 'Lenz’s law gives:',
      options: ['Magnitude only', 'Direction of induced current', 'Resistance', 'Capacitance'],
      correct: 'B',
      explanation: 'Induced current opposes the cause (Lenz).',
    },
    {
      question: 'In a pure inductor, current lags voltage by:',
      options: ['0°', '45°', '90°', '180°'],
      correct: 'C',
      explanation: 'For ideal L, phase difference is π/2 with current lagging.',
    },
    {
      question: 'RMS value of V = V₀ sinωt is:',
      options: ['V₀', 'V₀/√2', 'V₀/2', '√2 V₀'],
      correct: 'B',
      explanation: 'V_rms = V₀/√2 for sinusoids.',
    },
  ]),
  ...expandChapter('physics', '12', 'optics', [
    {
      question: 'Mirror formula is:',
      options: ['1/v − 1/u = 1/f', '1/v + 1/u = 1/f', 'v + u = f', 'vu = f'],
      correct: 'B',
      explanation: '1/v + 1/u = 1/f for spherical mirrors.',
      formula: '1/v + 1/u = 1/f',
    },
    {
      question: 'Snell’s law is:',
      options: ['n₁ sin i = n₂ sin r', 'n₁ cos i = n₂ cos r', 'i = r always', 'n = c only'],
      correct: 'A',
      explanation: 'n₁ sin i = n₂ sin r.',
    },
    {
      question: 'Focal length of a plane mirror is:',
      options: ['Zero', 'Infinity', '1 m', 'Equal to R'],
      correct: 'B',
      explanation: 'Plane mirror: R → ∞ ⇒ f → ∞.',
    },
    {
      question: 'Young’s double-slit fringes are due to:',
      options: ['Reflection only', 'Interference', 'Photoelectric effect', 'Compton effect'],
      correct: 'B',
      explanation: 'YDSE demonstrates interference of light.',
    },
  ]),
  ...expandChapter('physics', '12', 'modern-physics', [
    {
      question: 'Einstein photoelectric equation:',
      options: ['K_max = hν + φ', 'K_max = hν − φ', 'K_max = φ − hν', 'K_max = hν'],
      correct: 'B',
      explanation: 'K_max = hν − work function.',
      formula: 'K_max = hν − φ',
    },
    {
      question: 'Photon energy is:',
      options: ['h/λ', 'hc/λ', 'λ/h', 'mc only'],
      correct: 'B',
      explanation: 'E = hν = hc/λ.',
    },
    {
      question: 'de Broglie wavelength of a particle is:',
      options: ['h/p', 'p/h', 'hν', 'mc²'],
      correct: 'A',
      explanation: 'λ = h/p.',
    },
    {
      question: 'In Bohr model, angular momentum is:',
      options: ['nh/2π', 'n²h', 'h/n', '2π/nh'],
      correct: 'A',
      explanation: 'mvr = nh/2π.',
    },
  ]),
  ...expandChapter('physics', '12', 'communication-system', [
    {
      question: 'In AM, the message varies the carrier’s:',
      options: ['Frequency', 'Amplitude', 'Phase only', 'Speed of light'],
      correct: 'B',
      explanation: 'Amplitude modulation varies amplitude.',
    },
    {
      question: 'Modulation is needed mainly to:',
      options: ['Increase DC', 'Transmit message efficiently via carrier', 'Stop waves', 'Cool antennas'],
      correct: 'B',
      explanation: 'High-frequency carriers radiate/transmit practical antennas.',
    },
    {
      question: 'Bandwidth of AM (DSB) for message bandwidth f_m is about:',
      options: ['f_m', '2 f_m', 'f_m/2', '0'],
      correct: 'B',
      explanation: 'DSB-AM occupies roughly 2 f_m.',
    },
    {
      question: 'An antenna converts:',
      options: ['Sound to heat only', 'Guided RF to free-space waves (and vice versa)', 'DC to mass', 'Light to gravity'],
      correct: 'B',
      explanation: 'Antennas radiate/receive electromagnetic waves.',
    },
  ]),
]
