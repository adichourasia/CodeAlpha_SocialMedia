import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const HIDDEN_PATHS = ["/login", "/signup"];

export default function NavbarConditional() {
  const location = useLocation();
  if (HIDDEN_PATHS.includes(location.pathname)) return null;
  return <Navbar />;
}
