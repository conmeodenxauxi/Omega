import React, { createContext, useContext, useState, ReactNode } from 'react';

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
  // Lưu trữ callback bắt đầu tìm kiếm từ Home component
  const [searchCallback, setSearchCallback] = useState<(() => void) | null>(null);

  // Hàm kích hoạt tìm kiếm từ bên ngoài
  const triggerSearch = () => {
    if (searchCallback) {
      console.log('Tự động kích hoạt tìm kiếm sau khi phát hiện máy chủ đã hoạt động trở lại');
      searchCallback();
    } else {
      console.log('Không thể kích hoạt tìm kiếm: callback chưa được đăng ký');
    }
  };

  // Đăng ký callback
  const registerSearchCallback = (callback: () => void) => {
    setSearchCallback(() => callback);
  };

  // Xóa callback
  const unregisterSearchCallback = () => {
    setSearchCallback(null);
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