
import React, { useState, useCallback, useEffect } from 'react';
import InputField from './components/InputField';
import SelectField from './components/SelectField';
import LoadingSpinner from './components/LoadingSpinner';
import PlanSection from './components/PlanSection';
import ExpensePieChart from './components/ExpensePieChart';
import IncomeAllocationBar from './components/IncomeAllocationBar';
import { generateFinancialPlan } from './services/geminiService';
import type { FinancialData, PlanSectionData, DebtInfo, InvestmentInfo } from './types';

// Icons for plan sections
const SummaryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const SavingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const InvestmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const DebtIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const TaxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>;
const InvestmentActionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const TaxActionIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SummaryAtAGlanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;


// Declare global libraries from CDN
declare const jspdf: any;
declare const html2canvas: any;

const translations = {
  English: {
    headerTitle: 'FinanceBuddyGPT',
    formTitle: 'Your Financial Details',
    yourNameLabel: 'Your Name',
    yourNamePlaceholder: 'e.g., Ravi Sharma',
    yourAgeLabel: 'Your Age',
    yourAgePlaceholder: 'e.g., 30',
    incomeLabel: 'Monthly Income (Post-Tax)',
    incomePlaceholder: 'e.g., 75000',
    fixedExpensesLabel: 'Monthly Fixed Expenses',
    fixedExpensesPlaceholder: 'e.g., Rent, Bills',
    variableExpensesLabel: 'Monthly Variable Expenses',
    variableExpensesPlaceholder: 'e.g., Food, Shopping',
    savingsLabel: 'Current Savings',
    savingsPlaceholder: 'e.g., 100000',
    investmentsTitle: 'Investment Details',
    investmentTypeLabel: 'Type',
    investmentTypePlaceholder: 'e.g. Mutual Fund',
    investmentAmountLabel: 'Amount (₹)',
    investmentAmountPlaceholder: 'e.g. 50000',
    addInvestmentBtn: '+ Add another investment',
    goalsLabel: 'Financial Goals',
    goalsPlaceholder: 'e.g., Buy a house, retirement',
    timeframeLabel: 'Goal Timeframe (Years)',
    timeframePlaceholder: 'e.g., 5',
    debtTitle: 'Debt Details',
    debtTypeLabel: 'Type',
    debtTypePlaceholder: 'Credit Card',
    debtAmountLabel: 'Outstanding Amount (₹)',
    debtAmountPlaceholder: '50000',
    debtRateLabel: 'Interest Rate (%)',
    debtRatePlaceholder: '24',
    debtTenureLabel: 'Remaining Tenure (Months)',
    debtTenurePlaceholder: 'e.g., 24',
    addDebtBtn: '+ Add another debt',
    removeBtn: 'Remove',
    riskLabel: 'Risk Tolerance',
    generateBtn: 'Generate My Plan',
    generatingBtn: 'Generating Plan...',
    welcomeTitle: 'Welcome to FinanceBuddyGPT!',
    welcomeMessage: 'Fill in your details on the left to get a personalized financial plan tailored for you.',
    downloadBtn: 'Download Report',
    downloadingBtn: 'Downloading...',
    snapshotTitle: 'Financial Snapshot',
    validationError: 'Your total monthly expenses exceed your monthly income. Please review your numbers.',
    backToDetails: 'Details',
    yourPlan: 'Your Plan'
  },
  Hindi: {
    headerTitle: 'फाइनेंसबडीGPT',
    formTitle: 'आपके वित्तीय विवरण',
    yourNameLabel: 'आपका नाम',
    yourNamePlaceholder: 'उदा., रवि शर्मा',
    yourAgeLabel: 'आपकी उम्र',
    yourAgePlaceholder: 'उदा., 30',
    incomeLabel: 'मासिक आय (कर के बाद)',
    incomePlaceholder: 'उदा., 75000',
    fixedExpensesLabel: 'मासिक निश्चित व्यय',
    fixedExpensesPlaceholder: 'उदा., किराया, बिल',
    variableExpensesLabel: 'मासिक परिवर्तनीय व्यय',
    variableExpensesPlaceholder: 'उदा., भोजन, खरीदारी',
    savingsLabel: 'वर्तमान बचत',
    savingsPlaceholder: 'उदा., 100000',
    investmentsTitle: 'निवेश विवरण',
    investmentTypeLabel: 'प्रकार',
    investmentTypePlaceholder: 'उदा., म्यूचुअल फंड',
    investmentAmountLabel: 'राशि (₹)',
    investmentAmountPlaceholder: 'उदा., 50000',
    addInvestmentBtn: '+ एक और निवेश जोड़ें',
    goalsLabel: 'वित्तीय लक्ष्य',
    goalsPlaceholder: 'उदा., घर खरीदना, सेवानिवृत्ति',
    timeframeLabel: 'लक्ष्य समय-सीमा (वर्ष)',
    timeframePlaceholder: 'उदा., 5',
    debtTitle: 'ऋण विवरण',
    debtTypeLabel: 'प्रकार',
    debtTypePlaceholder: 'क्रेडिट कार्ड',
    debtAmountLabel: 'बकाया राशि (₹)',
    debtAmountPlaceholder: '50000',
    debtRateLabel: 'ब्याज दर (%)',
    debtRatePlaceholder: '24',
    debtTenureLabel: 'शेष अवधि (महीने)',
    debtTenurePlaceholder: 'उदा., 24',
    addDebtBtn: '+ एक और ऋण जोड़ें',
    removeBtn: 'हटाएं',
    riskLabel: 'जोखिम सहिष्णुता',
    generateBtn: 'मेरी योजना बनाएं',
    generatingBtn: 'योजना बन रही है...',
    welcomeTitle: 'फाइनेंसबडीGPT में आपका स्वागत है!',
    welcomeMessage: 'अपने लिए एक व्यक्तिगत वित्तीय योजना प्राप्त करने के लिए बाईं ओर अपना विवरण भरें।',
    downloadBtn: 'रिपोर्ट डाउनलोड करें',
    downloadingBtn: 'डाउनलोड हो रहा है...',
    snapshotTitle: 'वित्तीय स्नैपशॉट',
    validationError: 'आपके कुल मासिक खर्चे आपकी मासिक आय से अधिक हैं। कृपया अपने नंबरों की समीक्षा करें।',
    backToDetails: 'विवरण',
    yourPlan: 'आपकी योजना'
  }
};

interface GeneratedPlan {
  sections: PlanSectionData[];
  disclaimer: string;
}

interface GeneratedPlans {
  English?: GeneratedPlan;
  Hindi?: GeneratedPlan;
}


const App: React.FC = () => {
  const [formData, setFormData] = useState<FinancialData>({
    name: '',
    age: '',
    income: '',
    fixedExpenses: '',
    variableExpenses: '',
    debts: [{ id: 1, type: '', outstandingAmount: '', interestRate: '', remainingTenure: '' }],
    savings: '',
    investments: [{ id: 1, type: '', amount: '' }],
    goals: '',
    goalTimeframe: '',
    riskTolerance: 'Moderate',
  });

  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlans>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobilePage, setMobilePage] = useState<'form' | 'report'>('form');
  const [isFormDirty, setIsFormDirty] = useState(true);

  const t = translations[language];

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsFormDirty(true);
  }, []);

  const handleDebtChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newDebts = [...formData.debts];
    newDebts[index] = { ...newDebts[index], [name]: value } as DebtInfo;
    setFormData(prev => ({ ...prev, debts: newDebts }));
    setIsFormDirty(true);
  };
  
  const handleInvestmentChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newInvestments = [...formData.investments];
    newInvestments[index] = { ...newInvestments[index], [name]: value } as InvestmentInfo;
    setFormData(prev => ({ ...prev, investments: newInvestments }));
    setIsFormDirty(true);
  };

  const addDebtField = () => {
    setFormData(prev => ({
        ...prev,
        debts: [...prev.debts, { id: Date.now(), type: '', outstandingAmount: '', interestRate: '', remainingTenure: '' }]
    }));
    setIsFormDirty(true);
  };
  
  const addInvestmentField = () => {
    setFormData(prev => ({
        ...prev,
        investments: [...prev.investments, { id: Date.now(), type: '', amount: '' }]
    }));
    setIsFormDirty(true);
  };

  const removeDebtField = (index: number) => {
    const newDebts = formData.debts.filter((_, i) => i !== index);
    if (newDebts.length === 0) {
      setFormData(prev => ({ ...prev, debts: [{ id: Date.now(), type: '', outstandingAmount: '', interestRate: '', remainingTenure: '' }] }));
    } else {
      setFormData(prev => ({ ...prev, debts: newDebts }));
    }
    setIsFormDirty(true);
  };
  
  const removeInvestmentField = (index: number) => {
    const newInvestments = formData.investments.filter((_, i) => i !== index);
    if (newInvestments.length === 0) {
        setFormData(prev => ({ ...prev, investments: [{ id: Date.now(), type: '', amount: '' }] }));
    } else {
        setFormData(prev => ({ ...prev, investments: newInvestments }));
    }
    setIsFormDirty(true);
  };


  const parsePlan = (text: string): GeneratedPlan => {
    const disclaimerRegex = /(\*\*Disclaimer:\*\*.*$)|(\*\*अस्वीकरण:\*\*.*$)/s;
    const disclaimerMatch = text.match(disclaimerRegex);
    let planText = text;
    let parsedDisclaimer = '';
  
    if (disclaimerMatch) {
      planText = text.replace(disclaimerRegex, '').trim();
      parsedDisclaimer = disclaimerMatch[0].replace(/\*\*/g, '');
    }
  
    const sections = planText.split(/##\s|##/).filter(s => s.trim() !== '');
    const parsedSections: PlanSectionData[] = sections.map(section => {
      const parts = section.split('\n');
      const title = parts[0].trim();
      let content = parts.slice(1).join('\n').trim();
  
      content = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^\s*\*\s(.*?)$/gm, '<li>$1</li>');
  
      content = content.replace(/(<li>.*?<\/li>(?:\s*<br \/>\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>');
      
      content = content.replace(/\n/g, '<br />');
      content = content.replace(/<br \/>(\s*<ul>)/g, '$1');
      content = content.replace(/(<\/ul>)<br \/>/g, '$1');
      content = content.replace(/<\/li><br \/>/g, '</li>');
  
      return { title, content };
    });
    return { sections: parsedSections, disclaimer: parsedDisclaimer };
  };
  
  const getSectionIcon = (title: string) => {
    if (title.includes('Summary at a Glance') || title.includes('एक नज़र में सारांश')) return <SummaryAtAGlanceIcon />;
    if (title.includes('Summary') || title.includes('सारांश')) return <SummaryIcon />;
    if (title.includes('Savings') || title.includes('बचत')) return <SavingsIcon />;
    if (title.includes('Investment Suggestions') || title.includes('निवेश सुझाव')) return <InvestmentIcon />;
    if (title.includes('Investment Action Plan') || title.includes('निवेश कार्य योजना')) return <InvestmentActionIcon />;
    if (title.includes('Debt') || title.includes('ऋण')) return <DebtIcon />;
    if (title.includes('Tax-Saving Advice') || title.includes('कर-बचत सलाह')) return <TaxIcon />;
    if (title.includes('Tax Action Plan') || title.includes('कर कार्य योजना')) return <TaxActionIcon />;
    return <SummaryIcon />;
  };

  const handleDownload = async () => {
    const reportElement = document.getElementById('report-container');
    if (!reportElement) {
      console.error("Report element not found");
      return;
    }

    setIsDownloading(true);

    try {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4', true);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pdfWidth - margin * 2;
        let yPosition = margin;

        const addElementToPdf = async (element: HTMLElement) => {
            const renderContainer = document.createElement('div');
            renderContainer.style.position = 'absolute';
            renderContainer.style.left = '-9999px';
            renderContainer.style.width = '600px';
            
            const clone = element.cloneNode(true) as HTMLElement;
            renderContainer.appendChild(clone);
            document.body.appendChild(renderContainer);
            
            const canvas = await html2canvas(clone, {
                scale: 3,
                useCORS: true,
                logging: false,
                windowWidth: renderContainer.scrollWidth,
                windowHeight: renderContainer.scrollHeight,
            });

            document.body.removeChild(renderContainer);

            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            if (yPosition + imgHeight + 5 > pdfHeight - margin) {
                pdf.addPage();
                yPosition = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, yPosition, contentWidth, imgHeight, undefined, 'FAST');
            yPosition += imgHeight + 5;
        };

        const snapshotElement = reportElement.querySelector<HTMLElement>(':scope > div:first-child');
        const contentElement = document.getElementById('report-content');
        
        if (snapshotElement) {
            await addElementToPdf(snapshotElement);
        }

        if (contentElement) {
            const sections = Array.from(contentElement.children) as HTMLElement[];
            for (const section of sections) {
                await addElementToPdf(section);
            }
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

  const currentPlan = generatedPlans[language];

  const handleLanguageSwitch = (newLanguage: 'English' | 'Hindi') => {
    setLanguage(newLanguage);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const income = parseFloat(formData.income) || 0;
    const fixedExpenses = parseFloat(formData.fixedExpenses) || 0;
    const variableExpenses = parseFloat(formData.variableExpenses) || 0;

    if (income > 0 && (fixedExpenses + variableExpenses > income)) {
        setError(t.validationError);
        return;
    }

    setIsLoading(true);
    setGeneratedPlans({});

    try {
      const [englishResponse, hindiResponse] = await Promise.all([
        generateFinancialPlan(formData, 'English'),
        generateFinancialPlan(formData, 'Hindi'),
      ]);
      
      if (englishResponse.startsWith('An error occurred')) throw new Error(englishResponse);
      if (hindiResponse.startsWith('An error occurred')) throw new Error(hindiResponse);

      const englishPlan = parsePlan(englishResponse);
      const hindiPlan = parsePlan(hindiResponse);

      setGeneratedPlans({ English: englishPlan, Hindi: hindiPlan });
      setIsFormDirty(false);
      
      if (isMobile) {
        setMobilePage('report');
        window.scrollTo(0, 0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`min-h-screen text-text-primary ${language === 'Hindi' ? 'font-hindi' : 'font-sans'}`}>
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
           <div className="flex items-center gap-1.5 sm:gap-3">
            <svg className="w-7 h-7 sm:w-10 sm:h-10 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="currentColor" fillOpacity="0.1"/>
              <path d="M13.5 14H9.5C8.39543 14 7.5 13.1046 7.5 12V11C7.5 9.89543 8.39543 9 9.5 9H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9.5 11.5H14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11 17V12L16 7" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M13.5 7H16V9.5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-lg sm:text-2xl font-bold">{t.headerTitle}</h1>
           </div>
           <div className="flex items-center space-x-2">
             <button
                onClick={() => handleLanguageSwitch('English')}
                className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                  language === 'English'
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-200 text-text-secondary hover:bg-gray-300'
                }`}
             >
               <span className="sm:hidden">En</span>
               <span className="hidden sm:inline">English</span>
             </button>
             <button
                onClick={() => handleLanguageSwitch('Hindi')}
                className={`px-3 sm:px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                  language === 'Hindi'
                    ? 'bg-primary text-white shadow'
                    : 'bg-gray-200 text-text-secondary hover:bg-gray-300'
                }`}
             >
               <span className="sm:hidden">हि</span>
               <span className="hidden sm:inline">हिन्दी</span>
             </button>
           </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`lg:col-span-4 ${isMobile && mobilePage === 'report' ? 'hidden' : 'block'}`}>
            <div className="bg-card p-6 rounded-xl shadow-md lg:sticky lg:top-24">
              <h2 className="text-xl font-bold mb-4">{t.formTitle}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <InputField label={t.yourNameLabel} name="name" type="text" value={formData.name} onChange={handleChange} placeholder={t.yourNamePlaceholder} />
                <InputField label={t.yourAgeLabel} name="age" value={formData.age} onChange={handleChange} placeholder={t.yourAgePlaceholder} />
                <InputField label={t.incomeLabel} name="income" value={formData.income} onChange={handleChange} placeholder={t.incomePlaceholder} />
                <InputField label={t.fixedExpensesLabel} name="fixedExpenses" value={formData.fixedExpenses} onChange={handleChange} placeholder={t.fixedExpensesPlaceholder} />
                <InputField label={t.variableExpensesLabel} name="variableExpenses" value={formData.variableExpenses} onChange={handleChange} placeholder={t.variableExpensesPlaceholder} />
                <InputField label={t.savingsLabel} name="savings" value={formData.savings} onChange={handleChange} placeholder={t.savingsPlaceholder} />
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">{t.investmentsTitle}</h3>
                  <div className="space-y-3">
                     {formData.investments.map((inv, index) => (
                      <div key={inv.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                           <InputField id={`inv-type-${index}`} label={t.investmentTypeLabel} name="type" type="text" value={inv.type} onChange={(e) => handleInvestmentChange(index, e)} placeholder={t.investmentTypePlaceholder} required={false} />
                           <InputField id={`inv-amount-${index}`} label={t.investmentAmountLabel} name="amount" value={inv.amount} onChange={(e) => handleInvestmentChange(index, e)} placeholder={t.investmentAmountPlaceholder} required={false} />
                           <div className="flex items-end col-span-2">
                            <button type="button" onClick={() => removeInvestmentField(index)} className="h-10 px-3 text-sm text-red-600 hover:bg-red-100 rounded-md ml-auto">{t.removeBtn}</button>
                           </div>
                        </div>
                      </div>
                     ))}
                  </div>
                  <button type="button" onClick={addInvestmentField} className="mt-2 text-sm font-semibold text-primary hover:text-blue-700">{t.addInvestmentBtn}</button>
                </div>
                
                <InputField label={t.goalsLabel} name="goals" as="textarea" value={formData.goals} onChange={handleChange} placeholder={t.goalsPlaceholder} />
                <InputField label={t.timeframeLabel} name="goalTimeframe" value={formData.goalTimeframe} onChange={handleChange} placeholder={t.timeframePlaceholder} />
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-text-primary">{t.debtTitle}</h3>
                  <div className="space-y-3">
                    {formData.debts.map((debt, index) => (
                      <div key={debt.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-2">
                          <InputField id={`debt-type-${index}`} label={t.debtTypeLabel} name="type" type="text" value={debt.type} onChange={(e) => handleDebtChange(index, e)} placeholder={t.debtTypePlaceholder} required={false} />
                          <InputField id={`debt-outstandingAmount-${index}`} label={t.debtAmountLabel} name="outstandingAmount" value={debt.outstandingAmount} onChange={(e) => handleDebtChange(index, e)} placeholder={t.debtAmountPlaceholder} required={false} />
                          <InputField id={`debt-rate-${index}`} label={t.debtRateLabel} name="interestRate" value={debt.interestRate} onChange={(e) => handleDebtChange(index, e)} placeholder={t.debtRatePlaceholder} required={false} />
                          <InputField id={`debt-tenure-${index}`} label={t.debtTenureLabel} name="remainingTenure" value={debt.remainingTenure} onChange={(e) => handleDebtChange(index, e)} placeholder={t.debtTenurePlaceholder} required={false} />
                           <div className="flex items-end col-span-2">
                            <button type="button" onClick={() => removeDebtField(index)} className="h-10 px-3 text-sm text-red-600 hover:bg-red-100 rounded-md ml-auto">{t.removeBtn}</button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addDebtField} className="mt-2 text-sm font-semibold text-primary hover:text-blue-700">{t.addDebtBtn}</button>
                </div>

                <SelectField label={t.riskLabel} name="riskTolerance" value={formData.riskTolerance} onChange={handleChange} options={['Conservative', 'Moderate', 'Aggressive']} />
                
                {error && <div className="text-sm text-red-600 text-center p-2 bg-red-50 border border-red-200 rounded-lg">{error}</div>}
                
                <button type="submit" disabled={isLoading || !isFormDirty} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed">
                  {isLoading ? t.generatingBtn : t.generateBtn}
                </button>
              </form>
               {isMobile && mobilePage === 'form' && Object.keys(generatedPlans).length > 0 && (
                <div className="mt-8 flex items-center justify-center border-t pt-6">
                    <div className="flex items-center space-x-4 text-sm font-semibold">
                        <span className="text-primary border-b-2 border-primary p-2">
                            {t.backToDetails} (1/2)
                        </span>
                        <button 
                            onClick={() => {
                                setMobilePage('report');
                                window.scrollTo(0, 0);
                            }}
                            className="text-text-secondary hover:text-primary transition-colors p-2"
                        >
                            {t.yourPlan} (2/2) &rarr;
                        </button>
                    </div>
                </div>
              )}
            </div>
          </div>

          <div className={`lg:col-span-8 ${isMobile && mobilePage === 'form' ? 'hidden' : 'block'}`}>
            <div className="bg-card p-6 rounded-xl shadow-md min-h-[60vh] flex flex-col">
              {isLoading && <div className="m-auto"><LoadingSpinner /></div>}
              {!isLoading && error && !currentPlan && <div className="m-auto text-red-500 font-semibold p-4 border border-red-200 bg-red-50 rounded-lg">{error}</div>}
              
              {!isLoading && !error && !currentPlan && (
                 <div className="m-auto text-center text-text-secondary">
                    <h2 className="text-2xl font-bold mb-2">{t.welcomeTitle}</h2>
                    <p>{t.welcomeMessage}</p>
                 </div>
              )}

              {currentPlan && (
                <div>
                  <div id="report-container">
                      <div className="mb-8">
                          <h2 className={`text-2xl font-bold text-text-primary mb-4 ${language === 'Hindi' ? 'font-hindi' : 'font-sans'}`}>{t.snapshotTitle}</h2>
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                              <ExpensePieChart 
                                  fixed={parseFloat(formData.fixedExpenses) || 0}
                                  variable={parseFloat(formData.variableExpenses) || 0}
                                  language={language}
                              />
                              <IncomeAllocationBar 
                                  income={parseFloat(formData.income) || 0}
                                  fixedExpenses={parseFloat(formData.fixedExpenses) || 0}
                                  variableExpenses={parseFloat(formData.variableExpenses) || 0}
                                  language={language}
                              />
                          </div>
                      </div>
                    <div id="report-content" className="space-y-6">
                        {currentPlan.sections.map((section, index) => (
                          <PlanSection key={index} section={section} icon={getSectionIcon(section.title)} />
                        ))}
                        {currentPlan.disclaimer && (
                          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm text-center">
                            <p>{currentPlan.disclaimer}</p>
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-center">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="inline-flex items-center justify-center bg-secondary text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      {isDownloading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t.downloadingBtn}
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                          {t.downloadBtn}
                        </>
                      )}
                    </button>
                  </div>
                  {isMobile && (
                    <div className="mt-8 flex items-center justify-center border-t pt-6">
                        <div className="flex items-center space-x-4 text-sm font-semibold">
                            <button 
                                onClick={() => {
                                    setMobilePage('form');
                                    window.scrollTo(0, 0);
                                }}
                                className="text-text-secondary hover:text-primary transition-colors p-2"
                            >
                                &larr; {t.backToDetails} (1/2)
                            </button>
                            <span className="text-primary border-b-2 border-primary p-2">
                                {t.yourPlan} (2/2)
                            </span>
                        </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
