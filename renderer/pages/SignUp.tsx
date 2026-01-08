import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
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
import { toast } from "sonner";
import { parsePhoneNumber, AsYouType } from "libphonenumber-js";
import { useGlobalKeyboardShortcuts } from "utils/useKeyboardShortcuts";
import { KeyboardShortcutsHelp } from "components/KeyboardShortcutsHelp";
import { VisuallyHidden } from "components/VisuallyHidden";
import { useChatStore } from "utils/chat-store";

// Password strength calculator
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  // Cap at 4 to match array indices (0-4)
  return Math.min(strength, 4);
};

// Zod schema for signup form validation
const signUpSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the Terms & Conditions"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const { signUp, signIn, signInWithGoogle, isLoading, setJustSignedUp } = useSimpleAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false
    }
  });

  // Watch password for strength meter
  const password = watch("password", "");
  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthText = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];
  const passwordStrengthColors = [
    { bg: 'bg-red-500', text: 'text-red-400' },
    { bg: 'bg-orange-500', text: 'text-orange-400' },
    { bg: 'bg-yellow-500', text: 'text-yellow-400' },
    { bg: 'bg-blue-500', text: 'text-blue-400' },
    { bg: 'bg-green-500', text: 'text-green-400' }
  ];
  const strengthColor = passwordStrengthColors[passwordStrength] || passwordStrengthColors[0];

  // Setup keyboard shortcuts for SignUp page
  useGlobalKeyboardShortcuts({
    onShowHelp: () => {
      setShowKeyboardHelp(true);
    },
    onEscape: () => {
      setShowKeyboardHelp(false);
    },
    isAuthenticated: false // Not authenticated on signup page
  });

  const handleSignUp = async (data: SignUpFormData) => {
    setSubmitting(true);
    setLocalError(null);
    
    try {
      const { error } = await signUp(
        data.email.trim(),
        data.password,
        {
          first_name: data.firstName.trim(),
          last_name: data.lastName.trim()
        }
      );

      if (error) {
        if (error.message?.toLowerCase().includes('already registered')) {
          setLocalError("This email is already registered. Please sign in instead.");
        } else {
          setLocalError(error.message || "Unable to create account. Please try again.");
        }
        setSubmitting(false);
        return;
      }

      // Success! Set the justSignedUp flag to trigger onboarding wizard
      setJustSignedUp(true);
      setEmailVerificationSent(true);
      toast.success('Account created! Welcome to Cottage Tandoori.');

      // 🚀 NEW: Set flag for ChatLargeModal to auto-open chat on home page
      sessionStorage.setItem('auto_open_chat_after_signup', 'true');
      
      // Navigate to home (chat will auto-open via ChatLargeModal useEffect)
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (e) {
      console.error('Signup error:', e);
      setLocalError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSubmitting(true);
    setLocalError(null);
    
    try {
      const { error } = await signInWithGoogle();
      
      if (error) {
        setLocalError(error.message || "Unable to start Google sign-up. Please try again.");
        setSubmitting(false);
      }
      // OAuth flow will redirect; no local navigation here
    } catch (e) {
      console.error('Google signup error:', e);
      setLocalError("Unable to start Google sign-up. Please try again.");
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
            Join Cottage Tandoori
          </h1>
          <p style={{ color: AuthTheme.colors.textSecondary }}>
            Create your account to place orders, save your favorites, and enjoy a personalized dining experience.
          </p>
        </motion.div>
        
        {/* Form Card */}
        <AuthCard>
          {/* Success/Error Messages */}
          {emailVerificationSent && (
            <motion.div 
              variants={AuthTheme.animations.fadeIn}
              className="mb-6 rounded-lg border p-4 text-center"
              style={{
                borderColor: AuthTheme.colors.successBorder,
                background: AuthTheme.colors.successLight,
                color: AuthTheme.colors.success,
              }}
            >
              ✅ Account created! Please check your email to verify your account.
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

          {/* Google Sign Up Button */}
          <SocialLoginButton 
            onClick={handleGoogleSignUp}
            loading={submitting || isLoading}
          />

          {/* Divider */}
          <div className="my-6">
            <AuthDivider />
          </div>

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit(handleSignUp)} className="space-y-6">
            {/* First Name and Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <AuthInput
                label="First Name"
                type="text"
                placeholder="First name"
                inputMode="text"
                autoComplete="given-name"
                error={errors.firstName?.message}
                {...register("firstName")}
              />
              
              <AuthInput
                label="Last Name"
                type="text"
                placeholder="Last name"
                inputMode="text"
                autoComplete="family-name"
                error={errors.lastName?.message}
                {...register("lastName")}
              />
            </div>

            {/* Email Field */}
            <AuthInput
              label="Email address"
              type="email"
              placeholder="Enter your email"
              inputMode="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register("email")}
            />

            {/* Password Field with strength meter */}
            <div className="space-y-2">
              <AuthInput
                label="Password"
                type="password"
                placeholder="Create a password (min 8 characters)"
                showPasswordToggle
                autoComplete="new-password"
                error={errors.password?.message}
                {...register("password")}
              />
              
              {/* Password Strength Meter */}
              {password && password.length > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength === 0 ? 'w-0' :
                          passwordStrength === 1 ? `${strengthColor.bg} w-1/5` :
                          passwordStrength === 2 ? `${strengthColor.bg} w-2/5` :
                          passwordStrength === 3 ? `${strengthColor.bg} w-3/5` :
                          passwordStrength === 4 ? `${strengthColor.bg} w-4/5` :
                          `${strengthColor.bg} w-full`
                        }`}
                      />
                    </div>
                    <span className={`text-xs ${strengthColor.text}`}>
                      {passwordStrengthText}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <AuthInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              showPasswordToggle
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            {/* Terms & Conditions Checkbox */}
            <div className="space-y-2">
              <div className="flex items-start space-x-3">
                <Controller
                  name="acceptTerms"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="acceptTerms"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="mt-1 data-[state=checked]:bg-[#8B1538] data-[state=checked]:border-[#8B1538]"
                      style={{
                        borderColor: AuthTheme.colors.inputBorder,
                      }}
                    />
                  )}
                />
                <label 
                  htmlFor="acceptTerms" 
                  className="text-sm leading-relaxed"
                  style={{ color: AuthTheme.colors.textSecondary }}
                >
                  I confirm that I am 18 years or older and I accept the{" "}
                  <a 
                    href="/terms" 
                    target="_blank" 
                    className="hover:underline"
                    style={{ color: AuthTheme.colors.primary }}
                  >
                    Terms & Conditions
                  </a>
                  {" "}and{" "}
                  <a 
                    href="/privacy" 
                    target="_blank" 
                    className="hover:underline"
                    style={{ color: AuthTheme.colors.primary }}
                  >
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm" style={{ color: AuthTheme.colors.error }}>
                  {errors.acceptTerms.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <AuthButton
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting || isLoading}
              >
                Create Account
              </AuthButton>
            </div>
          </form>
        </AuthCard>

        {/* Sign in link */}
        <motion.p
          variants={AuthTheme.animations.elementSlide}
          className="text-center mt-6 text-sm"
          style={{ color: AuthTheme.colors.textMuted }}
        >
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold hover:underline"
            style={{ color: AuthTheme.colors.primary }}
            aria-label="Go to login page"
          >
            Sign in
          </button>
        </motion.p>
      </motion.div>
      
      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        isAuthenticated={false}
      />
    </AuthLayout>
  );
}
