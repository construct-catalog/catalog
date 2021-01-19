/**
 * The contents of the `index/packages.json` file.
 */
export interface PackageDirectory {
  /** The list of indexed packages */
  packages: Package[];
}

/**
 * Information about one npm packag. There may be multiple dentries with the
 * same `name` attribute, each corresponding to a distinct major release line
 * of that package (according to the `major` attribute).
 */
export interface Package {
  /** The name of the package in npm */
  name: string;
  /** The latest version of this release line */
  version: string;
  /** The major version of this release line */
  major?: number;
  /** Package metadata useful for GUI */
  metadata: PackageMetadata;
  /** Contents of package.json (only available after rendering) */
  json?: any;
  /** The URL to the detail page for this package in the Constructs catalog */
  url?: string;
  /** Information related to languages supported by the package */
  languages?: LanguageSupportInformation;

  /** The ID of the tweet that announced this release on Twitter.com */
  tweetid?: string;
}

/**
 * Information about supported languages.
 */
export interface LanguageSupportInformation {
  /** Information about JavaScript & TypeScript support */
  typescript: {
    /** URL to the npmjs.com page for this package */
    url: string;
    /** Information about the package distribution on npm */
    npm?: {
      /** The package name on npm */
      package: string;
    };
  };
  /** Information about the .NET Family of languages */
  dotnet?: {
    /** URL to the NuGet gallery page for this package */
    url: string;
    /** Information about the package distribution on NuGet */
    nuget?: {
      /** Base namespace used by this NuGet Package */
      namespace: string;
      /** Name of the package in NuGet */
      packageId: string;
    };
  };
  /** Information about the Go bindings */
  go?: {
    /** URL to the distribution repository for this package */
    url: string;
  };
  /** Information about the Java bindings */
  java?: {
    /** URL to the package in the Maven Central website */
    url: string;
    /** Information about the package distribution in Maven */
    maven?: {
      /** Maven group ID to use in order to depend on this package */
      groupId: string;
      /** Maven artifact ID to use in order to depend on this package */
      artifactId: string;
    };
  };
  /** Information about the Python bindings */
  python?: {
    /** URL to the PyPI page for this package */
    url: string;
    /** Information about the package distribution in PyPI */
    pypi?: {
      /** The name of the distribution */
      distName: string;
      /** The python module to import when using this package */
      module: string;
    };
  };
}

export interface PackageMetadata {
  name: string;
  scope: string;
  version: string;
  date: string;
  description: string;
  keywords?: string[];
  links: {
    npm: string;
    homepage: string;
    repository: string;
    bugs: string;
  };
  author: {
    name: string;
    url: string;
    twitter?: string;
  };
}
