import { TrainingType } from '../types/models';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  id: string;
  name: string;
  type: TrainingType;
  difficulty: Difficulty;
  targetMuscle: string;
  description: string;
  coachTip: string;
  imageSource: any;
  workout: {
    hangTime: number;
    restTime: number;
    reps: number;
    sets: number;
    recoverTime: number;
  };
}

// Images pre-required so Metro bundler can resolve them statically
const IMAGES = {
  // Fingerboard grips
  open_hand:    require('../assets/exercises/open_hand.png'),
  half_crimp:   require('../assets/exercises/half_crimp.png'),
  full_crimp:   require('../assets/exercises/full_crimp.png'),
  pinch:        require('../assets/exercises/pinch.png'),
  sloper:       require('../assets/exercises/sloper.png'),
  two_finger:   require('../assets/exercises/two_finger.png'),
  // Campus
  campus_board: require('../assets/exercises/campus_board.png'),
  // Flexibility
  wrist_flexion:      require('../assets/exercises/wrist_flexion.png'),
  wrist_extension:    require('../assets/exercises/wrist_extension.png'),
  forearm_stretch:    require('../assets/exercises/forearm_stretch.png'),
  hip_flexor:         require('../assets/exercises/hip_flexor.png'),
  hamstring:          require('../assets/exercises/hamstring.png'),
  shoulder_cross:     require('../assets/exercises/shoulder_cross.png'),
  chest_open:         require('../assets/exercises/chest_open.png'),
  lat_stretch:        require('../assets/exercises/lat_stretch.png'),
  hip_rotation:       require('../assets/exercises/hip_rotation.png'),
  calf_stretch:       require('../assets/exercises/calf_stretch.png'),
  thoracic_rotation:  require('../assets/exercises/thoracic_rotation.png'),
};

export const EXERCISES: Exercise[] = [
  // ── FINGERBOARD ──────────────────────────────────────────────────────────
  {
    id: 'fb-open-hand',
    name: 'Open Hand Hang',
    type: 'fingerboard',
    difficulty: 'easy',
    targetMuscle: 'Finger flexors (safe for all)',
    description: 'Fingers extended with only a slight curve at the DIP joint. The safest and most recommended grip for all levels.',
    coachTip: 'Start every fingerboard session with open hand. 60–70% effort only. If your forearm is fully pumped, you\'re going too hard.',
    imageSource: IMAGES.open_hand,
    workout: { hangTime: 7, restTime: 53, reps: 6, sets: 3, recoverTime: 180 },
  },
  {
    id: 'fb-half-crimp',
    name: 'Half Crimp',
    type: 'fingerboard',
    difficulty: 'medium',
    targetMuscle: 'Finger flexors & A2 pulley',
    description: 'Middle joints at ~90°, DIP joint stays straight. Thumb alongside (not over) the index finger. The strongest and safest crimp variant.',
    coachTip: 'This is the position you\'ll use most on rock. Keep the DIP joint straight — if it bends, you\'re crimping too hard or the edge is too small.',
    imageSource: IMAGES.half_crimp,
    workout: { hangTime: 7, restTime: 53, reps: 6, sets: 4, recoverTime: 180 },
  },
  {
    id: 'fb-full-crimp',
    name: 'Full Crimp',
    type: 'fingerboard',
    difficulty: 'hard',
    targetMuscle: 'Finger flexors (high A2 pulley stress)',
    description: 'All finger joints fully bent, thumb wrapped over index finger. Highest force generation but also highest injury risk.',
    coachTip: 'CAUTION: highest A2 pulley injury risk of all grips. Only train full crimp if you have 6+ months of structured fingerboard training. Never do it cold.',
    imageSource: IMAGES.full_crimp,
    workout: { hangTime: 5, restTime: 115, reps: 4, sets: 2, recoverTime: 240 },
  },
  {
    id: 'fb-pinch',
    name: 'Pinch Strength',
    type: 'fingerboard',
    difficulty: 'medium',
    targetMuscle: 'Thumb adductor & finger flexors',
    description: 'Squeeze a wide hold between thumb and opposing fingers. Trains the thumb muscles often neglected by crimp-only training.',
    coachTip: 'Pinch strength is often the limiting factor on slopers and certain boulder moves. Use a weight plate or pinch block. Squeeze like you\'re making juice.',
    imageSource: IMAGES.pinch,
    workout: { hangTime: 8, restTime: 52, reps: 5, sets: 3, recoverTime: 180 },
  },
  {
    id: 'fb-sloper',
    name: 'Sloper Hold',
    type: 'fingerboard',
    difficulty: 'medium',
    targetMuscle: 'Shoulder stabilisers & open-hand flexors',
    description: 'Open hand on a rounded, positive-less hold. No defined edge to crimp — pure friction and shoulder engagement.',
    coachTip: 'Slopers require fully open hand and active shoulder depression (pull shoulders down). If your shoulders are hunched up, you\'ll slide off.',
    imageSource: IMAGES.sloper,
    workout: { hangTime: 10, restTime: 50, reps: 5, sets: 3, recoverTime: 180 },
  },
  {
    id: 'fb-two-finger',
    name: 'Two-Finger Pocket',
    type: 'fingerboard',
    difficulty: 'hard',
    targetMuscle: 'Index/middle flexors & A2 pulley',
    description: 'Index and middle fingers only, on a two-finger pocket. Develops the specific strength for pocket climbing routes.',
    coachTip: 'Requires 1+ year of structured training. Never attempt with cold or tired fingers. The A2 pulley stress is extreme. Use a pulley system to reduce load if needed.',
    imageSource: IMAGES.two_finger,
    workout: { hangTime: 5, restTime: 115, reps: 4, sets: 2, recoverTime: 300 },
  },

  // ── CAMPUS BOARD ─────────────────────────────────────────────────────────
  {
    id: 'campus-matching',
    name: 'Matching Moves',
    type: 'campus',
    difficulty: 'easy',
    targetMuscle: 'Contact strength & coordination',
    description: 'Move up one rung at a time, matching both hands on each rung before moving. Footless throughout. Builds basic campus coordination.',
    coachTip: 'The goal is moving without feet, not going fast. Control the catch on each rung — don\'t just fall onto it. Matching trains you to stay calm under dynamic movement.',
    imageSource: IMAGES.campus_board,
    workout: { hangTime: 8, restTime: 112, reps: 5, sets: 3, recoverTime: 240 },
  },
  {
    id: 'campus-laddering',
    name: 'Basic Laddering (1-2-3)',
    type: 'campus',
    difficulty: 'medium',
    targetMuscle: 'Contact strength & power endurance',
    description: 'Left hand on rung 1, right on 2, left on 3 — alternating hands, moving up. The foundation of campus board training. Start small (rungs 1-2-3).',
    coachTip: 'Never campus when tired — you train bad movement patterns and risk injury. Do campus FIRST in a session, before any climbing or hangboard. Quality over quantity.',
    imageSource: IMAGES.campus_board,
    workout: { hangTime: 6, restTime: 174, reps: 4, sets: 3, recoverTime: 300 },
  },
  {
    id: 'campus-135',
    name: '1-3-5 Skip Ladders',
    type: 'campus',
    difficulty: 'hard',
    targetMuscle: 'Explosive power & contact strength',
    description: 'Start on rung 1, skip to rung 3, then 5 — one hand at a time. Each move skips a rung, demanding much more explosive power.',
    coachTip: 'This is serious training. Full rest between attempts (4+ min). Stop the session if you miss the same move twice — tired nervous system won\'t adapt, it just gets injured.',
    imageSource: IMAGES.campus_board,
    workout: { hangTime: 5, restTime: 235, reps: 4, sets: 3, recoverTime: 360 },
  },
  {
    id: 'campus-double-dynos',
    name: 'Double Dynos',
    type: 'campus',
    difficulty: 'hard',
    targetMuscle: 'Explosive power & lock-off',
    description: 'From matched position on a rung, explode upward and catch a rung higher with both hands simultaneously. Develops raw explosive power.',
    coachTip: 'This is for advanced campus trainers only. The catch with both hands at once creates extreme loading. If you can\'t lock off for 3 seconds after the catch, you\'re not ready.',
    imageSource: IMAGES.campus_board,
    workout: { hangTime: 4, restTime: 236, reps: 3, sets: 3, recoverTime: 360 },
  },
  {
    id: 'campus-lockoff',
    name: 'Lock-Off Training',
    type: 'campus',
    difficulty: 'medium',
    targetMuscle: 'Bicep, lats & lock-off strength',
    description: 'Move to a rung and hold a 90° arm position (lock-off) for as long as possible before moving up. Develops the ability to pull through hard moves.',
    coachTip: 'Lock-off strength is what separates climbers who can reach past a crux hold. Hold each lock-off for a full 3 seconds, don\'t rush to the next rung.',
    imageSource: IMAGES.campus_board,
    workout: { hangTime: 6, restTime: 174, reps: 5, sets: 3, recoverTime: 240 },
  },

  // ── FLEXIBILITY ───────────────────────────────────────────────────────────
  {
    id: 'flex-wrist-flexion',
    name: 'Wrist Flexion Stretch',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Wrist extensors (top of forearm)',
    description: 'Arm extended forward, palm facing down, bend the wrist downward. Use the other hand to gently increase the stretch.',
    coachTip: 'Hold at the point of tension, never pain. This is often tight after heavy fingerboard sessions. Daily practice prevents wrist tendinopathy.',
    imageSource: IMAGES.wrist_flexion,
    workout: { hangTime: 30, restTime: 15, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-wrist-extension',
    name: 'Wrist Extension Stretch',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Wrist & finger flexors (climbing muscles!)',
    description: 'Arm extended, palm facing outward, bend the wrist back toward you. This stretches the muscles that get most pumped climbing.',
    coachTip: 'THE most important stretch for climbers. These are the muscles that fail on a hard route. Do this every day, before and after climbing. Breathe deeply through the stretch.',
    imageSource: IMAGES.wrist_extension,
    workout: { hangTime: 40, restTime: 15, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-forearm',
    name: 'Overhead Tricep & Lat',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Tricep & latissimus dorsi',
    description: 'Raise one arm, bend elbow behind head. Use other hand to gently push the elbow back and down. Hold the deepest comfortable position.',
    coachTip: 'Tight lats restrict high arm positions and reduce pulling efficiency. This stretch improves your ability to reach past your limit and mantleshelf comfortably.',
    imageSource: IMAGES.forearm_stretch,
    workout: { hangTime: 35, restTime: 15, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-hip-flexor',
    name: 'Hip Flexor Lunge',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Hip flexors & psoas',
    description: 'Low lunge position, back knee on the ground. Sink the hips forward and down. Keep torso upright to maximize the stretch.',
    coachTip: 'Tight hip flexors kill your high-step technique on steep terrain. This is the #1 overlooked stretch for climbers. Do this daily — each side 2 minutes minimum for real change.',
    imageSource: IMAGES.hip_flexor,
    workout: { hangTime: 45, restTime: 15, reps: 2, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-hamstring',
    name: 'Hamstring Stretch',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Hamstrings & calf',
    description: 'Sit on the floor, legs straight. Reach forward over your legs, keeping your back as flat as possible. Let gravity do the work.',
    coachTip: 'Tight hamstrings prevent high foot placements and limit stemming. Don\'t round your back — hinge from the hips. Flex your quads slightly to deepen the hamstring stretch.',
    imageSource: IMAGES.hamstring,
    workout: { hangTime: 45, restTime: 15, reps: 2, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-shoulder-cross',
    name: 'Cross-Body Shoulder',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Posterior deltoid & rotator cuff',
    description: 'Pull one straight arm across your chest with the opposite hand. Feel the stretch in the back of the shoulder.',
    coachTip: 'Posterior shoulder tightness is very common in climbers from all the pulling movements. This counteracts it. Do after every climbing session.',
    imageSource: IMAGES.shoulder_cross,
    workout: { hangTime: 30, restTime: 10, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-chest-open',
    name: 'Chest Opening',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Pectorals & anterior deltoid',
    description: 'Clasp hands behind your back, squeeze shoulder blades together, lift arms slightly. Open the chest forward. Hold at peak expansion.',
    coachTip: 'Climbers develop tight, hunched pectorals from constant pulling. This stretch is the direct antidote. Do it morning and evening. Your posture and shoulder health will thank you.',
    imageSource: IMAGES.chest_open,
    workout: { hangTime: 30, restTime: 10, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-lat',
    name: 'Lat / Side Stretch',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Latissimus dorsi & obliques',
    description: 'Arms overhead, clasp hands, lean to one side. Keep hips stable. Feel the long stretch down your side from wrist to hip.',
    coachTip: 'The lats are your biggest pulling muscle — stretching them improves pull-up range and shoulder health. Lean slowly and breathe into the stretch on the elongated side.',
    imageSource: IMAGES.lat_stretch,
    workout: { hangTime: 40, restTime: 15, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-hip-rotation',
    name: 'Hip External Rotation',
    type: 'flexibility',
    difficulty: 'medium',
    targetMuscle: 'Piriformis, glutes & hip capsule',
    description: 'Seated figure-4: cross one ankle over the opposite knee. Sit tall, lean forward slightly. Press gently on the crossed knee to deepen the stretch.',
    coachTip: 'This is the #1 stretch for smearing, stemming, and high footwork in chimneys. Tight hips force you onto bad body positions. Progress slowly — piriformis can spasm if pushed too hard.',
    imageSource: IMAGES.hip_rotation,
    workout: { hangTime: 45, restTime: 15, reps: 2, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-calf',
    name: 'Calf & Ankle Stretch',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Gastrocnemius, soleus & Achilles',
    description: 'Stand with toes on a step or doorstep edge, heel hanging below. Lower your heel slowly. Can also be done with a straight knee (gastrocnemius) or bent knee (soleus).',
    coachTip: 'Ankle flexibility is crucial for smearing and edging on steep ground. Tight calves limit your foot placements. Combine with bent-knee version (30s each) to get both calf muscles.',
    imageSource: IMAGES.calf_stretch,
    workout: { hangTime: 30, restTime: 15, reps: 3, sets: 2, recoverTime: 30 },
  },
  {
    id: 'flex-thoracic',
    name: 'Thoracic Rotation',
    type: 'flexibility',
    difficulty: 'easy',
    targetMuscle: 'Thoracic spine & intercostals',
    description: 'Seated cross-legged, twist your torso and look over one shoulder. Use your opposite arm pressed against your knee to deepen the rotation.',
    coachTip: 'A mobile thoracic spine lets you twist into rest positions, reach holds from better angles, and prevents lower back pain. Most climbers have stiff T-spines from hunched posture.',
    imageSource: IMAGES.thoracic_rotation,
    workout: { hangTime: 30, restTime: 10, reps: 3, sets: 2, recoverTime: 30 },
  },
];

export const EXERCISES_BY_TYPE = (type: TrainingType) =>
  EXERCISES.filter(e => e.type === type);

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy:   '#2ed573',
  medium: '#ffa502',
  hard:   '#ff4757',
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy:   'BEGINNER',
  medium: 'INTERMEDIATE',
  hard:   'ADVANCED',
};

export interface ExerciseTranslation {
  name?: string;
  targetMuscle?: string;
  description?: string;
  coachTip?: string;
}

const KA: Record<string, ExerciseTranslation> = {
  'fb-open-hand': {
    name: 'ღია ხელის ჩამოკიდება',
    targetMuscle: 'თითის მომხრელი კუნთები (უსაფრთხო ყველასთვის)',
    description: 'გაშლილი თითები DIP სახსარში მცირე მოხრით. ყველაზე უსაფრთხო და რეკომენდებული ჩამოკიდება ყველა დონისთვის.',
    coachTip: 'ყოველი ჰანგბორდ სეანსი ღია ხელით დაიწყე. 60-70% ძალისხმევა. სრულად გამოგიმტვრია წინამხარი — ძალიან ინტენსიური.',
  },
  'fb-half-crimp': {
    name: 'Half Crimp',
    targetMuscle: 'თითის მომხრელი კუნთები და A2 პულე',
    description: 'შუა სახსრები ~90°-ზე, DIP სახსარი სწორი. ცერა გვერდით. ყველაზე ძლიერი და უსაფრთხო crimp ვარიანტი.',
    coachTip: 'ეს კლდეზე ყველაზე ხშირი პოზიციაა. DIP სწორი შეინარჩუნე — მოხრა ნიშნავს ძალიან მკვეთრ ჩამოკიდებას ან edge ძალიან პატარაა.',
  },
  'fb-full-crimp': {
    name: 'Full Crimp',
    targetMuscle: 'თითის მომხრელები (მაღალი A2 სტრესი)',
    description: 'ყველა სახსარი სრულად მოხრილი, ცერა ინდექსზე. უმაღლესი ძალის გამომუშავება, მაგრამ ყველაზე მაღალი ტრავმის რისკი.',
    coachTip: 'გაფრთხილება: ყველაზე მაღალი A2 ტრავმის რისკი. მხოლოდ 6+ თვის სტრუქტ. ვარჯიშის შემდეგ. არასდროს ცივი წინამხრით.',
  },
  'fb-pinch': {
    name: 'Pinch სიძლიერე',
    targetMuscle: 'ცერის შემომყვანი კუნთი და თითის მომხრელები',
    description: 'ფართო hold-ს ჩაკუმშვა ცერასა და დანარჩენ თითებს შორის. ვითარდება ცერის კუნთები, რომლებსაც crimp ვარჯიში გამორიცხავს.',
    coachTip: 'Pinch სიძლიერე ხშირად sloper-ებსა და boulder-ებზე ლიმიტია. გამოიყენე წონის ფირფიტა ან pinch ბლოკი. ჩაკუმშე ძლიერად.',
  },
  'fb-sloper': {
    name: 'Sloper',
    targetMuscle: 'მხრის სტაბილიზატორები და ღია ხელის მომხრელები',
    description: 'ღია ხელი დახრილ, კიდის გარეშე hold-ზე. არ არის განსაზღვრული კიდე crimp-ისთვის — წმინდა ფრიქცია და მხრის ჩართვა.',
    coachTip: 'Sloper-ები სრულ ღია ხელს და მხრის ჩაწეულ მდგომარეობას მოითხოვს. ასწია მხრები — ჩამოსხლტები.',
  },
  'fb-two-finger': {
    name: 'ორი თითის ჯიბე',
    targetMuscle: 'ინდექს/შუა თითის მომხრელები და A2 პულე',
    description: 'მხოლოდ ინდექსი და შუა თითი ორი თითის ჯიბეში. ვითარდება pocket climbing-ის სპეციფიკური სიძლიერე.',
    coachTip: 'საჭიროა 1+ წლის სტრუქტ. ვარჯიში. არასდროს ცივი ან დაღლილი თითებით. A2 სტრესი ექსტრემალური. გამოიყენე pulley სისტემა.',
  },
  'campus-matching': {
    name: 'კოორდინაციის მოძრაობები',
    targetMuscle: 'კონტაქტის სიძლიერე და კოორდინაცია',
    description: 'ბიჯ-ბიჯ ზემოთ, ორივე ხელი ყოველ ბიჯზე, ფეხის გარეშე. ყალიბავს კამპუს ბორდის ძირითად კოორდინაციას.',
    coachTip: 'მიზანი ფეხის გარეშე მოძრაობაა, სიჩქარე კი არა. ყოველ ბიჯზე კონტროლი — არ ჩამოვარდე. Matching ასწავლის სიმშვიდეს.',
  },
  'campus-laddering': {
    name: 'ძირითადი Laddering (1-2-3)',
    targetMuscle: 'კონტაქტის სიძლიერე და სიმძლავრე-გამძლეობა',
    description: 'მარცხენა ხელი 1-ზე, მარჯვენა 2-ზე, მარცხენა 3-ზე — ხელების მონაცვლეობა ზემოთ. კამპუს ვარჯიშის საფუძველი.',
    coachTip: 'კამპუსი დაღლილად — ცუდი ნიმუშები და ტრავმა. სეანსში პირველი გააკეთე, ჩამოკიდებამდე. ხარისხი — პირველ ადგილზე.',
  },
  'campus-135': {
    name: '1-3-5 Skip Ladders',
    targetMuscle: 'ასაფეთქებელი სიმძლავრე და კონტაქტის სიძლიერე',
    description: '1-დან 3-ზე, შემდეგ 5-ზე — ერთი ხელი. ყოველ მოძრაობაში ბიჯის გამოტოვება ბევრად მეტ ასაფეთქებელ სიმძლავრეს მოითხოვს.',
    coachTip: 'სერიოზული ვარჯიშია. სრული დასვენება (4+ წ.). ორჯერ ვერ — სეანსი დამთავრდა. დაღლილი ნერვული სისტემა ადაპტირდება კი არა, ტრავმდება.',
  },
  'campus-double-dynos': {
    name: 'Double Dynos',
    targetMuscle: 'ასაფეთქებელი სიმძლავრე და lock-off',
    description: 'შეხვედრილი პოზიციიდან ასაფეთქებლად ზემოთ და ორივე ხელით ერთდროულად ბიჯის დაჭერა. ნედლი ასაფეთქებელი სიმძლავრე.',
    coachTip: 'მხოლოდ მოწინავე კამპუს მომვარჯიშეებისთვის. ორი ხელის ერთდროული დაჭერა ექსტრემალურ დატვირთვას ქმნის. lock-off 3 წ. ვერ? — ჯერ მზად არ ხარ.',
  },
  'campus-lockoff': {
    name: 'Lock-Off ვარჯიში',
    targetMuscle: 'ბიცეფსი, lats და lock-off სიძლიერე',
    description: 'ბიჯამდე მიდი და 90° მხრის პოზიცია (lock-off) რაც შეიძლება დიდხანს შეინარჩუნე შემდეგ ბიჯამდე. ვითარდება ძნელ მოძრაობებში გაჭოლვის უნარი.',
    coachTip: 'Lock-off სიძლიერე გამოარჩევს crux-ის გასცდენის მქონე მთამსვლელს. 3 სრული წამი ყოველ lock-off-ში, ნუ ჩქარობ.',
  },
  'flex-wrist-flexion': {
    name: 'მაჯის მოხრის გაჭიმვა',
    targetMuscle: 'მაჯის გამშლელები (წინამხრის ზემოდ)',
    description: 'ხელი წინ, ხელისგული ქვემოთ, მაჯა დაღმავ. მეორე ხელი ნაზად ამძაფრებს გაჭიმვას.',
    coachTip: 'ტენდინიის ბოჭკო, არა ტკივილი. ჰანგბორდ სეანსის შემდეგ ხშირად დაჭიმულია. ყოველდღიური ვარჯიში მაჯის ტენდინოპათიას ხელს უშლის.',
  },
  'flex-wrist-extension': {
    name: 'მაჯის გაშლის გაჭიმვა',
    targetMuscle: 'მაჯისა და თითის მომხრელები (მთამსვლელობის ძირითადი კუნთები!)',
    description: 'ხელი წინ, ხელისგული გარეთ, მაჯა უკან. ეს ათავისუფლებს ყველაზე მოქმედ კუნთებს მთამსვლელობაში.',
    coachTip: 'ყველაზე მნიშვნელოვანი გაჭიმვა მთამსვლელებისთვის. ეს კუნთები ძნელ მარშრუტზე მარცხდება. ყოველდღიურად, წინ-შემდეგ. ღრმად სუნთქე.',
  },
  'flex-forearm': {
    name: 'ტრიცეფსი და Lat გაჭიმვა',
    targetMuscle: 'ტრიცეფსი და latissimus dorsi',
    description: 'ხელი ზემოთ, იდაყვი ზურგს უკან. მეორე ხელით ნაზად ქვემოთ. ყველაზე ღრმა კომფორტულ პოზიციაში გაჩერდი.',
    coachTip: 'დაჭიმული lats ზედა ხელის მდგომარეობებს ზღუდავს. ეს გაჭიმვა გაუმჯობესებს ლიმიტ hold-ის მიღწევის უნარს.',
  },
  'flex-hip-flexor': {
    name: 'თეძოს მომხრელის გაჭიმვა',
    targetMuscle: 'თეძოს მომხრელი კუნთები და psoas',
    description: 'დაბალი lunge-ი, უკანა მუხლი მიწაზე. თეძო წინ და ქვემოთ. ტანი სწორი, გაჭიმვა მაქსიმალური.',
    coachTip: 'დაჭიმული თეძო მაღალ ბიჯებს კლავს. #1 გამოტოვებული გაჭიმვა. ყოველდღიურად — ყოველ მხარეს 2+ წ. რეალური ცვლილებისთვის.',
  },
  'flex-hamstring': {
    name: 'ბარძაყის გაჭიმვა',
    targetMuscle: 'ბარძაყის კუნთები და ხბო',
    description: 'იჯექი, ფეხები სწორი. ხელები ფეხებზე, ზურგი სწორი. სიმძიმე ასრულებს სამუშაოს.',
    coachTip: 'დაჭიმული ბარძაყი მაღალ ბიჯებს ზღუდავს. ზურგი გამართე. ოდნავ quads დააჭიმე ბარძაყის გაჭიმვის გასაღრმავებლად.',
  },
  'flex-shoulder-cross': {
    name: 'გვერდი-გვერდ მხრის გაჭიმვა',
    targetMuscle: 'უკანა დელტა და rotator cuff',
    description: 'სწორი ხელი მკერდზე გადადებ, მეორე ხელი ნაზად. მხრის უკანა ნაწილის გაჭიმვა.',
    coachTip: 'უკანა მხრის სიჭიმე გავრცელებულია ყველა გამყოლ მოძრაობაში. ეს აბალანსებს. ყოველი ვარჯიშის შემდეგ გააკეთე.',
  },
  'flex-chest-open': {
    name: 'გულმკერდის გახსნა',
    targetMuscle: 'გულმკერდი და წინა დელტა',
    description: 'ხელები ზურგს უკან, მხრის პირები ერთად, ხელები ოდნავ ზემოთ. გულმკერდი წინ. პიკ გაფართოებაზე გაჩერდი.',
    coachTip: 'მთამსვლელებს დაჭიმული, ზურგჩაქცეული გულმკერდი უვითარდება. ეს პირდაპირი საწინააღმდეგოა. დილ-საღამოს. პოსტურა გაუმჯობესდება.',
  },
  'flex-lat': {
    name: 'Lat / გვერდითი გაჭიმვა',
    targetMuscle: 'latissimus dorsi და oblique-ები',
    description: 'ხელები ზემოთ, გახლართე, ერთ მხარეს გადაიხარე. თეძო სტაბილური. გაჭიმვა მაჯიდან თეძომდე.',
    coachTip: 'lats ყველაზე დიდი გამყოლი კუნთია — გაჭიმვა pull-up-ის მოცულობასა და მხრის ჯანმრთელობას აუმჯობესებს. ნელი, სუნთქვით.',
  },
  'flex-hip-rotation': {
    name: 'თეძოს გარე ბრუნვა',
    targetMuscle: 'piriformis, glute-ები და თეძოს კაფსულა',
    description: 'Figure-4 ჯდომა: ერთი კოჭი მეორე მუხლზე. სწორი ჯდომა, ოდნავ წინ. ნაზად გადაჭერე მუხლზე.',
    coachTip: '#1 smearing, stemming და chimney-ის გაჭიმვა. დაჭიმული თეძო ცუდ პოზიციებს იძლევა. ნელ-ნელა — piriformis შეიძლება შეკუმშოს.',
  },
  'flex-calf': {
    name: 'ხბოსა და მუხლის გაჭიმვა',
    targetMuscle: 'gastrocnemius, soleus და Achilles',
    description: 'ფეხის თითები საფეხურის კიდეზე, ქუსლი ქვემოთ. ნელა დაწიე ქუსლი. სწორი მუხლი (gastrocnemius) ან მოხრილი (soleus).',
    coachTip: 'მუხლის მოქნილობა კლდეზე smearing-სა და edging-ისთვის კრიტიკულია. ორივე ვარიანტი (30 წ.) ორივე ხბოს კუნთს ხსნის.',
  },
  'flex-thoracic': {
    name: 'გულმკერდის ხერხემლის ბრუნვა',
    targetMuscle: 'გულმკერდის ხერხემალი და intercostal-ები',
    description: 'ჯდომა ფეხი-ფეხზე, ტანი გაბრუნე ერთ მხარეს. მოპირდაპირე ხელი მუხლს ეყრდნობა.',
    coachTip: 'მოქნილი T-ხერხემალი rest-ის პოზიციების, hold-ებზე კარგი კუთხის მოსვლის და ზურგის ტკივილის პრევენციის საშუალებაა.',
  },
};

export function localizedExercise(exercise: Exercise, lang: string) {
  const tr = lang !== 'en' ? (KA[exercise.id] ?? {}) : {};
  return {
    name: tr.name ?? exercise.name,
    targetMuscle: tr.targetMuscle ?? exercise.targetMuscle,
    description: tr.description ?? exercise.description,
    coachTip: tr.coachTip ?? exercise.coachTip,
  };
}

export const DIFFICULTY_LABELS_LOCALIZED: Record<Difficulty, Record<string, string>> = {
  easy:   { en: 'BEGINNER',     ka: 'დამწყები' },
  medium: { en: 'INTERMEDIATE', ka: 'საშუალო' },
  hard:   { en: 'ADVANCED',     ka: 'მოწინავე' },
};

export function getDifficultyLabel(difficulty: Difficulty, lang: string): string {
  return DIFFICULTY_LABELS_LOCALIZED[difficulty]?.[lang] ?? DIFFICULTY_LABELS[difficulty];
}
