import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect, useRef, useState, useCallback } from "react";
import { SearchProvider, useSearch } from "./lib/context/SearchContext";

// Hàm hook đã được xóa và chuyển trực tiếp vào component App

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

// Component để theo dõi kết nối server
function ServerMonitor() {
  const { triggerSearch } = useSearch();
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSuccessTimeRef = useRef<number>(Date.now());
  const lastCheckTimeRef = useRef<number>(Date.now());
  const consecutiveFailsRef = useRef<number>(0);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialCheckCompletedRef = useRef<boolean>(false);
  
  // Hàm kiểm tra kết nối đến server thông qua API health
  const checkServerStatus = useCallback(async () => {
    try {
      lastCheckTimeRef.current = Date.now();
      const response = await fetch('/api/health');
      
      if (response.ok) {
        const data = await response.json();
        const currentTime = Date.now();
        const timeSinceLastSuccess = currentTime - lastSuccessTimeRef.current;
        
        // Cập nhật thời gian thành công gần nhất
        lastSuccessTimeRef.current = currentTime;
        
        // Reset số lần thất bại liên tiếp
        consecutiveFailsRef.current = 0;
        
        // Kiểm tra trạng thái kết nối
        if (serverStatus === 'disconnected') {
          // Nếu trước đó mất kết nối, đây là kết nối lại
          console.log('===== Server đã kết nối lại sau khi mất kết nối! =====');
          setServerStatus('connected');
          
          // Đặt timeout để tự động kích hoạt tìm kiếm sau 3-7 giây
          const randomDelay = 3000 + Math.floor(Math.random() * 4000); // 3-7 giây
          console.log(`===== Sẽ tự động kích hoạt tìm kiếm sau ${randomDelay/1000} giây =====`);
          
          // Xóa timeout hiện tại nếu có
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          // Tạo timeout mới để kích hoạt tìm kiếm
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('===== Đã đến thời gian tự động kích hoạt tìm kiếm =====');
            // GỌI HÀM triggerSearch - RẤT QUAN TRỌNG
            triggerSearch();
            reconnectTimeoutRef.current = null;
          }, randomDelay);
        } 
        else if (serverStatus === 'checking') {
          // Khởi tạo ban đầu - thiết lập kết nối
          console.log('Khởi tạo kết nối thành công!');
          setServerStatus('connected');
          initialCheckCompletedRef.current = true;
        }
        
        // Không cần log cho mỗi lần ping thành công để tránh spam console
        if (serverStatus === 'checking' || serverStatus === 'disconnected') {
          console.log(`Server alive at ${data.timestamp}`);
        }
      } else {
        // Phản hồi không thành công
        handleConnectionFailure('Phản hồi không OK');
      }
    } catch (error) {
      // Lỗi kết nối
      handleConnectionFailure(`${error}`);
    }
  }, [serverStatus, triggerSearch]);
  
  // Xử lý khi kết nối thất bại
  const handleConnectionFailure = useCallback((reason: string) => {
    const currentTime = Date.now();
    
    // Tăng số lần thất bại liên tiếp
    consecutiveFailsRef.current += 1;
    
    // Chỉ log lỗi nếu thực sự mất kết nối, không cần log mọi lỗi
    if (serverStatus !== 'disconnected' && consecutiveFailsRef.current >= 2) {
      console.error(`===== Mất kết nối với server: ${reason} =====`);
      console.error(`===== Số lần thất bại liên tiếp: ${consecutiveFailsRef.current} =====`);
      
      // Cập nhật trạng thái chỉ khi đủ số lần thất bại liên tiếp
      if (consecutiveFailsRef.current >= 2) {
        setServerStatus('disconnected');
        
        // Hủy bỏ timeout kích hoạt tìm kiếm nếu có
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      }
    }
  }, [serverStatus]);
  
  // Effect chính để thiết lập interval kiểm tra kết nối
  useEffect(() => {
    const checkInterval = 10000; // Kiểm tra mỗi 10 giây
    
    // Hủy interval cũ nếu có
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
    }
    
    // Kiểm tra ngay khi mount component
    checkServerStatus();
    
    // Thiết lập interval mới
    pingIntervalRef.current = setInterval(() => {
      checkServerStatus();
    }, checkInterval);
    
    // Cleanup khi unmount
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [checkServerStatus]);
  
  // Hiển thị trạng thái kết nối cho mục đích debug
  return (
    <div className="fixed bottom-2 right-2 text-xs">
      {serverStatus === 'connected' && (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
          <span className="text-gray-400">Connected</span>
        </div>
      )}
      {serverStatus === 'disconnected' && (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
          <span className="text-gray-400">Disconnected</span>
        </div>
      )}
      {serverStatus === 'checking' && (
        <div className="flex items-center">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
          <span className="text-gray-400">Checking</span>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <ServerMonitor />
        <Router />
        <Toaster />
      </SearchProvider>
    </QueryClientProvider>
  );
}

export default App;
