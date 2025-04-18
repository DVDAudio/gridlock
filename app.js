(() => {
  const GRID_SIZE = 10;
  const CELL_PX = 40;

  class Gridlock {
    constructor() {
      // occupancy grids
      this.occ = [
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)),
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
      ];
      this.skipCount = 0;
      this.currentPlayer = 0;       // 0 = P1, 1 = P2
      this.rectSize = [null, null]; // [ [w,h], [w,h] ]
      this.scores = [0, 0];

      this.boards = [
        this.initBoard('board-1', 0),
        this.initBoard('board-2', 1)
      ];

      this.rollBtn    = document.getElementById('roll-btn');
      this.restartBtn = document.getElementById('restart-btn');
      this.resultSpan = document.getElementById('roll-result');
      this.blockBox   = document.getElementById('block-toggle');

      this.scoreEls = [
        document.getElementById('score-1'),
        document.getElementById('score-2')
      ];

      this.bindControls();
    }

    initBoard(id, player) {
      const container = document.getElementById(id);
      // create the 10×10 cells (for visual gridlines)
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        container.appendChild(cell);
      }
      // click handler
      container.addEventListener('click', e => this.onBoardClick(e, player));
      return container;
    }

    bindControls() {
      this.rollBtn.addEventListener('click', () => this.rollDice());
      this.restartBtn.addEventListener('click', () => location.reload());
    }

    rollDice() {
   // 1️⃣ Roll two dice
const d1 = 1 + Math.floor(Math.random() * 6);
const d2 = 1 + Math.floor(Math.random() * 6);
this.rectSize[this.currentPlayer] = [d1, d2];
this.resultSpan.textContent = `Player ${this.currentPlayer+1} rolled ${d1} × ${d2}`;

// 2️⃣ Disable further rolls until placement or skip
this.rollBtn.disabled = true;

// 3️⃣ If no valid placement anywhere, skip turn automatically
if (!this.hasValidMove(this.currentPlayer, [d1, d2])) {
  alert(`No valid placement for ${d1}×${d2}, skipping turn.`);
  return this.skipTurn();
}   
    hasValidMove(player, [w, h]) {
      const grid = this.occ[player];
      for (let r = 0; r <= GRID_SIZE - h; r++) {
        for (let c = 0; c <= GRID_SIZE - w; c++) {
          let ok = true;
          for (let dr = 0; dr < h && ok; dr++) {
            for (let dc = 0; dc < w; dc++) {
              if (grid[r+dr][c+dc]) { ok = false; break; }
            }
          }
          if (ok) return true;
        }
      }
      return false;
    }

    onBoardClick(e, clickedBoard) {
      // determine whose board this really is (blocker?)
      const targetBoard = this.blockBox.checked
        ? 1 - this.currentPlayer
        : this.currentPlayer;
      if (clickedBoard !== targetBoard) return;

      const size = this.rectSize[this.currentPlayer];
      if (!size) {
        return alert('⚠️ You must roll before placing.');
      }

      // check if any move at all
      if (!this.hasValidMove(this.currentPlayer, size)) {
        this.skipTurn();
        return;
      }

      // compute row/col from click
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / CELL_PX);
      const row = Math.floor(y / CELL_PX);
      const [w, h] = size;

      // check fit & occupancy
      if (row + h > GRID_SIZE || col + w > GRID_SIZE) {
        return alert('❌ Doesn’t fit there.');
      }
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (this.occ[this.currentPlayer][row+dr][col+dc]) {
            return alert('❌ Space already taken.');
          }
        }
      }

      // **Place the rectangle**
      const color = this.currentPlayer === 0
        ? 'rgba(0,128,0,0.5)'
        : 'rgba(0,0,255,0.5)';
      const boardEl = this.boards[clickedBoard];
      const rectEl = document.createElement('div');
      rectEl.style.position = 'absolute';
      rectEl.style.left   = `${col * CELL_PX}px`;
      rectEl.style.top    = `${row * CELL_PX}px`;
      rectEl.style.width  = `${w * CELL_PX}px`;
      rectEl.style.height = `${h * CELL_PX}px`;
      rectEl.style.background = color;
      rectEl.style.border = '1px solid #333';

      // label
      const label = document.createElement('span');
      label.textContent = `${w}×${h}`;
      label.style.position = 'absolute';
      label.style.top = '2px';
      label.style.left = '2px';
      label.style.fontSize = '12px';
      label.style.color = '#000';
      label.style.cursor = 'pointer';
      // allow editing on double‑click
      label.addEventListener('dblclick', () => {
        const txt = prompt('Edit dimensions label:', label.textContent);
        if (txt !== null) label.textContent = txt;
      });

      rectEl.appendChild(label);
      boardEl.appendChild(rectEl);

      // mark occupancy
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          this.occ[this.currentPlayer][row+dr][col+dc] = true;
        }
      }

      // update score
      this.scores[this.currentPlayer] += w * h;
      this.scoreEls[this.currentPlayer].textContent =
        `Score: ${this.scores[this.currentPlayer]}`;

      // prepare next turn
      this.rectSize[this.currentPlayer] = null;
      this.resultSpan.textContent = '';
      this.skipCount = 0;
      this.nextTurn();
    }

    skipTurn() {
      alert(`Player ${this.currentPlayer+1} has no valid move and skips.`);
      this.skipCount++;
      this.rectSize[this.currentPlayer] = null;
      this.resultSpan.textContent = '';
      if (this.skipCount >= 2) {
        return this.endGame();
      }
      this.nextTurn();
    }

    nextTurn() {
      this.currentPlayer = 1 - this.currentPlayer;
      this.rollBtn.disabled = false;
    }

    endGame() {
      this.rollBtn.disabled = true;
this.blockBox.disabled = true;  // Prevent toggling after game ends
      alert(`🏁 Game over!\nPlayer 1: ${this.scores[0]} squares\nPlayer 2: ${this.scores[1]} squares`);
    }
  }

  window.addEventListener('DOMContentLoaded', () => new Gridlock());
})();
