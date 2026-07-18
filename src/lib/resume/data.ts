// The resume, transcribed from ONE source document and nothing else:
//
//   Zi Wang Resume (2024).pdf
//   sha256 6fe827e7b603c192b5cd59a332470fda9f2b844342f6613fa35bbdd575a47edb
//
// Rules this file lives under:
//   - No research, embellishment, inference or updating. If the document does
//     not say it, it is not here. Where the document states no title (Timeless
//     Calendar, Glow Headphones) `role` is simply absent rather than invented.
//   - "Present" stays "Present".
//   - Email and phone appear in the source but are PRIVATE and excluded; the
//     schema actively rejects them, so this cannot regress silently.
//   - PDF text extraction splits letters across kerning boundaries ("l aser",
//     "1 3 OEMs", "marketplac e", "c ustom", "i n - person"). Those are artifacts
//     of the extractor, not the document's words, and are restored here. No
//     wording, number or unit has been changed.

import { ResumeSchema } from "./schemas";
import type { Resume } from "./types";

const resumeInput = {
  version: "1.0.0",
  sourceSha256:
    "6fe827e7b603c192b5cd59a332470fda9f2b844342f6613fa35bbdd575a47edb",

  person: {
    name: "Zi Wang",
    headline: "AI Product GM | LLM-Native Platform Builder",
    summary: [
      "AI Product GM | LLM-Native Platform Builder with 15 years experience as an engineer, PMM, and PM — led XFN teams across mobile, AI, and Web3. At Google, architected Android’s global brand & creative, managed Nexus devices GTM, scaled consumer platforms to 1B+ users. Founding PM at ACME Lab, prototyped ambient UX for Google Glass.",
      "2x co-founder, successful exit; LLM-Native Platform Builder, built & scaled startups from 0 to 1: Glow (laser headphones), Calendar (ML-powered service marketplace), and Wallet (SocialFi & AI-native UX/UI).",
    ],
    location: "Mountain View, CA",
    linkedin: "https://www.linkedin.com/in/wzi/",
    url: "https://z.stillinlove.co/resume",
  },

  experience: [
    {
      id: "timeless-wallet",
      organization: "Timeless Wallet",
      location: "Mountain View, CA",
      startYear: 2023,
      endYear: "Present",
      positions: [
        {
          id: "timeless-wallet-ceo",
          role: "Startup Co-Founder & CEO",
          startYear: 2023,
          endYear: "Present",
          claims: [
            {
              id: "tw-toothbrush-test",
              text: "Driving AI & Web3 adoption by “passing the toothbrush test”— forged partnerships with Google AI & Web3 teams to deliver a synthetic podcasting proof-of-concept powered by NotebookLM’s Audio Overview, using parameter-efficient fine-tuning.",
            },
            {
              id: "tw-ai-native-ux",
              text: "Pioneering AI-native UX patterns for LLM-driven content remixing interface and contextual response UX using retrieval-like embedding structures (i.e. RAG); inspired by NotebookLM architecture, enabling hyper-personalization.",
            },
            {
              id: "tw-scale",
              text: "Built and led a 20+ person cross-border team; scaled a 110K+ community via 70+ weekly podcasts. Architected B2B distribution models, driving Timeless Wallet to 1.5M+ users, 140K+ app downloads, and $980K+ in on-chain fees.",
            },
            {
              id: "tw-funding",
              text: "Raised $1.2M in pre-seed funding, securing grants across Ethereum, Base, Harmony, and Story, executed GTM strategy for smart wallets (ERC-4337) and adoption of open protocols.",
            },
          ],
        },
      ],
    },
    {
      id: "timeless-calendar",
      organization: "Timeless Calendar",
      location: "Palo Alto, CA",
      startYear: 2019,
      endYear: 2022,
      positions: [
        {
          id: "timeless-calendar-founder",
          startYear: 2019,
          endYear: 2022,
          claims: [
            {
              id: "tc-marketplace",
              text: "Launched calendar as a service marketplace, an ML-powered platform for fusing event data with time-sensitive offers.",
            },
            {
              id: "tc-ml-models",
              text: "Developed ML models surfacing time-sensitive event info (optimized for relevance/accuracy); built probabilistic inference engine for contextual scheduling and semantic indexing inspired by Google Knowledge Graph.",
            },
            {
              id: "tc-monetization",
              text: "Built platform-side monetization strategies for context-sensitive services, connecting event triggers to external APIs for bookings, designing CAC/LTV pipelines for on-demand services.",
            },
            {
              id: "tc-funding-team",
              text: "Raised $800K in pre-seed funding, managed a 5-person technical team on calendar interop across CalDav, iCalendar and MAPI, led cross-platform development (Swift, Kotlin, Flutter); won design awards at Google I/O and Apple WWDC.",
            },
          ],
        },
      ],
    },
    {
      id: "glow-headphones",
      organization: "Glow Headphones",
      location: "Palo Alto, CA",
      startYear: 2015,
      endYear: 2017,
      positions: [
        {
          id: "glow-headphones-founder",
          startYear: 2015,
          endYear: 2017,
          claims: [
            {
              id: "glow-laser",
              text: "Designed and developed the world’s first laser headphones using Corning’s fiber optic glass; commercialized a material science breakthrough into a smart wearable product from zero-to-one.",
            },
            {
              id: "glow-kickstarter",
              text: "Bootstrapped DTC hardware to a top-3 Kickstarter campaign ($1M+ raised); scaled community to 550K+, drove brand recognition through social & earned media; owned creative, brand, comms, and growth strategy.",
            },
            {
              id: "glow-production",
              text: "Led end-to-end product development— custom BLE firmware, iOS/Android apps, industrial design; scaled production to 30K+ shipped units, secured Xiaomi/Meizu manufacturing & distribution partnerships, and drove successful acquisition.",
            },
          ],
        },
      ],
    },
    {
      id: "google",
      organization: "Google",
      location: "Mountain View, CA",
      startYear: 2006,
      endYear: 2015,
      positions: [
        {
          id: "google-acme-lab",
          role: "Founding Team",
          team: "ACME Lab, Google X",
          startYear: 2014,
          endYear: 2015,
          claims: [
            {
              id: "gx-glass-ar",
              text: "Pioneered early AR prototyping for Google Glass, building AI/UX concepts for hands-free, ambient computing; demoed directly to Larry Page, catalyzing the $20M R&D lab.",
            },
            {
              id: "gx-robotics",
              text: "Served as Founding PM for embedded robotics R&D ventures with Autofuss and Bot & Dolly; led ambient computing integrations under Project Replicant, contributing to successful strategic acquisitions by Google.",
            },
          ],
        },
        {
          id: "google-android",
          role: "Global Design & Creative Director",
          team: "Android",
          startYear: 2008,
          endYear: 2013,
          claims: [
            {
              id: "android-brand-architecture",
              text: "Architected global B2C brand architecture, positioning, & messaging across Android OS, Nexus hardware, and developer ecosystems; ensured coherence across 23+ regional markets, aligning B2B ecosystem partners (13 OEMs, 5 carriers, app developers) across product launches, GTM programs, and distribution channels.",
            },
            {
              id: "android-platform-ecosystem",
              text: "Built and scaled Android’s digital platform ecosystem, leading end-to-end product positioning, developer engagement, and user growth via Android.com, Nexus eCommerce, and the Android Developer Portal.",
            },
            {
              id: "android-gtm",
              text: "Directed global GTM campaigns for Android OS releases and Nexus devices; crafted launch narratives across Google I/O keynotes, OEM partner initiatives, and global marketing touchpoints.",
            },
            {
              id: "android-agencies",
              text: "Managed global creative agency networks (BBDO, Dentsu, 72andSunny, Buck) to deliver award-winning campaigns that accelerated Android adoption to >1B devices worldwide.",
            },
            {
              id: "android-oem-carrier",
              text: "Developed strategic OEM/carrier co-marketing partnerships (Samsung, Sony, LG, HTC, Vodafone, T-Mobile, SK Telecom), scaling Android’s market penetration and brand consistency across geographies.",
            },
          ],
        },
        {
          id: "google-chrome",
          role: "Technical Program Manager",
          team: "Chrome",
          startYear: 2008,
          endYear: 2009,
          claims: [
            {
              id: "chrome-monetization",
              text: "Led Chrome’s early Search impact & monetization ROI analysis—built user intent models, evaluated search quality and information access patterns; modeled distribution and TAC, presented findings at Google TGIF.",
            },
            {
              id: "chrome-war-room",
              text: "Member of Google’s Bing-response war room (led by Chief Economist Hal Varian) — analyzed competitive search landscape (vs. Bing) to shape Chrome’s product and distribution decisions.",
            },
          ],
        },
        {
          id: "google-checkout-doubleclick",
          role: "Risk Data Engineer",
          team: "Checkout & DoubleClick",
          startYear: 2006,
          endYear: 2007,
          claims: [
            {
              id: "risk-etl",
              text: "Built large-scale ETL pipelines integrating risk & Google account signals; developed dashboard using Django, MySQL, Python.",
            },
            {
              id: "risk-models",
              text: "Developed predictive models using random forest clustering and Kaplan-Meier survival analysis (R, Python).",
            },
          ],
        },
      ],
    },
  ],

  education: [
    {
      id: "wharton",
      institution: "The Wharton School, University of Pennsylvania",
      credential: "Academy in Strategic Marketing",
      years: "2012",
    },
    {
      id: "stanford-gsb",
      institution: "Stanford University — GSB Executive Program",
      credential: "Center for Entrepreneurial Studies",
      years: "2007–2009",
    },
    {
      id: "georgia-state",
      institution: "Georgia State University",
      credential:
        "B.S. Computer Science | B.B.A. Finance & Accounting | Magna Cum Laude",
      years: "2005",
    },
  ],

  workPlay: [
    {
      id: "wp-rocket",
      text: "Led Google XFN engineering team to build a 12-ft solid-propellant rocket; won John Carmack’s Aerospace Prize.",
    },
    {
      id: "wp-iss",
      text: "Directed Android orbital robot research aboard ISS on NASA’s final Space Shuttle Atlantis mission (STS-135).",
    },
    {
      id: "wp-relay",
      text: "Co-captained Google’s 200-mile relay marathon teams, won four corporate division titles.",
    },
    {
      id: "wp-tgi-ml",
      text: "Founded & co-hosted TGI-ML among Xooglers; hosted 150+ in-person meetups, supporting 1,000+ founders since 2017.",
    },
  ],
} as const;

/**
 * Object.freeze is shallow, which is not enough here. This is a module
 * singleton shared by every request the server handles, and the values below
 * are statements about a real person. One in-place `.sort()`, `.reverse()` or
 * `.splice()` on a nested array — the exact operations role filtering reaches
 * for — would silently reorder or drop a published claim for the remaining
 * lifetime of the process, with no error and nothing to notice from outside.
 * Freezing the whole tree turns that class of mistake into an immediate throw.
 */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const nested of Object.values(value)) deepFreeze(nested);
  }
  return value;
}

/**
 * Parsed at module initialization: an invalid or privacy-violating resume
 * throws on import rather than rendering.
 */
export const resume: Resume = deepFreeze(
  ResumeSchema.parse(resumeInput),
) as Resume;
