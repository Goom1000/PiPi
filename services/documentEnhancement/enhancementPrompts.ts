import { DocumentAnalysis, EnhancementOptions } from '../../types';

/**
 * System prompt for document enhancement with differentiation rules.
 * Used by both Gemini and Claude providers.
 */
export const ENHANCEMENT_SYSTEM_PROMPT = `You are an expert educational content enhancer specializing in worksheet differentiation.

TASK: Create THREE versions of a worksheet with DIFFERENT DIFFICULTY LEVELS - not just different wording.

##############################################################################
# CRITICAL: YOU MUST CHANGE THE ACTUAL NUMBERS AND TASK DIFFICULTY
#
# WRONG: Same numbers ($50, 10%, 25%) with different wording
# RIGHT: Different numbers for each level ($30 simple, $50 standard, $75 detailed)
#
# If the Simple and Detailed versions have the same numbers as Standard,
# YOU HAVE FAILED THE TASK. The mathematical/task challenge MUST be different.
##############################################################################

=== SIMPLE VERSION (Lower ability) ===

YOU MUST make these changes for maths/numeracy worksheets:
- REDUCE budget amounts (e.g., $50 → $30)
- USE ONLY easy percentages: 10%, 50%, 25% (NO 15%, 17.5%, 33%)
- REDUCE number of items (5 items → 3 items)
- USE round numbers only ($5, $10, $20 - NOT $12, $47, $8.50)
- REMOVE multi-step calculations

EXAMPLE TRANSFORMATION:
Original: "Matt has $50. Items: Bread $5, Milk $4, Cheese $12, Apples $10, Cake $20"
Simple:   "Matt has $30. Items: Bread $5, Milk $5, Cake $20" (3 items, round numbers)

Original: "A $60 bag with 15% off"
Simple:   "A $50 bag with 10% off" (easier percentage, rounder number)

For English: Shorter texts, word banks provided, sentence starters given
For Science: Fewer variables, fill-in-the-blank, guided steps

Language: Short sentences (max 15 words), Year 4 vocabulary (ages 8-9)

=== STANDARD VERSION (Middle ability) ===

KEEP THE ORIGINAL WORKSHEET EXACTLY AS-IS.
- Same numbers, same percentages, same number of items
- Only clean up formatting and clarify wording
- Add "See Slide X" references
- Year 6 reading level (ages 10-11)

=== DETAILED VERSION (Higher ability) ===

YOU MUST make these changes for maths/numeracy worksheets:
- INCREASE budget amounts (e.g., $50 → $75 or $80)
- USE harder percentages: 15%, 17.5%, 12.5%, 33% (NOT just 10%, 25%, 50%)
- ADD more items (5 items → 6-7 items)
- USE decimal amounts ($12.50, $67.99, $8.75)
- ADD constraints ("You also need to save $15 for bus fare")
- ADD multi-step reasoning

EXAMPLE TRANSFORMATION:
Original: "Matt has $50. Items: Bread $5, Milk $4, Cheese $12, Apples $10, Cake $20"
Detailed: "Matt has $75 but must save $10 for transport. Items: Bread $4.50, Milk $3.75, Cheese $14.99, Apples $8.50, Cake $22, Juice $6.25, Yogurt $5.99"

Original: "A $60 bag with 10% off"
Detailed: "A $67.50 bag with 15% off, then calculate 10% GST on the discounted price"

For English: Longer texts, inference questions, compare/contrast, specific writing style required
For Science: More variables, design own experiment, evaluate limitations

Language: Complex sentences, Year 7-8 vocabulary (ages 11-13), require explanations

=== WHAT TO PRESERVE ===
- The LEARNING OBJECTIVE (what skill is being taught)
- The CONTEXT/SCENARIO (Matt shopping, customer buying bike, etc.)
- Visual content markers as "[Original diagram: description]"
- The STRUCTURE of questions (but difficulty changes)

SLIDE ALIGNMENT RULES:
- Identify which slides the resource content relates to
- Reference slide numbers in each version's slideAlignmentNote
- Echo key terminology and concepts from aligned slides
- Each version clearly shows which slides it aligns with
- Use format: "Worksheet aligns with Slide(s) X-Y"

ANSWER KEY RULES:
- Generate from the ENHANCED versions (not original)
- For closed questions: provide specific answers
- For open-ended questions: provide rubric with:
  * criteria: What to look for (2-4 points)
  * exemplar: Example good answer
  * commonMistakes: What to watch for (1-3 items)
- If Simple and Detailed have significantly different questions, use "per-level" structure
- Otherwise use "unified" structure

OUTPUT: Return valid JSON matching the EnhancementResult schema.`;

/**
 * Build the user prompt for document enhancement.
 * Includes document analysis, slide context, and options.
 */
export function buildEnhancementUserPrompt(
  documentAnalysis: DocumentAnalysis,
  slideContext: string,
  options: EnhancementOptions
): string {
  // Format elements from analysis
  const formattedElements = documentAnalysis.elements.map((element, index) => {
    const visualMarker = element.visualContent ? ' [Visual element - preserve placeholder]' : '';
    const childrenText = element.children?.length
      ? `\n  Children: ${element.children.join('; ')}`
      : '';
    const tableText = element.tableData
      ? `\n  Table: ${element.tableData.headers.join(' | ')}\n  ${element.tableData.rows.map(r => r.join(' | ')).join('\n  ')}`
      : '';

    return `${index + 1}. [${element.type.toUpperCase()}]${visualMarker}: ${element.content}${childrenText}${tableText}`;
  }).join('\n\n');

  return `DOCUMENT TO ENHANCE:

Title: ${documentAnalysis.title}
Type: ${documentAnalysis.documentType}
Grade Level: ${options.gradeLevel}
Pages: ${documentAnalysis.pageCount}
Has Answer Key in Original: ${documentAnalysis.hasAnswerKey}
Visual Elements: ${documentAnalysis.visualContentCount}

DOCUMENT ELEMENTS (in order):
${formattedElements}

---

LESSON SLIDES FOR ALIGNMENT:
${slideContext}

---

INSTRUCTIONS:
1. Analyze which slides this resource relates to (slideMatches)
2. Generate three differentiated versions (simple, standard, detailed)
3. For each version, include all elements with enhanced content appropriate to the level
4. ${options.generateAnswerKey ? 'Generate answer keys from the enhanced versions' : 'Skip answer key generation'}
5. Preserve all visual content markers
6. Add slide references where pedagogically helpful

Return the complete EnhancementResult as valid JSON.`;
}
