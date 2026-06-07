import { sleep, check } from 'k6';
import http from 'k6/http';

/* Checks:

- Just like we put validations at the metric level using thresholds, we can put assertions/checks at function level 
  to check if the functionality is working correctly in the first place or not.
- Sometimes, GET can return 200 status even when response body is empty, thresholds still pass as max reduced.
  this is misleading

  Even after declaring checks, the thresholds will decide if the scripts will pass or fail, hence
  add checks metric in thresholds {} also
*/


export const options = {
    
    /* Lets create stages[] this time instead of single load configuration 

        For smoke tests only, we use object {vus, duration},
        else everywhere we use stages[]
    */
    stages: [
        {duration: '4s', target: 2},  // First stage: Ramp up to 4s gradually reaching to 2 VUS
        {duration: '5s', target: 5},  // Stay at 5 VUS for 5 seconds
        {duration: '3s', target: 0}   // Ramp down to 0 users in 3 seconds gradually
    ],

    thresholds: {
        'http_req_duration': ['p(95) < 400'], 
        'http_req_failed': ['rate < 0.1'],      // meaning we accept upto 10% failure rate
        'checks': ['rate > 0.9']                // More than 90% checks/assertions should pass

        /* With checks added in thresholds, now the test is metric-level validation + functionally validating.
           Whenever we analyse the report, we first see if checks pass, this makes sure the thresholds metrics are reliable
        
        Output after script run:

          █ THRESHOLDS

            checks
            ✓ 'rate > 0.9' rate=100.00%

            http_req_duration
            ✓ 'p(95) < 400' p(95)=391.82ms

            http_req_failed
            ✓ 'rate < 0.1' rate=0.00%
        
            If many checks fail, it means our system is not able to handle the given load
        */
    }
}

export default function() {
    const response = http.get('https://quickpizza.grafana.com/');

    /* We can debug the issues by logging the response body direclty here */
    // console.log(response.body); 

    check(response, {
      'Status is 200':  (resp) => resp.status === 200,
      'Page has pizza keyword': (r) => r.body.includes("pizza")

    })

    sleep(1); 
}