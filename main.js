function filterController(type, value) {
    clearHighlight()
    let displaySize = 1;
    let viewOpacity = .3;
    if (type === "song") {
        filterSong(value);
        displaySize = 5;
        viewOpacity = .50;
    } else if (type ==="artist") {
        filterArtist(value);
        displaySize = 2.5;
    } else if (type === "album") {
        filterAlbum(value);
        displaysize = 4;
    } else if (type === "day") {
        filterDay(value);
    }
    updateCircles(displaySize, viewOpacity);
}
function filterSong(song) {
    dataset = dataset.filter(d => d.SongTitle === song);

}

function filterArtist(artist) {
    dataset = completeDataset.filter(d => d.Artist === artist);
}
function filterAlbum(category) {
    dataset = completeDataset.filter(d => d.Album === category);
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
    dataset = completeDataset.filter(d => d.Date >= lowerRange && d.Date <= upperRange);
}

function resetGraph() {
    dataset = completeDataset;
    updateCircles();
}
function updateCircles(displaySize = 1, viewOpacity = .3) {
    //display length of fitlered list
    document.getElementById("entry-count").innerHTML = dataset.length;

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

function changeDateRange(range) {
    if (range === "All") {
        yState = [new Date("2/4/2020"), new Date("4/8/2018")];
    }
    else if (range === "2020") {
        yState = [new Date("12/31/2020"), new Date("1/1/2020")];
    } else if (range === "2019") {
        yState = [new Date("12/31/2019"), new Date("1/1/2019")];
    } else if (range === "2018") {
        yState = [new Date("12/31/2018"), new Date("1/1/2018")];
    }
    // Update chart
    updateYAxis();
    filterRange(yState);
    updateCircles();
}

//highlights the given circle element
function singleHighlight(dot) {
    dot.transition()
        .ease(d3.easePoly)
        .duration(2000)
        .attr('r', 15)
        .style('fill', 'red')
        .attr('class', 'point selected');
}

//removes the highlight of the selected circle
function clearHighlight() {
    svg.select('.selected')
        .attr('r', 1)
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

svg = d3.select('svg');

//append x-axis
var xAxisG = svg.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,660)')

//append y-axis
var yAxisG = svg.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(100,0)')

//default view, no filter
d3.csv('lastfm-data-utf-testing.csv').then(entireDataset => {
    //convert date string to data object
    let newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    let newDateMilis = newDate.getTime();

    completeDataset = entireDataset;
    dataset = entireDataset;

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
        .range([100, 500]);

    //y-axis scale
    yScale = d3.scaleTime()
        .domain([new Date("2/4/2020"), new Date("4/8/2018")])
        .range([60, 660]);

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
        .attr('transform', 'translate(250,720)')
        .text('Time of Day (hrs:mins)');


    yAxisG.call(yAxis);

    //append y-axis label
    svg.append('text')
        .attr('class', 'x label')
        .attr('transform', 'translate(35,400) rotate(-90)')
        .text('Date');

    //append title to graph
    svg.append('text')
        .attr('class', 'title label')
        .attr('transform', 'translate(60,40)')
        .text('Jeffrey\'s Music Listening Times (4/2018 - 2/2020)');


    // Create global object called chartScales to keep state
    yState = [new Date("2/4/2020"), new Date("4/8/2020")];

    //render all data points
    updateCircles();

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
});