import { sleep } from 'k6';
import http from 'k6/http';

/* Workflow below:

- We are loading options object dynamically based on the env variable passed for the load test type
- NOTE: here we are loading both stages[] and thresholds {}, we should only load stages[] ideally
        as thresholds are something specific to test files, we will handle it in next Test file
*/

/* Load test configurations from external JSON file */
const testConfig = JSON.parse(open('../test-config.json'));

/* Read TEST_TYPE from environment variable. Defaults to 'smoke' if not set.
   Usage: k6 run -e TEST_TYPE=spike Tests/Test-15-DynamicLoadConfig.js
   Valid values: smoke, averageLoad, spike, soak
*/
const testType = __ENV.TEST_TYPE || 'smoke';  // tests will be run on smoke config by default

if (!testConfig[testType]) {
    throw new Error(`Invalid TEST_TYPE: "${testType}". Valid options: ${Object.keys(testConfig).join(', ')}`);
}

export const options = testConfig[testType];

/*
Moved the log into the setup() lifecycle function, which k6 executes 
exactly once before the test starts, regardless of VU count.
*/
export function setup() {
    console.log(`Running: ${testConfig[testType].TEST_TYPE_SELECTED}`);
}

export default function() {
    http.get('https://quickpizza.grafana.com/');
    sleep(1);
}
