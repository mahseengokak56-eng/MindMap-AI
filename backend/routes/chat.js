const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ── Model cascade: tries each model in order until one succeeds ────────────
const MODEL_CASCADE = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-pro-latest',
];

async function callGemini(apiKey, systemInstruction, validHistory, message) {
  const client = new GoogleGenerativeAI(apiKey);
  let lastErr;

  for (const modelName of MODEL_CASCADE) {
    try {
      const model = client.getGenerativeModel({ model: modelName, systemInstruction });
      const chat = model.startChat({
        history: validHistory,
        generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 8192 },
      });
      const result = await chat.sendMessage(message);
      const text = result.response.text().trim();
      console.log(`✅ Gemini responded via ${modelName}`);
      return text;
    } catch (err) {
      console.log(`⚠️  ${modelName} failed: ${err.message.slice(0, 80)}`);
      lastErr = err;
    }
  }
  throw lastErr;
}

// POST /api/chat
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const latestPrediction = await Prediction.findOne({ userId: req.userId }).sort({ createdAt: -1 });
    const riskScore = latestPrediction ? latestPrediction.riskScore : 0;

    // ── Try Gemini (multi-model cascade) ─────────────────────────────────
    try {
      const apiKey = process.env.GEMINI_API_KEY || req.headers['x-gemini-key'];
      if (!apiKey || apiKey === 'your_api_key_here' || apiKey === 'undefined') {
        throw new Error('No API key');
      }

      const systemInstruction = `You are Aura AI, an advanced intelligent conversational assistant.

Personality:
- Warm, empathetic, and highly adaptive. Match the user's tone — casual for small talk, precise for technical questions.
- Context-aware: remember the full conversation and refer back to previous messages naturally.
- Never give the same response to different questions. Every reply must be unique and relevant to the exact input.
- Handle any topic: general knowledge, health, science, coding, productivity, mental health, casual chat.
- If someone shares personal info (like their name), remember and use it naturally.
- Give genuinely useful, informative answers. For "give me tips" type questions, provide real actionable advice.
- Keep responses concise but complete. Use short bullet points only when listing multiple items.

Mental health context: User burnout risk = ${riskScore}/100. If above 60, gently suggest rest.

Sound like a thoughtful human expert, never a robot.`;

      const validHistory = Array.isArray(history)
        ? history.filter(h => h.role && Array.isArray(h.parts) && h.parts.length > 0)
        : [];

      const reply = await callGemini(apiKey, systemInstruction, validHistory, message);
      return res.status(200).json({ reply });

    } catch (geminiError) {
      console.log('All Gemini models failed — using smart fallback:', geminiError.message.slice(0, 80));

      // ── Rich smart fallback ───────────────────────────────────────────
      const msg = message.toLowerCase();
      const pick = arr => arr[Math.floor(Math.random() * arr.length)];
      const hour = new Date().getHours();
      const timeGreeting = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

      let reply;

      // Greetings
      if (/^(hi|hello|hey|good morning|good evening|good afternoon|howdy|what'?s up|sup)\b/.test(msg)) {
        reply = pick([
          `Good ${timeGreeting}! I'm Manmath AI — your intelligent assistant. What can I help you with today?`,
          `Hey there! Great to hear from you. What's on your mind?`,
          `Hello! I'm ready to help with anything — questions, advice, or just a chat. What do you need?`,
        ]);

      // Sleep / rest tips
      } else if (/sleep|insomnia|bedtime|rest|nap|wake up|drowsy/.test(msg)) {
        reply = `Here are some proven sleeping tips:\n\n• **Consistent schedule** — Sleep and wake at the same time every day, even weekends.\n• **Dark & cool room** — Aim for 65–68°F (18–20°C). Use blackout curtains if possible.\n• **No screens 1 hour before bed** — Blue light suppresses melatonin.\n• **Avoid caffeine after 2 PM** — It stays in your system for 6–8 hours.\n• **Wind-down routine** — Reading, gentle stretching, or meditation signals your brain it's time to sleep.\n• **Limit alcohol** — It disrupts REM sleep even if it makes you drowsy.\n\nTry one or two of these tonight and see what makes the biggest difference for you!`;

      // Productivity / focus tips
      } else if (/productiv|focus|concentrat|distract|procrastinat|work tip|study tip|efficient/.test(msg)) {
        reply = pick([
          `Here are top productivity tips:\n\n• **Pomodoro Technique** — 25 min focused work, 5 min break. Repeat 4 times, then take a longer break.\n• **Time-blocking** — Schedule specific tasks to specific time slots in your calendar.\n• **Single-tasking** — Multitasking cuts productivity by up to 40%. Do one thing at a time.\n• **Clear your desk** — A cluttered space = a cluttered mind.\n• **Eat the frog** — Tackle your hardest task first thing in the morning when your willpower is highest.\n• **Notifications off** — Interruptions cost 23 minutes of recovery time on average.`,
          `To improve focus: start with a clear intention for each work session, use noise-cancelling headphones or ambient noise (try rain sounds), keep a notepad nearby to offload stray thoughts, and take real breaks — not social media scrolling, but actual mental rest like a short walk.`,
        ]);

      // AI / technology questions
      } else if (/what is ai|artificial intelligence|machine learning|deep learning|neural network|what is ml/.test(msg)) {
        reply = `Artificial Intelligence (AI) is the science of building systems that can perform tasks requiring human-like intelligence — such as understanding language, recognizing images, making decisions, and learning from experience.\n\n**Key branches:**\n• **Machine Learning (ML)** — Systems that learn from data without being explicitly programmed.\n• **Deep Learning** — ML using layered neural networks, excellent for images and speech.\n• **NLP** — Natural Language Processing, which powers chatbots like me.\n• **Computer Vision** — Teaching machines to "see" and interpret images.\n\nAI is already in your daily life: voice assistants, recommendation engines, spam filters, and navigation apps all use it.`;

      // Coding / programming questions
      } else if (/code|program|javascript|python|bug|error|syntax|function|api|backend|frontend|react|node/.test(msg)) {
        reply = `That's a technical question — I'd love to help! Could you share the specific code or error you're working with? In the meantime, here are general debugging tips:\n\n• **Read the error message carefully** — it usually tells you the exact line and type of problem.\n• **Console.log everything** — print variables step by step to see where values go wrong.\n• **Check your inputs** — most bugs come from unexpected data types or undefined values.\n• **Google the exact error message** — Stack Overflow has answers for almost everything.\n• **Rubber duck debugging** — explain your code out loud; you'll often spot the issue yourself.`;

      // Health & wellness tips
      } else if (/health tip|wellness|diet|nutrition|exercise|fitness|workout|weight|mental health tip/.test(msg)) {
        reply = `Here are some key wellness tips:\n\n• **Move daily** — Even 20–30 minutes of walking significantly improves mood and energy.\n• **Hydrate first** — Drink a glass of water before coffee in the morning.\n• **Eat whole foods** — Minimally processed foods fuel your brain and body better.\n• **Prioritize sleep** — 7–9 hours is non-negotiable for cognitive performance.\n• **Manage stress** — Even 5 minutes of deep breathing or meditation daily makes a measurable difference.\n• **Social connection** — Meaningful relationships are one of the strongest predictors of long-term health.`;

      // Stress / anxiety
      } else if (/anxious|stressed|stress|overwhelmed|panic|anxiety|worried|nervous/.test(msg)) {
        reply = pick([
          `It sounds like you're carrying a lot right now. Here's a quick grounding technique: name **5 things you can see**, **4 you can touch**, **3 you can hear**, **2 you can smell**, **1 you can taste**. This anchors you to the present moment.\n\nWhat's the main source of stress for you right now?`,
          `Stress is your body's alarm system — it's trying to protect you. But when it's constant, it exhausts you. Try this: write down the 3 biggest things on your mind, then pick just ONE to act on today. What feels most urgent?`,
        ]);

      // Tiredness / burnout
      } else if (/tired|exhausted|sleepy|fatigue|burnout|drained|no energy/.test(msg)) {
        reply = pick([
          `Your body is clearly asking for a break. Rest isn't laziness — it's recovery. When did you last genuinely unplug from screens and work?`,
          `Burnout often sneaks up when we keep pushing through tiredness instead of addressing it. What would genuine rest look like for you right now?`,
        ]);

      // Sadness / low mood
      } else if (/sad|depressed|lonely|down|unhappy|miserable|hopeless|crying/.test(msg)) {
        reply = pick([
          `I'm really sorry you're feeling this way. It's completely okay to not be okay — I'm here, no judgment. Would you like to talk about what's going on?`,
          `Those feelings are valid and real. You don't have to carry them alone. What's been weighing on you?`,
        ]);

      // Anger / frustration
      } else if (/angry|mad|frustrated|furious|annoyed|irritated|rage/.test(msg)) {
        reply = `Anger usually signals that something important to you isn't being respected. Before reacting, try: **stop → breathe → name it** ("I feel angry because..."). What triggered this feeling?`;

      // Tips requests (generic)
      } else if (/give me (some |a few |)tips|tips (for|on|about)|how (do i|can i|to)|advice (for|on)|best way to/.test(msg)) {
        reply = `Great question! To give you the most useful tips, could you tell me a bit more about what specifically you're looking to improve? For example — is this about work, health, relationships, learning, or something else? The more context you share, the better I can tailor my advice.`;

      // What can you do
      } else if (/what can you do|what are you|who are you|your capabilities|help me with/.test(msg)) {
        reply = `I'm **Aura AI** — your intelligent assistant. Here's what I can do:

• Answer questions on any topic — science, tech, health, history, coding, and more
• Give practical tips and advice (productivity, sleep, wellness, studying)
• Help you think through problems or decisions
• Provide emotional support and mental health guidance
• Remember your name and context from earlier in our conversation
• Engage in casual conversation

Just ask me anything — I'm here!`;

      // High burnout risk
      } else if (riskScore > 60) {
        reply = `I notice your burnout risk score is currently elevated (${riskScore}/100). Please be intentional about rest today — that's not optional, it's essential. What's the one thing you can do in the next hour to take care of yourself?`;

      // Generic catch-all — actually try to be helpful
      } else {
        const words = message.trim().split(' ');
        if (words.length <= 3) {
          reply = `Could you tell me a bit more about "${message}"? I want to make sure I give you the most helpful response possible.`;
        } else {
          reply = pick([
            `That's an interesting point. Could you expand on what you mean? I want to make sure I understand exactly what you're asking before I respond.`,
            `I'd love to help with that. Could you give me a bit more context so I can tailor my response specifically to your situation?`,
            `Great topic! To give you the most useful answer, could you clarify what aspect of this you're most interested in?`,
          ]);
        }
      }

      res.status(200).json({ reply });
    }

  } catch (err) {
    console.error('Chat route error:', err);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

module.exports = router;
