/* LSHC screen text: titles, taglines, intro and the 25 hotspot notes.
   Editing the text changes the captions only. The spoken voice is baked into the audio data. */
var LCONTENT = {
 "greet": "Hi, I’m your Orbit guide. Welcome to the LSHC Experience Arena. Touch anything that glows, and I’ll show you what’s next.",
 "idle": "Psst. Come closer. Touch the screen, and let’s explore the future of health together.",
 "done": "You have explored every idea in the orbit, from the first molecule in the lab, to the patient at home. That is Life Sciences & Healthcare, joined up.",
 "motifs": [
  {
   "key": "body",
   "name": "The Connected Body",
   "dock": "Body",
   "tag": "Care, joined up around the person",
   "act": "Run a scan",
   "intro": "This is the connected body. Every organ tells a story, and every story is now backed by data. Tap a glowing point, and let’s look closer.",
   "notes": [
    [
     "Brain",
     "Neuroscience",
     "The brain is the final frontier of life sciences. AI helps researchers map how it works, and find new ways to treat conditions like Alzheimer’s and depression."
    ],
    [
     "Heart",
     "Cardiac care",
     "Heart disease remains a leading cause of death worldwide. Continuous monitoring and predictive models help clinicians spot trouble early, and keep people healthy at home."
    ],
    [
     "Lungs",
     "Respiratory health",
     "Breathing is easy to take for granted. Digital tools track lung function over time, so clinicians can adjust care early, and patients can avoid emergency visits."
    ],
    [
     "Metabolism",
     "Liver and gut",
     "The liver and gut shape how we respond to food, and to medicines. Understanding them helps design safer drugs, and more personal nutrition and care."
    ],
    [
     "Wearables",
     "Wearables",
     "A watch on the wrist now streams heart rate, sleep and activity. Shared with the care team, it turns a clinic visit every few months into care every day."
    ]
   ]
  },
  {
   "key": "molecule",
   "name": "Drug Discovery",
   "dock": "Molecule",
   "tag": "From billions of options to one candidate",
   "act": "Dock the molecule",
   "intro": "This is drug discovery. A medicine works when a small molecule fits a protein, like a key in a lock. Tap a glowing point, and let’s look closer.",
   "notes": [
    [
     "Target",
     "The target",
     "Most diseases involve a protein that isn’t working as it should. Finding the right target is the first, and hardest, step. It has to matter to the disease, and be safe to switch off."
    ],
    [
     "Candidate",
     "The candidate molecule",
     "A candidate is a small molecule designed to fit the target. Chemists tune its shape, so it binds tightly, and stays away from everything else."
    ],
    [
     "Binding",
     "The binding site",
     "Here is the pocket where the molecule docks. Simulations test how snugly it sits, and which small changes could make the fit even better."
    ],
    [
     "AI screen",
     "AI screening",
     "There are billions of possible molecules. AI models screen them on a computer first, and shortlist the few that are worth making in the lab."
    ],
    [
     "Design loop",
     "The design loop",
     "Every round of lab results feeds back into the model. Design, make, test, learn. The loop gets faster each time, and the candidates get better."
    ]
   ]
  },
  {
   "key": "cell",
   "name": "Advanced Therapies",
   "dock": "Cell",
   "tag": "Medicine made from living cells",
   "act": "Engineer the cell",
   "intro": "This is a living cell, the building block of advanced therapies. Tap a glowing point, and let’s look closer.",
   "notes": [
    [
     "Nucleus",
     "The nucleus",
     "The nucleus holds our DNA, the instructions for the cell. Gene therapies deliver a corrected copy, so the cell can make what it was missing."
    ],
    [
     "Receptors",
     "Engineered receptors",
     "In CAR T therapy, a patient’s own immune cells are given new receptors. They work like homing sensors, trained to recognise cancer cells."
    ],
    [
     "Target cell",
     "The target",
     "Once the engineered cell finds its target, it locks on, and calls in the rest of the immune system to clear it."
    ],
    [
     "Energy",
     "Cell energy",
     "Mitochondria power the cell. Healthy, energetic cells grow better in the lab, which is why manufacturing conditions matter so much."
    ],
    [
     "Identity",
     "Chain of identity",
     "Each dose is made from one person’s own cells. That means tracking every vial, from the hospital, to the lab, and back to the same patient."
    ]
   ]
  },
  {
   "key": "imaging",
   "name": "Medical Imaging",
   "dock": "Imaging",
   "tag": "Seeing inside, without opening up",
   "act": "Run the scan",
   "intro": "This is medical imaging. Scanners look inside the body, and AI helps make sense of what they see. Tap a glowing point, and let’s look closer.",
   "notes": [
    [
     "The scan",
     "Capturing the image",
     "A CT scanner rotates around the body, taking hundreds of X-ray images in seconds. A computer then stitches them into a three-dimensional picture."
    ],
    [
     "Slices",
     "Slice by slice",
     "Each slice is a thin cross-section. Radiologists scroll through them, like pages in a book, to follow a structure from top to bottom."
    ],
    [
     "AI read",
     "AI assistance",
     "AI can read the same slices in moments, and highlight areas that deserve a closer look. The radiologist stays in charge, and decides what it means."
    ],
    [
     "Early signs",
     "Early detection",
     "Small changes can be easy to miss. Highlighting them early gives patients more options, and more time."
    ],
    [
     "3D plan",
     "From image to plan",
     "A scan can become a three-dimensional model. Surgeons use it to plan an operation, and to practise before the real thing."
    ]
   ]
  },
  {
   "key": "globe",
   "name": "Global Health Network",
   "dock": "Global",
   "tag": "Trials, supply and care, worldwide",
   "act": "Ship a dose",
   "intro": "This is the global health network. Research, manufacturing and care now span the world, connected by data. Tap a glowing point, and let’s look closer.",
   "notes": [
    [
     "Hyderabad",
     "Connected from Hyderabad",
     "From Hyderabad, teams connect with partners around the world, turning data into insight for patients everywhere."
    ],
    [
     "Trial sites",
     "Trial sites",
     "A modern trial runs across many countries at once. Connected sites share data in near real time, so researchers see the full picture sooner."
    ],
    [
     "Home trials",
     "Joining from home",
     "Participants can take part from home. Wearables, and local visits, mean more people can join a study, wherever they live."
    ],
    [
     "Supply",
     "Cold chain",
     "Medicines cross borders in temperature-controlled packaging. Sensors track every shipment, and raise an alert before a dose is at risk."
    ],
    [
     "Real-world",
     "Real-world evidence",
     "After approval, anonymised data from real patients shows how a medicine performs in everyday life. That feeds back into better care."
    ]
   ]
  },
  {
   "key": "genome",
   "name": "Precision Medicine",
   "dock": "Genome",
   "tag": "Care designed around your DNA",
   "act": "Sequence the genome",
   "intro": "This is precision medicine. Everyone’s DNA is a little different, and those differences can shape health. Tap a glowing point, and let’s look closer.",
   "notes": [
    ["DNA", "The code of life", "DNA is a long double helix of paired letters. Reading it reveals the instructions the body uses to build, and run, itself."],
    ["Variant", "A single change", "Sometimes one letter differs from the usual pattern. Many changes are harmless. Others help explain why a condition appears, or why a medicine works differently for one person."],
    ["Sequencing", "Reading the genome", "Modern sequencers read millions of fragments in parallel, and software stitches them back together. What once took years can now take days."],
    ["Gene editing", "Editing with precision", "Gene editing tools can correct a single letter at an exact spot. It is careful, early science, and it points toward treating the cause, not only the symptom."],
    ["Your plan", "A plan for you", "Combine genetic insight with clinical history, and treatment can be matched to the person. The right medicine, at the right dose, sooner."]
   ]
  },
  {
   "key": "journey",
   "name": "Patient Journey",
   "dock": "Journey",
   "tag": "Every step connected, from home to hospital",
   "act": "Send an alert",
   "intro": "This is the patient journey. Home, clinic, lab, pharmacy and hospital are linked by shared data, so care follows the person. Tap a glowing point, and let’s look closer.",
   "notes": [
    ["At home", "Care at home", "Wearables and connected devices share readings from home, so small changes are noticed early, without a trip to the clinic."],
    ["Clinic", "The care team", "Clinicians see one joined-up picture of readings, history and results, and can act with confidence."],
    ["Lab", "Diagnostics", "Test results flow straight to the care team, with fewer delays, and fewer repeated tests."],
    ["Pharmacy", "The right medicine", "Prescriptions and refills stay in sync with the care plan, with reminders that help people stay on track."],
    ["Hospital", "When it matters", "If a patient needs more, their information is already there. Teams can prepare before arrival, and focus on the person."]
   ]
  }
 ]
};