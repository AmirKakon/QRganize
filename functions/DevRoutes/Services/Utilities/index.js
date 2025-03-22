const { functions } = require("../../../setup");
const { NotFoundError, MissingArgumentError } = require("./error-handler");
const axios = require("axios");
const cheerio = require("cheerio");
const ApifyClient = require("apify-client").ApifyClient;

const checkRequiredParams = (requiredParams, params) => {
  for (const param of requiredParams) {
    if (!params[param]) {
      throw new MissingArgumentError(`Missing parameter: ${param}`);
    }
  }
};

const apifyToken = functions.config().apify_api.token;
const apifyGoogleSearchActor = functions.config().apify_googlesearch.actor;

const searchBarcodeApify = async (barcode) => {
  // Initialize the ApifyClient with API token
  const client = new ApifyClient({
    token: apifyToken,
  });

  // Prepare Actor input
  const input = {
    queries: `${barcode}`,
    resultsPerPage: 3,
    maxPagesPerQuery: 1,
    languageCode: "",
    mobileResults: false,
    includeUnfilteredResults: false,
    saveHtml: false,
    saveHtmlToKeyValueStore: false,
    includeIcons: true,
  };
  // Run the Actor and wait for it to finish
  const run = await client.actor(apifyGoogleSearchActor).call(input);

  // Fetch and print Actor results from the run's dataset (if any)
  const { items } = await client.dataset(run.defaultDatasetId).listItems();
  return items[0].organicResults.map((item) => {
    return { title: item.title, src: item.imageData };
  });
};

const searchBarcodeChp = async (barcode) => {
  const url =
    `https://chp.co.il/main_page/compare_results` +
    `?shopping_address=%D7%99%D7%A8%D7%95%D7%A9%D7%9C%D7%99%D7%9D+` +
    `&shopping_address_street_id=9000` +
    `&shopping_address_city_id=3000` +
    `&product_name_or_barcode=${encodeURIComponent(barcode)}` +
    `&product_barcode=temp_${encodeURIComponent(barcode)}` +
    `&from=0&num_results=2`;
  const config = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/94.0.4606.81 Safari/537.36",
    },
  };

  let src = null;
  let title = null;
  const response = await axios.get(url, config);
  const $ = cheerio.load(response.data);
  const titleElement = $("input[id=displayed_product_name_and_contents]");
  title = titleElement.attr("value") ? titleElement.attr("value") : null;

  const firstTable = $("table").first();
  if (firstTable.length) {
    const firstTd = $("td", firstTable).eq(0);
    if (firstTd.length) {
      const img = $("img", firstTd);
      src = img.attr("data-uri") ?
        img.attr("data-uri").split(";base64,")[1] :
        null;
    }
  }

  if (title) {
    return [{ src, title }];
  }
  return null;
};

const searchBarcode = async (barcode) => {
  let items = await searchBarcodeChp(barcode);

  if (!items) {
    items = await searchBarcodeApify(barcode);

    if (!items) {
      throw new NotFoundError(`No item was found for barcode ${barcode}`);
    }
  }

  return items;
};

module.exports = { checkRequiredParams, searchBarcode };
