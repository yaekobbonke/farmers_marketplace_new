import { SearchProvider } from "./search.provider";

export class SearchService {
  static async search(query: string) {
    return SearchProvider.semanticSearch(query);
  }

}
