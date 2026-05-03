import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function PrivacyView() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans">
      <div className="mb-10">
        <Button variant="ghost" asChild className="mb-8 -ml-4 text-muted-foreground hover:text-foreground">
          <Link to="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Marketplace
          </Link>
        </Button>
        <div className="text-left space-y-3">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">Student Data Protection is our Priority</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1 */}
        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              1. Institutional Data & Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              MakerSwap operates as a closed-loop network exclusive to the academic community. To maintain this integrity, we require authentication via institutional email addresses (e.g., @msuiit.edu.ph or equivalent university domains). This data is used solely to verify your status as a student or faculty member, ensuring a high-trust environment for hardware exchange.
            </p>
          </CardContent>
        </Card>

        {/* Section 2 */}
        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              2. Technical Architecture & Data Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              Your data is managed through a secure cloud infrastructure utilizing Firebase and Firestore. We leverage real-time data fetching for platform activity, such as bounty updates and marketplace listings, while ensuring that all communications and support tickets are encrypted at rest. Our security protocols are updated regularly to mitigate vulnerabilities and protect the university's digital perimeter.
            </p>
          </CardContent>
        </Card>

        {/* Section 3 */}
        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              3. Peer-to-Peer Transparency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              MakerSwap is built for students, by students. We do not monetize your personal data or share it with external marketing third parties. Basic profile information—including your name and academic affiliation—is visible only to other verified members of the university ecosystem to facilitate safe, face-to-face hardware swaps and project collaborations.
            </p>
          </CardContent>
        </Card>

        {/* Section 4 */}
        <Card className="border-border/50 shadow-sm bg-card/60 backdrop-blur-sm overflow-hidden transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              4. Data Governance & Deletion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed text-[15px]">
              In alignment with digital rights standards, users maintain full control over their information. You may request a full export of your data or the permanent deletion of your account and associated transaction history at any time by visiting our <Link to="/contact" className="text-primary hover:underline font-medium">Contact Support</Link> page.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
        <p>Last Updated: {new Date().toLocaleDateString()}</p>
        <p>
          Have questions about your data? <Link to="/contact" className="text-primary hover:underline font-medium transition-colors">Contact Support</Link>
        </p>
      </div>
    </div>
  );
}
