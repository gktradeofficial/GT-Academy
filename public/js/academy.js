const STORAGE_KEY = "gt-academy-library";
const USER_KEY = "gt-academy-user";
const ACCOUNTS_KEY = "gt-academy-accounts";
const STUDY_KEY = "gt-academy-study-progress";
const CURRICULUM_KEY = "gt-academy-curriculum";
const PAYMENT_KEY = "gt-academy-payment-settings";
let pendingSignup = null;
let pendingMobileLogin = null;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  const installButton = document.querySelector(".install-app-button");
  if (installButton) installButton.hidden = false;
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  const installButton = document.querySelector(".install-app-button");
  if (installButton) installButton.hidden = true;
});

function installApp() {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  deferredInstallPrompt.userChoice.finally(() => {
    deferredInstallPrompt = null;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".install-app-button").forEach((button) => {
    button.addEventListener("click", installApp);
  });
});
const EXAM_OPTIONS = [
  "JEE Main",
  "JEE Advanced",
  "NEET",
  "SSC CGL",
  "Banking",
  "UPSC",
  "Railway",
  "Board Exams"
];

const EXAM_DETAILS = {
  "JEE Main": { level: "Engineering entrance", summary: "Build speed and accuracy across Physics, Chemistry, and Mathematics for a high-scoring computer-based test.", subjects: ["Physics", "Chemistry", "Mathematics"], topics: ["Mechanics", "Electrodynamics", "Organic Chemistry", "Calculus"], subtopics: ["Kinematics", "Current electricity", "Reaction mechanisms", "Limits and integration"], strategy: "Finish concepts chapter-wise, solve recent-year questions, and take timed mixed tests every week. Maintain an error notebook and revise it twice a week." },
  "JEE Advanced": { level: "Advanced engineering entrance", summary: "Develop deep concepts and flexible problem-solving for multi-step Physics, Chemistry, and Mathematics problems.", subjects: ["Physics", "Chemistry", "Mathematics"], topics: ["Rotational motion", "Thermodynamics", "Coordination chemistry", "Algebra"], subtopics: ["Rolling motion", "Entropy", "d-block compounds", "Complex numbers"], strategy: "Study fewer sources deeply, practice multi-concept problems, and review every wrong solution. Use full-length papers to improve question selection." },
  NEET: { level: "Medical entrance", summary: "Maximize accuracy in Biology while building reliable Chemistry and Physics fundamentals for medical entrance preparation.", subjects: ["Biology", "Physics", "Chemistry"], topics: ["Human physiology", "Genetics", "Mechanics", "Biomolecules"], subtopics: ["Neural control", "Mendelian inheritance", "Work and energy", "Proteins and enzymes"], strategy: "Read the core textbook line by line, revise Biology daily, and use short timed sets. Track incorrect facts and repeat them at spaced intervals." },
  "SSC CGL": { level: "Government recruitment", summary: "Prepare for Quantitative Aptitude, Reasoning, English, and General Awareness with a speed-first routine.", subjects: ["Quant", "Reasoning", "English", "General Awareness"], topics: ["Arithmetic", "Verbal reasoning", "Grammar", "Static GK"], subtopics: ["Percentages", "Syllogism", "Error spotting", "Polity and history"], strategy: "Divide practice into timed daily sections, memorize high-frequency formulas, and analyze mock-test time usage. Revisit weak chapters every Sunday." },
  Banking: { level: "Banking exams", summary: "Strengthen speed, calculation, reasoning patterns, English comprehension, and current awareness for banking selections.", subjects: ["Quant", "Reasoning", "English", "Current Affairs"], topics: ["Data interpretation", "Puzzles", "Reading comprehension", "Banking awareness"], subtopics: ["Tables and charts", "Seating arrangements", "Cloze tests", "RBI and finance"], strategy: "Practice with sectional timers, build calculation shortcuts, read daily current affairs, and take two full mocks each week." },
  UPSC: { level: "Civil services", summary: "Create an integrated foundation across General Studies, current affairs, answer writing, and optional-subject preparation.", subjects: ["GS I-IV", "Essay", "CSAT", "Optional"], topics: ["History", "Polity", "Economy", "Environment"], subtopics: ["Modern India", "Constitution", "Budget and growth", "Ecology"], strategy: "Follow one trusted source per subject, connect current events to the syllabus, write answers weekly, and revise through short self-made notes." },
  Railway: { level: "Railway recruitment", summary: "Cover Mathematics, General Intelligence, General Science, and General Awareness with consistent speed practice.", subjects: ["Mathematics", "Reasoning", "Science", "General Awareness"], topics: ["Number system", "Analogy", "Physics basics", "Geography"], subtopics: ["Ratio and proportion", "Series", "Motion and electricity", "Indian geography"], strategy: "Solve short daily drills, revise formulas and facts, and use previous papers to identify repeated patterns before attempting full mocks." },
  "Board Exams": { level: "School board preparation", summary: "Build chapter clarity, written presentation, and revision discipline for strong subject-wise board performance.", subjects: ["Languages", "Mathematics", "Science", "Social Science"], topics: ["Textbook chapters", "Algebra", "Concepts and diagrams", "Civics and history"], subtopics: ["Writing formats", "Equations", "Definitions and numericals", "Maps and timelines"], strategy: "Complete the textbook first, prepare chapter summaries, practice previous papers, and reserve the final weeks for timed answer writing and revision." }
};

function buildJeeChapters(names) {
  return names.map((name, index) => ({
    name,
    priority: index % 5 === 0 ? "low" : index % 3 === 0 ? "medium" : "high",
    topics: [
      { title: `${name} concepts`, subtopics: ["Core definitions and concepts", "Important formulae and results", "JEE Main question patterns"] },
      { title: `${name} practice`, subtopics: ["Solved examples", "Previous-year questions", "Revision checklist"] }
    ]
  }));
}

function buildAdvancedChapters(names, priorityNames = []) {
  return names.map((name) => ({
    name,
    priority: priorityNames.includes(name) ? "high" : "medium",
    topics: [
      { title: `${name} concept builder`, subtopics: ["Advanced concepts and definitions", "Multi-concept connections", "Important formulae and results"] },
      { title: `${name} problem lab`, subtopics: ["Tough and advanced problems", "JEE Advanced PYQs", "Common traps and mistakes"] }
    ]
  }));
}

function buildNeetChapters(names, priorityNames = []) {
  return names.map((name) => ({
    name,
    priority: priorityNames.includes(name) ? "high" : "medium",
    topics: [
      { title: `${name} concepts`, subtopics: ["NCERT-based explanation", "Important facts and diagrams", "NEET question patterns"] },
      { title: `${name} revision`, subtopics: ["Key examples", "NEET PYQ-type questions", "Common mistakes and quick revision"] }
    ]
  }));
}

function buildSscChapters(names, priorityNames = []) {
  return names.map((name) => ({
    name,
    priority: priorityNames.includes(name) ? "high" : "medium",
    topics: [
      { title: `${name} concepts`, subtopics: ["Core concepts and definitions", "Important facts and short tricks", "SSC CGL PYQ patterns"] },
      { title: `${name} practice`, subtopics: ["Solved examples", "Timed practice set", "Revision checklist"] }
    ]
  }));
}

function buildBankingChapters(names, priorityNames = []) {
  return names.map((name) => ({
    name,
    priority: priorityNames.includes(name) ? "high" : "medium",
    topics: [
      { title: `${name} concepts`, subtopics: ["Core concepts and definitions", "Important formulas and facts", "Banking exam question patterns"] },
      { title: `${name} practice`, subtopics: ["Shortcut methods", "Previous-year questions", "Timed practice and revision"] }
    ]
  }));
}

function buildUpscChapters(names, priorityNames = []) {
  return names.map((name) => ({
    name,
    priority: priorityNames.includes(name) ? "high" : "medium",
    topics: [
      { title: `${name} foundation`, subtopics: ["Full explanation and concepts", "Key facts and mind map", "Current affairs connection"] },
      { title: `${name} answer lab`, subtopics: ["UPSC Prelims PYQs", "Mains questions and answer writing", "Revision checklist"] }
    ]
  }));
}

const JEE_MAIN_CURRICULUM = {
  Physics: {
    icon: "⚡", accent: "physics", summary: "Mechanics, Electrodynamics, and Optics",
    chapters: buildJeeChapters(["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power", "Rotational Motion", "Gravitation", "Properties of Solids & Liquids", "Thermodynamics", "Kinetic Theory of Gases", "Oscillations", "Waves", "Electrostatics", "Current Electricity", "Magnetic Effects of Current & Magnetism", "Electromagnetic Induction & Alternating Current", "Electromagnetic Waves", "Optics", "Dual Nature of Matter & Radiation", "Atoms & Nuclei", "Electronic Devices", "Experimental Skills"])
  },
  Chemistry: {
    icon: "🧪", accent: "chemistry", summary: "Physical, Organic & Inorganic Chemistry",
    chapters: [
      ...buildJeeChapters(["Some Basic Concepts in Chemistry", "Atomic Structure", "Chemical Bonding & Molecular Structure", "Chemical Thermodynamics", "Solutions", "Equilibrium", "Redox Reactions & Electrochemistry", "Chemical Kinetics", "Surface Chemistry"]),
      ...buildJeeChapters(["Classification of Elements & Periodicity", "p-Block Elements", "d- and f-Block Elements", "Coordination Compounds", "Principles Related to Practical Chemistry"]),
      ...buildJeeChapters(["Purification & Characterisation of Organic Compounds", "Some Basic Principles of Organic Chemistry", "Hydrocarbons", "Organic Compounds Containing Halogens", "Organic Compounds Containing Oxygen", "Organic Compounds Containing Nitrogen", "Biomolecules", "Polymers", "Chemistry in Everyday Life"])
    ]
  },
  Mathematics: {
    icon: "📐", accent: "maths", summary: "Algebra, Calculus, Coordinate Geometry",
    chapters: buildJeeChapters(["Sets, Relations & Functions", "Complex Numbers & Quadratic Equations", "Matrices & Determinants", "Permutations & Combinations", "Binomial Theorem", "Sequence & Series", "Trigonometry", "Statistics & Probability", "Mathematical Reasoning", "Coordinate Geometry", "Straight Lines", "Circle", "Parabola", "Ellipse", "Hyperbola", "Limits, Continuity & Differentiability", "Integral Calculus", "Differential Equations", "Vector Algebra", "Three Dimensional Geometry"])
  }
};

const JEE_ADVANCED_CURRICULUM = {
  Physics: {
    icon: "⚡", accent: "physics", summary: "Concept depth, multi-step problems, and advanced applications",
    chapters: buildAdvancedChapters(["General Physics, Units & Measurements", "Kinematics", "Newton's Laws of Motion", "Work, Energy & Power", "System of Particles & Centre of Mass", "Rotational Motion", "Gravitation", "Properties of Matter", "Fluid Mechanics", "Thermodynamics", "Kinetic Theory of Gases", "Simple Harmonic Motion", "Waves & Sound", "Electrostatics", "Capacitance", "Current Electricity", "Magnetic Effects of Current", "Magnetism", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Ray Optics", "Wave Optics", "Dual Nature of Matter & Radiation", "Atoms", "Nuclei", "Semiconductor Electronics"], ["Rotational Motion", "System of Particles & Centre of Mass", "Electrostatics", "Current Electricity", "Magnetism", "Electromagnetic Induction", "Alternating Current", "Simple Harmonic Motion", "Waves & Sound", "Ray Optics", "Wave Optics", "Thermodynamics"])
  },
  Chemistry: {
    icon: "🧪", accent: "chemistry", summary: "Physical, Inorganic, and Organic Chemistry at advanced depth",
    chapters: [
      ...buildAdvancedChapters(["Some Basic Concepts / Mole Concept", "Atomic Structure", "States of Matter", "Chemical Thermodynamics", "Chemical Equilibrium", "Ionic Equilibrium", "Redox Reactions", "Electrochemistry", "Chemical Kinetics", "Solutions", "Solid State", "Surface Chemistry"], ["Ionic Equilibrium", "Chemical Thermodynamics", "Electrochemistry", "Chemical Kinetics", "Chemical Equilibrium"]),
      ...buildAdvancedChapters(["Periodic Classification", "Chemical Bonding", "Hydrogen", "s-Block Elements", "p-Block Elements", "d-Block Elements", "f-Block Elements", "Coordination Compounds", "Metallurgy", "Qualitative Analysis", "Environmental Chemistry"], ["Chemical Bonding", "Coordination Compounds", "p-Block Elements", "d-Block Elements", "f-Block Elements", "Qualitative Analysis"]),
      ...buildAdvancedChapters(["General Organic Chemistry", "Structural & Stereoisomerism", "Reaction Mechanism", "Hydrocarbons", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes & Ketones", "Carboxylic Acids & Derivatives", "Amines", "Biomolecules", "Polymers", "Practical Organic Chemistry"], ["General Organic Chemistry", "Structural & Stereoisomerism", "Reaction Mechanism", "Aldehydes & Ketones", "Amines"])
    ]
  },
  Mathematics: {
    icon: "📐", accent: "maths", summary: "Algebra, Calculus, Conics, and Vector geometry",
    chapters: [
      ...buildAdvancedChapters(["Sets, Relations & Functions", "Complex Numbers", "Quadratic Equations", "Sequences & Series", "Permutations & Combinations", "Binomial Theorem", "Probability", "Matrices & Determinants", "Mathematical Reasoning", "Inequalities"], ["Complex Numbers", "Permutations & Combinations", "Probability", "Matrices & Determinants", "Inequalities"]),
      ...buildAdvancedChapters(["Limits", "Continuity", "Differentiability", "Methods of Differentiation", "Application of Derivatives", "Indefinite Integration", "Definite Integration", "Area Under Curves", "Differential Equations"], ["Application of Derivatives", "Definite Integration", "Area Under Curves", "Differential Equations", "Limits"]),
      ...buildAdvancedChapters(["Straight Lines", "Circle", "Parabola", "Ellipse", "Hyperbola"], ["Parabola", "Ellipse", "Hyperbola"]),
      ...buildAdvancedChapters(["Vector Algebra", "Lines in 3D", "Planes", "Distance & Angles", "Sphere"], ["Lines in 3D", "Planes", "Distance & Angles", "Vector Algebra"])
    ]
  }
};

const NEET_CURRICULUM = {
  Botany: {
    icon: "🌱", accent: "biology", summary: "Plant diversity, physiology, genetics, and biotechnology",
    chapters: buildNeetChapters(["The Living World", "Biological Classification", "Plant Kingdom", "Morphology of Flowering Plants", "Anatomy of Flowering Plants", "Structural Organisation in Plants", "Cell: The Unit of Life", "Biomolecules", "Cell Cycle & Cell Division", "Transport in Plants", "Mineral Nutrition", "Photosynthesis in Plants", "Respiration in Plants", "Plant Growth & Development", "Sexual Reproduction in Flowering Plants", "Principles of Inheritance & Variation", "Molecular Basis of Inheritance", "Biotechnology: Principles & Processes", "Biotechnology & Its Applications", "Ecology & Environment"], ["Cell: The Unit of Life", "Cell Cycle & Cell Division", "Photosynthesis in Plants", "Respiration in Plants", "Principles of Inheritance & Variation", "Molecular Basis of Inheritance", "Biotechnology: Principles & Processes"])
  },
  Zoology: {
    icon: "🐾", accent: "biology", summary: "Animal diversity, human physiology, reproduction, and ecology",
    chapters: buildNeetChapters(["Animal Kingdom", "Structural Organisation in Animals", "Digestion & Absorption", "Breathing & Exchange of Gases", "Body Fluids & Circulation", "Excretory Products & Elimination", "Locomotion & Movement", "Neural Control & Coordination", "Chemical Coordination & Integration", "Human Reproduction", "Reproductive Health", "Human Health & Disease", "Evolution", "Animal Husbandry", "Biology & Human Welfare", "Biodiversity & Conservation", "Ecology"], ["Digestion & Absorption", "Breathing & Exchange of Gases", "Body Fluids & Circulation", "Neural Control & Coordination", "Human Reproduction", "Human Health & Disease", "Evolution", "Ecology"])
  },
  Physics: {
    icon: "⚡", accent: "physics", summary: "Mechanics, electricity, magnetism, optics, and modern physics",
    chapters: buildNeetChapters(["Units & Measurements", "Kinematics", "Laws of Motion", "Work, Energy & Power", "System of Particles & Rotational Motion", "Gravitation", "Properties of Bulk Matter", "Thermodynamics", "Kinetic Theory", "Oscillations", "Waves", "Electrostatics", "Current Electricity", "Magnetic Effects of Current & Magnetism", "Electromagnetic Induction", "Alternating Current", "Electromagnetic Waves", "Optics", "Dual Nature of Matter & Radiation", "Atoms & Nuclei", "Electronic Devices", "Experimental Skills"], ["Current Electricity", "Electrostatics", "Magnetic Effects of Current & Magnetism", "Electromagnetic Induction", "Alternating Current", "Optics", "Dual Nature of Matter & Radiation", "Electronic Devices", "Thermodynamics", "System of Particles & Rotational Motion"])
  },
  Chemistry: {
    icon: "🧪", accent: "chemistry", summary: "Physical, inorganic, and organic chemistry for NEET",
    chapters: [
      ...buildNeetChapters(["Some Basic Concepts of Chemistry", "Atomic Structure", "Chemical Bonding", "Thermodynamics", "Equilibrium", "Redox Reactions", "Solutions", "Electrochemistry", "Chemical Kinetics", "Solid State"], ["Some Basic Concepts of Chemistry", "Chemical Bonding", "Thermodynamics", "Equilibrium", "Electrochemistry", "Chemical Kinetics"]),
      ...buildNeetChapters(["Periodic Classification", "Chemical Bonding", "Hydrogen", "s-Block", "p-Block", "d- & f-Block", "Coordination Compounds", "Metallurgy", "Qualitative Analysis", "Environmental Chemistry"], ["Periodic Classification", "Chemical Bonding", "Coordination Compounds", "p-Block", "d- & f-Block"]),
      ...buildNeetChapters(["General Organic Chemistry", "Isomerism", "Hydrocarbons", "Haloalkanes & Haloarenes", "Alcohols, Phenols & Ethers", "Aldehydes & Ketones", "Carboxylic Acids", "Amines", "Biomolecules", "Polymers", "Chemistry in Everyday Life"], ["General Organic Chemistry", "Isomerism", "Hydrocarbons", "Aldehydes & Ketones", "Amines", "Biomolecules"])
    ]
  }
};

const SSC_CGL_CURRICULUM = {
  Quant: {
    icon: "🧮", accent: "maths", summary: "Arithmetic, Algebra, Geometry, Mensuration, Trigonometry, and DI",
    chapters: buildSscChapters(["Arithmetic", "Algebra", "Geometry", "Mensuration", "Trigonometry", "Data Interpretation"], ["Arithmetic", "Algebra", "Geometry", "Mensuration", "Trigonometry"])
  },
  Reasoning: {
    icon: "🧠", accent: "biology", summary: "Analogy, series, coding, logical, non-verbal, and puzzle reasoning",
    chapters: buildSscChapters(["Analogy & Classification", "Series", "Coding-Decoding", "Logical Reasoning", "Non-Verbal Reasoning", "Puzzle & Arrangement"], ["Series", "Coding-Decoding", "Logical Reasoning", "Puzzle & Arrangement"])
  },
  English: {
    icon: "📚", accent: "chemistry", summary: "Vocabulary, grammar, comprehension, and sentence improvement",
    chapters: buildSscChapters(["Vocabulary", "Grammar", "Comprehension"], ["Vocabulary", "Grammar", "Comprehension"])
  },
  "General Awareness": {
    icon: "🌍", accent: "physics", summary: "History, Geography, Polity, Economics, Science, and Current Affairs",
    chapters: buildSscChapters(["History", "Geography", "Polity", "Economics", "General Science", "Current Affairs"], ["History", "Geography", "Polity", "Economics", "General Science", "Current Affairs"])
  }
};

const BANKING_CURRICULUM = {
  Quant: {
    icon: "🧮", accent: "maths", summary: "Numerical Ability, arithmetic, DI, series, and equations",
    chapters: buildBankingChapters(["Number & Calculation", "Arithmetic", "Data Interpretation", "Series & Equations"], ["Number & Calculation", "Arithmetic", "Data Interpretation", "Series & Equations"])
  },
  Reasoning: {
    icon: "🧠", accent: "biology", summary: "Puzzles, seating, syllogism, inequality, coding, and logical reasoning",
    chapters: buildBankingChapters(["Puzzles & Seating Arrangement", "Syllogism", "Inequality", "Coding & Decoding", "Blood Relation & Direction", "Series & Miscellaneous"], ["Puzzles & Seating Arrangement", "Syllogism", "Inequality", "Coding & Decoding", "Series & Miscellaneous"])
  },
  English: {
    icon: "📚", accent: "chemistry", summary: "Reading, grammar, vocabulary, and Banking English",
    chapters: buildBankingChapters(["Reading", "Grammar", "Vocabulary", "Banking English"], ["Reading", "Grammar", "Banking English"])
  },
  "Banking Awareness": {
    icon: "🏦", accent: "physics", summary: "Banking basics, RBI, financial terms, and financial awareness",
    chapters: buildBankingChapters(["Banking Basics", "RBI", "Banking Terms", "Financial Awareness"], ["RBI", "Banking Terms", "Financial Awareness"])
  },
  "Current Affairs": {
    icon: "🌍", accent: "biology", summary: "Banking, economy, government schemes, and recent national events",
    chapters: buildBankingChapters(["General Awareness & Current Affairs"], ["General Awareness & Current Affairs"])
  },
  Computer: {
    icon: "💻", accent: "maths", summary: "Computer fundamentals, internet, MS Office, and cyber security",
    chapters: buildBankingChapters(["Computer Basics", "Internet & Networking", "MS Office", "Security"], ["Computer Basics", "Internet & Networking", "MS Office", "Security"])
  }
};

const UPSC_CURRICULUM = {
  "Prelims GS": {
    icon: "🏆", accent: "physics", summary: "History, Geography, Polity, Economy, Environment, Science, and Current Affairs",
    chapters: buildUpscChapters(["History", "Indian & World Geography", "Indian Polity & Governance", "Economy", "Environment & Ecology", "General Science", "Current Affairs"], ["History", "Indian Polity & Governance", "Economy", "Environment & Ecology", "Current Affairs"])
  },
  CSAT: {
    icon: "🧮", accent: "maths", summary: "Comprehension, reasoning, decision making, numeracy, and data interpretation",
    chapters: buildUpscChapters(["Comprehension", "Logical Reasoning", "Analytical Ability", "Decision Making", "Basic Numeracy", "Data Interpretation"], ["Comprehension", "Basic Numeracy", "Logical Reasoning"])
  },
  "GS-I": {
    icon: "📜", accent: "chemistry", summary: "Indian heritage, culture, history, society, and geography",
    chapters: buildUpscChapters(["Indian Heritage & Culture", "Modern Indian History", "Freedom Struggle", "Post-Independence India", "World History", "Physical Geography", "Resources & Industries", "Geographical Phenomena", "Urbanization"], ["Modern Indian History", "Freedom Struggle", "World History", "Physical Geography"])
  },
  "GS-II": {
    icon: "⚖️", accent: "biology", summary: "Polity, governance, social justice, and international relations",
    chapters: buildUpscChapters(["Constitution & Polity", "Governance", "Social Justice", "Health & Education", "Welfare Schemes", "International Relations", "India and Neighbours", "Indo-Pacific & Global Institutions"], ["Constitution & Polity", "Governance", "International Relations", "Social Justice"])
  },
  "GS-III": {
    icon: "💹", accent: "maths", summary: "Economy, agriculture, environment, science, technology, and security",
    chapters: buildUpscChapters(["Indian Economy", "Agriculture & Food Security", "Infrastructure & Investment", "Environment & Climate Change", "Science & Technology", "Biotechnology & Space", "Internal Security", "Cyber Security & Border Management"], ["Indian Economy", "Agriculture & Food Security", "Environment & Climate Change", "Internal Security"])
  },
  "GS-IV Ethics": {
    icon: "🧠", accent: "biology", summary: "Ethics, values, emotional intelligence, probity, and case studies",
    chapters: buildUpscChapters(["Ethics, Morality & Values", "Human Values & Attitude", "Emotional Intelligence", "Thinkers and Philosophers", "Integrity & Impartiality", "Probity in Governance", "Public Administration Ethics", "Ethics Case Studies"], ["Emotional Intelligence", "Integrity & Impartiality", "Probity in Governance", "Ethics Case Studies"])
  },
  "Essay Lab": {
    icon: "✍️", accent: "chemistry", summary: "Build introductions, dimensions, arguments, examples, and conclusions",
    chapters: buildUpscChapters(["Education & Society", "Women & Governance", "Democracy & Ethics", "Technology & Environment", "Economy & Development", "Philosophy & International Relations"], ["Democracy & Ethics", "Technology & Environment", "Economy & Development"])
  },
  "Optional Module": {
    icon: "📚", accent: "physics", summary: "Select an optional subject and track papers, notes, PYQs, and answer writing",
    chapters: buildUpscChapters(["Geography Optional", "History Optional", "Sociology Optional", "Political Science & IR", "Public Administration", "Anthropology", "Philosophy", "Economics", "Mathematics", "Psychology", "Hindi Literature", "English Literature"], ["Optional Paper I", "Optional Paper II"])
  },
  "Current Affairs": {
    icon: "📰", accent: "biology", summary: "Tag current events across Prelims and Mains subjects for connected revision",
    chapters: buildUpscChapters(["National News", "International Relations", "Government Schemes", "Economy & Budget", "Environment", "Science & Technology", "Defence", "Polity & Supreme Court", "Reports & Indexes", "Places and Species in News"], ["International Relations", "Government Schemes", "Economy & Budget", "Environment", "Science & Technology"])
  }
};

const UPSC_TOPIC_DETAILS = {
  History: ["Indus Valley Civilization", "Buddhism & Jainism", "Mauryan Empire", "Gupta Period", "Delhi Sultanate", "Mughal Empire", "Bhakti & Sufi Movement", "Revolt of 1857", "Gandhian Era", "Freedom Struggle", "Constitutional Developments"],
  "Indian Polity & Governance": ["Preamble", "Fundamental Rights", "DPSP", "Fundamental Duties", "Parliament", "Judiciary", "Federalism", "Constitutional Bodies", "Governance", "RTI and E-Governance"],
  Economy: ["GDP and National Income", "Inflation", "RBI and Monetary Policy", "Fiscal Policy", "Budget", "Banking", "External Sector", "Inclusive Growth", "Agriculture", "Financial Inclusion"],
  "Environment & Ecology": ["Ecosystem", "Biodiversity", "Protected Areas", "Climate Change", "Carbon Markets", "UNFCCC", "Paris Agreement", "CITES", "Ramsar", "Pollution and Conservation"],
  "Indian Economy": ["Growth and Employment", "Agriculture", "Infrastructure", "Investment", "Budget", "Banking", "MSME", "Inclusive Growth", "Digital Economy", "Sustainable Development"],
  "International Relations": ["India and Neighbours", "India-USA", "India-Russia", "India-China", "India-EU", "India-Japan", "Indo-Pacific", "QUAD", "BRICS", "G20", "UN Institutions"],
  "Science & Technology": ["Biotechnology", "Genetics", "Vaccines", "Space Technology", "ISRO", "Artificial Intelligence", "Quantum Computing", "Nanotechnology", "Robotics", "Defence Technology"],
  "Ethics Case Studies": ["Administrative Dilemmas", "Ethical Dilemmas", "Conflict Situations", "Corruption", "Whistleblowing", "Decision Making", "Integrity", "Emotional Intelligence"],
  Comprehension: ["Passage Reading", "Main Idea", "Inference", "Assumption", "Conclusion"],
  "Basic Numeracy": ["Number System", "Percentage", "Ratio", "Average", "Profit & Loss", "Time & Work", "Time-Speed-Distance", "Algebra", "Geometry", "Data Interpretation"]
};

Object.entries(UPSC_TOPIC_DETAILS).forEach(([chapterName, subtopics]) => {
  const chapter = Object.values(UPSC_CURRICULUM).flatMap((section) => section.chapters).find((item) => item.name === chapterName);
  if (chapter) {
    chapter.topics = [{ title: `${chapterName} concept map`, subtopics }, { title: "UPSC answer lab", subtopics: ["Prelims PYQs", "Mains question", "Key facts and current affairs link", "Revision checklist"] }];
  }
});

function loadCurriculumCatalog() {
  try {
    const saved = JSON.parse(localStorage.getItem(CURRICULUM_KEY) || "null");
    return saved && typeof saved === "object" ? saved : {
      "JEE Main": JEE_MAIN_CURRICULUM,
      "JEE Advanced": JEE_ADVANCED_CURRICULUM,
      NEET: NEET_CURRICULUM,
      "SSC CGL": SSC_CGL_CURRICULUM,
      Banking: BANKING_CURRICULUM,
      UPSC: UPSC_CURRICULUM
    };
  } catch {
    return {
      "JEE Main": JEE_MAIN_CURRICULUM,
      "JEE Advanced": JEE_ADVANCED_CURRICULUM,
      NEET: NEET_CURRICULUM,
      "SSC CGL": SSC_CGL_CURRICULUM,
      Banking: BANKING_CURRICULUM,
      UPSC: UPSC_CURRICULUM
    };
  }
}

const curriculumCatalog = loadCurriculumCatalog();

function saveCurriculumCatalog() {
  localStorage.setItem(CURRICULUM_KEY, JSON.stringify(curriculumCatalog));
}

function getPaymentSettings() {
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_KEY) || "null") || { upiId: "academy@upi", qrUrl: "" };
  } catch {
    return { upiId: "academy@upi", qrUrl: "" };
  }
}

function savePaymentSettings(settings) {
  localStorage.setItem(PAYMENT_KEY, JSON.stringify(settings));
}

function isPackageActive() {
  const user = getCurrentUser();
  return Boolean(user && user.role === "student" && user.packageActive);
}

const BANKING_TOPIC_DETAILS = {
  "Number & Calculation": ["Number System", "Simplification", "Approximation", "HCF & LCM", "Squares & Cubes", "Fractions & Decimals", "Surds & Indices"],
  Arithmetic: ["Percentage", "Ratio & Proportion", "Average", "Profit & Loss", "Simple Interest", "Compound Interest", "Partnership", "Mixture & Alligation", "Time & Work", "Pipes & Cisterns", "Time, Speed & Distance", "Boats & Streams", "Problems on Ages"],
  "Data Interpretation": ["Table DI", "Bar Graph", "Line Graph", "Pie Chart", "Caselet DI", "Missing DI", "Data Sufficiency"],
  "Series & Equations": ["Number Series", "Quadratic Equations", "Approximation-based Questions", "Quantity Comparison"],
  "Puzzles & Seating Arrangement": ["Linear Seating", "Circular Seating", "Square/Rectangular Seating", "Floor-based Puzzle", "Box-based Puzzle", "Scheduling Puzzle", "Comparison Puzzle", "Month/Day-based Puzzle"],
  Syllogism: ["Basic Syllogism", "Venn Diagram Method", "Possibility Cases", "Coded Syllogism"],
  Inequality: ["Direct Inequality", "Coded Inequality", "Statement-based Inequality"],
  "Coding & Decoding": ["Letter Coding", "Number Coding", "Symbol Coding", "Chinese Coding", "New Pattern Coding"],
  "Blood Relation & Direction": ["Blood Relations", "Family Tree", "Direction Sense", "Distance-based Questions"],
  "Series & Miscellaneous": ["Alphanumeric Series", "Alphabet Series", "Number Series", "Ranking", "Order", "Input-Output", "Data Sufficiency", "Logical Reasoning"],
  Reading: ["Reading Comprehension", "Cloze Test", "Para Jumbles", "Paragraph Completion"],
  Grammar: ["Noun", "Pronoun", "Verb", "Adjective", "Adverb", "Articles", "Prepositions", "Conjunction", "Tenses", "Subject-Verb Agreement", "Modals", "Conditional Sentences", "Active & Passive Voice"],
  Vocabulary: ["Synonyms", "Antonyms", "One Word Substitution", "Idioms & Phrases", "Word Usage", "Vocabulary in Context"],
  "Banking English": ["Error Detection", "Sentence Improvement", "Fill in the Blanks", "Double Fillers", "Phrase Replacement", "Word Swap"],
  "Banking Basics": ["What is Banking?", "Types of Banks", "Commercial Banks", "Cooperative Banks", "Regional Rural Banks", "Payment Banks", "Small Finance Banks", "Development Banks"],
  RBI: ["Role of RBI", "Functions of RBI", "Monetary Policy", "Repo Rate", "Reverse Repo Rate", "CRR", "SLR", "Bank Rate", "MSF", "Open Market Operations"],
  "Banking Terms": ["NPA", "CASA", "KYC", "CRAR", "Basel Norms", "Financial Inclusion", "Priority Sector Lending", "Digital Banking", "NEFT", "RTGS", "IMPS", "UPI", "AEPS"],
  "Financial Awareness": ["Inflation", "GDP", "Fiscal Deficit", "Monetary Policy", "Fiscal Policy", "Budget", "Taxation", "Capital Market", "Money Market", "Bonds", "Shares", "Mutual Funds", "Insurance"],
  "General Awareness & Current Affairs": ["National Current Affairs", "International Current Affairs", "Banking News", "RBI Notifications", "Government Schemes", "Appointments", "Awards", "Sports", "Important Days", "Books & Authors", "Defence", "Summits", "Reports & Indexes", "Economic News", "Business News"],
  "Computer Basics": ["Computer Fundamentals", "Hardware", "Software", "Operating Systems", "Input/Output Devices", "Memory", "Storage"],
  "Internet & Networking": ["Internet", "WWW", "Browser", "Email", "Networking", "LAN/WAN", "IP Address", "Protocols"],
  "MS Office": ["MS Word", "MS Excel", "MS PowerPoint"],
  Security: ["Cyber Security", "Malware", "Virus", "Phishing", "Firewall", "Password Security"]
};

Object.entries(BANKING_TOPIC_DETAILS).forEach(([chapterName, subtopics]) => {
  const chapter = Object.values(BANKING_CURRICULUM).flatMap((section) => section.chapters).find((item) => item.name === chapterName);
  if (chapter) {
    chapter.topics = [{ title: `${chapterName} topic map`, subtopics }, { title: "Exam practice lab", subtopics: ["Shortcut / trick", "Important facts", "PYQs and timed revision"] }];
  }
});

const SSC_TOPIC_DETAILS = {
  "Arithmetic": ["Number System", "HCF & LCM", "Simplification", "Percentage", "Ratio & Proportion", "Average", "Profit, Loss & Discount", "Simple Interest", "Compound Interest", "Partnership", "Mixture & Alligation", "Time & Work", "Pipes & Cisterns", "Time, Speed & Distance", "Boats & Streams", "Trains"],
  "Algebra": ["Basic Algebra", "Algebraic Identities", "Linear Equations", "Quadratic Equations", "Surds & Indices", "Inequalities"],
  "Geometry": ["Lines & Angles", "Triangles", "Congruence & Similarity", "Quadrilaterals", "Polygons", "Circles", "Tangents", "Coordinate Geometry"],
  "Mensuration": ["2D Figures", "Triangle", "Quadrilateral", "Circle", "3D Figures", "Cube & Cuboid", "Cylinder", "Cone", "Sphere", "Hemisphere", "Frustum"],
  "Trigonometry": ["Trigonometric Ratios", "Standard Values", "Identities", "Heights & Distances", "Complementary Angles", "Trigonometric Equations"],
  "Data Interpretation": ["Tables", "Bar Graph", "Pie Chart", "Line Graph", "Percentage-based DI"],
  "Analogy & Classification": ["Number Analogy", "Alphabet Analogy", "Figure Analogy", "Classification", "Odd One Out"],
  "Series": ["Number Series", "Alphabet Series", "Alphanumeric Series", "Figure Series"],
  "Coding-Decoding": ["Letter Coding", "Number Coding", "Symbol Coding", "Mixed Coding"],
  "Logical Reasoning": ["Syllogism", "Statement & Conclusion", "Statement & Assumption", "Assertion & Reason", "Venn Diagram", "Ranking", "Direction Sense", "Blood Relations"],
  "Non-Verbal Reasoning": ["Mirror Image", "Water Image", "Paper Folding", "Paper Cutting", "Embedded Figures", "Figure Completion", "Counting Figures"],
  "Puzzle & Arrangement": ["Seating Arrangement", "Order & Ranking", "Calendar", "Clock", "Missing Number"],
  "Vocabulary": ["Synonyms", "Antonyms", "One Word Substitution", "Idioms & Phrases", "Spelling", "Word Usage"],
  "Grammar": ["Parts of Speech", "Noun", "Pronoun", "Adjective", "Verb", "Adverb", "Preposition", "Conjunction", "Articles", "Subject-Verb Agreement", "Tenses", "Active & Passive Voice", "Direct & Indirect Speech", "Modals", "Conditional Sentences"],
  "Comprehension": ["Reading Comprehension", "Cloze Test", "Fill in the Blanks", "Sentence Improvement", "Error Detection", "Para Jumbles", "Sentence Rearrangement"],
  "History": ["Ancient India", "Medieval India", "Modern India", "Indian Freedom Movement", "Important Dynasties", "Important Battles", "Governor Generals/Viceroys", "Important Acts"],
  "Geography": ["Physical Geography", "Indian Geography", "Rivers", "Mountains", "Soils", "Climate", "Agriculture", "Minerals", "Industries", "World Geography"],
  "Polity": ["Constitution", "Preamble", "Fundamental Rights", "Fundamental Duties", "DPSP", "President", "Vice President", "Prime Minister", "Parliament", "Supreme Court", "High Courts", "Election Commission", "Constitutional Bodies", "Panchayati Raj"],
  "Economics": ["Basic Economics", "GDP/GNP", "Inflation", "Banking", "RBI", "Monetary Policy", "Fiscal Policy", "Budget", "Taxation", "Poverty & Unemployment", "Economic Reforms"],
  "General Science": ["Motion", "Force", "Work & Energy", "Heat", "Sound", "Light", "Electricity", "Magnetism", "Atom", "Molecule", "Acids & Bases", "Metals & Non-metals", "Periodic Table", "Chemical Reactions", "Cell", "Human Body", "Diseases", "Nutrition", "Genetics", "Plants", "Ecology"],
  "Current Affairs": ["National News", "International News", "Government Schemes", "Awards", "Sports", "Appointments", "Books & Authors", "Important Days", "Defence", "Science & Technology", "Summits & Conferences"]
};

Object.entries(SSC_TOPIC_DETAILS).forEach(([chapterName, subtopics]) => {
  const chapter = SSC_CGL_CURRICULUM.Quant.chapters.concat(SSC_CGL_CURRICULUM.Reasoning.chapters, SSC_CGL_CURRICULUM.English.chapters, SSC_CGL_CURRICULUM["General Awareness"].chapters).find((item) => item.name === chapterName);
  if (chapter) {
    chapter.topics = [{ title: `${chapterName} topic map`, subtopics }, { title: "SSC CGL practice", subtopics: ["Short tricks", "Important facts", "PYQs and timed revision"] }];
  }
});

const neetGeneticsChapter = NEET_CURRICULUM.Botany.chapters.find((chapter) => chapter.name === "Principles of Inheritance & Variation");
if (neetGeneticsChapter) {
  neetGeneticsChapter.topics = [
    { title: "Principles of Inheritance", subtopics: ["Mendel's Laws", "Monohybrid Cross", "Dihybrid Cross", "Test Cross", "Back Cross", "Incomplete Dominance", "Codominance", "Multiple Alleles"] },
    { title: "Human Genetics & Variation", subtopics: ["Blood Groups", "Sex Determination", "Sex-linked Inheritance", "Pedigree Analysis", "Genetic Disorders", "NEET PYQ-type questions"] }
  ];
}

const defaultItems = [
  {
    type: "video",
    category: "JEE Main",
    title: "Limits and continuity",
    detail: "Concept explanation + examples from the chapter",
    link: "https://www.youtube.com/results?search_query=limits+and+continuity+jee+main"
  },
  {
    type: "pdf",
    category: "JEE Main",
    title: "Trigonometry formula sheet",
    detail: "Quick revision notes for formula recall",
    fileName: "trigonometry-formulas.pdf"
  },
  {
    type: "test",
    category: "JEE Main",
    title: "Rapid revision test",
    detail: "10-minute challenge with 25 questions",
    question: "If x = 2 and y = 3, what is x + y?",
    options: ["4", "5", "6", "7"],
    correct: "A"
  },
  {
    type: "video",
    category: "NEET",
    title: "Human physiology overview",
    detail: "Foundation class for biology concept clarity",
    link: "https://www.youtube.com/results?search_query=human+physiology+neet"
  },
  {
    type: "pdf",
    category: "SSC CGL",
    title: "Quant formula shortcut sheet",
    detail: "Fast calculation tricks and pattern notes",
    fileName: "quant-shortcuts.pdf"
  }
];

const savedItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || defaultItems;
const academyItems = Array.isArray(savedItems) ? savedItems : defaultItems;

function saveAcademyItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(academyItems));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

function getStudyProgress() {
  const user = getCurrentUser();
  if (!user) return { completed: {}, revisionMinutes: 0 };

  try {
    const allProgress = JSON.parse(localStorage.getItem(STUDY_KEY) || "{}");
    return allProgress[user.username || user.name] || { completed: {}, revisionMinutes: 0 };
  } catch {
    return { completed: {}, revisionMinutes: 0 };
  }
}

function saveStudyProgress(progress) {
  const user = getCurrentUser();
  if (!user) return;
  const allProgress = JSON.parse(localStorage.getItem(STUDY_KEY) || "{}");
  allProgress[user.username || user.name] = progress;
  localStorage.setItem(STUDY_KEY, JSON.stringify(allProgress));
}

function studyItemKey(item) {
  return `${item.type}:${item.category}:${item.title}`;
}

function toggleLessonComplete(item) {
  const progress = getStudyProgress();
  const key = studyItemKey(item);
  if (progress.completed[key]) {
    delete progress.completed[key];
    progress.revisionMinutes = Math.max(0, (progress.revisionMinutes || 0) - 10);
  } else {
    progress.completed[key] = { title: item.title, type: item.type, category: item.category, completedAt: Date.now() };
    progress.revisionMinutes = (progress.revisionMinutes || 0) + 10;
  }
  saveStudyProgress(progress);
  renderStudentLibrary();
  renderStudyWorkspace();
}

function ensureDefaultAccounts() {
  const defaultAccounts = [
    { username: "admin", password: "gtacademy123", role: "owner", name: "Owner" },
    { username: "student01", password: "student123", mobile: "9999999999", exam: "JEE Main", role: "student", name: "Student Demo" }
  ];

  const current = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "null");
  if (!current) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(defaultAccounts));
  }
}

function loginUser(username, password, role) {
  ensureDefaultAccounts();
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  const account = accounts.find((entry) =>
    entry.username.toLowerCase() === String(username).trim().toLowerCase() &&
    entry.password === String(password).trim() &&
    entry.role === role
  );

  if (!account) return false;
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: account.username,
    name: account.name,
    mobile: account.mobile,
    exam: account.exam || "JEE Main",
    role: account.role
  }));
  showUserWelcome();
  return true;
}

function registerStudent(name, mobile, username, password, exam) {
  ensureDefaultAccounts();
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  const normalizedUsername = String(username).trim().toLowerCase();
  const normalizedMobile = String(mobile).trim();
  const exists = accounts.some((entry) => entry.username.toLowerCase() === normalizedUsername || entry.mobile === normalizedMobile);
  if (exists) return false;

  accounts.push({
    username: String(username).trim(),
    password: String(password).trim(),
    mobile: normalizedMobile,
    exam,
    role: "student",
    name: String(name).trim()
  });
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return true;
}

function loginAccount(account) {
  localStorage.setItem(USER_KEY, JSON.stringify({
    username: account.username,
    name: account.name,
    mobile: account.mobile,
    exam: account.exam || "JEE Main",
    packageActive: Boolean(account.packageActive),
    role: account.role
  }));
}

function activateStudentPackage() {
  const user = getCurrentUser();
  if (!user || user.role !== "student") return false;
  user.packageActive = true;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  const account = accounts.find((entry) => entry.username === user.username);
  if (account) {
    account.packageActive = true;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
  return true;
}

function toIndianPhoneNumber(mobile) {
  const digits = String(mobile).replace(/\D/g, "");
  return digits.length === 10 ? `+91${digits}` : mobile;
}

async function requestOtp(mobile, purpose) {
  const response = await fetch("/api/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "request", phone: toIndianPhoneNumber(mobile), purpose })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "OTP service is not configured.");
  return result;
}

async function verifyOtp(mobile, otp) {
  const response = await fetch("/api/otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "verify", phone: toIndianPhoneNumber(mobile), code: otp })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Invalid OTP.");
  return result;
}

function findStudentByMobile(mobile) {
  ensureDefaultAccounts();
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  return accounts.find((entry) => entry.role === "student" && entry.mobile === mobile);
}

function saveStudentExam(exam) {
  const user = getCurrentUser();
  if (!user || user.role !== "student") return;
  user.exam = exam;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  const account = accounts.find((entry) => entry.username === user.username);
  if (account) {
    account.exam = exam;
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  }
}

function setCurrentUser(name, role) {
  localStorage.setItem(USER_KEY, JSON.stringify({ name, role }));
  showUserWelcome();
}

function logoutUser() {
  localStorage.removeItem(USER_KEY);
  setupSessionNavigation();
  showUserWelcome();
  window.location.href = "index.html";
}

function setupSessionNavigation() {
  const nav = document.getElementById("session-nav");
  if (!nav) return;

  const user = getCurrentUser();
  const sessionUser = nav.querySelector(".session-user");
  const sessionHome = nav.querySelector(".session-home");
  const sessionDashboard = nav.querySelector(".session-dashboard");
  const sessionLogout = nav.querySelector(".session-logout");
  const publicLinks = nav.querySelectorAll(".public-nav-link, .public-auth-link");
  const protectedLinks = nav.querySelectorAll(".protected-nav-link");

  if (!user) {
    publicLinks.forEach((link) => { link.hidden = false; });
    protectedLinks.forEach((link) => { link.hidden = false; });
    if (sessionUser) sessionUser.hidden = true;
    if (sessionHome) sessionHome.hidden = true;
    if (sessionDashboard) sessionDashboard.hidden = true;
    if (sessionLogout) sessionLogout.hidden = true;
    document.querySelectorAll(".session-dashboard, .session-user, .session-home, .session-logout").forEach((element) => {
      element.hidden = true;
    });
    return;
  }

  publicLinks.forEach((link) => { link.hidden = true; });
  protectedLinks.forEach((link) => { link.hidden = true; });
  if (sessionUser) {
    sessionUser.textContent = user.name || user.username;
    sessionUser.hidden = false;
  }
  if (sessionHome) sessionHome.hidden = false;
  if (sessionDashboard) {
    sessionDashboard.href = user.role === "owner" ? "teacher.html" : "student.html";
    sessionDashboard.textContent = user.role === "owner" ? "Content hub" : "My dashboard";
    sessionDashboard.hidden = false;
  }
  if (sessionLogout) sessionLogout.hidden = false;

  if (sessionLogout) {
    sessionLogout.addEventListener("click", () => {
      logoutUser();
    });
  }
}

function setupAuthNavigation() {
  const loginLink = document.querySelector('a[href="#auth-panel"]');
  const signupLink = document.querySelector('a[href="#signup-panel"]');
  const loginPanel = document.getElementById("auth-panel");
  const signupPanel = document.getElementById("signup-panel");
  if (!loginPanel || !signupPanel) return;

  const openPanel = (panel, otherPanel) => {
    loginPanel.hidden = panel !== loginPanel;
    signupPanel.hidden = panel !== signupPanel;
    otherPanel.hidden = true;
    panel.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  if (loginLink) loginLink.addEventListener("click", (event) => {
    event.preventDefault();
    openPanel(loginPanel, signupPanel);
  });
  if (signupLink) signupLink.addEventListener("click", (event) => {
    event.preventDefault();
    openPanel(signupPanel, loginPanel);
  });

  window.openLoginPanel = () => openPanel(loginPanel, signupPanel);
}

function showUserWelcome() {
  const welcomeEl = document.getElementById("user-welcome");
  if (!welcomeEl) return;

  const user = getCurrentUser();
  welcomeEl.innerHTML = user
    ? `<span>Welcome, ${escapeHtml(user.name || user.username)} — ${user.role === "owner" ? "Owner Dashboard" : "Student Portal"}</span><button class="logout-action" type="button">Log out</button>`
    : "No user signed in yet.";

  const logoutButton = welcomeEl.querySelector(".logout-action");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      logoutUser();
    });
  }

  const studentName = document.getElementById("student-name");
  if (studentName && user) {
    studentName.textContent = user.name || user.username;
  }

  const studentFocus = document.getElementById("student-focus");
  if (studentFocus) {
    studentFocus.textContent = currentExam || "JEE Main";
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function setupInteractiveIcons() {
  const colors = ["#e87822", "#168aad", "#9b5de5", "#1f9d73", "#e04f5f", "#d97706"];
  document.querySelectorAll("[data-icon-toggle]").forEach((card, index) => {
    const activate = () => {
      document.querySelectorAll("[data-icon-toggle].is-active").forEach((item) => {
        if (item !== card) item.classList.remove("is-active");
      });
      card.style.setProperty("--card-color", colors[index % colors.length]);
      card.classList.toggle("is-active");
    };

    card.addEventListener("click", activate);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });
}

let activeCurriculum = JEE_MAIN_CURRICULUM;
let activeCurriculumName = "JEE Main";

function renderExamInformation(examName) {
  const detail = EXAM_DETAILS[examName];
  const panel = document.getElementById("exam-information");
  if (!detail || !panel) return;

  currentExam = examName;

  document.getElementById("exam-information-title").textContent = examName;
  document.getElementById("exam-information-level").textContent = detail.level;
  document.getElementById("exam-information-summary").textContent = detail.summary;
  document.getElementById("exam-strategy").textContent = detail.strategy;

  ["subjects", "topics", "subtopics"].forEach((key) => {
    const target = document.getElementById(`exam-${key}`);
    target.innerHTML = detail[key].map((value) => `<span>${escapeHtml(value)}</span>`).join("");
  });

  const curriculum = document.getElementById("exam-curriculum");
  if (curriculum) {
    const hasCurriculum = examName === "JEE Main" || examName === "JEE Advanced" || examName === "NEET" || examName === "SSC CGL" || examName === "Banking" || examName === "UPSC";
    curriculum.hidden = !hasCurriculum;
    if (hasCurriculum) {
      activeCurriculum = curriculumCatalog[examName] || JEE_MAIN_CURRICULUM;
      activeCurriculumName = examName;
      curriculum.innerHTML = `
        <div class="curriculum-heading">
          <div><span class="detail-label">${examName.toUpperCase()} SYLLABUS MAP</span><h4>Subject → Chapter → Topic → Sub-topic → Priority</h4></div>
          <div class="curriculum-filters"><button class="curriculum-filter active" data-priority="all">All</button><button class="curriculum-filter" data-priority="high">🔴 Most important</button><button class="curriculum-filter" data-priority="medium">🟠 Important</button><button class="curriculum-filter" data-priority="low">🟢 Moderate</button></div>
        </div>
        <div class="curriculum-subjects">
          ${Object.entries(activeCurriculum).map(([subject, data]) => `
            <button type="button" class="curriculum-subject ${data.accent} ${subject === "Physics" ? "active" : ""}" data-subject="${subject}">
              <span>${data.icon}</span><strong>${subject}</strong><small>${data.summary}</small>
            </button>
          `).join("")}
        </div>
        <div id="curriculum-chapters" class="curriculum-chapters"></div>
      `;
      renderCurriculumChapters(Object.keys(activeCurriculum)[0], "all");
      curriculum.querySelectorAll("[data-subject]").forEach((button) => {
        button.addEventListener("click", () => {
          curriculum.querySelectorAll("[data-subject]").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          renderCurriculumChapters(button.dataset.subject, curriculum.querySelector(".curriculum-filter.active").dataset.priority);
        });
      });
      curriculum.querySelectorAll("[data-priority]").forEach((button) => {
        button.addEventListener("click", () => {
          curriculum.querySelectorAll("[data-priority]").forEach((item) => item.classList.remove("active"));
          button.classList.add("active");
          const activeSubject = curriculum.querySelector("[data-subject].active").dataset.subject;
          renderCurriculumChapters(activeSubject, button.dataset.priority);
        });
      });
    } else {
      curriculum.innerHTML = "";
    }
  }
  panel.hidden = false;
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function renderCurriculumChapters(subject, priority) {
  const target = document.getElementById("curriculum-chapters");
  if (!target) return;
  const chapters = activeCurriculum[subject].chapters.filter((chapter) => priority === "all" || chapter.priority === priority);
  const progress = getStudyProgress();
  progress.curriculumCompleted = progress.curriculumCompleted || {};
  progress.curriculumRevision = progress.curriculumRevision || {};
  target.innerHTML = chapters.map((chapter) => {
    const key = `${activeCurriculumName}:${subject}:${chapter.name}`;
    const completed = Boolean(progress.curriculumCompleted[key]);
    const revisionDone = Boolean(progress.curriculumRevision[key]);
    return `
    <article class="curriculum-chapter">
      <button class="curriculum-chapter-header" type="button"><strong>${activeCurriculum[subject].icon} ${escapeHtml(chapter.name)}</strong><span class="chapter-actions"><span class="priority-chip ${chapter.priority}">${chapter.priority === "high" ? "🔴 MOST IMPORTANT" : chapter.priority === "medium" ? "🟠 IMPORTANT" : "🟢 MODERATE"}</span><span class="completion-chip ${completed ? "is-complete" : ""}" data-complete-chapter="${escapeHtml(key)}">${completed ? "☑ Completed" : "☐ Completed"}</span><span class="revision-chip ${revisionDone ? "is-revised" : ""}" data-revision-chapter="${escapeHtml(key)}">${revisionDone ? "🔄 Revision done" : "🔄 Revision"}</span></span></button>
      <div class="curriculum-topics">
        ${chapter.topics.map((topic) => `<div class="curriculum-topic"><div class="topic-action-row"><button class="topic-open" type="button" data-topic-name="${escapeHtml(topic.title)}" data-chapter-name="${escapeHtml(chapter.name)}" data-subject-name="${escapeHtml(subject)}">${escapeHtml(topic.title)}</button><button class="topic-test" type="button" data-topic-name="${escapeHtml(topic.title)}" data-chapter-name="${escapeHtml(chapter.name)}" data-subject-name="${escapeHtml(subject)}">Test ₹${activeCurriculum[subject].testPrice ?? 20}</button></div><ul>${topic.subtopics.map((subtopic) => `<li>${escapeHtml(subtopic)} <span class="topic-star">★</span></li>`).join("")}</ul></div>`).join("")}
      </div>
    </article>
  `;
  }).join("");
  target.querySelectorAll(".curriculum-chapter-header").forEach((button) => {
    button.addEventListener("click", () => button.nextElementSibling.classList.toggle("open"));
  });
  target.querySelectorAll("[data-complete-chapter]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const currentProgress = getStudyProgress();
      currentProgress.curriculumCompleted = currentProgress.curriculumCompleted || {};
      const key = button.dataset.completeChapter;
      currentProgress.curriculumCompleted[key] = !currentProgress.curriculumCompleted[key];
      saveStudyProgress(currentProgress);
      renderCurriculumChapters(subject, priority);
    });
  });
  target.querySelectorAll("[data-revision-chapter]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const currentProgress = getStudyProgress();
      currentProgress.curriculumRevision = currentProgress.curriculumRevision || {};
      const key = button.dataset.revisionChapter;
      currentProgress.curriculumRevision[key] = !currentProgress.curriculumRevision[key];
      saveStudyProgress(currentProgress);
      renderCurriculumChapters(subject, priority);
    });
  });
  target.querySelectorAll(".topic-open").forEach((button) => {
    button.addEventListener("click", () => {
      const chapter = activeCurriculum[button.dataset.subjectName].chapters.find((item) => item.name === button.dataset.chapterName);
      const topic = chapter?.topics.find((item) => item.title === button.dataset.topicName);
      if (topic) openTopicContent(topic, chapter.name, button.dataset.subjectName);
    });
  });
  target.querySelectorAll(".topic-test").forEach((button) => {
    button.addEventListener("click", () => {
      const user = getCurrentUser();
      if (!user || user.role !== "student") {
        alert("Please log in as a student before starting a topic test.");
        return;
      }
      const chapter = activeCurriculum[button.dataset.subjectName].chapters.find((item) => item.name === button.dataset.chapterName);
      const topic = chapter?.topics.find((item) => item.title === button.dataset.topicName);
      const topicPaper = academyItems.find((item) => item.type === "test" && item.category === activeCurriculumName && item.topic === topic?.title);
      if (!topicPaper) {
        alert("Admin has not published a test paper for this topic yet.");
        return;
      }
      if (topic) openMockTest({ title: topic.title, topic: topic.title, price: activeCurriculum[button.dataset.subjectName].testPrice ?? 20 });
    });
  });
}

function curriculumTopicText(chapter) {
  return (chapter.topics || []).map((topic) => `${topic.title}|${(topic.subtopics || []).join(", ")}`).join("\n");
}

function renderCurriculumEditorSubjects() {
  const examSelect = document.getElementById("curriculum-exam");
  const subjectSelect = document.getElementById("curriculum-subject");
  if (!examSelect || !subjectSelect) return;

  const exam = examSelect.value;
  subjectSelect.innerHTML = Object.keys(curriculumCatalog[exam] || {}).map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`).join("");
  const priceInput = document.getElementById("curriculum-test-price");
  if (priceInput) priceInput.value = curriculumCatalog[exam]?.[subjectSelect.value]?.testPrice ?? 20;
  const paymentSettings = getPaymentSettings();
  const upiInput = document.getElementById("admin-upi-id");
  const qrInput = document.getElementById("admin-qr-url");
  if (upiInput) upiInput.value = paymentSettings.upiId;
  if (qrInput) qrInput.value = paymentSettings.qrUrl;
  renderCurriculumEditorList();
}

function renderCurriculumEditorList() {
  const examSelect = document.getElementById("curriculum-exam");
  const subjectSelect = document.getElementById("curriculum-subject");
  const list = document.getElementById("curriculum-editor-list");
  if (!examSelect || !subjectSelect || !list) return;

  const chapters = curriculumCatalog[examSelect.value]?.[subjectSelect.value]?.chapters || [];
  list.innerHTML = chapters.map((chapter, index) => `
    <article class="editor-chapter" data-editor-index="${index}">
      <div class="editor-chapter-head"><strong>Chapter ${index + 1}</strong><button class="editor-remove" type="button" data-remove-chapter="${index}">Remove</button></div>
      <div class="editor-grid">
        <input class="editor-chapter-name" value="${escapeHtml(chapter.name)}" placeholder="Chapter name" />
        <select class="editor-priority"><option value="high" ${chapter.priority === "high" ? "selected" : ""}>Most important</option><option value="medium" ${chapter.priority === "medium" ? "selected" : ""}>Important</option><option value="low" ${chapter.priority === "low" ? "selected" : ""}>Moderate</option></select>
      </div>
      <label>Topics and sub-topics</label>
      <textarea class="editor-topics" rows="4" placeholder="Topic name|Sub-topic 1, Sub-topic 2">${escapeHtml(curriculumTopicText(chapter))}</textarea>
      <small>One line per topic: <strong>Topic name|sub-topic 1, sub-topic 2</strong></small>
    </article>
  `).join("") || '<div class="empty-note">No chapters yet. Add the first chapter.</div>';

  list.querySelectorAll("[data-remove-chapter]").forEach((button) => {
    button.addEventListener("click", () => {
      const chapters = curriculumCatalog[examSelect.value][subjectSelect.value].chapters;
      chapters.splice(Number(button.dataset.removeChapter), 1);
      renderCurriculumEditorList();
    });
  });
}

function setupCurriculumEditor() {
  const examSelect = document.getElementById("curriculum-exam");
  const subjectSelect = document.getElementById("curriculum-subject");
  const addButton = document.getElementById("add-curriculum-chapter");
  const saveButton = document.getElementById("save-curriculum");
  const status = document.getElementById("curriculum-editor-status");
  if (!examSelect || !subjectSelect || !addButton || !saveButton) return;

  examSelect.innerHTML = Object.keys(curriculumCatalog).map((exam) => `<option value="${escapeHtml(exam)}">${escapeHtml(exam)}</option>`).join("");
  renderCurriculumEditorSubjects();
  examSelect.addEventListener("change", renderCurriculumEditorSubjects);
  subjectSelect.addEventListener("change", () => {
    const priceInput = document.getElementById("curriculum-test-price");
    if (priceInput) priceInput.value = curriculumCatalog[examSelect.value]?.[subjectSelect.value]?.testPrice ?? 20;
    renderCurriculumEditorList();
  });

  addButton.addEventListener("click", () => {
    curriculumCatalog[examSelect.value][subjectSelect.value].chapters.push({
      name: "New chapter",
      priority: "medium",
      topics: [{ title: "New topic", subtopics: ["New sub-topic"] }]
    });
    renderCurriculumEditorList();
  });

  saveButton.addEventListener("click", () => {
    const chapters = curriculumCatalog[examSelect.value][subjectSelect.value].chapters;
    const priceInput = document.getElementById("curriculum-test-price");
    document.querySelectorAll("#curriculum-editor-list .editor-chapter").forEach((row, index) => {
      const topics = row.querySelector(".editor-topics").value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
        const [title, subtopicText = ""] = line.split("|");
        return { title: title.trim(), subtopics: subtopicText.split(",").map((item) => item.trim()).filter(Boolean) };
      });
      chapters[index] = { name: row.querySelector(".editor-chapter-name").value.trim() || "Untitled chapter", priority: row.querySelector(".editor-priority").value, topics };
    });
    curriculumCatalog[examSelect.value][subjectSelect.value].testPrice = Math.max(0, Number(priceInput?.value || 20));
    saveCurriculumCatalog();
    savePaymentSettings({
      upiId: document.getElementById("admin-upi-id")?.value.trim() || "academy@upi",
      qrUrl: document.getElementById("admin-qr-url")?.value.trim() || ""
    });
    renderCurriculumEditorList();
    if (status) status.textContent = "Curriculum saved. Students will see the updated chapters, topics, and sub-topics.";
  });
}

function setupExamExplorer() {
  const dropdown = document.getElementById("exam-dropdown");
  const trigger = document.querySelector(".exam-menu-trigger");
  if (!dropdown || !trigger) return;

  dropdown.innerHTML = EXAM_OPTIONS.map((exam) => `<button type="button" role="menuitem" data-exam-name="${escapeHtml(exam)}">${escapeHtml(exam)}</button>`).join("");
  const selectExam = (exam) => {
    renderExamInformation(exam);
    trigger.setAttribute("aria-expanded", "false");
  };

  trigger.addEventListener("click", () => {
    const open = trigger.getAttribute("aria-expanded") === "true";
    trigger.setAttribute("aria-expanded", String(!open));
  });

  dropdown.querySelectorAll("[data-exam-name]").forEach((button) => {
    button.addEventListener("click", () => selectExam(button.dataset.examName));
  });

  document.querySelectorAll(".exam-card").forEach((card, index) => {
    card.addEventListener("click", () => renderExamInformation(EXAM_OPTIONS[index]));
  });
}

function setupPaymentFlow() {
  const payButton = document.getElementById("pay-package");
  const modal = document.getElementById("payment-modal");
  const closeButton = document.getElementById("close-payment");
  const confirmButton = document.getElementById("confirm-payment");
  const qrImage = document.getElementById("payment-qr");
  const upiText = document.getElementById("payment-upi");
  const status = document.getElementById("student-access-status");
  if (!payButton || !modal || !confirmButton) return;

  const settings = getPaymentSettings();
  const upiUri = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=GT%20Academy&am=4000&cu=INR`;
  if (qrImage) qrImage.src = settings.qrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiUri)}`;
  if (upiText) upiText.textContent = settings.upiId;
  if (isPackageActive() && status) {
    status.textContent = "PACKAGE ACTIVE";
    status.classList.add("is-paid");
    payButton.textContent = "Package active";
    payButton.disabled = true;
  }

  payButton.addEventListener("click", () => {
    if (!getCurrentUser() || getCurrentUser().role !== "student") {
      alert("Please log in as a student before paying.");
      return;
    }
    modal.hidden = false;
  });
  closeButton?.addEventListener("click", () => { modal.hidden = true; });
  confirmButton.addEventListener("click", () => {
    activateStudentPackage();
    modal.hidden = true;
    if (status) {
      status.textContent = "PACKAGE ACTIVE";
      status.classList.add("is-paid");
    }
    payButton.textContent = "Package active";
    payButton.disabled = true;
    alert("Payment confirmed. Your GT Academy package is active now.");
  });
}

function typeBadge(type) {
  return {
    video: "Video",
    pdf: "PDF",
    test: "Test"
  }[type] || "Item";
}

function updateProgressStats() {
  const videoCount = document.getElementById("stat-videos");
  const pdfCount = document.getElementById("stat-pdfs");
  const testCount = document.getElementById("stat-tests");

  if (!videoCount || !pdfCount || !testCount) return;

  videoCount.textContent = academyItems.filter((item) => item.type === "video").length;
  pdfCount.textContent = academyItems.filter((item) => item.type === "pdf").length;
  testCount.textContent = academyItems.filter((item) => item.type === "test").length;
}

function updateOwnerDashboard() {
  const videoCount = document.getElementById("owner-video-count");
  const pdfCount = document.getElementById("owner-pdf-count");
  const testCount = document.getElementById("owner-test-count");
  const studentCount = document.getElementById("owner-student-count");
  const studentsList = document.getElementById("owner-students");
  const activityList = document.getElementById("owner-activity");

  if (videoCount) videoCount.textContent = academyItems.filter((item) => item.type === "video").length;
  if (pdfCount) pdfCount.textContent = academyItems.filter((item) => item.type === "pdf").length;
  if (testCount) testCount.textContent = academyItems.filter((item) => item.type === "test").length;

  if (studentCount) {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    const students = accounts.filter((entry) => entry.role === "student");
    studentCount.textContent = students.length;
  }

  if (studentsList) {
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
    const students = accounts.filter((entry) => entry.role === "student");
    studentsList.innerHTML = students.length
      ? students.map((student) => `
        <div class="mini-item">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <span>${escapeHtml(student.username)}</span>
          </div>
          <span class="count-pill">${escapeHtml(student.role)}</span>
        </div>
      `).join("")
      : '<div class="empty-note">No students registered yet.</div>';
  }

  if (activityList) {
    const recent = academyItems.slice(0, 4);
    activityList.innerHTML = recent.map((item) => `
      <div class="mini-item">
        <div>
          <strong>${escapeHtml(item.title)}</strong>
          <span>${escapeHtml(item.type)} · ${escapeHtml(item.category)}</span>
        </div>
      </div>
    `).join("");
  }
}

function renderTeacherLibrary() {
  const list = document.getElementById("teacher-library");
  const count = document.getElementById("library-count");
  if (!list || !count) return;

  count.textContent = `${academyItems.length} items`;
  list.innerHTML = academyItems.length
    ? academyItems.map((item) => `
      <article class="lesson-card ${item.type}">
        <div class="lesson-top">
          <span class="lesson-type">${typeBadge(item.type)}</span>
          <span class="count-pill">${escapeHtml(item.category)}</span>
        </div>
        <div>
          <h4>${escapeHtml(item.title)}</h4>
          <div class="lesson-meta">${escapeHtml(item.detail || item.question || "Prepared for students")}</div>
        </div>
        <div class="card-actions">
          ${item.type === "video" ? `<a class="link-button primary" href="${escapeHtml(item.link || '#')}" target="_blank" rel="noreferrer">Open video</a>` : ""}
          ${item.type === "pdf" ? `<a class="link-button primary" href="#" onclick="return false;">Open PDF</a>` : ""}
          ${item.type === "test" ? `<button class="link-button primary" type="button">Preview test</button>` : ""}
        </div>
      </article>
    `).join("")
    : '<div class="empty-note">No content saved yet.</div>';

  updateProgressStats();
  updateOwnerDashboard();
}

function selectedExamItems() {
  return academyItems.filter((item) => item.category === currentExam);
}

let currentExam = (getCurrentUser() && getCurrentUser().exam) || "JEE Main";

function renderExamFilters() {
  const filters = document.getElementById("exam-filters");
  if (!filters) return;

  filters.innerHTML = EXAM_OPTIONS.map((exam) => `
    <button type="button" class="filter-pill ${exam === currentExam ? "active" : ""}" data-exam="${exam}">${exam}</button>
  `).join("");

  filters.querySelectorAll(".filter-pill").forEach((button) => {
    button.addEventListener("click", () => {
      currentExam = button.dataset.exam;
      saveStudentExam(currentExam);
      renderExamFilters();
      renderStudentLibrary();
    });
  });
}

function renderStudentLibrary() {
  const list = document.getElementById("student-library");
  const examTitle = document.getElementById("selected-exam-title");
  if (!list || !examTitle) return;

  examTitle.textContent = currentExam;
  const filtered = selectedExamItems();
  const progress = getStudyProgress();

  if (!filtered.length) {
    list.innerHTML = '<div class="empty-note">This exam has no content yet. Add a lecture, PDF, or test from the teacher studio.</div>';
    return;
  }

  list.innerHTML = filtered.map((item, index) => `
    <article class="lesson-card ${item.type}">
      <div class="lesson-top">
        <span class="lesson-type">${typeBadge(item.type)}</span>
        <span class="count-pill">${escapeHtml(item.category)}</span>
      </div>
      <div>
        <h4>${escapeHtml(item.title)}</h4>
        <div class="lesson-meta">${escapeHtml(item.detail || item.question || "Prepared for practice")}</div>
      </div>
      <div class="card-actions">
        ${item.type === "video" ? `<a class="link-button primary" href="${escapeHtml(item.link || '#')}" target="_blank" rel="noreferrer">Watch video</a>` : ""}
        ${item.type === "pdf" ? `<button class="link-button" type="button" data-material-index="${index}">View notes</button>` : ""}
        ${item.type === "test" ? `<button class="link-button primary" type="button" data-test-index="${index}">Start mock test</button>` : ""}
        <button class="complete-toggle ${progress.completed[studyItemKey(item)] ? "is-complete" : ""}" type="button" data-complete-index="${index}">${progress.completed[studyItemKey(item)] ? "Completed" : "Mark complete"}</button>
      </div>
    </article>
  `).join("");

  list.querySelectorAll("[data-test-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const idx = Number(button.dataset.testIndex);
      const match = filtered[idx];
      if (match) openMockTest(match);
    });
  });

  list.querySelectorAll("[data-material-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = filtered[Number(button.dataset.materialIndex)];
      if (item) alert(`${item.title}\n\n${item.detail || "Study material"}\n\nFile: ${item.fileName || "Online notes"}`);
    });
  });

  list.querySelectorAll("[data-complete-index]").forEach((button) => {
    button.addEventListener("click", () => toggleLessonComplete(filtered[Number(button.dataset.completeIndex)]));
  });

  const studentFocus = document.getElementById("student-focus");
  if (studentFocus) studentFocus.textContent = currentExam;

  updateProgressStats();
  renderStudyWorkspace();
}

function renderStudyWorkspace() {
  const completedList = document.getElementById("completed-lessons");
  const materialsList = document.getElementById("study-materials");
  const completedCount = document.getElementById("completed-count");
  const revisionMinutes = document.getElementById("revision-minutes");
  const remainingCount = document.getElementById("remaining-count");
  const progressBar = document.getElementById("study-progress-bar");
  const progressLabel = document.getElementById("study-progress-label");
  const greeting = document.getElementById("study-greeting");
  if (!completedList || !materialsList) return;

  const progress = getStudyProgress();
  const completed = Object.values(progress.completed);
  const materials = academyItems.filter((item) => item.type === "pdf" || item.type === "video").slice(0, 5);
  const completionPercent = academyItems.length ? Math.round((completed.length / academyItems.length) * 100) : 0;

  if (greeting) {
    const user = getCurrentUser();
    greeting.textContent = user ? `${user.name || user.username}'s preparation` : "Your preparation, organized.";
  }
  if (completedCount) completedCount.textContent = completed.length;
  if (revisionMinutes) revisionMinutes.textContent = `${progress.revisionMinutes || 0}m`;
  if (remainingCount) remainingCount.textContent = Math.max(academyItems.length - completed.length, 0);
  if (progressBar) progressBar.style.width = `${completionPercent}%`;
  if (progressLabel) progressLabel.textContent = completed.length ? `${completionPercent}% of your library completed. Keep your momentum going.` : "Complete a lesson to start building your progress.";

  completedList.innerHTML = completed.length
    ? completed.slice().reverse().map((item) => `<div class="workspace-row"><span class="workspace-icon">DONE</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.type)} · ${escapeHtml(item.category)}</small></div></div>`).join("")
    : '<div class="empty-note">Your completed lectures and tests will appear here.</div>';

  materialsList.innerHTML = materials.length
    ? materials.map((item) => `<div class="workspace-row"><span class="workspace-icon ${item.type}">${typeBadge(item.type)}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail || "Ready to study online")}</small></div></div>`).join("")
    : '<div class="empty-note">Study material will appear here when the teacher adds it.</div>';
}

function addAcademyItem(item) {
  academyItems.unshift(item);
  saveAcademyItems();
  renderTeacherLibrary();
  renderStudentLibrary();
}

function handleVideoForm(event) {
  event.preventDefault();
  const form = document.getElementById("video-form");
  if (!form) return;
  const title = document.getElementById("video-title").value.trim();
  const link = document.getElementById("video-link").value.trim();
  const category = document.getElementById("video-category").value;

  if (!title || !link) return;
  addAcademyItem({
    type: "video",
    category,
    title,
    detail: "YouTube lecture added to your GT Academy library",
    link
  });
  form.reset();
}

function handlePdfForm(event) {
  event.preventDefault();
  const form = document.getElementById("pdf-form");
  if (!form) return;
  const title = document.getElementById("pdf-title").value.trim();
  const fileName = document.getElementById("pdf-name").value.trim();
  const category = document.getElementById("pdf-category").value;

  if (!title || !fileName) return;
  addAcademyItem({
    type: "pdf",
    category,
    title,
    detail: `Lecture notes for revision and practice`,
    fileName
  });
  form.reset();
}

function handleTestForm(event) {
  event.preventDefault();
  const form = document.getElementById("test-form");
  if (!form) return;
  const category = document.getElementById("test-category").value;
  const subject = document.getElementById("test-subject").value.trim();
  const chapter = document.getElementById("test-chapter").value.trim();
  const topic = document.getElementById("test-topic").value.trim();
  const title = document.getElementById("test-title").value.trim();
  const question = document.getElementById("test-question").value.trim();
  const options = [
    document.getElementById("test-option-a").value.trim(),
    document.getElementById("test-option-b").value.trim(),
    document.getElementById("test-option-c").value.trim(),
    document.getElementById("test-option-d").value.trim(),
  ];
  const correct = document.getElementById("test-correct").value;

  if (!title || !subject || !chapter || !topic || !question || options.some((opt) => !opt)) return;
  addAcademyItem({
    type: "test",
    category,
    subject,
    chapter,
    topic,
    title,
    detail: "Mock test for exam practice",
    question,
    options,
    correct
  });
  form.reset();
}

const videoForm = document.getElementById("video-form");
const pdfForm = document.getElementById("pdf-form");
const testForm = document.getElementById("test-form");

if (videoForm) videoForm.addEventListener("submit", handleVideoForm);
if (pdfForm) pdfForm.addEventListener("submit", handlePdfForm);
if (testForm) testForm.addEventListener("submit", handleTestForm);

const authForm = document.getElementById("auth-form");
if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.getElementById("user-name").value.trim();
    const password = document.getElementById("user-password").value.trim();
    const role = document.getElementById("user-role").value;
    if (!username || !password) return;

    const loginOk = loginUser(username, password, role);
    if (!loginOk) {
      alert("Invalid login. Use the correct username and password for the selected role.");
      return;
    }

    window.location.href = role === "owner" ? "teacher.html" : "student.html";
  });
}

const mobileLoginForm = document.getElementById("mobile-login-form");
const mobileVerifyForm = document.getElementById("mobile-verify-form");
const mobileLoginStatus = document.getElementById("mobile-login-status");

if (mobileLoginForm) {
  mobileLoginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const mobile = document.getElementById("login-mobile").value.trim();
    const account = findStudentByMobile(mobile);
    if (!account) {
      if (mobileLoginStatus) mobileLoginStatus.textContent = "No student account found for this mobile number.";
      return;
    }

    requestOtp(mobile, "login")
      .then(() => {
        pendingMobileLogin = { account, mobile };
        mobileVerifyForm.hidden = false;
        if (mobileLoginStatus) mobileLoginStatus.textContent = "OTP sent. Check your phone and enter it below.";
      })
      .catch((error) => {
        if (mobileLoginStatus) mobileLoginStatus.textContent = error.message;
      });
  });
}

if (mobileVerifyForm) {
  mobileVerifyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const enteredOtp = document.getElementById("login-otp").value.trim();
    if (!pendingMobileLogin) {
      if (mobileLoginStatus) mobileLoginStatus.textContent = "Request an OTP first.";
      return;
    }
    verifyOtp(pendingMobileLogin.mobile, enteredOtp)
      .then(() => {
        loginAccount(pendingMobileLogin.account);
        window.location.href = "student.html";
      })
      .catch((error) => {
        if (mobileLoginStatus) mobileLoginStatus.textContent = error.message;
      });
  });
}

const signupForm = document.getElementById("signup-form");
const signupVerifyForm = document.getElementById("signup-verify-form");
const signupStatus = document.getElementById("signup-status");
if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("signup-name").value.trim();
    const mobile = document.getElementById("signup-mobile").value.trim();
    const username = document.getElementById("signup-username").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const exam = document.getElementById("signup-exam").value;
    if (!name || !mobile || !username || !exam || password.length < 6) return;

    if (!/^[0-9]{10}$/.test(mobile)) {
      if (signupStatus) signupStatus.textContent = "Enter a valid 10-digit mobile number.";
      return;
    }

    requestOtp(mobile, "signup")
      .then(() => {
        pendingSignup = { name, mobile, username, password, exam };
        signupVerifyForm.hidden = false;
        if (signupStatus) signupStatus.textContent = "OTP sent. Check your phone and enter it below.";
      })
      .catch((error) => {
        if (signupStatus) signupStatus.textContent = error.message;
      });
  });
}

if (signupVerifyForm) {
  signupVerifyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const enteredOtp = document.getElementById("signup-otp").value.trim();
    if (!pendingSignup) {
      if (signupStatus) signupStatus.textContent = "Request an OTP first.";
      return;
    }

    verifyOtp(pendingSignup.mobile, enteredOtp).catch((error) => {
      if (signupStatus) signupStatus.textContent = error.message;
    }).then((verified) => {
      if (!verified) return;

      if (!registerStudent(pendingSignup.name, pendingSignup.mobile, pendingSignup.username, pendingSignup.password, pendingSignup.exam)) {
        if (signupStatus) signupStatus.textContent = "Username or mobile number is already registered.";
        return;
      }

      if (signupStatus) signupStatus.textContent = "Mobile verified. Account created. You can now log in.";
      signupForm.reset();
      signupVerifyForm.hidden = true;
      pendingSignup = null;
      if (window.openLoginPanel) window.openLoginPanel();
    });
  });
}

function redirectIfNotAuthorized() {
  const user = getCurrentUser();
  const pageRole = document.body.dataset.role;

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (pageRole && user.role !== pageRole) {
    window.location.href = user.role === "owner" ? "teacher.html" : "student.html";
  }
}

if (document.body.dataset.role) {
  redirectIfNotAuthorized();
}

function generateMockQuestions(examName, topicName) {
  const examTests = academyItems.filter((item) => item.type === "test" && item.category === examName && (!topicName || item.topic === topicName));
  const prepared = examTests.length ? examTests : [{
    question: `Practice question for ${examName}: Which option is the most accurate answer?`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct: "A"
  }];

  const finalQuestions = [];
  for (let i = 0; i < 25; i++) {
    const source = prepared[i % prepared.length];
    finalQuestions.push({
      question: source.question || `Question ${i + 1}: Solve the concept in ${examName}.`,
      options: source.options || ["Option A", "Option B", "Option C", "Option D"],
      correct: source.correct || "A"
    });
  }
  return finalQuestions;
}

let mockQuestions = [];
let currentQuestionIndex = 0;
let selectedAnswers = {};
let timerInterval = null;
let remainingSeconds = 600;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    const timerText = document.getElementById("timer-text");
    if (timerText) timerText.textContent = formatTime(Math.max(remainingSeconds, 0));

    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      finishMockTest();
    }
  }, 1000);
}

function openTopicContent(topic, chapterName, subjectName) {
  let modal = document.getElementById("topic-content-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "topic-content-modal";
    modal.className = "topic-content-modal";
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <article class="topic-content-card">
      <button class="topic-content-close" type="button" aria-label="Close topic content">×</button>
      <span class="eyebrow">${escapeHtml(subjectName)} · ${escapeHtml(chapterName)}</span>
      <h2>${escapeHtml(topic.title)}</h2>
      <p class="topic-explanation">This topic includes a focused explanation, important facts, examples, and exam-style practice for ${escapeHtml(subjectName)} preparation.</p>
      <div class="topic-content-columns">
        <div><strong>Key content</strong><ul>${topic.subtopics.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>
        <div><strong>Practice path</strong><ul><li>Read the concept explanation</li><li>Review important formulae and facts</li><li>Solve PYQ-type questions</li><li>Mark the topic complete after revision</li></ul></div>
      </div>
      <div class="topic-content-footer"><span>📝 PYQ practice included</span><span>🔄 Revision ready</span></div>
    </article>
  `;
  modal.classList.add("is-open");
  modal.querySelector(".topic-content-close").addEventListener("click", () => modal.classList.remove("is-open"));
  modal.addEventListener("click", (event) => {
    if (event.target === modal) modal.classList.remove("is-open");
  }, { once: true });
}

function openMockTest(testItem) {
  const modal = document.getElementById("mock-test-modal");
  if (!modal) return;

  const progress = getStudyProgress();
  const attempts = progress.testAttempts || 0;
  const testPrice = testItem?.price ?? activeCurriculum?.[Object.keys(activeCurriculum)[0]]?.testPrice ?? 20;
  if (testItem?.topic && !isPackageActive()) {
    alert(`Please complete the ₹${testPrice} package payment before taking this topic test.`);
    return;
  }
  if (attempts >= 3 && !isPackageActive()) {
    alert(`Your 3 demo tests are complete. This test costs ₹${testPrice}. The full study package is ₹4,000.`);
    return;
  }
  progress.testAttempts = attempts + 1;
  saveStudyProgress(progress);

  mockQuestions = generateMockQuestions(currentExam, testItem?.topic);
  currentQuestionIndex = 0;
  selectedAnswers = {};
  remainingSeconds = 600;
  const mockTestName = document.getElementById("mock-test-name");
  if (mockTestName) mockTestName.textContent = testItem?.title ? `${testItem.title} · ₹${testPrice}` : "GT Academy Test";
  const timerText = document.getElementById("timer-text");
  if (timerText) timerText.textContent = formatTime(remainingSeconds);

  modal.classList.remove("hidden");
  renderMockQuestion();
  startTimer();
}

function closeMockTest() {
  const modal = document.getElementById("mock-test-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

function renderMockQuestion() {
  const questionBox = document.getElementById("mock-question-box");
  const optionList = document.getElementById("mock-options");
  const questionCount = document.getElementById("question-count");
  const prevButton = document.getElementById("prev-question");
  const nextButton = document.getElementById("next-question");

  if (!questionBox || !optionList || !questionCount) return;

  const question = mockQuestions[currentQuestionIndex];
  if (!question) return;

  questionBox.textContent = `${currentQuestionIndex + 1}. ${question.question}`;
  questionCount.textContent = `Question ${currentQuestionIndex + 1}/25`;

  optionList.innerHTML = question.options.map((option, idx) => {
    const optionKey = String.fromCharCode(65 + idx);
    const selected = selectedAnswers[currentQuestionIndex] === optionKey;
    return `<button type="button" class="option ${selected ? "selected" : ""}" data-option-key="${optionKey}">${optionKey}. ${option}</button>`;
  }).join("");

  optionList.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.optionKey;
      selectedAnswers[currentQuestionIndex] = key;
      renderMockQuestion();
    });
  });

  prevButton.disabled = currentQuestionIndex === 0;
  nextButton.textContent = currentQuestionIndex === mockQuestions.length - 1 ? "Finish" : "Next";
}

function showResultSummary() {
  const modal = document.getElementById("result-modal");
  const resultSummary = document.getElementById("result-summary");
  if (!modal || !resultSummary) return;

  const total = mockQuestions.length;
  let score = 0;

  mockQuestions.forEach((question, idx) => {
    if (selectedAnswers[idx] === question.correct) score += 1;
  });

  const percentage = Math.round((score / total) * 100);
  resultSummary.innerHTML = `
    <div class="stat-item"><strong>${score}/${total}</strong><span>Score</span></div>
    <div class="stat-item"><strong>${percentage}%</strong><span>Accuracy</span></div>
    <p>You answered ${score} questions correctly out of ${total}. Review your answers and try again for a better score.</p>
  `;

  modal.classList.remove("hidden");
}

function finishMockTest() {
  closeMockTest();
  showResultSummary();
}

function handleQuestionNavigation(direction) {
  if (direction === "next") {
    if (currentQuestionIndex === mockQuestions.length - 1) {
      finishMockTest();
      return;
    }
    currentQuestionIndex += 1;
  } else {
    currentQuestionIndex = Math.max(0, currentQuestionIndex - 1);
  }
  renderMockQuestion();
}

const startMockButton = document.getElementById("start-mock-test");
const closeMockButton = document.getElementById("close-mock-test");
const prevQuestionButton = document.getElementById("prev-question");
const nextQuestionButton = document.getElementById("next-question");
const closeResultModal = document.getElementById("close-result-modal");
const closeResultButton = document.getElementById("close-result");
const retakeTestButton = document.getElementById("retake-test");

if (startMockButton) {
  startMockButton.addEventListener("click", () => openMockTest());
}

if (closeMockButton) {
  closeMockButton.addEventListener("click", closeMockTest);
}

if (closeResultModal) {
  closeResultModal.addEventListener("click", () => {
    document.getElementById("result-modal").classList.add("hidden");
  });
}

if (closeResultButton) {
  closeResultButton.addEventListener("click", () => {
    document.getElementById("result-modal").classList.add("hidden");
  });
}

if (retakeTestButton) {
  retakeTestButton.addEventListener("click", () => {
    document.getElementById("result-modal").classList.add("hidden");
    openMockTest();
  });
}

if (prevQuestionButton) {
  prevQuestionButton.addEventListener("click", () => handleQuestionNavigation("prev"));
}

if (nextQuestionButton) {
  nextQuestionButton.addEventListener("click", () => handleQuestionNavigation("next"));
}

setupInteractiveIcons();
setupExamExplorer();
setupCurriculumEditor();
setupPaymentFlow();
setupSessionNavigation();
setupAuthNavigation();
showUserWelcome();
renderTeacherLibrary();
renderExamFilters();
renderStudentLibrary();

