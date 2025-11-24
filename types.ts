export interface DebtInfo {
  id: number;
  type: string;
  outstandingAmount: string;
  interestRate: string;
  remainingTenure: string;
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
  riskTolerance: 'Conservative' | 'Moderate' | 'Aggressive';
}

export interface PlanSectionData {
  title: string;
  content: string;
}