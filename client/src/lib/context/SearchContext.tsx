import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

// Interface cho context
interface SearchContextType {
  autoStartEnabled: boolean;
  setAutoStartEnabled: (enabled: boolean) => void;
  registerAutoStartCallback: (callback: () => void) => void;
  unregisterAutoStartCallback: (callback: () => void) => void;
}

// Tạo context với giá trị mặc định
export const SearchContext = createContext<SearchContextType>({
  autoStartEnabled: true,
  setAutoStartEnabled: () => {},
  registerAutoStartCallback: () => {},
  unregisterAutoStartCallback: () => {},
});

// Thời gian đợi trước khi tự động kích hoạt tìm kiếm (mili giây)
const AUTO_START_DELAY = 7000; // 7 giây

// Provider component
export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State theo dõi xem tính năng tự động bắt đầu có được bật hay không
  const [autoStartEnabled, setAutoStartEnabled] = useState<boolean>(true);
  
  // Lưu trữ các callback để kích hoạt tìm kiếm
  const callbacksRef = useRef<Set<() => void>>(new Set());
  
  // Timer để đợi trước khi kích hoạt tìm kiếm
  const autoStartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm đăng ký callback mới
  const registerAutoStartCallback = useCallback((callback: () => void) => {
    console.log("Đăng ký callback mới vào SearchContext");
    callbacksRef.current.add(callback);
  }, []);

  // Hàm hủy đăng ký callback
  const unregisterAutoStartCallback = useCallback((callback: () => void) => {
    console.log("Hủy đăng ký callback từ SearchContext");
    callbacksRef.current.delete(callback);
  }, []);

  // Hàm kích hoạt tất cả các callback đã đăng ký
  const triggerCallbacks = useCallback(() => {
    if (callbacksRef.current.size > 0) {
      console.log("===== KÍCH HOẠT TÌM KIẾM TỰ ĐỘNG =====");
      callbacksRef.current.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('Lỗi khi gọi callback tìm kiếm tự động:', error);
        }
      });
    } else {
      console.log("Không có callback nào được đăng ký để kích hoạt tìm kiếm tự động");
    }
  }, []);

  // Effect xử lý khi trang được tải
  useEffect(() => {
    // Hàm xử lý khi trang được tải hoặc khởi động lại
    const handlePageLoad = () => {
      // Xóa timer cũ nếu có
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }

      // Nếu tính năng tự động bắt đầu được bật
      if (autoStartEnabled) {
        console.log(`===== ĐĂNG KÝ CALLBACK TÌM KIẾM TỰ ĐỘNG =====`);
        
        // Đặt timer để đợi trước khi kích hoạt tìm kiếm
        autoStartTimerRef.current = setTimeout(() => {
          triggerCallbacks();
          autoStartTimerRef.current = null;
        }, AUTO_START_DELAY);
      }
    };

    // Đăng ký sự kiện để xử lý khi trang hoàn tất tải
    window.addEventListener('load', handlePageLoad);
    
    // Gọi handlePageLoad ngay lập tức để xử lý cho trường hợp component mount sau khi trang đã tải
    handlePageLoad();

    // Cleanup khi unmount
    return () => {
      window.removeEventListener('load', handlePageLoad);
      
      if (autoStartTimerRef.current) {
        clearTimeout(autoStartTimerRef.current);
        autoStartTimerRef.current = null;
      }
    };
  }, [autoStartEnabled, triggerCallbacks]);

  // Cung cấp context value
  const contextValue: SearchContextType = {
    autoStartEnabled,
    setAutoStartEnabled,
    registerAutoStartCallback,
    unregisterAutoStartCallback,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

// Custom hook để sử dụng SearchContext
export const useSearch = () => {
  const context = useContext(SearchContext);
  
  if (!context) {
    throw new Error('useSearch phải được sử dụng trong SearchProvider');
  }
  
  return context;
};