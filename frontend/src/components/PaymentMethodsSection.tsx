import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Star, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import brain from 'brain';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Card brand icons (simple text badges for now)
const CARD_BRANDS: Record<string, { label: string; color: string }> = {
  visa: { label: 'Visa', color: 'bg-blue-500/20 text-blue-400' },
  mastercard: { label: 'Mastercard', color: 'bg-orange-500/20 text-orange-400' },
  amex: { label: 'Amex', color: 'bg-green-500/20 text-green-400' },
  discover: { label: 'Discover', color: 'bg-purple-500/20 text-purple-400' },
  unknown: { label: 'Card', color: 'bg-gray-500/20 text-gray-400' },
};

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

interface PaymentMethodsSectionProps {
  customerId: string;
}

// Card Element styles
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#EAECEF',
      '::placeholder': {
        color: '#6B7280',
      },
      iconColor: '#8B1538',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
};

// Add Card Form Component (uses Stripe Elements context)
function AddCardForm({
  customerId,
  clientSecret,
  onSuccess,
  onCancel,
}: {
  customerId: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Card element not found');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (setupError) {
        setError(setupError.message || 'Failed to save card');
        setIsSubmitting(false);
        return;
      }

      if (setupIntent?.status === 'succeeded') {
        toast.success('Card saved successfully');
        onSuccess();
      } else {
        setError('Card setup incomplete');
      }
    } catch (err) {
      console.error('Setup error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
        <CardElement options={cardElementOptions} />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-white/20 text-gray-300 hover:bg-white/10"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || isSubmitting}
          className="bg-[#8B1538] hover:bg-[#A91D47] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Save Card
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function PaymentMethodsSection({ customerId }: PaymentMethodsSectionProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [addCardDialogOpen, setAddCardDialogOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<PaymentMethod | null>(null);
  const [isDeletingCard, setIsDeletingCard] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Load payment methods
  const loadPaymentMethods = async () => {
    if (!customerId) return;

    setIsLoading(true);
    try {
      const response = await brain.list_payment_methods(customerId);
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.payment_methods || []);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load saved cards');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, [customerId]);

  // Handle add card
  const handleAddCard = async () => {
    setIsAddingCard(true);
    try {
      const response = await brain.create_setup_intent(customerId);
      const data = await response.json();

      if (data.success && data.client_secret) {
        setClientSecret(data.client_secret);
        setAddCardDialogOpen(true);
      } else {
        toast.error('Failed to start card setup');
      }
    } catch (error) {
      console.error('Error creating setup intent:', error);
      toast.error('Failed to start card setup');
    } finally {
      setIsAddingCard(false);
    }
  };

  // Handle card added successfully
  const handleCardAdded = () => {
    setAddCardDialogOpen(false);
    setClientSecret(null);
    loadPaymentMethods();
  };

  // Handle delete card
  const handleDeleteClick = (card: PaymentMethod) => {
    setCardToDelete(card);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!cardToDelete) return;

    setIsDeletingCard(true);
    try {
      const response = await brain.delete_payment_method(customerId, cardToDelete.id);
      const data = await response.json();

      if (data.success) {
        toast.success('Card removed successfully');
        loadPaymentMethods();
      } else {
        toast.error(data.message || 'Failed to remove card');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to remove card');
    } finally {
      setIsDeletingCard(false);
      setDeleteDialogOpen(false);
      setCardToDelete(null);
    }
  };

  // Handle set default
  const handleSetDefault = async (card: PaymentMethod) => {
    if (card.is_default) return;

    setSettingDefaultId(card.id);
    try {
      const response = await brain.set_default_payment_method(customerId, card.id);
      const data = await response.json();

      if (data.success) {
        toast.success('Default payment method updated');
        loadPaymentMethods();
      } else {
        toast.error(data.message || 'Failed to set default');
      }
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Get brand display info
  const getBrandInfo = (brand: string) => {
    return CARD_BRANDS[brand.toLowerCase()] || CARD_BRANDS.unknown;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Card List */}
      {paymentMethods.length > 0 ? (
        <div className="space-y-3">
          {paymentMethods.map((card) => {
            const brandInfo = getBrandInfo(card.brand);
            return (
              <div
                key={card.id}
                className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/5">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${brandInfo.color}`}>
                        {brandInfo.label}
                      </span>
                      <span className="text-white font-medium">**** {card.last4}</span>
                      {card.is_default && (
                        <Badge className="bg-[#8B1538]/20 text-[#8B1538] border-[#8B1538]/30 text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires {card.exp_month.toString().padStart(2, '0')}/{card.exp_year}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!card.is_default && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(card)}
                      disabled={settingDefaultId === card.id}
                      className="text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      {settingDefaultId === card.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(card)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="p-3 rounded-full bg-white/5 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">No saved cards yet</p>
          <p className="text-gray-500 text-xs mt-1">Add a card for faster checkout</p>
        </div>
      )}

      {/* Add Card Button */}
      <Button
        onClick={handleAddCard}
        disabled={isAddingCard}
        variant="outline"
        className="w-full border-dashed border-white/20 text-gray-300 hover:bg-white/5 hover:border-white/30"
      >
        {isAddingCard ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Setting up...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add New Card
          </>
        )}
      </Button>

      {/* Add Card Dialog */}
      <Dialog open={addCardDialogOpen} onOpenChange={setAddCardDialogOpen}>
        <DialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF] max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Payment Card</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your card details. Your card information is securely processed by Stripe.
            </DialogDescription>
          </DialogHeader>

          {clientSecret && (
            <Elements stripe={stripePromise}>
              <AddCardForm
                customerId={customerId}
                clientSecret={clientSecret}
                onSuccess={handleCardAdded}
                onCancel={() => {
                  setAddCardDialogOpen(false);
                  setClientSecret(null);
                }}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#17191D] border-white/10 text-[#EAECEF] max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Remove Card?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to remove this card (**** {cardToDelete?.last4})?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="border-white/20 text-gray-300 hover:bg-white/10"
              disabled={isDeletingCard}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeletingCard}
            >
              {isDeletingCard ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Card'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
