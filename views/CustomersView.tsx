import React from 'react';
import { MobileHeader } from '../components/MobileHeader';
import { Customer } from '../types';

interface CustomersViewProps {
  customers: Customer[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isDemoMode: boolean;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ customers, searchQuery, setSearchQuery, isDemoMode }) => {
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-32">
      <MobileHeader 
        title="Customers" 
        showSearch 
        placeholder="Search email or name..." 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        isDemoMode={isDemoMode} 
      />
      <div className="px-5 mt-4 space-y-4">
        {filteredCustomers.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[36px] border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center font-black text-lg shadow-lg">
                {c.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{c.name}</h4>
                <p className="text-xs text-gray-500">{c.email}</p>
              </div>
            </div>
            <div className="flex justify-between items-end border-t border-gray-50 pt-4">
              <div>
                <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest mb-1">Spent</p>
                <p className="text-base font-black text-indigo-600">${c.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
