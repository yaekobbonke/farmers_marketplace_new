import axios from "axios";

export class SearchProvider {

  static async semanticSearch(query: string) {
    const res = await axios.post("http://ai-search:7000/search", {
      query
    });

    return res.data.results;
  }

}
