import ProfitDom from "./components/profit";
import {
  AuctionInfo,
  DataInfo,
  RecipeInfos,
  ItemInfos,
  RecipeInfo,
  RecipeItem,
  ItemInfo,
  PriceType,
  AuctionItem,
} from "./types";
import { getJson, NeverNull, NeverUndefined } from "./utils";
import Update from "./components/update";
import { API_URL, GENERATED_CONNECTED_REALM_ID } from "./constants";
import Filters from "./components/filters";
import Settings from "./components/settings";
import History from "./components/history";

type AuctionInfos = { [id: number]: AuctionItem[] | undefined };

export type CostInfo = {
  item?: ItemInfo;
  auctions: AuctionItem[];
  quantity: number;
};

function findCostInfo(
  crafts: RecipeItem,
  items: ItemInfos,
  auctions: AuctionInfos
): CostInfo {
  const item = items[crafts.id];
  const auctionData = auctions[crafts.id] || [];
  return {
    item,
    auctions: auctionData,
    quantity: crafts.quantity,
  };
}

export type AuctionSum = {
  lowest: number;
  farOut: number;
  outlier: number;
  mean: number;
  firstQuartile: number;
  secondQuartile: number;
  thirdQuartile: number;
};

type Cost = {
  auctionSum: AuctionSum;
  reagents: CostInfo[];
  unknown: CostInfo[];
};

function calculateCost(
  costInfo: CostInfo,
  quantity: number,
  priceType: PriceType
) {
  const auctions = costInfo.auctions.length;
  return (
    ((costInfo.item ? costInfo.item.price : 0) ||
      (auctions > 0 ? costInfo.auctions[auctions - 1][priceType] : 0)) *
    quantity
  );
}

function findCost(
  recipe: RecipeInfo,
  items: ItemInfos,
  auctions: AuctionInfos
) {
  return recipe.reagents.reduce(
    (object: Cost, reagent) => {
      const costInfo = findCostInfo(reagent, items, auctions);
      const lowestCost = calculateCost(costInfo, reagent.quantity, "lowest");
      const farOutCost = calculateCost(costInfo, reagent.quantity, "farOut");
      const outlierCost = calculateCost(costInfo, reagent.quantity, "outlier");
      const meanCost = calculateCost(costInfo, reagent.quantity, "mean");
      const firstQuartileCost = calculateCost(
        costInfo,
        reagent.quantity,
        "firstQuartile"
      );
      const secondQuartileCost = calculateCost(
        costInfo,
        reagent.quantity,
        "secondQuartile"
      );
      const thirdQuartileCost = calculateCost(
        costInfo,
        reagent.quantity,
        "thirdQuartile"
      );
      object.reagents.push(costInfo);
      if (lowestCost) {
        object.auctionSum.lowest += lowestCost;
        object.auctionSum.farOut += farOutCost;
        object.auctionSum.outlier += outlierCost;
        object.auctionSum.mean += meanCost;
        object.auctionSum.firstQuartile += firstQuartileCost;
        object.auctionSum.secondQuartile += secondQuartileCost;
        object.auctionSum.thirdQuartile += thirdQuartileCost;
      } else {
        object.unknown.push(costInfo);
      }
      return object;
    },
    {
      auctionSum: {
        lowest: 0,
        farOut: 0,
        outlier: 0,
        mean: 0,
        firstQuartile: 0,
        secondQuartile: 0,
        thirdQuartile: 0,
      },
      reagents: [],
      unknown: [],
    }
  );
}

export type Profit = {
  id: number;
  name: string;
  icon: string;
  profession: string;
  crafts?: CostInfo;
  cost: Cost;
};

export function auctionProfit(
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

function calculateProfit(
  id: number,
  recipe: RecipeInfo,
  items: ItemInfos,
  auctions: AuctionInfos
): Profit {
  const crafts = recipe.crafts
    ? findCostInfo(recipe.crafts, items, auctions)
    : undefined;
  return {
    id,
    name: recipe.name,
    icon: recipe.icon,
    profession: recipe.profession,
    crafts,
    cost: findCost(recipe, items, auctions),
  };
}

function calculateProfits(
  recipes: RecipeInfos,
  items: ItemInfos,
  auctionsArray: AuctionInfo,
  craftsPriceType: PriceType,
  costPriceType: PriceType
) {
  // Convert from an array to help with lookups
  const auctions: AuctionInfos = auctionsArray.auctions.reduce(
    (object: AuctionInfos, auction) => {
      const itemInfo = object[auction.id];
      if (itemInfo) {
        // Auctions are sorted by date on the server
        itemInfo.push(auction);
      } else {
        object[auction.id] = [auction];
      }
      return object;
    },
    {}
  );
  const profits: Profit[] = [];

  for (const key in recipes) {
    const recipe = NeverUndefined(recipes[key]);
    profits.push(calculateProfit(Number(key), recipe, items, auctions));
  }

  // Sort by: number of unknowns, profit, id
  profits.sort((a, b) => {
    let diff = a.cost.unknown.length - b.cost.unknown.length;
    if (diff) {
      return diff;
    }
    const profitA = auctionProfit(a, craftsPriceType, costPriceType);
    const profitB = auctionProfit(b, craftsPriceType, costPriceType);
    diff = profitB - profitA;
    if (diff) {
      return diff;
    }
    return a.id - b.id;
  });
  return profits;
}

export type DomData = {
  profit: Profit;
  dom: ProfitDom;
};

export class CraftingProfit {
  private readonly domData: DomData[] = [];

  private readonly settings = new Settings(this);

  private readonly filters = new Filters(this.domData);

  private readonly update = new Update(this, this.settings);

  updateData() {
    const self = this;
    (async function () {
      try {
        const apiUrl = API_URL;
        const auctions = (await getJson(
          `${apiUrl}/api/auctions/${GENERATED_CONNECTED_REALM_ID}`
        )) as AuctionInfo;
        const data = (await getJson(`${apiUrl}/api/data`)) as DataInfo;
        const craftsPriceType: PriceType = self.settings.getCraftsPriceType();
        const costPriceType: PriceType = self.settings.getCostPriceType();
        const profits = calculateProfits(
          data.recipes,
          data.items,
          auctions,
          craftsPriceType,
          costPriceType
        );
        self.update.success(new Date(auctions.lastModified));
        self.updateRecipes(profits);
        self.filters.apply();
      } catch (error) {
        console.error("Failed to get data", error);
        self.update.error();
      }
      self.update.done();
    })();
  }

  private updateRecipes(profits: Profit[]) {
    History.hide();
    const recipesBody = NeverNull(document.getElementById("recipes"));

    while (recipesBody.lastChild) {
      recipesBody.removeChild(recipesBody.lastChild);
    }
    while (this.domData.length > profits.length) {
      this.domData.pop();
    }
    for (let i = 0; i < profits.length; i += 1) {
      if (this.domData.length <= i) {
        this.domData.push({
          profit: profits[i],
          dom: new ProfitDom(),
        });
      } else {
        this.domData[i].profit = profits[i];
      }
    }

    const fragment = document.createDocumentFragment();

    const craftsPriceType = this.settings.getCraftsPriceType();
    const costPriceType = this.settings.getCostPriceType();
    for (const i of this.domData) {
      i.dom.update(i.profit, craftsPriceType, costPriceType);
      fragment.appendChild(i.dom.element);
    }
    recipesBody.appendChild(fragment);
  }
}

const craftingProfit = new CraftingProfit();
craftingProfit.updateData();
