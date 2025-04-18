(() => {
  const GRID_SIZE = 10;
  const CELL_PX = 40;

  class Gridlock {
    constructor() {
      // 1. Track filled cells for each player
      this.occ = [
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)),
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
      ];
      // 2. Count consecutive skipped turns
      this.skipCount = 0;
      // 3. Track each player’s total covered squares
      this.scores = [0, 0];

      this.currentPlayer = 0;
      this.rectSize = [null, null];

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
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        container.appendChild(cell);
      }
      container.addEventListener('click', e => this.onBoardClick(e, player));
      return container;
    }

    bindControls() {
      this.rollBtn.addEventListener('click', () => this.rollDice());
      this.restartBtn.addEventListener('click', () => location.reload());
    }

    rollDice() {
      const d1 = 1 + Math.floor(Math.random() * 6);
      const d2 = 1 + Math.floor(Math.random() * 6);
      this.rectSize[this.currentPlayer] = [d1, d2];
      this.resultSpan.textContent = `Player ${this.currentPlayer+1} rolled ${d1}×${d2}`;
    }

    /** Return true if player has any room for a w×h rectangle */
    hasValidMove(player, [w, h]) {
      const grid = this.occ[player];
      for (let r = 0; r <= GRID_SIZE - h; r++) {
        for (let c = 0; c <= GRID_SIZE - w; c++) {
          let free = true;
          for (let dr = 0; dr < h && free; dr++) {
            for (let dc = 0; dc < w; dc++) {
              if (grid[r + dr][c + dc]) free = false;
            }
          }
          if (free) return true;
        }
      }
      return false;
    }

    onBoardClick(e, clickedBoard) {
      const targetBoard = this.blockBox.checked
        ? 1 - this.currentPlayer
        : this.currentPlayer;
      if (clickedBoard !== targetBoard) return;

      const size = this.rectSize[this.currentPlayer];
      if (!size) return alert('⚠️ You must roll before placing.');

      // Auto‑skip if no valid placement anywhere
      if (!this.hasValidMove(this.currentPlayer, size)) {
        return this.skipTurn();
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / CELL_PX);
      const row = Math.floor(y / CELL_PX);
      const [w, h] = size;

      // Collision detection at that spot
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (this.occ[targetBoard][row + dr][col + dc]) {
            return alert('❌ Cannot place here: space already taken.');
          }
        }
      }

      // Place the rectangle
      const color = this.currentPlayer === 0
        ? 'rgba(0,128,0,0.5)'      // green
        : 'rgba(128,0,128,0.5)';   // purple

      const boardEl = this.boards[clickedBoard];
      const rectEl = document.createElement('div');
      rectEl.style.position = 'absolute';
      rectEl.style.left     = `${col * CELL_PX}px`;
      rectEl.style.top      = `${row * CELL_PX}px`;
      rectEl.style.width    = `${w * CELL_PX}px`;
      rectEl.style.height   = `${h * CELL_PX}px`;
      rectEl.style.background = color;
      rectEl.style.border   = '1px solid #333';

      // Label and editable on double‑click
      const label = document.createElement('span');
      label.textContent = `${w}×${h}`;
      label.style.position = 'absolute';
      label.style.top = '2px';
      label.style.left = '2px';
      label.style.fontSize = '12px';
      label.style.color = '#000';
      label.style.cursor = 'pointer';
      label.addEventListener('dblclick', () => {
        const txt = prompt('Edit dimensions label:', label.textContent);
        if (txt !== null) label.textContent = txt;
      });
      rectEl.appendChild(label);
      boardEl.appendChild(rectEl);

      // Mark occupancy
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          this.occ[targetBoard][row + dr][col + dc] = true;
        }
      }

      // Update score
      this.scores[this.currentPlayer] += w * h;
      this.scoreEls[this.currentPlayer].textContent = `Score: ${this.scores[this.currentPlayer]}`;

      // Prepare next turn
      this.rectSize[this.currentPlayer] = null;
      this.skipCount = 0;
      this.nextTurn();
    }

    skipTurn() {
      alert(`Player ${this.currentPlayer+1} skips—no valid moves.`);
      this.skipCount++;
      this.rectSize[this.currentPlayer] = null;

      // Both skipped in a row → game over
      if (this.skipCount >= 2) {
        return this.endGame();
      }
      this.nextTurn();
    }

    endGame() {
      this.rollBtn.disabled = true;
      alert(
        `🏁 Game over!\n` +
        `Player 1: ${this.scores[0]} squares\n` +
        `Player 2: ${this.scores[1]} squares`
      );
    }

    nextTurn() {
      this.currentPlayer = 1 - this.currentPlayer;
      this.rollBtn.disabled = false;
      this.resultSpan.textContent = '';
      // Note: skipCount reset happens only after a successful placement
    }
  }

  window.addEventListener('DOMContentLoaded', () => new Gridlock());
})();
