import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface CartItemAddedConfirmationProps {
  itemName: string;
}

/**
 * Small inline confirmation message shown when item is added to cart
 * Non-intrusive, appears briefly in chat flow
 */
export default function CartItemAddedConfirmation({ itemName }: CartItemAddedConfirmationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2 px-4 py-2 mb-2 text-sm text-emerald-400 bg-emerald-950/30 border border-emerald-800/50 rounded-lg w-fit"
    >
      <CheckCircle className="w-4 h-4" />
      <span>
        <strong>{itemName}</strong> added to cart
      </span>
    </motion.div>
  );
}
