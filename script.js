let currentExp = 0;
let currentLevel = 1;
let expToNextLevel = 10;
let monsterCreationStarted = false;
let isGamePaused = true; // 게임 시작 시 일시 정지 상태로 시작하도록 변경
let startTime = null; // 게임 타이머가 처음 시작된 시점의 타임스탬프 (고정)
let survivalInterval = null;
let totalPausedTime = 0; // 게임이 일시 정지된 총 시간 (누적)
let pauseStartTime = null; // 현재 일시 정지가 시작된 시점의 타임스탬프
let fail = false; // fail 변수 초기화 추가

// monster>------------------------------------------------------------------------------------------------------------------
const baseMonster = document.getElementById('monster'); // monster 템플릿 요소 참조

let monsterDelay = 3000;  // 초기 생성 간격
let minDelay = 250;       // 최소 제한
let delayReduction = 275; // 줄일 양
let monsterDelayInterval = null; // 몬스터 딜레이 조절 인터벌 ID를 저장할 변수 추가

// start >-----------------------------------------------------------------------------------------------------------------
window.onload = function () {
  const main = document.getElementById('main');
  main.dataset.hp = 100;
  main.dataset.maxHp = 100;
  const hpBar = document.createElement('div');
  hpBar.className = 'hp-bar';
  hpBar.innerHTML = `<div class="hp-inner" style="width: 100%;"></div>`;
  main.appendChild(hpBar);

  generateMap(); // 맵 생성은 그대로 유지
  showChoice(); // 카드 선택 화면 표시 (여기서 게임이 일시 정지됨)

  startTowerAttackLoop();
  startMainUnderAttackLoop();

  updateUIExp();
  updateUILevel();
};

// time >----------------------------------------------------------------------------------
function updateTimeDisplay() {
  if (isGamePaused || startTime === null) return;

  const now = Date.now();
  const activePlayTime = now - startTime - totalPausedTime;
  const seconds = Math.floor(activePlayTime / 1000);

  const display = document.getElementById('timeDisplay');
  if (display) {
    display.textContent = `생존 시간: ${formatTime(seconds)}`;
  }
}

function startSurvivalTimer() {
  if (survivalInterval === null) {
    survivalInterval = setInterval(updateTimeDisplay, 1000);
  }
}

function pauseSurvivalTimer() {
  if (pauseStartTime === null) {
    pauseStartTime = Date.now();
    clearInterval(survivalInterval);
    survivalInterval = null;
  }
}

function resumeSurvivalTimer() {
  if (startTime === null) {
    startTime = Date.now();
    totalPausedTime = 0;
    pauseStartTime = null;
  } else if (pauseStartTime !== null) {
    const pauseDuration = Date.now() - pauseStartTime;
    totalPausedTime += pauseDuration;
    pauseStartTime = null;
  }
  startSurvivalTimer();
  updateTimeDisplay();
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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
      '가벼운 데미지, 짧은 범위',
      '중간 데미지와 범위',
      '높은 데미지, 긴 범위'
    ][level - 1];

    this.damage = [2, 4, 20][level - 1];
    this.range = [128, 256, 1024][level - 1];
    this.cooldown = [1000, 750, 10000][level - 1]; // 각 타워 레벨별 쿨다운 시간 (밀리초)

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
      '.',
      '.',
      '.'
    ][level - 1];
    const styles = [
      { background: '#f5576c', borderColor: '#c1121f' },
      { background: '#fca311', borderColor: '#14213d' },
      { background: '#6a4c93', borderColor: '#1982c4' }
    ];
    this.applyStyles(styles);
  }
}


//tawerAttack >------------------------------------------------------------------------------------------------------------
const towerList = [];

function registerNewTower(newBuilding, buildingClass) {
  // buildingClass가 정확히 'building1', 'building2', 'building3' 중 하나인지 확인
  if (["building1", "building2", "building3"].includes(buildingClass)) {
    newBuilding.isReady = true;
    newBuilding.cooldownTimer = null;
    towerList.push(newBuilding);
  } else {
    // 만약 타워가 building1, building2, building3 클래스가 아니라면 경고
    console.warn('Attempted to register a tower with an unrecognized class:', buildingClass);
  }
}

function startTowerAttackLoop() {
  const mainCenterX = 64 + 128 / 2;
  const mainCenterY = 0 + 192 / 2;

  setInterval(() => {
    if (isGamePaused) return;

    const monsters = Array.from(document.querySelectorAll('.monster'));

    towerList.forEach(tower => {
      if (!tower.isReady || tower.cooldownTimer !== null) return;

      const towerLeft = parseFloat(getComputedStyle(tower).left);
      const towerTop = parseFloat(getComputedStyle(tower).top);
      const range = parseFloat(tower.dataset.range) || 128;
      const damage = parseInt(tower.dataset.damage) || 2;
      const towerClass = Array.from(tower.classList).find(cls => cls.startsWith('building'));

      const monstersInRange = monsters.filter(monster => {
        const monsterLeft = parseFloat(getComputedStyle(monster).left);
        const monsterTop = parseFloat(getComputedStyle(monster).top);
        const dx = monsterLeft - towerLeft;
        const dy = monsterTop - towerTop;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= range;
      });


      if (monstersInRange.length === 0) return;

      let targetMonster = null;

      // 2. 타워 유형에 따라 몬스터 정렬 및 대상 선택
      if (towerClass === 'building1' || towerClass === 'building2') {
        monstersInRange.sort((a, b) => {
          const aMonsterLeft = parseFloat(getComputedStyle(a).left);
          const aMonsterTop = parseFloat(getComputedStyle(a).top);
          const aMonsterCenterX = aMonsterLeft + 64 / 2;
          const aMonsterCenterY = aMonsterTop + 64 / 2;
          const distAToMain = Math.sqrt(Math.pow(aMonsterCenterX - mainCenterX, 2) + Math.pow(aMonsterCenterY - mainCenterY, 2));

          const bMonsterLeft = parseFloat(getComputedStyle(b).left);
          const bMonsterTop = parseFloat(getComputedStyle(b).top);
          const bMonsterCenterX = bMonsterLeft + 64 / 2;
          const bMonsterCenterY = bMonsterTop + 64 / 2;
          const distBToMain = Math.sqrt(Math.pow(bMonsterCenterX - mainCenterX, 2) + Math.pow(bMonsterCenterY - mainCenterY, 2));

          return distAToMain - distBToMain;
        });
        targetMonster = monstersInRange[0];
      } else if (towerClass === 'building3') {
        monstersInRange.sort((a, b) => {
          const aMaxHp = parseInt(a.dataset.maxHp) || 0;
          const bMaxHp = parseInt(b.dataset.maxHp) || 0;

          if (bMaxHp !== aMaxHp) {
            return bMaxHp - aMaxHp;
          } else {
            const aMonsterLeft = parseFloat(getComputedStyle(a).left);
            const aMonsterTop = parseFloat(getComputedStyle(a).top);
            const aMonsterCenterX = aMonsterLeft + 64 / 2;
            const aMonsterCenterY = aMonsterTop + 64 / 2;
            const distAToMain = Math.sqrt(Math.pow(aMonsterCenterX - mainCenterX, 2) + Math.pow(aMonsterCenterY - mainCenterY, 2));

            const bMonsterLeft = parseFloat(getComputedStyle(b).left);
            const bMonsterTop = parseFloat(getComputedStyle(b).top);
            const bMonsterCenterX = bMonsterLeft + 64 / 2;
            const bMonsterCenterY = bMonsterTop + 64 / 2;
            const distBToMain = Math.sqrt(Math.pow(bMonsterCenterX - mainCenterX, 2) + Math.pow(bMonsterCenterY - mainCenterY, 2));

            return distAToMain - distBToMain;
          }
        });
        targetMonster = monstersInRange[0];
      }
      else if (monstersInRange.length > 0) {
        monstersInRange.sort((a, b) => {
          const aMonsterLeft = parseFloat(getComputedStyle(a).left);
          const aMonsterTop = parseFloat(getComputedStyle(a).top);
          const distA = Math.sqrt(Math.pow(aMonsterLeft - towerLeft, 2) + Math.pow(aMonsterTop - towerTop, 2));

          const bMonsterLeft = parseFloat(getComputedStyle(b).left);
          const bMonsterTop = parseFloat(getComputedStyle(b).top);
          const distB = Math.sqrt(Math.pow(bMonsterLeft - towerLeft, 2) + Math.pow(bMonsterTop - towerTop, 2));
          return distA - distB;
        });
        targetMonster = monstersInRange[0];
        console.warn(`Unrecognized tower class '${towerClass}', defaulting to closest monster target.`);
      }

      if (targetMonster) {
        shootProjectile(tower, targetMonster, () => {
          let hp = parseInt(targetMonster.dataset.hp);
          hp -= damage;
          targetMonster.dataset.hp = hp;

          const inner = targetMonster.querySelector('.hp-inner');
          const maxHp = parseInt(targetMonster.dataset.maxHp);
          if (inner) inner.style.width = (hp / maxHp * 100) + '%';

          if (hp <= 0) {
            const expGained = parseInt(targetMonster.dataset.expValue) || 0;
            targetMonster.remove();
            gainExperience(expGained);
          }
        })

        tower.isReady = false;
        tower.cooldownTimer = setTimeout(() => {
          tower.isReady = true;
          tower.cooldownTimer = null;
        }, parseFloat(tower.dataset.cooldown) || 1000);
      } else {
      }
    });
  }, 50);
}

function shootProjectile(tower, targetMonster, onHit) {
  const proj = document.createElement('div');
  proj.className = 'projectile';

  const towerLeft = parseFloat(getComputedStyle(tower).left) + 64 / 2;
  const towerTop = parseFloat(getComputedStyle(tower).top) + 64 / 2;
  proj.style.left = towerLeft + 'px';
  proj.style.top = towerTop + 'px';

  document.body.appendChild(proj);

  const monsterLeft = parseFloat(getComputedStyle(targetMonster).left) + 64 / 2;
  const monsterTop = parseFloat(getComputedStyle(targetMonster).top) + 64 / 2;

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

function stopSurvivalTimer() {
  clearInterval(survivalInterval);
  survivalInterval = null;
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
      stopSurvivalTimer();
      const endTime = Date.now();
      const seconds = Math.floor((endTime - startTime - totalPausedTime) / 1000);
      alert(`Main이 파괴되었습니다!\n당신은 ${formatTime(seconds)} 동안 버텼습니다.`);
      fail = true;
      location.reload();
    }
  }, 1000);
}

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
      let currentLeft = parseFloat(getComputedStyle(wayDiv).left) || 0;
      newWay.style.left = (currentLeft + 64 * pm) + "px";
      newWay.style.backgroundImage = "url(way/way1.png)"
      if (newWay.id == 'way10') { newWay.style.backgroundImage = 'url(way/way6.png)' }
      if (newWay.id == 'way23') { newWay.style.backgroundImage = 'url(way/way4.png)' }
      wayDiv.parentNode.appendChild(newWay);
    }
    j = i;
    for (; i < j + 2 && i <= 33; i++) {
      let wayDiv = document.getElementById('way' + i);
      const newWay = wayDiv.cloneNode(true);
      newWay.id = 'way' + (i + 1);
      let currentTop = parseFloat(getComputedStyle(wayDiv).top) || 0;
      newWay.style.top = (currentTop + 64) + "px";
      newWay.style.backgroundImage = "url(way/way2.png)"
      if (newWay.id == 'way12') { newWay.style.backgroundImage = 'url(way/way5.png)' }
      if (newWay.id == 'way25') { newWay.style.backgroundImage = 'url(way/way3.png)' }
      wayDiv.parentNode.appendChild(newWay);
    }
    pm *= -1;
  }

  // tile >------------------------------------------------------------------------------------------------------------------
  pm = 1;
  let currentLeft = 0;
  let currentTop = 0;
  let lastPlacedTile = document.getElementById('tile0');

  for (let i = 0; i < 32;) {
    for (let k = 0; k < (i <= 11 ? 10 : 11) && i < 32; k++, i++) {
      if (k === 0) {
        currentLeft = parseFloat(getComputedStyle(lastPlacedTile).left) || 0;
        currentTop = parseFloat(getComputedStyle(lastPlacedTile).top) || 0;
        if (i) {
          currentLeft += 64 * pm;
          currentTop += 128;
        }
      }

      const newtile = document.getElementById('tile0').cloneNode(true);
      newtile.id = 'tile' + (i + 1);
      newtile.style.left = (currentLeft + 64 * pm * k) + "px";
      newtile.style.top = (currentTop) + "px";

      document.body.appendChild(newtile);
      lastPlacedTile = newtile;
    }
    pm *= -1;
  }

  //building >------------------------------------------------------------------------------------------------------------------
  document.querySelectorAll('div[class="tile"]').forEach(tile => {
    tile.addEventListener('click', function (event) {
      console.log('Tile clicked:', this.id);
      if (!activeHaveCard) {
        return;
      }
      event.stopPropagation();

      const cardName = activeHaveCard.querySelector('h3')?.textContent.trim();
      const nameToBuildingClass = {
        '궁수 타워': 'building1',
        '머스킷 타워': 'building2',
        '저격수 타워': 'building3',
        '화살': 'building4',
        '폭격': 'building5',
        '.': 'building6',
      };

      const buildingClass = nameToBuildingClass[cardName];
      if (!buildingClass) {
        return;
      }

      let buildingDiv = document.getElementById('building');
      if (!buildingDiv) {
        console.error("ID가 'building'인 템플릿 요소를 찾을 수 없습니다.");
        return;
      }

      const newBuilding = buildingDiv.cloneNode(true);
      newBuilding.classList.add(buildingClass);
      newBuilding.style.display = 'block';

      const cardInstance = activeHaveCard.cardInstance;
      if (!cardInstance) {
        return;
      }

      newBuilding.dataset.damage = cardInstance.damage;
      newBuilding.dataset.range = cardInstance.range;
      newBuilding.dataset.cooldown = cardInstance.cooldown;

      const tileRect = this.getBoundingClientRect();
      const parentRect = this.parentNode.getBoundingClientRect();
      const left = tileRect.left - parentRect.left;
      const top = tileRect.top - parentRect.top;
      newBuilding.style.left = left + 'px';
      newBuilding.style.top = top + 'px';
      this.parentNode.appendChild(newBuilding);
      registerNewTower(newBuilding, buildingClass);

      if (activeHaveCard) {
        activeHaveCard.remove();
        activeHaveCard = null;
        repositionHaveCards();
      }
      isGamePaused = false;
      resumeSurvivalTimer();
      if (!monsterCreationStarted) {
        monsterMove();
        monsterCreationStarted = true;
      }
    });
  });
}

// card >------------------------------------------------------------------------------------------------------------------
function repositionHaveCards() {
  const container = document.getElementById('haveCardContainer');
  if (!container) {
    console.error("ID가 'haveCardContainer'인 요소를 찾을 수 없습니다.");
    return;
  }
  const cards = Array.from(container.querySelectorAll('.haveCard'));
  const cardWidth = 192;
  const overlap = 96;

  const totalWidth = cardWidth + (cards.length - 1) * (cardWidth - overlap);
  const startX = -totalWidth / 2;

  cards.forEach((card, i) => {
    const offsetX = startX + i * (cardWidth - overlap);
    card.style.position = 'absolute';
    card.style.left = `calc(50% + ${offsetX}px)`;
    card.style.zIndex = `${100 + i}`;
  });
}

function showChoice() {
  isGamePaused = true;
  pauseSurvivalTimer(); // 카드 선택 화면 표시 시 타이머 일시 정지

  // monsterDelayInterval이 실행 중이라면 정지
  if (monsterDelayInterval !== null) {
    clearInterval(monsterDelayInterval);
    monsterDelayInterval = null;
    console.log("몬스터 딜레이 감소 인터벌 일시 정지");
  }

  const choiceBackground = document.getElementById('choiceBackground');
  if (!choiceBackground) {
    console.error("ID가 'choiceBackground'인 요소를 찾을 수 없습니다.");
    return;
  }
  choiceBackground.style.display = 'block';
  choiceBackground.dataset.locked = 'false';

  document.querySelectorAll('.choiceCard').forEach(card => card.remove());
  const haveCardContainer = document.getElementById('haveCardContainer');
  if (!haveCardContainer) {
    console.error("ID가 'haveCardContainer'인 요소를 찾을 수 없습니다.");
    return;
  }
  haveCardContainer.classList.add('hide');

  for (let i = -1; i < 2; i++) {
    const cardInstance = CardFactory.createRandomCard();
    const card = cardInstance.element;
    card.cardInstance = cardInstance;

    card.style.display = 'block';
    card.style.left = `calc(50% + ${256 * i}px)`;
    card.style.top = '50%';
    card.style.transform = 'translate(-50%, -50%)';
    card.classList.add('choiceCard');

    card.addEventListener('click', function (event) {
      event.stopPropagation();

      if (choiceBackground.dataset.locked === 'true') return;
      choiceBackground.dataset.locked = 'true';

      choiceBackground.style.display = 'none';
      if (haveCardContainer) {
        haveCardContainer.classList.remove('hide');
      }

      document.querySelectorAll('.choiceCard').forEach(c => c.remove());

      const newHaveCard = card.cloneNode(true);
      newHaveCard.classList.remove('choiceCard');
      newHaveCard.classList.add('haveCard');
      newHaveCard.style.position = 'relative';
      newHaveCard.style.left = '';
      newHaveCard.style.bottom = '';
      newHaveCard.style.transform = '';
      newHaveCard.style.zIndex = '10';
      newHaveCard.cardInstance = card.cardInstance;
      newHaveCard.style.display = 'block';

      if (haveCardContainer) {
        haveCardContainer.appendChild(newHaveCard);
        repositionHaveCards();
      }

      isGamePaused = false;
      resumeSurvivalTimer(); // 카드 선택 후 타이머 재개
      monsterMove(); // 몬스터 생성 시작 (monsterDelayInterval 재설정 포함)
      monsterCreationStarted = true;
    });
    document.body.appendChild(card);
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
  if (!event.target.classList.contains('haveCard') && !event.target.classList.contains('tile')) {
    if (activeHaveCard) {
      activeHaveCard.classList.remove('highlightCard');
      activeHaveCard = null;
    }
  }
});


//moster>------------------------------------------------------------------------------------------------------------------
function monsterMove() {
  function spawnMonster() {
    if (isGamePaused || fail) return;

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

    const speed = 2;
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
          newMonster.style.backgroundImage = "url(slimeAttack.gif)";
        }
        return;
      }

      const angle = Math.atan2(dy, dx);
      monsterLeft += Math.cos(angle) * speed;
      monsterTop += Math.sin(angle) * speed;

      newMonster.style.left = Math.round(monsterLeft) + 'px';
      newMonster.style.top = Math.round(monsterTop) + 'px';
    }, 20);

    // 다음 몬스터 예약
    setTimeout(spawnMonster, monsterDelay);
  }

  spawnMonster();

  // 몬스터 생성 딜레이 조절 인터벌이 아직 설정되지 않았을 때만 설정
  if (monsterDelayInterval === null) {
    monsterDelayInterval = setInterval(() => {
      monsterDelay = Math.max(minDelay, monsterDelay - delayReduction);
      console.log(`현재 몬스터 생성 속도: ${monsterDelay}ms`);
    }, 30000); // 1분마다
    console.log("몬스터 딜레이 감소 인터벌 시작");
  }
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
  // 수정: alert 이전에 isGamePaused를 true로 설정하여 게임 일시 정지
  isGamePaused = true; // 게임 상태를 알림창 전에 일시 정지

  // 몬스터 딜레이 감소 인터벌이 실행 중이라면 정지
  if (monsterDelayInterval !== null) {
    clearInterval(monsterDelayInterval);
    monsterDelayInterval = null;
    console.log("레벨업 알림 전 몬스터 딜레이 감소 인터벌 정지");
  }

  // 알림창이 뜨기 전 시간 기록
  const preAlertTime = Date.now();
  alert(`레벨 업! 당신은 이제 레벨 ${currentLevel}입니다! 새로운 카드를 선택하세요.`);
  // 알림창이 닫힌 후 시간 기록
  const postAlertTime = Date.now();

  // 알림창이 떠 있던 시간만큼 totalPausedTime에 추가
  totalPausedTime += (postAlertTime - preAlertTime);

  showChoice(); // showChoice에서 다시 pauseSurvivalTimer 호출
  updateUILevel();
  updateUIExp();

  // showChoice()에서 isGamePaused = false; 및 monsterMove()가 호출되므로,
  // monsterMove() 내에서 monsterDelayInterval이 다시 설정될 것입니다.
  // 이 위치에서는 별도로 monsterDelayInterval을 재시작할 필요가 없습니다.
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