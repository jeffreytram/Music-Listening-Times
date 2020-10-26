const style = getComputedStyle(document.body);
const red = style.getPropertyValue('--red');
const green = style.getPropertyValue('--green');
const blue = style.getPropertyValue('--blue');
const textColor = style.getPropertyValue('--text-color');

const root = document.documentElement;
const fac = new FastAverageColor();

/**
 * Handles filter functionality
 * @param {string} type the type of filter
 * @param {string} value the value to filter by
 */
function filterController(type, value) {
  clearHighlight()
  if (type === "song") {
    filterSong(value);
    updateCircles(5, .5);
  } else if (type === "artist") {
    filterArtist(value);
    updateCircles(5, .5);
  } else if (type === "album") {
    filterAlbum(value);
    updateCircles(5, .5);
  } else if (type === "day") {
    filterDay(value);
    updateCircles(3, .3);
  }
  drawCanvasBars();
  displayNumEntries();
}

/**
 * Filters the current month's data by the given song's name
 * @param {string} song The song name to filter by
 */
function filterSong(song) {
  filteredDatasetMonth = datasetMonth.filter(d => d.SongTitle === song);
}

/**
 * Filters the current month's data by the given arist's name
 * @param {string} artist The artist's name to filter by
 */
function filterArtist(artist) {
  filteredDatasetMonth = datasetMonth.filter(d => d.Artist === artist);
}

/**
 * Filters the current month's data by the given album's name
 * @param {string} category The album's name to filter by
 */
function filterAlbum(album) {
  filteredDatasetMonth = datasetMonth.filter(d => d.Album === album);
}

/**
 * Filters the current month's data by the given list of days
 * @param {array} days The list of days to filter by
 */
function filterDay(days) {
  let newDataset = [];
  days.forEach(function (day) {
    newDataset = newDataset.concat(datasetMonth.filter(d => d.Day === day));
  });
  //if no days selected, display all
  if (days.length > 0) {
    filteredDatasetMonth = newDataset;
  } else {
    filteredDatasetMonth = datasetMonth;
  }
}

/**
 * Switches the current month's data to the newly selected month's data
 * @param {array} range Array containing the upper date range, and lower date range
 */
function filterRange(range) {
  const lowerRange = range[1];
  let key = (lowerRange.getMonth() + 1) + ' ' + lowerRange.getFullYear()
  datasetMonth = buckets[key];
  filteredDatasetMonth = datasetMonth;
}

/**
 * Reset controller.
 * Clears all filters and selections, and updates the visualizaiton accordingly
 */
function resetGraph() {
  displayNumEntries();
  updateCircles();
  drawCanvasBars();
  clearHighlight();
  clearDayFilters();
  clearInput();
}

/**
 * Resets the checkbox filters (day filters)
 */
function clearDayFilters() {
  const input = document.getElementsByTagName('input');
  const checkbox = Array.from(input).filter(input => input.type === "checkbox");
  Array.from(checkbox).forEach(function (cb) {
    cb.checked = false;
    let change = new Event('change');
    cb.dispatchEvent(change);
  });
}

/**
 * Resets the values in the text inputs
 */
function clearInput() {
  const filterInput = document.getElementById('filter-input');
  filterInput.value = '';
}

/**
 * Initial render of the current month's data
 */
function renderCircles() {
  //filtered selection
  var point = svg.selectAll('.point')
    .data(filteredDatasetMonth, d => d.ConvertedDateTime)

  var pointEnter = point.enter()
    .append('g')
    .attr('class', 'point')

  pointEnter.merge(point)
    .attr('transform', d => {
      var tx = xScale(d.Time);
      var ty = yScale(d.Date);
      return 'translate(' + [tx, ty] + ')';
    });

  //add circle to group
  pointEnter.append('circle')
    .attr('r', 3)
    .style('fill', textColor)
    .style('opacity', .3)
    .on("click", function (d) {
      hideInstructions();
      clearDayFilters();
      displaySongInfo(d);
      displayTags(d);
      clearHighlight();
      singleHighlight(d3.select(this));
    });
}

/**
 * Draws the single axis vertical bar visualization
 */
function drawCanvasBars() {
  const width = canvas.node().width;
  const height = canvas.node().height;

  //object with prop and methods used to render graphics in canvas element
  let context = canvas.node().getContext('2d');

  // clear canvas
  context.clearRect(0, 0, width, height);

  for (let i = 0; i < filteredDatasetMonth.length; i++) {
    let d = filteredDatasetMonth[i];

    //draw rect
    context.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.1)`;
    context.fillRect(xScale(d.Time), 0, 3, height);
  }
}

/**
 * Updates the filtered data points accordingly
 * Points filtered out are more transparent. The other points are more opaque
 * @param {number} displaySize The radius size to set the filtered data points to
 * @param {number} viewOpacity The opaciity to set the filtered data points to
 */
function updateCircles(displaySize = 3, viewOpacity = .3) {
  //filtered selection
  var point = svg.selectAll('.point')
    .data(filteredDatasetMonth, d => d.ConvertedDateTime)

  point.select("circle")
    .attr('r', displaySize)
    .style('opacity', viewOpacity);

  //remove filtered out circles
  point.exit()
    .select("circle")
    .attr('r', 3)
    .style('opacity', .07);
}

/**
 * Renders the new month's data
 */
function updateCirclesRange(displaySize = 3, viewOpacity = .3) {
  //filtered selection
  var point = svg.selectAll('.point')
    .data(datasetMonth, d => d.ConvertedDateTime)

  var pointEnter = point.enter()
    .append('g')
    .attr('class', 'point')

  pointEnter.merge(point)
    .attr('transform', d => {
      var tx = xScale(d.Time);
      var ty = yScale(d.Date);
      return 'translate(' + [tx, ty] + ')';
    });

  //add circle to group
  pointEnter.append('circle')
    .attr('r', displaySize)
    .style('fill', textColor)
    .style('opacity', viewOpacity)
    .on("click", function (d) {
      hideInstructions();
      clearDayFilters();
      displaySongInfo(d);
      displayTags(d);
      clearHighlight();
      singleHighlight(d3.select(this));
    });

  //remove filtered out circles
  point.exit().remove();
}

/**
 * Hides the initial instructions
 */
function hideInstructions() {
  const instructions = document.getElementById('temp-instructions');
  instructions.style.display = 'none';
}


/**
 * Updates the yScale to the current yState
 */
function updateYAxis() {
  yScale.domain(yState);
  yAxisG.transition()
    .ease(d3.easePoly)
    .duration(750)
    .call(d3.axisLeft(yScale));
}

/**
 * Displays the length of the current month's data
 */
function displayNumEntries() {
  //display length of fitlered list
  document.getElementById("entry-count").innerHTML = filteredDatasetMonth.length;
}

/**
 * Handles the changing of months
 * Updates all the data as needed and resets the filters
 * @param {Object} date The date to update to
 */
function changeDateRange(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  yState = [lastDay, firstDay];

  // Update chart
  updateYAxis();
  filterRange(yState);
  displayNumEntries();
  updateCirclesRange();
  drawCanvasBars();
  clearDayFilters();
  clearInput();
}

/**
 * Switches from the current month to the next month
 */
function changeNextMonth() {
  const currDate = new Date(getSelectedValue());
  const year = currDate.getFullYear();
  const month = currDate.getMonth();
  const nextMonth = new Date(year, month + 1, 1);

  const nextMonthText = nextMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  if (validMonth(nextMonthText)) {
    changeDateRange(nextMonth);
  };
}

/**
 * Switches from the current month to the previous month
 */
function changePrevMonth() {
  const currDate = new Date(getSelectedValue());
  const year = currDate.getFullYear();
  const month = currDate.getMonth();
  const prevMonth = new Date(year, month - 1, 1);

  const prevMonthText = prevMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' });
  if (validMonth(prevMonthText)) {
    changeDateRange(prevMonth);
  }
}

/**
 * Checks if the given month/year is in the data
 */
function validMonth(month) {
  let selector = document.getElementById('date-range');
  for (let i = 0; i < selector.options.length; i++) {
    if (selector.options[i].text === month) {
      selector.selectedIndex = i;
      return true;
    }
  }
  return false;
}

/**
 * Retrieves the value of the option selected from the month dropdown selector
 */
function getSelectedValue() {
  let selectList = document.getElementById("date-range");
  let selectedValue = selectList.options[selectList.selectedIndex].value;
  return selectedValue;
}

/**
 * highlights the given point
 * @param {Pt} dot The point to highlight
 */
function singleHighlight(dot) {
  filterController('artist', dot._groups[0][0].__data__.Artist);
  dot.transition()
    .ease(d3.easePoly)
    .duration(750)
    .attr('r', 10)
    .style('opacity', .5)
    .style('fill', 'red')
    .attr('class', 'point selected');
}

/**
 * Clears the highlight of the highlighted circle
 */
function clearHighlight() {
  svg.select('.selected')
    .attr('r', 3)
    .style('fill', '#303030')
    .attr('class', 'point');
}

/**
 * creates an event listener filter
 * @param {string} type The type of filter
 * @param {HTML element} element The element too add the event listener to
 * @param {string} sourceValue Where the value to filter by comes from
 */
function addFilter(type, element, sourceValue) {
  element.addEventListener("click", function () {
    let filterValue;
    const select = document.getElementById('filter-select');
    const input = document.getElementById('filter-input');
    if (sourceValue === "input") {
      //filter value is the user input in text field
      filterValue = input.value;
      filterController(select.value, filterValue);
    } else if (sourceValue === "info") {
      //filter value is the text displayed in the info
      filterValue = element.innerHTML;
      select.value = type;
      input.value = filterValue;
      filterController(type, filterValue);
    }
  });
}

/**
 * Displays the selected song's info
 * @param {Object} song The song to display the info of
 */
function displaySongInfo(song) {
  const songInfo = document.getElementById('song-info');
  songInfo.style.display = 'block';

  let imgAlbumArt = document.getElementById('album-art');
  let divArtist = document.getElementsByClassName('artist');
  let divSong = document.getElementsByClassName('song');
  let divAlbum = document.getElementsByClassName('album');
  let divDate = document.getElementsByClassName('date');

  divArtist[0].innerText = song.Artist;
  divSong[0].innerText = song.SongTitle;
  divAlbum[0].innerText = song.Album;
  divDate[0].innerText = song.Day + ' ' + song.ConvertedDateTime;

  let albumArt = '';

  const getAlbumInfo = firebase.functions().httpsCallable('getAlbumInfo');
  getAlbumInfo(song).then(result => {
    albumInfo = JSON.parse(result.data);
    albumArt = albumInfo.album.image[2]['#text'];
    if (albumArt === '') {
      albumArt = 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png';
    }
    imgAlbumArt.src = albumArt;

    fac.getColorAsync(albumArt)
      .then(color => {
        console.log(color);
        const { value } = color;
        const r = value[0], g = value[1], b = value[2];
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (luma > 225) {
          root.style.setProperty('--secondary-color', `rgba(30,30,30,1)`);
          root.style.setProperty('--light-secondary', `rgba(30,30,30,.3)`);
          root.style.setProperty('--very-light-secondary', `rgba(30,30,30,.15)`);
          root.style.setProperty('--secondary-r', `30`);
          root.style.setProperty('--secondary-g', `30`);
          root.style.setProperty('--secondary-b', `30`);
        } else {
          root.style.setProperty('--secondary-color', `rgba(${r},${g},${b},1)`);
          root.style.setProperty('--light-secondary', `rgba(${r},${g},${b},.3)`);
          root.style.setProperty('--very-light-secondary', `rgba(${r},${g},${b},.15)`);
          root.style.setProperty('--secondary-r', `${r}`);
          root.style.setProperty('--secondary-g', `${g}`);
          root.style.setProperty('--secondary-b', `${b}`);
        }

      })
  });
}

/**
 * Gets and displays the tags of the given song's artist
 * @param {Object} song The song to retrieve the tags for
 */
function displayTags(song) {
  const getArtistTags = firebase.functions().httpsCallable('getArtistTags');
  getArtistTags(song).then(result => {
    const tags = JSON.parse(result.data);

    let divTags = document.getElementById('tagList');
    divTags.innerHTML = '';

    let apiTags = tags.toptags.tag;
    let topFiveTags = apiTags.slice(0, 5);
    for (let i = 0; i < topFiveTags.length; i++) {
      let spanElement = document.createElement('span');
      spanElement.className = 'tag';
      spanElement.innerText = topFiveTags[i].name;
      divTags.appendChild(spanElement);
    }
  });
}

//Initialization
const width = 950;
const height = 540;
const padding = { left: 90, right: 40, top: 10, down: 60 };

//Where to add the graph to
svg = d3.select('#main-graph')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [0, 0, width, height])
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .classed('svg-content', true);

//append x-axis
var xAxisG = svg.append('g')
  .attr('class', 'x axis')
  .attr('transform', `translate(0, ${height - padding.down})`)

//append y-axis
var yAxisG = svg.append('g')
  .attr('class', 'y axis')
  .attr('transform', `translate(${padding.left}, 0)`)

//Initial load of the data. Default view, no filter
d3.csv('lastfm-data-utf.csv').then(dataset => {
  //convert date string to data object
  let newDate = new Date();
  newDate.setHours(0, 0, 0, 0);
  let newDateMilis = newDate.getTime();

  entireDataset = dataset;
  datesetMonth = [];
  filteredDatasetMonth = [];

  //sorts all the data into buckets by the month and year
  buckets = {};
  dataset.forEach(d => {
    d.Date = new Date(d.Date);
    //add to bucket
    let key = (d.Date.getMonth() + 1) + " " + d.Date.getFullYear();
    if (buckets[key] === undefined) {
      buckets[key] = [];
    }
    buckets[key].push(d);

    var parts = d.Time.split(/:/);
    var timePeriodMillis = (parseInt(parts[0], 10) * 60 * 60 * 1000) +
      (parseInt(parts[1], 10) * 60 * 1000)
    d.Time = new Date()
    d.Time.setTime(newDateMilis + timePeriodMillis);
  });

  //cursor position vertical line
  let line = svg.append('path')
    .style('stroke', 'var(--secondary-color')
    .style('stroke-width', '3px')
    .style('stroke-dasharray', '4');

  svg
    .on('mousemove', function () {
      let mouse = d3.mouse(this);
      line.attr('d', function () {
        //d = 'M100,0 L100,460
        //move to 100,460 then line to 100,0
        let d = 'M' + mouse[0] + ',0 ';
        d += 'L' + mouse[0] + `,${height - padding.down}`;
        return d;
      });
    })
    .on('mouseover', function () {
      line.style('opacity', .4)
    })
    .on('mouseout', function () {
      line.style('opacity', 0);
    })

  //x-axis scale
  xScale = d3.scaleTime()
    .domain(d3.extent(dataset, d => d.Time))
    .range([padding.left, width - padding.right]);

  //y-axis scale
  yScale = d3.scaleTime()
    .domain([new Date("10/31/2020"), new Date("10/1/2020")])
    .range([padding.top, height - padding.down]);

  //x-axis line
  var xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeHour.every(2))
    .tickFormat(d3.timeFormat('%H:%M'));

  //y-axis line
  yAxis = d3.axisLeft(yScale)

  xAxisG.call(xAxis);

  //append x-axis label
  svg.append('text')
    .attr('class', 'x label')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(${(padding.left + width - padding.right) / 2}, ${height - padding.down / 4})`)
    .text('Time of Day (hrs:mins)');


  yAxisG.call(yAxis);

  //append y-axis label
  svg.append('text')
    .attr('class', 'x label')
    .attr('text-anchor', 'middle')
    .attr('transform', `translate(${padding.left / 4}, ${(padding.top + height - padding.down) / 2}) rotate(-90)`)
    .text('Date');

  // Initialzation of global object to store state of the y-axis range
  yState = [new Date("10/31/2020"), new Date("10/1/2020")];

  // intialization of global object to store the month's data we want to display
  datasetMonth = buckets["10 2020"];
  // intialization of global object to store the month's data we want to display
  filteredDatasetMonth = datasetMonth;

  filterRange(yState);
  //render all data points
  displayNumEntries();
  renderCircles();

  //creating canvas
  //DOM element
  canvas = d3.select('#canvas')
    .attr('width', width)
    .attr('height', 45);

  drawCanvasBars();

  //song, artist, and album filter
  const submitFilter = document.getElementById('submit-button');
  addFilter(null, submitFilter, 'input');

  let clickableFilters = ["album", "artist", "song"];
  clickableFilters.forEach(type => {
    let clickable = document.getElementsByClassName(type);
    addFilter(type, clickable[0], "info");
  });

  //multiple day filter event listener
  let checkbox = document.getElementsByTagName('input');
  checkbox = Array.from(checkbox).filter(input => input.type === "checkbox");
  let checkedDays = [];
  Array.from(checkbox).forEach(function (cb) {
    cb.addEventListener('change', function () {
      if (this.checked) {
        checkedDays.push(this.value);
      } else {
        checkedDays = checkedDays.filter(day => day !== this.value);
      }
      filterController("day", checkedDays);
    });
  });

  //change date range
  let selectList = document.getElementById("date-range");
  selectList.addEventListener("change", function () {
    let selectedValue = selectList.options[selectList.selectedIndex].value;
    let date = new Date(selectedValue);
    changeDateRange(date);
  });

  //reset button
  let resetButton = document.getElementById("reset");
  resetButton.addEventListener("click", function () {
    resetGraph();
  });

  //left/right buttons
  let nextButton = document.getElementById('right');
  nextButton.addEventListener("click", function () {
    changeNextMonth();
  });
  let prevButton = document.getElementById('left');
  prevButton.addEventListener("click", function () {
    changePrevMonth();
  });

  //finished loading
  const loading = document.getElementById('loading');
  const content = document.getElementById('content-container');

  loading.style.display = 'none';
  content.style.display = 'block';
});