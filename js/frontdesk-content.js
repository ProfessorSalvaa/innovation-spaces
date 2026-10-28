/* Front Desk of the Future: Ava's lines, chapter names and hotspot labels.
   On screen the experience shows only the short labels. The lines are spoken by Ava (ElevenLabs, voice "Sarah", Eleven v4)
   from audio/frontdesk/<clip>.mp3 and appear as text only when the visitor turns captions (CC) on.
   Clip names: <key>-0 is the chapter intro, <key>-1..n are the hotspots, <key>-act is the action button.
   Editing a line here changes the caption only; the voice is recorded audio (see FrontDesk-voiceover-script.md). */
var FDCONTENT = {
  "greet": [
    { "clip": "greet-0", "text": "Hello, and welcome. I'm Ava. I've been waiting by the front door, which, as a hologram, is the only place I get to stand." },
    { "clip": "greet-1", "text": "Well, hello. I'm Ava, your host for the next few minutes. I'm so glad you're here." }
  ],
  "idle": "Psst. Come closer, and I'll show you the front desk of the future.",
  "chapters": [
    {
      "key": "ava", "name": "Meet Ava", "dock": "Ava", "act": "Say hello",
      "intro": "A quick promise. I'll be honest about what I am, and what's still on the horizon. Touch anything that glows.",
      "notes": [
        ["Hologram", "I'm an AI host. Right now, a hologram. Soon, you'll meet my robot counterpart. Same personality, different body."],
        ["Your team", "I'm not here to replace your people. I take care of the routine, so they can take care of the remarkable."],
        ["Zero breaks", "I'm told I have flawless posture, and zero lunch breaks. Both are true."]
      ]
    },
    {
      "key": "rush", "name": "Rush hour", "dock": "Rush hour", "act": "Anticipate",
      "intro": "Picture this. Three in the afternoon. A flight just landed, and the line at the desk is ten people deep.",
      "actLine": "So we asked. What if the front desk could anticipate, instead of just react?",
      "notes": [
        ["The agent", "The agent is brilliant, but she's typing, encoding keys, answering the phone, and trying to smile through it all."],
        ["2 AM", "At two in the morning, a tired guest walks in. One person on duty, doing five jobs."],
        ["The system", "Nobody is doing anything wrong. The system is stretched. The desk was built for a world of paper."]
      ]
    },
    {
      "key": "vision", "name": "Five ideas", "dock": "Vision", "act": "Light them up",
      "intro": "Our vision rests on five ideas. Touch one.",
      "notes": [
        ["Anticipatory", "Anticipatory. The best service happens before you ask. Your room is ready, your key is waiting."],
        ["Embodied", "Embodied. Help that's physically present, to greet you, walk with you, and carry your bag."],
        ["Ambient", "Ambient. Check-in happens as you walk in, not after you queue."],
        ["Personal", "Personal. A welcome in your language, at your pace, with your preferences."],
        ["Human-amplifying", "Human-amplifying. Technology takes the routine. People keep the heart."]
      ]
    },
    {
      "key": "skills", "name": "Six skills", "dock": "Skills", "act": "Check me in",
      "intro": "Six things a future front desk can do. Some today, some on the road ahead.",
      "notes": [
        ["Greet", "I greet guests in their own language, and with consent, recognise returning members."],
        ["Check in", "I find your reservation, confirm the details, and issue your key. All in conversation."],
        ["Guide", "I point the way. And in robot form, I can walk you to the elevator."],
        ["Requests", "Late checkout, a dinner table, an extra pillow. Ask once, I coordinate the rest."],
        ["Mood", "A rushed traveller gets speed. A weary one gets warmth. A family gets the pool hours first."],
        ["Handoff", "And I know when to bring in a human, with the context, so you never repeat your story."]
      ]
    },
    {
      "key": "stack", "name": "Under the hood", "dock": "Stack", "act": "Build the stack",
      "intro": "Here's how it works. Eight layers, one goal.",
      "notes": [
        ["Physical AI", "Physical AI. A chatbot tells you where the elevator is. Physical AI walks you there."],
        ["Spatial AI", "Spatial AI. Not just a map, but meaning. A doorway. A queue. Where to stand."],
        ["Robotics", "Robotics. Motors, balance and hands that turn a decision into motion."],
        ["Multimodal", "Multimodal AI. Eyes, ears and a voice, so no two conversations are alike."],
        ["Agentic AI", "Agentic AI. I don't just talk, I get things done, with human approval where it matters."],
        ["Digital twin", "Digital twin. A living copy of the hotel, so we see problems before guests feel them."],
        ["Edge AI", "Edge AI. Decisions in milliseconds, right here, with private data kept close."],
        ["Trust", "And under everything, trust. Consent, minimal data, honesty that I'm an AI, and a human always one step away."]
      ]
    },
    {
      "key": "day", "name": "A guest's day", "dock": "Guest day", "act": "Play her day",
      "intro": "Let me tie it together. Meet Ms. Rivera, arriving in a not-so-distant future.",
      "notes": [
        ["Landing", "She lands after an overnight flight, and confirms her arrival in the app."],
        ["Room ready", "The digital twin flags her room. Housekeeping has it ready before she arrives."],
        ["Welcome", "I greet her by name. My robot counterpart carries her bag past the empty desk. Her key is already on her phone."],
        ["Dinner", "She's hungry, so I book a table. The room might be loud, so I let the team know."],
        ["The moment", "And a team member has time to say, welcome back, Ms. Rivera. The technology disappeared. The hospitality showed up."]
      ]
    },
    {
      "key": "meet", "name": "Your turn", "dock": "Meet", "act": "Meet the robot",
      "intro": "I promised honesty. Hotels have tried robots before, and some were scaled back. Novelty fades. Real help lasts.",
      "actLine": "Enough from me. Come and meet my robot counterpart. Ask for anything. Try to stump us. Who's our first guest?",
      "notes": [
        ["Better, not more", "So the goal isn't more robots. It's better hospitality. Technology only where it makes a stay easier, or more human."],
        ["Still learning", "I'm still learning. A good host knows her limits. Mine include stairs, for now."],
        ["Are you real?", "Am I real? I'm real software, with a very imaginary body. And I'll always tell you I'm an AI."]
      ]
    }
  ]
};
if (typeof module !== 'undefined' && module.exports) module.exports = FDCONTENT;
