import { TrainingPlan, Workout, PlanTranslation, WorkoutTranslation } from '../types/models';

// Plans based on Eva López, Eric Hörst, Lattice Training, and Steve Bechtel methodologies

export const PRESET_PLANS: TrainingPlan[] = [
  {
    id: 'preset-foundation',
    name: 'Foundation Builder',
    emoji: '🌱',
    level: 'beginner',
    tagline: 'Build safe, lasting finger strength',
    description:
      'A 6-week program to condition your tendons and build a solid base. Your tendons adapt 3× slower than muscles — this protocol respects that. Based on Eva López\'s foundational hanging research.',
    coachNote:
      '"The most common mistake beginners make is training too hard too soon. Your pulley tendons need months of gradual loading to adapt. Two focused sessions per week, done consistently, beat four chaotic sessions every time." — Eva López methodology',
    daysPerWeek: 2,
    weeks: 6,
    sessions: [
      {
        dayLabel: 'Monday',
        dayIndex: 0,
        workouts: [
          {
            id: 'preset-fb-beginner-1',
            name: 'Open Hand Conditioning',
            type: 'fingerboard',
            level: 'beginner',
            description:
              'Comfortable open-hand hangs to begin tendon adaptation. Should feel like 60% of your max effort — never go to failure.',
            hangTime: 10,
            restTime: 50,
            reps: 6,
            sets: 2,
            recoverTime: 180,
            coachTip:
              'Use open-hand (not full crimp) grip. If you feel any A2 pulley pain, stop and rest 3 days. Consistency beats intensity.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Thursday',
        dayIndex: 3,
        workouts: [
          {
            id: 'preset-fb-beginner-2',
            name: 'Endurance Hangs',
            type: 'fingerboard',
            level: 'beginner',
            description:
              'Slightly longer hangs at very comfortable intensity to build aerobic capacity in the forearms.',
            hangTime: 20,
            restTime: 40,
            reps: 4,
            sets: 2,
            recoverTime: 180,
            coachTip:
              'This should feel very easy — you\'re building blood supply to the tendons. Rate of perceived effort: 50%. If it feels hard, reduce hang time.',
            isPreset: true,
          },
          {
            id: 'preset-flex-beginner-1',
            name: 'Wrist & Forearm Mobility',
            type: 'flexibility',
            level: 'beginner',
            description:
              'Essential mobility work to prevent injury and improve range of motion in the hands and wrists.',
            hangTime: 30,
            restTime: 15,
            reps: 4,
            sets: 2,
            recoverTime: 60,
            coachTip:
              'Hold each stretch at end range without pain. Breathe deeply through each hold. Include wrist flexion, extension, and forearm pronation/supination.',
            isPreset: true,
          },
        ],
      },
    ],
    isPreset: true,
  },
  {
    id: 'preset-intermediate',
    name: 'Strength Builder',
    emoji: '💪',
    level: 'intermediate',
    tagline: 'Repeaters + campus for real gains',
    description:
      'An 8-week program combining the proven 7-3 repeater method with introductory campus board work. You\'ll build both finger strength and power endurance. Train 3× per week with 48h between sessions.',
    coachNote:
      '"Repeaters work because they maximize time under tension while allowing partial recovery between hangs. The 7s on / 3s off rhythm is optimal for recruiting slow-twitch and fast-twitch fibers together." — Based on Lattice Training protocols',
    daysPerWeek: 3,
    weeks: 8,
    sessions: [
      {
        dayLabel: 'Monday',
        dayIndex: 0,
        workouts: [
          {
            id: 'preset-fb-inter-1',
            name: '7-3 Repeaters',
            type: 'fingerboard',
            level: 'intermediate',
            description:
              '7s hang, 3s rest × 6 reps = one 60-second set. This is the gold standard repeater protocol. Use half-crimp or open-hand at 70-80% max.',
            hangTime: 7,
            restTime: 3,
            reps: 6,
            sets: 4,
            recoverTime: 180,
            coachTip:
              'The 3-second rest is active — don\'t fully release. Maintain body tension. If you can\'t complete all 6 reps, reduce weight or edge size next session.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Wednesday',
        dayIndex: 2,
        workouts: [
          {
            id: 'preset-campus-inter-1',
            name: 'Campus: Basic Laps',
            type: 'campus',
            level: 'intermediate',
            description:
              'Footless dynamic movement on the campus board. Match on rung 1, move up 1-2 rungs explosively, return down with control. Focus on contact strength.',
            hangTime: 8,
            restTime: 172,
            reps: 4,
            sets: 3,
            recoverTime: 240,
            coachTip:
              'Full rest (3+ minutes) between moves is essential for power quality. Never do campus board when tired — it trains bad motor patterns and risks injury.',
            isPreset: true,
          },
          {
            id: 'preset-flex-inter-1',
            name: 'Shoulder & Hip Mobility',
            type: 'flexibility',
            level: 'intermediate',
            description:
              'Post-session mobility to maintain shoulder health and hip flexibility critical for high-foot moves.',
            hangTime: 40,
            restTime: 20,
            reps: 4,
            sets: 2,
            recoverTime: 60,
            coachTip:
              'Focus on shoulder external rotation and chest opening. Tight shoulders are a major factor in overuse injuries.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Friday',
        dayIndex: 4,
        workouts: [
          {
            id: 'preset-fb-inter-2',
            name: 'Half-Crimp Repeaters',
            type: 'fingerboard',
            level: 'intermediate',
            description:
              'Same repeater protocol targeting half-crimp position specifically — the strongest and safest crimp position for most climbers.',
            hangTime: 7,
            restTime: 3,
            reps: 6,
            sets: 3,
            recoverTime: 180,
            coachTip:
              'Half-crimp: middle joints at 90°, thumb alongside (not over). This is the position you\'ll use most on rock. Train it specifically.',
            isPreset: true,
          },
        ],
      },
    ],
    isPreset: true,
  },
  {
    id: 'preset-expert',
    name: 'Performance Phase',
    emoji: '🔥',
    level: 'expert',
    tagline: 'Max strength and explosive power',
    description:
      'A 6-week peak performance program built around max hangs and campus power. Train 4× per week in a 2-on / 1-off / 2-on / 2-off cycle. Requires at least 6 months of structured fingerboard training as a prerequisite.',
    coachNote:
      '"Maximum strength training requires maximum rest. If the rep feels easy, you\'re not training max strength — you\'re training endurance. Add weight or use a smaller edge until 5-8 seconds is genuinely hard." — Beastmaker / Lattice methodology',
    daysPerWeek: 4,
    weeks: 6,
    sessions: [
      {
        dayLabel: 'Monday',
        dayIndex: 0,
        workouts: [
          {
            id: 'preset-fb-expert-1',
            name: 'Max Hangs: Limit Strength',
            type: 'fingerboard',
            level: 'expert',
            description:
              'Near-maximum effort hangs with full rest between reps. Add weight if bodyweight is easy. Use 20mm edge or smaller. The gold standard for maximum finger strength.',
            hangTime: 7,
            restTime: 173,
            reps: 5,
            sets: 3,
            recoverTime: 300,
            coachTip:
              'Rest 3 full minutes between reps. You should feel fully recovered before each hang. Rate: 90-95% max effort. If you\'re not slightly scared, the edge is too big.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Tuesday',
        dayIndex: 1,
        workouts: [
          {
            id: 'preset-campus-expert-1',
            name: 'Campus: Ladder Training',
            type: 'campus',
            level: 'expert',
            description:
              'Classic campus ladder: start on rung 1, move up 1-3-5, reverse 5-3-1. Focus on catching each rung with one hand, no feet. Pure contact strength and power.',
            hangTime: 6,
            restTime: 234,
            reps: 4,
            sets: 3,
            recoverTime: 300,
            coachTip:
              'Rest 4+ minutes between attempts. Campus work is neurological — quality over quantity. Stop when form breaks down. 1-2 sessions/week max.',
            isPreset: true,
          },
          {
            id: 'preset-flex-expert-1',
            name: 'Active Recovery Stretch',
            type: 'flexibility',
            level: 'expert',
            description:
              'Full-body flexibility targeting areas stressed by performance climbing: hip flexors, hamstrings, shoulder capsule.',
            hangTime: 45,
            restTime: 15,
            reps: 5,
            sets: 2,
            recoverTime: 60,
            coachTip:
              'Do this after campus work while muscles are warm. Focus on end-range positions. Hip flexibility directly improves footwork on slabs and overhangs.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Thursday',
        dayIndex: 3,
        workouts: [
          {
            id: 'preset-fb-expert-2',
            name: 'Density Hangs: Volume',
            type: 'fingerboard',
            level: 'expert',
            description:
              'Higher-volume fingerboard work targeting strength-endurance. Use bodyweight on a medium edge (25-30mm). Fill the time under tension.',
            hangTime: 10,
            restTime: 50,
            reps: 8,
            sets: 4,
            recoverTime: 240,
            coachTip:
              'This is the volume day — not max effort. Use bodyweight, maybe subtract some with a pulley system. Should feel like 75-80%. Build the base your limit work sits on.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Friday',
        dayIndex: 4,
        workouts: [
          {
            id: 'preset-campus-expert-2',
            name: 'Campus: Dynamic Pulls',
            type: 'campus',
            level: 'expert',
            description:
              'Dynamic, single-move pulls focusing on contact strength from dead points. Match on rung 2, explode to rung 5 or 6. Develop explosive power.',
            hangTime: 5,
            restTime: 235,
            reps: 4,
            sets: 3,
            recoverTime: 300,
            coachTip:
              'Contact strength — the ability to grab a hold at the exact moment of contact — is one of the highest-leverage abilities for hard sport and boulder climbing.',
            isPreset: true,
          },
        ],
      },
    ],
    isPreset: true,
  },
  {
    id: 'preset-maintenance',
    name: 'Maintenance Mode',
    emoji: '🧘',
    level: 'maintenance',
    tagline: 'Stay sharp, prevent injury, keep fit',
    description:
      'A sustainable 2×/week program designed for climbers between projects, during rest periods, or who want to stay fit without peaking. Prioritizes tendon health and mobility over intensity.',
    coachNote:
      '"Maintenance training is what separates climbers who last decades from those who burn out in two years. Two quality sessions per week is enough to hold 90% of your strength while allowing full recovery." — Steve Bechtel, Logical Progression',
    daysPerWeek: 2,
    weeks: 0, // ongoing
    sessions: [
      {
        dayLabel: 'Tuesday',
        dayIndex: 1,
        workouts: [
          {
            id: 'preset-fb-maint-1',
            name: 'Maintenance Hangs',
            type: 'fingerboard',
            level: 'maintenance',
            description:
              'Moderate hangs to maintain current finger strength without creating fatigue. Use your normal warm-up edge at comfortable intensity.',
            hangTime: 7,
            restTime: 113,
            reps: 5,
            sets: 3,
            recoverTime: 180,
            coachTip:
              'Maintenance doesn\'t mean easy — it means purposeful. Hit your normal edge at 75-80% effort. You\'re reminding your tendons what they\'re capable of, not pushing new limits.',
            isPreset: true,
          },
        ],
      },
      {
        dayLabel: 'Saturday',
        dayIndex: 5,
        workouts: [
          {
            id: 'preset-fb-maint-2',
            name: 'Active Recovery Hangs',
            type: 'fingerboard',
            level: 'maintenance',
            description:
              'Very light hangs focused on blood flow and tendon health rather than strength. Use a large edge (35-40mm) at low intensity.',
            hangTime: 10,
            restTime: 50,
            reps: 6,
            sets: 2,
            recoverTime: 120,
            coachTip:
              'This session promotes blood flow to tendons, which have poor circulation. Think of it as tendon physiotherapy. Very comfortable intensity.',
            isPreset: true,
          },
          {
            id: 'preset-flex-maint-1',
            name: 'Full Body Mobility',
            type: 'flexibility',
            level: 'maintenance',
            description:
              'A full-body mobility routine to maintain flexibility and prevent tightness from everyday life and climbing.',
            hangTime: 40,
            restTime: 20,
            reps: 5,
            sets: 2,
            recoverTime: 60,
            coachTip:
              'Include: wrist circles, forearm stretches, shoulder rotations, hip flexor stretches, hamstring stretch, thoracic spine rotation. Flexibility is the easiest fitness quality to lose.',
            isPreset: true,
          },
        ],
      },
    ],
    isPreset: true,
  },
];

export const getPlanById = (id: string): TrainingPlan | null => {
  return PRESET_PLANS.find(p => p.id === id) || null;
};

export const LEVEL_COLORS: Record<string, string> = {
  beginner: '#2ed573',
  intermediate: '#ffa502',
  expert: '#ff4757',
  maintenance: '#4ecdc4',
};

export const LEVEL_LABELS: Record<string, string> = {
  beginner: 'BEGINNER',
  intermediate: 'INTERMEDIATE',
  expert: 'EXPERT',
  maintenance: 'MAINTENANCE',
};

export const TYPE_EMOJIS: Record<string, string> = {
  fingerboard: '🏔️',
  campus: '⚡',
  flexibility: '🧘',
  strength: '💪',
  endurance: '🧗',
};

export const TYPE_LABELS: Record<string, string> = {
  fingerboard: 'Fingerboard',
  campus: 'Campus Board',
  flexibility: 'Flexibility',
  strength: 'Strength',
  endurance: 'Endurance',
};

const KA_PLANS: Record<string, PlanTranslation> = {
  'preset-foundation': {
    name: 'საფუძვლის შემქმნელი',
    tagline: 'ააშენე მყარი, გრძელვადიანი თითების სიძლიერე',
    description: '6-კვირიანი პროგრამა მყესების გაძლიერებისა და მყარი საფუძვლის შექმნისთვის. მყესები კუნთებზე 3-ჯერ ნელა ადაპტირდება — ეს პროტოკოლი ამას ითვალისწინებს. ევა ლოპეზის ჰანგბორდ კვლევებზე დაყრდნობით.',
    coachNote: '"დამწყებთა ყველაზე გავრცელებული შეცდომა ძალიან ინტენსიური ვარჯიშია. პულის მყესებს ადაპტაციისთვის თვეები სჭირდება. ორი ფოკუსირებული სეანსი კვირაში, სისტემატურად, ოთხ ქაოტიკულ სეანსზე ჯობია." — ევა ლოპეზი',
  },
  'preset-intermediate': {
    name: 'სიძლიერის შეძენა',
    tagline: 'Repeaters + კამპუსი რეალური შედეგებისთვის',
    description: '8-კვირიანი პროგრამა 7-3 repeater-ის მეთოდსა და კამპუს ბორდის ვარჯიშს აერთიანებს. ააშენებ თითების სიძლიერეს და სიმტკიცის გამძლეობას. ვარჯიში კვირაში 3-ჯერ, 48 სთ-იანი შუალედით.',
    coachNote: '"Repeaters ეფექტიანია, რადგან ტენდინური ძაბვის დრო მაქსიმალურია. 7 წ. / 3 წ. რიტმი ნელი და სწრაფი კუნთოვანი ბოჭკოების ერთდროული ჩართვისთვის ოპტიმალურია." — Lattice Training',
  },
  'preset-expert': {
    name: 'შესრულების ეტაპი',
    tagline: 'მაქს სიძლიერე და ასაფეთქებელი ძალა',
    description: '6-კვირიანი პიკური პროგრამა max hangs-სა და კამპუს სიმძლავრეზე. ვარჯიში კვირაში 4-ჯერ, 2/1/2/2 ციკლში. საჭიროა 6+ თვის სტრუქტურირებული ჰანგბორდ ვარჯიშის გამოცდილება.',
    coachNote: '"მაქსიმური სიძლიერის ვარჯიშს მაქსიმური დასვენება სჭირდება. ადვილი გამეორება ნიშნავს სიძლიერეს კი არ ვარჯიშობ, გამძლეობას. დაამატე წონა ან პატარა edge, სანამ 5-8 წამი ნამდვილად ძნელი არ გახდება." — Beastmaker / Lattice',
  },
  'preset-maintenance': {
    name: 'შენარჩუნების რეჟიმი',
    tagline: 'ფორმაში დარჩი, ტრავმებს ეარიდე',
    description: 'მდგრადი 2×/კვ. პროგრამა მთამსვლელებისთვის პროექტებს შორის, დასვენებაში ან ვინც ინტენსიობის გარეშე ფიზფორმის შენარჩუნებას ცდილობს. მყესების ჯანმრთელობა და მობილობა — პრიორიტეტი.',
    coachNote: '"შენარჩუნებითი ვარჯიში გამოარჩევს ათწლეულების მთამსვლელს ორ წელიწადში გადამწვარისგან. კვირაში ორი ხარისხიანი სეანსი სიძლიერის 90%-ის შენარჩუნებისთვის საკმარისია სრული გამოჯანმრთელებით." — სტივ ბეჩტელი',
  },
};

const KA_WORKOUTS: Record<string, WorkoutTranslation> = {
  'preset-fb-beginner-1': {
    name: 'ღია ხელის ადაპტაცია',
    description: 'კომფორტული ღია ხელის ჩამოკიდება მყესების ადაპტაციის დასაწყებად. 60% ძალისხმევა — არასდროს ზღვარამდე.',
    coachTip: 'გამოიყენე ღია ხელი (არა full crimp). A2 pulley-ის ტკივილის შემთხვევაში — 3 დღე დაისვენე. სისტემატურობა ინტენსიობაზე ჯობია.',
  },
  'preset-fb-beginner-2': {
    name: 'გამძლეობის ჩამოკიდება',
    description: 'ოდნავ გრძელი ჩამოკიდება კომფორტული ინტენსიობით წინამხრის გამძლეობის გასაუმჯობესებლად.',
    coachTip: 'ძალიან ადვილი უნდა იყოს — მყესებში სისხლმომარაგებას ვითარდები. 50% ძალისხმევა. ძნელი თუ არის, დააკლე ჩამოკიდების დრო.',
  },
  'preset-flex-beginner-1': {
    name: 'მაჯისა და წინამხრის მობილობა',
    description: 'ტრავმის პრევენციისა და ხელის მოძრაობის გაუმჯობესებისთვის აუცილებელი მობილობის ვარჯიში.',
    coachTip: 'ყოველ გაჭიმვაში ბოლო პოზიციაში ტკივილის გარეშე გაჩერდი. ღრმად სუნთქე. ჩართე მაჯის მოხრა, გაშლა და ბრუნვა.',
  },
  'preset-fb-inter-1': {
    name: '7-3 განმეორებები',
    description: '7 წ. ჩამოკიდება, 3 წ. დასვენება × 6 გამეორება = 60 წ. სეტი. Repeater-ის ოქროს სტანდარტი. Half-crimp ან ღია ხელი 70-80%-ზე.',
    coachTip: '3 წ. დასვენება აქტიურია — სრულად ნუ გაუშვებ. სხეულის დაძაბულობა შეინარჩუნე. 6 გამეორების ვერ შევსება — შეამცირე წონა ან edge.',
  },
  'preset-campus-inter-1': {
    name: 'კამპუსი: საბაზო ლაპები',
    description: 'ფეხის გარეშე დინამიური მოძრაობა კამპუს ბორდზე. 1-ე ბიჯიდან 1-2-ით ასაფეთქებლად ზემოთ, კონტროლით დაბლა. კონტაქტის სიძლიერე.',
    coachTip: 'სრული დასვენება (3+ წ.) მოძრაობებს შორის — სიმძლავრის ხარისხისთვის. დაღლილად კამპუსი — ცუდი ნიმუშები და ტრავმის რისკი.',
  },
  'preset-flex-inter-1': {
    name: 'მხრისა და თეძოს მობილობა',
    description: 'სეანსის შემდგომი მობილობა მხრის ჯანმრთელობისა და თეძოს მოქნილობის შენარჩუნებისთვის.',
    coachTip: 'ფოკუსი მხრის გარე ბრუნვასა და გულმკერდის გახსნაზე. დაჭიმული მხრები — ჭარბი ატვირთვის ტრავმების მთავარი მიზეზი.',
  },
  'preset-fb-inter-2': {
    name: 'Half-Crimp განმეორებები',
    description: 'იგივე repeater-ის პროტოკოლი half-crimp პოზიციაზე — უმეტეს მთამსვლელთათვის ყველაზე ძლიერი და უსაფრთხო.',
    coachTip: 'Half-crimp: შუა სახსრები 90°, ცერა გვერდით. ეს პოზიციაა, კლდეზე ყველაზე ხშირად გამოიყენება. სპეციფიკურად ვარჯიშე.',
  },
  'preset-fb-expert-1': {
    name: 'Max Hangs: ლიმიტური სიძლიერე',
    description: 'მაქსიმუმთან ახლოს ჩამოკიდება სრული დასვენებით. დაამატე წონა, თუ ადვილია. 20 მმ edge ან პატარა.',
    coachTip: '3 სრული წუთი გამეორებებს შორის. ყოველ ჩამოკიდებამდე სრულად გამოჯანმრთელებული. 90-95%. Edge ძალიან დიდია, თუ არ ეშინია.',
  },
  'preset-campus-expert-1': {
    name: 'კამპუსი: კიბის ვარჯიში',
    description: 'კლასიკური კამპუს კიბე: 1-დან 1-3-5-ზე ასვლა, 5-3-1 ჩამოსვლა. ფეხის გარეშე, ერთი ხელით. სუფთა კონტაქტი და სიმძლავრე.',
    coachTip: '4+ წ. მცდელობებს შორის. კამპუსი ნეიროლოგიურია — ხარისხი რაოდენობაზე. ფორმის გაუარესება — შეჩერდი. მაქს 1-2 სეანსი/კვ.',
  },
  'preset-flex-expert-1': {
    name: 'აქტიური გამოჯანმრთელება',
    description: 'სხეულის მოქნილობა პიკური მთამსვლელობის სტრეს-ზონებზე: თეძოს მომხრელი, ბარძაყი, მხრის კაფსულა.',
    coachTip: 'კამპუსის შემდეგ, კუნთები თბილი. ბოლო პოზიციებზე ფოკუსი. თეძოს მოქნილობა ფეხის ტექნიკაში პირდაპირ ჩანს.',
  },
  'preset-fb-expert-2': {
    name: 'სიმჭიდროვის ჩამოკიდება: მოცულობა',
    description: 'დიდი მოცულობის ჰანგბორდი სიძლიერე-გამძლეობაზე. საკუთარი სხეულის წონა საშუალო edge-ზე (25-30 მმ).',
    coachTip: 'ეს მოცულობის დღეა — არა მაქს. სხეულის წონა, შეიძლება pulley-ით შემცირდეს. 75-80% ძალისხმევა. ბაზა ლიმიტ ვარჯიშისთვის.',
  },
  'preset-campus-expert-2': {
    name: 'კამპუსი: დინამიური გაყვანა',
    description: 'ერთ-ბიჯიანი დინამიური გაყვანა კონტაქტის სიძლიერეზე dead point-იდან. 2-ე ბიჯი, ასაფეთქებლად 5-6-მდე.',
    coachTip: 'კონტაქტის სიძლიერე — hold-ის კონტაქტის ზუსტ მომენტში დაჭერა — სპორტ და ბოლდერ მთამსვლელობაში ერთ-ერთი ყველაზე გადამწყვეტი უნარია.',
  },
  'preset-fb-maint-1': {
    name: 'შენარჩუნებითი ჩამოკიდება',
    description: 'ზომიერი ჩამოკიდება სიძლიერის შენარჩუნებისთვის დაღლილობის გარეშე. ჩვეულებრივი edge, კომფორტული ინტენსიობა.',
    coachTip: 'შენარჩუნება ადვილს კი არ ნიშნავს, მიზნობრივს. 75-80% ძალისხმევა. მყესებს ახსენებ, რისი გაკეთება შეუძლიათ.',
  },
  'preset-fb-maint-2': {
    name: 'გამოჯანმრთელების ჩამოკიდება',
    description: 'ძალიან მსუბუქი ჩამოკიდება სისხლის მიმოქცევასა და მყესების ჯანმრთელობაზე. დიდი edge (35-40 მმ), დაბალი ინტენსიობა.',
    coachTip: 'ეს სეანსი მყესებში სისხლის მიმოქცევას ახდენს, სადაც სისხლმომარაგება ცუდია. ფიქრობ მყესების ფიზიოთერაპიაზე. კომფორტული.',
  },
  'preset-flex-maint-1': {
    name: 'სრული სხეულის მობილობა',
    description: 'სხეულის მოქნილობის კომპლექსი მოქნილობის შენარჩუნებისა და ყოველდღიური ცხოვრების დაჭიმულობის პრევენციისთვის.',
    coachTip: 'ჩართე: მაჯის წრეები, წინამხრის გაჭიმვა, მხრის ბრუნვა, თეძოს გაჭიმვა, ბარძაყი, ხერხემლის ბრუნვა. მოქნილობა ყველაზე ადვილი დასაკარგია.',
  },
};

export function localizedPlan(plan: TrainingPlan, lang: string) {
  const tr = lang !== 'en' ? (KA_PLANS[plan.id] ?? {}) : {};
  return {
    name: tr.name ?? plan.name,
    tagline: tr.tagline ?? plan.tagline,
    description: tr.description ?? plan.description,
    coachNote: tr.coachNote ?? plan.coachNote,
  };
}

export function localizedWorkout(workout: Workout, lang: string) {
  const tr = lang !== 'en' ? (KA_WORKOUTS[workout.id] ?? {}) : {};
  return {
    name: tr.name ?? workout.name,
    description: tr.description ?? workout.description ?? '',
    coachTip: tr.coachTip ?? workout.coachTip ?? '',
  };
}

export const LEVEL_LABELS_LOCALIZED: Record<string, Record<string, string>> = {
  beginner:     { en: 'BEGINNER',     ka: 'დამწყები' },
  intermediate: { en: 'INTERMEDIATE', ka: 'საშუალო' },
  expert:       { en: 'EXPERT',       ka: 'ექსპერტი' },
  maintenance:  { en: 'MAINTENANCE',  ka: 'შენარჩუნება' },
};

export function getLevelLabel(level: string, lang: string): string {
  return LEVEL_LABELS_LOCALIZED[level]?.[lang] ?? LEVEL_LABELS[level] ?? level;
}
