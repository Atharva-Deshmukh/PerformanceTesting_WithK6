/* 
- Login to Grafanna cloud 
- Default project is created with free tier limits -> https://grafana.com/orgs/avdeshmukh
- Launch this default project
- Testing & synthetics > Performance > Projects > Default project > New test

- There is tab-wise steps written, in authenticate tab, we get a token
    k6 cloud login --token c3a77dd3b2550b76a08b6a60c1ed6e539f96b36f44b2380f9f3f620e9d8e5ae6
    This token helps us identify in which cloud account you want to run the tests   

    When u run this command, token is automatically saved in config, so when u login next time, 
    we can run tests directly

    terimal output:
    PS C:\REPOS\PerformanceTesting_WithK6\PerformanceTesting_WithK6> k6 cloud login --token c3a77dd3b2550b76a08b6a60c1ed6e539f96b36f44b2380f9f3f620e9d8e5ae6

    Logged in successfully, token and stack info saved in C:\Users\z004r8tj\AppData\Roaming\k6\config.json
    token: c3a77dd3b2550b76a08b6a60c1ed6e539f96b36f44b2380f9f3f620e9d8e5ae6
    stack-id: <not set>
    stack-url: <not set>
    default-project-id: <not set>
    PS C:\REPOS\PerformanceTesting_WithK6\PerformanceTesting_WithK6> 

- Now you go to Create a script tab, there we have a built in script with cloud{}, this is what we need to add 
  in our repo

  Code in the tab:

    import http from 'k6/http';
    import { sleep } from 'k6';

    export const options = {
    vus: 10,
    duration: '30s',
    cloud: {                         -----------------------> This part is important
        // Project: Default project
        projectID: 7308834,
        // Test runs with the same name groups test runs together.
        name: 'Test (18/04/2026-16:30:21)'
    }
    };

    export default function() {
    http.get('https://quickpizza.grafana.com');
    sleep(1);
    }

    Now, cloud runs on servers, we can also distribute our tests in specific country-wise servers.
    We can find this in official k6 docs

    export const options = {
        cloud: {
            distribution: {
            'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 34 },
            'amazon:gb:london': { loadZone: 'amazon:gb:london', percent: 33 },
            'amazon:au:sydney': { loadZone: 'amazon:au:sydney', percent: 33 },
            },
        },

        In free account, we can only use 1 zone

- How to run test in cloud?
  Open Run a test tab and there find a command -> k6 cloud run path to script


  OUTPUT

  PS C:\REPOS\PerformanceTesting_WithK6\PerformanceTesting_WithK6> k6 cloud run Tests\Test-14-RunningTestsOnGrafannaCloud.js

         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 


     execution: cloud
        script: Tests\Test-14-RunningTestsOnGrafannaCloud.js
        output: https://avdeshmukh.grafana.net/a/k6-app/runs/7309737

     scenarios: (100.00%) 1 scenario, 4 max VUs, 40s max duration (incl. graceful stop):
              * default: Up to 4 looping VUs for 10s over 3 stages (gracefulRampDown: 30s, gracefulStop: 30s)

INFO[0014] User atharva lN7H Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737
INFO[0015] User atharva lN7H authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0016] Order Placed for AD_Pizza R3Rd!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0017] User atharva yJzZ Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0017] Order Retrieved for AD_Pizza R3Rd!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0018] User atharva yJzZ authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0018] User atharva sXld Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0019] User atharva 8hOw Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0019] Order Placed for AD_Pizza uWu7!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0019] User atharva sXld authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0020] User atharva 8hOw authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737
INFO[0020] Order Retrieved for AD_Pizza uWu7!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0020] Order Placed for AD_Pizza mPLc!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0021] User atharva o7HJ Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0021] Order Placed for AD_Pizza XczG!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0021] User atharva pNEx Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0021] Order Retrieved for AD_Pizza mPLc!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0022] User atharva o7HJ authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0022] Order Retrieved for AD_Pizza XczG!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0022] User atharva pNEx authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0022] User atharva ganB Registered!                 detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0023] Order Placed for AD_Pizza 8Itg!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0023] Order Placed for AD_Pizza W3Ie!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0023] User atharva ganB authenticated!              detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0024] Order Retrieved for AD_Pizza 8Itg!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0024] Order Retrieved for AD_Pizza W3Ie!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0024] Order Placed for AD_Pizza b8EX!               detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737                                                                                               
INFO[0025] Order Retrieved for AD_Pizza b8EX!            detected_level=info instance_id=0 lz="amazon:us:ashburn" service_name=unknown_service source=console test_run_id=7309737
     test status: Finished

Run    [======================================] Finished

Run    [======================================] Finished


ANALYSIS from the overview visual graph: ReadMeImages/OVERVIEW GRAPH.png

response time (blue line) should be constant as load increases, this means system is stable
but here, we have increasing response time with increasing load

Failure rate (red line) must also be straight which it is and its should be 0

*/

import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Gauge } from 'k6/metrics';

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";
const latestOrderResponseTime = new Gauge('latest_order_response_time');  // Gauge: latest snapshot
const latestPizzaCalories = new Gauge('latest_pizza_calories'); 

export const options = {

    stages: [
        { duration: '3s', target: 2 },
        { duration: '4s', target: 4 },
        { duration: '3s', target: 0 },
    ],

    thresholds: {
        'checks': ['rate > 0.9'],
        'group_duration{group:::Place Order Workflow}': ['p(95) < 1500'],
        'latest_order_response_time': ['value < 1000'],
        'latest_pizza_calories': ['value < 2000'],
    },
    cloud: {
        projectID: 7308834,                  // Project: Default project
        name: 'AD_PerfTests_OnCloud',        // Test runs with the same name groups test runs together.
        distribution: {
            'amazon:us:ashburn': { loadZone: 'amazon:us:ashburn', percent: 100 },
            // In free account, we can only use 1 zone
            // 'amazon:gb:london': { loadZone: 'amazon:gb:london', percent: 33 },
            // 'amazon:au:sydney': { loadZone: 'amazon:au:sydney', percent: 33 },
        },
    },
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