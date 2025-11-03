import { GoogleGenAI } from "@google/genai";
import type { FinancialData, DebtInfo, InvestmentInfo } from '../types';

const formatDebts = (debts: DebtInfo[]): string => {
  if (debts.length === 0 || (debts.length === 1 && !debts[0].amount)) {
    return "No debt specified.";
  }
  return debts
    .filter(debt => debt.amount && debt.interestRate)
    .map(debt => `- Type: ${debt.type || 'N/A'}, Amount: ₹${debt.amount}, Interest Rate: ${debt.interestRate}%`)
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


const buildPrompt = (data: FinancialData): string => {
  const debtDetails = formatDebts(data.debts);
  const investmentDetails = formatInvestments(data.investments);

  return `
    You are FinanceBuddyGPT, an AI-based personal finance assistant designed for Indian users.
    Your job is to take basic financial inputs from users and create a personalized financial plan.
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

    1.  ## Financial Summary: A brief overview of ${data.name}'s current financial health.
    2.  ## Savings and Budgeting Advice: Actionable tips to improve savings and manage budget. Suggest a savings rate based on their income and expenses.
    3.  ## Investment Suggestions: Provide investment suggestions tailored to ${data.name}'s risk profile and goals. Include Indian-specific options like SIPs in Index Funds, ELSS for tax saving, and PPF/Sukanya Samriddhi Yojana if relevant.
    4.  ## Debt Repayment Plan: A strategy to repay existing debt. Prioritize debts based on interest rates (debt avalanche method). If there is no debt, state that and commend the user.
    5.  ## Tax-Saving Advice: Suggest ways to save tax under Indian laws, mentioning sections like 80C, 80D, HRA benefits, and NPS.

    IMPORTANT: At the very end of your entire response, add this exact disclaimer on a new line:
    "**Disclaimer:** This advice is general; consult a professional for specific financial decisions."
  `;
};

export const generateFinancialPlan = async (data: FinancialData): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = buildPrompt(data);

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