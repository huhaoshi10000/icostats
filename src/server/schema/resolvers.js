import fetch from 'isomorphic-fetch';
import { normalize as normalizeICO } from 'lib/icos';
import icoData from 'lib/ico-data';
import { fetchEthPriceAtDate } from 'lib/gdax';

export default {
  Query: {
    async icos() {
      const promises = icoData.map(async (data) => {
        const url = `https://api.coinmarketcap.com/v1/ticker/${data.ticker}/`;
        const response = await fetch(url);
        let json = await response.json();

        // Try to get ETH price on ICO launch day
        // NOTE: GDAX does not have history before a ceertain date
        const minGdaxDate = new Date('05/25/2016');

        if (
          !data.eth_price_at_launch &&
          data.start_date &&
          (new Date(data.start_date)) > minGdaxDate
        ) {
          const price = await fetchEthPriceAtDate(data.start_date);

          json.eth_price_at_launch = price;
        }

        if (Array.isArray(json)) {
          json = json[0];
        }

        return {
          ...data,
          ...json,
          // This one conflicts
          id: data.id
        };
      });
      const results = await Promise.all(promises);


      return results.map(normalizeICO);
    },
    async ico(obj, { id }) {
      const url = `https://api.coinmarketcap.com/v1/ticker/${id}/`;
      const response = await fetch(url);
      const json = await response.json();
      const data = Array.isArray(json) ? json[0] : json;

      return normalizeICO(data);
    }
  },
  Mutation: {
    async test() {
      return [];
    }
  }
};
