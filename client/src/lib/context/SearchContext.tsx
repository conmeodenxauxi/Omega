import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';

interface SearchContextProps {
  // Hàm bắt đầu tìm kiếm từ bên ngoài Home component
  triggerSearch: () => void;
  // Function để đăng ký callback bắt đầu tìm kiếm
  registerSearchCallback: (callback: () => void) => void;
  // Function để xóa callback khi component unmount
  unregisterSearchCallback: () => void;
}

const SearchContext = createContext<SearchContextProps | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider = ({ children }: SearchProviderProps) => {
  // Sử dụng useRef để lưu trữ callback thay vì useState để tránh trễ render
  const searchCallbackRef = useRef<(() => void) | null>(null);

  // Hàm kích hoạt tìm kiếm từ bên ngoài
  const triggerSearch = () => {
    if (searchCallbackRef.current) {
      console.log('===== TỰ ĐỘNG KÍCH HOẠT TÌM KIẾM SAU KHI PHÁT HIỆN MÁY CHỦ ĐÃ HOẠT ĐỘNG TRỞ LẠI =====');
      console.log('===== GỌI CALLBACK TÌM KIẾM TỪ REF: searchCallbackRef.current TỒN TẠI =====');
      // Gọi callback được lưu trong ref trực tiếp
      try {
        searchCallbackRef.current();
      } catch (error) {
        console.error('===== LỖI KHI GỌI CALLBACK TÌM KIẾM: ', error, ' =====');
      }
    } else {
      console.error('===== KHÔNG THỂ KÍCH HOẠT TÌM KIẾM: CALLBACK CHƯA ĐƯỢC ĐĂNG KÝ =====');
    }
  };

  // Đăng ký callback - lưu trực tiếp vào ref
  const registerSearchCallback = (callback: () => void) => {
    console.log('Đăng ký callback mới vào SearchContext');
    searchCallbackRef.current = callback;
  };

  // Xóa callback
  const unregisterSearchCallback = () => {
    console.log('Hủy đăng ký callback từ SearchContext');
    searchCallbackRef.current = null;
  };

  return (
    <SearchContext.Provider value={{ 
      triggerSearch, 
      registerSearchCallback, 
      unregisterSearchCallback 
    }}>
      {children}
    </SearchContext.Provider>
  );
};

// Hook để sử dụng context
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};