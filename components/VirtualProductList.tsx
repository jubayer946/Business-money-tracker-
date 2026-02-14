
import React from 'react';
import { useVirtualList } from '../hooks/useVirtualList';
import { Product } from '../types';

interface VirtualProductListProps {
  products: Product[];
  renderProduct: (product: Product, index: number) => React.ReactNode;
  itemHeight?: number;
}

export const VirtualProductList: React.FC<VirtualProductListProps> = ({ 
  products, 
  renderProduct, 
  itemHeight = 90 
}) => {
  const { containerProps, wrapperProps, virtualItems, getItemProps } = useVirtualList({ 
    items: products, 
    itemHeight, 
    overscan: 3 
  });

  return (
    <div {...containerProps} className="h-[65vh] hide-scrollbar overscroll-contain pb-32">
      <div {...wrapperProps}>
        {virtualItems.map(({ index, data }) => (
          <div key={(data as any).id || index} {...getItemProps(index)} className="px-5">
            {renderProduct(data, index)}
          </div>
        ))}
      </div>
    </div>
  );
};
