// @flow
import { Template } from 'meteor/templating'
import { ReactivePromise } from 'meteor/deanius:promise'

import Chart from 'chart.js'
import StockWatcher from '/client/lib/ethereum/stocks'
import { Stock } from '/client/lib/ethereum/contracts'
import Identity from '/client/lib/identity'

const Stocks = StockWatcher.Stocks

const tmpl = Template.Module_Ownership_Charts

const strToColor = (str) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF
    color += (`00${value.toString(16)}`).substr(-2)
  }
  return color
}

const drawChart = (ctx, title, labels, data, colors) => {
  const chartData = {
    labels,
    datasets: [{ data, backgroundColor: colors || labels.map(strToColor) }],
  }

  new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: { responsive: true, title: { display: true, text: title } },
  })
}

tmpl.onRendered(function () {
  this.autorun(async () => {
    const stocks = Stocks.find({}).fetch()
    drawChart(this.$('#stockChart'), 'Stock types', stocks.map(s => s.symbol), stocks.map(s => s.totalSupply))

    const allShares = await StockWatcher.allShareholders(stocks)
    const globalBalances = {}
    const votingPower = {}

    for (const shareId in allShares) {
      const stock = stocks[shareId]
      const stockContract = Stock.at(stock.address)
      const shareShareholders = allShares[shareId].map(a => a.shareholder)
      const balancePromises = shareShareholders
              .map(a => stockContract.balanceOf(a).then(x => x.toNumber()))
      const balances = await Promise.all(balancePromises)

      for (const i in shareShareholders) {
        const entity = await Identity.get(shareShareholders[i])
        globalBalances[entity.name] = balances[i] + (globalBalances[entity.name] || 0)
        if (stock.votesPerShare) {
          votingPower[entity.name] =
            (stock.votesPerShare * balances[i]) + (votingPower[entity.name] || 0)
        }
      }
    }

    drawChart(this.$('#capitalChart'), 'Global shareholder stake', Object.keys(globalBalances), Object.values(globalBalances))
    drawChart(this.$('#votingChart'), 'Voting stake', Object.keys(votingPower), Object.values(votingPower))
  })
})

tmpl.helpers({
  totalBalance: ReactivePromise(() => {
    const stocksArr = []
    Stocks.find().forEach((item) => (
      stocksArr.push(Stock.at(item.address).balanceOf(Identity.current().ethereumAddress))
    ))
    return Promise.all(stocksArr).then(stocks => {
      const totalStock: number = stocks.map(s => s.toNumber()).reduce((a, b) => a + b, 0)
      return totalStock
    })
  }),
})
