// 1. init code --> outside default function -- required

/* Code in the init context prepares the script, loading files, 
importing modules, and defining the test lifecycle functions. 

Ex: Open JSON file, Import module like we did earlier for fetching env config passed
*/

import { sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 2,
  duration: '10s',
};


/* Setup also returns an object and this can be used as data in params for other functions */
export function setup() {    
  // 2. setup code --> like before() hook (OPTIONAL)
  // Runs ONCE before all VUs start. Can return data to share with VU code and teardown.

  const res = http.get('https://quickpizza.grafana.com/');
  console.log(`Setup: Status = ${res.status}`);

  // Whatever is returned here is passed as `data` to default function and teardown
  return { baseUrl: 'https://quickpizza.grafana.com/', startTime: Date.now() };
}

export default function (data) {
  // 3. VU code 

  /*
  VU code runs Once per iteration, as many times as the test options require.
  `data` is the return value from setup() — shared across all VUs (read-only).
  */

  http.get(data.baseUrl);
  console.log(`VU ${__VU} | Iteration ${__ITER} | Using baseUrl from setup: ${data.baseUrl}`);
  sleep(1);
}

export function teardown(data) {
  // 4. teardown code --> like after() hook (OPTIONAL)

  /*
  `data` is the same return value from setup().
  Runs ONCE after all VUs have finished.

  If the Setup function ends abnormally (e.g throws an error), the teardown() function isn't called.
   Consider adding logic to the setup() function to handle errors and ensure proper cleanup.
  */

  const duration = Date.now() - data.startTime;
  console.log(`Teardown: Test ran for ~${duration}ms`);
}