import { sleep, check, group } from 'k6';
import http from 'k6/http';


/* Below is the Complete E2E workflow: Registration, Login, Place order, Retrieve order

   In real time projects, k6 is used to get the metrics for specific business workflows
   We do this by using metrics for groups to segregate the groups' metrics
*/

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";

function generateRandomString(length) {
    const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345678";
    const charSetLength = charSet.length;

    let result = "";
    for (let i = 0; i < length; i++) {
        result += charSet.charAt(Math.floor(Math.random() * charSetLength));
    }

    return result;
}

export const options = {

    stages: [
        {duration: '3s', target: 2},
        {duration: '4s', target: 4},
        {duration: '3s', target: 0},
    ],

    thresholds: {
        'checks': ['rate > 0.9'], // nearly all checks should pass
        'group_duration{group:::Place Order Workflow}': ['p(95) < 1500']
    }
}

export default function() {

    let USERNAME = "atharva " + generateRandomString(4);
    let pizzaName = "AD_Pizza " + generateRandomString(4); /* Random Pizza name */
    let orderId, authToken;

    /* Groups inside the default function execute synchronously and sequentially — in the exact order they appear in code. */

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
        else console.error(`User Authentication Failed. User: ${USERNAME} | ${loginResonse.status} - ${loginResonse.body}`);

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
                        /* token helps request identify the user */
            headers: { "Authorization": "Bearer " + authToken, "Content-Type": "application/json" }
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

/* Terminal Output with this threshold


     scenarios: (100.00%) 1 scenario, 4 max VUs, 40s max duration (incl. graceful stop):
              * default: Up to 4 looping VUs for 10s over 3 stages (gracefulRampDown: 30s, gracefulStop: 30s)

INFO[0001] User atharva ZQ1g Registered!                 source=console
INFO[0002] User atharva ZQ1g authenticated!              source=console
INFO[0004] Order Placed for AD_Pizza VBST!               source=console
INFO[0004] User atharva SXWX Registered!                 source=console
INFO[0005] Order Retrieved for AD_Pizza VBST!            source=console
INFO[0005] User atharva SXWX authenticated!              source=console
INFO[0006] User atharva q7H4 Registered!                 source=console
INFO[0006] User atharva Fx15 Registered!                 source=console
INFO[0007] Order Placed for AD_Pizza TOMN!               source=console
INFO[0007] User atharva q7H4 authenticated!              source=console
INFO[0008] User atharva pZXX Registered!                 source=console
INFO[0008] User atharva Fx15 authenticated!              source=console                                                                 
INFO[0008] Order Retrieved for AD_Pizza TOMN!            source=console                                                                 
INFO[0008] Order Placed for AD_Pizza fDob!               source=console
INFO[0009] Order Placed for AD_Pizza zxfK!               source=console
INFO[0009] User atharva ouDE Registered!                 source=console
INFO[0009] User atharva pZXX authenticated!              source=console                                                                 
INFO[0010] Order Retrieved for AD_Pizza fDob!            source=console
INFO[0011] Order Retrieved for AD_Pizza zxfK!            source=console
INFO[0011] Order Placed for AD_Pizza 6DxK!               source=console
INFO[0011] User atharva ouDE authenticated!              source=console
INFO[0012] Order Retrieved for AD_Pizza 6DxK!            source=console
INFO[0012] Order Placed for AD_Pizza m3A7!               source=console                                                                 
INFO[0013] Order Retrieved for AD_Pizza m3A7!            source=console


  █ THRESHOLDS

    checks
    ✓ 'rate > 0.9' rate=100.00%

    group_duration{group:::Place Order Workflow}
    ✓ 'p(95) < 1500' p(95)=1.33s


  █ TOTAL RESULTS

    checks_total.......: 90      6.112868/s
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

    HTTP
    http_req_duration..............: avg=359.07ms min=300.74ms med=363.65ms max=431.35ms p(90)=408.78ms p(95)=410.74ms
      { expected_response:true }...: avg=359.07ms min=300.74ms med=363.65ms max=431.35ms p(90)=408.78ms p(95)=410.74ms
    http_req_failed................: 0.00% 0 out of 24
    http_reqs......................: 24    1.630098/s

    EXECUTION
    iteration_duration.............: avg=5.98s    min=5.44s    med=6.11s    max=6.4s     p(90)=6.34s    p(95)=6.37s
    iterations.....................: 6     0.407525/s
    vus............................: 1     min=1       max=4
    vus_max........................: 4     min=4       max=4

    NETWORK
    data_received..................: 35 kB 2.4 kB/s
    data_sent......................: 15 kB 1.0 kB/s



                                                                                                                                        
running (14.7s), 0/4 VUs, 6 complete and 0 interrupted iterations                                                                       
default ✓ [======================================] 0/4 VUs  10s 

*/