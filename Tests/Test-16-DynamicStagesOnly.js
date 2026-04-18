import { sleep } from 'k6';
import http from 'k6/http';

/* Load test configurations from external JSON file */
const testConfig = JSON.parse(open('../test-config.json'));

const testType = __ENV.TEST_TYPE || 'smoke';

if (!testConfig[testType]) {
    throw new Error(`Invalid TEST_TYPE: "${testType}". Valid options: ${Object.keys(testConfig).join(', ')}`);
}

/*
   Here, we only pick stages (or vus/duration for smoke) from the config.
   Thresholds are defined in the test file itself since they are 
   specific to what this test cares about and can vary per test file.
*/
const loadProfile = testConfig[testType];

export const options = {
    // Dynamically set stages or vus/duration from config
    ...(loadProfile.stages
        ? { stages: loadProfile.stages }
        : { vus: loadProfile.vus, duration: loadProfile.duration }
    ),

    // Thresholds stay in the test file — they are test-specific
    thresholds: {
        'http_req_duration': ['p(95) < 600', 'p(99) < 1000'],
        'http_req_failed': ['rate < 0.1'],
    },

    cloud: {
        projectID: 7309560,             // Project: ENV_CONFIGURED Project
        name: 'ENV_CONFIGURED_PROJECT'  // Test runs with the same name groups test runs together.
    }
};

export function setup() {
    console.log(`Running: ${loadProfile.TEST_TYPE_SELECTED}`);
}

export default function() {
    http.get('https://quickpizza.grafana.com/');
    sleep(1);
}

/* We will run this env wise file in cloud now,

Go to grafanna cloud, create a new project, create a new test and 
we will again get this: k6 cloud login --token c3a77dd3b2550b76a08b6a60c1ed6e539f96b36f44b2380f9f3f620e9d8e5ae6

Update the cloud {} as new project is created

  cloud: {
    // Project: ENV_CONFIGURED Project
    projectID: 7309560,
    // Test runs with the same name groups test runs together.
    name: 'Test (18/04/2026-18:31:16)'
  }

Now run the script in cloud with k6 cloud command
k6 cloud run -e TEST_TYPE=smoke .\Tests\Test-16-DynamicStagesOnly.js

OUTPUT:


PS C:\REPOS\PerformanceTesting_WithK6\PerformanceTesting_WithK6> k6 cloud run -e TEST_TYPE=smoke .\Tests\Test-16-DynamicStagesOnly.js

         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 


     execution: cloud
        script: .\Tests\Test-16-DynamicStagesOnly.js
        output: https://avdeshmukh.grafana.net/a/k6-app/runs/7310142

     scenarios: (100.00%) 1 scenario, 1 max VUs, 1m0s max duration (incl. graceful stop):
              * default: 1 looping VUs for 30s (gracefulStop: 30s)

INFO[0013] Running: Smoke Test                           detected_level=info instance_id=0 lz="amazon:us:columbus" service_name=unknown_service source=console test_run_id=7310142
     test status: Finished
*/