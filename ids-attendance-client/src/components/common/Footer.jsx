import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 py-6 mt-auto border-t">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-sm">
        <p className="mb-2 sm:mb-0">
          &copy; {new Date().getFullYear()}{" "}
          <Link to="/">ITvia Data Solutions</Link>. All rights reserved.
        </p>
        <div className="space-x-4">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <Link to="/terms">Terms & Conditions</Link>
          <Link to="/support">Support</Link>
        </div>
      </div>
    </footer>
  );
}
