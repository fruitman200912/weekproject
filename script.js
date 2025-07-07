// map
let pm = 1;
//way

for (let i = 1; i < 33;) {
  let j = i;
  for (; i < j + (i <= 11 ? 9 : 11); i++) {
    let wayDiv = document.getElementById('way' + i);
    const newNode = wayDiv.cloneNode(true);
    newNode.id = 'way' + (i + 1);
    let currentLeft = parseInt(getComputedStyle(wayDiv).left) || 0;
    newNode.style.left = (currentLeft + 64 * pm) + "px";
    wayDiv.parentNode.appendChild(newNode);
  }
  j = i;
  for (; i < j + 2 && i <= 33; i++) {
    let wayDiv = document.getElementById('way' + i);
    const newNode = wayDiv.cloneNode(true);
    newNode.id = 'way' + (i + 1);
    let currentTop = parseInt(getComputedStyle(wayDiv).top) || 0;
    newNode.style.top = (currentTop + 64) + "px";
    wayDiv.parentNode.appendChild(newNode);
  }
  pm *= -1;
}

// tile
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

    const newNode = tileDiv.cloneNode(true);
    newNode.id = 'tile' + (i + 1);

    newNode.style.left = (currentLeft + 64 * pm * k) + "px";

    newNode.style.top = (currentTop) + "px";

    tileDiv.parentNode.appendChild(newNode);
  }
  pm *= -1;
}
//------------------------------------------------------------------------------------------------------

// card
let activeCard = null;