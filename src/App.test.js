import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders App component without crashing", () => {
  render(<App />);
});

test('renders Header and Footer', () => {
  render(<App />);
  const header = screen.getByRole('banner');
  const footer = screen.getByRole('contentinfo');
  expect(header).toBeInTheDocument();
  expect(footer).toBeInTheDocument();
});
