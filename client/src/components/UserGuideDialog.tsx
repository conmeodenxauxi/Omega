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
          <div className="flex flex-col items-center -space-y-1">
            <span className="text-sm font-extrabold leading-none">Hướng dẫn</span>
            <span className="text-sm font-bold leading-none">sử dụng</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl mb-2">Bản Omega</DialogTitle>
          <div className="text-left">
            <div className="text-base font-medium mb-2">I/ Hướng dẫn sử dụng</div>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <span className="font-medium">Ticker tự động reset</span>
                <div>Xóa cache sau khi kiểm tra được 7000 địa chỉ</div>
              </li>
              <li>
                <span className="font-medium">Các ticker blockchain</span>
                <div>Chọn ticker nào sẽ tạo và kiểm tra địa chỉ blockchain ấy</div>
              </li>
              <li>
                <span className="font-medium">Ticker 12 từ, 24 từ</span>
                <div>Chọn số lượng từ tạo seed phrase</div>
              </li>
              <li>
                <span className="font-medium">Bộ đếm Đã tạo, Đã kiểm tra, Tìm thấy</span>
                <div>Số lượng seed tạo ra, số lượng địa chỉ đã kiểm tra, số lượng ví có số dư &gt;0 tìm thấy</div>
              </li>
              <li>
                <span className="font-medium">Nút Bắt đầu/Dừng</span>
                <div>Ấn để chạy tự động</div>
              </li>
              <li>
                <span className="font-medium">Khung địa chỉ ví đang kiểm tra</span>
                <div>Hiển thị các địa chỉ ví đang được kiểm tra</div>
              </li>
              <li>
                <span className="font-medium">Chế độ kiểm tra thủ công</span>
                <div>
                  Logic giống kiểm tra tự động chỉ khác nguồn seed. Kiến tra tự động lấy seed phrase do hệ thống tạo ngẫu nhiên để liên tra. 
                  Kiếm tra thủ công lấy seed phrase người dùng nhập để kiểm tra. Nếu kiểm tra thủ công kiểm tra được số dư nghĩa là kiểm tra tự động hoạt động tốt. 
                  Phần này t tạo ra để test chức năng ứng dụng
                </div>
              </li>
              <li>
                <span className="font-medium">Bảng Ví web3 có số dư tìm thấy</span>
                <div>Khi tìm được ví có số dư &gt;0 thì seed phrase và số dư của ví sẽ được hiển thị trên bảng này</div>
              </li>
            </ol>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}