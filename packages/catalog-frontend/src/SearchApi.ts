import FuzzySearch from 'fuzzy-search';
import * as schema from 'catalog-schema';

const FIELD_LIST = ['name', 'metadata.description', 'metadata.keywords', 'metadata.author.name', 'metadata.author.twitter'];

export async function searchByQuery(query: string): Promise<schema.Package[]> {
    return fetch('/index/packages.json')
        .then((response) => response.json())
        .then((list: schema.Package[]) => {
            const searcher = new FuzzySearch(list, FIELD_LIST, { sort: true });
            return searcher.search(query);
        }, (err) => {
            console.error(err);
            return [];
        });
}