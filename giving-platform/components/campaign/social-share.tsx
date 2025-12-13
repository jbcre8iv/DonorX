"use client";

import * as React from "react";
import { Share2, Link2, Check, Twitter, Facebook, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = React.useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || "");

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-500 mr-1">
        <Share2 className="h-4 w-4 inline mr-1" />
        Share:
      </span>

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => window.open(shareLinks.twitter, "_blank", "width=550,height=420")}
        title="Share on Twitter"
      >
        <Twitter className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => window.open(shareLinks.facebook, "_blank", "width=550,height=420")}
        title="Share on Facebook"
      >
        <Facebook className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => window.location.href = shareLinks.email}
        title="Share via Email"
      >
        <Mail className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-8 px-2"
        onClick={copyToClipboard}
        title="Copy link"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1 text-emerald-600" />
            <span className="text-xs">Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-1" />
            <span className="text-xs">Copy</span>
          </>
        )}
      </Button>
    </div>
  );
}

// Compact version for mobile/cards
export function SocialShareCompact({ url, title }: { url: string; title: string }) {
  const [showOptions, setShowOptions] = React.useState(false);

  if (!showOptions) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(true)}
      >
        <Share2 className="h-4 w-4 mr-2" />
        Share
      </Button>
    );
  }

  return (
    <SocialShare url={url} title={title} />
  );
}
