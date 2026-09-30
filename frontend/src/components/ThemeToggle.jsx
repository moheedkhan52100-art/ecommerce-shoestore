import { Moon, Sun } from "lucide-react";
import { useContext } from "react";
import { ThemeContext } from "../context/theme";

function ThemeToggle() {
  const { dark, toggleTheme } = useContext(ThemeContext);
  return <button className="theme-toggle" type="button" aria-label="Toggle dark mode" title="Toggle dark mode" onClick={toggleTheme}>{dark ? <Sun size={17} /> : <Moon size={17} />}</button>;
}

export default ThemeToggle;
