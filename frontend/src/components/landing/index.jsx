import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div>
      <h1>Welcome</h1>

      <Link to="/login">
        <button>Login</button>
      </Link>

      <Link to="/register">
        <button>Register</button>
      </Link>
    </div>
  );
}