
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
       <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary"></div>
       <p className="text-text-secondary font-semibold">FinanceBuddyGPT is crafting your plan...</p>
    </div>
  );
};

export default LoadingSpinner;
