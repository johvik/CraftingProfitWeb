<template functional>
  <span>
    <span v-if="props.item.quantity > 1">{{ props.item.quantity }}x</span>
    <a :href="'https://www.wowhead.com/item=' + props.item.id"></a>
  </span>
</template>

<script>
export default {
  name: "item",
  props: {
    item: Object
  }
};
</script>

<style scoped>
span > a:empty {
  height: 36px;
  width: 36px;
  display: inline-block;
  background-image: url("https://wow.zamimg.com/images/wow/icons/medium/inv_misc_questionmark.jpg");
  /*background-image: url("https://wow.zamimg.com/images/Icon/medium/border/default.png");*/
}
</style>
