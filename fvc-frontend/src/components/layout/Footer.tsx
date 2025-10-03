export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-[#74a6ff] via-[#4d7dff] to-[#2b57ff] py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <h3 className="mb-2 text-lg font-semibold">FPTU Vovinam CMS</h3>
        <p className="mb-6 text-sm opacity-90">
          Nền tảng quản lý giải đấu & CLB Vovinam toàn diện.
        </p>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-semibold">Liên kết</div>
            <ul className="mt-2 space-y-1 opacity-90">
              <li>Trang chủ</li>
              <li>Giải đấu</li>
              <li>Đăng ký</li>
              <li>Kết quả</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Hỗ trợ</div>
            <ul className="mt-2 space-y-1 opacity-90">
              <li>Tài liệu</li>
              <li>FAQ</li>
              <li>Liên hệ</li>
            </ul>
          </div>
          <div>
            <div className="font-semibold">Theo dõi</div>
            <ul className="mt-2 space-y-1 opacity-90">
              <li>Facebook</li>
              <li>YouTube</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-white/30 pt-4 text-center text-xs opacity-80">
          © 2025 FPTU Vovinam CMS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
