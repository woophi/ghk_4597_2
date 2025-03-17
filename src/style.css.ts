import { style } from '@vanilla-extract/css';

const bottomBtn = style({
  position: 'fixed',
  zIndex: 2,
  width: '100%',
  padding: '12px',
  bottom: 0,
});

const container = style({
  display: 'flex',
  padding: '1rem',
  flexDirection: 'column',
  gap: '1rem',
});

const banner = style({
  padding: '1rem',
  backgroundColor: '#F3F4F5',
  borderRadius: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginTop: '6px',
});

const swSlide = style({
  width: 'min-content',
});

export const appSt = {
  bottomBtn,
  container,
  banner,
  swSlide,
};
