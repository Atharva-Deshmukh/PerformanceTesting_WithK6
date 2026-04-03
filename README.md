<h1 align="center">Performance Testing Learning Repo with K6</h1>

---

<p align="center">
  <img src="ReadMeImages/k6-logo.png" alt="K6 Logo" height="100">
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="ReadMeImages/javascript-logo.png" alt="JavaScript Logo" height="100">
</p>

---

<br>

<h3 align="center">Types of Performance Testing</h3>

<p align="center">
  <img src="Notes/02.1.TypesOfPerfTesting.png" alt="Types of Performance Testing">
</p>

---

<h2 align="center">Installation</h3>

- K6 engine is written in Go, but we can write the scripts in JS/TS. <br>
- So, we don't compulsorily need node.js to run k6. <br>
- But, to setup a structured js project, where we can cleanely add dependencies, packages, package.json, 
  we will use node.js to setup k6 project in VS Code

<br>
<br>
Create a new folder and open it in VS Code. Create a new node project there using below command

```
npm init -y
```

After install, to check if installation is succesfull, run 'k6' on terminal

Expected output
```
PS C:\REPOS\PerformanceTesting_WithK6\PerformanceTesting_WithK6> k6

         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 

Grafana k6 is an easy-to-use, open-source load and performance testing tool...
```

If there is some issue, open task manager, restart windows explorer from there, close vs code, git and restart 
everything

Also, we can check version installed
```
Command -> k6 version
Output  -> k6.exe v1.7.1 (commit/9f82e6f1fc, go1.26.1, windows/amd64)
```

To enable k6 intellisense in VS Code editor, install below package
```
npm install --save-dev @types/k6
```
This was the reason we created a node project even though we don't need node to run k6

<h3> Website that K6 has provided to test performance </h3>

```
https://quickpizza.grafana.com/
```

Command to run K6 -> k6 run Filepath from root

```

PS C:\REPOS\PerformanceTesting_WithK6\PerformanceTesting_WithK6> k6 run Tests/Test-01.js

         /\      Grafana   /‾‾/  
    /\  /  \     |\  __   /  /   
   /  \/    \    | |/ /  /   ‾‾\ 
  /          \   |   (  |  (‾)  |
 / __________ \  |_|\_\  \_____/ 


     execution: local
        script: Tests/Test-01.js
        output: -

     scenarios: (100.00%) 1 scenario, 3 max VUs, 40s max duration (incl. graceful stop):
              * default: 3 looping VUs for 10s (gracefulStop: 30s)



  █ TOTAL RESULTS

    HTTP
    http_req_duration..............: avg=334.78ms min=310.23ms med=320.62ms max=374.45ms p(90)=373.94ms p(95)=374.45ms
      { expected_response:true }...: avg=334.78ms min=310.23ms med=320.62ms max=374.45ms p(90)=373.94ms p(95)=374.45ms
    http_req_failed................: 0.00%  0 out of 21
    http_reqs......................: 21     2.061495/s

    EXECUTION
    iteration_duration.............: avg=1.45s    min=1.31s    med=1.32s    max=2.18s    p(90)=2.18s    p(95)=2.18s
    iterations.....................: 21     2.061495/s
    vus............................: 3      min=3       max=3
    vus_max........................: 3      min=3       max=3

    NETWORK
    data_received..................: 83 kB  8.2 kB/s
    data_sent......................: 6.3 kB 619 B/s



                                                                                                                                        
running (10.2s), 0/3 VUs, 21 complete and 0 interrupted iterations                                                                      
default ✓ [======================================] 3 VUs  10s 
```


