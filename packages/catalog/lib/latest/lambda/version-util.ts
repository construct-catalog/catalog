import { DynamoDB } from 'aws-sdk';
import * as assert from 'assert';
import type { LanguageSupportInformation } from 'catalog-schema';

/**
 * Re-formats a "standard" version string (e.g: "1.2.3-alpha4") into a form that
 * is lexicographically sortable (e.g: "000001.000002.000003.alpha000004").
 *
 * @param version the version to be re-formatted, e.g: "1.2.3-alpha4"
 *
 * @returns the re-formatted version, e.g: "000001.000002.000003.alpha000004~"
 */
export function renderComparableVersion(version: string): ComparableVersionResult {
  const parts = version.split(/[.+-]/);
  const comparableVersion = parts
    .map((part) => /^\d+$/.test(part)
      ? part.padStart(6, '0')
      : part.split(/(?<=[^\d])(?=\d)/)
          .map((seg) => /^\d+$/.test(seg) ? seg.padStart(6, '0') : seg)
          .join('')
      )
    .join('.')
    // Using ~ as a cork here, because it lexicographically sorts AFTER . and any alphanumeric.
    // This ensures that 1.2.3 has a sortable form that is consistently HIGHER than 1.2.3-pre
    + '~';

  return { comparableVersion, majorVersion: Number.parseInt(parts[0], 10) };
}

export function renderLanguages(attributes: { [name: string]: DynamoDB.AttributeValue }): LanguageSupportInformation | undefined{
  const json: PackageJson | undefined = attributes.json?.S ? JSON.parse(attributes.json?.S) : undefined;

  if (!json?.jsii?.targets) {
    return undefined;
  }

  const result: LanguageSupportInformation = {
    typescript: {
      url: `https://www.npmjs.com/package/${json.name}/v/${json.version}`,
      npm: {
        package: json.name,
      },
    },
  };

  if (json.jsii.targets.dotnet) {
    result.dotnet = {
      url: `https://www.nuget.org/packages/${json.jsii.targets.dotnet.packageId}/${json.version}${json.jsii.targets.dotnet.versionSuffix ?? ''}`,
      nuget: json.jsii.targets.dotnet,
    };
  }

  if (json.jsii.targets.go) { /* TODO URL?? */ }

  if (json.jsii.targets.java) {
    result.java = {
      url: `https://search.maven.org/artifact/${json.jsii.targets.java.maven.groupId}/${json.jsii.targets.java.maven.artifactId}/${json.version}${json.jsii.targets.java.versionSuffix ?? ''}/pom`,
      maven: json.jsii.targets.java.maven,
    };
  }

  if (json.jsii.targets.python) {
    result.python = {
      // TODO: Pre-release identifier transformation for PEP-440
      url: `https://pypi.org/project/${json.jsii.targets.python.distName}/${json.version}/`,
      pypi: json.jsii.targets.python,
    };
  }

  return result;
}

/** @internal */
interface PackageJson {
  name: string;
  version: string;

  jsii?: {
    targets?: {
      dotnet?: {
        namespace: string;
        packageId: string;
        versionSuffix?: string;
      };
      go?: {};
      java?: {
        package: string;
        maven: {
          groupId: string;
          artifactId: string;
        };
        versionSuffix?: string;
      };
      python?: {
        distName: string;
        module: string;
      };
    };
  };
}

interface ComparableVersionResult {
  readonly comparableVersion: string;
  readonly majorVersion: number;
}

// tests
function test() {
  assert.deepStrictEqual(renderComparableVersion('1.0.0'), { comparableVersion: '000001.000000.000000~', majorVersion: 1 });
  assert.deepStrictEqual(renderComparableVersion('0.56.3'), { comparableVersion: '000000.000056.000003~', majorVersion: 0 });
  assert.deepStrictEqual(renderComparableVersion('2.0.0-beta3'), { comparableVersion: '000002.000000.000000.beta000003~', majorVersion: 2 });

  const compareVersions = (l: string, r: string) => renderComparableVersion(l).comparableVersion.localeCompare(renderComparableVersion(r).comparableVersion);
  const findLatest = (...list: string[]) => list.sort(compareVersions).pop();

  assert.equal(findLatest('1.0.0', '1.0.0-pre3'), '1.0.0');
  assert.equal(findLatest('2.0.0-pre3', '1.0.0', '2.0.3'), '2.0.3');
  assert.equal(findLatest('1.0.0-pre2', '1.0.0-pre3'), '1.0.0-pre3');
}

test();
