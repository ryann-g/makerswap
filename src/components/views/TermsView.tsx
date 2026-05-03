import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TermsView() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground text-lg">Effective Date: {new Date().toLocaleDateString()}</p>
      </div>

      <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh] rounded-md p-6 lg:p-10">
            <div className="space-y-8 text-muted-foreground leading-relaxed">
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using MakerSwap, you agree to be bound by these Terms of Service. MakerSwap is a platform specifically designed for university engineering students to exchange hardware and collaborate on bounties. If you do not agree to these terms, please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. "As-Is" Hardware Swaps</h2>
                <p>
                  All hardware and components exchanged through MakerSwap are provided on an <strong>"AS-IS"</strong> and <strong>"AS-AVAILABLE"</strong> basis. MakerSwap does not test, verify, or guarantee the functionality, safety, or suitability of any hardware listed on the platform. 
                </p>
                <p className="mt-4">
                  By participating in a swap, you acknowledge that you are acquiring used or untested hardware at your own risk. MakerSwap and its affiliates are not liable for any faulty hardware, damages to equipment, or personal injury resulting from the use of exchanged items.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. Academic Integrity & Code of Conduct</h2>
                <p>
                  MakerSwap fosters a collaborative and respectful environment for university students. Users are expected to adhere to the following Code of Conduct:
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li><strong>Academic Honesty:</strong> Bounties and collaborations must not violate your university's academic integrity policies. Do not use MakerSwap to outsource graded coursework or exams.</li>
                  <li><strong>Respectful Interaction:</strong> Harassment, hate speech, or discriminatory behavior towards other students will result in immediate termination of your account.</li>
                  <li><strong>Fair Dealing:</strong> Accurately describe the condition of hardware you list. Do not misrepresent items or engage in fraudulent transactions.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Limitation of Liability</h2>
                <p>
                  In no event shall MakerSwap be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
