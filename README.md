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


