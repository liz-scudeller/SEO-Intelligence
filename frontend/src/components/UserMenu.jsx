import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Settings } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function UserMenu() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return;

      const { data, error } = await supabase
        .from('accounts')
        .select('full_name, plan')
        .eq('id', user.id)
        .single();

      if (!error) setUserData(data);
    };

    fetchInfo();
  }, []);

  if (!userData) return null;

  const { full_name, plan } = userData;
  const initials = full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 ml-auto">
  <Link to="/settings" title="Settings">
    <Settings className="w-5 h-5 text-gray-600 hover:text-black cursor-pointer" />
  </Link>
  <div className="text-right">
    <p className="text-sm font-medium text-gray-800">{full_name}</p>
    <p className="text-xs text-gray-500">{plan}</p>
  </div>
  <div className="w-9 h-9 rounded-full bg-[#2a2b2e] text-white flex items-center justify-center font-bold">
    {initials}
  </div>
</div>
  );
}
