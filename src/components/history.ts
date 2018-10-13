import { Chart, ChartTooltipItem, ChartData } from "chart.js"
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

    const quantityHidden = false
    const lowestHidden = false
    const farOutHidden = false
    const outlierHidden = true
    const meanHidden = true
    const firstQuartileHidden = false
    const secondQuartileHidden = true
    const thirdQuartileHidden = true

    if (History.chart) {
      History.chart.destroy()
    }

    const pointHitRadius = 5
    History.chart = new Chart(History.canvas, {
      type: "line",
      data: {
        datasets: [{
          label: "Quantity",
          data: quantityData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-quantity",
          borderColor: "rgb(255, 0, 41)",
          backgroundColor: "rgba(255, 0, 41, 0.3)",
          fill: false,
          hidden: quantityHidden
        }, {
          label: "Lowest",
          data: lowestData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(55, 126, 184)",
          backgroundColor: "rgba(55, 126, 184, 0.3)",
          hidden: lowestHidden
        }, {
          label: "Far out",
          data: farOutData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(102, 166, 30)",
          backgroundColor: "rgba(102, 166, 30, 0.3)",
          hidden: farOutHidden
        }, {
          label: "Outlier",
          data: outlierData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(152, 78, 163)",
          backgroundColor: "rgba(152, 78, 163, 0.3)",
          hidden: outlierHidden
        }, {
          label: "Mean",
          data: meanData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(0, 210, 213)",
          backgroundColor: "rgba(0, 210, 213, 0.3)",
          hidden: meanHidden
        }, {
          label: "First quartile",
          data: firstQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(255, 127, 0)",
          backgroundColor: "rgba(255, 127, 0, 0.3)",
          hidden: firstQuartileHidden
        }, {
          label: "Second quartile",
          data: secondQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "rgb(175, 141, 0)",
          backgroundColor: "rgba(175, 141, 0, 0.3)",
          hidden: secondQuartileHidden
        }, {
          label: "Third quartile",
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
          display: true
        },
        scales: {
          xAxes: [{
            type: "time",
            time: {
              unit: "hour",
              displayFormats: {
                hour: "MMM D HH:mm"
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
              callback: (value) => {
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
            }
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