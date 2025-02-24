import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { auth, db } from "../firebase.ts";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  signOut,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { login } from "../redux/authSlice.jsx";
import { Eye, EyeOff } from "lucide-react";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const SignUpModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await sendEmailVerification(user);
      await setDoc(doc(db, "users", user.uid), { username: name });

      setMessage("Verification email sent! Please check your inbox and verify your email before logging in.");
      await signOut(auth); // Force sign-out until email is verified
    } catch (error: any) {
      console.error("Error signing up:", error.message);
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 h-screen overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 relative">
        <button className="absolute top-4 right-4 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-xl" onClick={onClose}>
          &times;
        </button>

        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white text-center mb-6">Create Your Account</h2>

        {message && (
          <div className={`p-3 rounded-md text-center text-sm font-medium ${message.includes("sent") ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
            {message.includes("sent") ? "✓" : "⚠️"} {message}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSignup}>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
            <input type="text" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
            <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Create a password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-2 w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md" />
              <button type="button" className="absolute right-4 top-3 text-gray-500 dark:text-gray-400" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full py-3 text-white bg-blue-600 hover:bg-blue-700 rounded-md" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
          <button type="button" className="text-blue-600 hover:underline dark:text-blue-400" onClick={() => { onClose(); onSwitchToLogin(); }}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignUpModal;
