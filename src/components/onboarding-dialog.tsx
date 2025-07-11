'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/context/OnboardingContext';
import { BoomnLogo } from './boomn-logo';

export function OnboardingDialog() {
  const { isOpen, close } = useOnboarding();

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <BoomnLogo className="w-16 h-16 mx-auto text-primary" />
          <DialogTitle className="mt-4 text-2xl">Let's get you set up!</DialogTitle>
          <DialogDescription>
            Complete your profile to get the most out of Boomn. You can always do this later in your settings.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Placeholder for future steps */}
          <p className="text-center text-muted-foreground">
            Profile setup steps will go here.
          </p>
        </div>
        <DialogFooter className="sm:justify-between sm:flex-row-reverse">
          <Button type="button" onClick={() => { /* Handle next step */ }}>
            Let's Go
          </Button>
          <Button type="button" variant="secondary" onClick={close}>
            Skip for Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
