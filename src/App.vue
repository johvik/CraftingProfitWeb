<template>
  <div id="app">
    <ul>
      <li>
        <input id="filter_toggle" type="checkbox" :checked="selectedFilters.length > 0" @click="toggleAll()">
        <label for="filter_toggle">Select all</label>
      </li>
      <li v-for="value in filterOptions" :key="value.key">
        <input :id="'filter_' + value.key" type="checkbox" v-model="selectedFilters" :value="value.key" :key="value.key">
        <label :for="'filter_' + value.key">{{ value.text }}</label>
      </li>
    </ul>
    <input v-model="filterSearch" placeholder="Recipe name">
    <table>
      <thead>
        <tr>
          <th>Recipe</th>
          <th>Crafts</th>
          <th>Reagents</th>
          <th>Profit</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="profit in filteredProfits" :key="profit.recipe.id">
          <td>{{ profit.recipe.name }} <span v-if="profit.recipe.rank != 0">(Rank {{ profit.recipe.rank }})</span></td>
          <td>
            <item :item="profit.recipe.crafts"></item>
          </td>
          <td>
            <span v-for="reagent in profit.recipe.reagents" :key="reagent.id">
              <item :item="reagent"></item>
            </span>
          </td>
          <td>
            <profit :profit="profit"></profit>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import axios from "axios";
import item from "./components/Item";
import money from "./components/Money";
import profit from "./components/Profit";

function findVendorPrice(id, items) {
  const item = items[id];
  if (item) {
    return item.price;
  }
  return 0;
}

function findAuctionPrice(id, auctions) {
  const auction = auctions[id];
  if (auction) {
    return auction.lowestPrice;
  }
  return 0;
}

function findVendorOrAuctionPrice(id, items, auctions) {
  return findVendorPrice(id, items) || findAuctionPrice(id, auctions);
}

function findCost(recipe, items, auctions) {
  return recipe.reagents.reduce(
    (object, reagent) => {
      const cost =
        findVendorOrAuctionPrice(reagent.id, items, auctions) *
        reagent.quantity;
      if (cost) {
        object.cost += cost;
      } else {
        object.unknown.push(reagent);
      }
      return object;
    },
    {
      cost: 0,
      unknown: []
    }
  );
}

function calculateProfit(recipe, items, auctions) {
  return {
    auctionPrice:
      findAuctionPrice(recipe.crafts.id, auctions) * recipe.crafts.quantity,
    cost: findCost(recipe, items, auctions),
    recipe: recipe
  };
}

function calculateProfits(recipes, items, auctionsArray) {
  // Convert from an array to help with lookups
  const auctions = auctionsArray.auctions.reduce((object, auction) => {
    object[auction.id] = auction;
    delete auction.id;
    return object;
  }, {});
  const profits = [];

  for (const key in recipes) {
    const recipe = recipes[key].recipe;
    if (recipe) {
      recipe.id = key;
      profits.push(calculateProfit(recipe, items, auctions));
    }
  }

  // Sort by: number of unknowns, profit, id
  profits.sort((a, b) => {
    let diff = a.cost.unknown.length - b.cost.unknown.length;
    if (diff) {
      return diff;
    }
    const profitA = a.auctionPrice - a.cost.cost;
    const profitB = b.auctionPrice - b.cost.cost;
    diff = profitB - profitA;
    if (diff) {
      return diff;
    }
    return a.recipe.id - b.recipe.id;
  });
  return profits;
}

function calculateFilterOptions(recipes) {
  const options = {};

  for (const key in recipes) {
    const recipe = recipes[key].recipe;
    if (recipe) {
      const key = recipe.trade;
      if (!options[key]) {
        const match = key.toLowerCase().match(/[a-z]+_(.+)/);
        if (match) {
          options[key] = match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
      }
    }
  }

  const array = [];
  for (const key in options) {
    const text = options[key];
    array.push({ key: key, text: text });
  }
  return array.sort();
}

export default {
  name: "app",
  components: {
    item,
    money,
    profit
  },
  computed: {
    filteredProfits() {
      return this.profits.filter(x => {
        return (
          x.recipe.name.search(new RegExp(this.filterSearch, "i")) != -1 &&
          this.selectedFilters.some(f => {
            return f == x.recipe.trade;
          })
        );
      });
    }
  },
  data() {
    return {
      profits: [],
      selectedFilters: [],
      filterOptions: [],
      filterSearch: ""
    };
  },
  methods: {
    toggleAll() {
      if (this.selectedFilters.length > 0) {
        this.selectedFilters = [];
      } else {
        const selectedFilters = [];
        for (const i of this.filterOptions) {
          selectedFilters.push(i.key);
        }
        this.selectedFilters = selectedFilters;
      }
    }
  },
  mounted() {
    const baseUrl =
      process.env.NODE_ENV === "production" ? "" : "https://localhost:3000";
    Promise.all([
      axios.get(baseUrl + "/auctions/1"),
      axios.get(baseUrl + "/items"),
      axios.get(baseUrl + "/recipes")
    ])
      .then(values => {
        const auctions = values[0].data;
        const items = values[1].data;
        const recipes = values[2].data;
        this.selectedFilters = [];
        this.filterOptions = calculateFilterOptions(recipes);
        this.profits = calculateProfits(recipes, items, auctions);
      })
      .catch(error => console.error(error));
  },
  updated() {
    if (WH.getLocaleFromDomain) {
      $WowheadPower.refreshLinks();
      // TODO Try to get this to work $WowheadPower.triggerTooltip(this.$el.firstElementChild);
    }
  }
};
</script>
