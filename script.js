let currentExp = 0;
let currentLevel = 1;
let expToNextLevel = 10;
let monsterCreationStarted = false;
let isGamePaused = true;
let startTime = null;
let survivalInterval = null;
let totalPausedTime = 0;
let pauseStartTime = null;
let fail = false;
let mainAttackInterval = null;
const TILE_SIZE = 64;

// monsterClass >------------------------------------------------------------------------------------------------------------------
let monsterDelay = 3000;
let minDelay = 250;
let delayReduction = 275;
let monsterDelayInterval = null;

class MonsterFactory {
  static createRandomMonster(level) {
    const monsterTypes = ['slime', 'goblin'];
    const randomType = monsterTypes[Math.floor(Math.random() * monsterTypes.length)];

    switch (randomType) {
      case 'slime': return new SlimeMonster(level);
      case 'goblin': return new GoblinMonster(level);
      default: return new SlimeMonster(level);
    }
  }
}

class Monster {
  constructor(type, name, hp, speed, expValue, image, attackImage, range) {
    this.type = type;
    this.name = name;
    this.hp = hp;
    this.maxHp = hp;
    this.speed = speed;
    this.expValue = expValue;
    this.image = image;
    this.attackImage = attackImage;
    this.range = range;

    this.element = this.createMonsterElement();
  }

  createMonsterElement() {
    const monsterDiv = document.createElement('div');
    monsterDiv.classList.add('monster', this.type);
    monsterDiv.style.backgroundImage = `url(${this.image})`;
    monsterDiv.style.display = 'block';
    monsterDiv.style.width = '64px';
    monsterDiv.style.height = '64px';
    monsterDiv.style.position = 'fixed';

    monsterDiv.dataset.hp = this.hp;
    monsterDiv.dataset.maxHp = this.maxHp;
    monsterDiv.dataset.expValue = this.expValue;
    monsterDiv.dataset.moveSpeed = this.speed;
    monsterDiv.dataset.reached = 'false';
    monsterDiv.dataset.attackImage = this.attackImage;
    monsterDiv.dataset.range = this.range;
    monsterDiv.style.transform = 'scaleX(1)';

    const hpBar = document.createElement('div');
    hpBar.className = 'hp-bar';

    const hpInner = document.createElement('div');
    hpInner.className = 'hp-inner';
    hpInner.style.width = '100%';

    hpBar.appendChild(hpInner);
    monsterDiv.appendChild(hpBar);

    return monsterDiv;
  }
}

class SlimeMonster extends Monster {
  constructor(level) {
    const baseHp = 10 + (level - 1) * 5;
    const baseSpeed = 2 + (level - 1) * 0.1;
    const baseExp = 5 + (level - 1) * 2;
    super('slime', '슬라임', baseHp, baseSpeed, baseExp, 'slime.gif', 'slimeAttack.gif', 0);
  }
}

class GoblinMonster extends Monster {
  constructor(level) {
    const baseHp = 20 + (level - 1) * 8;
    const baseSpeed = 2.5 + (level - 1) * 0.15;
    const baseExp = 10 + (level - 1) * 3;
    super('goblin', '고블린', baseHp, baseSpeed, baseExp, 'goblin.gif', 'goblinAttack.gif', 3);
  }
}

// start >-----------------------------------------------------------------------------------------------------------------
window.onload = function () {
  const main = document.getElementById('main');
  main.dataset.hp = 100;
  main.dataset.maxHp = 100;
  const hpBar = document.createElement('div');
  hpBar.className = 'hp-bar';
  hpBar.innerHTML = `<div class=\"hp-inner\" style=\"width: 100%;\"></div>`;
  main.appendChild(hpBar);

  generateMap();
  showChoice();

  startTowerAttackLoop();
  startMainUnderAttackLoop();

  updateUIExp();
  updateUILevel();

  rangePreviewDiv = document.getElementById('spellRangePreview');

  document.body.addEventListener('mousemove', handleDocumentMouseMove);
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
      '단일 대상에게 작은 피해',
      '지정된 위치에 범위 피해',
      '맵 전체에 막대한 피해'
    ][level - 1];

    switch (level) {
      case 1:
        this.spellDamage = 10;
        this.radius = 1;
        break;
      case 2:
        this.spellDamage = 30;
        this.radius = 3;
        break;
      case 3:
        this.spellDamage = 100;
        this.radius = 5;
        break;
    }

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
  if (["building1", "building2", "building3"].includes(buildingClass)) {
    newBuilding.isReady = true;
    newBuilding.cooldownTimer = null;
    towerList.push(newBuilding);
  } else {
  }
}

function startTowerAttackLoop() {
  const mainCenterX = 64 + 128 / 2;
  const mainCenterY = 0 + 192 / 2;

  const imageMap = {
    building1: { normal: 'archer.png', reload: 'archerReload.gif' },
    building2: { normal: 'musket.png', reload: 'musketReload.gif' },
    building3: { normal: 'sniper.png', reload: 'sniperReload.gif' },
  };

  setInterval(() => {
    if (isGamePaused) return;

    const monsters = Array.from(document.querySelectorAll('.monster'));

    towerList.forEach(tower => {
      if (!tower.isReady || tower.cooldownTimer !== null) return;

      const towerLeft = parseFloat(getComputedStyle(tower).left);
      const towerTop = parseFloat(getComputedStyle(tower).top);
      const range = parseFloat(tower.dataset.range) || 128;
      const damage = parseInt(tower.dataset.damage) || 2;
      const towerClass = Array.from(tower.classList).find(cls => /^building[1-3]$/.test(cls));

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

      if (towerClass === 'building1' || towerClass === 'building2') {
        monstersInRange.sort((a, b) => {
          const aLeft = parseFloat(getComputedStyle(a).left);
          const aTop = parseFloat(getComputedStyle(a).top);
          const bLeft = parseFloat(getComputedStyle(b).left);
          const bTop = parseFloat(getComputedStyle(b).top);
          const aDist = Math.hypot(aLeft + 32 - mainCenterX, aTop + 32 - mainCenterY);
          const bDist = Math.hypot(bLeft + 32 - mainCenterX, bTop + 32 - mainCenterY);
          return aDist - bDist;
        });
        targetMonster = monstersInRange[0];
      } else if (towerClass === 'building3') {
        monstersInRange.sort((a, b) => {
          const aHp = parseInt(a.dataset.maxHp);
          const bHp = parseInt(b.dataset.maxHp);
          return bHp - aHp;
        });
        targetMonster = monstersInRange[0];
      } else {
        monstersInRange.sort((a, b) => {
          const aLeft = parseFloat(getComputedStyle(a).left);
          const aTop = parseFloat(getComputedStyle(a).top);
          const bLeft = parseFloat(getComputedStyle(b).left);
          const bTop = parseFloat(getComputedStyle(b).top);
          const aDist = Math.hypot(aLeft - towerLeft, aTop - towerTop);
          const bDist = Math.hypot(bLeft - towerLeft, bTop - towerTop);
          return aDist - bDist;
        });
        targetMonster = monstersInRange[0];
      }

      if (targetMonster) {
        const images = imageMap[towerClass];

        if (images) {
          tower.style.setProperty('background-image', `url(${images.reload})`, 'important');
          tower.style.backgroundSize = 'cover';
        }

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
        });

        tower.isReady = false;

        tower.cooldownTimer = setTimeout(() => {
          tower.isReady = true;
          tower.cooldownTimer = null;

          if (images) {
            tower.style.setProperty('background-image', `url(${images.normal})`, 'important');
          }
        }, parseFloat(tower.dataset.cooldown) || 1000);
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

// spell >------------------------------------------------------------------------------------------------------------------
let isSpellTargetingMode = false;
let activeSpellCardInstance = null;
let rangePreviewDiv = null;

function applyAoESpell(centerX, centerY, spellDamage, radiusBlocks) {
  const pixelRadius = radiusBlocks * TILE_SIZE;

  const monsters = document.querySelectorAll('.monster');
  monsters.forEach(monster => {
    const monsterRect = monster.getBoundingClientRect();
    const monsterCenterX = monsterRect.left + monsterRect.width / 2;
    const monsterCenterY = monsterRect.top + monsterRect.height / 2;

    const dx = monsterCenterX - centerX;
    const dy = monsterCenterY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= pixelRadius) {
      let hp = parseInt(monster.dataset.hp);
      hp -= spellDamage;
      monster.dataset.hp = hp;

      const inner = monster.querySelector('.hp-inner');
      const maxHp = parseInt(monster.dataset.maxHp);
      if (inner) {
        inner.style.width = (hp / maxHp * 100) + '%';
      }

      if (hp <= 0) {
        const expGained = parseInt(monster.dataset.expValue) || 0;
        monster.remove();
        gainExperience(expGained);
        console.log(`몬스터 처치: ${expGained} EXP 획득`);
      }
    }
  });
}

function showSpellEffect(x, y, radiusBlocks) {
  const effectPixelRadius = radiusBlocks * TILE_SIZE;
  const effectDiv = document.createElement('div');
  effectDiv.classList.add('spell-explosion');
  effectDiv.style.width = `${effectPixelRadius * 2}px`;
  effectDiv.style.height = `${effectPixelRadius * 2}px`;
  effectDiv.style.left = `${x - effectPixelRadius}px`;
  effectDiv.style.top = `${y - effectPixelRadius}px`;
  document.body.appendChild(effectDiv);

  effectDiv.addEventListener('animationend', () => {
    effectDiv.remove();
  });
}

// monster >---------------------------------------------------------------------------------------------------------
let monsterSpawnInterval = null;

function shootGoblinProjectile(monster, mainElement) {
  const proj = document.createElement('div');
  proj.className = 'enemyProjectile';

  const monsterLeft = parseFloat(getComputedStyle(monster).left);
  const monsterTop = parseFloat(getComputedStyle(monster).top);
  proj.style.left = monsterLeft + 'px';
  proj.style.top = monsterTop + 'px';

  document.body.appendChild(proj);

  const mainRect = mainElement.getBoundingClientRect();
  const mainCenterX = mainRect.left + mainRect.width / 2;
  const mainCenterY = mainRect.top + mainRect.height / 2;

  const dx = mainCenterX - monsterLeft;
  const dy = mainCenterY - monsterTop;
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = angleRad * (180 / Math.PI);
  proj.style.transform = `rotate(${angleDeg}deg)`;

  const duration = 300;
  const frames = 20;
  const interval = duration / frames;

  let frame = 0;
  const move = setInterval(() => {
    frame++;
    const progress = frame / frames;
    proj.style.left = (monsterLeft + dx * progress) + 'px';
    proj.style.top = (monsterTop + dy * progress) + 'px';

    if (frame >= frames) {
      clearInterval(move);
      proj.remove();
    }
  }, interval);
}


function startMonsterCreation() {
  if (monsterSpawnInterval === null && !fail) {
    monsterSpawnInterval = setInterval(() => {
      if (!isGamePaused && !fail) {
        spawnMonster();
      }
    }, monsterDelay);
    console.log(`몬스터 생성 시작. 주기: ${monsterDelay}ms`);
  }
}

function stopMonsterCreation() {
  if (monsterSpawnInterval !== null) {
    clearInterval(monsterSpawnInterval);
    monsterSpawnInterval = null;
    console.log("몬스터 생성 중지");
  }
}

function monsterMove(monster, currentWayIndex) {
  if (isGamePaused || !monster || !monster.parentNode) {
    if (monster && monster.dataset) {
      monster.dataset.currentWayIndex = currentWayIndex;
    }
    return;
  }

  const moveSpeed = parseFloat(monster.dataset.moveSpeed);
  const nextWayIndex = currentWayIndex - 1;

  monster.dataset.currentWayIndex = nextWayIndex;

  const attackRange = parseInt(monster.dataset.range || '0');
  const maxAttackWayIndex = 1 + attackRange;

  if (nextWayIndex < maxAttackWayIndex) {
    monster.dataset.currentWayIndex = nextWayIndex;

    if (monster.dataset.reached !== 'true') {
      monster.dataset.reached = 'true';

      const attackImageFromDataset = monster.dataset.attackImage;
      monster.style.backgroundImage = `url(${attackImageFromDataset})`;
      console.log(`[monsterMove] Monster ${monster.id} started attacking.`);
    }

    requestAnimationFrame(() => monsterMove(monster, nextWayIndex));
    return;
  }

  const nextWay = document.getElementById(`way${nextWayIndex}`);
  if (!nextWay) {
    console.warn(`다음 way(${nextWayIndex})를 찾을 수 없습니다. 몬스터 이동 중단.`);
    return;
  }

  const monsterRect = monster.getBoundingClientRect();
  const nextWayRect = nextWay.getBoundingClientRect();

  const monsterCenterX = monsterRect.left + monsterRect.width / 2;
  const monsterCenterY = monsterRect.top + monsterRect.height / 2;
  const nextWayCenterX = nextWayRect.left + nextWayRect.width / 2;
  const nextWayCenterY = nextWayRect.top + nextWayRect.height / 2;

  const dx = nextWayCenterX - monsterCenterX;
  const dy = nextWayCenterY - monsterCenterY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (nextWayIndex === 24) {
    if (monster.dataset.flippedAt25 !== 'true') {
      let currentScaleX = monster.style.transform.includes('scaleX(-1)') ? -1 : 1;
      monster.style.transform = `scaleX(${currentScaleX * -1})`;
      monster.dataset.flippedAt25 = 'true';
      console.log(`[monsterMove Debug] Monster ID: ${monster.id} flipped at way25. New transform: ${monster.style.transform}`);
    }
  } else if (nextWayIndex === 11) {
    if (monster.dataset.flippedAt12 !== 'true') {
      let currentScaleX = monster.style.transform.includes('scaleX(-1)') ? -1 : 1;
      monster.style.transform = `scaleX(${currentScaleX * -1})`;
      monster.dataset.flippedAt12 = 'true';
      console.log(`[monsterMove Debug] Monster ID: ${monster.id} flipped at way12. New transform: ${monster.style.transform}`);
    }
  }

  if (distance < moveSpeed) {
    monster.style.left = `${nextWayRect.left}px`;
    monster.style.top = `${nextWayRect.top}px`;
    requestAnimationFrame(() => monsterMove(monster, nextWayIndex));
  } else {
    const angle = Math.atan2(dy, dx);
    const moveX = moveSpeed * Math.cos(angle);
    const moveY = moveSpeed * Math.sin(angle);

    monster.style.left = `${parseFloat(monster.style.left) + moveX}px`;
    monster.style.top = `${parseFloat(monster.style.top) + moveY}px`;
    requestAnimationFrame(() => monsterMove(monster, currentWayIndex));
  }
}

function spawnMonster() {
  if (isGamePaused || fail) return;

  const newMonsterInstance = MonsterFactory.createRandomMonster(currentLevel);
  const newMonsterElement = newMonsterInstance.element;

  newMonsterElement.id = `monster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const way36 = document.getElementById('way36');
  const way36Rect = way36.getBoundingClientRect();

  newMonsterElement.style.left = `${way36Rect.left}px`;
  newMonsterElement.style.top = `${way36Rect.top}px`;

  document.body.appendChild(newMonsterElement);

  newMonsterElement.dataset.currentWayIndex = 36;
  monsterMove(newMonsterElement, 36);
}

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
  if (mainAttackInterval === null) {
    mainAttackInterval = setInterval(checkMainUnderAttack, 1000);
  }
}

function stopMainUnderAttackLoop() {
  if (mainAttackInterval !== null) {
    clearInterval(mainAttackInterval);
    mainAttackInterval = null;
  }
}

function checkMainUnderAttack() {
  if (isGamePaused || fail) return;

  const mainElement = document.getElementById('main');
  const mainHp = parseInt(mainElement.dataset.hp);
  const mainMaxHp = parseInt(mainElement.dataset.maxHp);
  const mainHpInner = mainElement.querySelector('.hp-inner');

  const monsters = document.querySelectorAll('.monster');
  let totalDamageThisTick = 0;

  monsters.forEach(monster => {
    if (monster.dataset.reached === 'true') {
      totalDamageThisTick += 1;

      if (monster.classList.contains('goblin')) {
        shootGoblinProjectile(monster, mainElement);
      }
    }
  });

  if (totalDamageThisTick > 0) {
    const newHp = mainHp - totalDamageThisTick;
    mainElement.dataset.hp = newHp;
    if (mainHpInner) {
      mainHpInner.style.width = (newHp / mainMaxHp * 100) + '%';
    }

    if (newHp <= 0 && !fail) {
      fail = true;
      alert('Game Over! 본진의 HP가 0이 되었습니다.');
      isGamePaused = true;
      stopMonsterCreation();
      stopTowerAttackLoop();
      stopMainUnderAttackLoop();
      pauseSurvivalTimer();
    }
  }
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
    if (isSpellTargetingMode) return;
    tile.addEventListener('click', function (event) {
      if (!activeHaveCard) {
        return;
      }
      event.stopPropagation();

      const cardName = activeHaveCard.querySelector('h3')?.textContent.trim();
      const nameToBuildingClass = {
        '궁수 타워': 'building1',
        '머스킷 타워': 'building2',
        '저격수 타워': 'building3',
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
  pauseSurvivalTimer();

  stopMonsterCreation();
  stopMainUnderAttackLoop();

  const choiceBackground = document.getElementById('choiceBackground');
  if (!choiceBackground) {
    return;
  }
  choiceBackground.style.display = 'block';
  choiceBackground.dataset.locked = 'false';

  document.querySelectorAll('.choiceCard').forEach(card => card.remove());
  const haveCardContainer = document.getElementById('haveCardContainer');
  if (!haveCardContainer) {
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
      resumeSurvivalTimer();

      document.querySelectorAll('.monster').forEach(monster => {
        const storedWayIndex = parseInt(monster.dataset.currentWayIndex);
        if (!isNaN(storedWayIndex) && monster.dataset.reached !== 'true') {
          requestAnimationFrame(() => monsterMove(monster, storedWayIndex));
        }
      });

      if (!monsterCreationStarted) {
        monsterCreationStarted = true;
      }
      startMonsterCreation();
      startMainUnderAttackLoop();
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

    const cardInstance = activeHaveCard.cardInstance;

    if (cardInstance && cardInstance.type === 'spell') {
      isSpellTargetingMode = true;
      activeSpellCardInstance = cardInstance;

      if (rangePreviewDiv) {
        rangePreviewDiv.style.display = 'block';
        const pixelRadius = activeSpellCardInstance.radius * TILE_SIZE;
        rangePreviewDiv.style.width = `${pixelRadius * 2}px`;
        rangePreviewDiv.style.height = `${pixelRadius * 2}px`;
      }

    } else {
      isSpellTargetingMode = false;
      activeSpellCardInstance = null;
      hideRangePreview();
    }
  }
  else if (isSpellTargetingMode && activeSpellCardInstance) {
    const clickX = event.clientX;
    const clickY = event.clientY;

    applyAoESpell(clickX, clickY, activeSpellCardInstance.spellDamage, activeSpellCardInstance.radius);
    showSpellEffect(clickX, clickY, activeSpellCardInstance.radius);

    isSpellTargetingMode = false;
    activeSpellCardInstance = null;
    hideRangePreview();

    if (activeHaveCard) {
      activeHaveCard.remove();
      activeHaveCard = null;
      repositionHaveCards();
    }
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

function handleDocumentMouseMove(event) {
  if (isSpellTargetingMode && rangePreviewDiv && activeSpellCardInstance) {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    rangePreviewDiv.style.left = `${mouseX}px`;
    rangePreviewDiv.style.top = `${mouseY}px`;
  }
}

function hideRangePreview() {
  if (rangePreviewDiv) {
    rangePreviewDiv.style.display = 'none';
  }
}

document.body.addEventListener('mousemove', handleDocumentMouseMove);


function selectCard(card, choiceBackground) {
  document.body.removeEventListener('click', handleDocumentClick);
  document.body.removeEventListener('mousemove', handleDocumentMouseMove);

  choiceBackground.style.display = 'none';

  if (card.type === 'tower') {
    handleTowerCardSelection(card);
  } else if (card.type === 'spell') {
    handleSpellCardSelection(card);
  }

  isGamePaused = false;
  resumeSurvivalTimer();
  startMonsterCreation();
  startMainUnderAttackLoop();
}


function handleTowerCardSelection(card) {
  isSpellTargetingMode = true;
  activeSpellCardInstance = card;

  document.body.addEventListener('click', handleDocumentClick);
  document.body.addEventListener('mousemove', handleDocumentMouseMove);
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
  isGamePaused = true;

  stopMonsterCreation();
  stopMainUnderAttackLoop();

  const preAlertTime = Date.now();
  alert(`레벨 업! 당신은 이제 레벨 ${currentLevel}입니다! 새로운 카드를 선택하세요.`);
  const postAlertTime = Date.now();

  totalPausedTime += (postAlertTime - preAlertTime);

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