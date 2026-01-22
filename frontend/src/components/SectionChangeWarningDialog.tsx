import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AdminInput } from './AdminInput';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SectionChangeWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  categoryName: string;
  oldSectionName: string | null;
  newSectionName: string;
  itemsAffected: number;
  subcategoriesAffected: number;
  isLoading?: boolean;
}

export function SectionChangeWarningDialog({
  isOpen,
  onClose,
  onConfirm,
  categoryName,
  oldSectionName,
  newSectionName,
  itemsAffected,
  subcategoriesAffected,
  isLoading = false
}: SectionChangeWarningDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  
  // Determine warning level based on item count
  const warningLevel = itemsAffected === 0 ? 'info' : itemsAffected <= 10 ? 'warning' : 'critical';
  
  const isConfirmValid = warningLevel !== 'critical' || confirmText.toUpperCase() === 'CONFIRM';
  
  const handleConfirm = () => {
    if (isConfirmValid) {
      onConfirm();
    }
  };
  
  const handleClose = () => {
    setConfirmText('');
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[rgba(21, 25, 42, 0.98)] text-white border-[rgba(124, 93, 250, 0.3)] max-w-md backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {warningLevel === 'info' && (
              <>
                <Info className="h-6 w-6 text-blue-400" />
                <span className="text-blue-400">Change Category Section?</span>
              </>
            )}
            {warningLevel === 'warning' && (
              <>
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
                <span className="text-yellow-400">Moving Category to Different Section</span>
              </>
            )}
            {warningLevel === 'critical' && (
              <>
                <AlertCircle className="h-6 w-6 text-red-400" />
                <span className="text-red-400">Critical: Moving Category with Many Items</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-[#BBC3E1] pt-2">
            You are about to move <strong className="text-white">"{categoryName}"</strong> from:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Section Change Visualization */}
          <div className="bg-[rgba(124,93,250,0.1)] border border-[rgba(124,93,250,0.3)] rounded-lg p-4">
            <div className="flex items-center justify-center gap-3 text-lg">
              <Badge className="bg-[rgba(220,38,38,0.2)] text-red-300 border-red-400/30 px-3 py-1">
                {oldSectionName || 'No Section'}
              </Badge>
              <span className="text-[#7C5DFA] font-bold text-xl">→</span>
              <Badge className="bg-[rgba(34,197,94,0.2)] text-green-300 border-green-400/30 px-3 py-1">
                {newSectionName}
              </Badge>
            </div>
          </div>
          
          {/* Impact Details */}
          {(itemsAffected > 0 || subcategoriesAffected > 0) && (
            <div className={`border rounded-lg p-4 ${
              warningLevel === 'critical' 
                ? 'bg-[rgba(220,38,38,0.1)] border-red-400/30' 
                : 'bg-[rgba(234,179,8,0.1)] border-yellow-400/30'
            }`}>
              <p className="font-medium mb-2 flex items-center gap-2">
                {warningLevel === 'critical' ? (
                  <AlertCircle className="h-5 w-5 text-red-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                )}
                <span className={warningLevel === 'critical' ? 'text-red-300' : 'text-yellow-300'}>
                  {warningLevel === 'critical' ? '⚠️ WARNING: This will affect:' : 'This will affect:'}
                </span>
              </p>
              <ul className="space-y-1 text-[#BBC3E1] ml-7">
                {itemsAffected > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="text-white font-semibold">{itemsAffected}</span> menu items will be reassigned
                  </li>
                )}
                {subcategoriesAffected > 0 && (
                  <li className="flex items-center gap-2">
                    <span className="text-white font-semibold">{subcategoriesAffected}</span> subcategories will be moved
                  </li>
                )}
                <li>POS displays will be updated immediately</li>
                {warningLevel === 'critical' && (
                  <li className="text-red-300">All online orders in progress may be affected</li>
                )}
              </ul>
            </div>
          )}
          
          {/* No Impact Message */}
          {itemsAffected === 0 && subcategoriesAffected === 0 && (
            <div className="bg-[rgba(34,197,94,0.1)] border border-green-400/30 rounded-lg p-4">
              <p className="text-green-300 flex items-center gap-2">
                <Info className="h-5 w-5" />
                No items will be affected.
              </p>
            </div>
          )}
          
          {/* Confirmation Input for Critical Level */}
          {warningLevel === 'critical' && (
            <div className="space-y-2">
              <label className="text-white font-medium block">
                Type "CONFIRM" to proceed:
              </label>
              <AdminInput
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type CONFIRM"
                variant="purple"
                className="uppercase"
              />
              {confirmText && confirmText.toUpperCase() !== 'CONFIRM' && (
                <p className="text-red-400 text-sm">Please type CONFIRM exactly</p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="border-[rgba(124,93,250,0.4)] text-white hover:bg-[rgba(124,93,250,0.1)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmValid || isLoading}
            className={`${
              warningLevel === 'critical'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[#7C5DFA] hover:bg-[#9277FF]'
            } text-white`}
          >
            {isLoading ? 'Moving...' : 'Move Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
