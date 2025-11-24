import React from 'react';

interface ExpensePieChartProps {
  fixed: number;
  variable: number;
  language: 'English' | 'Hindi';
}

const translations = {
    English: {
      title: 'Expense Breakdown',
      fixed: 'Fixed Expenses',
      variable: 'Variable Expenses',
      total: 'Total Expenses',
    },
    Hindi: {
      title: 'व्यय का विवरण',
      fixed: 'निश्चित व्यय',
      variable: 'परिवर्तनीय व्यय',
      total: 'कुल व्यय',
    }
};

const ExpensePieChart: React.FC<ExpensePieChartProps> = ({ fixed, variable, language }) => {
  const t = translations[language];
  const total = fixed + variable;
  if (total === 0) {
      return null;
  }
  const fixedPercent = (fixed / total) * 100;
  const variablePercent = (variable / total) * 100;

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const fixedPercentDecimal = fixedPercent / 100;
  
  const isFixedOnly = variablePercent === 0;
  const isVariableOnly = fixedPercent === 0;

  const fixedEndPoint = getCoordinatesForPercent(fixedPercentDecimal);
  
  const largeArcFlagFixed = fixedPercent > 50 ? 1 : 0;
  const fixedPathData = `M 1 0 A 1 1 0 ${largeArcFlagFixed} 1 ${fixedEndPoint[0]} ${fixedEndPoint[1]} L 0 0`;
  
  const largeArcFlagVariable = variablePercent > 50 ? 1 : 0;
  const variablePathData = `M ${fixedEndPoint[0]} ${fixedEndPoint[1]} A 1 1 0 ${largeArcFlagVariable} 1 1 0 L 0 0`;
  
  const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

  return (
    <div className="bg-card p-6 rounded-xl shadow-md h-full flex flex-col">
      <h3 className="text-lg font-bold text-text-primary mb-4">{t.title}</h3>
      <div className="flex-grow flex items-center justify-center relative my-4">
        <svg viewBox="-1.2 -1.2 2.4 2.4" className="w-48 h-48 transform -rotate-90">
            { isFixedOnly ? (
                <circle cx="0" cy="0" r="1" fill="#3B82F6" />
            ) : isVariableOnly ? (
                <circle cx="0" cy="0" r="1" fill="#10B981" />
            ) : (
                <>
                    <path d={variablePathData} fill="#10B981" />
                    <path d={fixedPathData} fill="#3B82F6" />
                </>
            )}
            <circle cx="0" cy="0" r="0.6" fill="white" />
        </svg>
        <div className="absolute text-center">
            <span className="text-xs text-text-secondary">{t.total}</span>
            <p className="text-2xl font-bold text-text-primary">{formatCurrency(total)}</p>
        </div>
      </div>
      <div className="mt-auto space-y-2 text-sm">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-text-secondary">{t.fixed}</span>
            </div>
            <span className="font-semibold text-text-primary">{formatCurrency(fixed)} ({fixedPercent.toFixed(1)}%)</span>
        </div>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-text-secondary">{t.variable}</span>
            </div>
            <span className="font-semibold text-text-primary">{formatCurrency(variable)} ({variablePercent.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};

export default ExpensePieChart;