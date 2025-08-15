import { useState } from 'react';
import { signIn } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { error } = await signIn(email, password);
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/overview');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-bold text-center">Login</h2>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border px-3 py-2 rounded text-sm"
          required
        />
        <button
          type="submit"
          className="w-full bg-[#759b2c] text-white py-2 rounded hover:bg-[#638c26] text-sm"
        >
          Login
        </button>
      </form>
    </div>
  );
}
