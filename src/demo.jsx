import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';
const { Beaker, Layers, Zap } = LucideIcons;

import * as Core from './core.js';
import * as Shared from './shared.jsx';

// Destructure some shared components for easy testing
const { ModuleFrame, Stat, Field } = Shared;

function DemoScreen({ currentUser, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--m-bg)', zIndex: 999999,
      overflowY: 'auto', padding: '20px', paddingBottom: '100px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2><Beaker size={24} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--m-primary)' }}/> Demo Playground</h2>
        <button onClick={onClose} className="secondary" style={{ padding: '6px 16px' }}>Đóng</button>
      </div>

      <p style={{ color: 'var(--m-subtle)', marginBottom: 20 }}>
        Đây là không gian nháp (Sandbox). Bất kỳ UI mới, tính năng thử nghiệm hoặc Component nào đang phát triển sẽ được nhúng vào đây để anh xem và feedback nhanh mà không làm hỏng giao diện chính.
      </p>

      {/* Khu vực để test các UI components */}
      <ModuleFrame>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} /> Component Test Area
        </h3>
        
        <div style={{ padding: 16, border: '1px dashed var(--m-border)', borderRadius: 8, background: '#fff' }}>
          <p style={{ color: '#888', textAlign: 'center', margin: 0 }}>Chưa có Component nào đang test.</p>
          {/* Nhúng component mới vào đây ở các phiên chat sau */}
        </div>
      </ModuleFrame>

    </div>
  );
}

export { DemoScreen };
