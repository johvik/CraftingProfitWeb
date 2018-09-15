function formatMoney(copper) {
    const gold = Math.floor(copper / 10000);
    copper -= gold * 10000;
    const silver = Math.floor(copper / 100);
    copper -= silver * 100;
    return gold + "g " + silver + "s " + copper + "c";
}

export default {
    functional: true,
    props: {
        copper: Number
    },
    render(createElement, context) {
        return createElement("span", formatMoney(context.props.copper));
    }
}
