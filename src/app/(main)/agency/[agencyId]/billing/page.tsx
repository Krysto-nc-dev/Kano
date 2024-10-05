import React from "react";
import { stripe } from "@/lib/stripe";
import { addOnProducts, pricingCards } from "@/lib/constants";
import { db } from "@/lib/db";
import { Separator } from "@/components/ui/separator";
import PricingCard from "./_components/pricing-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from "clsx";
import SubscriptionHelper from "./_components/subscription-helper";

type Props = {
  params: { agencyId: string };
};

const page = async ({ params }: Props) => {
  // CHALLENGE : Créer les produits supplémentaires
  const addOns = await stripe.products.list({
    ids: addOnProducts.map((product) => product.id),
    expand: ["data.default_price"],
  });

  const agencySubscription = await db.agency.findUnique({
    where: {
      id: params.agencyId,
    },
    select: {
      customerId: true,
      Subscription: true,
    },
  });

  const prices = await stripe.prices.list({
    product: process.env.NEXT_PLURA_PRODUCT_ID,
    active: true,
  });

  const currentPlanDetails = pricingCards.find(
    (c) => c.priceId === agencySubscription?.Subscription?.priceId
  );

  const charges = await stripe.charges.list({
    limit: 50,
    customer: agencySubscription?.customerId,
  });

  const allCharges = [
    ...charges.data.map((charge) => ({
      description: charge.description,
      id: charge.id,
      date: `${new Date(charge.created * 1000).toLocaleTimeString()} ${new Date(
        charge.created * 1000
      ).toLocaleDateString()}`,
      status: "Payé",
      amount: `${charge.amount / 100} €`,
    })),
  ];

  return (
    <>
      <SubscriptionHelper
        prices={prices.data}
        customerId={agencySubscription?.customerId || ""}
        planExists={agencySubscription?.Subscription?.active === true}
      />
      <h1 className="text-4xl p-4">Facturation</h1>
      <Separator className=" mb-6" />
      <h2 className="text-2xl p-4">Plan actuel</h2>
      <div className="flex flex-col lg:!flex-row justify-between gap-8">
        <PricingCard
          planExists={agencySubscription?.Subscription?.active === true}
          prices={prices.data}
          customerId={agencySubscription?.customerId || ""}
          amt={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.price || "0 €"
              : "0 €"
          }
          buttonCta={
            agencySubscription?.Subscription?.active === true
              ? "Modifier le plan"
              : "Commencer"
          }
          highlightDescription="Vous souhaitez modifier votre plan ? Vous pouvez le faire ici. Si vous avez d'autres questions, contactez support@plura-app.com"
          highlightTitle="Options de plan"
          description={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.description || "Commençons"
              : "Commençons ! Choisissez le plan qui vous convient le mieux."
          }
          duration="/ mois"
          features={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.features || []
              : currentPlanDetails?.features ||
                pricingCards.find((pricing) => pricing.title === "Starter")
                  ?.features ||
                []
          }
          title={
            agencySubscription?.Subscription?.active === true
              ? currentPlanDetails?.title || "Starter"
              : "Starter"
          }
        />
        {addOns.data.map((addOn) => (
          <PricingCard
            planExists={agencySubscription?.Subscription?.active === true}
            prices={prices.data}
            customerId={agencySubscription?.customerId || ""}
            key={addOn.id}
            amt={
              //@ts-ignore
              addOn.default_price?.unit_amount
                ? //@ts-ignore
                  `${addOn.default_price.unit_amount / 100} €`
                : "0 €"
            }
            buttonCta="S'abonner"
            description="Ligne de support dédiée et canal d'équipe pour le support"
            duration="/ mois"
            features={[]}
            title={"Support prioritaire 24/7"}
            highlightTitle="Obtenez de l'aide maintenant !"
            highlightDescription="Obtenez un support prioritaire et évitez les longues files d'attente en un seul clic."
          />
        ))}
      </div>
      <h2 className="text-2xl p-4">Historique des paiements</h2>
      <Table className="bg-card border-[1px] border-border rounded-md">
        <TableHeader className="rounded-md">
          <TableRow>
            <TableHead className="w-[200px]">Description</TableHead>
            <TableHead className="w-[200px]">ID de facture</TableHead>
            <TableHead className="w-[300px]">Date</TableHead>
            <TableHead className="w-[200px]">Payé</TableHead>
            <TableHead className="text-right">Montant</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-medium truncate">
          {allCharges.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>{charge.description}</TableCell>
              <TableCell className="text-muted-foreground">
                {charge.id}
              </TableCell>
              <TableCell>{charge.date}</TableCell>
              <TableCell>
                <p
                  className={clsx("", {
                    "text-emerald-500": charge.status.toLowerCase() === "payé",
                    "text-orange-600":
                      charge.status.toLowerCase() === "pending",
                    "text-red-600": charge.status.toLowerCase() === "failed",
                  })}
                >
                  {charge.status.toUpperCase()}
                </p>
              </TableCell>
              <TableCell className="text-right">{charge.amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
};

export default page;
