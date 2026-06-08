/* 
- an executor controls how virtual users (VUs) and iterations are scheduled during a test

                                                                shared-iterations
                                                                -----------------

- A fixed number of iterations is shared across all VUs.

    export const options = {
        scenarios: {
            test: {
                executor: 'shared-iterations',
                vus: 10,
                iterations: 1000,
            },
        },
    };

    - 10 VUs execute a total of 1000 iterations.
    - VUs are fixed at the start of the test
    - Iterations are not guaranteed to be evenly distributed with this executor. 
    - VU that executes faster will complete more iterations than slower VUs.
    - Test ends when all iterations are completed.

    Use when
    - suitable when you want a specific number of VUs to complete a fixed number of total iterations
    - the amount of iterations per VU is unimportant, and time to complete the iterations is the concern


                                                            per-vu-iterations
                                                            -----------------

- Each VU executes a fixed number of iterations.

    export const options = {
        scenarios: {
            test: {
                executor: 'per-vu-iterations',
                vus: 10,
                iterations: 100,
            },
        },
    };

    - Every VU runs exactly 100 iterations. Total iterations = 10 × 100 = 1000.

    Use when
    - You need equal work per user.
    - Data-driven testing


                                                            constant-vus
                                                            ------------

- Fixed number of VUs execute as many iterations as possible for a specified amount of time.

    export const options = {
        scenarios: {
                test: {
                    executor: 'constant-vus',
                    vus: 50,
                    duration: '5m',  // here we have duration, earlier we had iteration
                },
        },
    };

   - 50 concurrent virtual users run continuously for 5 minutes.
   - More iterations are generated if the system responds faster.

    Use when
    -  if you need a specific number of VUs to run for a certain amount of time.4
    - Concurrency testing


                                                            ramping-vus
                                                            -----------

- Gradually increases or decreases the number of VUs over time.
- stages[] is just a shorthand for the ramping-vus executor, but stages[] alone don't have any customisation options
  we also have less control there.

    export const options = {
        scenarios: {
            test: {
                executor: 'ramping-vus',
                    startVUs: 0, // Number of VUs to run at test start.
                    stages: [
                        { duration: '2m', target: 50 },
                        { duration: '5m', target: 50 },
                        { duration: '2m', target: 0 },
                    ],
                },
        },
    };

    - Ramps up to 50 users.
    - Holds at 50 users.
    - Ramps down to 0 users.

    Use when
    - Simulating realistic traffic growth and decline.
    - Stress and spike testing


                                                        constant-arrival-rate
                                                        ---------------------

- Starts iterations at a constant rate, independent of response time.

    export const options = {
        scenarios: {
                test: {
                    executor: 'constant-arrival-rate',
                    rate: 100,                              // How many iterations per timeUnit
                    timeUnit: '1s',                         // Start `rate` iterations per second
                    duration: '1m',                         // How long the test lasts
                    preAllocatedVUs: 2,                     // Pre-allocate 2 VUs before starting the test
                }, 
        },
    };

    - Starts 100 iterations every second.
    - k6 automatically adjusts VUs to maintain the configured rate.

    Use when
    - Testing a specific Requests Per Second (RPS) target.
    - Simulating traffic arriving at a fixed rate.
    - best for API throughput testing

                                                        ramping-arrival-rate
                                                        --------------------

- k6 starts iterations at a variable rate

    export const options = {
        scenarios: {
                test: {
                    executor: 'ramping-arrival-rate',
                    startRate: 100,                             // Start iterations per `timeUnit`
                    timeUnit: '1s',                             // Start `startRate` iterations per minute
                    preAllocatedVUs: 50,
                    stages: [
                        { target: 200, duration: '2m' },
                        { target: 500, duration: '5m' },
                        { target: 100, duration: '2m' },
                    ],
                },
        },
    };

    - Begins at 100 iterations/sec.
    - Gradually ramps to 200, then 500.
    - Later reduces to 100.

    Use when
    - Modeling increasing or decreasing traffic volumes.
    - Capacity and scalability testing.
    - API gateways and High-volume microservices






                                                    Open vs Closed Model

Executors are broadly divided into two categories:

Closed Model:
------------

- Next iteration starts after the previous one completes. Throughput depends on response time.
- Throughput means the amount of work a system can complete in a given period of time.
  Throughput = Total Work Completed / Time
  In k6, throughput usually refers to how many iterations or requests are executed per second.
- Ex: shared-iterations, per-vu-iterations, constant-vus, ramping-vus

Open Model:
-----------

- Iterations start at configured rates regardless of response time.
- Ex: constant-arrival-rate, ramping-arrival-rate



                                                INTERVIEW QUESTIONS
                                                -------------------

What is the most important difference between constant-vus and constant-arrival-rate?

    constant-vus -> Controls users
    Ex:
        vus: 100
        You tell k6: Keep 100 users active.

    constant-arrival-rate -> Controls traffic

    Example:
        rate: 1000
        You tell k6: Generate 1000 iterations every second.


How k6 Determines Concurrency?

    Concurrency is primarily determined by: Number of active VUs
    Ex: vus: 100
    k6 attempts: 100 simultaneous users

    In closed workloads concurrency is driven by active VUs
    In open workloads it  is driven by arrival rate and response time, with k6 dynamically allocating VUs 
    when necessary.

Checks vs Thresholds: Checks are assertions while thresholds are pass/fail criteria

Data Sharing Limitation during script lifecycle

    Each VU runs in an isolated JavaScript runtime. Mutable state cannot be 
    shared between VUs; only read-only data can be efficiently shared via SharedArray.

    You cannot modify setup data globally.
    Every VU gets its own copy.
    Changes are not shared.
    No shared memory between VUs.

*/