import React from 'react';
import { ChevronRight, Zap, ShieldCheck, MapPin, Clock, Search, Smartphone } from 'lucide-react';
import '../../styles.css';

function LandingPage({ onExplore }) {
  return (
    <div className="landing-page" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: '#fff',
      color: '#111'
    }}>
      <style>{`
        /* Minimalist Theme Overrides matching Premium Design */
        .landing-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        
        .hero-section {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 80px 20px 40px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          gap: 40px;
        }
        @media (max-width: 900px) {
          .hero-section {
            flex-direction: column;
            padding: 40px 20px;
            text-align: center;
          }
        }
        .hero-title {
          font-size: clamp(40px, 5vw, 64px);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0 0 24px 0;
          color: #111;
        }
        .hero-subtitle {
          font-size: 16px;
          color: #555;
          line-height: 1.6;
          max-width: 480px;
          margin: 0 0 32px 0;
        }
        @media (max-width: 900px) {
          .hero-subtitle { margin: 0 auto 32px auto; }
        }
        .black-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #111;
          color: #fff;
          padding: 16px 36px;
          border-radius: 100px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: transform 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .black-btn:hover {
          background: #000;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .hero-image-wrapper {
          flex: 1.2;
          position: relative;
          display: flex;
          justify-content: flex-end;
          width: 100%;
        }
        .hero-image-wrapper img {
          width: 100%;
          max-width: 800px;
          height: auto;
          object-fit: cover;
          border-radius: 24px;
        }
        
        .brands-row {
          display: flex;
          justify-content: center;
          gap: clamp(20px, 4vw, 40px);
          padding: 40px 20px;
          flex-wrap: wrap;
          color: #888;
          max-width: 1000px;
          margin: 0 auto;
          align-items: center;
        }
        .brands-row span {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        
        .section-title-sm {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #888;
          margin-bottom: 12px;
          font-weight: 700;
          display: block;
        }
        .section-title {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 20px 0;
          color: #111;
        }
        .section-desc {
          color: #555;
          font-size: 16px;
          line-height: 1.6;
          max-width: 500px;
          margin-bottom: 32px;
        }
        
        .showcase-section {
          display: flex;
          align-items: center;
          gap: 60px;
          max-width: 1200px;
          margin: 80px auto;
          padding: 0 20px;
        }
        @media (max-width: 900px) {
          .showcase-section { 
            flex-direction: column-reverse; 
            text-align: center; 
            margin: 40px auto; 
            gap: 40px;
          }
          .showcase-section .section-desc {
            margin: 0 auto 32px auto;
          }
        }
        .showcase-img {
          flex: 1;
          background: #f8f9fa;
          border-radius: 24px;
          aspect-ratio: 4/3;
          position: relative;
          overflow: hidden;
          width: 100%;
        }
        .showcase-img img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .showcase-content {
          flex: 1;
        }
        
        .fleet-section {
          text-align: center;
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .fleet-section .section-desc {
          margin: 0 auto 40px auto;
        }
        .pills {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 40px;
          flex-wrap: wrap;
        }
        .pill {
          padding: 8px 24px;
          border-radius: 100px;
          background: #f4f4f4;
          color: #111;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .pill:hover, .pill.active {
          background: #111;
          color: #fff;
        }
        
        .fleet-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }
        @media (max-width: 900px) {
          .fleet-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .fleet-grid { grid-template-columns: 1fr; }
        }
        .fleet-item {
          border-radius: 16px;
          overflow: hidden;
          aspect-ratio: 16/10;
          background: #f4f4f4;
          position: relative;
        }
        .fleet-item img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.4s ease;
        }
        .fleet-item:hover img {
          transform: scale(1.05);
        }
        
        .outline-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fff;
          color: #111;
          padding: 14px 28px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid #ddd;
          transition: all 0.2s;
        }
        .outline-btn:hover {
          border-color: #111;
          background: #fafafa;
        }
        
        .features-section {
          padding: 80px 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 40px;
        }
        @media (max-width: 1024px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .features-grid { grid-template-columns: 1fr; }
        }
        .feat-box {
          border: 1px solid #eaeaea;
          border-radius: 20px;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: #fff;
          transition: box-shadow 0.3s, border-color 0.3s;
        }
        .feat-box:hover {
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
          border-color: #ddd;
        }
        .feat-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #f8f8f8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111;
        }
        .feat-title {
          font-weight: 700;
          font-size: 16px;
          line-height: 1.4;
          margin: 0;
        }
        
        .cta-section {
          padding: 40px 20px 80px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .cta-box {
          background: #111;
          color: #fff;
          border-radius: 32px;
          padding: 80px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .cta-box::before {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);
          pointer-events: none;
        }
        .cta-box h2 {
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800;
          margin: 0 0 16px 0;
          position: relative;
          z-index: 1;
        }
        .cta-box p {
          color: #aaa;
          margin: 0 auto 32px auto;
          font-size: 16px;
          max-width: 400px;
          position: relative;
          z-index: 1;
        }
        
        .footer-minimal {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
          border-top: 1px solid #eaeaea;
          flex-wrap: wrap;
          gap: 20px;
        }
        .footer-logo {
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .footer-links {
          display: flex;
          gap: 24px;
          font-size: 14px;
          color: #555;
          font-weight: 500;
        }
      `}</style>

      {/* 1. HERO SECTION */}
      <section className="hero-section">
        <div style={{ flex: 1 }}>
          <h1 className="hero-title">
            Thuê Xe Tự Lái <br/> Chuyên Nghiệp
          </h1>
          <p className="hero-subtitle">
            Khám phá hàng ngàn chiếc xe đa dạng phục vụ mọi nhu cầu di chuyển. Trải nghiệm dịch vụ không qua trung gian với mức giá tốt nhất ngay hôm nay.
          </p>
          <button className="black-btn" onClick={onExplore}>
            <Search size={20} />
            Khám Phá Xe Ngay
          </button>
        </div>
        <div className="hero-image-wrapper">
          {/* Using a high-quality Unsplash car image representing a premium feel */}
          <img src="https://images.unsplash.com/photo-1503376712353-33230a10ac26?auto=format&fit=crop&q=80&w=1200" alt="Premium Car" />
        </div>
      </section>

      {/* 2. BRANDS ROW */}
      <div className="brands-row">
        <span>TOYOTA</span>
        <span>MAZDA</span>
        <span>KIA</span>
        <span>HYUNDAI</span>
        <span>FORD</span>
        <span>HONDA</span>
      </div>

      {/* 3. SHOWCASE SECTION (Modern App / Interface) */}
      <section className="showcase-section">
        <div className="showcase-img">
          <img src="https://images.unsplash.com/photo-1512428559087-560fa5ceab42?auto=format&fit=crop&q=80&w=1000" alt="Mobile App Experience" />
        </div>
        <div className="showcase-content">
          <span className="section-title-sm">Giao Diện Tiện Lợi</span>
          <h2 className="section-title">Nền Tảng Hiện Đại</h2>
          <p className="section-desc">
            Chúng tôi phát triển một nền tảng đơn giản và đầy đủ tính năng. Hệ thống được xây dựng nhằm tối ưu hoá quá trình tìm kiếm và thuê xe. Xem vị trí, tình trạng và các thông tin khác của xe chỉ với một cú chạm.
          </p>
          <button className="black-btn" onClick={onExplore}>
            <Smartphone size={20} />
            Trải Nghiệm Ngay
          </button>
        </div>
      </section>

      {/* 4. FLEET SECTION */}
      <section className="fleet-section">
        <span className="section-title-sm">Chỉ Dành Cho Bạn</span>
        <h2 className="section-title">Danh Mục Xe Đa Dạng</h2>
        <p className="section-desc">
          Chúng tôi mang đến cho khách hàng những trải nghiệm cầm lái tuyệt vời nhất. Đó là lý do hệ thống luôn cập nhật đa dạng các dòng xe chất lượng.
        </p>
        
        <div className="pills">
          <div className="pill active">Tất Cả</div>
          <div className="pill">Sedan 4 Chỗ</div>
          <div className="pill">SUV 7 Chỗ</div>
          <div className="pill">Bán Tải</div>
          <div className="pill">Xe Điện</div>
        </div>
        
        <div className="fleet-grid">
          <div className="fleet-item"><img src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80&w=800" alt="Car 1"/></div>
          <div className="fleet-item"><img src="https://images.unsplash.com/photo-1617531653332-bd46c24f2068?auto=format&fit=crop&q=80&w=800" alt="Car 2"/></div>
          <div className="fleet-item"><img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800" alt="Car 3"/></div>
          <div className="fleet-item"><img src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&q=80&w=800" alt="Car 4"/></div>
          <div className="fleet-item"><img src="https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&q=80&w=800" alt="Car 5"/></div>
          <div className="fleet-item"><img src="https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80&w=800" alt="Car 6"/></div>
        </div>
        
        <button className="outline-btn" onClick={onExplore}>
          Xem Tất Cả Xe <ChevronRight size={16} />
        </button>
      </section>

      {/* 5. KEY FEATURES */}
      <section className="features-section">
        <span className="section-title-sm">Chăm sóc mọi khách hàng</span>
        <h2 className="section-title">Tiện ích Cốt Lõi</h2>
        <p className="section-desc" style={{ maxWidth: '400px' }}>
          Chúng tôi đặt sự thoải mái và an toàn của khách hàng lên hàng đầu. Đó là lý do bạn luôn nhận được dịch vụ tốt nhất.
        </p>
        
        <div className="features-grid">
          <div className="feat-box">
            <div className="feat-icon-wrap"><Zap size={24} /></div>
            <h3 className="feat-title">Tất cả xe đều có gói bảo hiểm tiêu chuẩn</h3>
          </div>
          <div className="feat-box">
            <div className="feat-icon-wrap"><ShieldCheck size={24} /></div>
            <h3 className="feat-title">Giao dịch an toàn & Không phí môi giới</h3>
          </div>
          <div className="feat-box">
            <div className="feat-icon-wrap"><Clock size={24} /></div>
            <h3 className="feat-title">Hỗ trợ nhận xe & thủ tục nhanh trong 5 phút</h3>
          </div>
          <div className="feat-box">
            <div className="feat-icon-wrap"><MapPin size={24} /></div>
            <h3 className="feat-title">Bảo mật thông tin khách hàng tuyệt đối</h3>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="cta-section">
        <div className="cta-box">
          <h2>Đồng hành cùng Thuê Xe Nhanh</h2>
          <p>Khám phá thế giới xe tự lái đầy thú vị ngay trên nền tảng của chúng tôi.</p>
          <button className="black-btn" onClick={onExplore} style={{ background: '#fff', color: '#111' }}>
            <Search size={20} />
            Tìm Xe Ngay
          </button>
        </div>
      </section>

      {/* 7. MINIMAL FOOTER */}
      <footer className="footer-minimal">
        <div className="footer-logo">
          <Zap size={24} fill="currentColor" />
          Thuê Xe Nhanh
        </div>
        <div className="footer-links">
          <span style={{ cursor: 'pointer' }} onClick={onExplore}>Về Chúng Tôi</span>
          <span style={{ cursor: 'pointer' }} onClick={onExplore}>Tìm Xe</span>
          <span style={{ cursor: 'pointer' }}>Tính Năng</span>
          <span style={{ cursor: 'pointer' }}>Hỗ Trợ</span>
        </div>
        <div style={{ fontSize: '13px', color: '#888' }}>
          © {new Date().getFullYear()} Thuê Xe Nhanh.
        </div>
      </footer>
    </div>
  );
}

export { LandingPage };
