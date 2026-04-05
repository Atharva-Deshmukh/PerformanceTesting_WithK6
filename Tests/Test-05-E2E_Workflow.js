import { sleep, check, group } from 'k6';
import http from 'k6/http';

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";

let authToken;

/* Workflow we coded:
   - Register user -> Login with that user -> Place order with that user -> Retrieve that order using order Id

   - We will use groups to segregate workflows and we can add thresholds for individual groups to track them
   - Since same user cannot be registered multiple times, we will generate unique user name for each iteration
   - The generated username should be shared for each iteration, hence it should be delcared inside default function


*/

export const options = {

    vus: 1,
    duration: '2s',

    thresholds: {
        'http_req_duration': ['p(95) < 400'],
        'http_req_failed': ['rate < 0.1'],
        'http_req_duration{group:::User Registration Workflow}': ['p(95) < 400'], // Group Thresholds
        'http_req_duration{group:::User Login Workflow}': ['p(95) < 400'], // Group Thresholds
    }
}

/* The login API will fail for more duration or multiple vus

  1. Why authentication fails intermittently
     The QuickPizza demo API is rate-limiting or rejecting rapid repeated logins with the same credentials.
      With duration: 2s you get ~1-2 iterations, so it works. With duration: 4s you get 5 iterations — 
      the API starts returning { error: "authentication failed" } for some requests because you're 
      hammering the login endpoint with the same user too quickly.

      This is common behavior — authentication endpoints often have rate limiting / brute-force protection. 
      You can see from the output that it alternates: fail → success → fail → fail → success.
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

    let USERNAME = "atharva" + generateRandomString(4);

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

            /* User registration endpoint response: 
               {
                    "id": 3284,
                    "username": "a"
               }
            */

            "Status is 201": (r) => { return r.status == 200 },
            "Response Contains valid UserId": (r) => { return r.json('id') !== undefined },
            "Response Contains payload username": (r) => { return r.json('username') == USERNAME },

            /*
            "Response body has auth token": (r) => {
                 Way-1: To get token

                    const body = JSON.parse(r.body);
                    if (body.token && body.token.length > 0) {
                        authToken = "Bearer " + body.token;
                        return true;
                    }
                    return false;
            }
            */
        });

        if (userRegistrationSuccess) {
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

            /*
            "Response body has auth token": (r) => {
                 Way-1: To get token

                    const body = JSON.parse(r.body);
                    if (body.token && body.token.length > 0) {
                        authToken = "Bearer " + body.token;
                        return true;
                    }
                    return false;
            }
            */
        });

        if (userLoginSuccess) {
            authToken = loginResonse.json('token'); /* Grab token if login successfull */
            console.log(`User ${USERNAME} authenticated!`);
        }
        else console.error(`User Authentication Failed. User: ${USERNAME} | ${loginResonse.status} - ${loginResonse.body}`);

        sleep(1);
    });
}