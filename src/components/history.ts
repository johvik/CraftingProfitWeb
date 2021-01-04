import { Chart, ChartTooltipItem, ChartData, ChartLegendLabelItem } from "chart.js"
import { ItemInfo } from "./item"
import { NeverUndefined, NeverNull } from "../utils"
import { formatMoney } from "./money"
import { AuctionItem, PriceType } from "../types"

function toPoints(auctions: AuctionItem[], priceType: PriceType) {
  return auctions.map(value => {
    return {
      x: value.lastUpdate,
      y: value[priceType]
    }
  })
}

function isHidden(label: string, defaultValue: boolean): boolean {
  const settings = localStorage.getItem(`chart.${label}`)
  if (settings) {
    return JSON.parse(settings)
  }
  return defaultValue
}

function saveHidden(label: string, hidden: boolean) {
  localStorage.setItem(`chart.${label}`, JSON.stringify(hidden))
}

export class History {
  private static readonly container = NeverNull(document.getElementById("history-container"))
  private static readonly axisStyle = window.getComputedStyle(NeverNull(document.getElementById("history-axis-style")))
  private static readonly tooltipStyle = window.getComputedStyle(NeverNull(document.getElementById("history-tooltip-style")))
  private static readonly title = NeverNull(document.getElementById("history-title"))
  private static readonly canvas = document.getElementById("history-canvas") as HTMLCanvasElement
  private static lastCaller: HTMLElement | undefined = undefined
  private static chart: Chart | undefined

  static show(item: ItemInfo, caller: HTMLElement) {
    if (caller === History.lastCaller) {
      return History.hide()
    }
    History.lastCaller = caller

    const quantityData = item.auctions.map(value => {
      return {
        x: value.lastUpdate,
        y: value.quantity
      }
    })
    const lowestData = toPoints(item.auctions, "lowest")
    const farOutData = toPoints(item.auctions, "farOut")
    const outlierData = toPoints(item.auctions, "outlier")
    const meanData = toPoints(item.auctions, "mean")
    const firstQuartileData = toPoints(item.auctions, "firstQuartile")
    const secondQuartileData = toPoints(item.auctions, "secondQuartile")
    const thirdQuartileData = toPoints(item.auctions, "thirdQuartile")

    const quantityLabel = "Quantity"
    const lowestLabel = "Lowest"
    const farOutLabel = "Far out"
    const outlierLabel = "Outlier"
    const meanLabel = "Mean"
    const firstQuartileLabel = "First quartile"
    const secondQuartileLabel = "Second quartile"
    const thirdQuartileLabel = "Third quartile"

    const quantityHidden = isHidden(quantityLabel, false)
    const lowestHidden = isHidden(lowestLabel, false)
    const farOutHidden = isHidden(farOutLabel, false)
    const outlierHidden = isHidden(outlierLabel, true)
    const meanHidden = isHidden(meanLabel, true)
    const firstQuartileHidden = isHidden(firstQuartileLabel, false)
    const secondQuartileHidden = isHidden(secondQuartileLabel, true)
    const thirdQuartileHidden = isHidden(thirdQuartileLabel, true)

    if (History.chart) {
      History.chart.destroy()
    }

    const pointHitRadius = 5
    const chart = History.chart = new Chart(History.canvas, {
      type: "line",
      data: {
        datasets: [{
          label: quantityLabel,
          data: quantityData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-quantity",
          borderColor: "rgb(255, 0, 41)",
          backgroundColor: "rgba(255, 0, 41, 0.3)",
          fill: false,
          hidden: quantityHidden
        }, {
          label: lowestLabel,
          data: lowestData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(55, 126, 184)",
          backgroundColor: "rgba(55, 126, 184, 0.3)",
          hidden: lowestHidden
        }, {
          label: farOutLabel,
          data: farOutData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(102, 166, 30)",
          backgroundColor: "rgba(102, 166, 30, 0.3)",
          hidden: farOutHidden
        }, {
          label: outlierLabel,
          data: outlierData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(152, 78, 163)",
          backgroundColor: "rgba(152, 78, 163, 0.3)",
          hidden: outlierHidden
        }, {
          label: meanLabel,
          data: meanData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(0, 210, 213)",
          backgroundColor: "rgba(0, 210, 213, 0.3)",
          hidden: meanHidden
        }, {
          label: firstQuartileLabel,
          data: firstQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(255, 127, 0)",
          backgroundColor: "rgba(255, 127, 0, 0.3)",
          hidden: firstQuartileHidden
        }, {
          label: secondQuartileLabel,
          data: secondQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(175, 141, 0)",
          backgroundColor: "rgba(175, 141, 0, 0.3)",
          hidden: secondQuartileHidden
        }, {
          label: thirdQuartileLabel,
          data: thirdQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(127, 128, 205)",
          backgroundColor: "rgba(127, 128, 205, 0.3)",
          hidden: thirdQuartileHidden
        }]
      },
      options: {
        animation: {
          duration: 0
        },
        legend: {
          display: true,
          onClick: (event: MouseEvent, legendItem: ChartLegendLabelItem) => {
            if (legendItem.text === quantityLabel) {
              const quantityAxis = NeverUndefined(NeverUndefined(NeverUndefined(chart.config.options).scales).yAxes)[1]
              quantityAxis.display = !quantityAxis.display
            }
            const onClick = NeverUndefined(NeverUndefined(Chart.defaults.global.legend).onClick)
            onClick.call(this, event, legendItem)
            if (legendItem.text !== undefined && legendItem.datasetIndex !== undefined) {
              const metaHidden = chart.getDatasetMeta(legendItem.datasetIndex).hidden
              const hidden = (metaHidden === null ? NeverUndefined(chart.data.datasets)[legendItem.datasetIndex].hidden : metaHidden) || false
              saveHidden(legendItem.text, hidden)
            }
          },
          labels: {
            fontColor: History.axisStyle.color || undefined,
            fontFamily: History.axisStyle.fontFamily || undefined,
            fontStyle: History.axisStyle.fontStyle || undefined
          }
        },
        scales: {
          xAxes: [{
            type: "time",
            time: {
              unit: "day",
              displayFormats: {
                day: "MMM D"
              },
              tooltipFormat: "dddd, MMMM D HH:mm",
            },
            ticks: {
              fontColor: History.axisStyle.color || undefined,
              fontFamily: History.axisStyle.fontFamily || undefined,
              fontStyle: History.axisStyle.fontStyle || undefined
            }
          }],
          yAxes: [{
            id: "y-axis-gold",
            ticks: {
              callback: (value: number) => {
                return `${value / 10000}g`
              },
              fontColor: History.axisStyle.color || undefined,
              fontFamily: History.axisStyle.fontFamily || undefined,
              fontStyle: History.axisStyle.fontStyle || undefined
            }
          }, {
            id: "y-axis-quantity",
            position: "right",
            gridLines: {
              drawOnChartArea: false
            },
            ticks: {
              fontColor: History.axisStyle.color || undefined,
              fontFamily: History.axisStyle.fontFamily || undefined,
              fontStyle: History.axisStyle.fontStyle || undefined
            },
            display: !quantityHidden
          }]
        },
        tooltips: {
          backgroundColor: History.tooltipStyle.backgroundColor || undefined,
          bodyFontColor: History.tooltipStyle.color || undefined,
          bodyFontFamily: History.tooltipStyle.fontFamily || undefined,
          bodyFontStyle: History.tooltipStyle.fontStyle || undefined,
          footerFontColor: History.tooltipStyle.color || undefined,
          footerFontFamily: History.tooltipStyle.fontFamily || undefined,
          footerFontStyle: History.tooltipStyle.fontStyle || undefined,
          titleFontColor: History.tooltipStyle.color || undefined,
          titleFontFamily: History.tooltipStyle.fontFamily || undefined,
          titleFontStyle: History.tooltipStyle.fontStyle || undefined,
          mode: "x",
          callbacks: {
            labelColor: (tooltipItem: ChartTooltipItem, chart: Chart) => {
              const dataset = NeverUndefined(chart.data.datasets)[NeverUndefined(tooltipItem.datasetIndex)]
              const color = dataset.borderColor as string
              return {
                borderColor: color,
                backgroundColor: color
              }
            },
            label: (tooltipItem: ChartTooltipItem, data: ChartData) => {
              const dataset = NeverUndefined(data.datasets)[NeverUndefined(tooltipItem.datasetIndex)]
              let label = dataset.label || ""
              if (label) {
                label += ": "
              }
              if (dataset.yAxisID === "y-axis-quantity") {
                label += tooltipItem.yLabel
              } else {
                label += formatMoney(Number(tooltipItem.yLabel))
              }
              return label
            }
          }
        }
      }
    })

    History.title.textContent = item.name || ""
    History.container.style.display = ""

    const oldParents = document.querySelectorAll(".parent")
    for (const i of oldParents) {
      i.classList.remove("parent")
    }
    // Insert directly below the row of the caller
    const parent = History.findParentRow(caller)
    if (parent && parent.parentElement) {
      parent.classList.add("parent")
      const table = parent.parentElement
      if (parent.classList.contains("last-row")) {
        History.container.classList.add("last-row")
      } else {
        History.container.classList.remove("last-row")
      }
      table.insertBefore(History.container, parent.nextElementSibling)
    }
  }

  static findParentRow(element: HTMLElement) {
    let parent = element.parentElement
    while (parent && parent.tagName.toLowerCase() !== "tr") {
      parent = parent.parentElement
    }
    return parent
  }

  static hide() {
    const oldParents = document.querySelectorAll(".parent")
    for (const i of oldParents) {
      i.classList.remove("parent")
    }
    History.container.remove()
    History.lastCaller = undefined
    History.container.style.display = "none"
  }
}