import { useState } from "react";
import { Share2, Copy, Check, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { PremiumTheme } from "utils/premiumTheme";

interface SocialShareButtonsProps {
  url: string;
  title: string;
}

export function SocialShareButtons({ url, title }: SocialShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const handleTwitterShare = () => {
    window.open(
      `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      "_blank",
      "noopener,noreferrer,width=600,height=400"
    );
  };

  const buttonBase =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 backdrop-blur-md";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <Share2 className="w-4 h-4" style={{ color: PremiumTheme.colors.text.muted }} />
        <span
          className="text-sm font-medium uppercase tracking-wider"
          style={{ color: PremiumTheme.colors.text.muted }}
        >
          Share this article
        </span>
      </div>
      <div className="flex flex-wrap gap-3">
        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className={buttonBase}
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${PremiumTheme.colors.border.light}`,
            color: PremiumTheme.colors.text.primary,
          }}
        >
          {copied ? (
            <Check className="w-4 h-4" style={{ color: PremiumTheme.colors.status.success }} />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          {copied ? "Copied!" : "Copy link"}
        </button>

        {/* Facebook */}
        <button
          onClick={handleFacebookShare}
          className={buttonBase}
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${PremiumTheme.colors.border.light}`,
            color: PremiumTheme.colors.text.primary,
          }}
        >
          <Facebook className="w-4 h-4" />
          Facebook
        </button>

        {/* X / Twitter */}
        <button
          onClick={handleTwitterShare}
          className={buttonBase}
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: `1px solid ${PremiumTheme.colors.border.light}`,
            color: PremiumTheme.colors.text.primary,
          }}
        >
          <Twitter className="w-4 h-4" />
          X / Twitter
        </button>
      </div>
    </div>
  );
}
