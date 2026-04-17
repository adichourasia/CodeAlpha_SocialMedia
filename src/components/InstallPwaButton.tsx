import { usePwaInstall } from '@/lib/pwa';
import { Button } from '@/components/ui/button';

const InstallPwaButton = () => {
  const { triggerInstall, isInstalled } = usePwaInstall();

  if (isInstalled) return null;

  return (
    <Button
      variant="outline"
      className="fixed bottom-4 right-4 z-50 shadow-lg md:hidden"
      onClick={async () => {
        const result = await triggerInstall();
        // Optionally handle result.outcome
      }}
    >
      Install App
    </Button>
  );
};

export default InstallPwaButton;
