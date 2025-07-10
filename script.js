let currentExp = 0;
let currentLevel = 1;
let expToNextLevel = 10;
let monsterCreationStarted = false;
let isGamePaused = false;

// cardClass >------------------------------------------------------------------------------
class CardFactory {
  static createRandomCard() {
    const types = ['tower', 'spell'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    const randomLevel = Math.floor(Math.random() * 3) + 1;

    switch (randomType) {
      case 'tower': return new TowerCard(randomLevel);
      case 'spell': return new SpellCard(randomLevel);
    }
  }
}

class Card {
  constructor(level) {
    this.level = level;
    this.element = this.createCardElement();
  }

  createCardElement() {
    const base = document.getElementById('card')
    const card = base.cloneNode(true);
    card.style.display = 'block';
    card.dataset.type = this.type;
    card.dataset.level = this.level;
    return card;
  }

  applyStyles(typeStyles) {
    const levelStyles = {
      1: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
      2: { boxShadow: '0 10px 15px rgba(0, 0, 0, 0.2)' },
      3: { boxShadow: '0 20px 25px rgba(0, 0, 0, 0.3)' }
    };

    Object.assign(this.element.style, {
      borderRadius: '16px',
      padding: '16px',
      color: '#fff',
      textAlign: 'center',
      fontWeight: 'bold',
      textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
      border: '2px solid',
      ...typeStyles[this.level - 1],
      ...levelStyles[this.level]
    });

    this.element.innerHTML = `
      <h3 style="margin-bottom: 8px; font-size: 1.2em;">${this.name}</h3>
      <p style="margin-bottom: 12px;">${this.description}</p>
      <div style="
        position: absolute;
        bottom: 10px;
        right: 10px;
        width: 24px;
        height: 24px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      ">${this.level}</div>
    `;
  }
}

class TowerCard extends Card {
  constructor(level) {
    super(level);
    this.type = 'tower';
    this.name = ['궁수 타워', '머스킷 타워', '저격수 타워'][level - 1];
    this.description = [
      '기본 방어 시설',
      '공격력 +30% 증가',
      '특수 효과: 주변 타워 강화'
    ][level - 1];
    const styles = [
      { background: '#a8dadc', borderColor: '#457b9d' },
      { background: '#f1faee', borderColor: '#e63946' },
      { background: '#ffb703', borderColor: '#fb8500' }
    ];
    this.applyStyles(styles);
  }
}

class SpellCard extends Card {
  constructor(level) {
    super(level);
    this.type = 'spell';
    this.name = ['화살', '폭격', '뉴클리어'][level - 1];
    this.description = [
      '적 1명에게 화염 피해',
      '적들을 3초 동안 빙결',
      '광역 번개 피해'
    ][level - 1];
    const styles = [
      { background: '#f5576c', borderColor: '#c1121f' },
      { background: '#fca311', borderColor: '#14213d' },
      { background: '#6a4c93', borderColor: '#1982c4' }
    ];
    this.applyStyles(styles);
  }
}

let fail = false;

//tawerAttack >------------------------------------------------------------------------------------------------------------
const towerList = [];

function registerNewTower(newBuilding, buildingClass) {
  if (["building1", "building2", "building3"].includes(buildingClass)) {
    newBuilding.isReady = true;
    newBuilding.cooldownTimer = null;
    towerList.push(newBuilding);
  }
}

function startTowerAttackLoop() {
  setInterval(() => {
    if (isGamePaused) return;

    const monsters = document.querySelectorAll('.monster');

    towerList.forEach(tower => {
      if (!tower.isReady || tower.cooldownTimer !== null) return;

      const towerLeft = parseFloat(getComputedStyle(tower).left);
      const towerTop = parseFloat(getComputedStyle(tower).top);
      const range = 128;

      for (const monster of monsters) {
        const monsterLeft = parseFloat(getComputedStyle(monster).left);
        const monsterTop = parseFloat(getComputedStyle(monster).top);

        const dx = monsterLeft - towerLeft;
        const dy = monsterTop - towerTop;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= range) {
          shootProjectile(tower, monster, () => {
            let hp = parseInt(monster.dataset.hp);
            const damage = 2;
            hp -= damage;
            monster.dataset.hp = hp;

            const inner = monster.querySelector('.hp-inner');
            const maxHp = parseInt(monster.dataset.maxHp);
            if (inner) inner.style.width = (hp / maxHp * 100) + '%';

            if (hp <= 0) {
              const expGained = parseInt(monster.dataset.expValue) || 0;
              monster.remove();
              gainExperience(expGained);
            }
          })

          tower.isReady = false;
          tower.cooldownTimer = setTimeout(() => {
            tower.isReady = true;
            tower.cooldownTimer = null;
          }, 1000);

          break;
        }
      }
    });
  }, 50);
}

function shootProjectile(tower, targetMonster, onHit) {
  const proj = document.createElement('div');
  proj.className = 'projectile';

  const towerLeft = parseFloat(getComputedStyle(tower).left) + tower.offsetWidth / 2;
  const towerTop = parseFloat(getComputedStyle(tower).top) + tower.offsetHeight / 2;
  proj.style.left = towerLeft + 'px';
  proj.style.top = towerTop + 'px';

  document.body.appendChild(proj);

  const monsterLeft = parseFloat(getComputedStyle(targetMonster).left) + targetMonster.offsetWidth / 2;
  const monsterTop = parseFloat(getComputedStyle(targetMonster).top) + targetMonster.offsetHeight / 2;

  const dx = monsterLeft - towerLeft;
  const dy = monsterTop - towerTop;

  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);

  proj.style.transform = `rotate(${angleDeg}deg)`;

  const duration = 200;
  const frames = 20;
  const interval = duration / frames;

  let frame = 0;
  const move = setInterval(() => {
    frame++;
    const progress = frame / frames;
    proj.style.left = (towerLeft + dx * progress) + 'px';
    proj.style.top = (towerTop + dy * progress) + 'px';

    if (frame >= frames) {
      clearInterval(move);
      proj.remove();
      if (typeof onHit === 'function') {
        onHit();
      }
    }
  }, interval);
}


// monsterfunction >---------------------------------------------------------------------------------------------------------
function updateMainHpBar(hp) {
  const main = document.getElementById('main');
  const inner = main.querySelector('.hp-inner');
  const maxHp = parseInt(main.dataset.maxHp) || 100;
  const percent = (hp / maxHp) * 100;
  if (inner) inner.style.width = percent + '%';
}

function startMainUnderAttackLoop() {
  setInterval(() => {
    if (isGamePaused) return;
    if (fail) return;

    const main = document.getElementById('main');
    let mainHp = parseInt(main.dataset.hp);
    const attackers = document.querySelectorAll('.monster[data-reached="true"]');

    if (attackers.length === 0) return;

    const damagePerMonster = 2;
    mainHp -= attackers.length * damagePerMonster;

    main.dataset.hp = mainHp;
    updateMainHpBar(mainHp);

    if (mainHp <= 0) {
      alert("Main이 파괴되었습니다!");
      fail = true;
      location.reload();
    }
  }, 1000);
}


// start >-----------------------------------------------------------------------------------------------------------------
window.onload = function () {
  showChoice();
  setTimeout(generateMap, 0);

  const main = document.getElementById('main');
  main.dataset.hp = 100;
  main.dataset.maxHp = 100;
  const hpBar = document.createElement('div');
  hpBar.className = 'hp-bar';
  hpBar.innerHTML = `<div class="hp-inner" style="width: 100%;"></div>`;
  main.appendChild(hpBar);

  startTowerAttackLoop();
  startMainUnderAttackLoop();

  updateUIExp();
  updateUILevel();
};

// map >------------------------------------------------------------------------------------------------------------------
function generateMap() {
  let pm = 1;

  //way >------------------------------------------------------------------------------------------------------------------
  for (let i = 1; i < 33;) {
    const way = document.getElementById('way' + i);
    if (!way) {
      i++;
      continue;
    }
    let j = i;
    for (; i < j + (i <= 11 ? 9 : 11); i++) {
      let wayDiv = document.getElementById('way' + i);
      const newWay = wayDiv.cloneNode(true);
      newWay.id = 'way' + (i + 1);
      let currentLeft = parseInt(getComputedStyle(wayDiv).left) || 0;
      newWay.style.left = (currentLeft + 64 * pm) + "px";
      wayDiv.parentNode.appendChild(newWay);
    }
    j = i;
    for (; i < j + 2 && i <= 33; i++) {
      let wayDiv = document.getElementById('way' + i);
      const newWay = wayDiv.cloneNode(true);
      newWay.id = 'way' + (i + 1);
      let currentTop = parseInt(getComputedStyle(wayDiv).top) || 0;
      newWay.style.top = (currentTop + 64) + "px";
      wayDiv.parentNode.appendChild(newWay);
    }
    pm *= -1;
  }

  // tile >------------------------------------------------------------------------------------------------------------------
  pm = 1;
  let currentLeft = 0;
  let currentTop = 0;

  for (let i = 0; i < 32;) {
    for (let k = 0; k < (i <= 11 ? 10 : 11) && i < 32; k++, i++) {
      let tileDiv = document.getElementById('tile' + i);

      if (k === 0) {
        currentLeft = parseInt(getComputedStyle(tileDiv).left) || 0;
        currentTop = parseInt(getComputedStyle(tileDiv).top) || 0;
        if (i) {
          currentLeft += 64 * pm;
          currentTop += 128;
        }
      }

      const newtile = tileDiv.cloneNode(true);
      newtile.id = 'tile' + (i + 1);
      newtile.style.left = (currentLeft + 64 * pm * k) + "px";
      newtile.style.top = (currentTop) + "px";

      tileDiv.parentNode.appendChild(newtile);
    }
    pm *= -1;
  }

  //building >------------------------------------------------------------------------------------------------------------------
  buildingNum = 0;
  document.querySelectorAll('div[class="tile"]').forEach(tile => {
    tile.addEventListener('click', function (event) {
      if (!activeHaveCard) return;
      event.stopPropagation();

      const cardName = activeHaveCard.querySelector('h3')?.textContent.trim();
      const nameToBuildingClass = {
        '궁수 타워': 'building1',
        '머스킷 타워': 'building2',
        '저격수 타워': 'building3',
        '화살': 'building4',
        '폭격': 'building5',
        '뉴클리어': 'building6',
      };

      const buildingClass = nameToBuildingClass[cardName];
      if (!buildingClass) return;

      activeHaveCard.remove();
      activeHaveCard = null;
      let buildingDiv = document.getElementById('building');
      const newBuilding = buildingDiv.cloneNode(true);
      newBuilding.classList.add(buildingClass)
      newBuilding.style.display = 'block';
      const tileRect = this.getBoundingClientRect();
      const parentRect = this.parentNode.getBoundingClientRect();
      const left = tileRect.left - parentRect.left;
      const top = tileRect.top - parentRect.top;
      newBuilding.style.left = left + 'px';
      newBuilding.style.top = top + 'px';
      this.parentNode.appendChild(newBuilding);
      registerNewTower(newBuilding, buildingClass);

      haveCardContainer.removeChild(usedCard);
      updateHaveCardContainerPosition();
    });
  })
}

// card >------------------------------------------------------------------------------------------------------------------
function updateHaveCardContainerPosition() {
  const haveCardContainer = document.getElementById('haveCardContainer');
  const cards = haveCardContainer.querySelectorAll('.haveCard');
  if (cards.length === 0) return;

  const cardWidth = 192;
  const overlap = 96;

  if (cards.length === 1) {
    const screenCenter = window.innerWidth / 2;
    haveCardContainer.style.left = `${screenCenter - cardWidth / 2}px`;
    return;
  }

  const lefts = Array.from(cards).map(card => card.offsetLeft);
  const minLeft = Math.min(...lefts);
  const maxLeft = Math.max(...lefts);
  const cardsCenter = (minLeft + maxLeft) / 2;
  const containerRect = haveCardContainer.getBoundingClientRect();
  const containerLeft = containerRect.left + window.scrollX;
  const screenCenter = window.innerWidth / 2;
  const targetLeft = screenCenter - cardsCenter;
  haveCardContainer.style.left = `${targetLeft}px`;
}

function showChoice() {
  isGamePaused = true;

  const choiceBackground = document.getElementById('choiceBackground');
  choiceBackground.style.display = 'block';

  document.querySelectorAll('.choiceCard').forEach(card => {
    card.remove();
  });

  document.getElementById('haveCardContainer').classList.add('hide');

  for (let i = -1; i < 2; i++) {
    const cardInstance = CardFactory.createRandomCard();
    const card = cardInstance.element;
    card.style.display = 'block';
    card.style.left = `calc(50% + ${256 * i}px)`;
    card.style.top = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.classList.add('choiceCard');
    document.body.appendChild(card);

    const haveCardContainer = document.getElementById('haveCardContainer');

    card.addEventListener('click', function (event) {
      event.stopPropagation();

      choiceBackground.style.display = 'none';
      isGamePaused = false;

      if (!monsterCreationStarted) {
        monsterMove();
        monsterCreationStarted = true;
      }

      document.getElementById('haveCardContainer').classList.remove('hide');

      const newHaveCard = card.cloneNode(true);
      newHaveCard.classList.remove('choiceCard');
      newHaveCard.classList.add('haveCard');
      newHaveCard.style.display = 'block';
      newHaveCard.style.position = 'relative';
      newHaveCard.style.left = '';
      newHaveCard.style.bottom = '';
      newHaveCard.style.transform = '';
      newHaveCard.style.zIndex = '10';
      haveCardContainer.appendChild(newHaveCard);
      updateHaveCardContainerPosition();

      document.querySelectorAll('.choiceCard').forEach(card => {
        card.remove();
      });
    });
  }
}

let activeHaveCard = null;

document.addEventListener('click', function (event) {
  if (event.target.classList.contains('haveCard')) {
    event.stopPropagation();
    if (activeHaveCard && activeHaveCard !== event.target) {
      activeHaveCard.classList.remove('highlightCard');
    }
    event.target.classList.add('highlightCard');
    activeHaveCard = event.target;
  }
});

document.addEventListener('click', function (event) {
  if (!event.target.classList.contains('haveCard')) {
    if (activeHaveCard) {
      activeHaveCard.classList.remove('highlightCard');
      activeHaveCard = null;
    }
  }
});

//moster>------------------------------------------------------------------------------------------------------------------
const baseMonster = document.getElementById('monster');

function monsterMove() {
  const monsterCreate = setInterval(() => {
    if (isGamePaused) return;
    if (fail) {
      clearInterval(monsterCreate);
      return;
    }

    const newMonster = baseMonster.cloneNode(true);
    newMonster.style.display = 'block';

    const path = [];
    for (let i = 32; i > 0; i--) {
      const way = document.getElementById('way' + i);
      if (!way) continue;
      const style = getComputedStyle(way);
      const left = parseFloat(style.left);
      const top = parseFloat(style.top);
      path.push({ left, top });
    }

    if (path.length === 0) {
      console.error("몬스터 경로를 찾을 수 없습니다.");
      return;
    }

    newMonster.style.left = '784px';
    newMonster.style.top = '384px';

    newMonster.dataset.hp = 10;
    newMonster.dataset.maxHp = 10;
    newMonster.dataset.expValue = 5;

    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';
    hpBar.innerHTML = `<div class="hp-inner" style="width: 100%;"></div>`;
    newMonster.appendChild(hpBar);
    document.body.appendChild(newMonster);

    const speed = 4;

    let index = 0;

    const interval = setInterval(() => {
      if (isGamePaused) return;

      let monsterLeft = parseFloat(getComputedStyle(newMonster).left) || 0;
      let monsterTop = parseFloat(getComputedStyle(newMonster).top) || 0;

      const target = path[index];

      const dx = target.left - monsterLeft;
      const dy = target.top - monsterTop;

      if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) {
        newMonster.style.left = target.left + 'px';
        newMonster.style.top = target.top + 'px';
        index++;

        if (index >= path.length) {
          clearInterval(interval);
          newMonster.dataset.reached = 'true';
        }
        return;
      }

      const angle = Math.atan2(dy, dx);
      monsterLeft += Math.cos(angle) * speed;
      monsterTop += Math.sin(angle) * speed;

      newMonster.style.left = Math.round(monsterLeft) + 'px';
      newMonster.style.top = Math.round(monsterTop) + 'px';
    }, 20);
  }, 3000);
}

//exp >-------------------------------------------------------------------------------------------------------------------
function gainExperience(exp) {
  currentExp += exp;
  updateUIExp();

  if (currentExp >= expToNextLevel) {
    levelUp();
  }
}


function levelUp() {
  currentLevel++;
  currentExp = 0;
  expToNextLevel = Math.floor(expToNextLevel * 1.5);
  alert(`레벨 업! 당신은 이제 레벨 ${currentLevel}입니다! 새로운 카드를 선택하세요.`);
  showChoice();
  updateUILevel();
  updateUIExp();
}


function updateUIExp() {
  const expDisplay = document.getElementById('expDisplay');
  const expBarFill = document.getElementById('expBarFill');
  if (expDisplay) {
    expDisplay.textContent = `EXP: ${currentExp} / ${expToNextLevel}`;
  }
  if (expBarFill) {
    const percent = (currentExp / expToNextLevel) * 100;
    expBarFill.style.height = percent + '%';
  }
}


function updateUILevel() {
  const levelDisplay = document.getElementById('levelDisplay');
  if (levelDisplay) {
    levelDisplay.textContent = `Level: ${currentLevel}`;
  }
}