function filterController(type, value) {
    clearHighlight()
    if (type === "song") {
        filterSong(value);
    } else if (type === "artist") {
        filterArtist(value);
    } else if (type === "album") {
        filterAlbum(value);
    } else if (type === "day") {
        filterDay(value);
    }
    displayNumEntries();
    updateCircles(5, .5);
}
function filterSong(song) {
    dataset = datasetMonth.filter(d => d.SongTitle === song);

}

function filterArtist(artist) {
    dataset = datasetMonth.filter(d => d.Artist === artist);
}
function filterAlbum(category) {
    dataset = datasetMonth.filter(d => d.Album === category);
}

function filterDay(days) {
    let newDataset = [];
    days.forEach(function (day) {
        newDataset = newDataset.concat(completeDataset.filter(d => d.Day === day));
    });
    //if no days selected, display all
    if (days.length > 0) {
        dataset = newDataset;
    } else {
        dataset = completeDataset;
    }
}

function filterRange(range) {
    const upperRange = range[0];
    const lowerRange = range[1];
    dataset = [];
    for (let i = 0; i < completeDataset.length; i++) {
        let curr = completeDataset[i];
        if (curr.Date >= lowerRange && curr.Date <= upperRange) {
            dataset.push(curr);
        }
        if (curr.Date < lowerRange) {
            break;
        }
    }
    datasetMonth = dataset;
}

function resetGraph() {
    filterRange(yState);
    displayNumEntries();
    updateCircles();
    clearHighlight();
}

function renderCircles() {
    //filtered selection
    var point = svg.selectAll('.point')
        .data(dataset, d => d.ConvertedDateTime)

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
        .style('fill', 'white')
        .style('opacity', .3)
        .on("click", function (d) {
            displaySongInfo(d);
            displayTags(d);
            clearHighlight();
            singleHighlight(d3.select(this));
        });
}

function updateCircles(displaySize = 3, viewOpacity = .3) {
    //filtered selection
    var point = svg.selectAll('.point')
        .data(dataset, d => d.ConvertedDateTime)

    point.select("circle")
        .attr('r', displaySize)
        .style('opacity', viewOpacity);

    //remove filtered out circles
    point.exit()
        .select("circle")
        .attr('r', 3)
        .style('opacity', .1);
}

function updateCirclesRange(displaySize = 3, viewOpacity = .3) {
    //filtered selection
    var point = svg.selectAll('.point')
        .data(dataset, d => d.ConvertedDateTime)

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
        .style('fill', 'white')
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
    document.getElementById("entry-count").innerHTML = dataset.length;
}

function changeDateRange(range) {
    const date = new Date(range);
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
}

//highlights the given circle element
function singleHighlight(dot) {
    filterController('artist', dot._groups[0][0].__data__.Artist);
    dot.transition()
        .ease(d3.easePoly)
        .duration(1000)
        .attr('r', 15)
        .style('fill', 'red')
        .attr('class', 'point selected');
}

//removes the highlight of the selected circle
function clearHighlight() {
    svg.select('.selected')
        .attr('r', 3)
        .style('fill', 'white')
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

    let apiAlbum = `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${config.API_KEY}&artist=${song.Artist}&album=${song.Album}&format=json`
    fetch(apiAlbum)
        .then(response => {
            return response.json();
        })
        .then(data => {
            albumArt = data.album.image[2]["#text"];
            if (albumArt === "") {
                albumArt = "https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png";
            }
            divAlbumArt[0].innerHTML = `<img src=${albumArt}>`;
            divArtist[0].innerHTML = song.Artist;
            divSong[0].innerHTML = song.SongTitle;
            divAlbum[0].innerHTML = song.Album;
            divDate[0].innerHTML = song.Day + " " + song.ConvertedDateTime;
        });
}

function displayTags(song) {
    let apiArtist = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptags&artist=${song.Artist}&api_key=${config.API_KEY}&format=json`;
    fetch(apiArtist)
        .then(response => {
            return response.json();
        })
        .then(data => {
            let divTags = document.getElementById("tags");

            let apiTags = data.toptags.tag;
            let tags = "";
            let end = (5 > apiTags.length) ? apiTags.length : 5;
            for (let i = 0; i < end; i++) {
                tags += apiTags[i].name;
                if (i != end - 1) {
                    tags += ", ";
                }
            }
            divTags.innerHTML = tags;
        });
}

const width = 1100;
const height = 540;

svg = d3.select('#main-graph')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .classed('svg-content', true);

//append x-axis
var xAxisG = svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,460)')

//append y-axis
var yAxisG = svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(100,0)')

//default view, no filter
d3.csv('lastfm-data-utf.csv').then(entireDataset => {
    //convert date string to data object
    let newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    let newDateMilis = newDate.getTime();

    completeDataset = entireDataset;
    dataset = entireDataset;
    datesetMonth = [];

    dataset.forEach(d => {
        d.Date = new Date(d.Date);

        var parts = d.Time.split(/:/);
        var timePeriodMillis = (parseInt(parts[0], 10) * 60 * 60 * 1000) +
            (parseInt(parts[1], 10) * 60 * 1000)
        d.Time = new Date()
        d.Time.setTime(newDateMilis + timePeriodMillis);
    });

    //x-axis scale
    xScale = d3.scaleTime()
        .domain(d3.extent(dataset, d => d.Time))
        .nice()
        .range([100, 1000]);

    //y-axis scale
    yScale = d3.scaleTime()
        .domain([new Date("2/29/2020"), new Date("2/1/2020")])
        .range([60, 460]);

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
        .attr('transform', 'translate(' + width / 2 + ', ' + (height - 30) + ')')
        .text('Time of Day (hrs:mins)');


    yAxisG.call(yAxis);

    //append y-axis label
    svg.append('text')
        .attr('class', 'x label')
        .attr('transform', 'translate(35, ' + height / 2 + ') rotate(-90)')
        .text('Date');

    //append title to graph
    svg.append('text')
        .attr('class', 'title label')
        .attr('transform', 'translate(' + width / 2 + ', ' + 40 + ')')
        .attr('text-anchor', 'middle')
        .text('Jeffrey\'s Music Listening Times (4/2018 - 2/2020)');


    // Create global object called chartScales to keep state
    yState = [new Date("2/29/2020"), new Date("2/1/2020")];

    filterRange(yState);
    //render all data points
    displayNumEntries();
    renderCircles();

    datasetMonth = dataset;
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
    let checkbox = document.getElementsByClassName("checkbox");
    let checkedDays = [];
    Array.from(checkbox).forEach(function (cb) {
        cb.addEventListener('change', function () {
            if (this.checked) {
                checkedDays.push(this.value);
            } else {
                checkedDays = checkedDays.filter(day => day !== this.value);
            }
            filterGraph("day", checkedDays);
        });
    });

    //change date range
    let selectList = document.getElementById("date-range");
    selectList.addEventListener("change", function () {
        let selectedValue = selectList.options[selectList.selectedIndex].value;
        changeDateRange(selectedValue);
    });

    //reset button
    let resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", function () {
        resetGraph();
    })
});