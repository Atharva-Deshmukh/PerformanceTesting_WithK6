import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Gauge } from 'k6/metrics';


/* Use case:

    - You want to know the calorie value of the most recently created pizza. 
    - Track the latest API response time for order creation.
    - Track the current number of items in an order.

   Gauge is a snapshot metric, not cumulative like Counter or aggregate like Rate.
   A Gauge tracks a value at a specific point in time — it can go up or down, 
   and only the last/latest value matters (along with min/max).
*/

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";
const latestOrderResponseTime = new Gauge('latest_order_response_time');  // Gauge: latest snapshot
const latestPizzaCalories = new Gauge('latest_pizza_calories'); 

export const options = {

    stages: [
        {duration: '3s', target: 2},
        {duration: '4s', target: 4},
        {duration: '3s', target: 0},
    ],

    thresholds: {
        'checks': ['rate > 0.9'], // nearly all checks should pass
        'group_duration{group:::Place Order Workflow}': ['p(95) < 1500'],
        'latest_order_response_time': ['value < 1000'],  // "value" is used with Gauge
        'latest_pizza_calories': ['value < 2000'],        // latest pizza should be under 2000 cal
}
}

/* Terminal Output with this threshold
 

  █ THRESHOLDS

    latest_order_response_time
    ✓ 'value < 1000' value=315.4289

    latest_pizza_calories
    ✓ 'value < 2000' value=0


  █ TOTAL RESULTS

    checks_total.......: 90      6.198279/s
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
    latest_order_response_time.....: 315.4289 min=310.76  max=345.3659
    latest_pizza_calories..........: 0        min=0       max=0
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

        // Gauge: record the latest response time for this endpoint
        latestOrderResponseTime.add(createPizzaResponse.timings.duration);

        orderCreatedSuccess = check(createPizzaResponse, {

            "Status is 200": (r) => { return r.status == 200 },
            "Response Contains Order id": (r) => { return r.json('pizza.id') !== undefined },
            "Response Contains Pizza name": (r) => { return r.json('pizza.name') !== undefined },
            "Pizza name is same as payload": (r) => { return r.json('pizza.name') == pizzaName },
        });

        if (orderCreatedSuccess === true) {

            orderId = createPizzaResponse.json('pizza.id'); /* Store the order Id */
            console.log(`Order Placed for ${pizzaName}!`);

            // Gauge: record the latest pizza's calorie count
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