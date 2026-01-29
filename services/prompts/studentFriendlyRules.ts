/**
 * Student-friendly content rules for AI slide generation.
 * Applied to slide content (bullet points) - NOT to speakerNotes (teleprompter).
 */
export function getStudentFriendlyRules(gradeLevel: string = 'Year 6'): string {
  return `
SLIDE CONTENT STYLE - STUDENT-FACING:
Write bullet points as conversational sentences directed at students, not teacher notes.
Target audience: ${gradeLevel} students.

TONE:
- Clear instructor tone - direct but approachable ("This is...", "Remember that...")
- Address students with "you" sometimes, mix with neutral phrasing
- Balanced voice - not too casual (no slang), not too dry (keep warmth)
- Consistent tone throughout all slides

VOCABULARY:
- Adapt complexity to ${gradeLevel} level
- For technical terms: use term + explanation pattern ("Photosynthesis - how plants make food")
- Sentence structure stays similar across ages, vocabulary complexity changes

CONTENT FORMAT:
- Bullet points must be complete sentences, not fragments
- Questions to students: rarely, only when content naturally calls for reflection
- Include calls-to-action when they enhance understanding

TRANSFORMATION:
- Teacher instructions ("Explain X") - transform to student-facing explanation of X
- Third-person ("students will learn...") - rephrase based on context
- Teacher references in content - keep when natural, rephrase when awkward

NOTE: These rules apply to the 'content' array (bullet points visible to students).
Speaker notes remain teacher-facing for teleprompter use.
`;
}
