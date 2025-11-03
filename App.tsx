import React, { useState, useCallback } from 'react';
import InputField from './components/InputField';
import SelectField from './components/SelectField';
import LoadingSpinner from './components/LoadingSpinner';
import PlanSection from './components/PlanSection';
import { generateFinancialPlan } from './services/geminiService';
import type { FinancialData, PlanSectionData, DebtInfo, InvestmentInfo } from './types';

// Icons for plan sections
const SummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SavingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const InvestmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const DebtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const TaxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>;

// Declare global libraries from CDN
declare const jspdf: any;
declare const html2canvas: any;

const App: React.FC = () => {
  const [formData, setFormData] = useState<FinancialData>({
    name: '',
    age: '',
    income: '',
    fixedExpenses: '',
    variableExpenses: '',
    debts: [{ id: 1, type: '', amount: '', interestRate: '' }],
    savings: '',
    investments: [{ id: 1, type: '', amount: '' }],
    goals: '',
    goalTimeframe: '',
    riskTolerance: 'Medium',
  });
  const [plan, setPlan] = useState<PlanSectionData[]>([]);
  const [disclaimer, setDisclaimer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  // FIX: Widen the event type to match the InputField's onChange prop.
  const handleDebtChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newDebts = [...formData.debts];
    newDebts[index] = { ...newDebts[index], [name]: value } as DebtInfo;
    setFormData(prev => ({ ...prev, debts: newDebts }));
  };
  
  // FIX: Widen the event type to match the InputField's onChange prop.
  const handleInvestmentChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newInvestments = [...formData.investments];
    newInvestments[index] = { ...newInvestments[index], [name]: value } as InvestmentInfo;
    setFormData(prev => ({ ...prev, investments: newInvestments }));
  };

  const addDebtField = () => {
    setFormData(prev => ({
        ...prev,
        debts: [...prev.debts, { id: Date.now(), type: '', amount: '', interestRate: '' }]
    }));
  };
  
  const addInvestmentField = () => {
    setFormData(prev => ({
        ...prev,
        investments: [...prev.investments, { id: Date.now(), type: '', amount: '' }]
    }));
  };

  const removeDebtField = (index: number) => {
    const newDebts = formData.debts.filter((_, i) => i !== index);
    if (newDebts.length === 0) {
      setFormData(prev => ({ ...prev, debts: [{ id: Date.now(), type: '', amount: '', interestRate: '' }] }));
    } else {
      setFormData(prev => ({ ...prev, debts: newDebts }));
    }
  };
  
  const removeInvestmentField = (index: number) => {
    const newInvestments = formData.investments.filter((_, i) => i !== index);
    if (newInvestments.length === 0) {
        setFormData(prev => ({ ...prev, investments: [{ id: Date.now(), type: '', amount: '' }] }));
    } else {
        setFormData(prev => ({ ...prev, investments: newInvestments }));
    }
  };


  const parsePlan = (text: string) => {
    const disclaimerRegex = /\*\*Disclaimer:\*\*.*$/s;
    const disclaimerMatch = text.match(disclaimerRegex);
    let planText = text;
  
    if (disclaimerMatch) {
      planText = text.replace(disclaimerRegex, '').trim();
      setDisclaimer(disclaimerMatch[0].replace(/\*\*/g, ''));
    } else {
      setDisclaimer('');
    }
  
    const sections = planText.split('## ').filter(s => s.trim() !== '');
    const parsedSections: PlanSectionData[] = sections.map(section => {
      const parts = section.split('\n');
      const title = parts[0].trim();
      let content = parts.slice(1).join('\n').trim();
  
      // Bolding and lists
      content = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\s*\*\s(.*?)$/gm, '<li>$1</li>');
  
      // Wrap consecutive <li>s in a <ul>
      content = content.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>').replace(/<\/li>\s*<li>/g, '</li><li>');
      
      // Cleanup newlines and breaks
      content = content.replace(/\n/g, '<br />');
      content = content.replace(/<br \/>(\s*<ul>)/g, '$1');
      content = content.replace(/(<\/ul>)<br \/>/g, '$1');
      content = content.replace(/<\/li><br \/>/g, '</li>');
  
      return { title, content };
    });
    setPlan(parsedSections);
  };
  
  const getSectionIcon = (title: string) => {
    if (title.includes('Summary')) return <SummaryIcon />;
    if (title.includes('Savings')) return <SavingsIcon />;
    if (title.includes('Investment')) return <InvestmentIcon />;
    if (title.includes('Debt')) return <DebtIcon />;
    if (title.includes('Tax')) return <TaxIcon />;
    return <SummaryIcon />;
  };

  const handleDownload = async () => {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) {
      console.error("Report element not found");
      return;
    }

    setIsDownloading(true);

    try {
        const canvas = await html2canvas(reportElement, {
            scale: 2,
            logging: false,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        const ratio = canvasWidth / canvasHeight;
        const imgHeightOnPdf = pdfWidth / ratio;
        
        let heightLeft = imgHeightOnPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
            position -= pdfHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeightOnPdf);
            heightLeft -= pdfHeight;
        }
        
        const userName = formData.name.trim().replace(/\s+/g, '_') || 'user';
        pdf.save(`FinanceBuddyGPT_Plan_${userName}.pdf`);

    } catch (err) {
        setError("Sorry, we couldn't generate the PDF report. Please try again.");
        console.error("PDF generation failed:", err);
    } finally {
        setIsDownloading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setPlan([]);
    setDisclaimer('');

    const response = await generateFinancialPlan(formData);
    
    if (response.startsWith('An error occurred')) {
      setError(response);
    } else {
      parsePlan(response);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen text-text-primary">
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
           <svg className="w-10 h-10 text-primary" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-9h4v2h-4v3l-4-4 4-4v3z"/></svg>
           <h1 className="text-2xl font-bold">FinanceBuddyGPT</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <div className="bg-card p-6 rounded-xl shadow-md sticky top-24">
              <h2 className="text-xl font-bold mb-4">Your Financial Details</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label="Your Name" name="name" type="text" value={formData.name} onChange={handleChange} placeholder="e.g., Ravi Sharma" />
                <InputField label="Your Age" name="age" value={formData.age} onChange={handleChange} placeholder="e.g., 30" />
                <InputField label="Monthly Income (Post-Tax)" name="income" value={formData.income} onChange={handleChange} placeholder="e.g., 75000" />
                <InputField label="Monthly Fixed Expenses" name="fixedExpenses" value={formData.fixedExpenses} onChange={handleChange} placeholder="e.g., Rent, Bills" />
                <InputField label="Monthly Variable Expenses" name="variableExpenses" value={formData.variableExpenses} onChange={handleChange} placeholder="e.g., Food, Shopping" />
                <InputField label="Current Savings" name="savings" value={formData.savings} onChange={handleChange} placeholder="e.g., 100000" />
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">Investment Details</h3>
                  <div className="space-y-3">
                     {formData.investments.map((inv, index) => (
                      <div key={inv.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                           <InputField id={`inv-type-${index}`} label="Type" name="type" type="text" value={inv.type} onChange={(e) => handleInvestmentChange(index, e as React.ChangeEvent<HTMLInputElement>)} placeholder="e.g. Mutual Fund" required={false} />
                           <InputField id={`inv-amount-${index}`} label="Amount (₹)" name="amount" value={inv.amount} onChange={(e) => handleInvestmentChange(index, e as React.ChangeEvent<HTMLInputElement>)} placeholder="e.g. 50000" required={false} />
                           <div className="flex items-end col-span-2">
                            <button type="button" onClick={() => removeInvestmentField(index)} className="h-10 px-3 text-sm text-red-600 hover:bg-red-100 rounded-md ml-auto">Remove</button>
                           </div>
                        </div>
                      </div>
                     ))}
                  </div>
                  <button type="button" onClick={addInvestmentField} className="mt-2 text-sm font-semibold text-primary hover:text-blue-700">+ Add another investment</button>
                </div>
                
                <InputField label="Financial Goals" name="goals" as="textarea" value={formData.goals} onChange={handleChange} placeholder="e.g., Buy a house, retirement" />
                <InputField label="Goal Timeframe (Years)" name="goalTimeframe" value={formData.goalTimeframe} onChange={handleChange} placeholder="e.g., 5" />
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">Debt Details</h3>
                  <div className="space-y-3">
                    {formData.debts.map((debt, index) => (
                      <div key={debt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                          <InputField id={`debt-type-${index}`} label="Type" name="type" type="text" value={debt.type} onChange={(e) => handleDebtChange(index, e as React.ChangeEvent<HTMLInputElement>)} placeholder="Credit Card" required={false} />
                          <InputField id={`debt-amount-${index}`} label="Amount (₹)" name="amount" value={debt.amount} onChange={(e) => handleDebtChange(index, e as React.ChangeEvent<HTMLInputElement>)} placeholder="50000" required={false} />
                          <InputField id={`debt-rate-${index}`} label="Interest Rate (%)" name="interestRate" value={debt.interestRate} onChange={(e) => handleDebtChange(index, e as React.ChangeEvent<HTMLInputElement>)} placeholder="24" required={false} />
                           <div className="flex items-end">
                            <button type="button" onClick={() => removeDebtField(index)} className="h-10 px-3 text-sm text-red-600 hover:bg-red-100 rounded-md">Remove</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addDebtField} className="mt-2 text-sm font-semibold text-primary hover:text-blue-700">+ Add another debt</button>
                </div>

                <SelectField label="Risk Tolerance" name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} options={['Conservative', 'Low', 'Medium', 'Moderate', 'Aggressive']} />
                
                <button type="submit" disabled={isLoading} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {isLoading ? 'Generating Plan...' : 'Generate My Plan'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-card p-6 rounded-xl shadow-md min-h-[60vh] flex flex-col">
              {isLoading && <div className="m-auto"><LoadingSpinner /></div>}
              {error && <div className="m-auto text-red-500 font-semibold p-4 border border-red-200 bg-red-50 rounded-lg">{error}</div>}
              
              {!isLoading && !error && plan.length === 0 && (
                 <div className="m-auto text-center text-text-secondary">
                    <h2 className="text-2xl font-bold mb-2">Welcome to FinanceBuddyGPT!</h2>
                    <p>Fill in your details on the left to get a personalized financial plan tailored for you.</p>
                 </div>
              )}

              {plan.length > 0 && (
                <>
                  <div id="report-content">
                    <div className="space-y-6">
                      {plan.map((section, index) => (
                        <PlanSection key={index} section={section} icon={getSectionIcon(section.title)} />
                      ))}
                       {disclaimer && (
                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm text-center">
                           <p>{disclaimer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-8 text-center">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center justify-center bg-secondary text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isDownloading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          Download Report
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;