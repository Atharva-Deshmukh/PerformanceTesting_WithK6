/* http should be default export, not named export -> import { http } */
import { sleep } from 'k6';
import http from 'k6/http';

/* Both options and default function should be exported so that they
   can communicate with each other
 */
export const options = {
    vus: 3,
    duration: '10s', /* the users may complete request call in 1s but they will keep iterating till 10s limit */

    thresholds: {
        'http_req_duration': ['p(95) < 100'],
        'http_req_failed': ['rate < 0.5']  // meaning we accept uptp 50% failure rate
    }
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
   - The sleep(1) guarantees at least ~1 second per loop per VU */

   /* Lets understand the report generated in the terminal
      ---------------------------------------------------

      NOTE: Run the test first in terminal

        default: 3 looping VUs for 10s (gracefulStop: 30s) -> this is obvious
        total time taken > 30s. 5s here and there for rampup and graceful stop

        After  █ TOTAL RESULTS, we have metrics.

        http_req_duration -> Time taken to send HTTP request + Time taken to get back the response

        TERMINAL:
        http_req_duration..............: avg=334.78ms min=310.23ms med=320.62ms max=374.45ms p(90)=373.94ms p(95)=374.45ms
        http_req_failed................: 0.00%  0 out of 21
        http_reqs......................: 21     2.061495/s   --> total requests made in n iterations total
        

        here, best performing/best performance = min
              bad performing/worst performance = max

        p(95) -> p(95) —  -> 95% of requests out of total(21) have taken <= 374.45ms

        How p(95) is calculated?
        -----------------------
        - Sort all request durations from fastest to slowest.
        - Find the value at the 95th percentile position: position = ceil(0.95 × total_requests)
        - The duration at that position is p(95).

        Ex: Imagine the 21 http_req_duration values sorted in ascending order:

            #	Duration (ms)
            ----------------
            1	310.23 ← min
            2	311.50
            3	312.80
            4	313.10
            5	314.00
            6	315.20
            7	316.40
            8	317.00
            9	318.50
            10	319.80
            11	320.62 ← median (middle value)
            12	322.00
            13	325.10
            14	328.40
            15	330.70
            16	335.00
            17	340.20
            18	350.60
            19	360.80
            20	374.45 ← p(95)
            21	374.45 ← max

position = ⌈ 0.95 × 21 requests ⌉ = ⌈ 19.95 ⌉ = 20

The value at position 20 is 374.45ms → that's your p(95).

This means: 20 out of 21 requests (95.2%) completed in ≤ 374.45ms. 
Only 1 request (the slowest 5%) was at or above that threshold.

Why p(95) matters more than avg?
--------------------------------

- avg (334.78ms) can be skewed by a few very fast or very slow outliers.
- p(95) tells you the experience of the vast majority of users — 
  it's the standard SLA metric in performance testing. 
  If your SLA (Service Level Agreement) says "95% of requests must complete under 500ms", you check p(95).

p(90) vs p(95):
---------------

- p(95) is always ≥ p(90) because you're including 5% more of the slower requests.
- A large gap between p(90) and p(95) is a red flag — it means a subset of users is having 
  a significantly worse experience than the majority.

Interpreting the gap
Your results --> 374.45 - 373.94 = 0.51ms	Almost no difference — response times are very consistent

When to use which?
------------------
- p(90) — more lenient, tolerates 10% slow requests. Good for internal/non-critical services.
- p(95) — industry standard for SLAs. Most production systems target this.
- p(99) — strictest, used for critical systems (payments, auth). Catches rare but severe slowdowns. 


{ expected_response:true }:
 -------------------------
 - When a request fails, it doesn't take much time to start next iteration
 - When a request passes, it takes more time since we also need to wait and process response
 - Hence, if failed requests are included in P(90).., then we may get misleading metrics
 - expected_response: true metric filters out and calculates p(90)..max, min for success requests only
   not for failed requests

iteration_duration.............: avg=1.45s    min=1.31s    med=1.32s    max=2.18s    p(90)=2.18s    p(95)=2.18s
- Iteration duration means time taken for the default function block's execution in one iteration, 
  regardless of number of lines of code in the function
- Here sleep() time is also included, earlier in max, min,.. we had only request's full time

Now, we don't always need to see full response and every metric and then decide,
we can define our own thresholds and analyse only the filtered responses

After configuring thresholds {} and running script again, we have a new item added in report in terminal

█ THRESHOLDS

    http_req_duration
    ✗ 'p(95) < 100' p(95)=427.04ms

Threshold for requests failed:
- Terminal -> http_req_failed................: 0.00%  0 out of 21
- Its a rate metric, calculated from 0-1
  21/21 fails means its 1

Outcome	Calculation	   Rate value
--------------------------------------
0 out of 21 failed	  0 / 21	0.00
10 out of 21 failed	  10 / 21	0.476
11 out of 21 failed	  11 / 21	0.524
21 out of 21 failed	  21 / 21	1.00

Your rate = 0.00, and the threshold checks 0.00 < 0.5 → true → ✓ passes.

█ THRESHOLDS

    http_req_duration
    ✗ 'p(95) < 100' p(95)=402.41ms

    http_req_failed
    ✓ 'rate < 0.5' rate=0.00%



   
*/
