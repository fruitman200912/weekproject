window.onload = function () {
  showChoice();
};

// map >------------------------------------------------------------------------------------------------------------------
let pm = 1;

//way >------------------------------------------------------------------------------------------------------------------
for (let i = 1; i < 33;) {
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
    activeHaveCard.remove();
    activeHaveCard = null;
    let buildingDiv = document.getElementById('building');
    const newBuilding = buildingDiv.cloneNode(true);
    newBuilding.id = 'building' + buildingNum++;
    newBuilding.style.display = 'block';
    newBuilding.style.left = this.style.left;
    newBuilding.style.top = this.style.top;
    this.parentNode.appendChild(newBuilding);
  });
})

// card >------------------------------------------------------------------------------------------------------------------
function showChoice() {
  const choiceBackground = document.getElementById('choiceBackground');
  choiceBackground.style.display = 'block';

  const baseCard = document.getElementById('card');

  let currentLeft = window.innerWidth / 2;

  for (let i = -1; i < 2; i++) {
    const newCard = baseCard.cloneNode(true);
    newCard.style.display = 'block';
    newCard.style.left = (currentLeft + (256 * i)) + "px";
    newCard.style.top = '50%';
    newCard.style.transform = 'translate(-50%, -50%)';
    newCard.classList.add('choiceCard');
    document.body.appendChild(newCard);

    newCard.addEventListener('click', function (event) {
      event.stopPropagation();

      choiceBackground.style.display = 'none';

      const newHaveCard = this.cloneNode(true);
      newHaveCard.classList.remove('choiceCard');
      newHaveCard.classList.add('haveCard');
      newHaveCard.style.display = 'block';
      newHaveCard.style.position = 'fixed';
      newHaveCard.style.left = '50%';
      newHaveCard.style.bottom = '0px';
      newHaveCard.style.transform = 'translate(-50%, 50%)';
      newHaveCard.style.zIndex = '100';
      document.body.appendChild(newHaveCard);

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