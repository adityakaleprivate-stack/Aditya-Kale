import { GoogleGenAI } from "@google/genai";
import type { FinancialData, DebtInfo, InvestmentInfo } from '../types';

const formatDebts = (debts: DebtInfo[]): string => {
  if (debts.length === 0 || (debts.length === 1 && !debts[0].outstandingAmount)) {
    return "No debt specified.";
  }
  return debts
    .filter(debt => debt.outstandingAmount && debt.interestRate && debt.remainingTenure)
    .map(debt => `- Type: ${debt.type || 'N/A'}, Outstanding Amount: ₹${debt.outstandingAmount}, Interest Rate: ${debt.interestRate}%, Remaining Tenure: ${debt.remainingTenure} months`)
    .join('\n    ');
};

const formatInvestments = (investments: InvestmentInfo[]): string => {
  if (investments.length === 0 || (investments.length === 1 && !investments[0].amount)) {
    return "No investments specified.";
  }
  return investments
    .filter(inv => inv.amount && inv.type)
    .map(inv => `- Type: ${inv.type}, Amount: ₹${inv.amount}`)
    .join('\n    ');
};

// Helper function to extract numerical value from a goal string
const parseGoalAmount = (goal: string): number | null => {
    // Remove commas and leading/trailing spaces
    const cleanedGoal = goal.replace(/,/g, '').trim();

    // Regex to find numbers and units like lakh/crore
    const lakhRegex = /(\d*\.?\d+)\s*lakh/i;
    const croreRegex = /(\d*\.?\d+)\s*crore/i;
    const numberRegex = /(?:₹\s*)?(\d*\.?\d+)/;

    const lakhMatch = cleanedGoal.match(lakhRegex);
    if (lakhMatch && lakhMatch[1]) {
        return parseFloat(lakhMatch[1]) * 100000;
    }

    const croreMatch = cleanedGoal.match(croreRegex);
    if (croreMatch && croreMatch[1]) {
        return parseFloat(croreMatch[1]) * 10000000;
    }
    
    // Look for a raw number if units are not present
    const numberMatch = cleanedGoal.match(numberRegex);
    if (numberMatch && numberMatch[1]) {
        return parseFloat(numberMatch[1]);
    }

    return null;
};

// Helper function to calculate future value based on inflation
const calculateFutureValue = (presentValue: number, rate: number, years: number): number => {
    return presentValue * Math.pow(1 + rate, years);
};


const buildPrompt = (data: FinancialData, language: 'English' | 'Hindi'): string => {
  const debtDetails = formatDebts(data.debts);
  const investmentDetails = formatInvestments(data.investments);

  const userAge = parseInt(data.age, 10);
  let ageBasedGuidance = '';
  if (userAge < 30) {
    ageBasedGuidance = `The user is young (age ${userAge}). Emphasize the power of compounding and starting early. The investment advice can be more aggressive, focusing on long-term wealth creation (e.g., higher allocation to equities).`;
  } else if (userAge >= 30 && userAge <= 45) {
    ageBasedGuidance = `The user is in their mid-career (age ${userAge}). The advice should balance wealth creation with capital preservation. They may have more financial responsibilities like a family or loans. The plan should be robust and balanced.`;
  } else {
    ageBasedGuidance = `The user is nearing retirement (age ${userAge}). The primary focus should shift towards capital preservation and generating a stable income stream. Suggest safer investment options like debt funds, senior citizen savings schemes, and annuities. Reduce equity exposure.`;
  }
  
  // Inflation Adjustment Logic
  const goalAmount = parseGoalAmount(data.goals);
  const goalTimeframe = parseInt(data.goalTimeframe, 10);
  const INFLATION_RATE = 0.06; // Assume 6% annual inflation for India
  let inflationAdjustmentPrompt = '';
  let primaryObjective = `Your primary objective is to create a plan that helps the user achieve their stated financial goals: "${data.goals}" within their timeframe of "${data.goalTimeframe}" years. All advice must be framed with this objective in mind.`;

  if (goalAmount && goalTimeframe > 0) {
      const futureValue = calculateFutureValue(goalAmount, INFLATION_RATE, goalTimeframe);
      const formattedGoalAmount = `₹${goalAmount.toLocaleString('en-IN')}`;
      const formattedFutureValue = `₹${futureValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      
      inflationAdjustmentPrompt = `
    **CRITICAL CONTEXT: Inflation-Adjusted Goal Planning**
    The user's goal of "${data.goals}" needs to be adjusted for inflation.
    - Stated Goal Amount: ${formattedGoalAmount}
    - Timeframe: ${goalTimeframe} years
    - Assumed Annual Inflation: ${INFLATION_RATE * 100}%
    - **Inflation-Adjusted Target Amount: ${formattedFutureValue}**

    You MUST base your savings and investment plan on achieving this **inflation-adjusted target of ${formattedFutureValue}**.
    In your "Financial Summary" or "Investment Suggestions", you MUST explain to the user why their target has been adjusted, for example: "To have the purchasing power of ${formattedGoalAmount} today in ${goalTimeframe} years, you actually need to aim for ${formattedFutureValue} due to inflation."
      `;

      primaryObjective = `Your primary objective is to create a plan that helps the user achieve their inflation-adjusted financial goal of approximately ${formattedFutureValue} in ${data.goalTimeframe} years. Their stated (pre-inflation) goal is: "${data.goals}". All advice must be framed with achieving the inflation-adjusted goal in mind.`;
  }
  
  const financialSummaryPrompt = `1.  ## Financial Summary: Provide a detailed overview of ${data.name}'s financial health. Start with a short paragraph analyzing their income, expenses, and savings rate. Then, add 2-3 bullet points highlighting key metrics and their capacity to achieve their goals.`;

  const summaryAtAGlancePrompt = `8.  ## 🔍 Summary at a Glance: Provide a clear, actionable, bulleted summary of the most critical takeaways for ${data.name}. This should serve as a practical checklist for them to follow. Highlight the most impactful numbers and actions (e.g., "Invest ₹X monthly", "Pay off Y debt first").`;


  return `
    You are FinanceBuddyGPT, an AI-based personal finance assistant designed for Indian users.
    ${primaryObjective}
    
    IMPORTANT: You MUST respond entirely in ${language}.

    **CRITICAL CONTEXT: Age-Based Financial Strategy**
    You MUST tailor your financial advice, especially investment suggestions, based on the user's age.
    ${ageBasedGuidance}
    This context is crucial for providing relevant and responsible advice.
    
    ${inflationAdjustmentPrompt}

    The user will be shown a pie chart of their expense breakdown and a bar chart of their income allocation. Your "Financial Summary" can briefly reference these visuals without describing them in detail.

    Respond in a friendly, concise, and professional tone.
    The response should be in markdown format. Use bold for emphasis (e.g., **Key Point**) and bullet points for lists (e.g., * Item).

    Here is the user's financial data:
    - Name: ${data.name}
    - Age: ${data.age}
    - Monthly Income (after tax): ₹${data.income}
    - Monthly Fixed Expenses: ₹${data.fixedExpenses}
    - Monthly Variable Expenses: ₹${data.variableExpenses}
    - Current Savings: ₹${data.savings || '0'}
    - Existing Investments:
        ${investmentDetails}
    - Financial Goals: ${data.goals} (Timeframe: ${data.goalTimeframe} years)
    - Risk Tolerance: ${data.riskTolerance}
    - Existing Debts:
        ${debtDetails}

    Based on this data, create a personalized financial plan for ${data.name} with the following sections. Each section must start with a markdown h2 heading (e.g., "## Financial Summary").

    ${financialSummaryPrompt}
    2.  ## Savings and Budgeting Advice: Provide actionable tips to optimize spending and increase the amount available for investment towards their goals. Focus on practical budgeting techniques. The advice for building a foundational emergency fund should be mentioned last in this section. At the end of this section, on a new line, add a confidence indicator formatted like this: "📊 **Savings Confidence: High** — Your savings rate is strong." Use 📊 for High, ⚠️ for Moderate, and 🚩 for Low confidence.
    3.  ## Investment Suggestions: Provide investment suggestions that are directly aligned with achieving ${data.name}'s goal of "${data.goals}" within ${data.goalTimeframe} years, tailored to their ${data.riskTolerance} risk profile **AND their age (${data.age})**. Include Indian-specific options like SIPs in Index Funds, ELSS for tax saving, and PPF/Sukanya Samriddhi Yojana if relevant. At the end of this section, on a new line, add a confidence indicator formatted like this: "⚠️ **Investment Confidence: Moderate** — Your goals are achievable but require discipline." Use 📊 for High, ⚠️ for Moderate, and 🚩 for Low confidence.
    4.  ## Investment Action Plan: Based on the suggestions above, provide a clear, step-by-step action plan for ${data.name} to start investing towards their goals. Include specific monthly investment amounts (SIPs) and where to invest them. This should be a practical guide to get started. **This plan must reflect the age-appropriate strategy.**
    5.  ## Debt Repayment Plan: Leverage the outstanding amount, interest rate, and remaining tenure for each debt to create a sophisticated repayment strategy. Prioritize high-interest debts (debt avalanche method) and suggest how much extra the user could pay per month (based on their disposable income) to clear debts faster, specifying the potential savings in interest and reduction in tenure. If there is no debt, state that and commend the user. At the end of this section, on a new line, add a confidence indicator formatted like this: "🚩 **Debt Confidence: Low** — High-interest debt is impacting your ability to save." For no-debt cases, give a High confidence. Use 📊 for High, ⚠️ for Moderate, and 🚩 for Low confidence.
    6.  ## Tax-Saving Advice: Suggest ways to save tax under Indian laws, mentioning sections like 80C, 80D, HRA benefits, and NPS, framing it as a way to increase investable income.
    7.  ## Tax Action Plan: After providing advice, create a simple, actionable checklist for ${data.name} to implement the tax-saving strategies. For example, "Invest X amount in ELSS", "Claim HRA by submitting Y".
    ${summaryAtAGlancePrompt}

    IMPORTANT: At the very end of your entire response, add this exact disclaimer on a new line:
    "**Disclaimer:** This advice is general; consult a professional for specific financial decisions."
  `;
};

export const generateFinancialPlan = async (data: FinancialData, language: 'English' | 'Hindi'): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = buildPrompt(data, language);

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating financial plan:", error);
    if (error instanceof Error) {
        return `An error occurred while generating your plan: ${error.message}. Please check your API key and try again.`;
    }
    return "An unknown error occurred while generating your plan.";
  }
};