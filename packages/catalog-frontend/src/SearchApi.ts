import FuzzySearch from 'fuzzy-search';
import * as schema from 'catalog-schema';

const SEARCH_PROPERTIES = [
  'name',
  'metadata.description',
  'metadata.keywords',
  'metadata.author.name',
  'metadata.author.twitter'
];

async function fetchJson() {
  return fetch('/index/packages.json')
    .then(response => response.json())
    .then(response => response.packages);
}

export async function searchByQuery(query: string): Promise<schema.Package[]> {
  return fetchJson()
    .then((list: schema.Package[]) => {
      const searcher = new FuzzySearch<schema.Package>(list, SEARCH_PROPERTIES, { sort: true });
      return searcher.search(query);
    });
}

export async function getTotalCount(): Promise<number> {
  return fetchJson()
    .then((list: schema.Package[]) => {
      return list.length;
    });
}
