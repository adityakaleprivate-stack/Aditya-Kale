import React from 'react';

interface InputFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder: string;
  id?: string;
  type?: 'text' | 'number';
  as?: 'input' | 'textarea';
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  id,
  type = 'number',
  as = 'input',
  required = true,
}) => {
  const fieldId = id || name;
  const commonProps = {
    id: fieldId,
    name,
    value,
    onChange,
    placeholder,
    required,
    className: "w-full px-4 py-2 mt-2 bg-gray-100 border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200",
  };

  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="font-semibold text-text-primary">
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea {...commonProps} rows={3} />
      ) : (
        <input {...commonProps} type={type} />
      )}
    </div>
  );
};

export default InputField;