'use strict'

import { HorizontalBar, mixins } from 'vue-chartjs'
const { reactiveProp } = mixins

export default {
  codit: true,
  name: 'ChartBarHorizontal',
  extends: HorizontalBar,
  mixins: [reactiveProp],
  props: {
    percentage: { default: -1 }, // If >0, then the percentage for each bar is displayed as well
    dataAppendStr: { default: '' }, // String to be appended after the data label,
    stackedBelongingTogether: { default: 1 }, // Number of datasets per row, defaults to one (if more, then only the sum will be displayed on the right),
    tooltipFooter: { default: '', type: String },
    hoverPointer: { default: false, type: Boolean }
  },
  data () {
    return {
      options: {
        responsive: true,
        layout: { padding: { right: 40 } },
        maintainAspectRatio: false,
        scales: {
          yAxes: [{ stacked: true }],
          xAxes: [{
            stacked: true
          }]
        },
        onClick: ($event, chartEls) => {
          let emitval = []
          chartEls.forEach(c => {
            // The default emitval is the _model attribute
            let r = c._model
            // If the dataset element has a "refs" attribute, pass that back as well
            let ds = this.chartData.datasets[c._datasetIndex]
            if ('refs' in ds) r.ref = ds.refs[c._index]
            emitval.push(r)
          })
          this.$emit('click', $event, emitval)
        },
        hover: {
          onHover: ($e) => {
            // Set the cursor to pointer if the respective prop is set
            if (!this.hoverPointer) return
            let point = this._chart.getElementAtEvent($e)
            if (point.length) $e.target.style.cursor = 'pointer'
            else $e.target.style.cursor = 'default'
          }
        },
        legend: {
          labels: {
            filter (legendItem, chartData) {
              // filter legend items based on the text they contain and a possible hiding flag
              return !!legendItem.text.length && !chartData.datasets[legendItem.datasetIndex].noLegend
            }
          }
        },
        tooltips: {
          callbacks: {
            labelColor: (tooltipItem, chartData) => {
              let item = this.chartData.datasets[tooltipItem.datasetIndex]
              return {
                borderColor: '#FFF',
                backgroundColor: item.tooltipColor ? item.tooltipColor : item.hoverBackgroundColor
              }
            },
            label: (tooltipItem, data) => {
              let item = data.datasets[tooltipItem.datasetIndex]
              let label = item.label || ''
              if (label) label += ': '
              // If the dataset items are stacked together, we need the sum of all of them
              let idxOfStacked = tooltipItem.datasetIndex % this.stackedBelongingTogether
              let firstIdxOfStack = tooltipItem.datasetIndex - idxOfStacked
              let val = 0
              for (let k = firstIdxOfStack; k < (firstIdxOfStack + this.stackedBelongingTogether); k++) {
                val += data.datasets[k].data[tooltipItem.index]
              }
              label += Math.round(val)
              return label
            },

            footer: () => {
              return this.tooltipFooter
            }

          },

          footerFontStyle: 'italic'
        },
        animation: {
          onComplete: v => {
            let chartInstance = this._chart
            let ctx = chartInstance.ctx
            ctx.textAlign = 'left'
            ctx.textBaseline = 'bottom'
            // Draw behind everything else
            ctx.globalCompositeOperation = 'destination-over'

            this.chartData.datasets.forEach((dataset, i) => {
              // For the stacked datasets, only draw the summary for the last element
              if ((i + 1) % this.stackedBelongingTogether !== 0) return
              let idxOfStacked = i % this.stackedBelongingTogether
              let firstIdxOfStack = i - idxOfStacked
              var meta = chartInstance.controller.getDatasetMeta(i)
              meta.data.forEach((bar, index) => {
                // If the dataset items are stacked together, we need the sum of all of them
                let data = 0
                for (let k = firstIdxOfStack; k < (firstIdxOfStack + this.stackedBelongingTogether); k++) {
                  data += this.chartData.datasets[k].data[index]
                }
                // var data = dataset.data[index]
                if (data !== 0) {
                  let txt = String(data) + this.dataAppendStr + (this.percentage > 0 ? ' (' + String(Math.round(100 * data / this.percentage)) + '%)' : '')
                  ctx.fillText(txt, bar._model.x + 10, bar._model.y + 8)
                }
              })
            })
            // Reset to default drawing behaviour
            ctx.globalCompositeOperation = 'source-over'
          }
        }
      }
    }
  },
  mounted () {
    if (this.percentage !== -1) this.options.layout.padding.right += 20
    this.renderChart(this.chartData, this.options)
  }
}
