(() => {
  const GRID_SIZE = 10;
  const CELL_PX  = 40;

  class Gridlock {
    constructor() {
      // 1. Track filled cells for each grid
      this.occ = [
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)),
        Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false))
      ];
      // 2. Consecutive skip counter
      this.skipCount = 0;
      // 3. Player scores (total squares covered)
      this.scores = [0, 0];

      this.currentPlayer = 0;        // 0 = P1, 1 = P2
      this.rectSize     = [null, null];

      this.boards = [
        this.initBoard('board-1', 0),
        this.initBoard('board-2', 1)
      ];

      // UI elements
      this.rollBtn    = document.getElementById('roll-btn');
      this.restartBtn = document.getElementById('restart-btn');
      this.resultSpan = document.getElementById('roll-result');
      this.blockBox   = document.getElementById('block-toggle');
      this.scoreEls   = [
        document.getElementById('score-1'),
        document.getElementById('score-2')
      ];

      this.bindControls();
    }

    initBoard(id, idx) {
      const container = document.getElementById(id);
      // draw 10×10 cells for visuals
      for (let i = 0; i < GRID_SIZE*GRID_SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        container.appendChild(cell);
      }
      // click handler passes the board’s index
      container.addEventListener('click', e => this.onBoardClick(e, idx));
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
      this.resultSpan.textContent =
        `Player ${this.currentPlayer+1} rolled ${d1}×${d2}`;
    }

    /** Check if a w×h rectangle fits anywhere on player ‘p’ grid */
    hasValidMove(p, [w, h]) {
      const grid = this.occ[p];
      for (let r = 0; r <= GRID_SIZE - h; r++) {
        for (let c = 0; c <= GRID_SIZE - w; c++) {
          let free = true;
          for (let dr = 0; dr < h && free; dr++)
            for (let dc = 0; dc < w; dc++)
              if (grid[r+dr][c+dc]) free = false;
          if (free) return true;
        }
      }
      return false;
    }

    onBoardClick(e, clickedBoard) {
      // Determine which grid we’re actually placing on
      const targetBoard = this.blockBox.checked
        ? 1 - this.currentPlayer
        : this.currentPlayer;
      if (clickedBoard !== targetBoard) return;

      const size = this.rectSize[this.currentPlayer];
      if (!size) return alert('⚠️ You must roll before placing.');
      const [w, h] = size;

      // 1) If no room on that grid, skip turn
      if (!this.hasValidMove(targetBoard, size)) {
        return this.skipTurn();
      }

      // 2) Compute click cell
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const col = Math.floor(x / CELL_PX);
      const row = Math.floor(y / CELL_PX);

      // 3) Boundary check
      if (col + w > GRID_SIZE || row + h > GRID_SIZE) {
        return alert('❌ Doesn’t fit inside the grid.');
      }

      // 4) Collision detection on that grid
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          if (this.occ[targetBoard][row+dr][col+dc]) {
            return alert('❌ Cannot place here: space already taken.');
          }
        }
      }

      // 5) Draw the rectangle
      const color = this.currentPlayer === 0
        ? 'rgba(0,128,0,0.5)'     // green
        : 'rgba(128,0,128,0.5)';  // purple

      const boardEl = this.boards[targetBoard];
      const rectEl  = document.createElement('div');
      Object.assign(rectEl.style, {
        position:   'absolute',
        left:       `${col*CELL_PX}px`,
        top:        `${row*CELL_PX}px`,
        width:      `${w*CELL_PX}px`,
        height:     `${h*CELL_PX}px`,
        background: color,
        border:     '1px solid #333'
      });

      // Label with “w×h” and allow editing
      const label = document.createElement('span');
      label.textContent = `${w}×${h}`;
      Object.assign(label.style, {
        position:   'absolute',
        top:        '2px',
        left:       '2px',
        fontSize:   '12px',
        cursor:     'pointer'
      });
      label.addEventListener('dblclick', () => {
        const txt = prompt('Edit dimensions label:', label.textContent);
        if (txt !== null) label.textContent = txt;
      });
      rectEl.appendChild(label);
      boardEl.appendChild(rectEl);

      // 6) Mark occupancy on that grid
      for (let dr = 0; dr < h; dr++) {
        for (let dc = 0; dc < w; dc++) {
          this.occ[targetBoard][row+dr][col+dc] = true;
        }
      }

      // 7) Update score for current player
      this.scores[this.currentPlayer] += w * h;
      this.scoreEls[this.currentPlayer].textContent =
        `Score: ${this.scores[this.currentPlayer]}`;

      // 8)
