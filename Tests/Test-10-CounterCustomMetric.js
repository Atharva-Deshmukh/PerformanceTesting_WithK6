import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';


/* Use case:
   - We need to know like how many orders were created during 10s of script run

   We can use Counter custom metric here.
   Counter keeps increasing the count over the time.

   Use this metric when we have requirements around total number of something.

   Whenever our target requirement succeeds, add(1) to this metric

   In the end, in report terminal, it will print the count
*/

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";
const orderSuccessCounter = new Counter('orderSuccess_Counter');

export const options = {

    stages: [
        {duration: '3s', target: 2},
        {duration: '4s', target: 4},
        {duration: '3s', target: 0},
    ],

    thresholds: {
        'checks': ['rate > 0.9'], // nearly all checks should pass
        'group_duration{group:::Place Order Workflow}': ['p(95) < 1500'],
        'orderSuccess_Counter': ['count > 5']  // count is something we are seeing first time
    }                                          // count is to be used with Counter()
                                              // I am here expecting at least 5 orders to be created successfully
}

/* Terminal Output with this threshold
 
  █ THRESHOLDS

    checks
    ✓ 'rate > 0.9' rate=100.00%

    group_duration{group:::Place Order Workflow}
    ✓ 'p(95) < 1500' p(95)=1.39s

    orderSuccess_Counter
    ✓ 'count > 5' count=6


  █ TOTAL RESULTS

    checks_total.......: 90      6.200617/s
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
    orderSuccess_Counter...........: 6     0.413374/s

    HTTP
    http_req_duration..............: avg=348.3ms min=292.07ms med=360.08ms max=416.88ms p(90)=381.85ms p(95)=385.89ms
      { expected_response:true }...: avg=348.3ms min=292.07ms med=360.08ms max=416.88ms p(90)=381.85ms p(95)=385.89ms
    http_req_failed................: 0.00% 0 out of 24
    http_reqs......................: 24    1.653498/s

    EXECUTION
    iteration_duration.............: avg=5.86s   min=5.4s     med=6.01s    max=6.27s    p(90)=6.19s    p(95)=6.23s
    iterations.....................: 6     0.413374/s
    vus............................: 1     min=1       max=4
    vus_max........................: 4     min=4       max=4

    NETWORK
    data_received..................: 34 kB 2.4 kB/s
    data_sent......................: 15 kB 1.0 kB/s
                                                                                                                                  
running (14.5s), 0/4 VUs, 6 complete and 0 interrupted iterations                                                                       
default ✓ [======================================] 0/4 VUs  10s          

*/

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
    let pizzaName = "AD_Pizza " + generateRandomString(4); /* Random Pizza name */
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
            authToken = loginResonse.json('token');
            console.log(`User ${USERNAME} authenticated!`);
        }
        else {
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
            ], // ["Scissors", "Knife", "Pizza cutter"]
            maxCaloriesPerSlice: 999,
            maxNumberOfToppings: 5,
            minNumberOfToppings: 2,
            mustBeVegetarian: true
        };

        const params = {
            headers: { "Authorization": "Bearer " + authToken, "Content-Type": "application/json" } /* token helps request identify the user */
        };

        const createPizzaResponse = http.post(`${BASE_URL}/pizza`, JSON.stringify(createOrderPayload), params);

        orderCreatedSuccess = check(createPizzaResponse, {

            "Status is 200": (r) => { return r.status == 200 },
            "Response Contains Order id": (r) => { return r.json('pizza.id') !== undefined },
            "Response Contains Pizza name": (r) => { return r.json('pizza.name') !== undefined },
            "Pizza name is same as payload": (r) => { return r.json('pizza.name') == pizzaName },
        });

        if (orderCreatedSuccess === true) {

            orderSuccessCounter.add(1);

            orderId = createPizzaResponse.json('pizza.id'); /* Store the order Id */
            console.log(`Order Placed for ${pizzaName}!`);
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