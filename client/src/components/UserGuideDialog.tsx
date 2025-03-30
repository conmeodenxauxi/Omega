import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

export function UserGuideDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-12 flex flex-col items-center justify-center px-4 py-1 border-4 border-primary rounded-lg">
          <div className="flex flex-col items-center space-y-1">
            <span className="text-sm font-extrabold leading-none">Hướng dẫn</span>
            <span className="text-sm font-bold leading-none">sử dụng</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold mb-3">Bản Omega</DialogTitle>
          <DialogDescription asChild>
            <div className="text-left">
              <div className="text-lg font-bold mb-3">I/ Hướng dẫn sử dụng</div>
              <ol className="list-decimal pl-6 space-y-3 text-base">
                <li>
                  <span className="font-bold">Ticker tự động reset</span>
                  <div className="font-medium">Xóa cache sau khi kiểm tra được 7000 địa chỉ</div>
                </li>
                <li>
                  <span className="font-bold">Các ticker blockchain</span>
                  <div className="font-medium">Chọn ticker nào sẽ tạo và kiểm tra địa chỉ blockchain ấy</div>
                </li>
                <li>
                  <span className="font-bold">Ticker 12 từ, 24 từ</span>
                  <div className="font-medium">Chọn số lượng từ tạo seed phrase</div>
                </li>
                <li>
                  <span className="font-bold">Bộ đếm Đã tạo, Đã kiểm tra, Tìm thấy</span>
                  <div className="font-medium">Số lượng seed tạo ra, số lượng địa chỉ đã kiểm tra, số lượng ví có số dư &gt;0 tìm thấy</div>
                </li>
                <li>
                  <span className="font-bold">Nút Bắt đầu/Dừng</span>
                  <div className="font-medium">Ấn để chạy tự động</div>
                </li>
                <li>
                  <span className="font-bold">Khung địa chỉ ví đang kiểm tra</span>
                  <div className="font-medium">Hiển thị các địa chỉ ví đang được kiểm tra</div>
                </li>
                <li>
                  <span className="font-bold">Chế độ kiểm tra thủ công</span>
                  <div className="font-medium">
                    Logic giống kiểm tra tự động chỉ khác nguồn seed. Kiến tra tự động lấy seed phrase do hệ thống tạo ngẫu nhiên để liên tra. 
                    Kiếm tra thủ công lấy seed phrase người dùng nhập để kiểm tra. Nếu kiểm tra thủ công kiểm tra được số dư nghĩa là kiểm tra tự động hoạt động tốt. 
                    Phần này t tạo ra để test chức năng ứng dụng
                  </div>
                </li>
                <li>
                  <span className="font-bold">Bảng Ví web3 có số dư tìm thấy</span>
                  <div className="font-medium">Khi tìm được ví có số dư &gt;0 thì seed phrase và số dư của ví sẽ được hiển thị trên bảng này</div>
                </li>
              </ol>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}