import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Rate, Counter, Gauge } from 'k6/metrics';


/* ═══════════════════════════════════════════════════════════════════════════════
                          CUSTOM METRICS THEORY
   ═══════════════════════════════════════════════════════════════════════════════
   ─────────────────────────────────────
   RATE (authentication_rate)
   ─────────────────────────────────────

   Use case: What % of login requests pass?

   - We cannot use 'checks' here because checks gives aggregate ratio of ALL checks combined
   - We cannot use tags either — tags work at individual request level, not individual checks level
   - Rate gives us individual ratio for a specific condition

   Working:
   - Whenever login succeeds → add(1), else → add(0)
   - Let's say 5 iterations: 1 0 1 0 0 → 2/5 success → rate = 0.4

   Rate metric is calculated from 0 to 1.

   ─────────────────────────────────────
   COUNTER (orderSuccess_Counter)
   ─────────────────────────────────────

   Use case: How many orders were created during the test run?

   - Counter keeps increasing over time (cumulative)
   - Use when we have requirements around total number of something
   - Whenever target requirement succeeds → add(1)
   - In the report, it prints the total count

   ─────────────────────────────────────
   GAUGE (latest_order_response_time, latest_pizza_calories)
   ─────────────────────────────────────

   Use case:
   - Track the calorie value of the MOST RECENTLY created pizza
   - Track the LATEST API response time for order creation

   - Gauge is a snapshot metric — not cumulative like Counter or aggregate like Rate
   - It tracks a value at a specific point in time — can go up or down
   - Only the last/latest value matters (report also shows min/max across all samples)

   ═══════════════════════════════════════════════════════════════════════════════ */


const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";

// Rate: tracks % of successful logins
const authenticationRate = new Rate('authentication_rate');

// Counter: tracks total successful orders
const orderSuccessCounter = new Counter('orderSuccess_Counter');

// Gauge: tracks latest snapshot values
const latestOrderResponseTime = new Gauge('latest_order_response_time');
const latestPizzaCalories = new Gauge('latest_pizza_calories');


export const options = {

    stages: [
        {duration: '3s', target: 2},
        {duration: '4s', target: 4},
        {duration: '3s', target: 0},
    ],

    thresholds: {
        'checks': ['rate > 0.9'],

        // Group threshold
        'group_duration{group:::Place Order Workflow}': ['p(95) < 1500'],

        // Rate threshold — "rate" keyword
        'authentication_rate': ['rate > 0.9'],

        // Counter threshold — "count" keyword
        'orderSuccess_Counter': ['count > 5'],

        // Gauge thresholds — "value" keyword
        'latest_order_response_time': ['value < 1000'],
        'latest_pizza_calories': ['value < 2000'],
    }
}


function generateRandomString(length) {
    const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345678";
    const charSetLength = charSet.length;

    let result = "";
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSetLength));
    }

    return result;
}

export default function() {

    let USERNAME = "atharva " + generateRandomString(4);
    let pizzaName = "AD_Pizza " + generateRandomString(4);
    let orderId, authToken;

    group('User Registration Workflow', () => {

        let userRegistrationSuccess = false;

        const userRegristrationPayload = {
            username: USERNAME,
            password: PASSWORD
        };

        const userRegistrationParams = {
            headers: { "Content-Type": "application/json" }
        };

        const userRegistrationResp = http.post(`${BASE_URL}/users`, JSON.stringify(userRegristrationPayload), userRegistrationParams);

        userRegistrationSuccess = check(userRegistrationResp, {
            "Status is 201": (r) => { return r.status == 201 },
            "Response Contains valid UserId": (r) => { return r.json('id') !== undefined },
            "Response Contains payload username": (r) => { return r.json('username') == USERNAME },
        });

        if (userRegistrationSuccess === true) {
            console.log(`User ${USERNAME} Registered!`);
        }
        else console.error(`User Registration Failed. User: ${USERNAME} | ${userRegistrationResp.status} - ${userRegistrationResp.body}`);

        sleep(1);
    });

    group('User Login Workflow', () => {

        let userLoginSuccess = false;

        const loginPayload = {
            username: USERNAME,
            password: PASSWORD
        };

        const loginParams = {
            headers: { "Content-Type": "application/json" }
        };

        const loginResonse = http.post(`${BASE_URL}/users/token/login`, JSON.stringify(loginPayload), loginParams);

        userLoginSuccess = check(loginResonse, {

            "Status is 200": (r) => { return r.status == 200 },
            "Response Contains Token": (r) => { return r.json('token') !== undefined },
            "Token is a valid string": (r) => { return r.json('token').length > 4 },
        });

        if (userLoginSuccess) {
            authenticationRate.add(1);  // ← RATE: login succeeded

            authToken = loginResonse.json('token');
            console.log(`User ${USERNAME} authenticated!`);
        }
        else {
            authenticationRate.add(0);  // ← RATE: login failed

            console.error(`User Authentication Failed. User: ${USERNAME} | ${loginResonse.status} - ${loginResonse.body}`);
        }

        sleep(1);
    });

    group('Place Order Workflow', () => {

        let orderCreatedSuccess = false;

        const createOrderPayload = {

            customName: pizzaName,
            excludedIngredients: [],
            excludedTools: [
                "Scissors"
            ],
            maxCaloriesPerSlice: 999,
            maxNumberOfToppings: 5,
            minNumberOfToppings: 2,
            mustBeVegetarian: true
        };

        const params = {
            headers: { "Authorization": "Bearer " + authToken, "Content-Type": "application/json" }
        };

        const createPizzaResponse = http.post(`${BASE_URL}/pizza`, JSON.stringify(createOrderPayload), params);

        // GAUGE: record the latest response time for this endpoint
        latestOrderResponseTime.add(createPizzaResponse.timings.duration);

        orderCreatedSuccess = check(createPizzaResponse, {

            "Status is 200": (r) => { return r.status == 200 },
            "Response Contains Order id": (r) => { return r.json('pizza.id') !== undefined },
            "Response Contains Pizza name": (r) => { return r.json('pizza.name') !== undefined },
            "Pizza name is same as payload": (r) => { return r.json('pizza.name') == pizzaName },
        });

        if (orderCreatedSuccess === true) {

            orderSuccessCounter.add(1);  // ← COUNTER: increment order count

            orderId = createPizzaResponse.json('pizza.id');
            console.log(`Order Placed for ${pizzaName}!`);

            // GAUGE: record the latest pizza's calorie count
            const calories = createPizzaResponse.json('pizza.calories');
            if (calories !== undefined) latestPizzaCalories.add(calories);
        }
        else console.error(`Placing Order Failed. Pizza: ${pizzaName} | ${createPizzaResponse.status} - ${createPizzaResponse.body}`);

        sleep(1);
    });

    group('Retrieve Order Workflow', () => {

        let orderRetrieveSuccess = false;

        const params = {
            headers: {
                "Authorization": "Bearer " + authToken,
                "Content-Type": "application/json",
                "Select": '{"id", "name", "dough", "ingredients", "tool", "calories", "vegetarian"}'
            }
        };

        const retrieveOrderResponse = http.get(`${BASE_URL}/pizza/${orderId}`, params);

        orderRetrieveSuccess = check(retrieveOrderResponse, {

            "Status is 200": (r) => { return r.status == 200 },
            "Response Contains Order id": (r) => { return r.json('id') !== undefined },
            "Response Id is same as orderId stored": (r) => { return r.json('id') == orderId },
            "Response Contains Pizza name": (r) => { return r.json('name') !== undefined },
            "Pizza name is same as payload": (r) => { return r.json('name') == pizzaName },
        });

        if (orderRetrieveSuccess === true) {
            console.log(`Order Retrieved for ${pizzaName}!`);
        }
        else console.error(`Order Retrieval Failed. Pizza: ${pizzaName} | ${retrieveOrderResponse.status} - ${retrieveOrderResponse.body}`);

        sleep(1);
    });
}


/* ═══════════════════════════════════════════════════════════════════════════════
                          COMBINED TERMINAL OUTPUT
   ═══════════════════════════════════════════════════════════════════════════════


  █ THRESHOLDS

    authentication_rate
    ✓ 'rate > 0.9' rate=100.00%

    checks
    ✓ 'rate > 0.9' rate=100.00%

    group_duration{group:::Place Order Workflow}
    ✓ 'p(95) < 1500' p(95)=1.33s

    latest_order_response_time
    ✓ 'value < 1000' value=315.42

    latest_pizza_calories
    ✓ 'value < 2000' value=0

    orderSuccess_Counter
    ✓ 'count > 5' count=6


  █ TOTAL RESULTS

    checks_total.......: 90      6.1/s
    checks_succeeded...: 100.00% 90 out of 90
    checks_failed......: 0.00%   0 out of 90

    ✓ Status is 201
    ✓ Response Contains valid UserId
    ✓ Response Contains payload username
    ✓ Status is 200
    ✓ Response Contains Token
    ✓ Token is a valid string
    ✓ Response Contains Order id
    ✓ Response Contains Pizza name
    ✓ Pizza name is same as payload
    ✓ Response Id is same as orderId stored

    CUSTOM
    authentication_rate............: 100.00% 6 out of 6       ← Rate: % of successful logins
    latest_order_response_time.....: 315.42  min=310  max=345 ← Gauge: latest snapshot + min/max
    latest_pizza_calories..........: 0       min=0    max=0   ← Gauge: latest snapshot + min/max
    orderSuccess_Counter...........: 6       0.41/s           ← Counter: cumulative total

    HTTP
    http_req_duration..............: avg=359ms min=293ms med=363ms max=717ms p(90)=493ms p(95)=640ms
      { expected_response:true }...: avg=359ms min=293ms med=363ms max=717ms p(90)=493ms p(95)=640ms
    http_req_failed................: 0.00% 0 out of 24
    http_reqs......................: 24    1.63/s

    EXECUTION
    iteration_duration.............: avg=5.86s   min=5.4s   med=6.01s  max=6.27s  p(90)=6.19s  p(95)=6.23s
    iterations.....................: 6     0.41/s
    vus............................: 1     min=1       max=4
    vus_max........................: 4     min=4       max=4

*/
