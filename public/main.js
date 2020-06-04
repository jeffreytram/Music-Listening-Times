const style = getComputedStyle(document.body);
const red = style.getPropertyValue('--red');
const green = style.getPropertyValue('--green');
const blue = style.getPropertyValue('--blue');
const textColor = style.getPropertyValue('--text-color');

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
function filterSong(song) {
    filteredDatasetMonth = datasetMonth.filter(d => d.SongTitle === song);
}

function filterArtist(artist) {
    filteredDatasetMonth = datasetMonth.filter(d => d.Artist === artist);
}
function filterAlbum(category) {
    filteredDatasetMonth = datasetMonth.filter(d => d.Album === category);
}

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

function filterRange(range) {
    const lowerRange = range[1];
    let key = (lowerRange.getMonth() + 1) + ' ' + lowerRange.getFullYear()
    datasetMonth = buckets[key];
    filteredDatasetMonth = datasetMonth;
}

function resetGraph() {
    filterRange(yState);
    displayNumEntries();
    updateCircles();
    drawCanvasBars();
    clearHighlight();
}

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
            displaySongInfo(d);
            displayTags(d);
            clearHighlight();
            singleHighlight(d3.select(this));
        });
}

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
        .style('opacity', .05);
}

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
            displaySongInfo(d);
            displayTags(d);
            clearHighlight();
            singleHighlight(d3.select(this));
        });

    //remove filtered out circles
    point.exit().remove();
}

function updateYAxis() {
    yScale.domain(yState);
    yAxisG.transition()
        .ease(d3.easePoly)
        .duration(750)
        .call(d3.axisLeft(yScale));
}

function displayNumEntries() {
    //display length of fitlered list
    document.getElementById("entry-count").innerHTML = filteredDatasetMonth.length;
}

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
}

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

function getSelectedValue() {
    let selectList = document.getElementById("date-range");
    let selectedValue = selectList.options[selectList.selectedIndex].value;
    return selectedValue;
}

//highlights the given circle element
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

//removes the highlight of the selected circle
function clearHighlight() {
    svg.select('.selected')
        .attr('r', 3)
        .style('fill', '#303030')
        .attr('class', 'point');
}

//creates an event listener filter
function addFilter(type, element, sourceValue) {
    element.addEventListener("click", function () {
        let filterValue;
        if (sourceValue === "input") {
            //filter value is the user input in text field
            filterValue = document.getElementById(type + "-input").value;
        } else if (sourceValue === "info") {
            //filter value is the text displayed in the info
            filterValue = element.innerHTML;
            document.getElementById(type + "-input").value = filterValue;
        }
        filterController(type, filterValue);
    });
}

//display the selected song's info
function displaySongInfo(song) {
    let divAlbumArt = document.getElementsByClassName("art");
    let divArtist = document.getElementsByClassName("artist");
    let divSong = document.getElementsByClassName("song");
    let divAlbum = document.getElementsByClassName("album");
    let divDate = document.getElementsByClassName("date");

    let albumArt = "";

    divArtist[0].innerText = song.Artist;
    divSong[0].innerText = song.SongTitle;
    divAlbum[0].innerText = song.Album;
    divDate[0].innerText = song.Day + " " + song.ConvertedDateTime;

    const getAlbumInfo = firebase.functions().httpsCallable('getAlbumInfo');
    getAlbumInfo(song).then(result => {
        albumInfo = JSON.parse(result.data);
        albumArt = albumInfo.album.image[2]["#text"];
        if (albumArt === "") {
            albumArt = 'https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png';
        }
        divAlbumArt[0].innerHTML = `<img src=${albumArt}>`;
    });
}

function displayTags(song) {
    const getArtistTags = firebase.functions().httpsCallable('getArtistTags');
    getArtistTags(song).then(result => {
        const tags = JSON.parse(result.data);

        let divTags = document.getElementById('tags');

        let apiTags = tags.toptags.tag;
        let topFiveTags = apiTags.slice(0, 5);
        let results = topFiveTags.map(tag => tag.name);

        divTags.innerText = results.join(', ');
    });
}

const width = 1100;
const height = 540;
const padding = {left: 90, right: 40, top: 40, down: 60};

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

//default view, no filter
d3.csv('lastfm-data-utf.csv').then(dataset => {
    //convert date string to data object
    let newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    let newDateMilis = newDate.getTime();

    datesetMonth = [];
    filteredDatasetMonth = [];

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

    //vertical line
    let line = svg.append('path')
        .style('stroke', '#158ced')
        .style('stroke-width', '3px')
        .style('stroke-dasharray', '4');

    svg
        .on('mousemove', function() {
            let mouse = d3.mouse(this);
            line.attr('d', function() {
                    //d = 'M100,0 L100,460
                    //move to 100,460 then line to 100,0
                    let d = 'M' + mouse[0] + ',0 ';
                    d += 'L' + mouse[0] + ',460';
                    return d;
                });
        })
        .on('mouseover', function() {
            line.style('opacity', .4)
        })
        .on('mouseout', function() {
            line.style('opacity', 0);
        })

    //x-axis scale
    xScale = d3.scaleTime()
        .domain(d3.extent(dataset, d => d.Time))
        .nice()
        .range([padding.left, width - padding.right]);

    //y-axis scale
    yScale = d3.scaleTime()
        .domain([new Date("5/31/2020"), new Date("5/1/2020")])
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
        .attr('transform', `translate(${padding.left / 4}, ${(padding.top + height - padding.down) / 2}) rotate(90)`)
        .text('Date');

    // Create global object called chartScales to keep state
    yState = [new Date("5/31/2020"), new Date("5/1/2020")];

    datasetMonth = buckets["2 2020"];
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
    let filters = ["song", "artist", "album"];
    filters.forEach(type => {
        let clickable = document.getElementById(type + "-filter-button");
        addFilter(type, clickable, "input");
    });

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
    })
});