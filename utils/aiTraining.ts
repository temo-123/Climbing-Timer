import { UserProfile, TrainingPlan } from '../types/models';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

const EQUIPMENT_LABELS: Record<string, string> = {
  fingerboard: 'Fingerboard/Hangboard',
  campus_board: 'Campus Board',
  climbing_wall: 'Climbing Wall',
  system_wall: 'System/Spray Wall',
  pull_up_bar: 'Pull-up Bar',
  weights: 'Gym/Weights',
};

function buildPrompt(profile: UserProfile): string {
  const equipmentList = profile.equipment.map(e => EQUIPMENT_LABELS[e] || e).join(', ');
  const hasWall = profile.equipment.includes('climbing_wall') || profile.equipment.includes('system_wall');
  const wallInfo = hasWall && profile.wallDegree
    ? `The athlete has a ${profile.wallDegree}° overhang wall available for endurance traversing.`
    : hasWall
    ? 'The athlete has a climbing wall for endurance traversing.'
    : '';
  const weeks = profile.experienceYears < 2 ? 8 : 12;

  return `You are an expert climbing coach specializing in fingerboard and board training. Generate a personalized climbing training plan for this athlete:

ATHLETE PROFILE:
- Age: ${profile.age} years
- Sex: ${profile.sex}
- Weight: ${profile.weight} kg
- Height: ${profile.height} cm
- Climbing experience: ${profile.experienceYears} year(s)
- Current climbing grade: ${profile.climbingGrade || 'not specified'}
- Equipment available: ${equipmentList}
${wallInfo}

Generate a ${weeks}-week progressive training plan. Return ONLY valid JSON (no markdown fences, no explanation) with this exact structure:

{
  "id": "ai-plan-TIMESTAMP",
  "name": "string (creative plan name)",
  "emoji": "string (single emoji)",
  "level": "beginner" | "intermediate" | "expert" | "maintenance",
  "tagline": "string (one line description)",
  "description": "string (2-3 sentences about the plan methodology)",
  "coachNote": "string (coaching advice quote, 2-3 sentences)",
  "daysPerWeek": number (2-4),
  "weeks": ${weeks},
  "sessions": [
    {
      "dayLabel": "Monday",
      "dayIndex": 0,
      "workouts": [
        {
          "id": "ai-w-1",
          "name": "string",
          "type": "fingerboard" | "campus" | "flexibility" | "strength" | "endurance",
          "description": "string (1-2 sentences)",
          "hangTime": number (seconds — fingerboard 5-20s, campus 3-8s, endurance 20-60s per traverse),
          "restTime": number (seconds between reps, 3-15s),
          "reps": number (3-10),
          "sets": number (2-5),
          "recoverTime": number (seconds between sets, 90-300s),
          "coachTip": "string (technique tip)"
        }
      ]
    }
  ],
  "isPreset": false
}

IMPORTANT RULES:
- Only include exercises using equipment the athlete actually has
- Use type="endurance" for wall traversing — hangTime=traverse duration, coachTip must mention the wall angle${profile.wallDegree ? ` (${profile.wallDegree}°)` : ''}
- Match difficulty to experience: ${profile.experienceYears < 2 ? 'beginner protocols, lighter loads' : profile.experienceYears < 5 ? 'intermediate progressive loading' : 'advanced intensity, high specificity'}
- Include at least one flexibility/warm-up exercise per session
- Spread sessions across the week with rest days between training days
- Replace "TIMESTAMP" in the id with the current unix timestamp number`;
}

export async function generateAIPlan(profile: UserProfile): Promise<TrainingPlan> {
  if (!profile.anthropicApiKey) {
    throw new Error('No Anthropic API key. Add it in your Profile settings.');
  }

  const response = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': profile.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(profile) }],
    }),
  });

  if (!response.ok) {
    let msg = `API error ${response.status}`;
    try {
      const err = await response.json();
      msg = err?.error?.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data?.content?.[0]?.text || '';

  let plan: TrainingPlan;
  try {
    plan = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('AI returned an invalid response. Please try again.');
    plan = JSON.parse(match[0]);
  }

  plan.id = `ai-plan-${Date.now()}`;
  plan.isPreset = false;
  return plan;
}
