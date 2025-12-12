import { CheckCircle, Heart } from "lucide-react";

export const metadata = {
  title: "Thank You! - Donation Complete",
};

export default function WidgetSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-pink-100 flex items-center justify-center">
              <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Thank You!
        </h1>
        <p className="text-slate-600 mb-6">
          Your donation has been processed successfully. You&apos;ll receive a
          confirmation email shortly.
        </p>

        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
          <p className="font-medium">Your generosity makes a difference!</p>
          <p className="mt-1 text-emerald-600">
            100% of your donation goes directly to the nonprofit.
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Powered by{" "}
          <a
            href="https://donor-x.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-slate-600"
          >
            DonorX
          </a>
        </p>
      </div>
    </div>
  );
}
