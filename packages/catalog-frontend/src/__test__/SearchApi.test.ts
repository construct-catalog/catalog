import * as testee from '../SearchApi';

beforeAll(() => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            json: () => Promise.resolve([
                {
                    "name": "cdk-fargate-express",
                    "version": "0.4.131",
                    "metadata": {
                        "name": "cdk-fargate-express",
                        "scope": "unscoped",
                        "version": "0.4.131",
                        "description": "A sample JSII construct lib for Express Apps in AWS Fargate for websites",
                        "keywords": [
                            "aws",
                            "cdk",
                            "express",
                            "fargate"
                        ],
                        "date": "2021-01-13T01:50:17.919Z",
                        "links": {
                            "npm": "https://www.npmjs.com/package/cdk-fargate-express",
                            "homepage": "https://github.com/pahud/cdk-fargate-express#readme",
                            "repository": "https://github.com/pahud/cdk-fargate-express",
                            "bugs": "https://github.com/pahud/cdk-fargate-express/issues"
                        },
                        "author": {
                            "name": "Pahud Hsieh",
                            "email": "pahudnet@gmail.com",
                            "username": "pahud"
                        },
                        "publisher": {
                            "username": "pahud",
                            "email": "pahudnet@gmail.com"
                        },
                        "maintainers": [
                            {
                                "username": "pahud",
                                "email": "pahudnet@gmail.com"
                            }
                        ]
                    },
                    "major": 0,
                    "languages": {
                        "typescript": {
                            "url": "https://www.npmjs.com/package/cdk-apex-cname/v/0.1.4",
                            "npm": {
                                "package": "cdk-apex-cname"
                            }
                        },
                        "python": {
                            "url": "https://pypi.org/project/cdk-apex-cname/0.1.4/",
                            "pypi": {
                                "distName": "cdk-apex-cname",
                                "module": "cdk-apex-cname"
                            }
                        }
                    },
                    "tweetid": "DUMMY",
                    "url": "https://awscdk.io/packages/cdk-fargate-express@0.4.131/"
                },
                {
                    "name": "cdk-spa-deploy",
                    "version": "0.6.0",
                    "metadata": {
                        "name": "cdk-spa-deploy",
                        "scope": "unscoped",
                        "version": "0.6.0",
                        "description": "This is an AWS CDK Construct to make deploying a single page website (Angular/React/Vue) to AWS S3 behind SSL/Cloudfront as easy as 5 lines of code.",
                        "keywords": [
                            "aws",
                            "cdk",
                            "spa",
                            "website",
                            "deploy",
                            "cloudfront"
                        ],
                        "date": "2020-02-14T15:38:22.036Z",
                        "links": {
                            "npm": "https://www.npmjs.com/package/cdk-spa-deploy",
                            "homepage": "https://github.com/nideveloper/CDK-SPA-Deploy#readme",
                            "repository": "https://github.com/nideveloper/CDK-SPA-Deploy",
                            "bugs": "https://github.com/nideveloper/CDK-SPA-Deploy/issues"
                        },
                        "author": {
                            "name": "matt@vs-software.co.uk",
                        },
                        "publisher": {
                            "username": "nideveloper",
                            "email": "matt@vs-software.co.uk"
                        },
                        "maintainers": [
                            {
                                "username": "nideveloper",
                                "email": "matt@vs-software.co.uk"
                            }
                        ]
                    },
                    "major": 0,
                    "languages": {
                        "typescript": {
                            "url": "https://www.npmjs.com/package/cdk-apex-cname/v/0.1.4",
                            "npm": {
                                "package": "cdk-apex-cname"
                            }
                        },
                        "python": {
                            "url": "https://pypi.org/project/cdk-apex-cname/0.1.4/",
                            "pypi": {
                                "distName": "cdk-apex-cname",
                                "module": "cdk-apex-cname"
                            }
                        }
                    },
                    "tweetid": "1228342965338345472",
                    "url": "https://awscdk.io/packages/cdk-spa-deploy@0.6.0/"
                },
                {
                    "name": "cdk-apex-cname",
                    "version": "0.1.4",
                    "metadata": {
                        "name": "cdk-apex-cname",
                        "scope": "unscoped",
                        "version": "0.1.4",
                        "description": "CDK construct to allow setting an apex record to a cname",
                        "keywords": [
                            "cdk",
                            "aws-cdk",
                            "aws",
                            "route53"
                        ],
                        "date": "2020-05-19T09:32:19.052Z",
                        "links": {
                            "npm": "https://www.npmjs.com/package/cdk-apex-cname",
                            "homepage": "https://github.com/maskerade/cdk-apex-cname#readme",
                            "repository": "https://github.com/maskerade/cdk-apex-cname",
                            "bugs": "https://github.com/maskerade/cdk-apex-cname/issues"
                        },
                        "author": {
                            "name": "Stefan De Figueiredo",
                            "url": "https://github.com/maskerade"
                        },
                        "publisher": {
                            "username": "maskerade",
                            "email": "stefdefig@hotmail.co.uk"
                        },
                        "maintainers": [
                            {
                                "username": "maskerade",
                                "email": "stefdefig@hotmail.co.uk"
                            }
                        ]
                    },
                    "major": 0,
                    "languages": {
                        "typescript": {
                            "url": "https://www.npmjs.com/package/cdk-apex-cname/v/0.1.4",
                            "npm": {
                                "package": "cdk-apex-cname"
                            }
                        },
                        "python": {
                            "url": "https://pypi.org/project/cdk-apex-cname/0.1.4/",
                            "pypi": {
                                "distName": "cdk-apex-cname",
                                "module": "cdk-apex-cname"
                            }
                        }
                    },
                    "tweetid": "1262678400151498752",
                    "url": "https://awscdk.io/packages/cdk-apex-cname@0.1.4/"
                }
            ]),
        })
    );
});

test('simple query test', async () => {
    const result = await testee.searchByQuery('deploy');

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('cdk-spa-deploy');
});

test('with multiple results', async () => {
    const result = await testee.searchByQuery('website');

    expect(result.length).toBe(2);
    expect(result[0].name).toBe('cdk-fargate-express');
});

test('with keyword hit', async () => {
    const result = await testee.searchByQuery('route53');

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('cdk-apex-cname');
});

test('total count', async () => {
    const result = await testee.getTotalCount();

    expect(result).toBe(3);
});

test('handle error', async () => {
    const errorMessage = 'Failed to parse JSON';
    console.error = jest.fn();
    global.fetch = jest.fn(() =>
        Promise.resolve({
            json: () => Promise.reject(errorMessage),
        })
    );
    const result = await testee.searchByQuery('index');

    expect(result.length).toBe(0);
    expect(console.error).toBeCalledTimes(1);
    expect(console.error).toBeCalledWith(errorMessage);
});
