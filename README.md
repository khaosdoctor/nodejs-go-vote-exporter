# Go Vote API Prometheus Exporter

> A Prometheus exporter for the [Go Vote API](https://github.com/khaosdoctor/go-vote-api) example

## Running

This image needs a few environment variables:

- `SCRAPE_PORT`: The port where the scraped application will be serving the metrics to be scraped (8080 in the example app)
- `SCRAPE_URL`: The base URL where the metrics are being served (e.g `http://myapi`)
- `SCRAPE_PATH`: The URL path that should be queried (e.g `total`)

The application will join these envs and scrape `SCRAPE_URL:SCRAPE_PORT/SCRAPE_PATH`.

Optionally you can define `POLLING_INTERVAL_MS`, which defaults to `5000`. Set it to `0` to disable the automatic polling.

```bash
docker rum -p 9837:9837 -e SCRAPE_URL="http://api" --link scraped_container_name:api -e SCRAPE_PORT=8080 -e SCRAPE_PATH=total khaosdoctor/go-vote-api-exporter
```

### Caveats

- The application will serve the metrics on port `9837`
- It'll try to infer the hostname from the `HOSTNAME` and `POD_NAME` env variables to add as labels
