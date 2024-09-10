import { render, screen } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Header from "./index";

test("renders header with home and about links", () => {
  render(
    <Router>
      <Header />
    </Router>
  );

  const homeLinkElement = screen.getByRole("link", {name: /home/i });
  expect(homeLinkElement).toBeInTheDocument();

  const aboutLinkElement = screen.getByRole("link", {name: /about/i });
  expect(aboutLinkElement).toBeInTheDocument();
});
