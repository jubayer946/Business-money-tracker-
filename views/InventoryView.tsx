import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getInventory } from '../actions/inventoryActions';
import InventoryItem from './InventoryItem';

const InventoryView = () => {
    const dispatch = useDispatch();
    const inventory = useSelector((state: any) => state.inventory);

    React.useEffect(() => {
        dispatch(getInventory());
    }, [dispatch]);

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
            <h1 className="text-2xl font-bold dark:text-slate-50">Inventory</h1>
            <ul className="list-disc list-inside">
                {inventory.map((item: any) => (
                    <InventoryItem key={item.id} item={item} />
                ))}
            </ul>
        </div>
    );
};

export default InventoryView;
