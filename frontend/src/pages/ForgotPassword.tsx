import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthLayout } from "components/AuthLayout";
import { AuthCard } from "components/AuthCard";
import { AuthInput } from "components/AuthInput";
import { AuthButton } from "components/AuthButton";
import { AuthTheme } from "utils/authTheme";
import { useSimpleAuth } from "utils/simple-auth-context";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { resetPassword } = useSimpleAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Basic validation
      if (!email.trim()) {
        toast.error("Please enter your email address");
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // Attempt password reset
      const { error } = await resetPassword(email);

      if (error) {
        console.error("Error requesting password reset:", error);
        toast.error(error.message || "Failed to request password reset. Please try again.");
      } else {
        setEmail("");
        toast.success("If an account exists for that email, you'll receive a reset link shortly.");
      }
    } catch (error) {
      console.error("Error requesting password reset:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        variants={AuthTheme.animations.containerFade}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        {/* Page title and icon */}
        <motion.div
          variants={AuthTheme.animations.scaleIn}
          className="flex justify-center mb-6"
        >
          <div 
            className="p-4 rounded-full"
            style={{ 
              backgroundColor: AuthTheme.colors.primary,
              boxShadow: AuthTheme.shadows.glow 
            }}
          >
            <Mail className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.div 
          variants={AuthTheme.animations.titleSlide}
          className="text-center mb-8"
        >
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: AuthTheme.colors.textPrimary }}
          >
            Reset Password
          </h1>
          <p 
            className="text-sm"
            style={{ color: AuthTheme.colors.textSecondary }}
          >
            Enter your email address and we'll send you a link to reset your password
          </p>
        </motion.div>
        
        {/* Form Card */}
        <AuthCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <AuthInput
              label="Email Address"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Submit Button */}
            <AuthButton
              type="submit"
              variant="primary"
              fullWidth
              loading={isLoading}
            >
              Send Reset Link
            </AuthButton>

            {/* Go Back Button */}
            <AuthButton
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </AuthButton>
          </form>
        </AuthCard>
        
        {/* Additional Help Text */}
        <motion.div
          variants={AuthTheme.animations.fadeIn}
          className="mt-6 text-center"
        >
          <p 
            className="text-sm"
            style={{ color: AuthTheme.colors.textMuted }}
          >
            Remember your password?{" "}
            <button
              onClick={() => navigate("/login")}
              className="underline transition-colors duration-300"
              style={{ color: AuthTheme.colors.primary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = AuthTheme.colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = AuthTheme.colors.primary;
              }}
            >
              Back to Login
            </button>
          </p>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}
