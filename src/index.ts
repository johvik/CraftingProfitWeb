import auctionProfit from "./auctionProfit";
import Filters from "./components/filters";
import History from "./components/history";
import { DomData, ProfitDom } from "./components/profit";
import Settings from "./components/settings";
import Update from "./components/update";
import { API_URL, GENERATED_CONNECTED_REALM_ID } from "./constants";
import {
  AuctionInfo,
  AuctionItem,
  ConnectedRealms,
  Cost,
  CostInfo,
  CraftingProfitInterface,
  DataInfo,
  ItemInfo,
  PriceType,
  Profit,
  RecipeInfo,
  RecipeItem,
} from "./types";
import { getJson, NeverNull } from "./utils";

function findCostInfo(
  crafts: RecipeItem,
  items: Map<number, ItemInfo>,
  auctions: Map<number, AuctionItem[]>
): CostInfo {
  const item = items.get(crafts.id);
  const auctionData = auctions.get(crafts.id) || [];
  return {
    item,
    auctions: auctionData,
    quantity: crafts.quantity,
  };
}

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
  items: Map<number, ItemInfo>,
  auctions: Map<number, AuctionItem[]>
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

function calculateProfit(
  id: number,
  recipe: RecipeInfo,
  items: Map<number, ItemInfo>,
  auctions: Map<number, AuctionItem[]>
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
  recipes: Map<number, RecipeInfo>,
  items: Map<number, ItemInfo>,
  auctionsArray: AuctionInfo,
  craftsPriceType: PriceType,
  costPriceType: PriceType
) {
  // Convert from an array to help with lookups
  const auctions = new Map<number, AuctionItem[]>();
  auctionsArray.auctions.forEach((auction) => {
    const itemInfo = auctions.get(auction.id);
    if (itemInfo) {
      // Auctions are sorted by date on the server
      itemInfo.push(auction);
    } else {
      auctions.set(auction.id, [auction]);
    }
  });
  const profits = [...recipes].map(([key, recipe]) =>
    calculateProfit(key, recipe, items, auctions)
  );

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

export default class CraftingProfit implements CraftingProfitInterface {
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
        const connectedRealms = (await getJson(
          `${apiUrl}/api/connectedRealms/${GENERATED_CONNECTED_REALM_ID}`
        )) as ConnectedRealms;
        const items = new Map(data.items);
        const recipes = new Map(data.recipes);
        const craftsPriceType: PriceType = self.settings.getCraftsPriceType();
        const costPriceType: PriceType = self.settings.getCostPriceType();
        const profits = calculateProfits(
          recipes,
          items,
          auctions,
          craftsPriceType,
          costPriceType
        );
        self.update.success(new Date(auctions.lastModified));
        self.updateRecipes(profits);
        CraftingProfit.updateConnectedRealms(connectedRealms);
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
    profits.forEach((profit, i) => {
      if (this.domData.length <= i) {
        this.domData.push({
          profit,
          dom: new ProfitDom(),
        });
      } else {
        this.domData[i].profit = profit;
      }
    });

    const fragment = document.createDocumentFragment();

    const craftsPriceType = this.settings.getCraftsPriceType();
    const costPriceType = this.settings.getCostPriceType();
    this.domData.forEach((i) => {
      i.dom.update(i.profit, craftsPriceType, costPriceType);
      fragment.appendChild(i.dom.element);
    });
    recipesBody.appendChild(fragment);
  }

  private static updateConnectedRealms(connectedRealms: ConnectedRealms) {
    connectedRealms.sort();

    const element = NeverNull(document.getElementById("connected-realms"));
    if (connectedRealms.length !== 0) {
      const [firstRealm] = connectedRealms.splice(0, 1);

      // Do not display the title if there are no reaming elements in the array
      if (connectedRealms.length !== 0) {
        element.title = connectedRealms.join("\n");
      } else {
        element.removeAttribute("title");
      }
      element.textContent = firstRealm;
    } else {
      element.removeAttribute("title");
      element.textContent = "";
    }
  }
}

const craftingProfit = new CraftingProfit();
craftingProfit.updateData();
