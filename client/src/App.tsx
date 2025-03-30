import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect, useRef, useState } from "react";
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
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const reconnectedRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingFailureCountRef = useRef(0);

  // Sử dụng effect để giữ cho server không ngủ và theo dõi kết nối
  useEffect(() => {
    // Hàm ping server
    const pingServer = () => {
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          // Kết nối thành công
          console.log(`Server alive at ${data.timestamp}`);
          
          // Nếu trước đó là trạng thái mất kết nối thì đây là kết nối lại
          if (serverStatus === 'disconnected') {
            console.log('Server đã kết nối lại sau khi mất kết nối!');
            setServerStatus('connected');
            
            // Đặt cờ reconnected để biết đã kết nối lại
            reconnectedRef.current = true;
            
            // Đặt timeout để tự động bật tìm kiếm sau 3-7 giây
            const randomDelay = 3000 + Math.floor(Math.random() * 4000); // 3-7 giây
            console.log(`Sẽ tự động kích hoạt tìm kiếm sau ${randomDelay/1000} giây`);
            
            // Xóa timeout cũ nếu có
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
            }
            
            // Tạo timeout mới
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('Đã đến thời gian tự động kích hoạt tìm kiếm');
              triggerSearch();
              reconnectTimeoutRef.current = null;
            }, randomDelay);
          } else {
            // Nếu đã kết nối trước đó, cập nhật trạng thái
            setServerStatus('connected');
          }
          
          // Reset số lần ping thất bại
          pingFailureCountRef.current = 0;
        })
        .catch(error => {
          console.error('Ping server failed:', error);
          pingFailureCountRef.current += 1;
          
          // Nếu ping thất bại 2 lần liên tiếp, coi như đã mất kết nối
          if (pingFailureCountRef.current >= 2) {
            console.log('Đã mất kết nối với server');
            setServerStatus('disconnected');
            
            // Hủy bỏ timeout kích hoạt tìm kiếm nếu có
            if (reconnectTimeoutRef.current) {
              clearTimeout(reconnectTimeoutRef.current);
              reconnectTimeoutRef.current = null;
            }
          }
        });
    };

    // Thực hiện ping server mỗi 15 giây (thay vì 4 phút)
    // Giảm thời gian này để phát hiện mất kết nối và kết nối lại nhanh hơn
    const pingInterval = setInterval(pingServer, 15 * 1000);

    // Ping ngay khi component mount
    pingServer();

    // Cleanup interval khi component unmount
    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [serverStatus, triggerSearch]);

  return null; // Component này không render gì
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
