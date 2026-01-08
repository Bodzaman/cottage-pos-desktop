import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, initializeSupabase } from "utils/supabaseClient";

interface Props {
  onConfigUpdate: () => void;
}

export function UpdateDatabaseConfig({ onConfigUpdate }: Props) {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseKey, setSupabaseKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Initialize the Supabase client with new credentials
      initializeSupabase(supabaseUrl, supabaseKey);
      
      setSuccess(true);
      onConfigUpdate();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle>Database Configuration</CardTitle>
        <CardDescription className="text-gray-300">
          Connect to your Supabase project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project-id.supabase.co"
              className="bg-gray-700 text-white"
              required
            />
          </div>
          <div className="grid w-full items-center gap-2">
            <Label htmlFor="supabaseKey">Supabase API Key</Label>
            <Input
              id="supabaseKey"
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="your-supabase-api-key"
              className="bg-gray-700 text-white"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-purple-700 hover:bg-purple-800"
          >
            {loading ? "Saving..." : "Update Configuration"}
          </Button>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">Configuration updated successfully!</div>}
        </form>
      </CardContent>
    </Card>
  );
}
