import { sleep, check, group } from 'k6';
import http from 'k6/http';

const BASE_URL = "https://quickpizza.grafana.com/api";
const PASSWORD = "admin1234";

let authToken;

export const options = {

    stages: [
        {duration: '3s', target: 2},
        {duration: '4s', target: 4},
        {duration: '3s', target: 0},
    ],

    thresholds: {
        'http_req_duration': ['p(95) < 400'],
        'iteration_duration': ['p(95) < 4000'],
        'checks': ['rate > 0.9'] // nearly all checks should pass
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
}