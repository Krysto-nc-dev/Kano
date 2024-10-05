"use client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plan } from "@prisma/client";
import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import React, { useState } from "react";

type Props = {
  selectedPriceId: string | Plan;
};

const SubscriptionForm = ({ selectedPriceId }: Props) => {
  const { toast } = useToast();
  const elements = useElements();
  const stripeHook = useStripe();
  const [priceError, setPriceError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedPriceId) {
      setPriceError("Vous devez sélectionner un plan pour vous abonner.");
      return;
    }
    setPriceError("");
    event.preventDefault();
    if (!stripeHook || !elements) return;

    try {
      const { error } = await stripeHook.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_URL}/agency`,
        },
      });
      if (error) {
        throw new Error();
      }
      toast({
        title: "Paiement réussi",
        description: "Votre paiement a été traité avec succès.",
      });
    } catch (error) {
      console.log(error);
      toast({
        variant: "destructive",
        title: "Échec du paiement",
        description:
          "Nous n'avons pas pu traiter votre paiement. Veuillez essayer une autre carte.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <small className="text-destructive">{priceError}</small>
      <PaymentElement />
      <Button disabled={!stripeHook} className="mt-4 w-full">
        Valider
      </Button>
    </form>
  );
};
export default SubscriptionForm;
