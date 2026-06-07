/* The k6 browser module was originally built directly on the Chrome DevTools Protocol (CDP) — 
the same low-level protocol that Playwright and Puppeteer use. 
It was not wrapping Playwright itself.

However, the API design was intentionally modeled after Playwright's API for familiarity — 
that's why you see identical patterns like browser.newContext(), page.goto(), page.locator(), etc.

k6 uses Chrome DevTools Protocol (CDP) with a Playwright-inspired API for browser automation

Our UI test workflow:
- visit: https://rahulshettyacademy.com/locatorspractice/
- Login (rahul, rahulshettyacademy)
- check if we have successfully logged in
*/

import { browser } from 'k6/browser';
import http from 'k6/http';
import { sleep, check, group } from 'k6';

const USERNAME = "rahul";
const PASSWORD = "rahulshettyacademy";
const URL = "https://rahulshettyacademy.com/locatorspractice/";

/* This is the heart of k6 */
export const options = {

    /* How to test browser tests for performance in k6?
       - We don't load browser with 200 users directly, it will be very costly for the UI
       - Instead, we first load the inner backend API call with 200 or so users 
         and then hit the UI Browser request for 2-3 users
       - This way, we are testing browser with already loaded env and we then record browser metrics here

       In below tests: 
       - we are parallely putting load on the URL via API
       - and we are parallely hitting URL from browser also
    */
    scenarios: {

        /* We can name these objects anything, The scenario name appears in the terminal output as a label:
           backendTest ✓ [======================================] 20 VUs  1m0s
           uiTest      ✓ [======================================] 2 VUs   0m13.9s/1m0s  4/4 shared iters
        */
        uiTest: {

            /* this shared-iterations executor distributes iterations among the vus mostly equally
               skipping this will then result in iteration sharing without following any specific rule.
               executor plays key role in deciding what properties we need to provide
            */
            executor: 'shared-iterations',

            /* Note that we have two separate functions for UI and Backend that will run parallely 
               exec tells us which functio to run
            */
            exec: 'browserTests',

            vus: 2,              /* For, UI, two users are enough */
            maxDuration: '1m',   /* We have maxDuration here */
            iterations: 4,

            /* here starts the actual browser configuration where we are gonna run these UI tests */
            options: {
                browser: {
                    type: 'chromium',
                    headless: false

                    /* other details like SSL certificates... */
                }
            }
        },

        /* We need to write separate scripts for this backend one */
        backendTest: {
            executor: 'constant-vus',  /* This is default executor if nothing is given. This type of executor means test will run for n iterations, so we don't need to give any specific number */
            exec: 'backEndStress',
            vus: 20,
            duration: '1m',
        }

    },

    thresholds: {
        checks: ['rate == 1.0'], /* everything should pass, no compromise on that */
    }
}

/* UI Tests - Playwright-like scripts */
export async function browserTests() {

    const context = await browser.newContext();  /* Open a fresh new incognito window */
    const page = await context.newPage();        /* Open a new tab on this incogntio window */

    /* Locators */
    const userNameInputBox = page.getByPlaceholder("Username");
    const passwordInputBox = page.getByPlaceholder("Password");
    const signInButton = page.locator(".submit.signInBtn");
    const messageAfterLogin = page.getByText("You are successfully logged in.");

    await page.goto(URL);

    await userNameInputBox.waitFor({ state: 'visible', timeout: 5000 });

    await userNameInputBox.fill(USERNAME);
    await passwordInputBox.fill(PASSWORD);
    await signInButton.click();

    await messageAfterLogin.waitFor({state: 'visible', timeout: 5000});
    
    console.log('---------------- LOGIN COMPLETED! ----------------');

    const headerText = await page.locator('h1').first().textContent();

    check(headerText, {
        verifyHeader: (text) => {
            return text.includes("Rahul Shetty Academy");
        }
    });

}

/* API tests to stress the backend parallely */
export async function backEndStress() {
    const requestResult = http.get(URL);

    check(requestResult, {
        "status is 200": (r) => {
            return r.status == 200
        }
    });
}

/* TERMINAL OUTPUT:



INFO[0006] ---------------- LOGIN COMPLETED! ----------------  source=console
INFO[0006] ---------------- LOGIN COMPLETED! ----------------  source=console
INFO[0012] ---------------- LOGIN COMPLETED! ----------------  source=console
INFO[0013] ---------------- LOGIN COMPLETED! ----------------  source=console
WARN[0049] Request Failed                                error="Get \"https://rahulshettyacademy.com/locatorspractice/\": dial tcp 13.201.9.53:443: connectex: A connection attempt failed because the connected party did not properly respond after a period of time, or established connection failed because connected host has failed to respond."


  █ THRESHOLDS

    checks
    ✗ 'rate == 1.0' rate=99.99%


  █ TOTAL RESULTS

    checks_total.......: 43304  657.233736/s
    checks_succeeded...: 99.99% 43303 out of 43304
    checks_failed......: 0.00%  1 out of 43304

    ✗ status is 200
      ↳  99% — ✓ 43299 / ✗ 1
    ✓ verifyHeader

    HTTP
    http_req_duration..............: avg=23.19ms  min=0s      med=22.51ms  max=343.49ms p(90)=26.44ms  p(95)=28.54ms
      { expected_response:true }...: avg=23.19ms  min=17.46ms med=22.51ms  max=343.49ms p(90)=26.44ms  p(95)=28.54ms
    http_req_failed................: 0.00%  1 out of 43300
    http_reqs......................: 43300  657.173027/s

    EXECUTION
    iteration_duration.............: avg=28.44ms  min=17.93ms med=22.74ms  max=21.02s   p(90)=26.91ms  p(95)=29.65ms
    iterations.....................: 43304  657.233736/s
    vus............................: 2      min=2          max=22
    vus_max........................: 22     min=22         max=22

    NETWORK
    data_received..................: 217 MB 3.3 MB/s
    data_sent......................: 5.8 MB 88 kB/s

    ---------------- BELOW METRICS IS WHAT WE NEED TO STUDY NOW ----------------

    BROWSER
    browser_data_received..........: 9.0 MB 136 kB/s
    browser_data_sent..............: 57 kB  869 B/s
    browser_http_req_duration......: avg=204.28ms min=878µs   med=161.26ms max=1.54s    p(90)=347.66ms p(95)=370.86ms
    browser_http_req_failed........: 0.00%  0 out of 145

    WEB_VITALS
    browser_web_vital_fcp..........: avg=1.33s    min=644ms   med=1.33s    max=2.02s    p(90)=2s       p(95)=2.01s
    browser_web_vital_fid..........: avg=849.99µs min=500µs   med=849.99µs max=1.19ms   p(90)=1.1ms    p(95)=1.15ms
    browser_web_vital_lcp..........: avg=1.37s    min=696ms   med=1.37s    max=2.05s    p(90)=2.04s    p(95)=2.05s
    browser_web_vital_ttfb.........: avg=862.72ms min=170.8ms med=866.1ms  max=1.54s    p(90)=1.53s    p(95)=1.54s



                                                                                                                                        
running (1m05.9s), 00/22 VUs, 43304 complete and 0 interrupted iterations                                                               
backendTest ✓ [======================================] 20 VUs  1m0s                                                                     
uiTest      ✓ [======================================] 2 VUs   0m13.9s/1m0s  4/4 shared iters                                           
ERRO[0066] thresholds on metrics 'checks' have been crossed

*/