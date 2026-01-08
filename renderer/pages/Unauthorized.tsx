import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useSimpleAuth } from '../utils/simple-auth-context';

export default function Unauthorized() {
  const { user } = useSimpleAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-lg">
        <div className="flex items-center justify-center mb-6 text-rose-500">
          <AlertTriangle size={48} />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-4">Access Denied</h1>
        
        <p className="text-gray-300 text-center mb-6">
          {user 
            ? "You don't have permission to access this page. Please contact an administrator if you believe this is an error."
            : "You need to be logged in to access this page."}
        </p>
        
        <div className="flex flex-col gap-3">
          {user ? (
            <Button 
              onClick={() => navigate(-1)}
              className="w-full bg-rose-700 hover:bg-rose-800"
            >
              Go Back
            </Button>
          ) : (
            <Button 
              onClick={() => navigate('/login')}
              className="w-full bg-rose-700 hover:bg-rose-800"
            >
              Log In
            </Button>
          )}
          
          <Button 
            variant="outline"
            asChild
            className="w-full border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            <Link to="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
