// ─── Cardio Programming Data for Concurrent Training ────────────────────────
// Research-backed cardio protocols for combining cycling (Peloton) with lifting.
// Lifting schedule: Mon (Chest+Tri), Tue (Back+Bi), Thu (Shoulders+Arms), Sat (Chest+Back)
// Current setup: 30 min Peloton pre-lift on Mon + Thu only.

// ─── 1. CARDIO SESSION TYPES ─────────────────────────────────────────────────

export const CARDIO_TYPES = {
  // ── Zone 2 LISS ──────────────────────────────────────────────────────────
  zone2_liss: {
    id: 'zone2_liss',
    name: 'Zone 2 LISS',
    fullName: 'Low-Intensity Steady State',
    description:
      'Continuous aerobic effort at a conversational pace. The workhorse of aerobic base building. ' +
      'Primary fuel source is fat oxidation. Builds mitochondrial density and cardiac output without ' +
      'meaningfully depleting glycogen stores.',
    intensityPctHRmax: { min: 60, max: 70 },
    intensityPctFTP: { min: 56, max: 75 }, // Peloton Zone 2
    pelotonZone: 2,
    rpe: { min: 2, max: 4 }, // out of 10
    durationMin: { min: 30, max: 60 },
    modalities: ['cycling', 'walking', 'elliptical', 'rowing'],
    whenToUse: [
      'Active recovery days (Wed, Fri, Sun)',
      'Pre-lift warmup when lifting lower body the same day',
      'First session of the day before an afternoon lift',
      'Deload weeks — replace harder cardio entirely',
    ],
    interferenceRisk: 'low',
    interferenceNotes:
      'Minimal glycogen depletion means pre-lift strength is not meaningfully compromised. ' +
      'The "interference effect" (concurrent training blunting hypertrophy via AMPK/mTOR conflict) ' +
      'is negligible at this intensity. Fat oxidation rate peaks here, making it superior for body comp ' +
      'without muscle cost.',
    recoveryRequiredHours: 4,
    calorieBurnPerMin: { min: 7, max: 10 }, // approx for 175–200 lb male on bike
    keyResearch:
      'Hawley 2009 (AMPK/mTOR interference minimal at low intensity); ' +
      'Coffey & Hawley 2017 (concurrent training review — intensity is the primary moderator of interference)',
  },

  // ── Zone 3 Tempo ─────────────────────────────────────────────────────────
  zone3_tempo: {
    id: 'zone3_tempo',
    name: 'Zone 3 Tempo',
    fullName: 'Aerobic Threshold / Tempo',
    description:
      'Comfortably hard effort. Still aerobic but approaching the lactate threshold. ' +
      'Can sustain a few sentences of conversation. Dips into glycogen more than Zone 2 but ' +
      'trains the aerobic ceiling efficiently.',
    intensityPctHRmax: { min: 70, max: 80 },
    intensityPctFTP: { min: 76, max: 90 }, // Peloton Zone 3–4
    pelotonZone: 3,
    rpe: { min: 5, max: 6 },
    durationMin: { min: 20, max: 40 },
    modalities: ['cycling', 'rowing', 'running'],
    whenToUse: [
      'Standalone cardio sessions on non-lifting days (moderate priority)',
      'Pre-lift only if session is 20 min or less AND lifting is upper body only',
      'When building aerobic capacity is a secondary training goal',
    ],
    interferenceRisk: 'moderate',
    interferenceNotes:
      'Partial glycogen depletion (20–30% reduction) can reduce lower-body strength output by 5–15% ' +
      'if done immediately before legs. Upper body lifting is less affected (~0–8% reduction). ' +
      'A 2-hour gap largely eliminates this effect via glycogen resynthesis if carbs are consumed.',
    recoveryRequiredHours: 6,
    calorieBurnPerMin: { min: 10, max: 14 },
    keyResearch:
      'Wilson et al. 2012 (meta-analysis: moderate-intensity concurrent training reduces strength gains ' +
      'by ~8% vs. resistance-only); Fyfe et al. 2016 (intensity mediates interference effect)',
  },

  // ── Zone 4 Threshold ─────────────────────────────────────────────────────
  zone4_threshold: {
    id: 'zone4_threshold',
    name: 'Zone 4 Threshold',
    fullName: 'Lactate Threshold / Sweet Spot',
    description:
      'Hard sustained effort at or near the lactate threshold. Maximum aerobic power you can hold ' +
      'for 20–60 minutes. Significant glycogen depletion. Ventilatory effort is high — cannot speak ' +
      'in full sentences.',
    intensityPctHRmax: { min: 80, max: 90 },
    intensityPctFTP: { min: 91, max: 105 }, // Peloton Zone 4–5
    pelotonZone: 4,
    rpe: { min: 7, max: 8 },
    durationMin: { min: 15, max: 30 },
    modalities: ['cycling', 'rowing', 'running'],
    whenToUse: [
      'Standalone sessions on rest days only — not pre- or post-lift',
      'When cardiovascular fitness (VO2max, FTP) is the primary goal',
      'Limit to 1–2x/week maximum; higher frequency degrades strength recovery',
    ],
    interferenceRisk: 'high',
    interferenceNotes:
      'Significant AMPK activation competes with mTOR signaling for up to 3 hours post-session. ' +
      'Glycogen stores substantially depleted (40–60%). Performing threshold cardio before lifting ' +
      'reduces compound lift performance by 10–20%. Post-lift threshold cardio significantly blunts ' +
      'the anabolic response. Best separated by 6+ hours or placed on pure cardio days.',
    recoveryRequiredHours: 18,
    calorieBurnPerMin: { min: 13, max: 18 },
    keyResearch:
      'Hickson 1980 (original interference study — strength gains blunted by intense concurrent training); ' +
      'Coffey et al. 2009 (AMPK activation suppresses mTOR for hours after high-intensity cardio)',
  },

  // ── HIIT / Tabata ─────────────────────────────────────────────────────────
  hiit: {
    id: 'hiit',
    name: 'HIIT / Tabata',
    fullName: 'High-Intensity Interval Training',
    description:
      'Short maximum-effort intervals alternating with incomplete rest. Rapidly depletes PCr and ' +
      'glycogen. Mimics resistance training metabolic stress in some ways (high lactate, AMPK spike). ' +
      'Tabata: 20s on / 10s off × 8 rounds = 4 minutes at ~170% VO2max.',
    intensityPctHRmax: { min: 90, max: 100 },
    intensityPctFTP: { min: 106, max: 150 }, // Peloton Zone 5+
    pelotonZone: '5–6',
    rpe: { min: 9, max: 10 },
    durationMin: { min: 4, max: 20 }, // work intervals only; total session 15–30 min
    modalities: ['cycling', 'rowing', 'running sprints', 'assault bike'],
    whenToUse: [
      'Never pre-lift — glycogen crash and neuromuscular fatigue severely hurt strength',
      'Post-lift occasionally if fat loss is the priority and session is brief (10–15 min max)',
      'Standalone on dedicated cardio days with 24h recovery before next lift',
      'Best 2–3x/week maximum for any concurrent trainee',
    ],
    interferenceRisk: 'very_high',
    interferenceNotes:
      'Highest interference of all cardio modes. Massive AMPK spike, significant muscle damage (especially ' +
      'eccentric-heavy HIIT like sprints), and CNS fatigue accumulation. However, brief Peloton HIIT ' +
      '(cycling is concentric-dominant) causes less muscle damage than running sprints — interference is ' +
      'primarily metabolic, not structural. Still not recommended before lifting.',
    recoveryRequiredHours: 24,
    calorieBurnPerMin: { min: 15, max: 22 },
    keyResearch:
      'Babcock et al. 2022 (HIIT before resistance training reduces total lifting volume by 12–18%); ' +
      'Schumann et al. 2022 (concurrent HIIT + resistance training: modality and sequence matter)',
  },

  // ── Active Recovery ──────────────────────────────────────────────────────
  active_recovery: {
    id: 'active_recovery',
    name: 'Active Recovery',
    fullName: 'Active Recovery / Zone 1',
    description:
      'Very light movement to increase blood flow, reduce DOMS, and clear metabolic byproducts ' +
      'without adding training stress. Should feel almost effortless. Heart rate stays well below ' +
      'aerobic threshold.',
    intensityPctHRmax: { min: 50, max: 60 },
    intensityPctFTP: { min: 0, max: 55 }, // Peloton Zone 1
    pelotonZone: 1,
    rpe: { min: 1, max: 3 },
    durationMin: { min: 15, max: 30 },
    modalities: ['cycling (easy spin)', 'walking', 'swimming', 'yoga flow'],
    whenToUse: [
      'Day after a heavy lifting session to accelerate recovery',
      'Between two lifting sessions in the same day (rare)',
      'Deload week — primary cardio mode',
      'Any day soreness is notable but rest feels counterproductive',
    ],
    interferenceRisk: 'none',
    interferenceNotes:
      'No meaningful interference. Active recovery at Zone 1 increases blood flow and lactate clearance ' +
      'without triggering AMPK activation at levels that compete with protein synthesis. Some evidence ' +
      'it slightly accelerates muscle repair vs. passive rest.',
    recoveryRequiredHours: 0,
    calorieBurnPerMin: { min: 4, max: 7 },
    keyResearch:
      'Menzies et al. 2010 (active recovery accelerates blood lactate clearance vs. passive rest); ' +
      'Tessitore et al. 2007 (Zone 1 cycling between sessions improves next-session performance)',
  },

  // ── Fasted Cardio ────────────────────────────────────────────────────────
  fasted_cardio: {
    id: 'fasted_cardio',
    name: 'Fasted Cardio',
    fullName: 'Fasted Low-Intensity Cardio',
    description:
      'Low-intensity cardio performed after an overnight fast (8–12h), before breakfast. ' +
      'Maximizes fat oxidation due to low insulin and glycogen levels. Popular for fat loss but ' +
      'research on additional fat loss benefit vs. fed cardio is mixed — total caloric deficit matters more.',
    intensityPctHRmax: { min: 60, max: 70 }, // Must stay Zone 2 — higher intensity burns glycogen not fat
    intensityPctFTP: { min: 56, max: 75 },
    pelotonZone: 2,
    rpe: { min: 2, max: 4 },
    durationMin: { min: 20, max: 45 }, // >45 min fasted risks muscle catabolism
    modalities: ['cycling (low resistance)', 'walking', 'light elliptical'],
    whenToUse: [
      'Morning of non-lifting days for fat loss phase',
      'NEVER before lifting — cortisol already elevated in fasted state; adding lifting compounds stress',
      'Keep to Zone 2 only — fasted high-intensity is cortisol-elevating and catabolic',
    ],
    interferenceRisk: 'low_standalone',
    interferenceNotes:
      'Fasted + lifting same session is high-risk for muscle catabolism (elevated cortisol, no amino acid ' +
      'availability). As standalone morning cardio on non-lifting days, interference risk is low. Consume ' +
      '20–40g protein + 30–60g carbs within 30 min after fasted cardio to halt catabolism.',
    recoveryRequiredHours: 4,
    nutritionNote:
      'Post-fasted-cardio: 20–40g whey protein + banana or oatmeal immediately after. ' +
      'This stops cortisol-driven catabolism and replenishes glycogen for the day.',
    calorieBurnPerMin: { min: 7, max: 10 },
    keyResearch:
      'Schoenfeld et al. 2014 (fasted vs. fed cardio: no significant difference in fat loss when ' +
      'calories equated); Horowitz & Klein 2000 (fat oxidation peaks at Zone 2 regardless of fed state)',
  },

  // ── Power Zone Endurance (Peloton-specific) ──────────────────────────────
  pz_endurance: {
    id: 'pz_endurance',
    name: 'Power Zone Endurance',
    fullName: 'Peloton Power Zone Endurance Ride',
    description:
      'Peloton-specific ride format staying primarily in Zones 2–3 (56–90% FTP). Longer duration ' +
      '(45–90 min). Builds aerobic base, mitochondrial density, and fat-burning capacity. ' +
      'The gold standard for concurrent trainees seeking cardiovascular health without interference.',
    intensityPctFTP: { min: 56, max: 90 },
    pelotonZones: [2, 3],
    rpe: { min: 3, max: 6 },
    durationMin: { min: 45, max: 90 },
    instructors: ['Matt Wilpers', 'Christine D\'Ercole', 'Denis Morton', 'Ben Alldis'],
    whenToUse: [
      'Active recovery / cardio days (Wed, Fri, Sun)',
      'Days when fat loss is the priority goal',
      'As a standalone Saturday morning session before Chest+Back lift (45 min with 3h gap)',
    ],
    interferenceRisk: 'low',
    interferenceNotes:
      'Stays in aerobic Zone 2–3. Minimal glycogen depletion. AMPK activation is transient. ' +
      'With a 3+ hour gap and carbohydrate meal between, does not meaningfully interfere with ' +
      'afternoon resistance training.',
    recoveryRequiredHours: 6,
    calorieBurnPerMin: { min: 8, max: 12 },
    ftpZoneBreakdown: {
      zone1: '< 56% FTP — Active Recovery',
      zone2: '56–75% FTP — Endurance',
      zone3: '76–90% FTP — Tempo',
    },
  },

  // ── Power Zone (standard, Peloton-specific) ──────────────────────────────
  power_zone: {
    id: 'power_zone',
    name: 'Power Zone',
    fullName: 'Peloton Power Zone Ride',
    description:
      'Peloton-specific interval ride format using FTP zones. Mixes Zones 2–5 with structured ' +
      'intervals. 30–60 min. The format currently used pre-lift on Mon + Thu.',
    intensityPctFTP: { min: 56, max: 120 },
    pelotonZones: [2, 3, 4, 5],
    rpe: { min: 4, max: 8 },
    durationMin: { min: 30, max: 60 },
    instructors: ['Matt Wilpers', 'Denis Morton', 'Ben Alldis', 'Olivia Amato'],
    whenToUse: [
      'Pre-lift warmup: use 30-min format, keep output in Zones 2–3 only (no Zone 4+ before lifting)',
      'Standalone session on non-lifting days when more variety than pure endurance is desired',
    ],
    interferenceRisk: 'low_to_moderate',
    interferenceNotes:
      'Standard Power Zone rides include Zone 4–5 pushes. For pre-lift use, deliberately under-perform ' +
      'the Zone 4+ intervals (stay in Zone 3 max) to preserve glycogen and avoid AMPK spike. ' +
      '30-min rides are short enough that even Zone 3 effort does not significantly compromise upper body lifting.',
    recoveryRequiredHours: 8,
    calorieBurnPerMin: { min: 10, max: 15 },
    preLiftModification:
      'For pre-lift use: cap output at Zone 3 (76–90% FTP) even during interval peaks. ' +
      'Skip or soft-pedal Zone 4+ segments. Treat as an extended warmup, not a training stimulus.',
  },

  // ── Power Zone Max (Peloton-specific) ────────────────────────────────────
  pz_max: {
    id: 'pz_max',
    name: 'Power Zone Max',
    fullName: 'Peloton Power Zone Max Ride',
    description:
      'High-intensity interval format spending substantial time in Zones 4–6 (91%+ FTP). ' +
      'Designed for VO2max and anaerobic capacity development. Very high training stress.',
    intensityPctFTP: { min: 91, max: 150 },
    pelotonZones: [4, 5, 6, 7],
    rpe: { min: 7, max: 10 },
    durationMin: { min: 30, max: 60 },
    instructors: ['Matt Wilpers', 'Denis Morton'],
    whenToUse: [
      'Standalone on pure cardio days only — NEVER on lifting days (pre or post)',
      'Limit to 1x/week maximum in concurrent training context',
      'Use only after an FTP test establishes accurate zones',
      'Suitable for maintenance phase when muscle building is not the primary goal',
    ],
    interferenceRisk: 'very_high',
    interferenceNotes:
      'Equivalent interference profile to HIIT/threshold running. Significant AMPK activation, ' +
      'substantial glycogen depletion, and CNS fatigue. Incompatible with same-day or next-day heavy lifting.',
    recoveryRequiredHours: 24,
    calorieBurnPerMin: { min: 14, max: 20 },
  },
};

// ─── 2. PRE-WORKOUT CARDIO RULES ─────────────────────────────────────────────

export const PRE_LIFT_CARDIO_RULES = {
  // Maximum safe intensity before lifting without compromising strength
  maxSafeIntensity: {
    pctHRmax: 75,
    pctFTP: 90, // Stay at or below Zone 3
    pelotonZone: 3,
    rationale:
      'Above Zone 3, glycolytic energy systems begin contributing significantly. ' +
      'This depletes glycogen stores used in compound lifts and triggers AMPK activation ' +
      'that temporarily suppresses mTOR-driven protein synthesis for 1–3 hours.',
  },

  // Maximum safe duration before lifting
  maxSafeDuration: {
    minutes: 30,
    atZone2: 45, // Zone 2 only: up to 45 min is acceptable
    rationale:
      '30 min at Zone 2–3 is the sweet spot: sufficient for cardiovascular warm-up and aerobic stimulus ' +
      'without meaningfully depleting glycogen or inducing significant neuromuscular fatigue. ' +
      'Exceeding 45 min even at Zone 2 begins to reduce time-to-fatigue in subsequent lifting.',
  },

  // Rest interval between cardio and lifting
  restBetweenCardioAndLifting: {
    minimum: { minutes: 2, condition: 'Zone 2 only, <30 min' },
    recommended: { minutes: 10, condition: 'Zone 2–3, 30 min — standard pre-lift scenario' },
    ideal: { minutes: 20, condition: 'Any cardio above Zone 2' },
    rationale:
      'The 2-minute gap currently used (per workoutData.js) is the absolute minimum. ' +
      'Even 5–10 min of cooldown + transition time allows HR to drop from 130–140 to ~100–110, ' +
      'which restores cardiac output prioritization to skeletal muscle for lifting. ' +
      'Acute post-cardio elevated HR does not directly impair strength, but perceived exertion is higher.',
  },

  // Does muscle group specificity matter?
  muscleGroupSpecificity: {
    sameGroup: {
      risk: 'moderate',
      example: 'Cycling before leg press / squat',
      notes:
        'Lower body cardio before lower body lifting causes localized glycogen depletion, ' +
        'accumulated metabolic waste (lactate, Pi), and neural fatigue in the same motor units. ' +
        'Research shows 8–15% strength reduction in lower body compound lifts after 30 min Zone 3 cycling.',
    },
    differentGroup: {
      risk: 'low',
      example: 'Cycling before bench press / shoulder press (current Mon + Thu setup)',
      notes:
        'Cycling is lower body dominant. Pedaling minimally fatigues upper body pushing/pulling muscles. ' +
        'After 30 min Zone 2–3 cycling, upper body strength output is typically unaffected (<5% reduction). ' +
        'This is WHY the Mon (Chest+Tri) and Thu (Shoulders+Arms) Peloton sessions work well — ' +
        'cycling warms up the cardiovascular system without fatiguing the target muscles.',
    },
    verdict:
      'The current protocol (cycling before upper body lifting) is well-supported by the research. ' +
      'Do NOT add pre-lift cycling before lower body sessions without reducing intensity to Zone 1–2.',
  },

  // Energy system considerations
  energySystems: {
    aerobic: {
      fuel: 'Fat + glycogen',
      dominantZones: [1, 2, 3],
      relevance: 'Zone 2 cycling taps aerobic system — minimal glycolytic contribution, preserves glycogen for lifts',
    },
    glycolytic: {
      fuel: 'Glycogen → lactate',
      dominantZones: [4, 5, 6],
      relevance:
        'Zone 4+ cycling uses same glycogen pool as barbell work. ' +
        'Resynthesis takes 30–90 min with carbohydrate intake. Avoid before lifting.',
    },
    phosphocreatine: {
      fuel: 'PCr (immediate)',
      dominantZones: [6, 7],
      relevance: 'Sprints/Zone 6+ — PCr depleted in 8–10 sec, replenishes in ~3 min. Not a concern for 30-min rides.',
    },
  },

  // Nutrition timing for pre-workout cardio
  nutritionTiming: {
    scenario_fastThenLift: {
      label: 'Fasted cardio → immediate lifting (NOT recommended)',
      recommendation: 'Consume 20–30g fast carbs + 10–20g protein immediately after cardio before lifting begins',
    },
    scenario_fedThenCardioThenLift: {
      label: 'Fed → 30 min Peloton → lift (current setup — optimal)',
      recommendation:
        'Eat a mixed meal 60–90 min before the entire session. ' +
        'Carbohydrate-rich (50–80g carbs, 25–40g protein, low fat for digestion speed). ' +
        'Examples: oatmeal + protein shake, rice + chicken, toast + eggs.',
      timing: {
        mealBeforeCardio: '60–90 min pre-session',
        intraSessionCarbs: 'Optional — banana or sports drink if session exceeds 45 min total',
        postSession: 'Protein shake or meal within 30–60 min after lifting',
      },
    },
    scenario_earlyMorningLift: {
      label: 'Early morning — minimal time for full meal',
      recommendation:
        'Fast-digesting option 30–45 min before: banana + protein shake, or 2 rice cakes + whey. ' +
        'Avoid high-fat, high-fiber pre-workout — slows digestion and causes GI distress mid-cardio.',
    },
  },

  // The exact user scenario: 30 min cycling → upper body lifting
  userScenario: {
    label: '30 min Peloton (Power Zone) → 2 min rest → Upper Body Lifting',
    assessment: 'Well-designed. Research consensus is supportive.',
    details: [
      'Cycling is primarily lower-body and cardiovascular — does not pre-fatigue chest, shoulders, or arms',
      '30 min is within the safe pre-lift duration window',
      'Zone 2–3 output keeps glycogen depletion minimal',
      'Elevated core temperature post-cardio enhances tissue extensibility and CNS activation — may slightly improve lifting performance',
      '2 min rest is the clinical minimum — extending to 5–10 min would reduce cardiovascular-to-muscular transition time',
    ],
    recommendations: [
      'Keep Power Zone output in Zones 2–3 (cap at 90% FTP) to preserve glycogen for lifting',
      'Consider extending the rest gap to 5 min (use it for upper body mobility/activation — shoulder circles, band pull-aparts)',
      'Eat a solid carb+protein meal 60–90 min before the full session',
      'If you ever feel weak on bench/press, first check if the Peloton intensity crept into Zone 4',
    ],
  },
};

// ─── 3. POST-WORKOUT CARDIO RULES ────────────────────────────────────────────

export const POST_LIFT_CARDIO_RULES = {
  interferenceEffect: {
    summary:
      'Post-lift cardio is better than pre-lift for preserving strength performance but has its own ' +
      'interference considerations — primarily blunting the anabolic response and extending recovery time.',
    mechanism:
      'Resistance training strongly activates mTOR (muscle protein synthesis). ' +
      'High-intensity cardio immediately after re-activates AMPK, which phosphorylates and inhibits mTOR. ' +
      'Low-intensity cardio (Zone 1–2) post-lift has minimal AMPK activation and is well-tolerated.',
    durationCutoffs: {
      safe: '< 20 min Zone 2 — no meaningful interference with anabolism',
      caution: '20–40 min Zone 2, or <20 min Zone 3–4 — modest interference, likely worth doing for fat loss',
      avoid: '> 40 min any intensity, or any Zone 4+ — significant interference and extended recovery time',
    },
  },

  optimalModality: {
    ranking: [
      {
        rank: 1,
        modality: 'Cycling (stationary / Peloton)',
        reason:
          'Concentric-dominant movement — no significant eccentric muscle damage. ' +
          'Does not add structural damage to muscles already stressed by lifting. ' +
          'Can be done at Zone 2 without meaningful soreness or recovery cost.',
      },
      {
        rank: 2,
        modality: 'Rowing',
        reason:
          'Involves upper body which may be fatigued post-push/pull sessions. ' +
          'Good caloric burn with low impact. Eccentric load is minimal.',
      },
      {
        rank: 3,
        modality: 'Running / treadmill',
        reason:
          'High eccentric load on quads and calves. Significant muscle damage with volume. ' +
          'Not ideal post-lift unless very short (10–15 min easy jogging) or if lower body was not trained.',
      },
    ],
    verdict:
      'Cycling post-lift is ideal. The Peloton at Zone 1–2 for 15–20 min post-upper-body lifting ' +
      'is an effective cool-down that adds caloric burn without meaningful interference.',
  },

  fatOxidationBenefit: {
    description:
      'Resistance training depletes glycogen and elevates lipolytic hormones (GH, epinephrine). ' +
      'The 1–3 hours post-lifting shows elevated fat oxidation rates even at rest. ' +
      'Low-intensity cardio in this window exploits this elevated fat mobilization — ' +
      'you burn more fat per unit of effort than the same cardio done fasted or at other times.',
    practicalAdvice:
      'A 15–20 min Zone 2 Peloton cooldown after lifting is one of the highest-return strategies ' +
      'for fat loss without adding training stress. Keep it genuinely easy — Zone 1–2 only.',
    source: 'Melanson et al. 2009; Romijn et al. 1993 (fat oxidation post-resistance training)',
  },

  postLiftCardioByDay: {
    day1_chest_tri: {
      day: 'Monday',
      recommendation: 'Optional 10–15 min Zone 1–2 Peloton cooldown. Already did 30 min pre-lift.',
      notes: 'If you did 30 min pre-lift, the total cardio for the day is already substantial. Skip or keep to 10 min easy.',
    },
    day2_back_bi: {
      day: 'Tuesday',
      recommendation: '15–20 min Zone 2 Peloton or brisk walk post-lift — good fat-burning opportunity.',
      notes: 'No pre-lift cardio on Tuesday. Post-lift Zone 2 is an efficient addition without adding fatigue.',
    },
    day3_shoulders_arms: {
      day: 'Thursday',
      recommendation: 'Already did 30 min pre-lift. No post-lift cardio needed.',
      notes: 'Shoulders+Arms day is lower overall volume than Mon/Sat. Recovery is still important — skip post-lift cardio.',
    },
    day4_chest_back: {
      day: 'Saturday',
      recommendation: '10–15 min Zone 1 cooldown only — superset format is already high-metabolic.',
      notes: 'Saturday supersets are metabolically demanding. Extra cardio post-lift risks over-extension.',
    },
  },

  recoveryTimeBeforeNextSession: {
    zone1_2_postLift: {
      modality: 'Zone 1–2 cycling 15–20 min',
      recoveryBeforeNextLift: '12 hours minimum (fine for next-day training)',
    },
    zone3_postLift: {
      modality: 'Zone 3 tempo 20–30 min',
      recoveryBeforeNextLift: '18–24 hours — impacts next-day performance',
    },
    zone4Plus_postLift: {
      modality: 'Zone 4+ threshold 15+ min',
      recoveryBeforeNextLift: '36–48 hours — avoid on any day before a heavy lifting session',
    },
  },
};

// ─── 4. REST DAY CARDIO ───────────────────────────────────────────────────────

export const REST_DAY_CARDIO = {
  overview:
    'Rest days serve two functions: (1) physical recovery from training stress, ' +
    '(2) opportunity for additional caloric burn and cardiovascular training without interfering with lifting recovery. ' +
    'The key is keeping intensity low enough that systemic fatigue is not added.',

  optimalIntensity: {
    zone: 'Zone 2 (or Zone 1 for heavy DOMS)',
    pctHRmax: { min: 60, max: 70 },
    pctFTP: { min: 56, max: 75 },
    rationale:
      'Zone 2 is below the intensity threshold that triggers significant cortisol elevation, ' +
      'AMPK activation, or glycogen depletion. Enhances blood flow for metabolite clearance ' +
      'while allowing mTOR-driven protein synthesis to continue unimpeded.',
  },

  durationGuidelines: {
    minimum: 20, // minutes — shorter isn't worth the setup
    optimal: 30, // minutes — sweet spot for caloric burn + recovery benefit
    maximum: 60, // minutes — beyond 60 min Zone 2 starts adding meaningful fatigue
    note: 'Longer than 45 min of Zone 2 on rest days is fine physiologically but may be overkill ' +
          'if lifting 4x/week. For fat loss, 45–60 min Zone 2 rest-day cardio is high value.',
  },

  weeklyFatigueConsiderations: {
    low: {
      profile: 'Fresh, no significant DOMS, RHR at baseline',
      recommendation: '30–45 min Zone 2 — full rest day cardio session',
    },
    moderate: {
      profile: 'Mild soreness, RHR +3–5 bpm over baseline, sleep was okay',
      recommendation: '20–30 min Zone 2 or 20 min easy walk',
    },
    high: {
      profile: 'Significant DOMS, RHR +6+ bpm, poor sleep, HRV low',
      recommendation: '15 min Zone 1 easy spin or full passive rest',
    },
  },

  weeklySchedule: {
    wednesday: {
      day: 'Wednesday',
      liftingStatus: 'Rest day (between Tue and Thu lifts)',
      recommendation: '30–45 min Zone 2 Peloton or outdoor walk',
      priority: 'high — 48h after Monday lift, 24h before Thursday lift',
      notes: 'Keep to Zone 2 strictly. This day bridges two lifting days and must not add systemic fatigue.',
    },
    friday: {
      day: 'Friday',
      liftingStatus: 'Rest day (after Thu lift, before Sat lift)',
      recommendation: '30–45 min Zone 2 Peloton or light walk',
      priority: 'medium-high',
      notes: '24h before Saturday lift. Zone 2 only. This is an ideal fat-burning window.',
    },
    sunday: {
      day: 'Sunday',
      liftingStatus: 'Rest day (after Sat lift)',
      recommendation: '20–30 min Zone 1 active recovery or full rest',
      priority: 'low — prioritize recovery over caloric burn',
      notes:
        'Sunday follows the Saturday volume day. Focus on recovery. Active recovery spin is fine; ' +
        'push-it cardio is counterproductive here.',
    },
  },
};

// ─── 5. WEEKLY CARDIO PROGRAMMING ────────────────────────────────────────────
// Lifting days: Mon (Day 1), Tue (Day 2), Thu (Day 3), Sat (Day 4)
// Current: 30 min Peloton pre-lift Mon + Thu

export const WEEKLY_CARDIO_SCHEDULES = {
  // ── Fat Loss Priority ─────────────────────────────────────────────────────
  fat_loss: {
    id: 'fat_loss',
    name: 'Fat Loss Priority',
    description: 'Maximize cardio volume without meaningfully compromising muscle retention or lifting performance.',
    targetWeeklyCardioMinutes: 210, // ~3.5 hours
    schedule: {
      monday: {
        liftDay: 'Day 1 — Chest + Triceps',
        cardio: {
          type: 'power_zone',
          timing: 'pre_lift',
          durationMin: 30,
          intensity: 'Zone 2–3 (cap at 90% FTP)',
          notes: 'Current setup. Keep intensity controlled.',
        },
      },
      tuesday: {
        liftDay: 'Day 2 — Back + Biceps',
        cardio: {
          type: 'zone2_liss',
          timing: 'post_lift',
          durationMin: 20,
          intensity: 'Zone 2',
          notes: 'Post-lift Zone 2 exploits elevated post-lifting fat oxidation.',
        },
      },
      wednesday: {
        liftDay: 'Rest',
        cardio: {
          type: 'zone2_liss',
          timing: 'standalone',
          durationMin: 45,
          intensity: 'Zone 2',
          notes: 'Primary fat-burning session of the week. Keep Zone 2 strictly.',
        },
      },
      thursday: {
        liftDay: 'Day 3 — Shoulders + Arms',
        cardio: {
          type: 'power_zone',
          timing: 'pre_lift',
          durationMin: 30,
          intensity: 'Zone 2–3 (cap at 90% FTP)',
          notes: 'Current setup. Shoulders+Arms — cycling does not pre-fatigue target muscles.',
        },
      },
      friday: {
        liftDay: 'Rest',
        cardio: {
          type: 'pz_endurance',
          timing: 'standalone',
          durationMin: 45,
          intensity: 'Zone 2–3',
          notes: 'Power Zone Endurance ride. Good for aerobic base + caloric burn.',
        },
      },
      saturday: {
        liftDay: 'Day 4 — Chest + Back',
        cardio: {
          type: 'active_recovery',
          timing: 'post_lift',
          durationMin: 15,
          intensity: 'Zone 1',
          notes: 'Superset format already metabolically demanding. Easy cooldown only.',
        },
      },
      sunday: {
        liftDay: 'Rest',
        cardio: {
          type: 'active_recovery',
          timing: 'standalone',
          durationMin: 25,
          intensity: 'Zone 1',
          notes: 'Active recovery only. Prioritize sleep and nutrition for the Monday session.',
        },
      },
    },
    weeklyTotals: {
      cardioMinutes: 210,
      estimatedCalBurn: 1800, // approximate for 175-200 lb male
      cardioSessions: 7,
      liftSessions: 4,
    },
    recoveryNotes:
      'This schedule pushes cardio volume. Monitor RHR (+5 bpm = back off) and HRV. ' +
      'If strength declines over 2+ weeks, reduce Wednesday or Friday cardio first.',
  },

  // ── Muscle Building Priority ──────────────────────────────────────────────
  muscle_building: {
    id: 'muscle_building',
    name: 'Muscle Building Priority',
    description:
      'Minimize interference effect. Keep cardio for cardiovascular health and body comp maintenance ' +
      'without compromising hypertrophy stimulus or recovery.',
    targetWeeklyCardioMinutes: 90,
    schedule: {
      monday: {
        liftDay: 'Day 1 — Chest + Triceps',
        cardio: {
          type: 'power_zone',
          timing: 'pre_lift',
          durationMin: 20, // reduced from 30
          intensity: 'Zone 2 only (stay ≤ 75% FTP)',
          notes:
            'Reduce to 20 min at strict Zone 2. Prioritizes warmup function over cardio training stimulus.',
        },
      },
      tuesday: {
        liftDay: 'Day 2 — Back + Biceps',
        cardio: null,
        notes: 'No cardio. Full recovery focus.',
      },
      wednesday: {
        liftDay: 'Rest',
        cardio: {
          type: 'zone2_liss',
          timing: 'standalone',
          durationMin: 30,
          intensity: 'Zone 2',
          notes: 'Single dedicated cardio session for the week. Maintains cardiovascular health.',
        },
      },
      thursday: {
        liftDay: 'Day 3 — Shoulders + Arms',
        cardio: {
          type: 'power_zone',
          timing: 'pre_lift',
          durationMin: 20,
          intensity: 'Zone 2 only',
          notes: 'Same as Monday — reduced duration and capped intensity.',
        },
      },
      friday: {
        liftDay: 'Rest',
        cardio: null,
        notes: 'Full rest or 15-min easy walk. Prioritize Saturday lift performance.',
      },
      saturday: {
        liftDay: 'Day 4 — Chest + Back',
        cardio: null,
        notes: 'No cardio on Saturday. Volume day superset format is sufficient metabolic work.',
      },
      sunday: {
        liftDay: 'Rest',
        cardio: {
          type: 'active_recovery',
          timing: 'standalone',
          durationMin: 20,
          intensity: 'Zone 1',
          notes: 'Light spin or walk. Promotes blood flow without adding training load.',
        },
      },
    },
    weeklyTotals: {
      cardioMinutes: 90,
      estimatedCalBurn: 750,
      cardioSessions: 4,
      liftSessions: 4,
    },
    recoveryNotes:
      'Maximum muscle building potential. Any plateau in hypertrophy is unlikely to be cardio-related. ' +
      'If fat gain becomes a concern over time, gradually add cardio volume starting with Wednesday.',
  },

  // ── Balanced Approach ─────────────────────────────────────────────────────
  balanced: {
    id: 'balanced',
    name: 'Balanced Approach',
    description:
      'Moderate cardio 4–5x/week. Maintains lifting performance and hypertrophy while ' +
      'supporting cardiovascular fitness and body composition. The recommended default.',
    targetWeeklyCardioMinutes: 150,
    schedule: {
      monday: {
        liftDay: 'Day 1 — Chest + Triceps',
        cardio: {
          type: 'power_zone',
          timing: 'pre_lift',
          durationMin: 30,
          intensity: 'Zone 2–3 (current setup)',
          notes: 'Keep existing protocol. The current 30 min Power Zone pre-Chest+Tri is well-calibrated.',
        },
      },
      tuesday: {
        liftDay: 'Day 2 — Back + Biceps',
        cardio: null,
        notes: 'No cardio. Allow full recovery from Monday double session.',
      },
      wednesday: {
        liftDay: 'Rest',
        cardio: {
          type: 'zone2_liss',
          timing: 'standalone',
          durationMin: 35,
          intensity: 'Zone 2',
          notes: 'Mid-week Zone 2 session. Primary aerobic base + fat burn day.',
        },
      },
      thursday: {
        liftDay: 'Day 3 — Shoulders + Arms',
        cardio: {
          type: 'power_zone',
          timing: 'pre_lift',
          durationMin: 30,
          intensity: 'Zone 2–3 (current setup)',
          notes: 'Keep existing protocol.',
        },
      },
      friday: {
        liftDay: 'Rest',
        cardio: {
          type: 'pz_endurance',
          timing: 'standalone',
          durationMin: 30,
          intensity: 'Zone 2–3',
          notes: 'Power Zone Endurance ride. Good variety from Zone 2 LISS.',
        },
      },
      saturday: {
        liftDay: 'Day 4 — Chest + Back',
        cardio: null,
        notes: 'No cardio. Saturday is a high-volume superset day.',
      },
      sunday: {
        liftDay: 'Rest',
        cardio: {
          type: 'active_recovery',
          timing: 'standalone',
          durationMin: 25,
          intensity: 'Zone 1',
          notes: 'Easy active recovery only.',
        },
      },
    },
    weeklyTotals: {
      cardioMinutes: 150,
      estimatedCalBurn: 1350,
      cardioSessions: 5,
      liftSessions: 4,
    },
    recoveryNotes:
      'This is the recommended default schedule. Represents current setup (Mon+Thu pre-lift) ' +
      'with Wed and Fri cardio added. Well within research-supported safe range for concurrent training.',
  },
};

// ─── 6. AUTO-REGULATION FOR CARDIO ───────────────────────────────────────────

export const CARDIO_AUTO_REGULATION = {
  overview:
    'Auto-regulation means adjusting cardio volume and intensity in real-time based on ' +
    'objective recovery markers rather than a rigid schedule. This prevents overtraining ' +
    'and allows the body to signal when it needs more or less stimulus.',

  // Signs to reduce cardio volume
  reduceCardioSignals: [
    {
      marker: 'Resting Heart Rate elevated',
      threshold: '+5 bpm above personal baseline for 2+ consecutive days',
      action: 'Cut all cardio to Zone 1 active recovery only for 3–5 days',
      notes: 'RHR is a simple daily marker. Measure first thing in the morning before getting up.',
    },
    {
      marker: 'HRV decreased',
      threshold: 'HRV more than 1 standard deviation below your rolling 7-day average',
      action: 'Reduce cardio intensity by one zone; skip any Zone 3+ sessions',
      notes: 'HRV reflects autonomic nervous system recovery. Peloton and most fitness wearables now track this.',
    },
    {
      marker: 'Lifting performance declining',
      threshold: 'Unable to match previous weights or reps for 2+ sessions in a row',
      action: 'Eliminate all post-lift cardio and reduce pre-lift cardio to 20 min Zone 2',
      notes:
        'Strength decline is the most direct signal that recovery is insufficient. ' +
        'Cardio volume is often the easiest variable to reduce without disrupting the lifting program.',
    },
    {
      marker: 'Persistent fatigue / motivation loss',
      threshold: 'Subjective fatigue score ≥ 7/10 for 3+ days',
      action: 'Full rest day or Zone 1 only. Reassess total weekly training load.',
      notes: 'Perceived fatigue is a validated predictor of overtraining in concurrent trainees.',
    },
    {
      marker: 'Sleep quality declining',
      threshold: 'Consistent poor sleep (< 7h or frequent waking) for 3+ nights',
      action: 'Reduce all cardio intensity; no Zone 3+ until sleep normalizes',
      notes: 'Sleep is when adaptation occurs. High cardio volume + poor sleep is the fastest path to overtraining.',
    },
  ],

  // HRV as a recovery metric
  hrv: {
    description:
      'Heart Rate Variability measures the millisecond variation between consecutive heartbeats. ' +
      'Higher HRV = better parasympathetic tone = better recovered. Lower HRV = sympathetic dominance = stress.',
    howToMeasure:
      'Use Peloton HR monitor + Apple Watch / Garmin / WHOOP. Best measured immediately upon waking, ' +
      'before getting out of bed, for 2–5 minutes.',
    interpretationGuide: {
      green: 'HRV at or above 7-day average — proceed with planned cardio',
      yellow: 'HRV 1 SD below average — reduce intensity to Zone 1–2, skip Zone 4+',
      red: 'HRV 2+ SD below average — active recovery only or full rest',
    },
    practicalNote:
      'Build a 2-week baseline before relying on HRV for decisions. Individual HRV varies widely — ' +
      'a score of 45 ms might be excellent for one person and low for another.',
  },

  // Resting HR as fatigue indicator
  restingHR: {
    description: 'Elevated RHR indicates the cardiovascular system is under accumulated stress.',
    baseline: 'Establish your personal baseline over 2 weeks of consistent measurement.',
    thresholds: {
      normal: 'Within 3 bpm of baseline — proceed normally',
      caution: '+3–5 bpm above baseline — reduce cardio to Zone 1–2 and monitor',
      reduce: '+5–8 bpm above baseline — cut cardio volume by 50% for 2–3 days',
      rest: '+8+ bpm above baseline — full rest or Zone 1 only; consider illness or significant overtraining',
    },
    measurementTip: 'Measure at the same time daily (ideally morning, lying in bed). ' +
                    'Alcohol, illness, and travel confound RHR — account for these variables.',
  },

  // Adjusting cardio based on strength trends
  strengthPerformanceTrends: {
    progressingWell: {
      condition: 'Hitting or exceeding target reps/weights over 2+ weeks',
      cardioAdjustment: 'Safe to add 10–15% more cardio volume. Introduce Wednesday or Friday cardio if not already doing it.',
    },
    plateaued: {
      condition: 'Stalled at same weights for 2–3 weeks despite proper nutrition',
      cardioAdjustment:
        'Evaluate if cardio is the limiting factor. Try reducing cardio by 30% for 2 weeks. ' +
        'If strength improves, cardio volume was too high.',
    },
    declining: {
      condition: 'Unable to match previous performance — weights or reps dropping',
      cardioAdjustment:
        'Immediately reduce to minimum cardio (pre-lift warmup only, Zone 2). ' +
        'Hold at minimum for 7–10 days. If strength recovers, build cardio back slowly.',
    },
  },
};

// ─── 7. PELOTON-SPECIFIC PROTOCOLS ───────────────────────────────────────────

export const PELOTON_PROTOCOLS = {
  // FTP Zone Definitions (standard power-based zones)
  ftpZones: {
    zone1: {
      number: 1,
      name: 'Active Recovery',
      pctFTP: { min: 0, max: 55 },
      pctHRmax: { min: 50, max: 60 },
      feel: 'Effortless. Could talk normally.',
      use: 'Warm-up, cool-down, recovery days',
    },
    zone2: {
      number: 2,
      name: 'Endurance',
      pctFTP: { min: 56, max: 75 },
      pctHRmax: { min: 60, max: 70 },
      feel: 'Comfortable. Full sentences.',
      use: 'Base building, fat burning, pre-lift warmup, rest day cardio',
    },
    zone3: {
      number: 3,
      name: 'Tempo',
      pctFTP: { min: 76, max: 90 },
      pctHRmax: { min: 70, max: 80 },
      feel: 'Comfortably hard. Short phrases.',
      use: 'Aerobic capacity, Power Zone rides, upper limit for pre-lift cardio',
    },
    zone4: {
      number: 4,
      name: 'Lactate Threshold',
      pctFTP: { min: 91, max: 105 },
      pctHRmax: { min: 80, max: 90 },
      feel: 'Hard. Can barely speak.',
      use: 'FTP improvement, VO2max development — NOT recommended before lifting',
    },
    zone5: {
      number: 5,
      name: 'VO2 Max',
      pctFTP: { min: 106, max: 120 },
      pctHRmax: { min: 90, max: 95 },
      feel: 'Very hard. Single words.',
      use: 'Anaerobic capacity — standalone sessions only',
    },
    zone6: {
      number: 6,
      name: 'Anaerobic Capacity',
      pctFTP: { min: 121, max: 150 },
      pctHRmax: { min: 95, max: 100 },
      feel: 'Near maximum effort.',
      use: 'Power Zone Max, HIIT — 24h recovery required',
    },
    zone7: {
      number: 7,
      name: 'Neuromuscular Power',
      pctFTP: { min: 150, max: 999 },
      pctHRmax: { min: 100, max: 100 },
      feel: 'Maximum sprint effort.',
      use: 'Sprints only — not applicable to 30-min concurrent training rides',
    },
  },

  // FTP Testing
  ftpTesting: {
    method: '20-Minute FTP Test',
    protocol:
      '10 min warm-up at Zone 2 → 20 min all-out effort → take average power × 0.95 = FTP. ' +
      'Peloton offers guided FTP tests on-demand.',
    frequency: 'Every 6–8 weeks, or when current zones feel consistently too easy or too hard.',
    importance:
      'Accurate FTP is essential for zone-based training. Zones calculated off an outdated FTP ' +
      'mean pre-lift cardio may actually be Zone 4+ without you realizing it.',
    alternativeTest: '8-min FTP test (average power × 0.90) for less experienced riders',
  },

  // Best Peloton rides for pre-workout warmup
  preWorkoutRides: {
    recommended: [
      {
        format: 'Power Zone Endurance — 20 or 30 min',
        reason:
          'Stays in Zones 2–3. Structured but not taxing. ' +
          'Available at 20, 30, 45, 60, and 90-min lengths. Use 20–30 min pre-lift.',
        instructors: ['Matt Wilpers', 'Christine D\'Ercole'],
        pelotonZones: [2, 3],
        preLiftMod: 'Ride as programmed — these are already designed for Zone 2–3.',
      },
      {
        format: 'Power Zone — 30 min (current setup)',
        reason:
          'Good variety. Includes Zone 4+ intervals — deliberately soft-pedal those segments ' +
          'to stay in Zone 3 max when using as pre-lift warmup.',
        instructors: ['Matt Wilpers', 'Denis Morton', 'Ben Alldis'],
        pelotonZones: [2, 3, 4],
        preLiftMod: 'Cap output at Zone 3 during all interval peaks. Treat Zone 4 targets as Zone 3 efforts.',
      },
      {
        format: 'Cycling Warm-Up — 10 or 15 min',
        reason: 'Designed as a warmup. Pure Zone 1–2. Best option if pressed for time.',
        instructors: ['Various'],
        pelotonZones: [1, 2],
        preLiftMod: 'No modification needed.',
      },
    ],
    avoid: [
      {
        format: 'Power Zone Max — any length',
        reason: 'Zone 4–6 intervals will impair lifting. Save for standalone days.',
      },
      {
        format: 'HIIT Cardio rides',
        reason: 'Glycolytic and neuromuscular fatigue — incompatible with pre-lift use.',
      },
      {
        format: 'Tabata rides',
        reason: 'Maximum intensity intervals. NEVER before lifting.',
      },
    ],
  },

  // Best Peloton rides for recovery days
  recoveryDayRides: {
    recommended: [
      {
        format: 'Power Zone Endurance — 45 or 60 min',
        reason: 'The gold standard Zone 2 session. Builds aerobic base over time.',
        instructors: ['Matt Wilpers', 'Christine D\'Ercole'],
        pelotonZones: [2, 3],
      },
      {
        format: 'Cycling Cool Down — 5 or 10 min',
        reason: 'Active recovery after lifting or for low-energy days.',
        instructors: ['Various'],
        pelotonZones: [1],
      },
      {
        format: 'Low Impact Ride — 20 or 30 min',
        reason:
          'No-standing format. Pure seated work keeps heart rate consistent and lower. ' +
          'Good for joint recovery days.',
        instructors: ['Hannah Corbin', 'Olivia Amato'],
        pelotonZones: [1, 2],
      },
    ],
  },

  // Power Zone Endurance vs Power Zone Max comparison
  pzeVsPzmax: {
    powerZoneEndurance: {
      name: 'Power Zone Endurance (PZE)',
      zones: [2, 3],
      ftpRange: '56–90%',
      duration: '45–90 min typical',
      goal: 'Aerobic base, fat oxidation, mitochondrial density, recovery',
      whenToUse: [
        'Rest day cardio (Wed, Fri)',
        'Active recovery following heavy weeks',
        'When body composition is the primary cardio goal',
        'Any time you want cardio that does not interfere with lifting',
      ],
      interferenceRisk: 'low',
      concurrentTrainingRole: 'The primary cardio modality for concurrent trainees. Use it freely on non-lifting days.',
    },
    powerZoneMax: {
      name: 'Power Zone Max (PZM)',
      zones: [4, 5, 6, 7],
      ftpRange: '91–150%+',
      duration: '30–60 min typical',
      goal: 'VO2max, anaerobic threshold, peak power output',
      whenToUse: [
        'Standalone sessions on pure cardio days only',
        'When FTP improvement is a primary goal alongside (not secondary to) lifting',
        'Maximum 1x/week in a concurrent training program',
        'Not recommended during hypertrophy-focused mesocycles',
      ],
      interferenceRisk: 'very_high',
      concurrentTrainingRole:
        'Use sparingly or not at all during dedicated muscle-building phases. ' +
        'Reserve for maintenance phases or cycling-specific fitness goals.',
    },
    decision_guide: [
      { goal: 'Fat loss + muscle maintenance', choice: 'PZE 3–5x/week' },
      { goal: 'Maximum muscle hypertrophy', choice: 'PZE 2–3x/week, no PZM' },
      { goal: 'Cardiovascular fitness improvement', choice: 'PZE 3x + PZM 1x/week' },
      { goal: 'Pre-lift warmup', choice: 'PZE or PZ (Zone 2–3 only) — never PZM' },
      { goal: 'Recovery day', choice: 'PZE (low output) or Low Impact Ride' },
    ],
  },
};

// ─── 8. CARDIO SESSION DATABASE ───────────────────────────────────────────────
// Flat array of session templates for auto-scheduling logic

export const CARDIO_SESSION_TEMPLATES = [
  {
    id: 'pre_lift_warmup_z2',
    name: 'Pre-Lift Warmup (Zone 2)',
    type: 'zone2_liss',
    durationMin: 20,
    pelotonZones: [1, 2],
    pctFTP: { max: 75 },
    timing: 'pre_lift',
    compatibleLiftDays: ['day1', 'day2', 'day3', 'day4'],
    interferenceRisk: 'none',
    goal: ['warmup', 'muscle_building'],
  },
  {
    id: 'pre_lift_pz_30',
    name: 'Pre-Lift Power Zone (30 min)',
    type: 'power_zone',
    durationMin: 30,
    pelotonZones: [2, 3],
    pctFTP: { max: 90 },
    timing: 'pre_lift',
    compatibleLiftDays: ['day1', 'day3'], // upper body only
    interferenceRisk: 'low',
    goal: ['cardio_fitness', 'fat_loss', 'warmup'],
    notes: 'Current Mon + Thu setup. Do not use before Day 2 (back) or Day 4 (chest+back) without reducing to 20 min Zone 2.',
  },
  {
    id: 'post_lift_cooldown_z1',
    name: 'Post-Lift Cooldown (Zone 1)',
    type: 'active_recovery',
    durationMin: 15,
    pelotonZones: [1],
    pctFTP: { max: 55 },
    timing: 'post_lift',
    compatibleLiftDays: ['day1', 'day2', 'day3', 'day4'],
    interferenceRisk: 'none',
    goal: ['fat_loss', 'recovery'],
  },
  {
    id: 'post_lift_z2_20',
    name: 'Post-Lift Zone 2 (20 min)',
    type: 'zone2_liss',
    durationMin: 20,
    pelotonZones: [2],
    pctFTP: { min: 56, max: 75 },
    timing: 'post_lift',
    compatibleLiftDays: ['day2'], // best on Tue (no pre-lift cardio that day)
    interferenceRisk: 'low',
    goal: ['fat_loss'],
    notes: 'Exploits elevated post-lift fat oxidation. Best on Tuesday — no pre-lift cardio that day.',
  },
  {
    id: 'rest_day_z2_35',
    name: 'Rest Day Zone 2 (35 min)',
    type: 'zone2_liss',
    durationMin: 35,
    pelotonZones: [2],
    pctFTP: { min: 56, max: 75 },
    timing: 'standalone',
    compatibleDays: ['wednesday', 'friday', 'sunday'],
    interferenceRisk: 'none',
    goal: ['fat_loss', 'balanced', 'cardio_fitness'],
  },
  {
    id: 'rest_day_pze_45',
    name: 'Power Zone Endurance (45 min)',
    type: 'pz_endurance',
    durationMin: 45,
    pelotonZones: [2, 3],
    pctFTP: { min: 56, max: 90 },
    timing: 'standalone',
    compatibleDays: ['wednesday', 'friday'],
    interferenceRisk: 'none',
    goal: ['fat_loss', 'cardio_fitness'],
    notes: 'Best standalone cardio session for concurrent trainees. High aerobic benefit, low interference.',
  },
  {
    id: 'active_recovery_20',
    name: 'Active Recovery Spin (20 min)',
    type: 'active_recovery',
    durationMin: 20,
    pelotonZones: [1],
    pctFTP: { max: 55 },
    timing: 'standalone',
    compatibleDays: ['sunday', 'wednesday', 'friday'],
    interferenceRisk: 'none',
    goal: ['recovery', 'muscle_building'],
    notes: 'For low-energy or high-fatigue days. No training stimulus — pure recovery.',
  },
  {
    id: 'pz_max_standalone',
    name: 'Power Zone Max (45 min)',
    type: 'pz_max',
    durationMin: 45,
    pelotonZones: [4, 5, 6],
    pctFTP: { min: 91, max: 120 },
    timing: 'standalone',
    compatibleDays: ['wednesday'], // mid-week only, away from Mon+Thu lifts
    interferenceRisk: 'high',
    goal: ['cardio_fitness'],
    notes: 'Use only when cardio fitness is a primary goal. Requires 24h recovery. Not recommended during hypertrophy phases.',
    restrictions: ['fat_loss', 'muscle_building'], // not compatible with these priority goals
  },
];

// ─── Auto-Scheduling Helper ───────────────────────────────────────────────────

/**
 * Filter cardio session templates appropriate for a given context.
 * @param {Object} options
 * @param {'pre_lift'|'post_lift'|'standalone'} options.timing - When in the day
 * @param {'day1'|'day2'|'day3'|'day4'|null} options.liftDay - Which lift day (null = rest day)
 * @param {string} options.dayOfWeek - e.g. 'wednesday'
 * @param {'fat_loss'|'muscle_building'|'balanced'} options.goal - Training priority
 * @param {'low'|'moderate'|'high'} options.fatigueLevel - Current fatigue state
 * @returns {Array} Filtered and sorted session templates
 */
export function getCardioRecommendations({ timing, liftDay, dayOfWeek, goal, fatigueLevel = 'low' }) {
  let templates = CARDIO_SESSION_TEMPLATES.filter((t) => {
    // Match timing
    if (t.timing !== timing) return false;

    // For pre/post-lift, check lift day compatibility
    if (timing === 'pre_lift' || timing === 'post_lift') {
      if (!liftDay || !t.compatibleLiftDays?.includes(liftDay)) return false;
    }

    // For standalone, check day of week
    if (timing === 'standalone') {
      if (!t.compatibleDays?.includes(dayOfWeek?.toLowerCase())) return false;
    }

    // Check goal compatibility
    if (t.restrictions?.includes(goal)) return false;
    if (goal && t.goal && !t.goal.includes(goal) && !t.goal.includes('recovery')) return false;

    return true;
  });

  // Filter by fatigue level
  if (fatigueLevel === 'high') {
    templates = templates.filter((t) =>
      t.interferenceRisk === 'none' || t.pelotonZones?.every((z) => z <= 2)
    );
  } else if (fatigueLevel === 'moderate') {
    templates = templates.filter((t) => t.interferenceRisk !== 'high' && t.interferenceRisk !== 'very_high');
  }

  // Sort: lower interference first, then shorter duration
  templates.sort((a, b) => {
    const riskOrder = { none: 0, low: 1, low_to_moderate: 2, moderate: 3, high: 4, very_high: 5 };
    const riskDiff = (riskOrder[a.interferenceRisk] || 0) - (riskOrder[b.interferenceRisk] || 0);
    if (riskDiff !== 0) return riskDiff;
    return a.durationMin - b.durationMin;
  });

  return templates;
}

/**
 * Get the appropriate weekly schedule based on training priority.
 * @param {'fat_loss'|'muscle_building'|'balanced'} goal
 * @returns {Object} Weekly cardio schedule
 */
export function getWeeklyCardioSchedule(goal) {
  return WEEKLY_CARDIO_SCHEDULES[goal] ?? WEEKLY_CARDIO_SCHEDULES.balanced;
}

/**
 * Determine cardio adjustment based on fatigue markers.
 * @param {Object} markers
 * @param {number} markers.rhrDelta - RHR above personal baseline in bpm
 * @param {number} markers.hrvSDs - HRV standard deviations below rolling average (positive = below)
 * @param {boolean} markers.strengthDecline - True if strength is trending down
 * @returns {{ level: string, recommendation: string, action: string }}
 */
export function getFatigueAdjustment({ rhrDelta = 0, hrvSDs = 0, strengthDecline = false }) {
  if (rhrDelta >= 8 || hrvSDs >= 2 || strengthDecline) {
    return {
      level: 'high',
      recommendation: 'Significant fatigue detected. Reduce all cardio immediately.',
      action: 'active_recovery_only',
      cardioZoneMax: 1,
    };
  }
  if (rhrDelta >= 5 || hrvSDs >= 1) {
    return {
      level: 'moderate',
      recommendation: 'Elevated fatigue. Reduce cardio intensity and volume.',
      action: 'zone2_only',
      cardioZoneMax: 2,
    };
  }
  if (rhrDelta >= 3) {
    return {
      level: 'low_caution',
      recommendation: 'Mild fatigue. Monitor and keep cardio to Zone 2–3 max.',
      action: 'monitor',
      cardioZoneMax: 3,
    };
  }
  return {
    level: 'normal',
    recommendation: 'Recovery looks good. Proceed with planned cardio.',
    action: 'proceed',
    cardioZoneMax: 7,
  };
}
