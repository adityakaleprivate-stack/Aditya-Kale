
import React from 'react';

interface IncomeAllocationBarProps {
  income: number;
  fixedExpenses: number;
  variableExpenses: number;
  language: 'English' | 'Hindi';
}

const translations = {
    English: {
      title: 'Income Allocation',
      income: 'Total Income',
      expenses: 'Expenses',
      disposable: 'Disposable Income',
      fixed: 'Fixed',
      variable: 'Variable',
    },
    Hindi: {
      title: 'आय का आवंटन',
      income: 'कुल आय',
      expenses: 'व्यय',
      disposable: 'प्रयोज्य आय',
      fixed: 'निश्चित',
      variable: 'परिवर्तनीय',
    }
};


const IncomeAllocationBar: React.FC<IncomeAllocationBarProps> = ({ income, fixedExpenses, variableExpenses, language }) => {
  const t = translations[language];
  if (income === 0) return null;

  const totalExpenses = fixedExpenses + variableExpenses;
  const disposableIncome = income - totalExpenses;

  const fixedPercent = (fixedExpenses / income) * 100;
  const variablePercent = (variableExpenses / income) * 100;
  const disposablePercent = (disposableIncome / income) * 100;

  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="bg-card p-6 rounded-xl shadow-md h-full flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-2">{t.title}</h3>
      <p className="text-sm text-text-secondary mb-4">{t.income}: <span className="font-bold text-text-primary">{formatCurrency(income)}</span></p>
      
      <div className="w-full h-8 flex rounded-lg overflow-hidden my-2">
        <div className="bg-blue-500" style={{ width: `${fixedPercent}%` }} title={`${t.fixed}: ${formatCurrency(fixedExpenses)}`}></div>
        <div className="bg-emerald-500" style={{ width: `${variablePercent}%` }} title={`${t.variable}: ${formatCurrency(variableExpenses)}`}></div>
        <div className="bg-gray-200" style={{ width: `${disposablePercent}%` }} title={`${t.disposable}: ${formatCurrency(disposableIncome)}`}></div>
      </div>

      <div className="mt-auto space-y-2 text-sm">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-text-secondary">{t.fixed} {t.expenses}</span>
            </div>
            <span className="font-semibold text-text-primary">{formatCurrency(fixedExpenses)} ({fixedPercent.toFixed(1)}%)</span>
        </div>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-text-secondary">{t.variable} {t.expenses}</span>
            </div>
            <span className="font-semibold text-text-primary">{formatCurrency(variableExpenses)} ({variablePercent.toFixed(1)}%)</span>
        </div>
         <div className="flex justify-between items-center pt-2 border-t mt-2">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span>
                <span className="text-text-secondary font-bold">{t.disposable}</span>
            </div>
            <span className="font-bold text-text-primary">{formatCurrency(disposableIncome)} ({disposablePercent.toFixed(1)}%)</span>
        </div>
      </div>

    </div>
  );
};

export default IncomeAllocationBar;
