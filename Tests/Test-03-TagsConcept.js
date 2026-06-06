import { sleep, check } from 'k6';
import http from 'k6/http';

/* Tags:
- Whatever metrics like p(90)..max, min, we got in terminal response, 
  it was for total http request durations, not any specific request call.
- Till now, we had only one request, so it was easy to monitor that request.
  But, if we have multiple requests, then its difficult to track which request perfomed poorly
  as all the metrics are for ALL the requests

- To monitor individual requests and know the bottlenecks, we tag the requests.
- There is a second parameter in http.get(), which is an object, it has tags property where
  we can give tag name
- We then need to add this tag name in the thresholds {}
*/

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
    }
}

export default function() {
    http.get('https://quickpizza.grafana.com/', {
        tags: { name: 'REQ_1' }
    });

    http.get('https://grafana.com/docs/k6/latest/using-k6/assertions/', {
        tags: { name: 'REQ_2' }
    });

    sleep(1); 
}

/* OUTPUT:


  █ THRESHOLDS

    http_req_duration
    ✗ 'p(95) < 400' p(95)=495.17ms

      {name: REQ_2}
      ✗ 'p(95) < 400' p(95)=521.74ms

    http_req_failed
    ✓ 'rate < 0.1' rate=0.00%

      {name: REQ_2}
      ✓ 'rate < 0.1' rate=0.00%


  █ TOTAL RESULTS

    HTTP
    http_req_duration..............: avg=386.48ms min=301.12ms med=382.04ms max=604.07ms p(90)=478.82ms p(95)=495.17ms
      { expected_response:true }...: avg=386.48ms min=301.12ms med=382.04ms max=604.07ms p(90)=478.82ms p(95)=495.17ms
      { name: REQ_2 }..............: avg=435.33ms min=323.1ms  med=434.92ms max=604.07ms p(90)=495.63ms p(95)=521.74ms
    http_req_failed................: 0.00%  0 out of 34
      { name: REQ_2 }..............: 0.00%  0 out of 17
    http_reqs......................: 34     2.548836/s

    EXECUTION
    iteration_duration.............: avg=2s       min=1.63s    med=1.79s    max=2.71s    p(90)=2.59s    p(95)=2.63s 

    iterations.....................: 17     1.274418/s
    vus............................: 1      min=1       max=5
    vus_max........................: 5      min=5       max=5

    NETWORK
    data_received..................: 7.4 MB 554 kB/s
    data_sent......................: 54 kB  4.1 kB/s



                                                                                                                    
running (13.3s), 0/5 VUs, 17 complete and 0 interrupted iterations                                                  
default ✓ [======================================] 0/5 VUs  12s                                                     
ERRO[0013] thresholds on metrics 'http_req_duration, http_req_duration{name: REQ_2}' have been crossed


*/