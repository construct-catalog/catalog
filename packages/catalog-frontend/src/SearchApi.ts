import * as schema from 'catalog-schema';

async function fetchJson() {
  return fetch('/index/packages.json')
    .then(response => response.json())
    .then(response => response.packages);
}

export async function searchByQuery(query: string): Promise<schema.Package[]> {
  return fetchJson().then((list: schema.Package[]) => nonFuzzySearch(list, query));
}

export async function getTotalCount(): Promise<number> {
  return fetchJson().then((list: schema.Package[]) => list.length);
}

function nonFuzzySearch(list: any[], needle: string) {
  return list.filter(item => JSON.stringify(item).includes(needle));
}