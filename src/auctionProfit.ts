import { PriceType, Profit } from "./types";

export default function auctionProfit(
  profit: Profit,
  craftsPriceType: PriceType,
  costPriceType: PriceType
) {
  return (
    (profit.crafts
      ? Math.floor(
          (profit.crafts.auctions.length > 0
            ? profit.crafts.auctions[profit.crafts.auctions.length - 1][
                craftsPriceType
              ]
            : 0) *
            profit.crafts.quantity *
            0.95
        )
      : 0) - profit.cost.auctionSum[costPriceType]
  );
}
