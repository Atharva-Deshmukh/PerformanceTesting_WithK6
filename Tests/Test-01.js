/* http should be default export, not named export -> import { http } */
import { sleep } from 'k6';
import http from 'k6/http';

/* Both options and default function should be exported so that they
   can communicate with each other
 */
export const options = {
    vus: 3,
    duration: '10s' /* the users may complete request call in 1s but they will keep iterating till 10s limit */
}

/* It will be picked up by k6 as the entry point for the test script. 
   It will be executed repeatedly in "iterations" for the whole duration of the test. 
*/
export default function() {
    http.get('https://quickpizza.grafana.com/');
    sleep(1); /* Sleep for 1 second before the next iteration */
}

/* Each iteration roughly takes: request time + 1 second sleep 
   
   Iterations are not pre-counted—they just keep running until time runs out.

   This means:
   - If requests are fast → more iterations
   - If requests are slow → fewer iterations
   - The sleep(1) guarantees at least ~1 second per loop per VU

*/
