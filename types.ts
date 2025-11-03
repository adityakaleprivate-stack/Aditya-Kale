export interface DebtInfo {
  id: number;
  type: string;
  amount: string;
  interestRate: string;
}

export interface InvestmentInfo {
  id: number;
  type: string;
  amount: string;
}

export interface FinancialData {
  name: string;
  age: string;
  income: string;
  fixedExpenses: string;
  variableExpenses: string;
  debts: DebtInfo[];
  savings: string;
  investments: InvestmentInfo[];
  goals: string;
  goalTimeframe: string;
  riskTolerance: 'Conservative' | 'Low' | 'Medium' | 'Moderate' | 'Aggressive';
}

export interface PlanSectionData {
  title: string;
  content: string;
}