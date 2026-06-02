// فوتر اپلیکیشن - نسخه جدید

export default function Footer() {
  return (
    <footer className="bg-laziz-dark text-white py-5 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-laziz-yellow text-lg">⭐</span>
          <p className="text-sm text-white/80">
            طراحی و توسعه:{' '}
            <span className="text-laziz-yellow font-bold">واحد رسانه لذیذ</span>
          </p>
        </div>
        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} - تمامی حقوق محفوظ است
        </p>
      </div>
    </footer>
  );
}
