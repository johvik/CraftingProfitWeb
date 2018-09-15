<template functional>
  <span>
    <item v-if="!props.profit.auctionPrice" :item="props.profit.recipe.crafts"></item>
    <span v-if="props.profit.auctionPrice || props.profit.cost.cost"><money :copper="props.profit.auctionPrice - props.profit.cost.cost"></money></span>
    <span v-for="unknown in props.profit.cost.unknown" :key="unknown.id">
      - <item :item="unknown"></item>
    </span>
  </span>
</template>

<script>
export default {
  name: "profit",
  props: {
    profit: Object
  }
};
</script>
