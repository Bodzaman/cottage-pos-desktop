import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthLayout } from "components/AuthLayout";
import { AuthCard } from "components/AuthCard";
import { AuthInput } from "components/AuthInput";
import { AuthButton } from "components/AuthButton";
import { AuthDivider } from "components/AuthDivider";
import { SocialLoginButton } from "components/SocialLoginButton";
import { AuthTheme } from "utils/authTheme";
import { useSimpleAuth } from "utils/simple-auth-context";
import { useGlobalKeyboardShortcuts } from "utils/useKeyboardShortcuts";

export default function Login() {
  const { signIn, signInWithGoogle, isLoading } = useSimpleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Keyboard shortcuts state
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  // Load Remember Me preference from localStorage on mount
  useEffect(() => {
    const savedRememberMe = localStorage.getItem('rememberMe');
    if (savedRememberMe === 'true') {
      setRememberMe(true);
    }
  }, []);

  // Setup keyboard shortcuts for Login page
  useGlobalKeyboardShortcuts({
    onShowHelp: () => {
      setShowKeyboardHelp(true);
    },
    onEscape: () => {
      setShowKeyboardHelp(false);
    },
    isAuthenticated: false // Not authenticated on login page
  });

  // Safely resolve return URL from location state or query string
  const getSafeReturnUrl = (raw?: string | null): string | null => {
    if (!raw || typeof raw !== 'string') return null;
    try {
      raw = decodeURIComponent(raw);
    } catch {}
    // Disallow external redirects
    if (raw.startsWith('http://') || raw.startsWith('https://')) return null;
    // Must be internal absolute path
    if (!raw.startsWith('/')) return null;
    // Prevent loops back to login
    if (raw === '/login' || raw.startsWith('/login')) return null;
    return raw;
  };

  const stateReturnUrl = (location.state as any)?.returnUrl as string | undefined;
  const queryReturnUrl = new URLSearchParams(location.search).get('returnUrl');
  const preferredReturnUrl = getSafeReturnUrl(stateReturnUrl) || getSafeReturnUrl(queryReturnUrl) || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      z.object({
        email: z.string().email({ message: "Please enter a valid email." }),
        password: z
          .string()
          .min(6, { message: "Password must be at least 6 characters." }),
      })
    ),
  });

  const handleLogin = async (data) => {
    setSubmitting(true);
    setLocalError(null);
    try {
      // Store Remember Me preference
      localStorage.setItem('rememberMe', rememberMe.toString());
      
      const { error } = await signIn(data.email, data.password);
      if (error) {
        setLocalError(error.message || "Invalid email or password. Please try again.");
        return;
      }
      setSuccess(true);
      // Brief success state then navigate to the appropriate page
      setTimeout(() => {
        const target = preferredReturnUrl || "/online-orders";
        navigate(target, { replace: true });
      }, 600);
    } catch (e) {
      setLocalError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    setLocalError(null);
    try {
      await signInWithGoogle();
      // OAuth flow will redirect; no local navigation here
    } catch (e) {
      setLocalError("Unable to start Google sign-in. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div 
        variants={AuthTheme.animations.containerFade}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md space-y-8"
      >
        {/* Page title and description */}
        <motion.div 
          variants={AuthTheme.animations.titleSlide}
          className="text-center mb-8"
        >
          <h1 
            className="text-3xl font-semibold tracking-tight mb-3"
            style={{ color: AuthTheme.colors.textPrimary }}
          >
            Welcome Back
          </h1>
          <p style={{ color: AuthTheme.colors.textSecondary }}>
            Sign in to your account to place orders, view your favorites, and manage your delivery preferences.
          </p>
        </motion.div>

        {/* Form Card */}
        <AuthCard>
          {/* Success/Error Messages */}
          {success && (
            <motion.div 
              variants={AuthTheme.animations.fadeIn}
              className="mb-6 rounded-lg border p-4 text-center"
              style={{
                borderColor: AuthTheme.colors.successBorder,
                background: AuthTheme.colors.successLight,
                color: AuthTheme.colors.success,
              }}
            >
              🎉 Login successful! Redirecting...
            </motion.div>
          )}

          {localError && (
            <motion.div 
              variants={AuthTheme.animations.fadeIn}
              className="mb-6 rounded-lg border p-4 text-center"
              style={{
                borderColor: AuthTheme.colors.errorBorder,
                background: AuthTheme.colors.errorLight,
                color: AuthTheme.colors.error,
              }}
            >
              {localError}
            </motion.div>
          )}

          {/* Google Sign In */}
          <SocialLoginButton 
            onClick={handleGoogleSignIn}
            loading={submitting || isLoading}
          />

          {/* Divider */}
          <div className="my-6">
            <AuthDivider />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-6">
            {/* Email Field */}
            <AuthInput
              label="Email address"
              type="email"
              placeholder="Enter your email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password Field */}
            <AuthInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              showPasswordToggle
              error={errors.password?.message}
              {...register("password")}
            />

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between -mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="data-[state=checked]:border-[#8B1538]"
                  style={{
                    borderColor: AuthTheme.colors.inputBorder,
                  }}
                />
                <label
                  htmlFor="rememberMe"
                  className="text-sm cursor-pointer select-none"
                  style={{ color: AuthTheme.colors.textMuted }}
                >
                  Remember me
                </label>
              </div>
              
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm hover:underline"
                style={{ color: AuthTheme.colors.textMuted }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <AuthButton
              type="submit"
              variant="primary"
              fullWidth
              loading={submitting || isLoading}
            >
              Sign in
            </AuthButton>
          </form>

          {/* Sign Up Link */}
          <div className="text-center mt-6">
            <p style={{ color: AuthTheme.colors.textSecondary }}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/sign-up")}
                className="font-medium transition-colors duration-200 hover:underline"
                style={{ color: AuthTheme.colors.primary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = AuthTheme.colors.primaryHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = AuthTheme.colors.primary;
                }}
              >
                Sign up here
              </button>
            </p>
          </div>
        </AuthCard>
      </motion.div>
    </AuthLayout>
  );
}
