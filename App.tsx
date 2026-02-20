import React from 'react';

import { DashboardView } from './views/DashboardView';
import InventoryView from './views/InventoryView';      // ← No curly braces
import { SalesView } from './views/SalesView';
import { ExpensesView } from './views/ExpensesView';

const App = () => {
    return (
        <div>
            <h1>Business Money Tracker</h1>
            <DashboardView />
            <InventoryView />
            <SalesView />
            <ExpensesView />
        </div>
    );
};

export default App;
