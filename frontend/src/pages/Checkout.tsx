/**
 * Checkout Page - Modern single-page checkout experience
 *
 * This page renders the new accordion-style checkout flow
 * inspired by Deliveroo, UberEats, and DoorDash
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckoutContainer } from '../components/checkout';
import { SEO } from 'components/SEO';

export default function Checkout() {
  const navigate = useNavigate();

  const handleNavigateToMenu = () => {
    navigate('/online-orders');
  };

  return (
    <>
      <SEO
        title="Checkout | Cottage Tandoori"
        description="Complete your order from Cottage Tandoori. Secure checkout with fast delivery or collection options."
        path="/checkout"
      />
      <CheckoutContainer onNavigateToMenu={handleNavigateToMenu} />
    </>
  );
}
