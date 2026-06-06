/* Four main types

                                    Counter
                                    -------

A Counter is a cumulative metric that only increases over time.
You don’t care about individual values—just the total count.

What it tracks -> Total occurrences of something
Examples -> Number of requests sent, Number of errors

Built-in example -> http_reqs → total HTTP requests made

                                    Gauge
                                    -----

A Gauge represents a value at a specific point in time. 
It can go up or down.
It reflects the latest snapshot, not cumulative data.

What it tracks -> Current state or latest value
Examples:
    Number of active users
    Current memory usage

Built-in example -> vus → current number of virtual users

                                    Rate
                                    ----

A Rate measures the percentage of successful vs failed events.
Values are between 0 and 1 (e.g., 0.02 = 2% failure rate).

What it tracks -> Proportion of a condition being true
Examples -> Error rate, Success rate

Built-in example -> http_req_failed → proportion of failed HTTP requests

                                    Trend
                                    -----

A Trend stores multiple values over time and provides statistical analysis.
This is the most important metric type for performance analysis.

What it tracks -> Distribution of values

Examples:
    Response times
    Latency
    Waiting time

Built-in examples:
    http_req_duration
    http_req_waiting

Outputs include:
    Average (avg)
    Minimum (min)
    Maximum (max)
    Percentiles (e.g., p(95), p(99))


    +-------------------+---------+---------------------------+-------------------------------------------+
    | Metric            | Class   | Threshold keyword         | What it shows                             |
    +-------------------+---------+---------------------------+-------------------------------------------+
    | Trend  (Test-04)  | Trend   | p(95), avg, min, max      | Statistical distribution of all values    |
    | Rate   (Test-09)  | Rate    | rate                      | Proportion (0–1) of true vs false         |
    | Counter(Test-10)  | Counter | count                     | Cumulative total                          |
    | Gauge  (Test-11)  | Gauge   | value                     | Latest snapshot (also shows min/max)      |
    +-------------------+---------+---------------------------+-------------------------------------------+
*/

import { sleep, check } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';

/* http_req_duration is used to track total http request + response time.
   We will create a custom metric to just track http response time
*/
const apiRequestTimeCustomMetric = new Trend('API_REQUEST_TIME'); // Trend class can be used to track response times
const apiResponseTimeCustomMetric = new Trend('API_RESPONSE_TIME');

export const options = {

    stages: [
        {duration: '4s', target: 2}, 
        {duration: '5s', target: 5}, 
        {duration: '3s', target: 0}  
    ],

    thresholds: {
        'http_req_duration': ['p(95) < 400'],
        'http_req_failed': ['rate < 0.1'],  
        'http_req_duration{name: REQ_2}': ['p(95) < 400'], // add threshold for specific request
        'http_req_failed{name: REQ_2}': ['rate < 0.1'], // check if this specific request failed more then 10%
        'API_REQUEST_TIME': ['p(95) < 200'], // track this custom metric
        'API_RESPONSE_TIME': ['p(95) < 200'], // track this custom metric
    }
}

export default function() {
    const respone = http.get('https://quickpizza.grafana.com/', {
        tags: { name: 'REQ_1' }
    });

    /* For custom metric, we ourselves need to write logic to capture the value we want in that metric 
       We are tracking REQ_1 via custom metric since we have used its response
    */
    apiResponseTimeCustomMetric.add(respone.timings.waiting); /* Check response time only */
    apiRequestTimeCustomMetric.add(respone.timings.sending);  /* Check request time only */

    /* Since this is a Trend metric, all requests values will stack up and then we can calculate
       max, min, p(95)...
    */
    
    /* This has object with all timing related properties:

        (property) Response.timings: {
        blocked: number;
        connecting: number;
        tls_handshaking: number;
        sending: number;
        waiting: number;  // Milliseconds spent waiting for server response (TTFB).
        receiving: number;
        duration: number;

        duration: number -> Total time in milliseconds. sending + waiting + receiving

        Duration = sum of all below components that take place while sending http request and getting response
        - DNS lookup
        - TCP connection 
        - TLS Handshake
        - Sending http request
        - Waiting for response while server is processing the request
        - Recieving response (http response download)
        }

        Hence: http_req_duration = respone.timings.duration

        To know just the response time, we will use respone.timings.waiting
        This metric is not in-built, we have to write logic to get this
    */

    http.get('https://grafana.com/docs/k6/latest/using-k6/assertions/', {
        tags: { name: 'REQ_2' }
    });

    sleep(1); 
}

/* OUTPUT:

  █ TOTAL RESULTS

    CUSTOM
    API_REQUEST_TIME...............: avg=0.351324   min=0        med=0.4086   max=1.1362   p(90)=0.5913    p(95)=0.73244
    API_RESPONSE_TIME..............: avg=308.370953 min=285.8377 med=304.0021 max=380.036  p(90)=320.74078 p(95)=333.06192

    HTTP
    http_req_duration..............: avg=379.34ms   min=287.33ms med=348.74ms max=646.88ms p(90)=531.57ms  p(95)=590.37ms
      { expected_response:true }...: avg=379.34ms   min=287.33ms med=348.74ms max=646.88ms p(90)=531.57ms  p(95)=590.37ms
      { name: REQ_2 }..............: avg=449.6ms    min=348.2ms  med=436.34ms max=646.88ms p(90)=593.7ms   p(95)=636.28ms
    http_req_failed................: 0.00%  0 out of 34
      { name: REQ_2 }..............: 0.00%  0 out of 17
    http_reqs......................: 34     2.524285/s

    EXECUTION
    iteration_duration.............: avg=1.96s      min=1.64s    med=1.78s    max=2.76s    p(90)=2.45s     p(95)=2.59s
    iterations.....................: 17     1.262142/s
    vus............................: 1      min=1       max=5
    vus_max........................: 5      min=5       max=5

    NETWORK
    data_received..................: 7.4 MB 549 kB/s
    data_sent......................: 64 kB  4.7 kB/s



                                                                                                                    
running (13.5s), 0/5 VUs, 17 complete and 0 interrupted iterations                                                  
default ✓ [======================================] 0/5 VUs  12s                                                     
ERRO[0013] thresholds on metrics 'API_RESPONSE_TIME, http_req_duration, http_req_duration{name: REQ_2}' have been crossed

*/