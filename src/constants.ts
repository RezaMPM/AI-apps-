import { FastingProtocol, FastingStage, Medal } from './types';

export const FASTING_PROTOCOLS: FastingProtocol[] = [
  {
    id: '12:12',
    name: '12:12 Circadian',
    fastingHours: 12,
    eatingHours: 12,
    difficulty: 'Beginner',
    summary: 'Gentle baseline aligning with natural daylight and digestive rest.',
    bestFor: 'First-time fasters, anyone building regular daily routine.'
  },
  {
    id: '14:10',
    name: '14:10 Starter',
    fastingHours: 14,
    eatingHours: 10,
    difficulty: 'Beginner',
    summary: 'A step up from 12:12 with comfortable evening cutoff.',
    bestFor: 'Beginners easing into standard intermittent fasting without missing meals.'
  },
  {
    id: '16:8',
    name: '16:8 Leangains',
    fastingHours: 16,
    eatingHours: 8,
    difficulty: 'Intermediate',
    summary: 'The gold standard intermittent fasting protocol used by millions worldwide.',
    bestFor: 'Fat burning, steady metabolic health, and easily skipping breakfast.'
  },
  {
    id: '18:6',
    name: '18:6 Elevated',
    fastingHours: 18,
    eatingHours: 6,
    difficulty: 'Advanced',
    summary: 'Extended fat oxidation and early cellular cleanup / autophagy stage.',
    bestFor: 'Experienced fasters wanting deeper ketosis and sharper focus.'
  },
  {
    id: '20:4',
    name: '20:4 Warrior Diet',
    fastingHours: 20,
    eatingHours: 4,
    difficulty: 'Advanced',
    summary: '20 hours fasting with a condensed 4-hour eating feast window.',
    bestFor: 'Targeted insulin reset, peak mental drive, and busy workdays.'
  },
  {
    id: '23:1',
    name: 'OMAD (23:1)',
    fastingHours: 23,
    eatingHours: 1,
    difficulty: 'Expert',
    summary: 'One Meal A Day. Deep autophagy, peak hormone balance, maximal simplicity.',
    bestFor: 'Advanced practitioners seeking maximal discipline and deep cellular renewal.'
  }
];

export const FASTING_STAGES: FastingStage[] = [
  {
    hours: 0,
    endHours: 4,
    phaseNumber: 1,
    title: 'Fed & Early Digestion',
    scientificName: 'Postprandial Glycemic & Anabolic State',
    description: 'Your digestive tract processes macronutrients into glucose, amino acids, and free fatty acids.',
    scientificExplanation:
      'Following food consumption, systemic blood glucose rises, stimulating pancreatic beta cells to release insulin. Elevated insulin stimulates the anabolic mTOR (mechanistic target of rapamycin) signaling cascade, driving cellular protein synthesis and glycogen assembly in liver and muscle tissue via glycogen synthase. Autophagy and lipolysis are strongly suppressed as the body resides in a nutrient-rich, growth-oriented state.',
    benefit: 'Active nutrient absorption & energy replenishment',
    color: 'from-amber-500 to-amber-600',
    ringColor: '#f59e0b',
    hormoneEffects: {
      insulin: 'Elevated / Spiking to store nutrients',
      glucagon: 'Suppressed by pancreatic beta cells',
      growthHormone: 'Suppressed (anabolic fed state)',
      ketones: 'Trace (< 0.1 mmol/L)',
      autophagy: 'Inhibited by high mTOR signaling',
    },
    cellularProcesses: [
      'Gastrointestinal breakdown & absorption',
      'Hepatic and muscular glycogenesis',
      'mTORC1 activation promoting cellular growth',
      'Lipogenesis & triglyceride uptake into adipocytes',
    ],
    clinicalHighlights: [
      'Nutrient storage phase lasting approximately 3–4 hours after your last bite.',
      'Circulating glucose serves as the primary energetic substrate for all tissues.',
    ],
    physiologicalTip:
      'Sip warm water or herbal tea if you feel habit-based snack urges during this initial digestive winding-down period.',
  },
  {
    hours: 4,
    endHours: 8,
    phaseNumber: 2,
    title: 'Blood Sugar Normalization',
    scientificName: 'Post-Absorptive Basal Equilibrium',
    description: 'Gastric emptying completes; circulating insulin drops to baseline as glucose levels stabilize.',
    scientificExplanation:
      'As intestinal absorption ceases, circulating glucose returns to healthy baseline homeostasis (~70–99 mg/dL). Lowered glucose levels release the inhibitory brake on pancreatic alpha cells, allowing glucagon secretion to rise. The liver shifts metabolism toward early hepatic glycogenolysis, hydrolyzing stored glycogen into glucose-6-phosphate to fuel peripheral organs and preserve cerebral perfusion.',
    benefit: 'Gastrointestinal rest & insulin sensitivity restoration',
    color: 'from-blue-500 to-cyan-500',
    ringColor: '#06b6d4',
    hormoneEffects: {
      insulin: 'Dropping to baseline homeostatic level',
      glucagon: 'Commencing upward release',
      growthHormone: 'Early basal elevation',
      ketones: 'Low basal (0.1 – 0.2 mmol/L)',
      autophagy: 'Low basal housekeeping activity',
    },
    cellularProcesses: [
      'Gastric emptying complete; digestive tract motility rests',
      'Hepatic glycogenolysis initiates to support basal blood glucose',
      'Lowered insulin enables hormone-sensitive lipase derepression',
    ],
    clinicalHighlights: [
      'Digestive organs get their first extended respite from chemical breakdown and motility demands.',
      'Ghrelin (hunger hormone) pulses may occur at accustomed meal times; they peak for 20 minutes then naturally recede.',
    ],
    physiologicalTip:
      'Mild hunger pangs here are typically hormonal clockwork (ghrelin pulses), not true energetic deficit. Stay well-hydrated.',
  },
  {
    hours: 8,
    endHours: 12,
    phaseNumber: 3,
    title: 'Glycogen Depletion',
    scientificName: 'Hepatic Glycogenolysis & Early Gluconeogenesis',
    description: 'Liver glycogen stores are steadily drawn down; the body prepares its secondary energetic pathways.',
    scientificExplanation:
      'Liver glycogen reserves deplete toward roughly 50% of capacity. To maintain steady euglycemia without exogenous intake, the liver activates hepatic gluconeogenesis, synthesizing de novo glucose from lactate (via the Cori cycle), glycerol, and glucogenic amino acids. Intracellular ATP/AMP ratios begin shifting, prompting initial activation of cellular energy sensor AMPK (AMP-activated protein kinase).',
    benefit: 'Clearing liver glycogen stores & metabolic flexibility activation',
    color: 'from-cyan-500 to-teal-500',
    ringColor: '#14b8a6',
    hormoneEffects: {
      insulin: 'Approaching fasting baseline floor',
      glucagon: 'Elevated and stimulating gluconeogenesis',
      growthHormone: 'Rising progressively',
      ketones: 'Rising slightly (0.2 – 0.4 mmol/L)',
      autophagy: 'AMPK begins priming cellular cleanup pathways',
    },
    cellularProcesses: [
      'Hepatic glycogen reservoir depletes toward 50%',
      'Gluconeogenesis upregulation in liver hepatocytes',
      'AMPK phosphorylation initiates as intracellular ATP shifts',
    ],
    clinicalHighlights: [
      'Marks the transition between carbohydrate burning and endogenous fat mobilization.',
      'Initial metabolic flexibility is tested as cells prepare to oxidize lipids.',
    ],
    physiologicalTip:
      'A pinch of mineral sea salt in water can maintain optimal electrolyte balance and prevent early fasting headaches.',
  },
  {
    hours: 12,
    endHours: 14,
    phaseNumber: 4,
    title: 'The Metabolic Switch',
    scientificName: 'Adipose Lipolysis & Free Fatty Acid Surge',
    description: 'The biochemical pivot from carbohydrate oxidation to systemic lipid and triglyceride oxidation.',
    scientificExplanation:
      'With insulin at its baseline floor, the physiological "Metabolic Switch" fully activates. Inhibition of Hormone-Sensitive Lipase (HSL) in adipose tissue is abolished, accelerating lipolysis. Adipocytes release glycerol and Free Fatty Acids (FFAs) into the bloodstream bound to serum albumin. Tissues—including skeletal and cardiac muscle—transition to mitochondrial beta-oxidation for ATP synthesis.',
    benefit: 'Accelerated fat breakdown & reduction of adipose stores',
    color: 'from-emerald-500 to-teal-500',
    ringColor: '#10b981',
    hormoneEffects: {
      insulin: 'Suppressed to near-minimum baseline',
      glucagon: 'High; drives sustained hepatic output',
      growthHormone: 'Elevated ~2x to shield lean muscle mass',
      ketones: '0.3 – 0.6 mmol/L (early nutritional ketosis)',
      autophagy: 'Early hepatic and skeletal muscle induction',
    },
    cellularProcesses: [
      'Hormone-Sensitive Lipase (HSL) activation in adipocytes',
      'Mitochondrial beta-oxidation of fatty acids in muscles',
      'Carnitine palmitoyltransferase-1 (CPT-1) enzyme upregulation',
      'Significant downregulation of insulin resistance markers',
    ],
    clinicalHighlights: [
      'The definitive milestone where stored body fat becomes the predominant systemic fuel source.',
      'Insulin sensitivity improves across skeletal muscle and liver tissue.',
    ],
    physiologicalTip:
      'You are now in active fat-burning territory! Light movement or walking accelerates mitochondrial fatty acid uptake.',
  },
  {
    hours: 14,
    endHours: 16,
    phaseNumber: 5,
    title: 'Ketosis Induction',
    scientificName: 'Hepatic Ketogenesis & Cerebral Energy Transition',
    description: 'Liver converts surplus fatty acids into ketone bodies, delivering high-octane fuel to your brain.',
    scientificExplanation:
      'Rapid influx of fatty acids into hepatic mitochondria generates acetyl-CoA faster than the citric acid cycle can oxidize it. Through mitochondrial HMG-CoA synthase, hepatocytes convert acetyl-CoA into ketone bodies: acetoacetate and beta-hydroxybutyrate (BHB). Ketones readily cross the blood-brain barrier via monocarboxylate transporters (MCT1/2), furnishing the central nervous system with clean, ATP-efficient fuel.',
    benefit: 'Sharper mental focus, stable energy, and reduced brain fog',
    color: 'from-indigo-500 to-violet-500',
    ringColor: '#6366f1',
    hormoneEffects: {
      insulin: 'At fasting minimum level',
      glucagon: 'Dominant counter-regulatory hormone',
      growthHormone: '2x–3x baseline elevation',
      ketones: '0.5 – 1.2 mmol/L (confirmed nutritional ketosis)',
      autophagy: 'Broadening to muscular and hepatic cells',
    },
    cellularProcesses: [
      'Ketone body synthesis (Beta-Hydroxybutyrate & Acetoacetate)',
      'Brain monocarboxylate transporter (MCT) uptake of ketones',
      'Oxidative stress defense induction via Nrf2 pathway activation',
      'Lowered cerebral dependency on circulating glucose',
    ],
    clinicalHighlights: [
      'Ketones yield more ATP per molecule of oxygen consumed than glucose, enhancing cellular bioenergetics.',
      'Many fasters report spontaneous surges in focus, alertness, and stable calm energy.',
    ],
    physiologicalTip:
      'Black coffee or unsweetened green tea can boost ketone production and enhance focus without breaking the fast.',
  },
  {
    hours: 16,
    endHours: 18,
    phaseNumber: 6,
    title: 'Deep Ketosis & Anti-Inflammation',
    scientificName: 'Systemic Ketolysis & Inflammasome Suppression',
    description: 'Peak therapeutic ketosis; beta-hydroxybutyrate acts as an epigenetic signaling metabolite.',
    scientificExplanation:
      'Serum beta-hydroxybutyrate (BHB) concentration reaches robust systemic levels (1.0–2.0 mmol/L). Beyond its role as metabolic fuel, BHB functions as a signaling molecule: it inhibits histone deacetylases (HDACs), promoting antioxidant gene transcription, and directly binds and inhibits the NLRP3 inflammasome. This produces a measurable reduction in systemic inflammatory cytokines (IL-1b and IL-18).',
    benefit: 'Targeted reduction in systemic inflammation & peak fat oxidation',
    color: 'from-purple-500 to-pink-500',
    ringColor: '#a855f7',
    hormoneEffects: {
      insulin: 'Suppressed at low nadir',
      glucagon: 'Stable plateau',
      growthHormone: 'Surging 3x baseline to spare amino acids',
      ketones: '1.0 – 2.0 mmol/L (therapeutic ketosis)',
      autophagy: 'Actively ramping up across multiple organ systems',
    },
    cellularProcesses: [
      'NLRP3 inflammasome suppression by Beta-Hydroxybutyrate',
      'Endogenous Histone Deacetylase (HDAC) inhibition',
      'Mitochondrial biogenesis signaled via PGC-1alpha',
      'Marked reduction in reactive oxygen species (ROS) damage',
    ],
    clinicalHighlights: [
      'The 16:8 intermittent fasting gold standard concludes here with deep metabolic adaptations achieved.',
      'Cellular defense mechanisms against oxidative stress and inflammatory damage reach high activation.',
    ],
    physiologicalTip:
      'If breaking your fast here (16:8 goal reached), reintroduce food gently with lean protein and vegetables.',
  },
  {
    hours: 18,
    endHours: 24,
    phaseNumber: 7,
    title: 'Cellular Autophagy Surge',
    scientificName: 'Macroautophagy & Lysosomal Proteostasis',
    description: 'Cells initiate intense internal cleanup, breaking down senescent organelles and misfolded proteins.',
    scientificExplanation:
      'Sustained nutrient depletion results in severe suppression of mTOR complex 1 (mTORC1) alongside maximal activation of AMPK. This dual signal triggers macroautophagy: cells generate double-membraned vesicles called autophagosomes that envelop misfolded protein aggregates, damaged mitochondria (mitophagy), and intracellular debris. These fuse with lysosomes, recycling macromolecules into fresh amino acids.',
    benefit: 'Deep cellular rejuvenation, proteostasis, and longevity signaling',
    color: 'from-pink-500 to-rose-500',
    ringColor: '#ec4899',
    hormoneEffects: {
      insulin: 'Basal fasting nadir',
      glucagon: 'Sustained elevation',
      growthHormone: '3x–5x baseline spike protecting muscle proteins',
      ketones: '1.5 – 2.5 mmol/L',
      autophagy: 'High-intensity macroautophagy active throughout organs',
    },
    cellularProcesses: [
      'Autophagosome formation and lysosomal enzymatic degradation',
      'Targeted mitophagy (clearance of dysfunctional mitochondria)',
      'Clearance of senescent organelles and misfolded protein plaques',
      'HGH upregulation safeguarding skeletal muscle proteome',
    ],
    clinicalHighlights: [
      'Honored by the 2016 Nobel Prize in Medicine (Yoshinori Ohsumi) for cellular self-renewal mechanisms.',
      'Recycled cellular debris provides raw building blocks for new, healthy organelle formation.',
    ],
    physiologicalTip:
      'Autophagy is at its peak. Ensure plenty of electrolytes (sodium, potassium, magnesium) to feel crisp and energized.',
  },
  {
    hours: 24,
    phaseNumber: 8,
    title: 'Peak Autophagy & Growth Hormone Surge',
    scientificName: 'Full System Renewal, BDNF Spike & Stem Cell Priming',
    description: 'Maximal cellular renovation, neurotrophic growth factor spikes, and systemic regenerative priming.',
    scientificExplanation:
      'At and beyond 24 hours of fasting, Human Growth Hormone (HGH) peaks up to 500% over baseline to prevent gluconeogenesis-driven muscle catabolism. Autophagy rates achieve peak systemic intensity. In the hippocampus, Brain-Derived Neurotrophic Factor (BDNF) expression spikes, supporting neuroplasticity, memory formation, and synaptic resilience. Stem cells in the intestinal epithelium and immune system enter a primed state.',
    benefit: 'Maximal cellular renovation, BDNF surge, and immune system rejuvenation',
    color: 'from-rose-500 to-red-600',
    ringColor: '#ef4444',
    hormoneEffects: {
      insulin: 'Minimal basal floor',
      glucagon: 'Sustained balance',
      growthHormone: 'Apex surge (up to 5x baseline levels)',
      ketones: '2.0 – 4.0 mmol/L',
      autophagy: 'Peak systemic autophagy intensity',
    },
    cellularProcesses: [
      'Intense systemic macroautophagy across hepatic and neuronal tissue',
      'Hippocampal BDNF (Brain-Derived Neurotrophic Factor) gene expression',
      'Hematopoietic and intestinal stem cell rejuvenation priming',
      'Profund down-regulation of pro-growth IGF-1 longevity axis',
    ],
    clinicalHighlights: [
      'Achieves the deepest cellular recycling state available in voluntary physiological fasting.',
      'Refeeding after this phase triggers a secondary wave of cellular regeneration and stem cell activation.',
    ],
    physiologicalTip:
      'Break an extended 24h+ fast slowly: start with bone broth, eggs, or light soup rather than heavy carbs or fats.',
  },
];

export const MEDALS_CATALOG: Medal[] = [
  // First steps
  {
    id: 'first_fast',
    title: 'First Step',
    description: 'Completed your very first fast with the group!',
    category: 'milestone',
    icon: '🌱',
    color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    requirementDescription: 'Complete 1 fast of any duration'
  },
  {
    id: 'first_goal_reached',
    title: 'Goal Crusher',
    description: 'Successfully reached 100% of your target fasting window.',
    category: 'milestone',
    icon: '🎯',
    color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
    requirementDescription: 'Reach 100% target hours on a fast'
  },
  
  // Streaks
  {
    id: 'streak_3',
    title: '3-Day Momentum',
    description: 'Completed fasts on 3 consecutive days.',
    category: 'streak',
    icon: '⚡',
    color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    requirementDescription: 'Maintain a 3-day fasting streak'
  },
  {
    id: 'streak_7',
    title: '7-Day Champion',
    description: 'One full week of unstoppable consistency!',
    category: 'streak',
    icon: '🔥',
    color: 'text-orange-400 bg-orange-950/40 border-orange-500/30',
    requirementDescription: 'Maintain a 7-day fasting streak'
  },
  {
    id: 'streak_14',
    title: 'Fortnight Master',
    description: 'Two full weeks of habitual intermittent fasting.',
    category: 'streak',
    icon: '👑',
    color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    requirementDescription: 'Maintain a 14-day fasting streak'
  },
  {
    id: 'streak_30',
    title: 'Iron Discipline',
    description: '30 consecutive days of mastering your eating window.',
    category: 'streak',
    icon: '🏆',
    color: 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30',
    requirementDescription: 'Maintain a 30-day fasting streak'
  },

  // Total Hours
  {
    id: 'hours_50',
    title: 'Silver Clock',
    description: 'Accumulated 50 total hours of fasting.',
    category: 'hours',
    icon: '⏳',
    color: 'text-slate-300 bg-slate-900 border-slate-600',
    requirementDescription: 'Accumulate 50 total hours'
  },
  {
    id: 'hours_100',
    title: 'Century Club',
    description: 'Reached 100 cumulative hours of fasting!',
    category: 'hours',
    icon: '💯',
    color: 'text-yellow-300 bg-yellow-950/40 border-yellow-500/40',
    requirementDescription: 'Accumulate 100 total hours'
  },
  {
    id: 'hours_250',
    title: 'Master of Time',
    description: 'Achieved 250 lifetime fasting hours with your friends.',
    category: 'hours',
    icon: '💎',
    color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    requirementDescription: 'Accumulate 250 total hours'
  },

  // Special & Endurance
  {
    id: 'warrior_20',
    title: 'Warrior Badge',
    description: 'Completed a 20+ hour fast in a single session.',
    category: 'special',
    icon: '⚔️',
    color: 'text-red-400 bg-red-950/40 border-red-500/30',
    requirementDescription: 'Complete a single 20h fast'
  },
  {
    id: 'day_hero_24',
    title: '24-Hour Hero',
    description: 'Pushed through a full 24-hour fast for peak autophagy.',
    category: 'special',
    icon: '🛡️',
    color: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
    requirementDescription: 'Complete a 24h fast'
  },

  // Group & Social
  {
    id: 'team_spirit',
    title: 'Team Spirit',
    description: 'Joined a fasting group and fasted alongside your friends.',
    category: 'group',
    icon: '🤝',
    color: 'text-teal-400 bg-teal-950/40 border-teal-500/30',
    requirementDescription: 'Join or create a fasting circle'
  },
  {
    id: 'cheerleader',
    title: 'Chief Cheerleader',
    description: 'Sent 5 or more encouragements and cheers to your friends.',
    category: 'group',
    icon: '🎉',
    color: 'text-pink-400 bg-pink-950/40 border-pink-500/30',
    requirementDescription: 'Send motivation cheers to friends'
  }
];

export const DAILY_MOTIVATIONS = [
  {
    quote: "Fasting is not about starvation; it's about giving your body the space and clarity to thrive.",
    author: "Dr. Jason Fung"
  },
  {
    quote: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln"
  },
  {
    quote: "Your body is biologically designed to heal and renew itself when the digestive system rests.",
    author: "Metabolic Health Principle"
  },
  {
    quote: "The hunger wave comes, peaks, and passes. Drink water, take a breath, and watch it fade.",
    author: "Mindful Fasting Wisdom"
  },
  {
    quote: "Small consistent daily fasts build lifelong cellular resilience and steady, boundless energy.",
    author: "Longevity Science"
  },
  {
    quote: "When friends fast together, the journey turns from an effort into an inspiring shared rhythm.",
    author: "Fasting Circle"
  }
];

export const QUICK_CHEERS = [
  { emoji: '🔥', label: 'Stay strong!' },
  { emoji: '👏', label: 'Great pace!' },
  { emoji: '💧', label: 'Hydrate up!' },
  { emoji: '💪', label: 'You got this!' },
  { emoji: '👑', label: 'Absolute legend!' },
  { emoji: '🎯', label: 'Almost at target!' },
  { emoji: '🧘', label: 'Mind over belly!' },
  { emoji: '🌟', label: 'Proud of you!' }
];

export const AVATAR_EMOJIS = ['🦊', '🦁', '🦉', '🐺', '🐼', '🐯', '🦅', '🐻', '🐬', '🦄', '🐲', '⚡'];
