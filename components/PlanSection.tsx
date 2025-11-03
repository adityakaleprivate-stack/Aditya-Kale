import React from 'react';
import type { PlanSectionData } from '../types';

interface PlanSectionProps {
  section: PlanSectionData;
  icon: React.ReactNode;
}

const PlanSection: React.FC<PlanSectionProps> = ({ section, icon }) => {
  return (
    <div className="bg-card p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-primary/10 text-primary rounded-full">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-text-primary">{section.title}</h3>
      </div>
      <div 
        className="text-text-secondary space-y-3 leading-relaxed [&_strong]:font-semibold [&_strong]:text-text-primary [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2"
        dangerouslySetInnerHTML={{ __html: section.content }} 
      />
    </div>
  );
};

export default PlanSection;