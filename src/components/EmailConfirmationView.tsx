
import { Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailConfirmationViewProps {
  email: string;
  onResend: () => void;
  onBack: () => void;
}

const EmailConfirmationView = ({ email, onResend, onBack }: EmailConfirmationViewProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-dashed border-cyan-400 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-light text-slate-200 mb-2 tracking-wider">
            Check Your Email
          </h1>
          <p className="text-slate-400 text-sm">
            Confirmation signal transmitted
          </p>
        </div>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-cyan-400/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-cyan-400" />
            </div>
            <CardTitle className="text-slate-200">Email Confirmation Required</CardTitle>
            <CardDescription className="text-slate-400">
              We've sent a confirmation link to <strong className="text-slate-300">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-slate-400">
              <p className="mb-4">Click the link in your email to activate your account and access the consciousness network.</p>
              <p className="text-xs text-slate-500">
                Didn't receive the email? Check your spam folder or request a new one below.
              </p>
            </div>
            
            <Button
              onClick={onResend}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Resend Confirmation Email
            </Button>
            
            <Button
              onClick={onBack}
              variant="ghost"
              className="w-full text-cyan-400 hover:text-cyan-300 hover:bg-slate-700"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailConfirmationView;
