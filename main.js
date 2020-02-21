function render(dataset, filter, category) {
    if (filter === "artist" && category !== "") {
        dataset = dataset.filter(d => d.Artist === category);
    }
    if (filter === "day") {
        let newDataset = [];
        category.forEach(function (day) {
            newDataset = newDataset.concat(dataset.filter(d => d.Day === day));
        });
        dataset = newDataset;
    }

    var point = svg.selectAll('.point')
        .data(dataset, d => d.ConvertedDateTime);

    var pointEnter = point.enter()
        .append('g')
        .attr('class', 'point')

    pointEnter.merge(point)
        .attr('transform', (d, i) => 'translate(' + [xScale(d.Time), yScale(new Date(d.Date))] + ')');

    //radius scale
    //TODO: radius scale

    //add circle to group
    pointEnter.append('circle')
        .attr('r', 1)
        .style('fill', 'white')
        .style('opacity', .3)
        .on("mouseover", function (d) {
            displaySongInfo(d);
        });

    //remove filtered out circles
    point.exit().remove();
}
function displaySongInfo(song) {
    let divArt = document.getElementsByClassName("art");
    let divArtist = document.getElementsByClassName("artist");
    let divSong = document.getElementsByClassName("song");
    let divDate = document.getElementsByClassName("date");

    let albumArt = "";
    
    let apiAlbum = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=6bfcf3fcf37f46a75d0297c4e6d09f72&artist=${song.Artist}&album=${song.Album}&format=json`
    fetch(apiAlbum)
        .then(response => {
            return response.json();
        })
        .then(data => {
            albumArt = data.album.image[2]["#text"];
            if (albumArt === "") {
                albumArt = "https://lastfm.freetls.fastly.net/i/u/174s/2a96cbd8b46e442fc41c2b86b821562f.png";
            }
            divArt[0].innerHTML = `<img src=${albumArt}>`;
            divArtist[0].innerHTML = song.Artist;
            divSong[0].innerHTML = song.SongTitle;
            divDate[0].innerHTML = song.Day + " " + song.ConvertedDateTime;
        })
}

//default view, no filter
d3.csv('lastfm-data-utf.csv').then(dataset => {
    //convert date string to data object
    let newDate = new Date();
    newDate.setHours(0, 0, 0, 0);
    let newDateMilis = newDate.getTime();

    dataset.forEach(d => {
        var parts = d.Time.split(/:/);
        var timePeriodMillis = (parseInt(parts[0], 10) * 60 * 60 * 1000) +
            (parseInt(parts[1], 10) * 60 * 1000)
        d.Time = new Date()
        d.Time.setTime(newDateMilis + timePeriodMillis);
    });

    svg = d3.select('svg');

    //x-axis scale
    xScale = d3.scaleTime()
        .domain(d3.extent(dataset, d => d.Time))
        .nice()
        .range([100, 500]);

    //y-axis scale
    yScale = d3.scaleTime()
        .domain([Date.now(), new Date("4/1/2018")])
        .range([60, 660]);

    //x-axis line
    var xAxis = d3.axisBottom(xScale)
        .ticks(d3.timeHour.every(2))
        .tickFormat(d3.timeFormat('%H:%M'));

    //y-axis line
    var yAxis = d3.axisLeft(yScale)
        .ticks(d3.timeMonth.every(1))
        .tickFormat(d3.timeFormat('%b \'%y'));

    //append x-axis
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,660)')
        .call(xAxis);

    //append x-axis label
    svg.append('text')
        .attr('class', 'x label')
        .attr('transform', 'translate(250,720)')
        .text('Time of Day (hrs:mins)');

    //append y-axis
    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(100,0)')
        .call(yAxis);

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


    //render all data points
    render(dataset, "", "");

    //yorushika filter
    let yorushikaButton = document.getElementById("yorushika");
    yorushikaButton.addEventListener("click", function () {
        render(dataset, "artist", "Yorushika");
    });

    //general filter event listener
    let filterButton = document.getElementById("artist-filter-button");
    filterButton.addEventListener("click", function () {
        let artist = document.getElementById("artist-input").value;
        render(dataset, "artist", artist);
    });

    //multiple day filter event listener
    let checkbox = document.getElementsByClassName("checkbox");
    let checkedDays = [];
    console.log(checkbox);
    Array.from(checkbox).forEach(function (cb) {
        cb.addEventListener('change', function () {
            if (this.checked) {
                checkedDays.push(this.value);
            } else {
                checkedDays = checkedDays.filter(day => day !== this.value);
            }
            console.log(checkedDays);
            render(dataset, "day", checkedDays);
        });
    })

    //dot hover event listener

});