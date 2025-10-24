import "@testing-library/jest-dom";

// Мокаем методы которые могут отсутствовать в тестовой среде
Object.defineProperty(window, "alert", {
  // eslint-disable-next-line no-undef
  value: jest.fn(),
  writable: true,
});

// Мокаем console.log если нужно
global.console = {
  ...console,
  // eslint-disable-next-line no-undef
  log: jest.fn(),
  // eslint-disable-next-line no-undef
  error: jest.fn(),
};
