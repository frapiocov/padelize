# 🎾 Padelize

This is a lightweight web application for managing a Padel tournament using **Node.js**, **Express**, **EJS**, and **Bootstrap**. The app is designed for in-session use only—no login or database required.

---

### 🚀 Features

- Add players and assign their skill levels: Beginner, Intermediate, Advanced
- Random match generation with rotation of teams across multiple rounds
- Handicap-based scoring system depending on player skill differences
- Group stage with multiple courts playing simultaneously
- Dynamic point calculation based on match outcome
- Top 8 players advance to the **Gold Round**, bottom 8 to the **Silver Round**
- Semifinals and finals for both rounds
- Automatic winner declaration and trophy screen
- Minimal, responsive UI with Bootstrap styling
- Data is stored in **session** memory only (no persistence)

---

### ⚙️ How to Run
0. Clone repo
    ```git clone https://github.com/frapiocov/padelize.git```
1. Install dependencies:
   ```npm install```
2. Run application
    ```node app.js```
3. Open your browser on http://localhost:3000

### 🎮 Gameplay Rules
All games are doubles. Players are grouped and rotated each round.

Points:
- Win by 6+: 3 points to winner, 0 to loser
- Win by <6: 2 points to winner, 1 to loser
- Draw: 1 point each
- 1.5 point bonus for teamwork and rotation

Handicap system adjusts score value depending on opponent levels.

### 🧠 Technologies Used
- Node.js
- Express.js
- EJS Templating
- Bootstrap 5
- Express-session