const Koa = require('koa')
const app = new Koa()
const axios = require('axios').default

const prometheus = require('prom-client')
const PrometheusRegistry = prometheus.Registry
const registry = new PrometheusRegistry()

const PREFIX = `go_vote_api_`
const pollingInterval = process.env.POLLING_INTERVAL_MS || 5000
registry.setDefaultLabels({ service: 'go_vote_api', hostname: process.env.POD_NAME || process.env.HOSTNAME || 'unknown' })

// METRICS START

const totalScrapesCounter = new prometheus.Counter({
  name: `${PREFIX}total_scrapes`,
  help: 'Number of times the service has been scraped for metrics'
})
registry.registerMetric(totalScrapesCounter)

const scrapeResponseTime = new prometheus.Summary({
  name: `${PREFIX}scrape_response_time`,
  help: 'Response time of the scraped service in ms'
})
registry.registerMetric(scrapeResponseTime)

const localResponseTime = new prometheus.Summary({
  name: `${PREFIX}exporter_response_time`,
  help: 'Response time of the exporter in ms'
})
registry.registerMetric(localResponseTime)

const totalVotes = new prometheus.Gauge({
  name: `${PREFIX}total_votes`,
  help: 'Total number of votes computed until now',
  async collect () {
    const total = await scrapeApplication()
    this.set(total)
  }
})
registry.registerMetric(totalVotes)

// --Utility Function-- //

async function scrapeApplication () {
  const id = Date.now().toString(16)
  console.log(`Scraping ${process.env.SCRAPE_URL}:${process.env.SCRAPE_PORT}/${process.env.SCRAPE_PATH} [scrape id: ${id}]`)
  const start = Date.now()
  const metrics = await axios.get(`${process.env.SCRAPE_URL}:${process.env.SCRAPE_PORT}/${process.env.SCRAPE_PATH}`)
  scrapeResponseTime.observe(Date.now() - start)
  totalScrapesCounter.inc()
  console.log(`Scraped data [scrape id: ${id}]`)
  return metrics.data.total
}

// --Servers start-- //

app.use(async (ctx, next) => {
  console.log(`Received scrape request: ${ctx.method} ${ctx.url} @ ${new Date().toUTCString()}`)
  const start = Date.now()
  await next()
  localResponseTime.observe(Date.now() - start)
})

app.use(async ctx => {
  ctx.set('Content-Type', registry.contentType)
  ctx.body = await registry.metrics()
})

// start loop
if (pollingInterval >= 3500) {
  setInterval(async () => {
    const total = await scrapeApplication()
    totalVotes.set(total)
  }, pollingInterval)
}

console.log(`Listening on ${process.env.SCRAPER_PORT || 9837}`)
app.listen(process.env.SCRAPER_PORT || 9837)
