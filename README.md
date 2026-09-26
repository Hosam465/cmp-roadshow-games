# Compliance Roadshow Games

Head-to-head compliance games for the roadshow booth: **2 big screens**, each with **2 iPads**. The two players at a screen challenge each other; the big screen shows the match live, then the leaderboard. One laptop runs everything over Wi-Fi (no internet needed at the booth).

## Start
1. Connect the laptop, the 4 iPads and the 2 screens to the **same Wi-Fi**.
2. Double-click **`Start Roadshow.bat`** (first run installs what it needs — internet needed once). If Windows Firewall asks, click **Allow**.
3. Open the **admin panel** (`http://<laptop-ip>:3000/admin.html`, PIN **2026** — change it in *Scoring & rules*). On *Devices & data*, scan each QR code with the matching iPad and open the big-screen links on the TVs (F11 = full screen).

## How a match works
1. Each player signs in on their iPad (name + employee ID).
2. Either player taps any game → the other gets a **challenge** and taps **Accept**.
3. 3-2-1 countdown, then both answer the **same questions at the same time** with a timer. Points = correct answer + speed bonus. After both answer (or time runs out) the right answer is revealed on both iPads and the big screen.
4. **Puzzle** is a race: first to spell the message with fewest mistakes wins.
5. Winner gets a bonus; draws get a smaller bonus. Then they pick another game or tap **Finish** → rating → thank-you → next player.

If only one player is signed in they can play **solo** (can be switched off).

## Admin panel — control everything
- **Live control:** see both iPads per screen, start a game for them, reveal the answer now, add 15 seconds, finish & record, cancel a match, sign a player out, reset a screen.
- **Players & scores:** rename players, fix employee IDs, add/remove points with a reason, zero scores, delete players, delete individual matches, view each player's history and rating, add players manually.
- **Games & questions:** edit every question and answer in English and Arabic, change the correct answer, add/remove answers, questions, games and units, hide games or questions, reorder, edit the puzzle words.
- **Scoring & rules:** points per answer, speed bonus, win/draw bonus, best-per-game vs. add-up scoring, timers, questions per match, shuffling, solo play, required rating, puzzle scoring, number of screens, leaderboard visibility, language options, admin PIN.
- **Text & evaluation:** event name, rating questions, question labels.
- **Excel export:** tick/untick which players go in the sheet and add extra names (with ID and points) that only appear in the file, then download.
- **Devices & data:** QR codes, full match history, reset results, restore original questions.

## Excel
Saved automatically after every result in **`data/Roadshow Results.xlsx`** (sheets: Results, Evaluations, Matches, Adjustments), or download it from the admin panel. If the file is open in Excel it can't update — close it and it refreshes on the next result.
