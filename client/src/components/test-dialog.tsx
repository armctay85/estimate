import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TestDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestDialog({ isOpen, onOpenChange }: TestDialogProps) {
  console.log('TestDialog render, isOpen:', isOpen);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Dialog</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>This is a test dialog to verify Dialog component works.</p>
          <button 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => onOpenChange(false)}
          >
            Close Dialog
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}