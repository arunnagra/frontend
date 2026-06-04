import { useNavigate } from "react-router-dom";
import "../styles/homebutton.css";

function HomeButton() {
  const navigate = useNavigate();
  return (
    <button className="home-button" onClick={() => navigate("/")}>
      ⌂ Home
    </button>
  );
}

export default HomeButton;
