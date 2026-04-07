import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Rate } from 'k6/metrics';


/* Use case:
   - We need to know like what % of login requests made pass?

   We cannot use checks here as checks does the grand total of all the checks and gives us aggragate ratio

   We also cannot use tags, since tags is at the individual request level, not at individual checks level

   To get the individual ratio, we can use rate custom metric

   Rate metric comes from k6 metric's Rate class. All rates are calculated from 0 to 1

   Working:
   - Whenever login succeeds and all its checks pass, we have a variable that stores true or false
   - add(1) when variable's value is true, else add(0)

   Let's say there were 5 iterations and value stored each time ->  1 0 1 0 0 
                                                                -> 2 / 5 success (rate will internally sum 1s)
                                                                -> 0.4 (our metric value in terminal)
*/

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";
const authenticationRate = new Rate('authentication_rate');

export const options = {

    stages: [
        {duration: '3s', target: 2},
        {duration: '4s', target: 4},
        {duration: '3s', target: 0},
    ],

    thresholds: {
        'checks': ['rate > 0.9'], // nearly all checks should pass
        'group_duration{group:::Place Order Workflow}': ['p(95) < 1500'],
        'authentication_rate': ['rate > 0.9']  // our custom rate metric / kind of custom check
    }
}

/* Terminal Output with this threshold



  █ THRESHOLDS

    authentication_rate
    ✓ 'rate > 0.9' rate=100.00%

    checks
    ✓ 'rate > 0.9' rate=100.00%

    group_duration{group:::Place Order Workflow}
    ✓ 'p(95) < 1500' p(95)=1.45s


  █ TOTAL RESULTS

    checks_total.......: 90      6.108671/s
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
    authentication_rate............: 100.00% 6 out of 6

    HTTP
    http_req_duration..............: avg=386.29ms min=293.14ms med=363.38ms max=717.24ms p(90)=493.4ms p(95)=640.5ms
      { expected_response:true }...: avg=386.29ms min=293.14ms med=363.38ms max=717.24ms p(90)=493.4ms p(95)=640.5ms
    http_req_failed................: 0.00%   0 out of 24
    http_reqs......................: 24      1.628979/s


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
            authenticationRate.add(1);

            authToken = loginResonse.json('token');
            console.log(`User ${USERNAME} authenticated!`);
        }
        else {
            authenticationRate.add(0);

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