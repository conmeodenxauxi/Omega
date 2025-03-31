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
      console.log('Tự động kích hoạt tìm kiếm sau khi phát hiện máy chủ đã hoạt động trở lại');
      // Gọi callback được lưu trong ref
      searchCallbackRef.current();
    } else {
      console.log('Không thể kích hoạt tìm kiếm: callback chưa được đăng ký');
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