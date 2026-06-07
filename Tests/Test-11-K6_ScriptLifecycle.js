/* 1. init code --> outside default function -- required
    - Code in the init context prepares the script, loading files, importing modules, and defining the test lifecycle functions.
*/

import { sleep } from 'k6';
import http from 'k6/http';

export const options = {
  vus: 2,
  duration: '10s',
};

/* 2. setup code --> like before() hook (OPTIONAL)
   - Runs ONCE before all VUs start
   - Returns data to share with VU code and teardown stage. 
 */
export function setup() {    

  const res = http.get('https://quickpizza.grafana.com/');
  console.log(`Setup: Status = ${res.status}`);

  // Whatever is returned here is passed as `data` to default function and teardown
  return { baseUrl: 'https://quickpizza.grafana.com/', startTime: Date.now() };
}

/* 3. VU Iterations code  
   - runs once per iteration, as many times as the test options require.
   - data returned from setup() — shared across all VUs (read-only).
*/
export default function (data) {
  http.get(data.baseUrl);
  console.log(`VU ${__VU} | Iteration ${__ITER} | Using baseUrl from setup: ${data.baseUrl}`);
  sleep(1);
}

/* 4. teardown code --> like after() hook (OPTIONAL) 
   - `data` is the same return value from setup()
   - Runs ONCE after all VUs have finished.
   - If the Setup function ends abnormally (e.g throws an error), the teardown() function isn't called.
     hence consider error handling in setup()
*/
export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`Teardown: Test ran for ~${duration}ms`);
}