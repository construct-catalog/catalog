export interface Module {

  readonly name: string;

  readonly version: string;

  readonly description: string;

  readonly languages: string[];

  readonly lastPublished: number;

}

export class Modules {

  public search(q: string): Module[] {

    const modules: Module[] = [];

    for (let i = 0; i < 50; i++) {
      modules.push({
        name: `module${i}`,
        description: `description${i}`,
        languages: ['java', 'python', 'typescript', 'javascript'],
        version: `version${i}`,
        lastPublished: Date.now(),
      })
    }

    return modules;

  }
}
