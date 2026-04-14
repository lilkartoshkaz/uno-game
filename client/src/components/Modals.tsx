import React from 'react';

interface AlertModalProps {
  message: string;
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: 'white', padding: '30px 40px', borderRadius: '15px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '2px solid #dc3545' }}>
      <h2 style={{ color: '#dc3545', margin: '0 0 15px 0', fontSize: '28px' }}>Внимание!</h2>
      <p style={{ color: '#333', fontSize: '18px', marginBottom: '25px', fontWeight: 'bold' }}>{message}</p>
      <button onClick={onClose} style={{ background: '#007BFF', color: 'white', border: 'none', padding: '12px 35px', fontSize: '18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' }}>Понятно</button>
    </div>
  </div>
);

interface ColorPickerModalProps {
  onSelect: (c: string) => void;
  onCancel: () => void;
}

export const ColorPickerModal: React.FC<ColorPickerModalProps> = ({ onSelect, onCancel }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: '#212529', padding: '40px', borderRadius: '24px', textAlign: 'center', border: '3px solid #ffc107', boxShadow: '0 10px 50px rgba(255,193,7,0.3)' }}>
      <h2 style={{ color: 'white', margin: '0 0 30px 0', fontSize: '24px', letterSpacing: '1px' }}>Какую масть заказываем?</h2>
      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button onClick={() => onSelect('red')} style={{ width: '90px', height: '120px', background: '#dc3545', borderRadius: '12px', border: '4px solid white', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 5px 15px rgba(220,53,69,0.5)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}></button>
        <button onClick={() => onSelect('blue')} style={{ width: '90px', height: '120px', background: '#007BFF', borderRadius: '12px', border: '4px solid white', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 5px 15px rgba(0,123,255,0.5)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}></button>
        <button onClick={() => onSelect('green')} style={{ width: '90px', height: '120px', background: '#28a745', borderRadius: '12px', border: '4px solid white', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 5px 15px rgba(40,167,69,0.5)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}></button>
        <button onClick={() => onSelect('yellow')} style={{ width: '90px', height: '120px', background: '#ffc107', borderRadius: '12px', border: '4px solid white', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 5px 15px rgba(255,193,7,0.5)' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}></button>
      </div>
      <button onClick={onCancel} style={{ marginTop: '30px', background: 'transparent', color: '#6c757d', border: '2px solid #6c757d', padding: '10px 30px', fontSize: '16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Отменить ход</button>
    </div>
  </div>
);