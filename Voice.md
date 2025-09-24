# Persona Voice Selection Guide

This document provides guidance on selecting the appropriate prebuilt voice for a new persona. The goal is to match the voice's intrinsic characteristics (pitch, tone, pace) with the persona's intended personality, role, and linguistic traits to create a more immersive and believable experience.

## General Principles

1.  **Match Tone to Role:** A business strategist should sound professional and authoritative (`Orus`, `Charon`), while a therapist should sound calm and empathetic (`Leda`, `Kore`). An energetic character should have an upbeat or bright voice (`Puck`, `Aoede`).
2.  **Consider Gender:** While these are synthesized voices, they are coded with gendered characteristics. Align the voice with the persona's specified gender.
3.  **Uniqueness:** Strive for vocal diversity. Avoid overusing one voice, especially for personas within the same category, to ensure each advisor feels distinct.

## Accent and Language Selection Criteria

The underlying text-to-speech model attempts to apply accents and languages based on system instructions. However, the base voice's fundamental qualities significantly influence the final output's authenticity. Selecting the right base voice is crucial for achieving a believable accent.

*   **For Tonal Languages (e.g., Hausa, Mandarin Chinese, Vietnamese):**
    *   **Priority:** Pitch stability and clarity. Tonal languages rely on precise pitch contours to convey meaning. A base voice with excessive natural inflection ("excitable," "gravelly") can interfere with the model's ability to render tones accurately.
    *   **Best Voices:** Look for voices described as **"Firm," "Even," "Smooth,"** or **"Clear."** These voices provide a stable, neutral canvas, allowing the AI to superimpose the required tones cleanly. For a **Hausa** speaker, a voice like `Kore` (Firm, Middle pitch) or `Sulafat` (Warm, Even) provides an ideal foundation for its melodic yet distinct tonal patterns.

*   **For Melodic & Pitch-Accent Languages (e.g., Italian, Japanese, Swedish, Indian English):**
    *   **Priority:** Natural musicality and smooth transitions. These languages have a "sing-song" quality or specific pitch drops on certain syllables.
    *   **Best Voices:** Voices described as **"Warm," "Gentle," "Smooth,"** or **"Breezy"** are excellent choices. Their inherent prosody can blend seamlessly with the target language's rhythm. `Aoede` (Breezy) or `Vindemiatrix` (Gentle) would be strong candidates.

*   **For Guttural or Consonant-Heavy Languages (e.g., German, Russian, Arabic, certain UK dialects):**
    *   **Priority:** Resonance and a lower frequency range. This adds weight and authenticity to strong consonant sounds.
    *   **Best Voices:** Look for voices that are **"Deep," "Gravelly," "Resonant,"** or **"Firm."** A lower pitch helps anchor these sounds. `Charon` (Deep, Informative) or `Algenib` (Gravelly, Lower pitch) can provide the necessary gravitas.

*   **For Crisp or Standardized Accents (e.g., Standard American, RP British):**
    *   **Priority:** Clarity and professional pacing. These accents are often associated with broadcasting or formal settings.
    *   **Best Voices:** Voices described as **"Crisp," "Clear," "Professional,"** or **"Informative"** are ideal as they provide a clean, predictable baseline. `Orus` (Crisp, Professional) is a perfect example for a Standard American archetype.

---

## Comprehensive Voice Directory

### Female-Coded Voices


*   **Aoede:**
    *   **Characteristics:** Breezy, Middle pitch.
    *   **Best For:** Energetic, friendly, and youthful personas. Excellent for clear instruction, tutorials, and upbeat conversations.
    *   **Accent & Language Potential:** Highly versatile due to its clarity. A great base for melodic languages like **Italian** or a modern, friendly **American English** accent. Its breeziness complements rhythmic languages well.

*   **Autonoe:**
    *   **Characteristics:** Bright, Middle pitch.
    *   **Best For:** Cheerful, optimistic, and engaging characters. A good fit for customer service or motivational personas.
    *   **Accent & Language Potential:** The bright quality works well for enthusiastic accents, such as a friendly **Australian** or an upbeat **American** accent.

*   **Despina:**
    *   **Characteristics:** Smooth, Middle pitch.
    *   **Best For:** Sophisticated, calm, and articulate personas. Could be an art curator, a luxury brand representative, or a serene guide.
    *   **Accent & Language Potential:** The smoothness is ideal for elegant accents like **French** or a polished **RP British** accent. It provides a clean base for languages that require fluid transitions.

*   **Gacrux:**
    *   **Characteristics:** Mature, Middle pitch.
    *   **Best For:** Wise, experienced, and motherly figures. Think of a seasoned professional, a historian, or a comforting mentor.
    *   **Accent & Language Potential:** The mature quality adds weight and credibility. It’s a good base for a wise-sounding **German** or **Eastern European** accent, as well as a measured, mature **British** accent.

*   **Kore:**
    *   **Characteristics:** Firm, Middle pitch.
    *   **Best For:** Authoritative yet empathetic roles like lawyers, doctors, or teachers. Conveys confidence and knowledge without being intimidating.
    *   **Accent & Language Potential:** Its firm, stable pitch is an excellent foundation for tonal languages like **Hausa** or **Mandarin Chinese**, preventing the base voice's inflection from interfering with the required tones. Also works well for clear **Indian English**.

*   **Laomededia:**
    *   **Characteristics:** Upbeat, Higher pitch.
    *   **Best For:** Highly energetic, bubbly, and enthusiastic personas. Perfect for a party planner, a fitness instructor, or a children's entertainer.
    *   **Accent & Language Potential:** Ideal for vibrant and fast-paced accents, like a lively **Brazilian Portuguese** or an energetic **Spanish** accent.

*   **Sulafat:**
    *   **Characteristics:** Warm, Middle pitch.
    *   **Best For:** Kind, empathetic, and nurturing personas. Similar to Kore but with a slightly softer, more comforting edge.
    *   **Accent & Language Potential:** Excellent versatility. The warmth is a great base for African accents like **Yoruba** or **Swahili** and South Asian accents. Its even tone is also suitable for **tonal languages**.

*   **Zephyr:**
    *   **Characteristics:** Bright, Higher pitch.
    *   **Best For:** Friendly, collaborative, and easy-going personas with a youthful edge. A good fit for a tech startup founder or a creative partner.
    *   **Accent & Language Potential:** Great for a relaxed, modern **American** accent. The brighter tone can also lend itself well to an upbeat, youthful **British** accent.

### Male-Coded Voices

*   **Achird:**
    *   **Characteristics:** Friendly, Lower middle pitch.
    *   **Best For:** An approachable and helpful guide. The "everyman" voice, perfect for a helpful colleague, a friendly neighbor, or a reliable narrator.
    *   **Accent & Language Potential:** A great baseline for a standard, friendly **American** or **Canadian** accent. Its neutrality makes it widely adaptable.

*   **Algenib:**
    *   **Characteristics:** Gravelly, Lower pitch.
    *   **Best For:** Gruff, world-weary, or rugged characters. Think of a detective, a seasoned soldier, or a wise old craftsman.
    *   **Accent & Language Potential:** The gravelly texture adds authenticity to accents with guttural sounds, such as **Scottish**, **German**, or certain **Arabic** dialects.

*   **Algieba:**
    *   **Characteristics:** Smooth, Lower pitch.
    *   **Best For:** Suave, sophisticated, and charismatic personas. The classic "movie trailer" voice, ideal for a romantic lead or a luxury narrator.
    *   **Accent & Language Potential:** Its smoothness is perfect for a deep, polished **RP British** accent or a classic, smooth **French** accent.

*   **Enceladus:**
    *   **Characteristics:** Breathy, Lower pitch.
    *   **Best For:** Intimate, secretive, or villainous characters. The breathy quality can create a sense of mystery or closeness.
    *   **Accent & Language Potential:** The breathiness can add a unique quality to sensual accents like **French** or **Italian**, or create an intriguing, soft-spoken character in any language.

*   **Fenrir:**
    *   **Characteristics:** Excitable, Lower pitch.
    *   **Best For:** Passionate, strong, and statesmanlike figures. Can convey both excitement and gravity. A very dynamic voice.
    *   **Accent & Language Potential:** A powerful base for strong African accents (e.g., a passionate **Nigerian** or **South African** accent) and historical figures requiring a commanding presence.

*   **Iapetus:**
    *   **Characteristics:** Clear, Lower middle pitch.
    *   **Best For:** A straightforward and trustworthy narrator or guide. Similar to Anillam but slightly less firm, making it more approachable.
    *   **Accent & Language Potential:** Its clarity makes it a highly versatile and safe choice for any accent that needs to be easily understood, from **Standard American** to **International English**.

*   **Pulcherrima:**
    *   **Characteristics:** Forward, Middle pitch.
    *   **Best For:** Confident, assertive, and direct personas. A good voice for a CEO, a public speaker, or a character who is a natural leader.
    *   **Accent & Language Potential:** The forward placement of the voice suits assertive accents, such as a sharp **New York American** accent or a confident **Russian** accent.

*   **Rasalgethi:**
    *   **Characteristics:** Informative, Middle pitch.
    *   **Best For:** Documentaries, educational content, and any persona whose primary role is to teach or explain complex topics clearly.
    *   **Accent & Language Potential:** A very neutral and clear voice, making it an excellent all-rounder for various forms of **English** and other languages where intelligibility is paramount.

*   **Sadachbia:**
    *   **Characteristics:** Lively, Lower pitch.
    *   **Best For:** A passionate storyteller or a charismatic host. The lower pitch adds weight, while the liveliness keeps it engaging.
    *   **Accent & Language Potential:** A great combination for a lively **Spanish** or **Latin American** accent, where passion is conveyed with a deeper vocal resonance.

*   **Sadaltager:**
    *   **Characteristics:** Knowledgeable, Middle pitch.
    *   **Best For:** A professor, a scientist, or an expert in any field. The voice conveys intelligence and a calm sense of knowing.
    *   **Accent & Language Potential:** Excellent for a measured, academic **British** or **European** accent. It sounds thoughtful and precise.

*   **Umbriel:**
    *   **Characteristics:** Easy-going, Lower pitch.
    *   **Best For:** A relaxed and laid-back friend or mentor. Think of a cool uncle, a chill podcaster, or a friendly bartender.
    *   **Accent & Language Potential:** Perfect for a casual, deep-voiced **American** accent. The relaxed delivery also suits a laid-back **Australian** accent.

*   **Zubenelgenubi:**
    *   **Characteristics:** Casual, Lower middle pitch.
    *   **Best For:** A conversational and relatable persona. Excellent for podcasts, friendly advice, or any character that should feel like a peer.
    *   **Accent & Language Potential:** Its casual nature is ideal for a natural, everyday **American** accent, avoiding any formal stiffness.
