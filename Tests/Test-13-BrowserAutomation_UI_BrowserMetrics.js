/*                                              Important Web vitals


First Contentful Paint (FCP):
- It measures time until the first text/image appears on the page (generally after the first pixel visible)
- For User: When Will I see anything on the page?

- Add in threshold{}: browser_web_vital_fcp: ['p(95) < 3000'],

Largest Contentful Paint (LCP):
- It measures time until the largest visible content element is measured
- For User: When is the main content visible?
- When FCP = LCP ==> Entire component is being rendered instantly

- Add in threshold{}: browser_web_vital_lcp: ['p(95) < 3000'],

Cumulative Layout Shift (CLS):
- Real-World Example
  Imagine you're reading a news article on your phone. You find the paragraph you want 
  and tap a link. But right as your finger touches the screen, an ad loads above the paragraph, 
  pushing everything down. You accidentally tap the ad instead.

- When we apply load on a page heavily, page rendering is impacted heavily

-  It quantifies visual stability — not speed.
   Score: It's a unitless value (not milliseconds). 
   A good score is < 0.1**, poor is **> 0.25. 

- Add in threshold{}: browser_web_vital_cls: ['rate < 0.1'],

- To keep CLS low, one way is to have reserved space for adds rather than dynamic UI rendering

First Input Delay (FID):
- FID measures how long the browser takes to respond to the user's first interaction (click, tap, key press). 
- It captures the delay between the user's action and the browser actually starting to process it.
- For User: How long until the page responds my click?

Example: You open a shopping website. The page looks fully loaded — you see the "Add to Cart" 
         button and click it. But nothing happens for 500ms because the browser's main thread 
         is busy executing a heavy JavaScript bundle in the background.

...it can't respond to user input until the current task finishes. The user is left waiting.

[====== JS parsing (long task) ======]
                          ^ User clicks here
                          |--- FID ---|
                                      ^ Browser starts handling click

- Add in threshold{}: browser_web_vital_fid: ['p(95) < 3000'],

Time To First Byte (TTFB):
- measures the time from when the browser sends a request to when it receives the very first byte 
of the response from the server. It reflects the server's responsiveness — everything that happens 
before any content starts arriving.

- For User: How fast is the server?

- Add in threshold{}: browser_web_vital_ttfb: ['p(95) < 3000'],

- In our below code, its not accurrate as we are not using any server. 
  Use any server or just use a website to get this value accurately



*/

import { browser } from 'k6/browser';
import http from 'k6/http';
import { check } from 'k6';

const USERNAME = "rahul";
const PASSWORD = "rahulshettyacademy";
const URL = "https://rahulshettyacademy.com/locatorspractice/";

export const options = {
    scenarios: {

        uiTest: {
            executor: 'shared-iterations',
            exec: 'browserTests',

            vus: 2,  
            maxDuration: '1m',
            iterations: 4,

            options: {
                browser: {
                    type: 'chromium',
                    headless: false
                }
            }
        },

        backendTest: {
            executor: 'constant-vus',
            exec: 'backEndStress',
            vus: 20,
            duration: '1m',
        }

    },

    thresholds: {
        'checks': ['rate == 1.0'], 

        /* Note that these metrics below are aggregate for all the UI pages being tested 
           For targetting specific UI page, we don't have tagging for browser tests,
           Instead we have a workaround, different page means genrally different URL,
           So, we tag by URL
        */

        'browser_web_vital_fcp': ['p(95) < 3000'], // First Content
        'browser_web_vital_lcp': ['p(95) < 3000'], // Main Content
        'browser_web_vital_lcp{url: https://rahulshettyacademy.com/locatorspractice/}': ['p(95) < 3000'], // Main Content (page/URL specific)
        'browser_web_vital_cls': ['p(95) < 0.1'],  // Layout stability
        'browser_web_vital_fid': ['p(95) < 3000'], // Interactivity
        'browser_web_vital_ttfb': ['p(95) < 3000'],// Server Response
    }
}

export async function browserTests() {

    const context = await browser.newContext();
    const page = await context.newPage();  

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

export async function backEndStress() {
    const requestResult = http.get(URL);

    check(requestResult, {
        "status is 200": (r) => {
            return r.status == 200
        }
    });
}

/* TERMINAL OUTPUT:


INFO[0008] ---------------- LOGIN COMPLETED! ----------------  source=console
INFO[0008] ---------------- LOGIN COMPLETED! ----------------  source=console
INFO[0016] ---------------- LOGIN COMPLETED! ----------------  source=console
INFO[0022] ---------------- LOGIN COMPLETED! ----------------  source=console


  █ THRESHOLDS

    browser_web_vital_cls
    ✓ 'p(95) < 0.1' p(95)=0

    browser_web_vital_fcp
    ✓ 'p(95) < 3000' p(95)=1.82s

    browser_web_vital_fid
    ✓ 'p(95) < 3000' p(95)=1.28ms

    browser_web_vital_lcp
    ✓ 'p(95) < 3000' p(95)=1.88s

      {url: https://rahulshettyacademy.com/locatorspractice/}
      ✓ 'p(95) < 3000' p(95)=1.88s

    browser_web_vital_ttfb
    ✓ 'p(95) < 3000' p(95)=1.07s

    checks
    ✓ 'rate == 1.0' rate=100.00%


  █ TOTAL RESULTS

    checks_total.......: 38754   634.472103/s
    checks_succeeded...: 100.00% 38754 out of 38754
    checks_failed......: 0.00%   0 out of 38754

    ✓ status is 200
    ✓ verifyHeader

    HTTP
    http_req_duration.............................................: avg=27.13ms  min=17.45ms  med=22.55ms  max=508.06ms p(90)=34.12ms  p(95)=47.21ms
      { expected_response:true }..................................: avg=27.13ms  min=17.45ms  med=22.55ms  max=508.06ms p(90)=34.12ms  p(95)=47.21ms
    http_req_failed...............................................: 0.00%  0 out of 38750
    http_reqs.....................................................: 38750  634.406616/s

    EXECUTION
    iteration_duration............................................: avg=31.66ms  min=17.45ms  med=22.89ms  max=10.72s   p(90)=35.9ms   p(95)=53.41ms
    iterations....................................................: 38754  634.472103/s
    vus...........................................................: 1      min=1          max=22
    vus_max.......................................................: 22     min=22         max=22

    NETWORK
    data_received.................................................: 194 MB 3.2 MB/s
    data_sent.....................................................: 5.2 MB 85 kB/s

    BROWSER
    browser_data_received.........................................: 9.0 MB 147 kB/s
    browser_data_sent.............................................: 60 kB  980 B/s
    browser_http_req_duration.....................................: avg=353.27ms min=1.03ms   med=219.81ms max=6.65s    p(90)=577.05ms p(95)=639.42ms
    browser_http_req_failed.......................................: 0.00%  0 out of 144

    WEB_VITALS
    browser_web_vital_cls.........................................: avg=0        min=0        med=0        max=0        p(90)=0        p(95)=0
    browser_web_vital_fcp.........................................: avg=1.3s     min=780ms    med=1.29s    max=1.82s    p(90)=1.81s    p(95)=1.82s
    browser_web_vital_fid.........................................: avg=1.04ms   min=599.99µs med=1.14ms   max=1.29ms   p(90)=1.26ms   p(95)=1.28ms
    browser_web_vital_lcp.........................................: avg=1.37s    min=864ms    med=1.36s    max=1.89s    p(90)=1.88s    p(95)=1.88s
      { url: https://rahulshettyacademy.com/locatorspractice/ }...: avg=1.37s    min=864ms    med=1.36s    max=1.89s    p(90)=1.88s    p(95)=1.88s
    browser_web_vital_ttfb........................................: avg=580.57ms min=101.8ms  med=565.5ms  max=1.08s    p(90)=1.06s    p(95)=1.07s
                                                                                                                                    
running (1m01.1s), 00/22 VUs, 38754 complete and 0 interrupted iterations                                                               
backendTest ✓ [======================================] 20 VUs  1m0s                                                                     
uiTest      ✓ [======================================] 2 VUs   0m23.3s/1m0s  4/4 shared iters     

*/