import { Chart, ChartTooltipItem, ChartData } from "chart.js"
import { ItemInfo } from "./item"
import { NeverUndefined, NeverNull } from "../utils"
import { formatMoney } from "./money"

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

    const lowestPriceData = item.auctionPrices.map(value => {
      return {
        x: value.date,
        y: value.lowestPrice
      }
    })
    const firstQuartileData = item.auctionPrices.map(value => {
      return {
        x: value.date,
        y: value.firstQuartile
      }
    })
    const secondQuartileData = item.auctionPrices.map(value => {
      return {
        x: value.date,
        y: value.secondQuartile
      }
    })
    const quantityData = item.auctionPrices.map(value => {
      return {
        x: value.date,
        y: value.quantity
      }
    })

    if (History.chart) {
      History.chart.destroy()
    }

    const pointHitRadius = 5
    History.chart = new Chart(History.canvas, {
      type: "line",
      data: {
        datasets: [{
          label: "Lowest",
          data: lowestPriceData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "#3e95cd",
          backgroundColor: "#3e95cd"
        }, {
          label: "First quartile",
          data: firstQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "#8e5ea2",
          backgroundColor: "#8e5ea2"
        }, {
          label: "Second quartile",
          data: secondQuartileData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-gold",
          borderColor: "#3cba9f",
          backgroundColor: "#3cba9f"
        }, {
          label: "Quantity",
          data: quantityData,
          lineTension: 0,
          pointHitRadius: pointHitRadius,
          yAxisID: "y-axis-quantity",
          borderColor: "#c45850",
          backgroundColor: "#c45850"
        }]
      },
      options: {
        animation: {
          duration: 0
        },
        elements: {
          line: {
            fill: false
          }
        },
        legend: {
          display: false
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