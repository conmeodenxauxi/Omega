import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import { useEffect } from "react";
import { SearchProvider } from "./lib/context/SearchContext";

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

function App() {
  // Sử dụng effect để giữ cho server không ngủ
  useEffect(() => {
    // Thực hiện ping server mỗi 4 phút
    const pingInterval = setInterval(() => {
      fetch('/api/health')
        .then(response => response.json())
        .then(data => console.log(`Server alive at ${data.timestamp}`))
        .catch(error => console.error('Ping server failed:', error));
    }, 4 * 60 * 1000); // 4 phút

    // Ping ngay khi component mount
    fetch('/api/health')
      .then(response => response.json())
      .then(data => console.log(`Initial server ping at ${data.timestamp}`))
      .catch(error => console.error('Initial ping server failed:', error));

    // Cleanup interval khi component unmount
    return () => clearInterval(pingInterval);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <Router />
        <Toaster />
      </SearchProvider>
    </QueryClientProvider>
  );
}

export default App;
